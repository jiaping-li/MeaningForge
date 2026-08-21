import { validateWorkPackage } from "./workPackageValidator.ts";
import { MEDICINE_PROTOCOL_VERSION, medicineProtocolCandidates, medicineProtocolChapterAnchors, medicineProtocolReaderPaths, medicineProtocolRelations } from "./medicineProtocol.ts";
import { spawnSync } from "node:child_process";
import path from "node:path";

type MipDraft = { lexical_unit?: unknown; contextual_meaning?: unknown; basic_meaning?: unknown; comparison?: unknown; decision?: unknown; review_status?: unknown };
type Calibration = { review_status?: unknown; rationale?: unknown };
type Candidate = { label?: unknown; type?: unknown; exact_quote?: unknown; reasons?: unknown; mip_record?: MipDraft; calibration?: Calibration };
type RelationCandidate = { source_label?: unknown; target_label?: unknown; type?: unknown; exact_quote?: unknown; rationale?: unknown; review_status?: unknown };
type MipReview = MipDraft & { coverage_candidate_id?: unknown; exact_quote?: unknown };
type SignalRecord = { id: string; work_id: string; span_ids: string[]; evidence_ids: string[]; surface_form?: string; type: string; mip_status: string; mip_record?: ReturnType<typeof mipRecord>; rationale: string; provenance_id: string; status: string };
export type MipCoverageCandidate = { id: string; lexical_unit: string; exact_quote: string; chapter_id: string; cue_types: string[] };

const structuralTypes = new Set(["recurs_with", "contrasts_with", "parallels", "co_occurs_with", "precedes", "follows", "changes_context", "changes_function", "shares_actor", "shares_scene", "causal_link", "consequence_link"]);
const stopWords = new Set(["我们", "他们", "这个", "那个", "自己", "什么", "没有", "已经", "因为", "所以", "一个", "一种", "这样", "如何", "还是", "但是", "然后", "如果", "不能", "可以", "不是", "时候", "地方", "出来", "进去", "起来", "的人", "的是", "了一", "不是", "说道", "说着", "看着", "走了", "没有人", "有了敌人"]);

function slug(value: string) { return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 36) || "work"; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function unique<T>(items: T[]) { return [...new Set(items)]; }
function mipRecord(value: unknown, quote: string, machineStatus: "machine_draft" | "machine_reviewed" = "machine_draft") {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as MipDraft;
  const lexical_unit = text(raw.lexical_unit); const contextual_meaning = text(raw.contextual_meaning);
  const basic_meaning = text(raw.basic_meaning); const comparison = text(raw.comparison);
  const decision = text(raw.decision);
  if (!lexical_unit || !quote.includes(lexical_unit) || !contextual_meaning || !basic_meaning || !comparison || !["metaphor_candidate", "literal", "undecidable"].includes(decision)) return undefined;
  // A material protocol may contain a documented researcher review. Model and
  // rule proposals never inherit that status: they remain explicit drafts.
  const requestedStatus = text(raw.review_status);
  const review_status = requestedStatus === "researcher_checked" ? "researcher_checked" as const : requestedStatus === "machine_draft" ? "machine_draft" as const : machineStatus;
  return { lexical_unit, contextual_meaning, basic_meaning, comparison, decision: decision as "metaphor_candidate" | "literal" | "undecidable", review_status };
}
function protocolCandidates(title: string) { return title.trim() === "药" ? medicineProtocolCandidates : []; }
function protocolRelations(title: string) { return title.trim() === "药" ? medicineProtocolRelations : []; }
function protocolReaderPaths(title: string) { return title.trim() === "药" ? medicineProtocolReaderPaths : []; }
function protocolChapterAnchors(title: string) { return title.trim() === "药" ? medicineProtocolChapterAnchors : []; }

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

/**
 * Exhaustive over *configured linguistic cues*, not a claim that every word
 * in a novel is metaphorical.  Each candidate preserves its whole sentence
 * so a later LLM MIP review cannot drift away from the source edition.
 */
