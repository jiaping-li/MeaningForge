import type { ReaderSession, WorkPackage } from "@/types/workPackage";

export interface RelationReview {
  mode: "reader_reviewer";
  relation_text: string;
  evidence_ids: string[];
  review: { direct_support?: string[]; evidence_gaps?: string[]; complications?: string[]; suggested_questions?: string[] };
  disclaimer: string;
}
export interface PreparationDraft {
  mode: "preparation_draft";
  source_text: string;
  work_package: WorkPackage;
  deterministic_segmentation: { paragraph_count: number; source_length: number };
  llm_note: string;
  publication_status: "draft_only";
  next_step: string;
}

const sessionKey = (packageId: string) => `meaningforge-reader-session:${packageId}`;

export const preparedWorks = [
  { packageUrl: "/data/medicine-substrate-v2-development.json", title: "药", author: "鲁迅", kind: "短篇小说", accent: "coral" },
  { packageUrl: "/data/aq-substrate-v2-development.json", title: "阿Q正传", author: "鲁迅", kind: "中篇小说", accent: "blue" },
] as const;

// These works have source text bundled with the demo but do not yet have a
// frozen study WorkPackage. Selecting one creates a clearly labelled draft
// through the same construction route used for text import.
export const sourceWorks = [
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

export function loadSession(packageId: string, fallback: ReaderSession): ReaderSession {
  try {
    const raw = localStorage.getItem(sessionKey(packageId));
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as ReaderSession;
    if (stored.package_id !== packageId) return fallback;
    // Accept the early development-session shape while keeping newly saved data aligned with Data Model v2.
    const legacyRelations = Array.isArray(stored.reader_relations) ? stored.reader_relations.map((relation) => {
      const item = relation as unknown as Record<string, unknown>;
      return {
        id: String(item.id),
        source_id: String(item.source_id ?? item.source ?? ""),
        target_id: String(item.target_id ?? item.target ?? ""),
        label: String(item.label ?? item.relation_text ?? ""),
        evidence_ids: Array.isArray(item.evidence_ids) ? item.evidence_ids.filter((id): id is string => typeof id === "string") : [],
        rationale: typeof item.rationale === "string" ? item.rationale : typeof item.qualification === "string" ? item.qualification : undefined,
      };
    }) : [];
    const legacyNodes = Array.isArray(stored.reader_nodes) ? stored.reader_nodes.map((node) => {
      const item = node as unknown as Record<string, unknown>;
      return {
        id: String(item.id ?? `legacy-node-${Date.now()}`),
        label: String(item.label ?? "未命名线索"),
        type: typeof item.type === "string" ? item.type : "reader_candidate",
        evidence_id: typeof item.evidence_id === "string" ? item.evidence_id : undefined,
        rationale: typeof item.rationale === "string" ? item.rationale : undefined,
        based_on_node_id: typeof item.based_on_node_id === "string" ? item.based_on_node_id : undefined,
      };
    }) : [];
    return { ...fallback, ...stored, reader_nodes: legacyNodes, reader_relations: legacyRelations };
  } catch { return fallback; }
}

export function saveSession(session: ReaderSession) {
  localStorage.setItem(sessionKey(session.package_id), JSON.stringify(session));
}

export function downloadSession(session: ReaderSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${session.package_id}-reader-session.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function reviewReaderRelation(relationText: string, evidence: Array<{ id: string; text: string; note: string }>): Promise<RelationReview> {
  const response = await fetch("/api/review-reader-relation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ relation_text: relationText, evidence }) });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "无法取得 LLM 核查建议。");
  return payload as RelationReview;
}

export async function prepareTextDraft(title: string, text: string): Promise<PreparationDraft> {
  const body = JSON.stringify({ title, text });
  const endpoints = ["/api/prepare-work-package", "http://127.0.0.1:8787/api/prepare-work-package"];
  let lastError: unknown;
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
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
