import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorkPackage } from "./workPackageValidator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workPackage = JSON.parse(fs.readFileSync(path.resolve(root, "public/data/medicine-v3-reference.json"), "utf8"));
// Validation must use the same canonical coordinate space as construction,
// rather than raw CRLF/whitespace formatting from the public-domain TXT.
const sourceText = fs.readFileSync(path.resolve(root, "public/books/luxun-medicine-zh.txt"), "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
const issues = validateWorkPackage(workPackage, sourceText);
const selectedIds = new Set((workPackage.projection_records ?? []).filter((record: { reader_facing?: boolean }) => record.reader_facing).map((record: { target_id: string }) => record.target_id));
const skeletonIds = [
  ...(workPackage.reference_skeleton?.carrier_ids ?? []),
  ...(workPackage.reference_skeleton?.thread_ids ?? []),
  ...(workPackage.reference_skeleton?.structural_relation_ids ?? []),
];
const requiredStages = ["text_structuring", "narrative_backbone", "coreference_event_linking", "figurative_signals", "candidate_generation", "unr_assembly", "validation", "meaning_relevance_projection", "reference_skeleton"];
const stages = workPackage.construction_run?.stage_status ?? {};
const auditIssues = [
  ...(workPackage.package_status === "reference_ready" ? [] : ["Package is not frozen as reference_ready."]),
  ...requiredStages.filter((stage) => stages[stage] !== "complete").map((stage) => `Pipeline stage not complete: ${stage}`),
  ...skeletonIds.filter((id: string) => !selectedIds.has(id)).map((id: string) => `Skeleton object lacks reader-facing ProjectionRecord: ${id}`),
  ...(workPackage.validations?.every((record: { passed?: boolean }) => record.passed) ? [] : ["At least one generated validation record failed."]),
  ...(workPackage.mip_coverage?.candidate_count > 3 ? [] : ["Full-text MIP coverage inventory was not generated."]),
  ...(workPackage.mip_coverage?.reviewed_count === workPackage.mip_review_records?.length ? [] : ["MIP coverage accounting does not match review records."]),
];
if (issues.length || auditIssues.length) { console.error(JSON.stringify({ valid: false, issues, auditIssues }, null, 2)); process.exitCode = 1; }
else console.log(JSON.stringify({ valid: true, packageId: workPackage.package_id, checked: "v3 schema + exact source anchors + narrative links + grounding + projection/skeleton handoff", counts: workPackage.unr_manifest?.counts, validationRecords: workPackage.validations?.length }, null, 2));