export function extractMipCoverageCandidates(source: string, limit = 96): MipCoverageCandidate[] {
  const paragraphs = segment(source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim());
  const seen = new Set<string>(); const candidates: MipCoverageCandidate[] = [];
  const weakUnits = new Set(["但很", "一个", "许多", "一种", "这个", "那个", "似的", "一般", "样子", "时候"]);
  const candidateUnit = (value: string) => value.replace(/(?:一般|似的|一样)$/u, "").replace(/^(?:一|两|三|几|许多)?(?:把|个|片|层|只|条|种)/u, "").replace(/[正很太都也便却但地的得]$/u, "").trim().slice(-5);
  const add = (lexical_unit: string, exact_quote: string, chapter_id: string, cue: string) => {
    const unit = candidateUnit(lexical_unit);
    if (unit.length < 1 || unit.length > 8 || weakUnits.has(unit) || !exact_quote.includes(unit)) return;
    const key = `${unit}\u0000${exact_quote}`; if (seen.has(key)) return; seen.add(key);
    candidates.push({ id: `mip-coverage-${candidates.length + 1}`, lexical_unit: unit, exact_quote, chapter_id, cue_types: [cue] });
  };
  paragraphs.forEach((paragraph) => {
    const sentences = paragraph.text.match(/[^。！？!?\n]+[。！？!?]?/g) ?? [paragraph.text];
    sentences.forEach((sentence) => {
      const quote = sentence.trim(); if (!quote) return;
      // Chinese comparisons: capture the noun/adjective immediately before or
      // after a comparison marker. This includes 像、如、仿佛、宛然、一般、有如.
      for (const match of quote.matchAll(/([\u4e00-\u9fff]{1,8})(?:正)?(?:像|如同|仿佛|宛如|宛然|好比|有如)([\u4e00-\u9fff]{1,12})/g)) {
        const left = match[1]; const right = match[2];
        add(left.slice(-5), quote, paragraph.chapter, "comparison_marker");
        add(right.replace(/(?:一般|似的|一样).*$/u, "").split(/[的了]/u).at(-1) ?? right, quote, paragraph.chapter, "comparison_marker");
      }
      for (const match of quote.matchAll(/([\u4e00-\u9fff]{1,8})(?:一般|似的|一样)/g)) add(match[1].slice(-4), quote, paragraph.chapter, "comparison_suffix");
      // MIP-relevant anomaly / transfer cues. They deliberately generate
      // candidates for LLM review, not automatic metaphor labels.
      for (const match of quote.matchAll(/(?:无形的[\u4e00-\u9fff]{1,4}|死一般|铁铸|铜丝|两把刀|像刀一样)(?:[\u4e00-\u9fff]{0,4})/g)) add(match[0], quote, paragraph.chapter, "semantic_anomaly");
      // English comparisons make the route portable to the bundled texts.
      for (const match of quote.matchAll(/\b([A-Za-z][A-Za-z'-]{1,24})\s+(?:like|as)\s+(?:an?\s+|the\s+)?([A-Za-z][A-Za-z'-]{1,24})\b/gi)) { add(match[1], quote, paragraph.chapter, "comparison_marker"); add(match[2], quote, paragraph.chapter, "comparison_marker"); }
    });
  });
  // The order is source order; the cap is an explicit computational budget,
  // never a relevance ranking. Long works can raise MF_MIP_MAX_CANDIDATES.
  return candidates.slice(0, Math.max(1, limit));
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
  const maximum = Math.max(12, Math.min(Number(process.env.MF_STANZA_MAX_SPANS || 56), 120));
  const selected = spans.length <= maximum ? spans : Array.from({ length: maximum }, (_, index) => spans[Math.floor(index * (spans.length - 1) / (maximum - 1))]);
  const python = process.env.MF_STANZA_PYTHON || "python3";
  const result = spawnSync(python, [path.resolve(process.cwd(), "api/stanzaBridge.py")], { input: JSON.stringify({ language, spans: selected }), encoding: "utf8", timeout: 45_000, maxBuffer: 8 * 1024 * 1024 });
  try {
    const output = JSON.parse(result.stdout || "{}") as StanzaOutput;
    if (!output.ok) return { entities: [], events: [], used: false, note: output.error || "Traditional NLP executor returned no annotations." };
    const spanIds = new Set(spans.map((span) => span.id));
    return {
      entities: (output.entities ?? []).flatMap((item) => { const span_id = text(item.span_id); const surface_form = text(item.surface_form); return spanIds.has(span_id) && surface_form ? [{ span_id, surface_form, type: text(item.type) || "entity" }] : []; }),
      events: (output.events ?? []).flatMap((item) => { const span_id = text(item.span_id); const predicate = text(item.predicate); return spanIds.has(span_id) && predicate ? [{ span_id, predicate, participants: Array.isArray(item.participants) ? item.participants.filter((value): value is string => typeof value === "string") : [] }] : []; }),
      used: true, note: `Stanza token/POS/dependency/NER executor completed on ${selected.length}${spans.length > selected.length ? ` evenly distributed of ${spans.length}` : ""} source spans.`,
    };
  } catch { return { entities: [], events: [], used: false, note: "Traditional NLP executor returned invalid JSON." }; }
}

