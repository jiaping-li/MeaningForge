import type { ReaderSession, WorkPackage } from "@/types/workPackage";

export interface PreparationDraft {
  mode: "preparation_draft";
  source_text: string;
  work_package: WorkPackage;
  deterministic_segmentation: { paragraph_count: number; source_length: number };
  llm_note: string;
  publication_status: "draft_only";
  next_step: string;
}
export interface KnowledgeCardResponse {
  success: boolean;
  data: { word: string; objectiveBackground?: string; historicalContext?: string; source?: string; relatedEntities: string[]; status: "available" | "filtered" | "unavailable"; fallbackMessage?: string; safetyNotice?: string; requestId?: string; model?: string; promptVersion?: string; contextWindow?: number; inputTokens?: number; outputTokens?: number; latencyMs?: number; sourceStatus?: "model_unverified" | "not_provided" };
}

const sessionKey = (packageId: string, scope = "reader") => `meaningforge-reader-session:${scope}:${packageId}`;
const apiEndpoints = (pathname: string) => [pathname, `http://127.0.0.1:8787${pathname}`];
const registrationTokens = new Map<string, Promise<string>>();
const pendingSessions = new Map<string, ReaderSession>();
const syncTimers = new Map<string, number>();
const syncChains = new Map<string, Promise<void>>();

const formalStudy = (session: ReaderSession) => Boolean(session.study_context && /^P\d{2,4}$/.test(session.study_context.participant_id));
const registrationKey = (session: ReaderSession) => `${session.study_context?.protocol_version}:${session.study_context?.participant_id}:${session.study_context?.session_id}:${session.package_id}`;
function studyStatus(status: "syncing" | "synced" | "error", detail?: string) {
  window.dispatchEvent(new CustomEvent("meaningforge-study-sync", { detail: { status, detail, at: new Date().toISOString() } }));
}

async function postApi<T>(pathname: string, body: unknown, timeoutMs = 65_000): Promise<T> {
  let lastError: unknown;
  for (const endpoint of apiEndpoints(pathname)) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const payload = await response.json().catch(() => ({})) as T & { error?: string };
      if (response.ok) return payload;
      if (response.status !== 404) throw new Error(payload.error || `服务返回 ${response.status}。`);
      lastError = new Error(payload.error || "服务入口不存在。");
    } catch (error) {
      lastError = error;
      if (error instanceof Error && !(error instanceof DOMException) && !/fetch|network|入口不存在/i.test(error.message)) throw error;
    } finally { window.clearTimeout(timeout); }
  }
  if (lastError instanceof DOMException && lastError.name === "AbortError") throw new Error("本地服务响应超时。");
  throw lastError instanceof Error ? lastError : new Error("无法连接本地服务。");
}

async function ensureStudyRegistration(session: ReaderSession) {
  if (!formalStudy(session) || !session.study_context) return "";
  const key = registrationKey(session);
  const existing = registrationTokens.get(key);
  if (existing) return existing;
  const request = postApi<{ registration_token: string }>("/api/study/sessions/register", { package_id: session.package_id, study_context: session.study_context }).then((response) => response.registration_token).catch((error) => { registrationTokens.delete(key); throw error; });
  registrationTokens.set(key, request);
  return request;
}

async function syncStudySession(session: ReaderSession, final = false) {
  if (!formalStudy(session) || !session.study_context) return;
  studyStatus("syncing");
  try {
    const registrationToken = await ensureStudyRegistration(session);
    await postApi("/api/study/sessions/sync", { package_id: session.package_id, study_context: session.study_context, registration_token: registrationToken, events: session.events, snapshot: session, final });
    studyStatus("synced");
  } catch (error) {
    studyStatus("error", error instanceof Error ? error.message : "实验数据同步失败。");
    throw error;
  }
}

function enqueueStudySync(session: ReaderSession, final = false) {
  const key = registrationKey(session);
  const chain = (syncChains.get(key) ?? Promise.resolve()).catch(() => undefined).then(() => syncStudySession(session, final));
  syncChains.set(key, chain);
  return chain;
}

async function flushStudySync(session: ReaderSession, final = false) {
  if (!formalStudy(session)) return;
  const key = registrationKey(session);
  const timer = syncTimers.get(key); if (timer) window.clearTimeout(timer);
  syncTimers.delete(key); pendingSessions.set(key, session);
  await enqueueStudySync(session, final);
}

