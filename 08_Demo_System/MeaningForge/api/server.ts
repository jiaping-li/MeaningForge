import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorkPackage } from "./workPackageValidator.ts";
import { buildWorkPackage } from "./substratePreparation.ts";

loadLocalEnv();
const port = Number(process.env.PORT || 8787);
const maxTokens = Math.min(Number(process.env.LLM_MAX_TOKENS || 12000), 16000);

interface ReviewRequest { relation_text?: string; evidence?: Array<{ id?: string; text?: string; note?: string }>; }
interface PreparationRequest { title?: string; text?: string; use_llm?: boolean; }
interface LlmResponse { choices?: Array<{ message?: { content?: string } }>; output?: Array<{ content?: Array<{ text?: string }> | string }>; }

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

async function askLocalLlm(system: string, user: string): Promise<unknown> {
  const apiUrl = process.env.OPENAI_API_URL;
  const model = process.env.OPENAI_MODEL;
  if (!apiUrl || !model) throw new Error("Local LLM is not configured. Add OPENAI_API_URL and OPENAI_MODEL in api/.env.local.");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.OPENAI_API_KEY ? { authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}) },
    // LM Studio's /api/v1/chat speaks its current input-based API. Keep the request local and structured.
    body: JSON.stringify({ model, system_prompt: system, input: user, temperature: 0.2, max_output_tokens: maxTokens, store: false }),
  });
  if (!response.ok) throw new Error(`Local LLM returned ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const payload = await response.json() as LlmResponse;
  const outputContent = payload.output?.flatMap((item) => typeof item.content === "string" ? [item.content] : item.content?.map((content) => content.text ?? "") ?? []).join("\n");
  const content = payload.choices?.[0]?.message?.content ?? outputContent;
  if (!content) throw new Error("Local LLM returned no message content.");
  return cleanJson(content);
}

function clip(value: string, limit: number) { return value.length > limit ? `${value.slice(0, limit)}\n[truncated]` : value; }

async function reviewRelation(request: ReviewRequest) {
  const evidence = Array.isArray(request.evidence) ? request.evidence.filter((item) => typeof item?.text === "string" && item.text.length > 0).slice(0, 8) : [];
  if (!request.relation_text?.trim() || evidence.length === 0) throw new Error("A reader relation and at least one exact evidence excerpt are required.");
  const output = await askLocalLlm(
    "You are a bounded literary close-reading reviewer. Do not decide whether a reader is correct. Inspect only the supplied excerpts. Return a single JSON object with keys: direct_support (array of short observations), evidence_gaps (array), complications (array), suggested_questions (array). Each item must be qualified, neutral, and refer only to supplied evidence. Never state authorial intent or final theme.",
    `Reader-proposed relation:\n${request.relation_text}\n\nExact excerpts:\n${evidence.map((item, index) => `[${item.id ?? index + 1}] ${item.text}`).join("\n\n")}`,
  );
  return { mode: "reader_reviewer", relation_text: request.relation_text, evidence_ids: evidence.map((item) => item.id).filter((id): id is string => typeof id === "string"), review: output, disclaimer: "This is a request-time review suggestion. It does not alter the frozen reference WorkPackage or decide the reader's interpretation." };
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
    try {
      const paragraphs = source.split(/\n\s*\n/).map((text, index) => ({ id: `p${index + 1}`, text: text.trim() })).filter((item) => item.text.length > 0);
      const sourceForLlm = clip(paragraphs.map((item) => `[${item.id}] ${item.text}`).join("\n\n"), 50000);
      llmOutput = await askLocalLlm(
        "You execute a fixed MeaningForge substrate protocol. You do not give literary conclusions. Return one JSON object with carriers, structural_relations, review_notes. carriers: at most 12 {label,type,exact_quote,reasons,mip_record?}; types only object, action, scene, recurrent_expression, sensory_image, lexical_metaphor_candidate. For every lexical_metaphor_candidate, mip_record is REQUIRED: {lexical_unit,contextual_meaning,basic_meaning,comparison,decision}. lexical_unit must occur verbatim in exact_quote; decision is only metaphor_candidate, literal, or undecidable. Apply MIP/MIPVU conservatively: identify a lexical unit, state its contextual meaning, state a more basic/concrete meaning, then state whether their contrast supports a metaphor candidate. Never infer theme or authorial intent, and use undecidable when the supplied text cannot support the comparison. structural_relations: at most 18 {source_label,target_label,type,exact_quote,rationale}; types only recurs_with, contrasts_with, parallels, co_occurs_with, precedes, follows, changes_context, changes_function, shares_actor, shares_scene, causal_link, consequence_link. Copy exact_quote verbatim. Describe observable textual grounds only. Treat every item as a candidate to be checked by deterministic validation.",
        `Title: ${request.title?.trim() || "Untitled"}\n\nSegmented source text:\n${sourceForLlm}`,
      ) as Record<string, unknown>;
      llmNote = "LLM 已在固定 schema 内补充候选；系统已用原文与关系类型规则核查。";
    } catch (error) {
      llmNote = `LLM 未返回可用结果；已保留规则生成的草稿。${error instanceof Error ? ` (${error.message})` : ""}`;
    }
  }
  const workPackage = buildWorkPackage(request.title?.trim() || "Untitled", source, llmOutput);
  return { mode: "preparation_draft", source_text: source, work_package: workPackage, deterministic_segmentation: { paragraph_count: source.split(/\n\s*\n/).filter((item) => item.trim().length > 0).length, source_length: source.length }, llm_note: llmNote, publication_status: "draft_only", next_step: "这是一份可编辑、可追溯的草稿。读者修改会保存到个人图层；研究材料需另行冻结。" };
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (request.method === "OPTIONS") return send(response, 204, {});
  if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { ok: true, service: "meaningforge-work-package-service", runtimeLlmRequired: false, llmConfigured: Boolean(process.env.OPENAI_API_URL && process.env.OPENAI_MODEL), llmRoles: ["preparation_assistant", "reader_reviewer"] });
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
  if (request.method === "POST" && url.pathname === "/api/prepare-work-package") {
    readJson(request).then((body) => prepareDraft(body as PreparationRequest)).then((result) => send(response, 200, result)).catch((error: unknown) => send(response, 422, { error: error instanceof Error ? error.message : "Unable to prepare draft." }));
    return;
  }
  return send(response, 404, { error: "Not found." });
});

server.listen(port, "127.0.0.1", () => console.log(`MeaningForge WorkPackage service listening on http://127.0.0.1:${port}`));
