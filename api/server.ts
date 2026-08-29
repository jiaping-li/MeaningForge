import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { validateWorkPackage } from "./workPackageValidator.ts";
import { buildWorkPackage, extractMipCoverageCandidates, type MipCoverageCandidate } from "./substratePreparation.ts";
import { appendLlmAudit, registerStudySession, studyDataHealth, syncStudySession, validateStudyKnowledgeRequest } from "./studyData.ts";

loadLocalEnv();
const port = Number(process.env.PORT || 8787);
const contextWindow = Math.min(Math.max(Number(process.env.LLM_CONTEXT_WINDOW || process.env.LLM_MAX_TOKENS || 262144), 1024), 1048576);
const maxOutputTokens = Math.min(Math.max(Number(process.env.LLM_MAX_OUTPUT_TOKENS || 4096), 64), contextWindow);
const llmTimeoutMs = Math.min(Math.max(Number(process.env.LLM_REQUEST_TIMEOUT_MS || 60_000), 5_000), 600_000);
const llmPromptVersion = "meaningforge-objective-knowledge-v6";

interface PreparationRequest { title?: string; text?: string; use_llm?: boolean; }
interface KnowledgeRequest { word?: string; textSpanId?: string; contextBefore?: string; contextAfter?: string; userReadSpans?: string[]; sessionId?: string; package_id?: string; study_context?: Record<string, unknown>; registration_token?: string; }
interface LlmResponse { model_instance_id?: string; choices?: Array<{ message?: { content?: string } }>; output?: Array<{ content?: Array<{ text?: string }> | string }>; stats?: { input_tokens?: number; total_output_tokens?: number; reasoning_output_tokens?: number; tokens_per_second?: number; time_to_first_token_seconds?: number }; }
type MipReviewJob = { id: string; title: string; source: string; status: "queued" | "running" | "complete" | "failed"; created_at: string; completed_at?: string; candidate_count: number; mip_reviews?: Record<string, unknown>[]; error?: string };
const mipReviewJobs = new Map<string, MipReviewJob>();

function loadLocalEnv() {
  const filename = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env.local");
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function send(response: http.ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readJson(request: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => { size += chunk.length; if (size > 25 * 1024 * 1024) { reject(new Error("Request body exceeds 25 MB.")); request.destroy(); return; } chunks.push(chunk); });
    request.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, unknown>); } catch { reject(new Error("Request body must be JSON.")); } });
    request.on("error", reject);
  });
}

function cleanJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? content).trim();
  const start = candidate.indexOf("{"); const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("LLM response did not contain a JSON object.");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function askLocalLlm(system: string, user: string, tokenLimit = maxOutputTokens, audit: Record<string, unknown> = {}) {
  const apiUrl = process.env.OPENAI_API_URL;
  const model = process.env.OPENAI_MODEL;
  if (!apiUrl || !model) throw new Error("Local LLM is not configured. Add OPENAI_API_URL and OPENAI_MODEL in api/.env.local.");
  const outputLimit = Math.min(Math.max(tokenLimit, 32), maxOutputTokens, contextWindow);
  const estimatedInputTokens = Math.ceil((system.length + user.length) / 2);
  if (estimatedInputTokens + outputLimit > contextWindow) throw new Error(`Local LLM request exceeds configured ${contextWindow}-token context window.`);
  const requestId = randomUUID(); const startedAt = new Date().toISOString(); const started = Date.now();
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), llmTimeoutMs);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.OPENAI_API_KEY ? { authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}) },
      // LM Studio's /api/v1/chat uses an input-based local API. Reasoning is
      // disabled and temperature is zero so study participants receive the
      // most reproducible bounded response this endpoint can provide.
      body: JSON.stringify({ model, system_prompt: system, input: user, temperature: 0, max_output_tokens: outputLimit, reasoning: "off", store: false }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Local LLM returned ${response.status}: ${(await response.text()).slice(0, 400)}`);
    const payload = await response.json() as LlmResponse;
    const outputContent = payload.output?.flatMap((item) => typeof item.content === "string" ? [item.content] : item.content?.map((content) => content.text ?? "") ?? []).join("\n");
    const content = payload.choices?.[0]?.message?.content ?? outputContent;
    if (!content) throw new Error("Local LLM returned no message content.");
    if (payload.model_instance_id && payload.model_instance_id !== model) throw new Error(`Local LLM served ${payload.model_instance_id}, expected ${model}.`);
    const metadata = { request_id: requestId, model: payload.model_instance_id || model, endpoint_style: apiUrl.includes("/api/v1/chat") ? "lmstudio-chat" : "openai-compatible", context_window: contextWindow, max_output_tokens: outputLimit, response_sha256: createHash("sha256").update(content).digest("hex"), input_tokens: payload.stats?.input_tokens, output_tokens: payload.stats?.total_output_tokens, reasoning_tokens: payload.stats?.reasoning_output_tokens, tokens_per_second: payload.stats?.tokens_per_second, time_to_first_token_ms: typeof payload.stats?.time_to_first_token_seconds === "number" ? Math.round(payload.stats.time_to_first_token_seconds * 1000) : undefined, latency_ms: Date.now() - started };
    appendLlmAudit({ at: new Date().toISOString(), started_at: startedAt, status: "success", ...audit, ...metadata });
    return { data: cleanJson(content), metadata };
  } catch (error) {
    appendLlmAudit({ at: new Date().toISOString(), started_at: startedAt, status: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "failed", ...audit, request_id: requestId, model, context_window: contextWindow, max_output_tokens: outputLimit, latency_ms: Date.now() - started, error: error instanceof Error ? error.message : "Unknown local LLM error" });
    if (error instanceof DOMException && error.name === "AbortError") throw new Error(`Local LLM timed out after ${llmTimeoutMs} ms.`);
    throw error;
  } finally { clearTimeout(timeout); }
}

const knowledgeSafetyRules = [
  { label: "literary_concept", pattern: /象征|隐喻|意象|寓意|主题|主旨|作者意图|中心思想/ },
  { label: "interpretive_claim", pattern: /反映|揭示|揭露|暗示|表达|批判|讽刺|抨击|歌颂|影射|映射|体现|代表了|说明了/ },
  { label: "aesthetic_effect", pattern: /营造|烘托|渲染|氛围|压抑|清冷|神秘|精神麻木|启蒙的艰难/ },
  { label: "literary_attribution", pattern: /小说|作品|文学|文中|文本中|情节|角色|人物形象|作者|鲁迅|《[^》]+》/ },
  { label: "interpretive_purpose", pattern: /用来表现|用于表现|旨在|借此/ },
] as const;

function normalizeKnowledgeTerm(value: string) {
  const term = value.trim().replace(/^[，。！？；：、,.!?;:'“”‘’\s]+|[，。！？；：、,.!?;:'“”‘’\s]+$/g, "");
  if (term.length < 2) throw new Error("请选择至少两个字的词或短语进行背景查询。");
  const containsCjk = /[\u3400-\u9fff]/.test(term);
  if (containsCjk && (term.length > 16 || /[，。！？；：、\n]/.test(term))) throw new Error("背景查询只接受较短的词或短语；请重新选中16字以内且不跨句的内容。");
  if (!containsCjk && (term.length > 60 || term.split(/\s+/).length > 8)) throw new Error("Please select a short term of no more than eight words for background lookup.");
  return term;
}

function termRelevance(sentence: string, term: string) {
  if (/^(这种说法|该做法|这种做法|这一做法|该用法|这一用法|该称谓|这一称谓|该制度|这一制度|该习俗|这一习俗|该事物)/.test(sentence)) return true;
  if (/[\u3400-\u9fff]/.test(term)) {
    const stopCharacters = new Set("的了是在与和或为其此时中于将把被所及而并又更".split(""));
    const anchors = [...new Set([...term].filter((character) => /[\u3400-\u9fff]/.test(character) && !stopCharacters.has(character)))];
    const overlap = anchors.filter((character) => sentence.includes(character)).length;
    return overlap >= Math.min(2, anchors.length);
  }
  const tokens = term.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const lower = sentence.toLocaleLowerCase();
  return tokens.length === 0 || tokens.some((token) => lower.includes(token));
}

function factualSentences(value: unknown, term: string) {
  if (typeof value !== "string") return { text: "", removed: [] as Array<{ sentence: string; labels: string[] }> };
  const sentences = value.replace(/\s+/g, " ").match(/[^。！？!?；;]+[。！？!?；;]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
  const removed: Array<{ sentence: string; labels: string[] }> = [];
  const kept = sentences.filter((sentence) => {
    const labels: string[] = knowledgeSafetyRules.filter((rule) => rule.pattern.test(sentence)).map((rule) => rule.label);
    if (!termRelevance(sentence, term)) labels.push("insufficient_term_relevance");
    if (/(?:可|能|能够).{0,6}(?:治疗|治愈|治好)/.test(sentence) && !/(认为|声称|传说|迷信|偏方|据称|被当作)/.test(sentence)) labels.push("unqualified_medical_claim");
    if (labels.length) removed.push({ sentence, labels });
    return labels.length === 0;
  });
  return { text: kept.join(" ").slice(0, 240), removed };
}

const factKinds = new Set(["definition", "usage", "etymology", "historical", "cultural", "scientific", "institutional", "geographic", "other"]);
const coreFactKinds = new Set(["definition", "usage", "etymology"]);

function structuredKnowledge(output: Record<string, unknown>, term: string) {
  const removed: Array<{ sentence: string; labels: string[] }> = [];
  const accepted: Array<{ kind: string; text: string }> = [];
  const rawFacts = Array.isArray(output.facts) ? output.facts : [];
  rawFacts.slice(0, 6).forEach((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { removed.push({ sentence: "malformed_fact", labels: ["malformed_fact"] }); return; }
    const record = raw as Record<string, unknown>;
    const kind = typeof record.kind === "string" && factKinds.has(record.kind) ? record.kind : "other";
    if (record.directness !== "direct") { removed.push({ sentence: typeof record.text === "string" ? record.text : "indirect_fact", labels: ["indirect_fact"] }); return; }
    if (record.confidence !== "high" && record.confidence !== "medium") { removed.push({ sentence: typeof record.text === "string" ? record.text : "low_confidence_fact", labels: ["low_confidence_fact"] }); return; }
    const checked = factualSentences(record.text, term); removed.push(...checked.removed);
    if (checked.text) accepted.push({ kind, text: checked.text });
  });
  // A malformed local-model response may use the previous two-field schema.
  // Preserve safe content without weakening the v6 fact-level checks.
  if (!rawFacts.length) {
    const objective = factualSentences(output.objectiveBackground, term); const historical = factualSentences(output.historicalContext, term);
    removed.push(...objective.removed, ...historical.removed);
    if (objective.text) accepted.push({ kind: "definition", text: objective.text });
    if (historical.text) accepted.push({ kind: "historical", text: historical.text });
  }
  return {
    queryType: typeof output.queryType === "string" ? output.queryType.slice(0, 40) : "unknown",
    objective: accepted.filter((fact) => coreFactKinds.has(fact.kind)).map((fact) => fact.text).join(" ").slice(0, 420),
    background: accepted.filter((fact) => !coreFactKinds.has(fact.kind)).map((fact) => fact.text).join(" ").slice(0, 420),
    acceptedKinds: accepted.map((fact) => fact.kind),
    removed,
  };
}

async function knowledgeCard(request: KnowledgeRequest) {
  const rawWord = request.word?.trim();
  const textSpanId = request.textSpanId?.trim();
  const readSpans = Array.isArray(request.userReadSpans) ? request.userReadSpans.filter((id): id is string => typeof id === "string") : [];
  if (!rawWord || !textSpanId || !readSpans.includes(textSpanId)) throw new Error("知识查询必须锚定在读者已读的原文范围内。");
  const word = normalizeKnowledgeTerm(rawWord);
  if (!process.env.OPENAI_API_URL || !process.env.OPENAI_MODEL) {
    if (request.study_context) throw new Error("正式实验要求本地背景知识模型在线，当前服务未配置。");
    return { success: true, data: { word, relatedEntities: [], status: "unavailable", fallbackMessage: "背景知识服务尚未配置，请查阅经研究者核验的历史资料。" } };
  }
  if (request.study_context && request.package_id) validateStudyKnowledgeRequest(request as unknown as Record<string, unknown>);
  const contextBefore = (request.contextBefore ?? "").slice(-600);
  const contextAfter = (request.contextAfter ?? "").slice(0, 600);
  const llm = await askLocalLlm(
    "你是一个通用的历史、语言与文化背景词典。查询对象只是一个词或短语，前后文只用于判断该词在此处是哪一种含义，绝不能据此补写场景、活动或情节。先判断 queryType，例如 ordinary_expression、material_object、custom_practice、institution、historical_term、disease_or_science、person_title、place、language_form 或 unknown。然后返回原子事实：definition 是直接定义；usage 是客观用途或用法；etymology 是有把握的词源；historical、cultural、scientific、institutional、geographic 只在确有直接相关背景时使用。除一个必要定义外，可补充0至4条事实，不设数量配额；普通表达没有额外背景时不要凑数。每条事实必须直接针对查询词，不能只是与所在段落有关。涉及历史观念、争议说法或旧时实践时，要明确区分‘曾被认为/被记录为’与已证实事实。不得识别或提及作者、作品、人物，不得分析文学效果、氛围、主题、象征、社会批判或作者意图。只返回JSON：{queryType:string,facts:[{kind:'definition'|'usage'|'etymology'|'historical'|'cultural'|'scientific'|'institutional'|'geographic'|'other',text:string,directness:'direct'|'indirect',confidence:'high'|'medium'|'low'}],source:string}。你没有外部检索能力，source必须留空；不确定的事实标为low，不得编造来源。",
    `当前词语：${word}\n当前已读位置：${textSpanId}\n前文：${contextBefore}\n后文：${contextAfter}`,
    600,
    { role: "background_knowledge", prompt_version: llmPromptVersion, session_id: request.sessionId, participant_id: request.study_context?.participant_id, condition: request.study_context?.condition, package_id: request.package_id, text_span_id: textSpanId, word },
  );
  const output = llm.data as Record<string, unknown>;
  const structured = structuredKnowledge(output, word);
  const removed = structured.removed;
  const labels = [...new Set(removed.flatMap((item) => item.labels))];
  const modelSourceRemoved = typeof output.source === "string" && output.source.trim().length > 0;
  const modelMetadata = { requestId: llm.metadata.request_id, model: llm.metadata.model, promptVersion: llmPromptVersion, contextWindow: contextWindow, inputTokens: llm.metadata.input_tokens, outputTokens: llm.metadata.output_tokens, latencyMs: llm.metadata.latency_ms, sourceStatus: "not_provided" as const };
  if (!structured.objective && !structured.background) {
    const outcome = removed.length ? "filtered" : "unavailable";
    appendLlmAudit({ at: new Date().toISOString(), status: "postprocessed", role: "background_knowledge", request_id: llm.metadata.request_id, outcome, query_type: structured.queryType, accepted_fact_kinds: structured.acceptedKinds, matched_rule_labels: labels, removed_sentence_count: removed.length, model_source_removed: modelSourceRemoved, response_sha256: llm.metadata.response_sha256 });
    return { success: true, data: { word, relatedEntities: [], status: outcome, fallbackMessage: removed.length ? "模型返回内容包含文学解释或作品归因，已被系统拦截。" : "未取得可保留的客观背景候选。", ...modelMetadata } };
  }
  const partiallyFiltered = removed.length > 0 || modelSourceRemoved;
  appendLlmAudit({ at: new Date().toISOString(), status: "postprocessed", role: "background_knowledge", request_id: llm.metadata.request_id, outcome: partiallyFiltered ? "partially_filtered" : "available", query_type: structured.queryType, accepted_fact_kinds: structured.acceptedKinds, matched_rule_labels: labels, removed_sentence_count: removed.length, model_source_removed: modelSourceRemoved, response_sha256: llm.metadata.response_sha256 });
  return { success: true, data: { word, objectiveBackground: structured.objective, historicalContext: structured.background, source: "", relatedEntities: [], status: "available", safetyNotice: partiallyFiltered ? "已省略无关、低置信或解释性内容。" : undefined, ...modelMetadata } };
}

async function reviewMipCoverage(title: string, source: string, onBatch?: (reviews: Record<string, unknown>[]) => void): Promise<Record<string, unknown>[]> {
  const maximum = Math.min(Math.max(Number(process.env.MF_MIP_MAX_CANDIDATES || 96), 1), 240);
  const batchSize = Math.min(Math.max(Number(process.env.MF_MIP_BATCH_SIZE || 12), 4), 24);
  const coverage = extractMipCoverageCandidates(source, maximum);
  const results: Record<string, unknown>[] = [];
  for (let index = 0; index < coverage.length; index += batchSize) {
    const batch = coverage.slice(index, index + batchSize);
    let output: { mip_reviews?: unknown } = {};
    try {
      const llm = await askLocalLlm(
        "You are a bounded MIP/MIPVU review executor. Return one JSON object only: {mip_reviews:[...]}. Return exactly one record per supplied coverage_candidate_id; do not add candidates or alter lexical_unit/exact_quote. Record fields: coverage_candidate_id, lexical_unit, exact_quote, contextual_meaning, basic_meaning, comparison, decision. decision is metaphor_candidate, literal, or undecidable. Use a compact phrase (at most 18 Chinese characters or 12 English words) for each of contextual_meaning, basic_meaning, comparison. Select metaphor_candidate only when contextual use contrasts with a more basic meaning; literal if no contrast; undecidable if excerpt insufficient. Do not infer theme, author intent, symbolism, or final interpretation.",
        `Work title: ${title}\nBatch ${Math.floor(index / batchSize) + 1}; review all ${batch.length} candidates:\n${JSON.stringify(batch)}`,
        Math.min(4096, Math.max(1200, batch.length * 260)),
        { role: "mip_review", prompt_version: "meaningforge-mip-review-v2", work_title: title, batch_index: Math.floor(index / batchSize) + 1, candidate_count: batch.length },
      );
      output = llm.data as { mip_reviews?: unknown };
    } catch { /* Preserve every candidate below as an explicit draft instead of aborting the work. */ }
    const returned = Array.isArray(output.mip_reviews) ? output.mip_reviews.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
    const byId = new Map(returned.map((item) => [typeof item.coverage_candidate_id === "string" ? item.coverage_candidate_id : "", item]));
    // Missing/malformed model output becomes an explicit undecidable record,
    // preserving coverage accounting without turning an omission into a claim.
    batch.forEach((candidate: MipCoverageCandidate) => {
      const raw = byId.get(candidate.id);
      if (raw && raw.lexical_unit === candidate.lexical_unit && raw.exact_quote === candidate.exact_quote) results.push(raw);
      else results.push({ coverage_candidate_id: candidate.id, lexical_unit: candidate.lexical_unit, exact_quote: candidate.exact_quote, contextual_meaning: "模型未返回可核验的语境义。", basic_meaning: "暂不可由该次模型输出确认。", comparison: "模型输出缺失或未保持原文锚点，保留为不可判定。", decision: "undecidable", review_status: "machine_draft" });
    });
    onBatch?.(results);
  }
  return results;
}

function canonicalSource(source: string) { return source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim(); }
function startMipReviewJob(title: string, source: string) {
  const clean = canonicalSource(source); if (!clean || clean.length < 120) throw new Error("Provide a literary text of at least 120 characters.");
  if (!process.env.OPENAI_API_URL || !process.env.OPENAI_MODEL) throw new Error("Local LLM is not configured.");
  const id = `mip-job-${randomUUID()}`; const job: MipReviewJob = { id, title: title.trim() || "Untitled", source: clean, status: "queued", created_at: new Date().toISOString(), candidate_count: extractMipCoverageCandidates(clean, Math.min(Math.max(Number(process.env.MF_MIP_MAX_CANDIDATES || 96), 1), 240)).length };
  mipReviewJobs.set(id, job);
  void (async () => { try { job.status = "running"; job.mip_reviews = []; job.mip_reviews = await reviewMipCoverage(job.title, job.source, (reviews) => { job.mip_reviews = [...reviews]; }); job.status = "complete"; job.completed_at = new Date().toISOString(); } catch (error) { job.status = "failed"; job.error = error instanceof Error ? error.message : "Unable to review MIP coverage."; job.completed_at = new Date().toISOString(); } })();
  return job;
}
function freezeMedicineJob(job: MipReviewJob) {
  if (job.title !== "药") throw new Error("Only the controlled Medicine material may be frozen through this endpoint.");
  if (job.status !== "complete" || !job.mip_reviews) throw new Error("MIP review job is not complete.");
  const workPackage = buildWorkPackage("药", job.source, { mip_reviews: job.mip_reviews, review_notes: [`LLM full-text MIP review job ${job.id} completed with ${job.mip_reviews.length} records.`] });
  workPackage.package_id = "medicine-v3-reference"; workPackage.package_status = "reference_ready";
  workPackage.work = { ...workPackage.work, author: "鲁迅", source_uri: "/books/luxun-medicine-zh.txt", status: "reference_ready" };
  Object.assign(workPackage.source_document!, { checksum: `sha256:${createHash("sha256").update(job.source).digest("hex")}` });
  Object.assign(workPackage.construction_run!, { frozen_at: new Date().toISOString(), validation_summary: `${workPackage.construction_run?.validation_summary} Frozen after structured LLM MIP coverage review.` });
  const issues = validateWorkPackage(workPackage as unknown as Record<string, unknown>, job.source); if (issues.length) throw new Error(`Refusing to freeze invalid package: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/data/medicine-v3-reference.json"); fs.writeFileSync(output, `${JSON.stringify(workPackage, null, 2)}\n`, "utf8");
  return { output, package_id: workPackage.package_id, mip_coverage: workPackage.mip_coverage, mip_decisions: workPackage.mip_review_records?.reduce((counts, record) => ({ ...counts, [record.decision]: (counts[record.decision] ?? 0) + 1 }), {} as Record<string, number>), carriers: workPackage.carriers.map((carrier) => carrier.label), validation_records: workPackage.validations?.length };
}

