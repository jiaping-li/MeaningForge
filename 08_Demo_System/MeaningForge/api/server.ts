import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { validateWorkPackage } from "./workPackageValidator.ts";
import { buildWorkPackage, extractMipCoverageCandidates, type MipCoverageCandidate } from "./substratePreparation.ts";

loadLocalEnv();
const port = Number(process.env.PORT || 8787);
const maxTokens = Math.min(Number(process.env.LLM_MAX_TOKENS || 12000), 16000);

interface ReviewRequest { relation_text?: string; evidence?: Array<{ id?: string; text?: string; note?: string }>; }
interface PreparationRequest { title?: string; text?: string; use_llm?: boolean; }
interface LlmResponse { choices?: Array<{ message?: { content?: string } }>; output?: Array<{ content?: Array<{ text?: string }> | string }>; }
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
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
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

async function askLocalLlm(system: string, user: string, tokenLimit = maxTokens): Promise<unknown> {
  const apiUrl = process.env.OPENAI_API_URL;
  const model = process.env.OPENAI_MODEL;
  if (!apiUrl || !model) throw new Error("Local LLM is not configured. Add OPENAI_API_URL and OPENAI_MODEL in api/.env.local.");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.OPENAI_API_KEY ? { authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}) },
    // LM Studio's /api/v1/chat speaks its current input-based API. Keep the request local and structured.
    body: JSON.stringify({ model, system_prompt: system, input: user, temperature: 0.2, max_output_tokens: Math.min(tokenLimit, maxTokens), reasoning: "off", store: false }),
  });
  if (!response.ok) throw new Error(`Local LLM returned ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const payload = await response.json() as LlmResponse;
  const outputContent = payload.output?.flatMap((item) => typeof item.content === "string" ? [item.content] : item.content?.map((content) => content.text ?? "") ?? []).join("\n");
  const content = payload.choices?.[0]?.message?.content ?? outputContent;
  if (!content) throw new Error("Local LLM returned no message content.");
  return cleanJson(content);
}

async function reviewRelation(request: ReviewRequest) {
  const evidence = Array.isArray(request.evidence) ? request.evidence.filter((item) => typeof item?.text === "string" && item.text.length > 0).slice(0, 8) : [];
  if (!request.relation_text?.trim() || evidence.length === 0) throw new Error("A reader relation and at least one exact evidence excerpt are required.");
  const output = await askLocalLlm(
    "You are a bounded literary close-reading reviewer. Do not decide whether a reader is correct. Inspect only the supplied excerpts. Return a single JSON object with keys: direct_support (array of short observations), evidence_gaps (array), complications (array), suggested_questions (array). Each item must be qualified, neutral, and refer only to supplied evidence. Never state authorial intent or final theme.",
    `Reader-proposed relation:\n${request.relation_text}\n\nExact excerpts:\n${evidence.map((item, index) => `[${item.id ?? index + 1}] ${item.text}`).join("\n\n")}`,
  );
  return { mode: "reader_reviewer", relation_text: request.relation_text, evidence_ids: evidence.map((item) => item.id).filter((id): id is string => typeof id === "string"), review: output, disclaimer: "This is a request-time review suggestion. It does not alter the frozen reference WorkPackage or decide the reader's interpretation." };
}

async function reviewMipCoverage(title: string, source: string): Promise<Record<string, unknown>[]> {
  const maximum = Math.min(Math.max(Number(process.env.MF_MIP_MAX_CANDIDATES || 96), 1), 240);
  const batchSize = Math.min(Math.max(Number(process.env.MF_MIP_BATCH_SIZE || 12), 4), 24);
  const coverage = extractMipCoverageCandidates(source, maximum);
  const results: Record<string, unknown>[] = [];
  for (let index = 0; index < coverage.length; index += batchSize) {
    const batch = coverage.slice(index, index + batchSize);
    const output = await askLocalLlm(
      "You are a bounded MIP/MIPVU review executor for literary close reading. You must review every supplied candidate and return one JSON object only: {mip_reviews:[...]}. Return exactly one record for each supplied coverage_candidate_id; do not add candidates and do not change lexical_unit or exact_quote. Each record has coverage_candidate_id, lexical_unit, exact_quote, contextual_meaning, basic_meaning, comparison, decision. decision is exactly metaphor_candidate, literal, or undecidable. MIP procedure: identify the lexical unit's contextual meaning in the supplied exact quote; state a potentially more basic/concrete meaning if defensible; compare them; select metaphor_candidate only when the contextual use contrasts with a more basic meaning and can be understood through comparison. Use literal when no such contrast is supported; use undecidable when the excerpt alone is insufficient. Do not infer theme, author intent, morality, symbolism, or a final interpretation. Be conservative and complete.",
      `Work title: ${title}\nBatch ${Math.floor(index / batchSize) + 1}; review all ${batch.length} candidates:\n${JSON.stringify(batch)}`,
      2_400,
    ) as { mip_reviews?: unknown };
    const returned = Array.isArray(output.mip_reviews) ? output.mip_reviews.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
    const byId = new Map(returned.map((item) => [typeof item.coverage_candidate_id === "string" ? item.coverage_candidate_id : "", item]));
    // Missing/malformed model output becomes an explicit undecidable record,
    // preserving coverage accounting without turning an omission into a claim.
    batch.forEach((candidate: MipCoverageCandidate) => {
      const raw = byId.get(candidate.id);
      if (raw && raw.lexical_unit === candidate.lexical_unit && raw.exact_quote === candidate.exact_quote) results.push(raw);
      else results.push({ coverage_candidate_id: candidate.id, lexical_unit: candidate.lexical_unit, exact_quote: candidate.exact_quote, contextual_meaning: "模型未返回可核验的语境义。", basic_meaning: "暂不可由该次模型输出确认。", comparison: "模型输出缺失或未保持原文锚点，保留为不可判定。", decision: "undecidable" });
    });
  }
  return results;
}

function canonicalSource(source: string) { return source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim(); }
function startMipReviewJob(title: string, source: string) {
  const clean = canonicalSource(source); if (!clean || clean.length < 120) throw new Error("Provide a literary text of at least 120 characters.");
  if (!process.env.OPENAI_API_URL || !process.env.OPENAI_MODEL) throw new Error("Local LLM is not configured.");
  const id = `mip-job-${randomUUID()}`; const job: MipReviewJob = { id, title: title.trim() || "Untitled", source: clean, status: "queued", created_at: new Date().toISOString(), candidate_count: extractMipCoverageCandidates(clean, Math.min(Math.max(Number(process.env.MF_MIP_MAX_CANDIDATES || 96), 1), 240)).length };
  mipReviewJobs.set(id, job);
  void (async () => { try { job.status = "running"; job.mip_reviews = await reviewMipCoverage(job.title, job.source); job.status = "complete"; job.completed_at = new Date().toISOString(); } catch (error) { job.status = "failed"; job.error = error instanceof Error ? error.message : "Unable to review MIP coverage."; job.completed_at = new Date().toISOString(); } })();
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
  if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { ok: true, service: "meaningforge-work-package-service", runtimeLlmRequired: false, executors: { deterministic: true, local_llm: Boolean(process.env.OPENAI_API_URL && process.env.OPENAI_MODEL), stanza_requested: process.env.MF_ENABLE_STANZA === "true", stanza_python: process.env.MF_STANZA_PYTHON || "python3" }, llmRoles: ["preparation_assistant", "reader_reviewer"] });
  if (request.method === "POST" && url.pathname === "/api/validate-work-package") {
    readJson(request).then((body) => {
      const sourceText = typeof body.source_text === "string" ? body.source_text : undefined;
      const workPackage = body.work_package && typeof body.work_package === "object" ? body.work_package as Record<string, unknown> : body;
      const issues = validateWorkPackage(workPackage, sourceText);
      send(response, issues.length ? 422 : 200, { valid: issues.length === 0, issues });
    }).catch((error: unknown) => send(response, 400, { valid: false, issues: [{ path: "request", message: error instanceof Error ? error.message : "Invalid request." }] }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/review-reader-relation") {
    readJson(request).then((body) => reviewRelation(body as ReviewRequest)).then((result) => send(response, 200, result)).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to review relation." }));
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