function queueStudySync(session: ReaderSession) {
  if (!formalStudy(session)) return;
  const key = registrationKey(session);
  pendingSessions.set(key, session);
  const prior = syncTimers.get(key); if (prior) window.clearTimeout(prior);
  syncTimers.set(key, window.setTimeout(() => {
    syncTimers.delete(key);
    const snapshot = pendingSessions.get(key); if (!snapshot) return;
    void enqueueStudySync(snapshot).catch(() => undefined);
  }, 800));
}

export const preparedWorks = [
  { packageUrl: "/data/medicine-v3-reference.json", title: "药", author: "鲁迅", kind: "短篇小说 · v3 参考包", accent: "coral" },
  { packageUrl: "/data/aq-substrate-v2-development.json", title: "阿Q正传", author: "鲁迅", kind: "中篇小说", accent: "blue" },
] as const;

// These works have source text bundled with the demo but do not yet have a
// frozen study WorkPackage. Selecting one creates a clearly labelled draft
// through the same construction route used for text import.
export const sourceWorks = [
  { bookUrl: "/books/luxun-medicine-zh.txt", title: "药", author: "鲁迅", kind: "短篇小说 · 从原文重建" },
  { bookUrl: "/books/luxun-hometown-zh.txt", title: "故乡", author: "鲁迅", kind: "短篇小说" },
  { bookUrl: "/books/luxun-blessing-zh.txt", title: "祝福", author: "鲁迅", kind: "短篇小说" },
  { bookUrl: "/books/journey-to-the-west-zh.txt", title: "西游记", author: "吴承恩", kind: "长篇小说·节选" },
  { bookUrl: "/books/dream-of-the-red-chamber-zh.txt", title: "红楼梦", author: "曹雪芹", kind: "长篇小说·节选" },
  { bookUrl: "/books/hamlet.txt", title: "Hamlet", author: "William Shakespeare", kind: "Drama" },
  { bookUrl: "/books/pride-and-prejudice.txt", title: "Pride and Prejudice", author: "Jane Austen", kind: "Novel" },
  { bookUrl: "/books/the-great-gatsby.txt", title: "The Great Gatsby", author: "F. Scott Fitzgerald", kind: "Novel" },
] as const;

export async function loadDevelopmentPackage(packageUrl: string = preparedWorks[0].packageUrl): Promise<WorkPackage> {
  const response = await fetch(packageUrl);
  if (!response.ok) throw new Error("无法读取冻结的阅读数据包。");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || (data as { schema_version?: string }).schema_version !== "meaningforge-1.0") {
    throw new Error("WorkPackage 格式不正确。");
  }
  return data as WorkPackage;
}

