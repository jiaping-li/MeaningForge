import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.resolve(root, process.env.MF_STUDY_DATA_DIR || "study-data");
const protocol = process.env.MF_EXPORT_PROTOCOL || "meaningforge-study-v3";
const protocolRoot = path.join(dataRoot, protocol);
const outputRoot = path.join(dataRoot, "analysis", protocol);
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const array = (value: unknown) => Array.isArray(value) ? value.filter(object) : [];
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const csv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const writeCsv = (filename: string, rows: Record<string, unknown>[], requiredColumns: string[]) => {
  const columns = [...new Set([...requiredColumns, ...rows.flatMap((row) => Object.keys(row))])];
  fs.writeFileSync(filename, `${columns.map(csv).join(",")}\n${rows.map((row) => columns.map((key) => csv(row[key])).join(",")).join("\n")}\n`, "utf8");
};
const writeJsonl = (filename: string, rows: unknown[]) => fs.writeFileSync(filename, `${rows.map((row) => JSON.stringify(row)).join("\n")}${rows.length ? "\n" : ""}`, "utf8");

fs.mkdirSync(outputRoot, { recursive: true });
const sessionDirs: string[] = [];
if (fs.existsSync(protocolRoot)) for (const participant of fs.readdirSync(protocolRoot)) {
  const participantDir = path.join(protocolRoot, participant); if (!fs.statSync(participantDir).isDirectory()) continue;
  for (const session of fs.readdirSync(participantDir)) { const directory = path.join(participantDir, session); if (fs.existsSync(path.join(directory, "manifest.json"))) sessionDirs.push(directory); }
}

const sessions: Record<string, unknown>[] = [];
const events: Record<string, unknown>[] = [];
const evidenceLinks: Record<string, unknown>[] = [];
const responses: Record<string, unknown>[] = [];
const readerObjects: Record<string, unknown>[] = [];
const exclusions: Record<string, unknown>[] = [];

for (const directory of sessionDirs) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8")) as Record<string, unknown>;
  const qualityPath = path.join(directory, "quality-report.json"); const finalPath = path.join(directory, "final-snapshot.json");
  if (manifest.status !== "complete" || !fs.existsSync(qualityPath) || !fs.existsSync(finalPath)) { exclusions.push({ participant_id: manifest.participant_id, session_id: manifest.session_id, reason: "incomplete_or_missing_final_snapshot" }); continue; }
  const quality = JSON.parse(fs.readFileSync(qualityPath, "utf8")) as Record<string, unknown>;
  if (quality.valid !== true) { exclusions.push({ participant_id: manifest.participant_id, session_id: manifest.session_id, reason: "quality_report_invalid" }); continue; }
  const finalFile = JSON.parse(fs.readFileSync(finalPath, "utf8")) as Record<string, unknown>; const snapshot = object(finalFile.snapshot) ? finalFile.snapshot : {};
  const metricsPath = path.join(directory, "derived-metrics.json"); const metrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, "utf8")) as Record<string, unknown> : {};
  const key = { protocol_version: manifest.protocol_version, participant_id: manifest.participant_id, condition: manifest.condition, session_id: manifest.session_id, round_id: manifest.round_id, material_id: manifest.material_id, package_id: manifest.package_id };
  sessions.push({ ...key, started_at: manifest.started_at, completed_at: manifest.completed_at, ...metrics });
  responses.push({ ...key, final_response: snapshot.final_response, evidence_ids: strings(snapshot.final_response_evidence_ids) });
  const eventPath = path.join(directory, "events.jsonl");
  if (fs.existsSync(eventPath)) fs.readFileSync(eventPath, "utf8").split(/\r?\n/).filter(Boolean).forEach((line) => events.push(JSON.parse(line) as Record<string, unknown>));
  strings(snapshot.final_response_evidence_ids).forEach((evidenceId) => evidenceLinks.push({ ...key, link_type: "final_response", evidence_id: evidenceId }));
  array(snapshot.baseline_evidence_references).forEach((item) => evidenceLinks.push({ ...key, link_type: "baseline_exact_quote", evidence_id: item.evidence_id, text_span_id: item.text_span_id, start_char: item.start_char, end_char: item.end_char, quote: item.quote }));
  for (const [kind, records] of [["reader_node", snapshot.reader_nodes], ["reader_relation", snapshot.reader_relations], ["reader_claim", snapshot.reader_claims]] as const) array(records).forEach((item) => readerObjects.push({ ...key, object_type: kind, object: item }));
}

const studyKeyColumns = ["protocol_version", "participant_id", "condition", "session_id", "round_id", "material_id", "package_id"];
writeCsv(path.join(outputRoot, "sessions.csv"), sessions, [...studyKeyColumns, "started_at", "completed_at", "final_response_character_count", "final_response_evidence_count", "evidence_anchor_density_per_100_chars", "knowledge_query_count", "candidate_accept_count", "candidate_reject_count", "reader_node_count", "reader_relation_count", "reader_claim_count", "baseline_note_character_count", "baseline_exact_quote_count", "event_count", "study_phase"]);
writeCsv(path.join(outputRoot, "events.csv"), events, ["event_id", "sequence", "at", "action", "target_id", "target_type", ...studyKeyColumns, "received_at"]);
writeCsv(path.join(outputRoot, "evidence-links.csv"), evidenceLinks, [...studyKeyColumns, "link_type", "evidence_id", "text_span_id", "start_char", "end_char", "quote"]);
writeJsonl(path.join(outputRoot, "final-responses.jsonl"), responses);
writeJsonl(path.join(outputRoot, "reader-objects.jsonl"), readerObjects);
writeCsv(path.join(outputRoot, "exclusions.csv"), exclusions, ["participant_id", "session_id", "reason"]);
const outputs = fs.readdirSync(outputRoot).filter((name) => name !== "dataset-manifest.json").map((name) => { const content = fs.readFileSync(path.join(outputRoot, name)); return { filename: name, bytes: content.length, sha256: createHash("sha256").update(content).digest("hex") }; });
const datasetManifest = { schema_version: "meaningforge-analysis-dataset-1.0", protocol_version: protocol, generated_at: new Date().toISOString(), included_sessions: sessions.length, excluded_sessions: exclusions.length, row_counts: { sessions: sessions.length, events: events.length, evidence_links: evidenceLinks.length, final_responses: responses.length, reader_objects: readerObjects.length }, outputs };
fs.writeFileSync(path.join(outputRoot, "dataset-manifest.json"), `${JSON.stringify(datasetManifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: outputRoot, ...datasetManifest }, null, 2));
