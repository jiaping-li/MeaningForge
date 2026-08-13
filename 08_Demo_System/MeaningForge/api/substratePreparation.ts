import { validateWorkPackage } from "./workPackageValidator.ts";

type Candidate = { label?: unknown; type?: unknown; exact_quote?: unknown; reasons?: unknown };
type RelationCandidate = { source_label?: unknown; target_label?: unknown; type?: unknown; exact_quote?: unknown; rationale?: unknown };

const structuralTypes = new Set(["recurs_with", "contrasts_with", "parallels", "co_occurs_with", "precedes", "follows", "changes_context", "changes_function", "shares_actor", "shares_scene", "causal_link", "consequence_link"]);
const stopWords = new Set(["我们", "他们", "这个", "那个", "自己", "什么", "没有", "已经", "因为", "所以", "一个", "一种", "这样", "如何", "还是", "但是", "然后", "如果", "不能", "可以", "不是", "时候", "地方", "出来", "进去", "起来", "的人", "的是", "了一", "不是", "说道", "说着", "看着", "走了", "没有人", "有了敌人"]);

function slug(value: string) { return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 36) || "work"; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function unique<T>(items: T[]) { return [...new Set(items)]; }

function segment(source: string) {
  const lines = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const paragraphs: Array<{ text: string; chapter: string }> = [];
  let chapter = "1";
  let buffer: string[] = [];
  const flush = () => { const value = buffer.join("\n").trim(); if (value) paragraphs.push({ text: value, chapter }); buffer = []; };
  lines.forEach((line) => {
    const value = line.trim();
    const heading = /^(第[一二三四五六七八九十\d]+[章节回]|[一二三四五六七八九十]+)$/.test(value);
    if (heading) { flush(); chapter = value.replace(/^第/, "").replace(/[章节回]$/, "") || chapter; return; }
    if (!value) flush(); else buffer.push(value);
  });
  flush();
  // Texts without explicit chapters stay readable while receiving stable overview sections.
  return paragraphs.map((item, index) => ({ ...item, chapter: item.chapter === "1" ? String(Math.floor(index / 7) + 1) : item.chapter }));
}

function repeatedExpressions(paragraphs: Array<{ text: string; chapter: string }>) {
  const occurrences = new Map<string, number[]>();
  paragraphs.forEach((paragraph, index) => {
    const seen = new Set<string>();
    const runs = paragraph.text.match(/[\u4e00-\u9fff]+/g) ?? [];
    runs.forEach((run) => {
      for (let width = 2; width <= Math.min(5, run.length); width += 1) for (let start = 0; start <= run.length - width; start += 1) {
        const value = run.slice(start, start + width);
        if (stopWords.has(value) || seen.has(value) || /^(的|了|着|是|有|在|不|一)/.test(value) || /(的|了|着|是|有|在|不)$/.test(value)) continue;
        seen.add(value); occurrences.set(value, [...(occurrences.get(value) ?? []), index]);
      }
    });
  });
  const repeated = [...occurrences.entries()].filter(([, indexes]) => indexes.length >= 2).sort((a, b) => b[0].length - a[0].length || b[1].length - a[1].length);
  // Keep maximal phrases: "人血馒头" suppresses partial fragments such as "人血".
  return repeated.filter(([candidate], index) => !repeated.slice(0, index).some(([stronger, positions]) => stronger.includes(candidate) && positions.length >= (occurrences.get(candidate)?.length ?? 0))).slice(0, 10);
}

function constructionSample(paragraphs: Array<{ text: string; chapter: string }>, maximum = 720) {
  if (paragraphs.length <= maximum) return { paragraphs, sampled: false };
  // The reader still receives the complete source text. This bounded,
  // evenly-spaced sample only prevents a first-pass candidate draft for a
  // multi-megabyte novel from becoming an unbounded n-gram computation.
  const selected = new Set<number>();
  for (let index = 0; index < maximum; index += 1) selected.add(Math.floor(index * (paragraphs.length - 1) / (maximum - 1)));
  return { paragraphs: paragraphs.filter((_, index) => selected.has(index)), sampled: true };
}

