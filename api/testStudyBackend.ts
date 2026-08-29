import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const api = process.env.MF_API_URL || "http://127.0.0.1:8787";
const packageFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/data/medicine-v3-reference.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8")) as { package_id: string; text_spans: Array<{ id: string; chapter_id: string; text: string }> };
const span = pkg.text_spans.find((item) => item.text.includes("馒头")) ?? pkg.text_spans[0];
const contentSpans = pkg.text_spans.filter((item) => /[一二三四五六七八九十]/.test(item.chapter_id));
const now = new Date().toISOString();
const suffix = Date.now();
const context = { protocol_version: "meaningforge-smoke-v1", participant_id: "P999", condition: "meaningforge", session_id: `smoke-${suffix}`, round_id: `R${suffix}`, material_id: pkg.package_id, started_at: now } as const;
const makeEvent = (sequence: number, action: string, target_id?: string, target_type?: string) => ({ event_id: randomUUID(), sequence, at: new Date(Date.now() + sequence).toISOString(), action, target_id, target_type });
const events = [makeEvent(1, "study_session_start", context.session_id, "study_session"), ...contentSpans.map((item, index) => makeEvent(index + 2, "text_span_first_exposure", item.id, "text_span"))];
const snapshot = {
  package_id: pkg.package_id, study_context: context, read_chapter_ids: [...new Set(contentSpans.map((item) => item.chapter_id))], read_span_ids: contentSpans.map((item) => item.id), exposed_candidate_ids: [], selected_evidence_ids: [], judgments: {}, reference_reviews: {}, candidate_decisions: {}, counterevidence: [], probes: [], reader_evidence_references: [], reader_nodes: [], reader_relations: [], claim: "", baseline_notes: "", baseline_evidence_references: [], study_phase: "reading", phase_history: [{ phase: "reading", started_at: now }], final_response: "", final_response_evidence_ids: [], knowledge_cards: [], reader_claims: [], interpretation_dimensions: [], interpretation_ratings: {}, personal_event_order: [], events,
};

async function post<T>(pathname: string, body: unknown) {
  const response = await fetch(`${api}${pathname}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `${pathname} returned ${response.status}`);
  return payload;
}

const health = await fetch(`${api}/api/health`).then((response) => response.json()) as { llm: { model: string; context_window: number }; study_data: { enabled: boolean } };
assert.equal(health.llm.model, "qwen/qwen3.6-35b-a3b");
assert.equal(health.llm.context_window, 262144);
assert.equal(health.study_data.enabled, true);

const registration = await post<{ registration_token: string }>("/api/study/sessions/register", { package_id: pkg.package_id, study_context: context });
await post("/api/study/sessions/sync", { package_id: pkg.package_id, study_context: context, registration_token: registration.registration_token, events, snapshot });
const knowledge = await post<{ data: { word: string; status: string; requestId: string; model: string; contextWindow: number; inputTokens?: number; outputTokens?: number } }>("/api/llm/knowledge", { word: "馒头", textSpanId: span.id, contextBefore: "", contextAfter: span.text, userReadSpans: [span.id], sessionId: context.session_id, package_id: pkg.package_id, study_context: context, registration_token: registration.registration_token });
assert.equal(knowledge.data.model, "qwen/qwen3.6-35b-a3b");
assert.equal(knowledge.data.contextWindow, 262144);
assert.ok(knowledge.data.requestId);
assert.ok(["available", "filtered", "unavailable"].includes(knowledge.data.status));

const finalEvents = [...events, makeEvent(events.length + 1, "llm_knowledge_request", `knowledge-${suffix}`, "knowledge_card")];
const finalResponse = "我注意到人物对治病办法的期待、反复出现的保证和病人的身体状态一直并置在一起。刑场取得的馒头被带回家、吃下，又在茶馆谈话中被反复提起，但咳嗽并未随承诺消失。这里的理解仍是暂时的，我还需要比较坟地段落中的物件和前文怎样互相照应，并保留其他可能的读法。";
const finalSnapshot = { ...snapshot, study_phase: "complete", phase_history: [...snapshot.phase_history, { phase: "construction", started_at: new Date().toISOString() }, { phase: "final_response", started_at: new Date().toISOString() }, { phase: "complete", started_at: new Date().toISOString() }], final_response: finalResponse, final_response_evidence_ids: [], completed_at: new Date().toISOString(), knowledge_cards: [{ id: `knowledge-${suffix}`, word: "馒头", text_span_id: span.id, status: knowledge.data.status, request_id: knowledge.data.requestId, model: knowledge.data.model, context_window: knowledge.data.contextWindow, input_tokens: knowledge.data.inputTokens, output_tokens: knowledge.data.outputTokens, created_at: new Date().toISOString() }], events: finalEvents };
const completed = await post<{ final: boolean; quality: { valid: boolean }; total_events: number }>("/api/study/sessions/sync", { package_id: pkg.package_id, study_context: context, registration_token: registration.registration_token, events: finalEvents, snapshot: finalSnapshot, final: true });
assert.equal(completed.final, true);
assert.equal(completed.quality.valid, true);

console.log(JSON.stringify({ ok: true, model: knowledge.data.model, context_window: knowledge.data.contextWindow, request_id: knowledge.data.requestId, status: knowledge.data.status, input_tokens: knowledge.data.inputTokens, output_tokens: knowledge.data.outputTokens, stored_events: completed.total_events }, null, 2));
