import { validateWorkPackage } from "./workPackageValidator.ts";
import { spawnSync } from "node:child_process";
import path from "node:path";

type MipDraft = { lexical_unit?: unknown; contextual_meaning?: unknown; basic_meaning?: unknown; comparison?: unknown; decision?: unknown };
type Candidate = { label?: unknown; type?: unknown; exact_quote?: unknown; reasons?: unknown; mip_record?: MipDraft };
type RelationCandidate = { source_label?: unknown; target_label?: unknown; type?: unknown; exact_quote?: unknown; rationale?: unknown };
type SignalRecord = { id: string; work_id: string; span_ids: string[]; evidence_ids: string[]; surface_form?: string; type: string; mip_status: string; mip_record?: ReturnType<typeof mipRecord>; rationale: string; provenance_id: string; status: string };

const structuralTypes = new Set(["recurs_with", "contrasts_with", "parallels", "co_occurs_with", "precedes", "follows", "changes_context", "changes_function", "shares_actor", "shares_scene", "causal_link", "consequence_link"]);
const stopWords = new Set(["我们", "他们", "这个", "那个", "自己", "什么", "没有", "已经", "因为", "所以", "一个", "一种", "这样", "如何", "还是", "但是", "然后", "如果", "不能", "可以", "不是", "时候", "地方", "出来", "进去", "起来", "的人", "的是", "了一", "不是", "说道", "说着", "看着", "走了", "没有人", "有了敌人"]);

function slug(value: string) { return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 36) || "work"; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function unique<T>(items: T[]) { return [...new Set(items)]; }
function mipRecord(value: unknown, quote: string) {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as MipDraft;
  const lexical_unit = text(raw.lexical_unit); const contextual_meaning = text(raw.contextual_meaning);
  const basic_meaning = text(raw.basic_meaning); const comparison = text(raw.comparison);
  const decision = text(raw.decision);
  if (!lexical_unit || !quote.includes(lexical_unit) || !contextual_meaning || !basic_meaning || !comparison || !["metaphor_candidate", "literal", "undecidable"].includes(decision)) return undefined;
  return { lexical_unit, contextual_meaning, basic_meaning, comparison, decision: decision as "metaphor_candidate" | "literal" | "undecidable", review_status: "machine_draft" as const };
}

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
  // This is a first-pass *candidate* signal, not a full word-segmentation
  // engine. Bound its vocabulary so one unusually dense chapter cannot turn
  // the initial draft into an unbounded n-gram index.
  const maximumUniqueCandidates = 36_000;
  const occurrences = new Map<string, Set<number>>();
  paragraphs.forEach((paragraph, index) => {
    const seen = new Set<string>();
    const runs = paragraph.text.match(/[\u4e00-\u9fff]+/g) ?? [];
    runs.forEach((run) => {
      for (let width = 2; width <= Math.min(5, run.length); width += 1) for (let start = 0; start <= run.length - width; start += 1) {
        const value = run.slice(start, start + width);
        if (stopWords.has(value) || seen.has(value) || /^(的|了|着|是|有|在|不|一)/.test(value) || /(的|了|着|是|有|在|不)$/.test(value)) continue;
        seen.add(value);
        const positions = occurrences.get(value);
        if (positions) positions.add(index);
        else if (occurrences.size < maximumUniqueCandidates) occurrences.set(value, new Set([index]));
      }
    });
    // Keep the same recurrence route available for bundled English texts.
    // Single common words are deliberately excluded; this is a lexical
    // distribution cue, not a claim that repeated words are metaphors.
    const englishWords = paragraph.text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? [];
    englishWords.forEach((value) => {
      if (seen.has(value) || ["that", "this", "with", "from", "have", "were", "been", "they", "their", "would", "there", "which", "shall", "could", "should", "about"].includes(value)) return;
      seen.add(value); const positions = occurrences.get(value);
      if (positions) positions.add(index); else if (occurrences.size < maximumUniqueCandidates) occurrences.set(value, new Set([index]));
    });
  });
  const repeated = [...occurrences.entries()]
    .filter(([, indexes]) => indexes.size >= 2)
    .sort((a, b) => b[1].size - a[1].size || b[0].length - a[0].length)
    .slice(0, 480);
  // Keep maximal phrases: "人血馒头" suppresses partial fragments such as "人血".
  return repeated.filter(([candidate], index) => !repeated.slice(0, index).some(([stronger, positions]) => stronger.includes(candidate) && positions.size >= (occurrences.get(candidate)?.size ?? 0))).slice(0, 24);
}