export function buildWorkPackage(title: string, source: string, llm: { carriers?: Candidate[]; structural_relations?: RelationCandidate[]; review_notes?: unknown[] } | undefined) {
  // All source-dependent stages must use one canonical newline convention.
  // Browser-imported public-domain texts may arrive as CRLF, while paragraph
  // segmentation emits LF; comparing the two otherwise invalidates anchors.
  const clean = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
  const fullParagraphs = segment(clean);
  const sample = constructionSample(fullParagraphs);
  const paragraphs = sample.paragraphs;
  const safeTitle = title.trim() || "未命名文本";
  const workId = `work-${slug(safeTitle)}`;
  const provenance = [
    { id: "prov-direct", method_basis: "DIRECT_TEXT", executor_type: "DETERMINISTIC", method_note: "Stable segmentation and exact source spans." },
    { id: "prov-mip", method_basis: "MIP_MIPVU_INFORMED", executor_type: "DETERMINISTIC", method_note: "Candidate records follow a fixed contextual/basic-meaning comparison schema where applicable." },
    { id: "prov-structure", method_basis: "STRUCTURAL_RULE", executor_type: "DETERMINISTIC", method_note: "Only exact-source, fixed-taxonomy structural relations are retained." },
    { id: "prov-llm", method_basis: "MIP_MIPVU_INFORMED", executor_type: "LLM", model_name: process.env.OPENAI_MODEL ?? "local-llm", method_note: "LLM candidate proposal checked against fixed types and exact source text." },
  ];
  let searchFrom = 0;
  const text_spans = paragraphs.map((paragraph, index) => {
    const start_char = clean.indexOf(paragraph.text, searchFrom);
    if (start_char < 0) throw new Error(`Unable to anchor constructed paragraph ${index + 1} in the canonical source text.`);
    searchFrom = Math.max(searchFrom, start_char + paragraph.text.length);
    return { id: `span-${index + 1}`, work_id: workId, chapter_id: paragraph.chapter, paragraph_id: `p-${index + 1}`, order: index + 1, text: paragraph.text, start_char, end_char: start_char + paragraph.text.length, provenance_id: "prov-direct" };
  });
  const evidence = text_spans.map((span) => ({ id: `ev-${span.id}`, work_id: workId, span_ids: [span.id], type: "contextual_event", note: `第 ${span.chapter_id} 节原文`, provenance_id: "prov-direct", status: "candidate" }));
  const evidenceForQuote = (quote: string) => evidence.filter((item) => item.span_ids.some((id) => text_spans.find((span) => span.id === id)?.text.includes(quote)));
  const candidates: Array<{ label: string; type: string; quote: string; reasons: string[]; executor: "DETERMINISTIC" | "LLM" }> = [];
  repeatedExpressions(paragraphs).forEach(([label]) => candidates.push({ label, type: "recurrent_expression", quote: label, reasons: ["observability", "recurrence_distribution"], executor: "DETERMINISTIC" }));
  (llm?.carriers ?? []).forEach((raw) => {
    const label = text(raw.label); const quote = text(raw.exact_quote); const type = text(raw.type);
    if (!label || !quote || !clean.includes(quote) || !["object", "action", "scene", "recurrent_expression", "sensory_image", "lexical_metaphor_candidate"].includes(type)) return;
    if (!candidates.some((item) => item.label === label)) candidates.push({ label, type, quote, reasons: ["observability", "relational_load"], executor: "LLM" });
  });
  const selected = candidates.filter((item) => evidenceForQuote(item.quote).length > 0).slice(0, 12);
  const figurative_features = selected.map((item, index) => ({ id: `feature-${index + 1}`, work_id: workId, evidence_id: evidenceForQuote(item.quote)[0].id, surface_form: item.label, type: item.type === "lexical_metaphor_candidate" ? "metaphor_related" : item.type === "recurrent_expression" ? "recurrent_imagery" : "symbolic_object_candidate", mip_status: item.type === "lexical_metaphor_candidate" ? "uncertain" : "not_applicable", provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-mip", status: "candidate" }));
  const carriers = selected.map((item, index) => ({ id: `carrier-${index + 1}`, work_id: workId, label: item.label, type: item.type === "lexical_metaphor_candidate" ? "conceptual_feature" : item.type, feature_ids: [figurative_features[index].id], evidence_ids: evidenceForQuote(item.quote).map((item) => item.id), selection_reasons: item.reasons, provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-mip", status: "candidate" }));
  const narrative_entities = carriers.map((carrier, index) => ({ id: `entity-${index + 1}`, work_id: workId, type: carrier.type === "object" ? "object" : carrier.type === "scene" ? "scene" : "discourse", label: carrier.label, evidence_ids: carrier.evidence_ids, provenance_id: carrier.provenance_id }));
  const carrierByLabel = new Map(carriers.map((item) => [item.label, item]));
  const narrative_relations = carriers.slice(1).map((carrier, index) => ({ id: `nrel-${index + 1}`, work_id: workId, source_id: narrative_entities[index].id, target_id: narrative_entities[index + 1].id, type: "associated_with", evidence_ids: unique([...carriers[index].evidence_ids, ...carrier.evidence_ids]).slice(0, 3), provenance_id: "prov-structure", status: "candidate" }));
  const proposedRelations = (llm?.structural_relations ?? []).flatMap((raw, index) => {
    const source = carrierByLabel.get(text(raw.source_label)); const target = carrierByLabel.get(text(raw.target_label)); const type = text(raw.type); const quote = text(raw.exact_quote);
    if (!source || !target || source.id === target.id || !structuralTypes.has(type) || !quote || !clean.includes(quote)) return [];
    const evidenceIds = evidenceForQuote(quote).map((item) => item.id); if (!evidenceIds.length) return [];
    return [{ id: `srel-llm-${index + 1}`, work_id: workId, source_id: source.id, target_id: target.id, type, evidence_ids: evidenceIds, rationale: text(raw.rationale) || "这是一条待检查的文本关系。", provenance_id: "prov-llm", status: "candidate" }];
  });
  const fallbackRelations = carriers.filter((carrier) => carrier.evidence_ids.length >= 2).map((carrier, index) => ({ id: `srel-repeat-${index + 1}`, work_id: workId, source_id: carrier.id, target_id: narrative_entities[index].id, type: "recurs_with", evidence_ids: carrier.evidence_ids, rationale: `“${carrier.label}”在不同原文位置重复出现，值得回到原文检查其语境是否改变。`, provenance_id: "prov-structure", status: "candidate" }));
  const structural_relations = [...proposedRelations, ...fallbackRelations].slice(0, 20);
  const threads = carriers.map((carrier, index) => {
    const structural = structural_relations.filter((relation) => relation.source_id === carrier.id || relation.target_id === carrier.id);
    const chapters = unique(carrier.evidence_ids.flatMap((id) => evidence.find((item) => item.id === id)?.span_ids.map((spanId) => text_spans.find((span) => span.id === spanId)?.chapter_id ?? "") ?? []).filter(Boolean));
    return { id: `thread-${index + 1}`, work_id: workId, neutral_label: carrier.label, carrier_ids: [carrier.id], feature_ids: [figurative_features[index].id], evidence_ids: carrier.evidence_ids, structural_relation_ids: structural.map((item) => item.id), interpretive_relation_ids: [], distribution: { chapter_ids: chapters, span_orders: carrier.evidence_ids.map((id) => text_spans.find((span) => span.id === evidence.find((item) => item.id === id)?.span_ids[0])?.order ?? 0).filter(Boolean) }, provenance_id: carrier.provenance_id, status: "candidate" };
  });
  const chapterIds = unique(text_spans.map((span) => span.chapter_id));
  const selectedIds = [...carriers.map((item) => item.id), ...threads.map((item) => item.id), ...structural_relations.map((item) => item.id)];
  const projection_records = selectedIds.map((target_id, index) => ({
    id: `projection-${index + 1}`,
    target_id,
    target_type: target_id.startsWith("carrier-") ? "Carrier" : target_id.startsWith("thread-") ? "FigurativeThread" : "StructuralRelation",
    projection_status: "selected",
    reader_facing: true,
    selection_reasons: target_id.startsWith("carrier-") ? ["grounded_evidence", "reader_actionability"] : ["grounded_evidence", "relational_utility"],
    selection_rationale: "Selected by fixed Meaning-Relevance Projection gates; this is a contestable reading aid, not a truth claim.",
    provenance_id: "prov-structure",
  }));
  const workPackage = {
    schema_version: "meaningforge-1.0", package_id: `${workId}-draft-${Date.now()}`, package_status: "draft", work: { id: workId, title: safeTitle, author: "导入文本", language: "zh", edition_id: "local-import", source_uri: "", status: "draft", chapter_markers: chapterIds.map((id) => ({ id, label: `第 ${id} 节`, marker: id })) },
    text_spans, evidence, narrative_units: chapterIds.map((chapter, index) => ({ id: `unit-${index + 1}`, work_id: workId, order: index + 1, chapter_id: chapter, span_ids: text_spans.filter((span) => span.chapter_id === chapter).map((span) => span.id), summary: `第 ${chapter} 节`, provenance_id: "prov-direct" })), narrative_entities, narrative_relations,
    figurative_features, carriers, threads, structural_relations, interpretive_relations: [], probes: [], provenance, projection_records,
    construction_run: { protocol_version: "MeaningForge v7.3", stage_status: { text_structuring: "complete", narrative_backbone: "draft", figurative_signals: "complete", candidate_generation: "complete", unr_assembly: "complete", validation: "complete", meaning_relevance_projection: "complete", reference_skeleton: "complete" }, validation_summary: sample.sampled ? `完整原文保留用于阅读；初始候选草稿从全书均匀抽取的 ${paragraphs.length} 段构建，后续可按章节扩展。` : "Schema, exact-text anchoring, referential integrity, and projection eligibility were checked." },
    preparation: { protocol: "MeaningForge substrate protocol v7.3", deterministic_pass: true, llm_review_used: Boolean(llm), review_notes: [...(Array.isArray(llm?.review_notes) ? llm?.review_notes.filter((item): item is string => typeof item === "string") : []), ...(sample.sampled ? [`Large-text draft: sampled ${paragraphs.length} of ${fullParagraphs.length} paragraphs for the initial candidate pass.`] : [])] },
  };
  const issues = validateWorkPackage(workPackage, clean);
  if (issues.length) throw new Error(`Prepared draft failed validation: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  return workPackage;
}