function narrativeBackbone(spans: Array<{ id: string; text: string; start_char: number; provenance_id: string }>) {
  const mentions: Array<{ id: string; span_id: string; surface_form: string; type: string; provenance_id: string; status: string; start_char?: number; end_char?: number; canonical_entity_id?: string; coreference_cluster_id?: string }> = [];
  const events: Array<{ id: string; span_id: string; predicate: string; participant_mention_ids: string[]; provenance_id: string; status: string; canonical_event_id?: string; coreference_cluster_id?: string }> = [];
  const entityEvidence = new Map<string, string[]>();
  const stanza = stanzaAnnotations(spans);
  const verbs = /说|道|问|答|看|走|来|去|吃|喝|哭|笑|坐|站|拿|放|打|叫|想|听|见|写|读/g;
  spans.forEach((span) => {
    const names = new Set<string>();
    for (const match of span.text.matchAll(/([\u4e00-\u9fff]{2,4})(?:说|道|问|答|先生|太太|姑娘|老爷)/g)) names.add(match[1]);
    for (const match of span.text.matchAll(/\b([A-Z][a-z]{2,})\b/g)) names.add(match[1]);
    const mentionIds: string[] = [];
    [...names].slice(0, 8).forEach((surface_form) => { const id = `mention-${mentions.length + 1}`; const local = span.text.indexOf(surface_form); mentions.push({ id, span_id: span.id, surface_form, type: "person_candidate", ...(local >= 0 ? { start_char: span.start_char + local, end_char: span.start_char + local + surface_form.length } : {}), provenance_id: span.provenance_id, status: "candidate" }); mentionIds.push(id); entityEvidence.set(surface_form, [...(entityEvidence.get(surface_form) ?? []), span.id]); });
    // Pronouns are stored as their own mentions. Resolution below is
    // deliberately conservative: an unresolved pronoun stays unresolved.
    for (const match of span.text.matchAll(/(?:他们|她们|它们|他|她|它)/g)) {
      const id = `mention-${mentions.length + 1}`;
      mentions.push({ id, span_id: span.id, surface_form: match[0], type: "pronoun_candidate", start_char: span.start_char + (match.index ?? 0), end_char: span.start_char + (match.index ?? 0) + match[0].length, provenance_id: span.provenance_id, status: "candidate" });
      mentionIds.push(id);
    }
    const predicates = [...new Set(Array.from(span.text.matchAll(verbs), (match) => match[0]))].slice(0, 5);
    predicates.forEach((predicate) => events.push({ id: `event-mention-${events.length + 1}`, span_id: span.id, predicate, participant_mention_ids: mentionIds, provenance_id: span.provenance_id, status: "candidate" }));
  });
  stanza.entities.forEach((item) => { const id = `mention-${mentions.length + 1}`; const provenance_id = "prov-stanza"; mentions.push({ id, span_id: item.span_id, surface_form: item.surface_form, type: item.type, provenance_id, status: "candidate" }); entityEvidence.set(item.surface_form, [...(entityEvidence.get(item.surface_form) ?? []), item.span_id]); });
  stanza.events.forEach((item) => events.push({ id: `event-mention-${events.length + 1}`, span_id: item.span_id, predicate: item.predicate, participant_mention_ids: mentions.filter((mention) => mention.span_id === item.span_id && item.participants.includes(mention.surface_form)).map((mention) => mention.id), provenance_id: "prov-stanza", status: "candidate" }));
  const pronouns = new Set(["他", "她", "它", "他们", "她们", "它们"]);
  const canonicalByLabel = new Map<string, string>();
  [...entityEvidence.keys()].forEach((label, index) => canonicalByLabel.set(label, `narrative-entity-${index + 1}`));
  let latestResolvableLabel = "";
  mentions.forEach((mention) => {
    if (!pronouns.has(mention.surface_form) && canonicalByLabel.has(mention.surface_form)) latestResolvableLabel = mention.surface_form;
    const label = pronouns.has(mention.surface_form) ? latestResolvableLabel : mention.surface_form;
    const canonical = canonicalByLabel.get(label);
    if (canonical) { mention.canonical_entity_id = canonical; mention.coreference_cluster_id = `cluster-${canonical}`; }
  });
  const entities = [...entityEvidence.entries()].map(([label, spanIds], index) => {
    const id = `narrative-entity-${index + 1}`;
    return { id, type: "person", label, canonical_label: label, mention_ids: mentions.filter((mention) => mention.canonical_entity_id === id).map((mention) => mention.id), evidence_ids: unique(spanIds.map((span_id) => `ev-${span_id}`)), provenance_id: "prov-narrative", status: "candidate" };
  });
  const canonicalEvents = new Map<string, typeof events>();
  events.forEach((event) => canonicalEvents.set(event.predicate, [...(canonicalEvents.get(event.predicate) ?? []), event]));
  const narrative_events = [...canonicalEvents.entries()].map(([label, linked], index) => {
    const id = `narrative-event-${index + 1}`;
    linked.forEach((event) => { event.canonical_event_id = id; event.coreference_cluster_id = `cluster-${id}`; });
    return { id, label, mention_ids: linked.map((event) => event.id), participant_entity_ids: unique(linked.flatMap((event) => event.participant_mention_ids.map((mentionId) => mentions.find((mention) => mention.id === mentionId)?.canonical_entity_id ?? "").filter(Boolean))), evidence_ids: unique(linked.map((event) => `ev-${event.span_id}`)), provenance_id: "prov-narrative", status: "candidate" };
  });
  const coreference_relations = mentions.flatMap((mention, index) => mention.canonical_entity_id ? [{ id: `nrel-coref-${index + 1}`, source_id: mention.id, target_id: mention.canonical_entity_id, type: "corefers_to", evidence_ids: [`ev-${mention.span_id}`], provenance_id: "prov-narrative", status: "candidate" }] : []);
  const event_relations = events.flatMap((event, index) => event.participant_mention_ids.flatMap((mentionId, participantIndex) => {
    const entityId = mentions.find((mention) => mention.id === mentionId)?.canonical_entity_id;
    return entityId ? [{ id: `nrel-participant-${index + 1}-${participantIndex + 1}`, source_id: event.id, target_id: entityId, type: "performed_by", evidence_ids: [`ev-${event.span_id}`], provenance_id: "prov-narrative", status: "candidate" }] : [];
  }));
  return { mentions, events, entities, narrative_events, narrative_relations: [...coreference_relations, ...event_relations], stanza };
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

export function buildWorkPackage(title: string, source: string, llm: { carriers?: Candidate[]; structural_relations?: RelationCandidate[]; mip_reviews?: MipReview[]; review_notes?: unknown[] } | undefined) {
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
    { id: "prov-medicine-protocol", method_basis: "MIP_MIPVU_INFORMED", executor_type: "HUMAN", method_note: `Bounded ${MEDICINE_PROTOCOL_VERSION} lexical/observable calibration records; exact source anchors and projection still run automatically.` },
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
  const mipCoverage = extractMipCoverageCandidates(clean, Math.min(Math.max(Number(process.env.MF_MIP_MAX_CANDIDATES || 96), 1), 240));
  const coverageById = new Map(mipCoverage.map((item) => [item.id, item]));
  const mip_review_records = (llm?.mip_reviews ?? []).flatMap((raw) => {
    const candidate = coverageById.get(text(raw.coverage_candidate_id));
    if (!candidate || text(raw.exact_quote) !== candidate.exact_quote) return [];
    const record = mipRecord(raw, candidate.exact_quote, "machine_reviewed");
    return record ? [{ id: `mip-review-${candidate.id}`, work_id: workId, coverage_candidate_id: candidate.id, ...record, lexical_unit: candidate.lexical_unit, exact_quote: candidate.exact_quote, chapter_id: candidate.chapter_id, cue_types: candidate.cue_types, provenance_id: "prov-llm", status: "machine_reviewed" }] : [];
  });
  const mipExecutor = !llm?.mip_reviews ? "not_run" as const : mip_review_records.length === mipCoverage.length && mip_review_records.every((record) => record.review_status === "machine_reviewed") ? "LLM" as const : "LLM_partial" as const;
  const candidates: Array<{ label: string; type: string; quote: string; reasons: string[]; executor: "DETERMINISTIC" | "LLM" | "HUMAN"; mip?: ReturnType<typeof mipRecord>; calibration?: Calibration }> = [];
  repeatedExpressions(paragraphs).forEach(([label]) => candidates.push({ label, type: "recurrent_expression", quote: label, reasons: ["observability", "recurrence", "cross_span_distribution"], executor: "DETERMINISTIC" }));
  protocolCandidates(safeTitle).forEach((raw) => {
    const label = raw.label; const quote = raw.exact_quote; const type = raw.type;
    const mip = type === "lexical_metaphor_candidate" ? mipRecord(raw.mip_record, quote) : undefined;
    if (!clean.includes(quote) || (type === "lexical_metaphor_candidate" && !mip) || candidates.some((item) => item.label === label)) return;
    candidates.push({ label, type, quote, reasons: [...raw.reasons], executor: "HUMAN", mip, calibration: "calibration" in raw ? raw.calibration : undefined });
  });
  // Only a review that explicitly concludes metaphor_candidate becomes a
  // figurative signal. literal and undecidable records remain in the audit
  // layer, so a negative MIP decision is never silently discarded.
  mip_review_records.filter((record) => record.decision === "metaphor_candidate").forEach((record) => {
    if (!candidates.some((item) => item.label === record.lexical_unit && item.quote === record.exact_quote)) candidates.push({ label: record.lexical_unit, type: "lexical_metaphor_candidate", quote: record.exact_quote, reasons: ["observability", "figurative_signal", "mip_fulltext_coverage"], executor: "LLM", mip: { lexical_unit: record.lexical_unit, contextual_meaning: record.contextual_meaning, basic_meaning: record.basic_meaning, comparison: record.comparison, decision: record.decision, review_status: record.review_status } });
  });
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
    // A bounded, source-anchored MIP record contributes a distinct
    // figurative-signal gate; otherwise high-frequency names would crowd all
    // lexical figurative candidates out of the initial scaffold.
    const score = reasons.length + Math.min(3, evidence_ids.length) + Math.min(2, chapterCount) + (item.mip ? 7 : 0) + (item.executor === "HUMAN" ? 3 : 0);
    return { ...item, reasons, evidence_ids, score };
  });
  // A controlled material's reviewed protocol records are never allowed to be
  // displaced by frequent character-name n-grams. Remaining slots use the
  // general gates, while short fragments and detected person labels stay in
  // the UNR as candidates rather than becoming initial reader-facing carriers.
  const protocolSelected = candidateItems.filter((item) => item.executor === "HUMAN");
  const narrativePersonLabels = new Set(backbone.entities.map((entity) => entity.label));
  const llmMipSelected = candidateItems.filter((item) => item.executor === "LLM" && item.type === "lexical_metaphor_candidate" && item.mip?.decision === "metaphor_candidate");
  const selected = safeTitle === "药"
    ? [...protocolSelected, ...llmMipSelected.filter((item) => !protocolSelected.some((protocol) => protocol.quote === item.quote || protocol.label === item.label))].slice(0, 8)
    : candidateItems.filter((item) => item.executor !== "HUMAN" && item.reasons.length >= 2 && !narrativePersonLabels.has(item.label) && item.label.length >= 3).sort((a, b) => b.score - a.score || b.evidence_ids.length - a.evidence_ids.length || b.label.length - a.label.length).slice(0, 8);
  const provenanceFor = (executor: "DETERMINISTIC" | "LLM" | "HUMAN") => executor === "LLM" ? "prov-llm" : executor === "HUMAN" ? "prov-medicine-protocol" : "prov-mip";
  const figurative_features = selected.map((item, index) => ({ id: `feature-${index + 1}`, work_id: workId, evidence_id: evidenceForQuote(item.quote)[0].id, surface_form: item.label, type: item.type === "lexical_metaphor_candidate" ? "metaphor_related" : item.type === "recurrent_expression" ? "recurrent_imagery" : "symbolic_object_candidate", mip_status: item.type === "lexical_metaphor_candidate" ? "applicable" : "not_applicable", ...(item.mip ? { mip_record: item.mip } : {}), ...(item.calibration ? { calibration: item.calibration } : {}), provenance_id: provenanceFor(item.executor), status: item.executor === "HUMAN" ? "researcher_checked" : "candidate" }));
  const carriers = selected.map((item, index) => ({ id: `carrier-${index + 1}`, work_id: workId, label: item.label, type: item.type === "lexical_metaphor_candidate" ? "conceptual_feature" : item.type, feature_ids: [figurative_features[index].id], evidence_ids: evidenceForQuote(item.quote).map((item) => item.id), selection_reasons: item.reasons, provenance_id: provenanceFor(item.executor), status: item.executor === "HUMAN" ? "researcher_checked" : "candidate" }));
  const carrierEntities = carriers.map((carrier, index) => ({ id: `carrier-context-${index + 1}`, work_id: workId, type: carrier.type === "object" ? "object" : carrier.type === "scene" ? "scene" : "discourse", label: carrier.label, evidence_ids: carrier.evidence_ids, provenance_id: carrier.provenance_id, status: "candidate" }));
  const narrative_entities = [...backbone.entities.map((entity) => ({ ...entity, work_id: workId })), ...carrierEntities];
  const carrierByLabel = new Map(carriers.map((item) => [item.label, item]));
  const narrative_relations = [
    ...backbone.narrative_relations,
    ...carrierEntities.slice(1).map((carrier, index) => ({ id: `nrel-carrier-${index + 1}`, work_id: workId, source_id: carrierEntities[index].id, target_id: carrier.id, type: "associated_with", evidence_ids: unique([...carriers[index].evidence_ids, ...carrier.evidence_ids]).slice(0, 3), provenance_id: "prov-structure", status: "candidate" })),
    ...backbone.narrative_events.slice(1).map((event, index) => ({ id: `nrel-event-${index + 1}`, work_id: workId, source_id: backbone.narrative_events[index].id, target_id: event.id, type: "precedes", evidence_ids: unique([...backbone.narrative_events[index].evidence_ids, ...event.evidence_ids]).slice(0, 3), provenance_id: "prov-narrative", status: "candidate" })),
  ];
  const proposedRelations = [...protocolRelations(safeTitle), ...(llm?.structural_relations ?? [])].flatMap((raw, index) => {
    const source = carrierByLabel.get(text(raw.source_label)); const target = carrierByLabel.get(text(raw.target_label)); const type = text(raw.type); const quote = text((raw as RelationCandidate).exact_quote);
    const protocolSource = text((raw as { source_quote?: unknown }).source_quote); const protocolTarget = text((raw as { target_quote?: unknown }).target_quote);
    const quotes = protocolSource && protocolTarget ? [protocolSource, protocolTarget] : [quote];
    if (!source || !target || source.id === target.id || !structuralTypes.has(type) || !quotes.every((value) => value && clean.includes(value))) return [];
    const evidenceIds = unique(quotes.flatMap((value) => evidenceForQuote(value).map((item) => item.id))); if (!evidenceIds.length) return [];
    const researcherChecked = text(raw.review_status) === "researcher_checked";
    return [{ id: `srel-llm-${index + 1}`, work_id: workId, source_id: source.id, target_id: target.id, type, evidence_ids: evidenceIds, rationale: text(raw.rationale) || "这是一条待检查的文本关系。", provenance_id: researcherChecked ? "prov-medicine-protocol" : "prov-llm", status: researcherChecked ? "researcher_checked" : "candidate", review_status: researcherChecked ? "researcher_checked" : "machine_reviewed" }];
  });
  const fallbackRelations = carriers.filter((carrier) => carrier.evidence_ids.length >= 2).map((carrier, index) => {
    const carrierIndex = carriers.findIndex((item) => item.id === carrier.id);
    return { id: `srel-repeat-${index + 1}`, work_id: workId, source_id: carrier.id, target_id: carrierEntities[carrierIndex].id, type: "recurs_with", evidence_ids: carrier.evidence_ids, rationale: `“${carrier.label}”在不同原文位置重复出现，值得回到原文检查其语境是否改变。`, provenance_id: "prov-structure", status: "candidate" };
  });
  // Projected MIP candidates should enter a navigable network rather than a
  // flat list. A shared Scene is an observable contextual relation, not a
  // claim that two images have the same meaning.
  const carrierIsMip = (carrier: typeof carriers[number]) => carrier.feature_ids.some((id) => figurative_features.find((feature) => feature.id === id)?.mip_record);
  const sceneRelations = carriers.flatMap((source, left) => carriers.slice(left + 1).flatMap((target) => {
    if (!carrierIsMip(source) || !carrierIsMip(target)) return [];
    const sharedScenes = context.scenes.filter((scene) => source.evidence_ids.some((id) => scene.evidence_ids.includes(id)) && target.evidence_ids.some((id) => scene.evidence_ids.includes(id)));
    if (!sharedScenes.length) return [];
    return [{ id: `srel-shared-scene-${source.id}-${target.id}`, work_id: workId, source_id: source.id, target_id: target.id, type: "shares_scene", evidence_ids: unique([...source.evidence_ids, ...target.evidence_ids]).slice(0, 4), rationale: `“${source.label}”与“${target.label}”均出现在${sharedScenes.map((scene) => scene.label).join("、")}的可回查证据中；该边只提示场景共现。`, provenance_id: "prov-structure", status: "candidate" }];
  })).slice(0, 12);
  // Projection is deliberately a reader-attention gate, not an interpretation
  // generator. Every admitted edge carries a bounded explanation of why it is
  // useful to inspect and what remains for the reader to decide.
  const structural_relations = [...proposedRelations, ...sceneRelations, ...fallbackRelations].slice(0, 20).map((relation) => {
    const source = carriers.find((carrier) => carrier.id === relation.source_id);
    const target = carriers.find((carrier) => carrier.id === relation.target_id);
    const sourceFeature = source && figurative_features.find((feature) => feature.id === source.feature_ids[0]);
    const targetFeature = target && figurative_features.find((feature) => feature.id === target.feature_ids[0]);
    const relationScenes = context.scenes.filter((scene) => relation.evidence_ids.some((id) => scene.evidence_ids.includes(id))).map((scene) => scene.label);
    const sharesBoundedScene = Boolean(source && target && context.scenes.some((scene) => source.evidence_ids.some((id) => scene.evidence_ids.includes(id)) && target.evidence_ids.some((id) => scene.evidence_ids.includes(id))));
    const signalLabels = unique([
      ...(sourceFeature?.mip_record ? ["MIP/MIPVU 词汇比较"] : []),
      ...(targetFeature?.mip_record ? ["MIP/MIPVU 词汇比较"] : []),
      ...(relation.type === "recurs_with" ? ["跨位置回返"] : []),
      ...(relation.type === "shares_scene" || relation.type === "co_occurs_with" ? ["可回查场景连接"] : []),
      ...(relation.type === "precedes" ? ["叙事先后位置"] : []),
    ]);
    const recurrence = relation.type === "recurs_with";
    const reviewed = "review_status" in relation && relation.review_status === "researcher_checked";
    const structuralImportance = reviewed ? "high" : relation.evidence_ids.length >= 2 ? "medium" : "low";
    const selectionReasons = unique([
      "精确原文锚定",
      ...signalLabels,
      ...(relationScenes.length ? ["处于可定位的叙事场景"] : []),
      ...(recurrence ? ["需要比较跨段语境"] : []),
      "可由读者保留、修改或拒绝",
    ]);
    const sourceSpans = relation.evidence_ids.flatMap((id) => evidence.find((item) => item.id === id)?.span_ids ?? []);
    return {
      ...relation,
      reader_metadata: {
        evidence_span_ids: unique(sourceSpans), signal_labels: signalLabels, narrative_context: relationScenes, recurrence,
        structural_importance: structuralImportance,
        uncertainty: reviewed ? "reviewed_observation" : "machine_candidate",
        selection_reasons: selectionReasons,
        relevance: recurrence ? "同一表达或物件跨位置出现，可能需要比较其语境是否变化。" : sharesBoundedScene ? "它把同一可定位场景中的两个细节放在一起，便于检查它们是否形成可比较的压力、姿态或对照。" : "它连接了两个有精确原文依据的位置，便于检查叙事先后、跨段变化或可见关系。",
        contestability: "这不是主题结论；关系的意义、强弱与是否保留由读者在原文中判断。",
        reader_trigger: "回到两处原文：比较它们的场景、叙事位置和作用，再决定这条连接是否值得纳入你的解释。",
      },
    };
  });
  const scaffold_paths = protocolReaderPaths(safeTitle).flatMap((raw) => {
    const node_ids = raw.node_labels.map((label) => carrierByLabel.get(label)?.id).filter((id): id is string => Boolean(id));
    const structural_relation_ids = raw.relation_pairs.map(([sourceLabel, targetLabel]) => structural_relations.find((relation) => relation.source_id === carrierByLabel.get(sourceLabel)?.id && relation.target_id === carrierByLabel.get(targetLabel)?.id)?.id).filter((id): id is string => Boolean(id));
    const evidence_ids = unique(structural_relation_ids.flatMap((id) => structural_relations.find((relation) => relation.id === id)?.evidence_ids ?? []));
    return node_ids.length >= 2 && structural_relation_ids.length ? [{ id: raw.id, label: raw.label, prompt: raw.prompt, node_ids, structural_relation_ids, evidence_ids, provenance_id: "prov-medicine-protocol", status: "researcher_checked" }] : [];
  });
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
  const figurative_signals: SignalRecord[] = candidateItems.map((item, index) => ({ id: `signal-${index + 1}`, work_id: workId, span_ids: evidenceForQuote(item.quote).flatMap((entry) => entry.span_ids), evidence_ids: evidenceForQuote(item.quote).map((entry) => entry.id), surface_form: item.label, type: item.type === "lexical_metaphor_candidate" ? "MIP_METAPHOR" : "RECURRENCE", mip_status: item.type === "lexical_metaphor_candidate" ? "applicable" : "not_applicable", ...(item.mip ? { mip_record: item.mip } : {}), rationale: item.type === "lexical_metaphor_candidate" ? "MIP/MIPVU-informed lexical candidate; retained for review." : "Exact repeated expression across source spans.", provenance_id: provenanceFor(item.executor), status: "grounding_validated" }));
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
    return { id: `candidate-carrier-${index + 1}`, work_id: workId, label: item.label, type: item.type === "lexical_metaphor_candidate" ? "conceptual_feature" : item.type, signal_ids: [`signal-${index + 1}`], evidence_ids, narrative_ids, selection_reasons: unique([...item.reasons, ...(narrative_ids.length ? ["narrative_salience"] : [])]).slice(0, 5), provenance_id: provenanceFor(item.executor), status: "grounding_validated" };
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
  const candidate_relations = [...structural_relations.map((relation) => ({ id: `candidate-${relation.id}`, work_id: workId, source_id: relation.source_id, target_id: relation.target_id, proposed_layer: "STRUCTURAL" as const, proposed_type: relation.type, evidence_ids: relation.evidence_ids, evidence_span_ids: relation.reader_metadata?.evidence_span_ids, figurative_signals: relation.reader_metadata?.signal_labels, narrative_context: relation.reader_metadata?.narrative_context, recurrence: relation.reader_metadata?.recurrence, structural_importance: relation.reader_metadata?.structural_importance, uncertainty: relation.reader_metadata?.uncertainty, selection_reasons: relation.reader_metadata?.selection_reasons, reader_trigger: relation.reader_metadata?.reader_trigger, signal_ids: carriers.filter((carrier) => carrier.id === relation.source_id).map((carrier) => `signal-${carriers.indexOf(carrier) + 1}`), rationale: relation.rationale, provenance_id: relation.provenance_id, status: "grounding_validated" })), ...candidateRelationsFromSignals, ...crossSpanAssociations.map((association, index) => ({ id: `candidate-relation-cross-span-${index + 1}`, work_id: workId, source_id: association.source_id, target_id: association.target_id, proposed_layer: "STRUCTURAL" as const, proposed_type: "shares_scene", evidence_ids: association.evidence_ids, evidence_span_ids: association.evidence_ids.flatMap((id) => evidence.find((item) => item.id === id)?.span_ids ?? []), figurative_signals: ["跨证据场景关联"], narrative_context: [], recurrence: false, structural_importance: "low" as const, uncertainty: "machine_candidate", selection_reasons: ["精确原文锚定", "跨位置关联", "可由读者复核"], reader_trigger: "回到两处原文，检查这种场景关联是否真的有助于你的解释。", signal_ids: [association.signal_id], rationale: "The two candidates occur in a shared narrative scene/event context; this is a checkable association, not an interpretive conclusion.", provenance_id: "prov-narrative", status: "grounding_validated" }))];
  const chapter_scaffolds = chapterIds.filter((chapter) => safeTitle !== "药" || ["一", "二", "三", "四"].includes(chapter)).map((chapter) => {
    const protocol = protocolChapterAnchors(safeTitle).find((item) => item.chapter === chapter);
    const anchors = protocol?.anchors.flatMap((anchor, index) => {
      const evidence_ids = evidenceForQuote(anchor.quote).map((item) => item.id);
      return evidence_ids.length ? [{ id: `context-${chapter}-${index + 1}`, type: anchor.type, label: anchor.label, evidence_ids, provenance_id: "prov-medicine-protocol", status: "researcher_checked" }] : [];
    }) ?? [];
    const fallbackAnchor = anchors.length ? [] : context.scenes.filter((scene) => scene.chapter_id === chapter).flatMap((scene, index) => scene.evidence_ids.length ? [{ id: `context-${chapter}-${index + 1}`, type: "scene" as const, label: scene.label, evidence_ids: scene.evidence_ids, provenance_id: scene.provenance_id, status: "grounding_validated" }] : []);
    const candidate_explorations = protocol?.candidates.flatMap((candidate, index) => {
      const evidence_ids = evidenceForQuote(candidate.quote).map((item) => item.id);
      const signal_ids = figurative_signals.filter((signal) => signal.evidence_ids.some((id) => evidence_ids.includes(id))).map((signal) => signal.id);
      return evidence_ids.length ? [{ id: `explore-${chapter}-${index + 1}`, label: candidate.label, type: "figurative_candidate", evidence_ids, signal_ids, uncertainty: candidate.uncertainty, prompt: candidate.prompt, provenance_id: "prov-medicine-protocol" }] : [];
    }) ?? [];
    const reference_relation_ids = structural_relations.filter((relation) => "review_status" in relation && relation.review_status === "researcher_checked" && relation.evidence_ids.some((id) => evidence.find((item) => item.id === id)?.span_ids.some((spanId) => text_spans.find((span) => span.id === spanId)?.chapter_id === chapter))).map((relation) => relation.id);
    return { chapter_id: chapter, context_anchors: [...anchors, ...fallbackAnchor], candidate_explorations, reference_relation_ids, reader_prompt: reference_relation_ids.length ? "先检查本节的语境锚点与参考关系，再决定哪些连接进入你的个人图层。" : "本节暂无严格参考关系；你可以从这些可回查语境锚点出发，选择文字创建自己的解释节点。", provenance_id: protocol ? "prov-medicine-protocol" : "prov-structure", status: protocol ? "researcher_checked" : "grounding_validated" };
  });
  const constructionRunId = `run-${Date.now()}`;
  const validations = [
    ...text_spans.map((span, index) => ({ id: `validation-span-${index + 1}`, work_id: workId, target_type: "TextSpan", target_id: span.id, validation_type: "source_anchor" as const, passed: clean.slice(span.start_char, span.end_char) === span.text, messages: ["Exact source offset reconstructed."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...backbone.mentions.map((mention, index) => ({ id: `validation-mention-${index + 1}`, work_id: workId, target_type: "EntityMention", target_id: mention.id, validation_type: "referential_integrity" as const, passed: Boolean(mention.canonical_entity_id) && (!mention.start_char || clean.slice(mention.start_char, mention.end_char) === mention.surface_form), messages: ["Mention has a canonical entity link; offsets are checked when supplied by the executor."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...backbone.events.map((event, index) => ({ id: `validation-event-${index + 1}`, work_id: workId, target_type: "EventMention", target_id: event.id, validation_type: "referential_integrity" as const, passed: Boolean(event.canonical_event_id) && event.participant_mention_ids.every((id) => backbone.mentions.some((mention) => mention.id === id)), messages: ["Event mention links to a canonical event and only known participant mentions."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...figurative_signals.map((signal, index) => ({ id: `validation-signal-${index + 1}`, work_id: workId, target_type: "FigurativeSignal", target_id: signal.id, validation_type: "grounding" as const, passed: signal.evidence_ids.length > 0, messages: ["Signal retains exact-source evidence."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...candidate_carriers.map((candidate, index) => ({ id: `validation-candidate-carrier-${index + 1}`, work_id: workId, target_type: "CandidateCarrier", target_id: candidate.id, validation_type: "grounding" as const, passed: candidate.signal_ids.length > 0 && candidate.evidence_ids.length > 0 && candidate.narrative_ids.length > 0, messages: ["Candidate carrier retains signal, evidence, and narrative-context links."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...candidate_relations.map((candidate, index) => ({ id: `validation-candidate-relation-${index + 1}`, work_id: workId, target_type: "CandidateRelation", target_id: candidate.id, validation_type: "grounding" as const, passed: candidate.evidence_ids.length > 0 && candidate.signal_ids.length > 0, messages: ["Candidate relation retains exact-source evidence and a typed signal route."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
    ...projection_records.map((record, index) => ({ id: `validation-projection-${index + 1}`, work_id: workId, target_type: "ProjectionRecord", target_id: record.id, validation_type: "rule" as const, passed: record.selection_reasons.length > 0 && Boolean(record.selection_rationale), messages: ["Projection state has fixed reasons and an inspectable rationale."], validator_version: "meaningforge-v3", created_at: new Date().toISOString() })),
  ];
  const unr_manifest = { id: `unr-${workId}`, work_id: workId, schema_version: "3", source_document_id: `source-${workId}`, counts: { text_spans: text_spans.length, evidence: evidence.length, entity_mentions: backbone.mentions.length, event_mentions: backbone.events.length, narrative_entities: narrative_entities.length, narrative_events: backbone.narrative_events.length, scenes: context.scenes.length, discourse_segments: context.discourse_segments.length, figurative_signals: figurative_signals.length, candidate_carriers: candidate_carriers.length, candidate_relations: candidate_relations.length }, construction_run_id: constructionRunId, validation_run_ids: validations.map((record) => record.id), created_at: new Date().toISOString() };
  const workPackage = {
    schema_version: "meaningforge-1.0", package_id: `${workId}-draft-${Date.now()}`, package_status: "draft", work: { id: workId, title: safeTitle, author: "导入文本", language: "zh", edition_id: "local-import", source_uri: "", status: "draft", chapter_markers: chapterIds.map((id) => ({ id, label: `第 ${id} 节`, marker: id })) },
    source_document: { id: `source-${workId}`, text: clean, provenance_id: "prov-direct" }, paragraphs: text_spans.map((span) => ({ id: span.paragraph_id, work_id: workId, order: span.order, chapter_id: span.chapter_id, text: span.text, start_char: span.start_char, end_char: span.end_char, provenance_id: span.provenance_id })), sentences, text_spans, evidence, entity_mentions: backbone.mentions, event_mentions: backbone.events, narrative_events: backbone.narrative_events, scenes: context.scenes, discourse_segments: context.discourse_segments, narrative_units: chapterIds.map((chapter, index) => ({ id: `unit-${index + 1}`, work_id: workId, order: index + 1, chapter_id: chapter, span_ids: text_spans.filter((span) => span.chapter_id === chapter).map((span) => span.id), summary: `第 ${chapter} 节`, provenance_id: "prov-direct" })), narrative_entities, narrative_relations, mip_coverage: { candidate_count: mipCoverage.length, reviewed_count: mip_review_records.length, executor: mipExecutor, candidates: mipCoverage }, mip_review_records,
    figurative_signals, candidate_carriers, candidate_relations, unr_manifest, validations, projection_run: { id: `projection-run-${workId}`, work_id: workId, protocol_version: "MeaningForge v7.3", source_unr_manifest_id: unr_manifest.id, projection_record_ids: projection_records.map((record) => record.id), created_at: new Date().toISOString() }, figurative_features, carriers, threads, structural_relations, interpretive_relations: [], probes: [], scaffold_paths, chapter_scaffolds, reference_skeleton: { id: `skeleton-${workId}`, work_id: workId, carrier_ids: carriers.map((carrier) => carrier.id), thread_ids: threads.map((thread) => thread.id), structural_relation_ids: structural_relations.map((relation) => relation.id), interpretive_relation_ids: [], provenance_id: "prov-structure" }, provenance, projection_records,
    construction_run: { protocol_version: "MeaningForge v7.3", stage_status: { text_structuring: "complete", narrative_backbone: "complete", coreference_event_linking: backbone.narrative_relations.length ? "complete" : "draft", figurative_signals: figurative_signals.some((signal) => signal.type === "MIP_METAPHOR") ? "complete" : "draft", candidate_generation: "complete", unr_assembly: "complete", validation: "complete", meaning_relevance_projection: "complete", reference_skeleton: "complete", reader_interpretive_layer: "skipped" }, validation_summary: sample.sampled ? `完整原文保留用于阅读；初始候选草稿从全书均匀抽取的 ${paragraphs.length} 段构建，后续可按章节扩展。` : "Typed UNR records, exact-text anchoring, referential integrity, and projection eligibility were checked." },
    preparation: { protocol: "MeaningForge substrate protocol v7.3", deterministic_pass: true, llm_review_used: Boolean(llm), review_notes: [...(Array.isArray(llm?.review_notes) ? llm?.review_notes.filter((item): item is string => typeof item === "string") : []), backbone.stanza.note, `MIP coverage: ${mipCoverage.length} source-anchored candidates; ${mip_review_records.length} structured LLM review records.`, ...(mip_review_records.length ? [] : ["MIP/MIPVU lexical coverage candidates were generated, but no semantic executor review ran; no automatic MIP decision is claimed."]), ...(sample.sampled ? [`Large-text draft: sampled ${paragraphs.length} of ${fullParagraphs.length} paragraphs for the initial candidate pass.`] : [])] },
  };
  const issues = validateWorkPackage(workPackage, clean);
  if (issues.length) throw new Error(`Prepared draft failed validation: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  return workPackage;
}