function constructionSample(paragraphs: Array<{ text: string; chapter: string }>, maximum = 420, maximumChunkLength = 1_200) {
  // Some public-domain files encode an entire chapter as a single paragraph.
  // Sampling only the number of paragraphs therefore does not bound compute.
  // Chunk first, then take evenly distributed exact-source excerpts.
  const chunks = paragraphs.flatMap((paragraph) => {
    if (paragraph.text.length <= maximumChunkLength) return [paragraph];
    const result: Array<{ text: string; chapter: string }> = [];
    for (let start = 0; start < paragraph.text.length; start += maximumChunkLength) {
      // Validator text is whitespace-normalized at field boundaries; make the
      // stored chunk follow the same rule so offsets reconstruct exactly.
      const excerpt = paragraph.text.slice(start, start + maximumChunkLength).trim();
      if (excerpt) result.push({ ...paragraph, text: excerpt });
    }
    return result;
  });
  if (chunks.length <= maximum) return { paragraphs: chunks, sampled: chunks.length !== paragraphs.length };
  // The reader still receives the complete source text. This bounded,
  // evenly-spaced sample only prevents a first-pass candidate draft for a
  // multi-megabyte novel from becoming an unbounded n-gram computation.
  const selected = new Set<number>();
  for (let index = 0; index < maximum; index += 1) selected.add(Math.floor(index * (chunks.length - 1) / (maximum - 1)));
  return { paragraphs: chunks.filter((_, index) => selected.has(index)), sampled: true };
}

