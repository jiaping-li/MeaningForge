export interface ValidationIssue {
  path: string;
  message: string;
}

type Item = Record<string, unknown>;
type Package = Record<string, unknown>;

const requiredCollections = [
  "text_spans", "evidence", "narrative_units", "narrative_entities", "narrative_relations",
  "figurative_features", "carriers", "threads", "structural_relations", "interpretive_relations", "probes", "provenance",
];
const structuralTypes = new Set(["recurs_with", "contrasts_with", "parallels", "co_occurs_with", "precedes", "follows", "changes_context", "changes_function", "shares_actor", "shares_scene", "causal_link", "consequence_link"]);
const interpretiveTypes = new Set(["supports", "complicates", "weakens", "qualifies", "possible_implication", "alternative_to", "reframes"]);
const methodBases = new Set(["DIRECT_TEXT", "MIP_MIPVU_INFORMED", "NARRATIVE_RULE", "STRUCTURAL_RULE", "SCHOLARSHIP", "REFERENCE_INTERPRETIVE_PROTOCOL", "READER_REASONING"]);
const executorTypes = new Set(["DETERMINISTIC", "TRADITIONAL_NLP", "LLM", "HUMAN", "IMPORTED", "READER"]);

function items(value: unknown): Item[] { return Array.isArray(value) ? value.filter((item): item is Item => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : []; }
function ids(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : []; }
function stringValue(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

function checkReferences(issues: ValidationIssue[], path: string, references: string[], known: Set<string>) {
  references.forEach((reference, index) => { if (!known.has(reference)) issues.push({ path: `${path}[${index}]`, message: `Unknown ID: ${reference}` }); });
}

export function validateWorkPackage(workPackage: Package, sourceText?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (workPackage.schema_version !== "meaningforge-1.0") issues.push({ path: "schema_version", message: "Expected meaningforge-1.0." });
  if (!stringValue(workPackage.package_id)) issues.push({ path: "package_id", message: "Required." });
  if (!workPackage.work || typeof workPackage.work !== "object") issues.push({ path: "work", message: "Required work object." });
  requiredCollections.forEach((key) => { if (!Array.isArray(workPackage[key])) issues.push({ path: key, message: "Must be an array." }); });
  if (issues.length) return issues;

  const collections = Object.fromEntries(requiredCollections.map((key) => [key, items(workPackage[key])])) as Record<string, Item[]>;
  const allIds = new Set<string>();
  Object.entries(collections).forEach(([collection, records]) => records.forEach((record, index) => {
    const id = stringValue(record.id);
    if (!id) issues.push({ path: `${collection}[${index}].id`, message: "Required." });
    else if (allIds.has(id)) issues.push({ path: `${collection}[${index}].id`, message: `Duplicate ID: ${id}` });
    else allIds.add(id);
    if (collection !== "provenance" && !stringValue(record.provenance_id)) issues.push({ path: `${collection}[${index}].provenance_id`, message: "Required for reference records." });
  }));
  const provenanceIds = new Set(collections.provenance.map((record) => stringValue(record.id)));
  collections.provenance.forEach((record, index) => {
    if (!methodBases.has(stringValue(record.method_basis))) issues.push({ path: `provenance[${index}].method_basis`, message: "Invalid or missing method basis." });
    if (!executorTypes.has(stringValue(record.executor_type))) issues.push({ path: `provenance[${index}].executor_type`, message: "Invalid or missing executor type." });
  });
  Object.entries(collections).filter(([key]) => key !== "provenance").forEach(([collection, records]) => records.forEach((record, index) => {
    const provenanceId = stringValue(record.provenance_id);
    if (provenanceId && !provenanceIds.has(provenanceId)) issues.push({ path: `${collection}[${index}].provenance_id`, message: `Unknown provenance: ${provenanceId}` });
  }));

  const spanIds = new Set(collections.text_spans.map((record) => stringValue(record.id)));
  collections.text_spans.forEach((span, index) => {
    const text = stringValue(span.text);
    if (!text) issues.push({ path: `text_spans[${index}].text`, message: "TextSpan needs source text." });
    if (sourceText && text && !sourceText.includes(text)) issues.push({ path: `text_spans[${index}].text`, message: "TextSpan does not occur verbatim in the frozen source edition." });
    if (typeof span.start_char === "number" || typeof span.end_char === "number") {
      if (typeof span.start_char !== "number" || typeof span.end_char !== "number" || span.start_char < 0 || span.end_char < span.start_char) issues.push({ path: `text_spans[${index}].offsets`, message: "TextSpan offsets must be a non-negative ordered pair." });
      else if (sourceText && sourceText.slice(span.start_char, span.end_char) !== text) issues.push({ path: `text_spans[${index}].offsets`, message: "TextSpan offsets do not reconstruct its exact text." });
    }
  });
  const evidenceIds = new Set(collections.evidence.map((record) => stringValue(record.id)));
  collections.evidence.forEach((record, index) => {
    const references = ids(record.span_ids);
    if (!references.length) issues.push({ path: `evidence[${index}].span_ids`, message: "Evidence requires at least one TextSpan." });
    checkReferences(issues, `evidence[${index}].span_ids`, references, spanIds);
  });

  const entityIds = new Set(collections.narrative_entities.map((record) => stringValue(record.id)));
  const featureIds = new Set(collections.figurative_features.map((record) => stringValue(record.id)));
  const carrierIds = new Set(collections.carriers.map((record) => stringValue(record.id)));
  const threadIds = new Set(collections.threads.map((record) => stringValue(record.id)));
  const structuralIds = new Set(collections.structural_relations.map((record) => stringValue(record.id)));
  const interpretiveIds = new Set(collections.interpretive_relations.map((record) => stringValue(record.id)));
  const nodeIds = new Set([...entityIds, ...featureIds, ...carrierIds]);

  collections.narrative_entities.forEach((record, index) => checkReferences(issues, `narrative_entities[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds));
  collections.figurative_features.forEach((record, index) => {
    checkReferences(issues, `figurative_features[${index}].evidence_id`, [stringValue(record.evidence_id)], evidenceIds);
    if (record.mip_status === "applicable") {
      const mip = record.mip_record as Item | undefined;
      ["lexical_unit", "contextual_meaning", "basic_meaning", "comparison"].forEach((key) => { if (!mip || !stringValue(mip[key])) issues.push({ path: `figurative_features[${index}].mip_record.${key}`, message: "Required for an applicable MIP/MIPVU-informed record." }); });
      if (mip && !["metaphor_candidate", "literal", "undecidable"].includes(stringValue(mip.decision))) issues.push({ path: `figurative_features[${index}].mip_record.decision`, message: "MIP decision must be metaphor_candidate, literal, or undecidable." });
      if (mip && !["machine_draft", "researcher_checked"].includes(stringValue(mip.review_status))) issues.push({ path: `figurative_features[${index}].mip_record.review_status`, message: "MIP record must state its review status." });
      const linkedEvidence = collections.evidence.find((evidence) => stringValue(evidence.id) === stringValue(record.evidence_id));
      const excerpt = linkedEvidence ? ids(linkedEvidence.span_ids).map((id) => collections.text_spans.find((span) => stringValue(span.id) === id)).map((span) => stringValue(span?.text)).join("\n") : "";
      if (mip && stringValue(mip.lexical_unit) && !excerpt.includes(stringValue(mip.lexical_unit))) issues.push({ path: `figurative_features[${index}].mip_record.lexical_unit`, message: "MIP lexical unit must occur in its linked exact-source evidence." });
    }
  });
  collections.carriers.forEach((record, index) => {
    checkReferences(issues, `carriers[${index}].feature_ids`, ids(record.feature_ids), featureIds);
    checkReferences(issues, `carriers[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
    if (ids(record.selection_reasons).length < 2) issues.push({ path: `carriers[${index}].selection_reasons`, message: "Carrier requires at least two fixed inclusion reasons." });
  });
  collections.structural_relations.forEach((record, index) => {
    ["source_id", "target_id"].forEach((key) => { if (!nodeIds.has(stringValue(record[key]))) issues.push({ path: `structural_relations[${index}].${key}`, message: "Structural relation endpoint must be an entity, feature, or carrier." }); });
    if (!structuralTypes.has(stringValue(record.type))) issues.push({ path: `structural_relations[${index}].type`, message: "Invalid structural relation type." });
    if (!ids(record.evidence_ids).length) issues.push({ path: `structural_relations[${index}].evidence_ids`, message: "Structural relation requires evidence." });
    checkReferences(issues, `structural_relations[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
    if (!stringValue(record.rationale)) issues.push({ path: `structural_relations[${index}].rationale`, message: "Structural relation requires a rationale." });
    const thread = stringValue(record.thread_id); if (thread && !threadIds.has(thread)) issues.push({ path: `structural_relations[${index}].thread_id`, message: "Unknown thread." });
  });
  collections.interpretive_relations.forEach((record, index) => {
    checkReferences(issues, `interpretive_relations[${index}].source_ids`, ids(record.source_ids), nodeIds);
    checkReferences(issues, `interpretive_relations[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
    checkReferences(issues, `interpretive_relations[${index}].grounding_relation_ids`, ids(record.grounding_relation_ids), structuralIds);
    if (!interpretiveTypes.has(stringValue(record.type))) issues.push({ path: `interpretive_relations[${index}].type`, message: "Invalid interpretive relation type." });
    if (!stringValue(record.relation_text) || !stringValue(record.qualification)) issues.push({ path: `interpretive_relations[${index}]`, message: "Interpretive relation requires qualified text and qualification." });
  });
  collections.threads.forEach((record, index) => {
    checkReferences(issues, `threads[${index}].carrier_ids`, ids(record.carrier_ids), carrierIds);
    checkReferences(issues, `threads[${index}].feature_ids`, ids(record.feature_ids), featureIds);
    checkReferences(issues, `threads[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
    checkReferences(issues, `threads[${index}].structural_relation_ids`, ids(record.structural_relation_ids), structuralIds);
    checkReferences(issues, `threads[${index}].interpretive_relation_ids`, ids(record.interpretive_relation_ids), interpretiveIds);
  });
  collections.probes.forEach((record, index) => {
    checkReferences(issues, `probes[${index}].target_relation_ids`, ids(record.target_relation_ids), new Set([...structuralIds, ...interpretiveIds]));
    const carrier = stringValue(record.target_carrier_id); if (carrier && !carrierIds.has(carrier)) issues.push({ path: `probes[${index}].target_carrier_id`, message: "Unknown carrier." });
  });
  // Canonical v3 construction-layer checks. They run in addition to the
  // reader-facing compatibility contract above, so a draft cannot merely
  // carry v3-looking fields without their ID-linked grounding.
  if (workPackage.figurative_signals !== undefined) {
    const signals = items(workPackage.figurative_signals); const signalIds = new Set(signals.map((record) => stringValue(record.id)));
    const candidateCarriers = items(workPackage.candidate_carriers); const candidateCarrierIds = new Set(candidateCarriers.map((record) => stringValue(record.id)));
    const candidateRelations = items(workPackage.candidate_relations);
    const narrativeContextIds = new Set([
      ...entityIds,
      ...items(workPackage.narrative_events).map((record) => stringValue(record.id)),
      ...items(workPackage.scenes).map((record) => stringValue(record.id)),
      ...items(workPackage.discourse_segments).map((record) => stringValue(record.id)),
    ]);
    const mentionRecords = items(workPackage.entity_mentions); const mentionIds = new Set(mentionRecords.map((record) => stringValue(record.id)));
    mentionRecords.forEach((record, index) => checkReferences(issues, `entity_mentions[${index}].span_id`, [stringValue(record.span_id)], spanIds));
    items(workPackage.event_mentions).forEach((record, index) => {
      checkReferences(issues, `event_mentions[${index}].span_id`, [stringValue(record.span_id)], spanIds);
      checkReferences(issues, `event_mentions[${index}].participant_mention_ids`, ids(record.participant_mention_ids), mentionIds);
    });
    items(workPackage.narrative_events).forEach((record, index) => checkReferences(issues, `narrative_events[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds));
    items(workPackage.scenes).forEach((record, index) => { checkReferences(issues, `scenes[${index}].span_ids`, ids(record.span_ids), spanIds); checkReferences(issues, `scenes[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds); });
    items(workPackage.discourse_segments).forEach((record, index) => { checkReferences(issues, `discourse_segments[${index}].span_id`, [stringValue(record.span_id)], spanIds); checkReferences(issues, `discourse_segments[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds); });
    signals.forEach((record, index) => {
      const signalEvidence = ids(record.evidence_ids); checkReferences(issues, `figurative_signals[${index}].evidence_ids`, signalEvidence, evidenceIds);
      if (!signalEvidence.length) issues.push({ path: `figurative_signals[${index}].evidence_ids`, message: "FigurativeSignal requires exact-source evidence." });
      if (stringValue(record.type) === "MIP_METAPHOR") {
        const mip = record.mip_record as Item | undefined;
        ["lexical_unit", "contextual_meaning", "basic_meaning", "comparison"].forEach((key) => { if (!mip || !stringValue(mip[key])) issues.push({ path: `figurative_signals[${index}].mip_record.${key}`, message: "MIP_METAPHOR requires an auditable MIP record." }); });
      }
    });
    candidateCarriers.forEach((record, index) => {
      checkReferences(issues, `candidate_carriers[${index}].signal_ids`, ids(record.signal_ids), signalIds);
      checkReferences(issues, `candidate_carriers[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
      checkReferences(issues, `candidate_carriers[${index}].narrative_ids`, ids(record.narrative_ids), narrativeContextIds);
      if (ids(record.selection_reasons).length < 2) issues.push({ path: `candidate_carriers[${index}].selection_reasons`, message: "CandidateCarrier requires at least two fired gates." });
    });
    candidateRelations.forEach((record, index) => {
      const candidateEndpoints = new Set([...candidateCarrierIds, ...carrierIds, ...entityIds]);
      checkReferences(issues, `candidate_relations[${index}].source_id`, [stringValue(record.source_id)], candidateEndpoints);
      checkReferences(issues, `candidate_relations[${index}].target_id`, [stringValue(record.target_id)], candidateEndpoints);
      checkReferences(issues, `candidate_relations[${index}].evidence_ids`, ids(record.evidence_ids), evidenceIds);
      checkReferences(issues, `candidate_relations[${index}].signal_ids`, ids(record.signal_ids), signalIds);
      if (!stringValue(record.rationale)) issues.push({ path: `candidate_relations[${index}].rationale`, message: "CandidateRelation requires a grounded rationale." });
    });
    const manifest = workPackage.unr_manifest as Item | undefined;
    if (!manifest || stringValue(manifest.source_document_id) === "") issues.push({ path: "unr_manifest", message: "v3 construction requires an UNR manifest linked to its source document." });
  }
  // v7.3 packages may retain an explicit projection audit. Legacy development
  // packages remain readable, but once projection records exist they must be traceable.
  if (workPackage.projection_records !== undefined) {
    const projections = items(workPackage.projection_records);
    const candidateCarrierIds = new Set(items(workPackage.candidate_carriers).map((record) => stringValue(record.id)));
    const candidateRelationIds = new Set(items(workPackage.candidate_relations).map((record) => stringValue(record.id)));
    const projectable = new Set([...carrierIds, ...threadIds, ...structuralIds, ...interpretiveIds, ...candidateCarrierIds, ...candidateRelationIds]);
    projections.forEach((record, index) => {
      if (!projectable.has(stringValue(record.target_id))) issues.push({ path: `projection_records[${index}].target_id`, message: "Projection target must be a reader-facing candidate." });
      if (!["selected", "excluded", "candidate"].includes(stringValue(record.projection_status))) issues.push({ path: `projection_records[${index}].projection_status`, message: "Invalid projection status." });
      if (typeof record.reader_facing !== "boolean") issues.push({ path: `projection_records[${index}].reader_facing`, message: "Projection must state reader visibility." });
      if (!ids(record.selection_reasons).length || !stringValue(record.selection_rationale)) issues.push({ path: `projection_records[${index}]`, message: "Projection requires reasons and rationale." });
    });
  }
  return issues;
}