async function prepareDraft(request: PreparationRequest) {
  const source = request.text?.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
  if (!source || source.length < 120) throw new Error("Provide a literary text of at least 120 characters.");
  let llmOutput: Record<string, unknown> | undefined;
  let llmNote = "未使用 LLM；已按固定规则生成可编辑草稿。";
  // A reader's initial import must always complete deterministically. LLM
  // enrichment is a deliberate researcher/developer action, never an
  // implicit dependency that can leave the reading interface waiting.
  if (request.use_llm === true && process.env.OPENAI_API_URL && process.env.OPENAI_MODEL) {
    const reviewNotes: string[] = [];
    // MIP coverage is the configured LLM responsibility. Narrative/context
    // extraction and structural candidates remain deterministic so a reader's
    // import does not wait for a second, unconstrained full-book proposal.
    llmNote = "系统正按固定 schema 逐批执行全文 MIP 候选复核。";
    try {
      const mip_reviews = await reviewMipCoverage(request.title?.trim() || "Untitled", source);
      llmOutput = { ...(llmOutput ?? {}), mip_reviews, review_notes: [...(Array.isArray(llmOutput?.review_notes) ? llmOutput.review_notes.filter((item): item is string => typeof item === "string") : []), `LLM reviewed ${mip_reviews.length} source-anchored MIP coverage candidates in batches.`] };
      llmNote = `${llmNote} 全文 MIP 候选已逐批复核。`;
    } catch (error) {
      reviewNotes.push(`MIP coverage review unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
      llmOutput = { ...(llmOutput ?? {}), review_notes: [...(Array.isArray(llmOutput?.review_notes) ? llmOutput.review_notes.filter((item): item is string => typeof item === "string") : []), ...reviewNotes] };
      llmNote = `${llmNote} 全文 MIP 候选已保留，但本次 LLM 复核未完成。`;
    }
  }
  const workPackage = buildWorkPackage(request.title?.trim() || "Untitled", source, llmOutput);
  return { mode: "preparation_draft", source_text: source, work_package: workPackage, deterministic_segmentation: { paragraph_count: source.split(/\n\s*\n/).filter((item) => item.trim().length > 0).length, source_length: source.length }, llm_note: llmNote, publication_status: "draft_only", next_step: "这是一份可编辑、可追溯的草稿。读者修改会保存到个人图层；研究材料需另行冻结。" };
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (request.method === "OPTIONS") return send(response, 204, {});
  if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { ok: true, service: "meaningforge-work-package-service", study_ready: Boolean(process.env.OPENAI_API_URL && process.env.OPENAI_MODEL), runtimeLlmRequiredForStudy: true, executors: { deterministic: true, local_llm: Boolean(process.env.OPENAI_API_URL && process.env.OPENAI_MODEL), stanza_requested: process.env.MF_ENABLE_STANZA === "true", stanza_python: process.env.MF_STANZA_PYTHON || "python3" }, llm: { model: process.env.OPENAI_MODEL || null, context_window: contextWindow, max_output_tokens: maxOutputTokens, prompt_version: llmPromptVersion }, study_data: studyDataHealth(), llmRoles: ["preparation_assistant", "background_knowledge"] });
  if (request.method === "POST" && url.pathname === "/api/study/sessions/register") {
    readJson(request).then((body) => send(response, 200, registerStudySession(body))).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to register study session." }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/study/sessions/sync") {
    readJson(request).then((body) => send(response, 200, syncStudySession(body))).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to sync study session." }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/validate-work-package") {
    readJson(request).then((body) => {
      const sourceText = typeof body.source_text === "string" ? body.source_text : undefined;
      const workPackage = body.work_package && typeof body.work_package === "object" ? body.work_package as Record<string, unknown> : body;
      const issues = validateWorkPackage(workPackage, sourceText);
      send(response, issues.length ? 422 : 200, { valid: issues.length === 0, issues });
    }).catch((error: unknown) => send(response, 400, { valid: false, issues: [{ path: "request", message: error instanceof Error ? error.message : "Invalid request." }] }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/llm/knowledge") {
    readJson(request).then((body) => knowledgeCard(body as KnowledgeRequest)).then((result) => send(response, 200, result)).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to retrieve background knowledge." }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/review-mip-coverage") {
    readJson(request).then(async (body) => {
      const job = startMipReviewJob(typeof body.title === "string" ? body.title : "Untitled", typeof body.text === "string" ? body.text : "");
      send(response, 202, { mode: "mip_coverage_review_job", job_id: job.id, status: job.status, candidate_count: job.candidate_count });
    }).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to review MIP coverage." }));
    return;
  }
  if (request.method === "GET" && url.pathname.startsWith("/api/mip-review-jobs/")) {
    const job = mipReviewJobs.get(url.pathname.slice("/api/mip-review-jobs/".length));
    if (!job) return send(response, 404, { error: "MIP review job not found." });
    return send(response, 200, { job_id: job.id, title: job.title, status: job.status, candidate_count: job.candidate_count, reviewed_count: job.mip_reviews?.length ?? 0, ...(job.status === "complete" ? { mip_reviews: job.mip_reviews } : {}), ...(job.error ? { error: job.error } : {}) });
  }
  if (request.method === "POST" && url.pathname.startsWith("/api/freeze-medicine-mip-job/")) {
    const job = mipReviewJobs.get(url.pathname.slice("/api/freeze-medicine-mip-job/".length));
    try { if (!job) throw new Error("MIP review job not found."); return send(response, 200, freezeMedicineJob(job)); } catch (error) { return send(response, 422, { error: error instanceof Error ? error.message : "Unable to freeze Medicine reference." }); }
  }
  if (request.method === "POST" && url.pathname === "/api/prepare-work-package") {
    readJson(request).then((body) => prepareDraft(body as PreparationRequest)).then((result) => send(response, 200, result)).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to prepare draft." }));
    return;
  }
  return send(response, 404, { error: "Not found." });
});

server.listen(port, "127.0.0.1", () => console.log(`MeaningForge WorkPackage service listening on http://127.0.0.1:${port}`));
