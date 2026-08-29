import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

type StudyCondition = "meaningforge" | "baseline";
type StudyContext = {
  protocol_version: string;
  participant_id: string;
  condition: StudyCondition;
  session_id: string;
  round_id: string;
  material_id: string;
  started_at: string;
};
type StudyEvent = {
  event_id: string;
  sequence: number;
  at: string;
  action: string;
  target_id?: string;
  target_type?: string;
  payload?: Record<string, unknown>;
  previous_state?: string;
  next_state?: string;
};
type StudyManifest = StudyContext & {
  package_id: string;
  registration_token: string;
  registered_at: string;
  status: "active" | "complete";
  completed_at?: string;
  last_sync_at?: string;
  last_sequence: number;
  snapshot_hash?: string;
};

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = path.resolve(moduleDir, process.env.MF_STUDY_DATA_DIR || "../study-data");
const packageRoot = path.resolve(moduleDir, "../public/data");
const packageCache = new Map<string, Record<string, unknown>>();
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function iso(value: unknown) { return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined; }
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function ensureDirectory(directory: string) { fs.mkdirSync(directory, { recursive: true }); }
function atomicJson(filename: string, value: unknown) {
  ensureDirectory(path.dirname(filename));
  const temporary = `${filename}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filename);
}
function appendJsonl(filename: string, value: unknown) {
  ensureDirectory(path.dirname(filename));
  fs.appendFileSync(filename, `${JSON.stringify(value)}\n`, "utf8");
}
function requireIdentifier(value: unknown, label: string) {
  if (typeof value !== "string" || !identifierPattern.test(value)) throw new Error(`${label}格式不正确。`);
  return value;
}
function parseContext(value: unknown): StudyContext {
  if (!object(value)) throw new Error("缺少实验上下文。");
  const participant_id = requireIdentifier(value.participant_id, "参与者编号");
  if (!/^P\d{2,4}$/.test(participant_id)) throw new Error("正式实验参与者编号必须使用P01、P02等匿名编号。");
  const condition = value.condition;
  if (condition !== "meaningforge" && condition !== "baseline") throw new Error("实验条件必须是meaningforge或baseline。");
  const started_at = iso(value.started_at);
  if (!started_at) throw new Error("实验开始时间不是有效ISO时间。");
  return {
    protocol_version: requireIdentifier(value.protocol_version, "实验协议版本"),
    participant_id,
    condition,
    session_id: requireIdentifier(value.session_id, "会话编号"),
    round_id: requireIdentifier(value.round_id, "轮次编号"),
    material_id: requireIdentifier(value.material_id, "材料编号"),
    started_at,
  };
}
function sessionDirectory(context: StudyContext) {
  return path.join(dataRoot, context.protocol_version, context.participant_id, context.session_id);
}
function manifestFile(context: StudyContext) { return path.join(sessionDirectory(context), "manifest.json"); }
function sameRegistration(manifest: StudyManifest, context: StudyContext, packageId: string) {
  return manifest.protocol_version === context.protocol_version && manifest.participant_id === context.participant_id && manifest.condition === context.condition && manifest.session_id === context.session_id && manifest.round_id === context.round_id && manifest.material_id === context.material_id && manifest.package_id === packageId;
}
function loadManifest(context: StudyContext): StudyManifest | undefined {
  const filename = manifestFile(context);
  return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) as StudyManifest : undefined;
}

export function registerStudySession(input: Record<string, unknown>) {
  const context = parseContext(input.study_context);
  const packageId = requireIdentifier(input.package_id, "数据包编号");
  if (context.material_id !== packageId) throw new Error("实验材料编号必须与冻结数据包编号一致。");
  const pkg = loadPackage(packageId);
  if (pkg.package_status !== "reference_ready") throw new Error("正式实验只能注册通过冻结校验的reference_ready材料。");
  const sourceDocument = object(pkg.source_document) ? pkg.source_document : undefined;
  if (!sourceDocument || typeof sourceDocument.text !== "string" || !/^sha256:[a-f0-9]{64}$/.test(String(sourceDocument.checksum ?? ""))) throw new Error("正式实验材料缺少全文或源文校验和。");
  const filename = manifestFile(context);
  const existing = loadManifest(context);
  if (existing) {
    if (!sameRegistration(existing, context, packageId)) throw new Error("该参与者与会话编号已被另一实验条件、轮次或材料占用。");
    return { registered: true, resumed: true, registration_token: existing.registration_token, manifest: publicManifest(existing) };
  }
  const participantRoot = path.join(dataRoot, context.protocol_version, context.participant_id);
  if (fs.existsSync(participantRoot)) {
    for (const sessionName of fs.readdirSync(participantRoot)) {
      const otherFile = path.join(participantRoot, sessionName, "manifest.json");
      if (!fs.existsSync(otherFile)) continue;
      const other = JSON.parse(fs.readFileSync(otherFile, "utf8")) as StudyManifest;
      if (other.round_id === context.round_id && other.session_id !== context.session_id) throw new Error("该参与者的轮次编号已被另一会话使用。");
    }
  }
  const manifest: StudyManifest = { ...context, package_id: packageId, registration_token: randomUUID(), registered_at: new Date().toISOString(), status: "active", last_sequence: 0 };
  atomicJson(filename, manifest);
  appendJsonl(path.join(sessionDirectory(context), "server-audit.jsonl"), { at: manifest.registered_at, action: "session_registered", manifest: publicManifest(manifest) });
  return { registered: true, resumed: false, registration_token: manifest.registration_token, manifest: publicManifest(manifest) };
}

function publicManifest(manifest: StudyManifest) {
  const { registration_token: _token, ...publicFields } = manifest;
  return publicFields;
}

function loadPackage(packageId: string) {
  if (packageCache.has(packageId)) return packageCache.get(packageId)!;
  for (const filename of fs.readdirSync(packageRoot).filter((item) => item.endsWith(".json"))) {
    const data = JSON.parse(fs.readFileSync(path.join(packageRoot, filename), "utf8")) as Record<string, unknown>;
    if (data.package_id === packageId) { packageCache.set(packageId, data); return data; }
  }
  throw new Error(`未找到实验数据包${packageId}，拒绝接收无法校验的会话。`);
}

function normalizeEvents(value: unknown): StudyEvent[] {
  if (!Array.isArray(value)) throw new Error("事件日志必须是数组。");
  const events = value.map((item, index) => {
    if (!object(item)) throw new Error(`第${index + 1}条事件格式不正确。`);
    const sequence = Number(item.sequence);
    if (!Number.isInteger(sequence) || sequence < 1) throw new Error(`第${index + 1}条事件缺少有效序号。`);
    const event_id = requireIdentifier(item.event_id, `第${index + 1}条事件ID`);
    const at = iso(item.at); if (!at) throw new Error(`第${index + 1}条事件时间无效。`);
    if (typeof item.action !== "string" || !item.action.trim() || item.action.length > 100) throw new Error(`第${index + 1}条事件动作无效。`);
    return { event_id, sequence, at, action: item.action, ...(typeof item.target_id === "string" ? { target_id: item.target_id } : {}), ...(typeof item.target_type === "string" ? { target_type: item.target_type } : {}), ...(object(item.payload) ? { payload: item.payload } : {}), ...(typeof item.previous_state === "string" ? { previous_state: item.previous_state } : {}), ...(typeof item.next_state === "string" ? { next_state: item.next_state } : {}) };
  }).sort((a, b) => a.sequence - b.sequence);
  const ids = new Set<string>();
  events.forEach((event, index) => {
    if (event.sequence !== index + 1) throw new Error(`事件序号必须从1连续递增；当前位置为${event.sequence}。`);
    if (ids.has(event.event_id)) throw new Error(`重复事件ID：${event.event_id}`);
    ids.add(event.event_id);
  });
  return events;
}

function packageIndex(pkg: Record<string, unknown>) {
  const spans = new Map<string, Record<string, unknown>>((Array.isArray(pkg.text_spans) ? pkg.text_spans : []).filter(object).map((item) => [String(item.id), item]));
  const evidence = new Map<string, Record<string, unknown>>((Array.isArray(pkg.evidence) ? pkg.evidence : []).filter(object).map((item) => [String(item.id), item]));
  const candidates = new Map<string, Record<string, unknown>>((Array.isArray(pkg.chapter_scaffolds) ? pkg.chapter_scaffolds : []).filter(object).flatMap((scaffold) => (Array.isArray(scaffold.candidate_explorations) ? scaffold.candidate_explorations : []).filter(object)).map((item) => [String(item.id), item]));
  return { spans, evidence, candidates };
}

function validateSnapshot(snapshot: Record<string, unknown>, context: StudyContext, packageId: string, events: StudyEvent[]) {
  const errors: string[] = []; const warnings: string[] = [];
  if (snapshot.package_id !== packageId) errors.push("快照数据包编号与会话注册不一致。");
  if (!object(snapshot.study_context)) errors.push("快照缺少实验上下文。");
  else for (const key of ["protocol_version", "participant_id", "condition", "session_id", "round_id", "material_id"] as const) if (snapshot.study_context[key] !== context[key]) errors.push(`快照实验上下文字段${key}不一致。`);
  const pkg = loadPackage(packageId); const index = packageIndex(pkg);
  const readSpanIds = strings(snapshot.read_span_ids); const readSpans = new Set(readSpanIds);
  readSpanIds.forEach((id) => { if (!index.spans.has(id)) errors.push(`未知已读TextSpan：${id}`); });
  const knownEvidence = (ids: string[], label: string) => ids.forEach((id) => { if (!index.evidence.has(id)) errors.push(`${label}引用未知证据：${id}`); });
  strings(snapshot.exposed_candidate_ids).forEach((id) => { if (!index.candidates.has(id)) errors.push(`未知幽灵候选：${id}`); });
  if (object(snapshot.candidate_decisions)) Object.keys(snapshot.candidate_decisions).forEach((id) => { if (!index.candidates.has(id)) errors.push(`候选决策引用未知候选：${id}`); });
  const nodes = Array.isArray(snapshot.reader_nodes) ? snapshot.reader_nodes.filter(object) : [];
  nodes.forEach((node) => {
    knownEvidence(strings(node.evidence_ids), `读者节点${String(node.id)}`);
    if (typeof node.source_text_span_id !== "string") return;
    const span = index.spans.get(node.source_text_span_id);
    if (!span) { errors.push(`读者节点${String(node.id)}引用未知TextSpan。`); return; }
    if (!readSpans.has(node.source_text_span_id)) errors.push(`读者节点${String(node.id)}锚定到未读TextSpan。`);
    if (typeof node.source_start_char === "number" && typeof node.source_end_char === "number" && typeof node.source_quote === "string" && typeof span.text === "string") {
      if (span.text.slice(node.source_start_char, node.source_end_char) !== node.source_quote) errors.push(`读者节点${String(node.id)}的精确选区与原文不一致。`);
    }
  });
  const relations = Array.isArray(snapshot.reader_relations) ? snapshot.reader_relations.filter(object) : [];
  relations.forEach((relation) => knownEvidence(strings(relation.evidence_ids), `读者关系${String(relation.id)}`));
  const claims = Array.isArray(snapshot.reader_claims) ? snapshot.reader_claims.filter(object) : [];
  claims.forEach((claim) => knownEvidence(strings(claim.evidence_ids), `读者理解${String(claim.id)}`));
  const cards = Array.isArray(snapshot.knowledge_cards) ? snapshot.knowledge_cards.filter(object) : [];
  cards.forEach((card) => { if (typeof card.text_span_id !== "string" || !readSpans.has(card.text_span_id)) errors.push(`背景知识卡${String(card.id)}不在已读范围。`); });
  const baselineReferences = Array.isArray(snapshot.baseline_evidence_references) ? snapshot.baseline_evidence_references.filter(object) : [];
  baselineReferences.forEach((reference) => {
    const evidenceId = typeof reference.evidence_id === "string" ? reference.evidence_id : "";
    const spanId = typeof reference.text_span_id === "string" ? reference.text_span_id : "";
    knownEvidence(evidenceId ? [evidenceId] : [], `基线引文${String(reference.id)}`);
    const span = index.spans.get(spanId);
    if (!span || !readSpans.has(spanId)) { errors.push(`基线引文${String(reference.id)}不在已读TextSpan。`); return; }
    if (typeof reference.start_char !== "number" || typeof reference.end_char !== "number" || typeof reference.quote !== "string" || typeof span.text !== "string" || span.text.slice(reference.start_char, reference.end_char) !== reference.quote) errors.push(`基线引文${String(reference.id)}的精确选区与原文不一致。`);
  });
  knownEvidence(strings(snapshot.final_response_evidence_ids), "最终作答");

  const chronologicalRead = new Set<string>(); const exposed = new Set<string>();
  events.forEach((studyEvent) => {
    if (["text_span_exposed", "text_span_first_exposure", "text_span_revisit"].includes(studyEvent.action) && studyEvent.target_id) {
      if (!index.spans.has(studyEvent.target_id)) errors.push(`事件${studyEvent.event_id}引用未知TextSpan。`);
      chronologicalRead.add(studyEvent.target_id);
    }
    if (studyEvent.action === "text_span_view_exit" && studyEvent.target_id && !index.spans.has(studyEvent.target_id)) errors.push(`事件${studyEvent.event_id}离开未知TextSpan。`);
    if (studyEvent.action === "ghost_exposed" && studyEvent.target_id) {
      const candidate = index.candidates.get(studyEvent.target_id);
      if (!candidate) errors.push(`事件${studyEvent.event_id}曝光未知幽灵。`);
      else {
        const spanIds = strings(candidate.evidence_ids).flatMap((evidenceId) => strings(index.evidence.get(evidenceId)?.span_ids));
        if (spanIds.some((id) => !chronologicalRead.has(id))) errors.push(`事件${studyEvent.event_id}在对应TextSpan进入阅读地平线前曝光幽灵。`);
      }
      exposed.add(studyEvent.target_id);
    }
    if (/^ghost_(accept|reject)$/.test(studyEvent.action) && studyEvent.target_id && !exposed.has(studyEvent.target_id)) warnings.push(`候选${studyEvent.target_id}在事件日志中缺少先前曝光记录。`);
  });
  if (events.length !== (Array.isArray(snapshot.events) ? snapshot.events.length : 0)) errors.push("快照事件数与同步事件数组不一致。");
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function metrics(snapshot: Record<string, unknown>, events: StudyEvent[]) {
  const nodes = Array.isArray(snapshot.reader_nodes) ? snapshot.reader_nodes.filter(object) : [];
  const relations = Array.isArray(snapshot.reader_relations) ? snapshot.reader_relations.filter(object) : [];
  const claims = Array.isArray(snapshot.reader_claims) ? snapshot.reader_claims.filter(object) : [];
  const cards = Array.isArray(snapshot.knowledge_cards) ? snapshot.knowledge_cards.filter(object) : [];
  const decisions = object(snapshot.candidate_decisions) ? Object.values(snapshot.candidate_decisions).filter(object) : [];
  const accepted = decisions.filter((item) => item.action === "accept").length;
  const exposed = new Set(strings(snapshot.exposed_candidate_ids));
  const finalTextCharacterCount = typeof snapshot.final_response === "string" ? snapshot.final_response.trim().length : 0;
  const claimEvidenceLinkCount = new Set(strings(snapshot.final_response_evidence_ids)).size;
  const activeExposures = new Map<string, number>(); let visibleDurationMs = 0; let completedExposureCount = 0;
  events.forEach((item) => {
    if (!item.target_id) return;
    if (["text_span_exposed", "text_span_first_exposure", "text_span_revisit"].includes(item.action)) activeExposures.set(item.target_id, Date.parse(item.at));
    if (item.action === "text_span_view_exit") { const entered = activeExposures.get(item.target_id); const exited = Date.parse(item.at); if (typeof entered === "number" && exited >= entered) { visibleDurationMs += exited - entered; completedExposureCount += 1; activeExposures.delete(item.target_id); } }
  });
  return {
    schema_version: "meaningforge-study-metrics-1.0",
    generated_at: new Date().toISOString(),
    event_count: events.length,
    first_exposure_count: events.filter((item) => ["text_span_exposed", "text_span_first_exposure"].includes(item.action)).length,
    revisit_count: events.filter((item) => item.action === "text_span_revisit").length,
    unique_read_span_count: new Set(strings(snapshot.read_span_ids)).size,
    exact_reader_anchor_count: nodes.filter((item) => typeof item.source_start_char === "number" && typeof item.source_end_char === "number" && typeof item.source_quote === "string").length,
    reader_relation_count: relations.length,
    multi_evidence_relation_count: relations.filter((item) => new Set(strings(item.evidence_ids)).size >= 2).length,
    reader_claim_count: claims.length,
    claim_evidence_link_count: claimEvidenceLinkCount,
    evidence_anchor_density_per_100_chars: finalTextCharacterCount ? Number(((claimEvidenceLinkCount / finalTextCharacterCount) * 100).toFixed(4)) : null,
    relation_density_per_1000_chars: finalTextCharacterCount ? Number(((relations.length / finalTextCharacterCount) * 1000).toFixed(4)) : null,
    revision_event_count: events.filter((item) => /revise|modify|delete|restore|undo|redo/.test(item.action)).length,
    ghost_exposed_count: exposed.size,
    ghost_accepted_count: accepted,
    ghost_acceptance_rate: exposed.size ? Number((accepted / exposed.size).toFixed(4)) : null,
    knowledge_query_count: cards.length,
    knowledge_available_count: cards.filter((item) => item.status === "available").length,
    knowledge_filtered_count: cards.filter((item) => item.status === "filtered").length,
    completed_span_exposure_count: completedExposureCount,
    visible_duration_ms: visibleDurationMs,
    unclosed_span_exposure_count: activeExposures.size,
    final_text_character_count: finalTextCharacterCount,
    final_response_evidence_count: claimEvidenceLinkCount,
    baseline_quote_anchor_count: Array.isArray(snapshot.baseline_evidence_references) ? snapshot.baseline_evidence_references.filter(object).length : 0,
    study_phase: typeof snapshot.study_phase === "string" ? snapshot.study_phase : null,
  };
}

export function syncStudySession(input: Record<string, unknown>) {
  const context = parseContext(input.study_context);
  const packageId = requireIdentifier(input.package_id, "数据包编号");
  const manifest = loadManifest(context);
  if (!manifest) throw new Error("实验会话尚未注册。");
  if (!sameRegistration(manifest, context, packageId)) throw new Error("同步请求与已注册会话不一致。");
  if (input.registration_token !== manifest.registration_token) throw new Error("实验会话令牌不正确。");
  if (!object(input.snapshot)) throw new Error("同步请求缺少完整会话快照。");
  const events = normalizeEvents(input.events);
  const quality = validateSnapshot(input.snapshot, context, packageId, events);
  if (input.final === true) {
    const finalResponse = typeof input.snapshot.final_response === "string" ? input.snapshot.final_response.trim() : "";
    const pkg = loadPackage(packageId);
    const spans = (Array.isArray(pkg.text_spans) ? pkg.text_spans : []).filter(object);
    const chapterIds = [...new Set(spans.map((span) => String(span.chapter_id ?? "")))];
    const contentChapters = chapterIds.some((id) => /[一二三四五六七八九十]/.test(id)) ? new Set(chapterIds.filter((id) => !/^\d+$/.test(id))) : new Set(chapterIds);
    const requiredSpanIds = spans.filter((span) => contentChapters.has(String(span.chapter_id ?? ""))).map((span) => String(span.id));
    const readSpanIds = new Set(strings(input.snapshot.read_span_ids));
    const phaseIds = (Array.isArray(input.snapshot.phase_history) ? input.snapshot.phase_history.filter(object) : []).map((entry) => entry.phase);
    if (input.snapshot.study_phase !== "complete") quality.errors.push("完成会话前必须进入complete阶段。");
    if (finalResponse.length < 100 || finalResponse.length > 200) quality.errors.push("正式实验最终作答必须为100-200字。");
    if (!iso(input.snapshot.completed_at)) quality.errors.push("完成会话缺少有效完成时间。");
    if (requiredSpanIds.some((id) => !readSpanIds.has(id))) quality.errors.push("正式实验完成前必须阅读全部正文TextSpan。");
    if (!["reading", "construction", "final_response", "complete"].every((phase) => phaseIds.includes(phase))) quality.errors.push("正式实验缺少完整的阅读、组织、最终作答和完成阶段历史。");
    quality.valid = quality.errors.length === 0;
  }
  const directory = sessionDirectory(context);
  if (!quality.valid) {
    const rejectedAt = new Date().toISOString();
    atomicJson(path.join(directory, "rejected", `${rejectedAt.replace(/[:.]/g, "-")}.json`), { rejected_at: rejectedAt, quality, snapshot: input.snapshot, events });
    throw new Error(`实验数据校验失败：${quality.errors.slice(0, 5).join("；")}`);
  }
  const eventFile = path.join(directory, "events.jsonl");
  const existingRows = fs.existsSync(eventFile) ? fs.readFileSync(eventFile, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>) : [];
  const existingById = new Map(existingRows.map((row) => [String(row.event_id), row]));
  const sequenceOwner = new Map(existingRows.map((row) => [Number(row.sequence), String(row.event_id)]));
  let accepted = 0;
  for (const studyEvent of events) {
    const existing = existingById.get(studyEvent.event_id);
    if (existing) {
      if (Number(existing.sequence) !== studyEvent.sequence || existing.action !== studyEvent.action) throw new Error(`事件${studyEvent.event_id}与已落盘记录冲突。`);
      continue;
    }
    const owner = sequenceOwner.get(studyEvent.sequence);
    if (owner && owner !== studyEvent.event_id) throw new Error(`事件序号${studyEvent.sequence}已被另一事件占用。`);
    appendJsonl(eventFile, { ...studyEvent, protocol_version: context.protocol_version, participant_id: context.participant_id, condition: context.condition, session_id: context.session_id, round_id: context.round_id, material_id: context.material_id, package_id: packageId, received_at: new Date().toISOString() });
    accepted += 1;
  }
  const now = new Date().toISOString();
  const snapshotText = JSON.stringify(input.snapshot);
  atomicJson(path.join(directory, "latest-snapshot.json"), { synced_at: now, hash: `sha256:${hash(snapshotText)}`, snapshot: input.snapshot });
  atomicJson(path.join(directory, "quality-report.json"), { checked_at: now, ...quality });
  atomicJson(path.join(directory, "derived-metrics.json"), metrics(input.snapshot, events));
  manifest.last_sync_at = now; manifest.last_sequence = events.length; manifest.snapshot_hash = `sha256:${hash(snapshotText)}`;
  if (input.final === true) { manifest.status = "complete"; manifest.completed_at = now; atomicJson(path.join(directory, "final-snapshot.json"), { completed_at: now, hash: manifest.snapshot_hash, snapshot: input.snapshot }); }
  atomicJson(manifestFile(context), manifest);
  appendJsonl(path.join(directory, "server-audit.jsonl"), { at: now, action: input.final === true ? "session_completed" : "session_synced", received_event_count: events.length, accepted_new_events: accepted, snapshot_hash: manifest.snapshot_hash, warnings: quality.warnings });
  return { synced: true, final: input.final === true, accepted_new_events: accepted, total_events: events.length, quality, metrics: metrics(input.snapshot, events), manifest: publicManifest(manifest) };
}

export function studyDataHealth() {
  ensureDirectory(dataRoot);
  return { enabled: true, schema_version: "meaningforge-study-data-1.0", data_directory: dataRoot, writable: fs.existsSync(dataRoot) };
}

export function validateStudyKnowledgeRequest(input: Record<string, unknown>) {
  const context = parseContext(input.study_context);
  const packageId = requireIdentifier(input.package_id, "数据包编号");
  const manifest = loadManifest(context);
  if (!manifest || !sameRegistration(manifest, context, packageId)) throw new Error("背景知识查询未绑定到有效实验会话。");
  if (input.registration_token !== manifest.registration_token) throw new Error("背景知识查询的实验会话令牌不正确。");
  const index = packageIndex(loadPackage(packageId));
  const textSpanId = typeof input.textSpanId === "string" ? input.textSpanId : "";
  const readSpans = strings(input.userReadSpans);
  if (!index.spans.has(textSpanId) || !readSpans.includes(textSpanId)) throw new Error("背景知识查询必须锚定到已读TextSpan。");
  if (readSpans.some((id) => !index.spans.has(id))) throw new Error("背景知识查询包含未知TextSpan。");
  const latestFile = path.join(sessionDirectory(context), "latest-snapshot.json");
  if (!fs.existsSync(latestFile)) throw new Error("背景知识查询前必须先同步阅读快照。");
  const latest = JSON.parse(fs.readFileSync(latestFile, "utf8")) as Record<string, unknown>;
  const snapshot = object(latest.snapshot) ? latest.snapshot : {};
  const serverReadSpans = new Set(strings(snapshot.read_span_ids));
  if (!serverReadSpans.has(textSpanId)) throw new Error("该TextSpan尚未进入服务端已记录的阅读地平线。");
  if (readSpans.some((id) => !serverReadSpans.has(id))) throw new Error("背景知识查询的已读范围超出最近一次有效快照。");
  return { context, packageId };
}

export function appendLlmAudit(record: Record<string, unknown>) {
  appendJsonl(path.join(dataRoot, "llm-calls.jsonl"), record);
}
