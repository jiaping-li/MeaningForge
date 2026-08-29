import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildWorkPackage } from "./substratePreparation.ts";
import { validateWorkPackage } from "./workPackageValidator.ts";

// The controlled-study material is frozen deliberately, not whenever a reader
// opens it.  This makes the exact edition, protocol version, and validation
// result inspectable and prevents a later runtime change from silently
// changing the reference scaffold used in a study.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public/books/luxun-medicine-zh.txt");
const outputPath = path.join(root, "public/data/medicine-v3-reference.json");
const source = fs.readFileSync(sourcePath, "utf8");
const cleanSource = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
const reviewPath = process.env.MIP_REVIEWS_FILE;
const reviewPayload = reviewPath ? JSON.parse(fs.readFileSync(reviewPath, "utf8")) as { mip_reviews?: unknown } : undefined;
const mip_reviews = Array.isArray(reviewPayload?.mip_reviews) ? reviewPayload.mip_reviews : undefined;
const workPackage = buildWorkPackage("药", source, mip_reviews ? { mip_reviews, review_notes: [`Imported ${mip_reviews.length} structured LLM MIP review records from ${path.basename(reviewPath!)}`] } : undefined);

workPackage.package_id = "medicine-v3-reference";
workPackage.package_status = "reference_ready";
workPackage.work = { ...workPackage.work, author: "鲁迅", source_uri: "/books/luxun-medicine-zh.txt", status: "reference_ready" };
const sourceChecksum = `sha256:${createHash("sha256").update(cleanSource).digest("hex")}`;
Object.assign(workPackage.source_document!, { checksum: sourceChecksum });
Object.assign(workPackage.construction_run!, {
  frozen_at: new Date().toISOString(),
  validation_summary: `${workPackage.construction_run?.validation_summary} Frozen controlled-material package validated against sha256 source edition.`,
});
workPackage.preparation = {
  ...workPackage.preparation!,
  review_notes: [...workPackage.preparation!.review_notes, "Medicine calibration candidates are bounded human-reviewed protocol inputs; all downstream UNR, validation, and projection records were regenerated from the exact frozen source."],
};

const issues = validateWorkPackage(workPackage as unknown as Record<string, unknown>, cleanSource);
if (issues.length) throw new Error(`Refusing to freeze invalid Medicine reference: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
fs.writeFileSync(outputPath, `${JSON.stringify(workPackage, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath, package_id: workPackage.package_id, source_checksum: sourceChecksum, mip_reviews: mip_reviews?.length ?? 0, unr: workPackage.unr_manifest?.counts, validation_records: workPackage.validations?.length }, null, 2));