export function loadSession(packageId: string, fallback: ReaderSession, scope = "reader"): ReaderSession {
  try {
    const raw = localStorage.getItem(sessionKey(packageId, scope));
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as ReaderSession;
    if (stored.package_id !== packageId) return fallback;
    // Accept the early development-session shape while keeping newly saved data aligned with Data Model v2.
    const legacyRelations = Array.isArray(stored.reader_relations) ? stored.reader_relations.map((relation) => {
      const item = relation as unknown as Record<string, unknown>;
      return {
        id: String(item.id),
        session_id: typeof item.session_id === "string" ? item.session_id : packageId,
        source_id: String(item.source_id ?? item.source ?? ""),
        target_id: String(item.target_id ?? item.target ?? ""),
        label: String(item.label ?? item.relation_text ?? ""),
        evidence_ids: Array.isArray(item.evidence_ids) ? item.evidence_ids.filter((id): id is string => typeof id === "string") : [],
        rationale: typeof item.rationale === "string" ? item.rationale : typeof item.qualification === "string" ? item.qualification : undefined,
        relation_type: typeof item.relation_type === "string" ? item.relation_type : "reader_connection",
        explanation: typeof item.explanation === "string" ? item.explanation : undefined,
        confidence: item.confidence === "developing" || item.confidence === "confident" ? item.confidence : "tentative" as const,
        uncertainty: typeof item.uncertainty === "string" ? item.uncertainty : undefined,
        created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
        provenance: "reader-authored" as const,
        history: Array.isArray(item.history) ? item.history as Array<{ at: string; action: "create" | "revise"; label: string; relation_type?: string; explanation?: string; confidence?: "tentative" | "developing" | "confident" }> : [],
      };
    }) as ReaderSession["reader_relations"] : [];
    const legacyNodes = Array.isArray(stored.reader_nodes) ? stored.reader_nodes.map((node) => {
      const item = node as unknown as Record<string, unknown>;
      return {
        id: String(item.id ?? `legacy-node-${Date.now()}`),
        session_id: typeof item.session_id === "string" ? item.session_id : packageId,
        label: String(item.label ?? "未命名线索"),
        type: typeof item.type === "string" ? item.type : "reader_candidate",
        evidence_id: typeof item.evidence_id === "string" ? item.evidence_id : undefined,
        evidence_ids: Array.isArray(item.evidence_ids) ? item.evidence_ids.filter((id): id is string => typeof id === "string") : typeof item.evidence_id === "string" ? [item.evidence_id] : [],
        rationale: typeof item.rationale === "string" ? item.rationale : undefined,
        based_on_node_id: typeof item.based_on_node_id === "string" ? item.based_on_node_id : undefined,
        source_text_span_id: typeof item.source_text_span_id === "string" ? item.source_text_span_id : undefined,
        source_start_char: typeof item.source_start_char === "number" ? item.source_start_char : undefined,
        source_end_char: typeof item.source_end_char === "number" ? item.source_end_char : undefined,
        source_quote: typeof item.source_quote === "string" ? item.source_quote : undefined,
        source_candidate_id: typeof item.source_candidate_id === "string" ? item.source_candidate_id : undefined,
        interpretation_type: typeof item.interpretation_type === "string" ? item.interpretation_type : typeof item.type === "string" ? item.type : "reader_candidate",
        note: typeof item.note === "string" ? item.note : typeof item.rationale === "string" ? item.rationale : undefined,
        created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
        provenance: "reader-authored" as const,
        history: Array.isArray(item.history) ? item.history as Array<{ at: string; action: "create" | "revise"; label: string; type: string; note?: string }> : [],
      };
    }) as ReaderSession["reader_nodes"] : [];
    const referenceReviews = stored.reference_reviews && typeof stored.reference_reviews === "object" ? stored.reference_reviews : {};
    const candidateDecisions = stored.candidate_decisions && typeof stored.candidate_decisions === "object" ? stored.candidate_decisions : {};
    const counterevidence = Array.isArray(stored.counterevidence) ? stored.counterevidence : [];
    const readerEvidenceReferences = Array.isArray(stored.reader_evidence_references) ? stored.reader_evidence_references : [];
    const readerClaims = Array.isArray(stored.reader_claims) ? stored.reader_claims.map((claim) => ({ ...claim, confidence: claim.confidence === "developing" || claim.confidence === "confident" ? claim.confidence : "tentative" as const, history: Array.isArray(claim.history) ? claim.history.map((entry) => ({ ...entry, trigger: entry.trigger === "new_evidence" || entry.trigger === "reconsidered_evidence" || entry.trigger === "new_relation" || entry.trigger === "contradictory_evidence" || entry.trigger === "context_change" || entry.trigger === "reader_uncertainty" ? entry.trigger : "initial" as const })) : [] })) : stored.claim ? [{ id: "reader-claim-current", session_id: packageId, text: stored.claim, evidence_ids: stored.selected_evidence_ids ?? [], node_ids: legacyNodes.map((node) => node.id), relation_ids: legacyRelations.map((relation) => relation.id), confidence: "tentative" as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), provenance: "reader-authored" as const, history: [] }] : [];
    const events = Array.isArray(stored.events) ? stored.events.map((entry, index) => ({ ...entry, event_id: typeof entry.event_id === "string" ? entry.event_id : `legacy-event-${index + 1}`, sequence: index + 1 })) : [];
    return { ...fallback, ...stored, events, read_chapter_ids: Array.isArray(stored.read_chapter_ids) ? stored.read_chapter_ids : [], read_span_ids: Array.isArray(stored.read_span_ids) ? stored.read_span_ids : [], exposed_candidate_ids: Array.isArray(stored.exposed_candidate_ids) ? stored.exposed_candidate_ids : [], baseline_notes: stored.baseline_notes ?? "", knowledge_cards: Array.isArray(stored.knowledge_cards) ? stored.knowledge_cards : [], reference_reviews: referenceReviews, candidate_decisions: candidateDecisions, counterevidence, reader_evidence_references: readerEvidenceReferences, reader_claims: readerClaims, reader_nodes: legacyNodes, reader_relations: legacyRelations, interpretation_dimensions: Array.isArray(stored.interpretation_dimensions) ? stored.interpretation_dimensions : [], interpretation_ratings: stored.interpretation_ratings && typeof stored.interpretation_ratings === "object" ? stored.interpretation_ratings : {}, personal_event_order: Array.isArray(stored.personal_event_order) ? stored.personal_event_order : [] };
  } catch { return fallback; }
}

