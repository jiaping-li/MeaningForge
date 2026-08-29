import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWorkPackage, extractMipCoverageCandidates } from "./substratePreparation.ts";
import { validateWorkPackage } from "./workPackageValidator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = [
  ["药", "public/books/luxun-medicine-zh.txt"],
  ["祝福", "public/books/luxun-blessing-zh.txt"],
  ["Hamlet", "public/books/hamlet.txt"],
] as const;

const results = fixtures.map(([title, relative]) => {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const coverage = extractMipCoverageCandidates(source);
  if (!coverage.length) throw new Error(`${title}: expected source-anchored MIP coverage candidates.`);
  // A deterministic mock proves the review-record contract and validation
  // path without asserting that these decisions are literary judgments.
  const mip_reviews = coverage.map((candidate, index) => ({
    coverage_candidate_id: candidate.id, lexical_unit: candidate.lexical_unit, exact_quote: candidate.exact_quote,
    contextual_meaning: "Test-only contextual meaning record.", basic_meaning: "Test-only basic meaning record.", comparison: "Test-only comparison record.",
    decision: index % 3 === 0 ? "metaphor_candidate" : index % 3 === 1 ? "literal" : "undecidable",
  }));
  const workPackage = buildWorkPackage(title, source, { mip_reviews });
  const issues = validateWorkPackage(workPackage as unknown as Record<string, unknown>, workPackage.source_document?.text);
  if (issues.length || workPackage.mip_review_records?.length !== coverage.length) throw new Error(`${title}: coverage review contract failed: ${JSON.stringify(issues)}`);
  return { title, coverage: coverage.length, reviewed: workPackage.mip_review_records.length, metaphor_candidates: workPackage.mip_review_records.filter((record) => record.decision === "metaphor_candidate").length };
});
console.log(JSON.stringify({ valid: true, results }, null, 2));