function sentenceRecords(spans: Array<{ id: string; text: string; start_char: number; provenance_id: string }>) {
  let order = 0;
  return spans.flatMap((span) => {
    let local = 0;
    return (span.text.match(/[^。！？!?\n]+[。！？!?]?/g) ?? [span.text]).map((value) => {
      const text = value.trim(); const start = span.text.indexOf(text, local); local = Math.max(local, start + text.length);
      return text ? { id: `sentence-${++order}`, paragraph_id: span.id, order, text, start_char: span.start_char + Math.max(0, start), end_char: span.start_char + Math.max(0, start) + text.length, provenance_id: span.provenance_id } : undefined;
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  });
}

type StanzaOutput = { ok?: boolean; entities?: Array<{ span_id?: unknown; surface_form?: unknown; type?: unknown }>; events?: Array<{ span_id?: unknown; predicate?: unknown; participants?: unknown }>; error?: string };
function stanzaAnnotations(spans: Array<{ id: string; text: string }>) {
  if (process.env.MF_ENABLE_STANZA !== "true") return { entities: [] as Array<{ span_id: string; surface_form: string; type: string }>, events: [] as Array<{ span_id: string; predicate: string; participants: string[] }>, used: false, note: "Traditional NLP executor disabled." };
  const language = spans.some((span) => /[\u4e00-\u9fff]/.test(span.text)) ? "zh-hans" : "en";
  const python = process.env.MF_STANZA_PYTHON || "python3";
  const result = spawnSync(python, [path.resolve(process.cwd(), "api/stanzaBridge.py")], { input: JSON.stringify({ language, spans: spans.slice(0, 420) }), encoding: "utf8", timeout: 45_000, maxBuffer: 8 * 1024 * 1024 });
  try {
    const output = JSON.parse(result.stdout || "{}") as StanzaOutput;
    if (!output.ok) return { entities: [], events: [], used: false, note: output.error || "Traditional NLP executor returned no annotations." };
    const spanIds = new Set(spans.map((span) => span.id));
    return {
      entities: (output.entities ?? []).flatMap((item) => { const span_id = text(item.span_id); const surface_form = text(item.surface_form); return spanIds.has(span_id) && surface_form ? [{ span_id, surface_form, type: text(item.type) || "entity" }] : []; }),
      events: (output.events ?? []).flatMap((item) => { const span_id = text(item.span_id); const predicate = text(item.predicate); return spanIds.has(span_id) && predicate ? [{ span_id, predicate, participants: Array.isArray(item.participants) ? item.participants.filter((value): value is string => typeof value === "string") : [] }] : []; }),
      used: true, note: "Stanza token/POS/dependency/NER executor completed.",
    };
  } catch { return { entities: [], events: [], used: false, note: "Traditional NLP executor returned invalid JSON." }; }
}

function narrativeBackbone(spans: Array<{ id: string; text: string; provenance_id: string }>) {
  const mentions: Array<{ id: string; span_id: string; surface_form: string; type: string; provenance_id: string; status: string }> = [];
  const events: Array<{ id: string; span_id: string; predicate: string; participant_mention_ids: string[]; provenance_id: string; status: string }> = [];
  const entityEvidence = new Map<string, string[]>();
  const stanza = stanzaAnnotations(spans);
  const verbs = /说|道|问|答|看|走|来|去|吃|喝|哭|笑|坐|站|拿|放|打|叫|想|听|见|写|读/g;
  spans.forEach((span) => {
    const names = new Set<string>();
    for (const match of span.text.matchAll(/([\u4e00-\u9fff]{2,4})(?:说|道|问|答|先生|太太|姑娘|老爷)/g)) names.add(match[1]);
    for (const match of span.text.matchAll(/\b([A-Z][a-z]{2,})\b/g)) names.add(match[1]);
    const mentionIds: string[] = [];
    [...names].slice(0, 8).forEach((surface_form) => { const id = `mention-${mentions.length + 1}`; mentions.push({ id, span_id: span.id, surface_form, type: "person_candidate", provenance_id: span.provenance_id, status: "candidate" }); mentionIds.push(id); entityEvidence.set(surface_form, [...(entityEvidence.get(surface_form) ?? []), span.id]); });
    const predicates = [...new Set(Array.from(span.text.matchAll(verbs), (match) => match[0]))].slice(0, 5);
    predicates.forEach((predicate) => events.push({ id: `event-mention-${events.length + 1}`, span_id: span.id, predicate, participant_mention_ids: mentionIds, provenance_id: span.provenance_id, status: "candidate" }));
  });
  stanza.entities.forEach((item) => { const id = `mention-${mentions.length + 1}`; const provenance_id = "prov-stanza"; mentions.push({ id, span_id: item.span_id, surface_form: item.surface_form, type: item.type, provenance_id, status: "candidate" }); entityEvidence.set(item.surface_form, [...(entityEvidence.get(item.surface_form) ?? []), item.span_id]); });
  stanza.events.forEach((item) => events.push({ id: `event-mention-${events.length + 1}`, span_id: item.span_id, predicate: item.predicate, participant_mention_ids: mentions.filter((mention) => mention.span_id === item.span_id && item.participants.includes(mention.surface_form)).map((mention) => mention.id), provenance_id: "prov-stanza", status: "candidate" }));
  const entities = [...entityEvidence.entries()].map(([label, spanIds], index) => ({ id: `narrative-entity-${index + 1}`, type: "person", label, evidence_ids: spanIds.map((span_id) => `ev-${span_id}`), provenance_id: "prov-narrative", status: "candidate" }));
  const canonicalEvents = new Map<string, typeof events>();
  events.forEach((event) => canonicalEvents.set(event.predicate, [...(canonicalEvents.get(event.predicate) ?? []), event]));
  const narrative_events = [...canonicalEvents.entries()].map(([label, linked], index) => ({ id: `narrative-event-${index + 1}`, label, mention_ids: linked.map((event) => event.id), evidence_ids: unique(linked.map((event) => `ev-${event.span_id}`)), provenance_id: "prov-narrative", status: "candidate" }));
  return { mentions, events, entities, narrative_events, stanza };
}

function contextualBackbone(spans: Array<{ id: string; chapter_id: string; text: string; provenance_id: string }>) {
  const byChapter = new Map<string, typeof spans>();
  spans.forEach((span) => byChapter.set(span.chapter_id, [...(byChapter.get(span.chapter_id) ?? []), span]));
  const scenes = [...byChapter.entries()].map(([chapter_id, members], index) => ({ id: `scene-${index + 1}`, chapter_id, span_ids: members.map((span) => span.id), evidence_ids: members.map((span) => `ev-${span.id}`), label: `第 ${chapter_id} 节场景`, provenance_id: "prov-narrative", status: "candidate" }));
  const discourse_segments = spans.map((span, index) => ({ id: `discourse-${index + 1}`, span_id: span.id, type: /[“”‘’\"']/.test(span.text) ? "dialogue" as const : "narration" as const, evidence_ids: [`ev-${span.id}`], provenance_id: "prov-narrative", status: "candidate" }));
  return { scenes, discourse_segments };
}

function structuralSignalSeeds(spans: Array<{ id: string; chapter_id: string; text: string }>) {
  const seeds: Array<{ type: "CONTRAST" | "JUXTAPOSITION" | "PARALLEL"; span_ids: string[]; rationale: string }> = [];
  const contrast = /(?:但是|但|然而|却|反而|不是.{0,24}而是|可是|不过|而|but|yet|however|rather)/i;
  spans.filter((span) => contrast.test(span.text)).slice(0, 12).forEach((span) => seeds.push({ type: "CONTRAST", span_ids: [span.id], rationale: "A fixed discourse-contrast cue occurs in this exact-source span; it is a structural candidate, not an interpretation." }));
  for (let index = 1; index < spans.length; index += 1) {
    const previous = spans[index - 1]; const current = spans[index];
    if (previous.chapter_id === current.chapter_id && previous.text.length > 40 && current.text.length > 40 && /[；：]/.test(`${previous.text.slice(-12)}${current.text.slice(0, 12)}`)) seeds.push({ type: "JUXTAPOSITION", span_ids: [previous.id, current.id], rationale: "Adjacent source spans form a punctuation-bounded juxtaposition candidate." });
  }
  return seeds.slice(0, 20);
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
    { id: "prov-narrative", method_basis: "NARRATIVE_RULE", executor_type: "DETERMINISTIC", method_note: "Conservative mention/event extraction; all results remain traceable candidates." },
    { id: "prov-stanza", method_basis: "NARRATIVE_RULE", executor_type: "TRADITIONAL_NLP", method_note: "Optional local Stanza token/POS/dependency/NER pass. Its outputs remain candidates and are independently source-anchored." },
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
  const sentences = sentenceRecords(text_spans);
  const backbone = narrativeBackbone(text_spans);
  const context = contextualBackbone(text_spans);
  const structuralSeeds = structuralSignalSeeds(text_spans);
  const evidenceForQuote = (quote: string) => evidence.filter((item) => item.span_ids.some((id) => text_spans.find((span) => span.id === id)?.text.includes(quote)));
  const candidates: Array<{ label: string; type: string; quote: string; reasons: string[]; executor: "DETERMINISTIC" | "LLM"; mip?: ReturnType<typeof mipRecord> }> = [];
  repeatedExpressions(paragraphs).forEach(([label]) => candidates.push({ label, type: "recurrent_expression", quote: label, reasons: ["observability", "recurrence", "cross_span_distribution"], executor: "DETERMINISTIC" }));
  (llm?.carriers ?? []).forEach((raw) => {
    const label = text(raw.label); const quote = text(raw.exact_quote); const type = text(raw.type);
    if (!label || !quote || !clean.includes(quote) || !["object", "action", "scene", "recurrent_expression", "sensory_image", "lexical_metaphor_candidate"].includes(type)) return;
    const mip = type === "lexical_metaphor_candidate" ? mipRecord(raw.mip_record, quote) : undefined;
    // A lexical-MIP candidate is not admitted without the auditable four-part
    // comparison record. This prevents a model label from masquerading as MIP.
    if (type === "lexical_metaphor_candidate" && !mip) return;
    if (!candidates.some((item) => item.label === label)) candidates.push({ label, type, quote, reasons: ["observability", "figurative_signal"], executor: "LLM", mip });
  });
  // Candidate generation and reader-facing projection are intentionally
  // separate. The UNR retains all grounded candidates; the initial skeleton
  // gets only a sparse, evidence-distributed subset.
  const candidateItems = candidates.filter((item) => evidenceForQuote(item.quote).length > 0).map((item) => {
    const evidence_ids = evidenceForQuote(item.quote).map((entry) => entry.id);
    const spanIds = evidenceForQuote(item.quote).flatMap((entry) => entry.span_ids);
    const chapterCount = new Set(spanIds.map((id) => text_spans.find((span) => span.id === id)?.chapter_id).filter(Boolean)).size;
    const narrativeHits = backbone.entities.some((entity) => entity.evidence_ids.some((id) => evidence_ids.includes(id))) || backbone.narrative_events.some((event) => event.evidence_ids.some((id) => evidence_ids.includes(id)));
    const structuralHits = structuralSeeds.some((seed) => seed.span_ids.some((id) => spanIds.includes(id)));
    const reasons = unique([...item.reasons, ...(evidence_ids.length >= 2 ? ["cross_span_distribution"] : []), ...(chapterCount >= 2 ? ["recurrence"] : []), ...(narrativeHits ? ["narrative_salience"] : []), ...(structuralHits ? ["relational_load"] : [])]);
    const score = reasons.length + Math.min(3, evidence_ids.length) + Math.min(2, chapterCount) + (item.mip ? 2 : 0);
    return { ...item, reasons, evidence_ids, score };
  });
  const selected = [...candidateItems].filter((item) => item.reasons.length >= 2).sort((a, b) => b.score - a.score || b.evidence_ids.length - a.evidence_ids.length || b.label.length - a.label.length).slice(0, 8);
  const figurative_features = selected.map((item, index) => ({ id: `feature-${index + 1}`, work_id: workId, evidence_id: evidenceForQuote(item.quote)[0].id, surface_form: item.label, type: item.type === "lexical_metaphor_candidate" ? "metaphor_related" : item.type === "recurrent_expression" ? "recurrent_imagery" : "symbolic_object_candidate", mip_status: item.type === "lexical_metaphor_candidate" ? "applicable" : "not_applicable", ...(item.mip ? { mip_record: item.mip } : {}), provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-mip", status: "candidate" }));
  const carriers = selected.map((item, index) => ({ id: `carrier-${index + 1}`, work_id: workId, label: item.label, type: item.type === "lexical_metaphor_candidate" ? "conceptual_feature" : item.type, feature_ids: [figurative_features[index].id], evidence_ids: evidenceForQuote(item.quote).map((item) => item.id), selection_reasons: item.reasons, provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-mip", status: "candidate" }));
  const carrierEntities = carriers.map((carrier, index) => ({ id: `carrier-context-${index + 1}`, work_id: workId, type: carrier.type === "object" ? "object" : carrier.type === "scene" ? "scene" : "discourse", label: carrier.label, evidence_ids: carrier.evidence_ids, provenance_id: carrier.provenance_id, status: "candidate" }));
  const narrative_entities = [...backbone.entities.map((entity) => ({ ...entity, work_id: workId })), ...carrierEntities];
  const carrierByLabel = new Map(carriers.map((item) => [item.label, item]));
  const narrative_relations = [
    ...carrierEntities.slice(1).map((carrier, index) => ({ id: `nrel-carrier-${index + 1}`, work_id: workId, source_id: carrierEntities[index].id, target_id: carrier.id, type: "associated_with", evidence_ids: unique([...carriers[index].evidence_ids, ...carrier.evidence_ids]).slice(0, 3), provenance_id: "prov-structure", status: "candidate" })),
    ...backbone.narrative_events.slice(1).map((event, index) => ({ id: `nrel-event-${index + 1}`, work_id: workId, source_id: backbone.narrative_events[index].id, target_id: event.id, type: "precedes", evidence_ids: unique([...backbone.narrative_events[index].evidence_ids, ...event.evidence_ids]).slice(0, 3), provenance_id: "prov-narrative", status: "candidate" })),
  ];
  const proposedRelations = (llm?.structural_relations ?? []).flatMap((raw, index) => {
    const source = carrierByLabel.get(text(raw.source_label)); const target = carrierByLabel.get(text(raw.target_label)); const type = text(raw.type); const quote = text(raw.exact_quote);
    if (!source || !target || source.id === target.id || !structuralTypes.has(type) || !quote || !clean.includes(quote)) return [];
    const evidenceIds = evidenceForQuote(quote).map((item) => item.id); if (!evidenceIds.length) return [];
    return [{ id: `srel-llm-${index + 1}`, work_id: workId, source_id: source.id, target_id: target.id, type, evidence_ids: evidenceIds, rationale: text(raw.rationale) || "这是一条待检查的文本关系。", provenance_id: "prov-llm", status: "candidate" }];
  });
  const fallbackRelations = carriers.filter((carrier) => carrier.evidence_ids.length >= 2).map((carrier, index) => ({ id: `srel-repeat-${index + 1}`, work_id: workId, source_id: carrier.id, target_id: carrierEntities[index].id, type: "recurs_with", evidence_ids: carrier.evidence_ids, rationale: `“${carrier.label}”在不同原文位置重复出现，值得回到原文检查其语境是否改变。`, provenance_id: "prov-structure", status: "candidate" }));
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
    selection_reasons: target_id.startsWith("carrier-") ? (carriers.find((carrier) => carrier.id === target_id)?.selection_reasons ?? ["grounding_quality", "reader_actionability"]) : target_id.startsWith("thread-") ? ["cross_span_distribution", "reader_actionability"] : ["relational_load", "grounding_quality"],
    selection_rationale: "Selected only after exact evidence grounding and fixed Meaning-Relevance Projection gates; this is a contestable reading aid, not a truth claim.",
    provenance_id: "prov-structure",
  }));
  const figurative_signals: SignalRecord[] = candidateItems.map((item, index) => ({ id: `signal-${index + 1}`, work_id: workId, span_ids: evidenceForQuote(item.quote).flatMap((entry) => entry.span_ids), evidence_ids: evidenceForQuote(item.quote).map((entry) => entry.id), surface_form: item.label, type: item.type === "lexical_metaphor_candidate" ? "MIP_METAPHOR" : "RECURRENCE", mip_status: item.type === "lexical_metaphor_candidate" ? "applicable" : "not_applicable", ...(item.mip ? { mip_record: item.mip } : {}), rationale: item.type === "lexical_metaphor_candidate" ? "MIP/MIPVU-informed lexical candidate; retained for review." : "Exact repeated expression across source spans.", provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-structure", status: "grounding_validated" }));
  figurative_signals.push(...structuralSeeds.map((seed, index) => ({ id: `signal-structural-${index + 1}`, work_id: workId, span_ids: seed.span_ids, evidence_ids: seed.span_ids.map((spanId) => `ev-${spanId}`), surface_form: undefined, type: seed.type, mip_status: "not_applicable" as const, rationale: seed.rationale, provenance_id: "prov-structure", status: "grounding_validated" })));
  const candidate_carriers = candidateItems.map((item, index) => {
    const evidence_ids = evidenceForQuote(item.quote).map((entry) => entry.id);
    const narrative_ids = unique([
      ...carrierEntities.filter((entity) => entity.label === item.label).map((entity) => entity.id),
      ...backbone.entities.filter((entity) => entity.evidence_ids.some((id) => evidence_ids.includes(id))).map((entity) => entity.id),
      ...backbone.narrative_events.filter((event) => event.evidence_ids.some((id) => evidence_ids.includes(id))).map((event) => event.id),
      ...context.scenes.filter((scene) => scene.evidence_ids.some((id) => evidence_ids.includes(id))).map((scene) => scene.id),
      ...context.discourse_segments.filter((segment) => segment.evidence_ids.some((id) => evidence_ids.includes(id))).map((segment) => segment.id),
    ]);
    return { id: `candidate-carrier-${index + 1}`, work_id: workId, label: item.label, type: item.type === "lexical_metaphor_candidate" ? "conceptual_feature" : item.type, signal_ids: [`signal-${index + 1}`], evidence_ids, narrative_ids, selection_reasons: unique([...item.reasons, ...(narrative_ids.length ? ["narrative_salience"] : [])]).slice(0, 4), provenance_id: item.executor === "LLM" ? "prov-llm" : "prov-structure", status: "grounding_validated" };
  });
  const crossSpanAssociations: Array<{ source_id: string; target_id: string; evidence_ids: string[]; signal_id: string }> = [];
  for (let left = 0; left < candidate_carriers.length; left += 1) for (let right = left + 1; right < candidate_carriers.length; right += 1) {
    if (crossSpanAssociations.length >= 12) break;
    const source = candidate_carriers[left]; const target = candidate_carriers[right];
    const sharedContext = source.narrative_ids.filter((id) => target.narrative_ids.includes(id) && (id.startsWith("scene-") || id.startsWith("narrative-event-")));
    if (!sharedContext.length) continue;
    const evidence_ids = unique([...source.evidence_ids, ...target.evidence_ids]).slice(0, 4);
    if (evidence_ids.length < 2) continue;
    const signal_id = `signal-cross-span-${crossSpanAssociations.length + 1}`;
    figurative_signals.push({ id: signal_id, work_id: workId, span_ids: evidence_ids.map((id) => id.replace(/^ev-/, "")), evidence_ids, type: "CROSS_SPAN_ASSOCIATION", mip_status: "not_applicable", rationale: `Two candidate carriers share a bounded narrative context (${sharedContext.slice(0, 2).join(", ")}) while remaining separately traceable to source evidence.`, provenance_id: "prov-narrative", status: "grounding_validated" });
    crossSpanAssociations.push({ source_id: source.id, target_id: target.id, evidence_ids, signal_id });
  }
  const selectedLabels = new Set(selected.map((item) => item.label));
  projection_records.push(...candidate_carriers.filter((candidate) => !selectedLabels.has(candidate.label)).map((candidate, index) => ({ id: `projection-excluded-${index + 1}`, target_id: candidate.id, target_type: "CandidateCarrier", projection_status: "excluded" as const, reader_facing: false, selection_reasons: ["grounding_quality"], selection_rationale: "Retained in the validated UNR but omitted from the initial sparse scaffold because it did not pass the relative cross-span/actionability threshold.", provenance_id: "prov-structure" })));
  const candidateRelationsFromSignals = structuralSeeds.flatMap((seed, index) => {
    const evidenceIds = seed.span_ids.map((spanId) => `ev-${spanId}`);
    const linked = candidate_carriers.filter((candidate) => candidate.evidence_ids.some((id) => evidenceIds.includes(id))).slice(0, 2);
    if (linked.length < 2) return [];
    return [{ id: `candidate-relation-signal-${index + 1}`, work_id: workId, source_id: linked[0].id, target_id: linked[1].id, proposed_layer: "STRUCTURAL" as const, proposed_type: seed.type === "CONTRAST" ? "contrasts_with" : seed.type === "PARALLEL" ? "parallels" : "co_occurs_with", evidence_ids: unique([...linked[0].evidence_ids.filter((id) => evidenceIds.includes(id)), ...linked[1].evidence_ids.filter((id) => evidenceIds.includes(id))]), signal_ids: [`signal-structural-${index + 1}`], rationale: seed.rationale, provenance_id: "prov-structure", status: "grounding_validated" }];
  });
  const candidate_relations = [...structural_relations.map((relation) => ({ id: `candidate-${relation.id}`, work_id: workId, source_id: relation.source_id, target_id: relation.target_id, proposed_layer: "STRUCTURAL" as const, proposed_type: relation.type, evidence_ids: relation.evidence_ids, signal_ids: carriers.filter((carrier) => carrier.id === relation.source_id).map((carrier) => `signal-${carriers.indexOf(carrier) + 1}`), rationale: relation.rationale, provenance_id: relation.provenance_id, status: "grounding_validated" })), ...candidateRelationsFromSignals, ...crossSpanAssociations.map((association, index) => ({ id: `candidate-relation-cross-span-${index + 1}`, work_id: workId, source_id: association.source_id, target_id: association.target_id, proposed_layer: "STRUCTURAL" as const, proposed_type: "shares_scene", evidence_ids: association.evidence_ids, signal_ids: [association.signal_id], rationale: "The two candidates occur in a shared narrative scene/event context; this is a checkable association, not an interpretive conclusion.", provenance_id: "prov-narrative", status: "grounding_validated" }))];
  const constructionRunId = `run-${Date.now()}`;
  const validations = [...text_spans.map((span, index) => ({ id: `validation-span-${index + 1}`, work_id: workId, target_type: "TextSpan", target_id: span.id, validation_type: "source_anchor" as const, passed: clean.slice(span.start_char, span.end_char) === span.text, messages: ["Exact source offset reconstructed."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })), ...figurative_signals.map((signal, index) => ({ id: `validation-signal-${index + 1}`, work_id: workId, target_type: "FigurativeSignal", target_id: signal.id, validation_type: "grounding" as const, passed: signal.evidence_ids.length > 0, messages: ["Signal retains exact-source evidence."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() }))];
  const unr_manifest = { id: `unr-${workId}`, work_id: workId, schema_version: "3", source_document_id: `source-${workId}`, counts: { text_spans: text_spans.length, evidence: evidence.length, entity_mentions: backbone.mentions.length, event_mentions: backbone.events.length, narrative_entities: narrative_entities.length, narrative_events: backbone.narrative_events.length, scenes: context.scenes.length, discourse_segments: context.discourse_segments.length, figurative_signals: figurative_signals.length, candidate_carriers: candidate_carriers.length, candidate_relations: candidate_relations.length }, construction_run_id: constructionRunId, validation_run_ids: validations.map((record) => record.id), created_at: new Date().toISOString() };
  const workPackage = {
    schema_version: "meaningforge-1.0", package_id: `${workId}-draft-${Date.now()}`, package_status: "draft", work: { id: workId, title: safeTitle, author: "导入文本", language: "zh", edition_id: "local-import", source_uri: "", status: "draft", chapter_markers: chapterIds.map((id) => ({ id, label: `第 ${id} 节`, marker: id })) },
    source_document: { id: `source-${workId}`, text: clean, provenance_id: "prov-direct" }, paragraphs: text_spans.map((span) => ({ id: span.paragraph_id, work_id: workId, order: span.order, chapter_id: span.chapter_id, text: span.text, start_char: span.start_char, end_char: span.end_char, provenance_id: span.provenance_id })), sentences, text_spans, evidence, entity_mentions: backbone.mentions, event_mentions: backbone.events, narrative_events: backbone.narrative_events, scenes: context.scenes, discourse_segments: context.discourse_segments, narrative_units: chapterIds.map((chapter, index) => ({ id: `unit-${index + 1}`, work_id: workId, order: index + 1, chapter_id: chapter, span_ids: text_spans.filter((span) => span.chapter_id === chapter).map((span) => span.id), summary: `第 ${chapter} 节`, provenance_id: "prov-direct" })), narrative_entities, narrative_relations,
    figurative_signals, candidate_carriers, candidate_relations, unr_manifest, validations, projection_run: { id: `projection-run-${workId}`, work_id: workId, protocol_version: "MeaningForge v7.3", source_unr_manifest_id: unr_manifest.id, projection_record_ids: projection_records.map((record) => record.id), created_at: new Date().toISOString() }, figurative_features, carriers, threads, structural_relations, interpretive_relations: [], probes: [], reference_skeleton: { id: `skeleton-${workId}`, work_id: workId, carrier_ids: carriers.map((carrier) => carrier.id), thread_ids: threads.map((thread) => thread.id), structural_relation_ids: structural_relations.map((relation) => relation.id), interpretive_relation_ids: [], provenance_id: "prov-structure" }, provenance, projection_records,
    construction_run: { protocol_version: "MeaningForge v7.3", stage_status: { text_structuring: "complete", narrative_backbone: backbone.stanza.used ? "complete" : "draft", figurative_signals: figurative_signals.some((signal) => signal.type === "MIP_METAPHOR") ? "complete" : "draft", candidate_generation: "complete", unr_assembly: "complete", validation: "complete", meaning_relevance_projection: "complete", reference_skeleton: "complete" }, validation_summary: sample.sampled ? `完整原文保留用于阅读；初始候选草稿从全书均匀抽取的 ${paragraphs.length} 段构建，后续可按章节扩展。` : "Typed UNR records, exact-text anchoring, referential integrity, and projection eligibility were checked." },
    preparation: { protocol: "MeaningForge substrate protocol v7.3", deterministic_pass: true, llm_review_used: Boolean(llm), review_notes: [...(Array.isArray(llm?.review_notes) ? llm?.review_notes.filter((item): item is string => typeof item === "string") : []), backbone.stanza.note, ...(figurative_signals.some((signal) => signal.type === "MIP_METAPHOR") ? [] : ["MIP/MIPVU lexical route has no configured semantic executor for this run; it remains explicitly draft rather than claimed complete."]), ...(sample.sampled ? [`Large-text draft: sampled ${paragraphs.length} of ${fullParagraphs.length} paragraphs for the initial candidate pass.`] : [])] },
  };
  const issues = validateWorkPackage(workPackage, clean);
  if (issues.length) throw new Error(`Prepared draft failed validation: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  return workPackage;
}