export function saveSession(session: ReaderSession, scope = "reader") {
  localStorage.setItem(sessionKey(session.package_id, scope), JSON.stringify(session));
  queueStudySync(session);
}

export async function downloadSession(session: ReaderSession) {
  try { await flushStudySync(session, true); } catch { /* Keep the local export available as a recovery copy. */ }
  const claim = session.reader_claims.find((item) => item.id === "reader-claim-current");
  const claimLength = Math.max(1, claim?.text.trim().length ?? session.claim.trim().length);
  const exposed = new Set(session.exposed_candidate_ids);
  const accepted = Object.values(session.candidate_decisions).filter((decision) => decision.action === "accept").length;
  const revisionActions = session.events.filter((entry) => /revise|delete|modify|reconnect|undo|redo/.test(entry.action)).length;
  const payload = { ...session, derived_metrics: { evidence_anchor_density_per_100_chars: Number((((claim?.evidence_ids.length ?? 0) / claimLength) * 100).toFixed(3)), relation_density_per_1000_chars: Number(((session.reader_relations.length / claimLength) * 1000).toFixed(3)), ghost_exposed_count: exposed.size, ghost_accepted_count: accepted, ghost_acceptance_rate: exposed.size ? Number((accepted / exposed.size).toFixed(3)) : null, knowledge_query_count: session.events.filter((entry) => entry.action === "llm_knowledge_request").length, revision_action_count: revisionActions, exact_text_selection_count: session.reader_nodes.filter((node) => typeof node.source_start_char === "number" && typeof node.source_end_char === "number").length } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const suffix = session.study_context ? `${session.study_context.participant_id}-${session.study_context.condition}` : "reader";
  link.download = `${session.package_id}-${suffix}-session.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function requestKnowledgeCard(input: { word: string; textSpanId: string; contextBefore: string; contextAfter: string; userReadSpans: string[]; sessionId: string; session: ReaderSession }): Promise<KnowledgeCardResponse> {
  const formal = formalStudy(input.session);
  if (formal) await flushStudySync(input.session);
  const registrationToken = formal ? await ensureStudyRegistration(input.session) : undefined;
  return postApi<KnowledgeCardResponse>("/api/llm/knowledge", { word: input.word, textSpanId: input.textSpanId, contextBefore: input.contextBefore, contextAfter: input.contextAfter, userReadSpans: input.userReadSpans, sessionId: input.sessionId, ...(formal ? { package_id: input.session.package_id, study_context: input.session.study_context, registration_token: registrationToken } : {}) });
}

export async function prepareTextDraft(title: string, text: string, options: { useLlm?: boolean } = {}): Promise<PreparationDraft> {
  const body = JSON.stringify({ title, text, use_llm: options.useLlm === true });
  const endpoints = ["/api/prepare-work-package", "http://127.0.0.1:8787/api/prepare-work-package"];
  let lastError: unknown;
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    // Full-text MIP review makes several bounded local-model calls. It is a
    // deliberate researcher action and can take minutes, unlike the normal
    // deterministic draft; do not mislabel it as a disconnected service.
    const timeout = window.setTimeout(() => controller.abort(), options.useLlm ? 360_000 : 35_000);
    try {
      let response: Response;
      try {
        response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body, signal: controller.signal });
      } catch (error) {
        // Only connectivity failures may use the direct API fallback. A
        // server-side validation error is useful feedback and must not be
        // disguised as a later timeout from the second attempt.
        lastError = error;
        continue;
      }
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "无法生成准备草稿。");
      return payload as PreparationDraft;
    } catch (error) { throw error; }
    finally { window.clearTimeout(timeout); }
  }
  if (lastError instanceof DOMException && lastError.name === "AbortError") throw new Error("草稿构建服务未响应。请确认 npm run dev:api 正在运行，并访问 http://127.0.0.1:8787/api/health 检查它。");
  throw lastError instanceof Error ? lastError : new Error("无法连接草稿构建服务。");
}
