import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateWorkPackage } from "./workPackageValidator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/data/study-materials-v1.json"), "utf8")) as { materials: Array<Record<string, unknown>> };
const report = manifest.materials.map((material) => {
  if (material.status !== "ready") return { material_id: material.material_id, status: material.status, eligible: false, reason: material.blocking_reason };
  const packagePath = path.join(root, "public", String(material.package_url).replace(/^\//, ""));
  const sourcePath = path.join(root, "public", String(material.source_url).replace(/^\//, ""));
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")) as Record<string, unknown>;
  const source = fs.readFileSync(sourcePath, "utf8");
  const clean = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
  const checksum = `sha256:${createHash("sha256").update(clean).digest("hex")}`;
  const issues = validateWorkPackage(pkg, clean);
  const graph = pkg.narrative_graph as { nodes?: unknown[]; edges?: unknown[] } | undefined;
  const scaffolds = Array.isArray(pkg.chapter_scaffolds) ? pkg.chapter_scaffolds as Array<{ chapter_id: string; candidate_explorations?: unknown[] }> : [];
  const errors = [
    ...(pkg.package_id !== material.material_id ? ["package_id与材料清单不一致"] : []),
    ...(pkg.package_status !== "reference_ready" ? ["package_status不是reference_ready"] : []),
    ...(checksum !== material.source_checksum ? ["源文checksum与材料清单不一致"] : []),
    ...(!graph?.nodes?.length || !graph.edges?.length ? ["缺少校准叙事图"] : []),
    ...(scaffolds.some((item) => (item.candidate_explorations?.length ?? 0) < 3) ? ["至少一个正文章节少于3条校准候选"] : []),
    ...issues.map((issue) => `${issue.path}: ${issue.message}`),
  ];
  return { material_id: material.material_id, status: material.status, eligible: errors.length === 0, source_checksum: checksum, text_spans: Array.isArray(pkg.text_spans) ? pkg.text_spans.length : 0, narrative_nodes: graph?.nodes?.length ?? 0, narrative_edges: graph?.edges?.length ?? 0, candidate_counts: scaffolds.map((item) => ({ chapter_id: item.chapter_id, count: item.candidate_explorations?.length ?? 0 })), errors };
});

console.log(JSON.stringify({ schema_version: "meaningforge-study-material-validation-1.0", report }, null, 2));
if (report.some((item) => item.status === "ready" && !item.eligible)) process.exitCode = 1;
