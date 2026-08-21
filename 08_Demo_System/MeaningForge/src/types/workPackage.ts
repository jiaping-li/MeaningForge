export type Judgment = "keep" | "unsure" | "reject";
export type ProbeEffect = "preserved" | "weakened" | "broken" | "emergent" | "mixed" | "unsure";

export interface TextSpan { id: string; chapter_id: string; paragraph_id: string; order: number; text: string; start_char?: number; end_char?: number; provenance_id?: string; }
export interface ProjectionRecord { id: string; target_id: string; target_type: string; projection_status: "selected" | "excluded" | "candidate"; reader_facing: boolean; selection_reasons: string[]; selection_rationale: string; provenance_id?: string; }
export interface Evidence { id: string; span_ids: string[]; type: string; note: string; provenance_id?: string; }
export interface NarrativeUnit { id: string; order: number; chapter_id?: string; span_ids: string[]; summary?: string; }
export interface NarrativeEntity { id: string; type: string; label: string; canonical_label?: string; mention_ids?: string[]; evidence_ids: string[]; provenance_id?: string; }
export interface NarrativeRelation { id: string; source_id: string; target_id: string; type: string; evidence_ids: string[]; provenance_id?: string; status?: string; }
export interface MipRecord {
  lexical_unit: string;
  contextual_meaning: string;
  basic_meaning: string;
  comparison: string;
  decision: "metaphor_candidate" | "literal" | "undecidable";
  review_status: "machine_draft" | "machine_reviewed" | "researcher_checked";
}
export interface Calibration { review_status: "machine_draft" | "machine_reviewed" | "researcher_checked"; rationale: string; }
export interface FigurativeFeature { id: string; evidence_id: string; surface_form: string; type: string; mip_status?: "applicable" | "not_applicable" | "uncertain"; mip_record?: MipRecord; calibration?: Calibration; provenance_id?: string; status?: string; }
export interface Carrier { id: string; label: string; type: string; feature_ids: string[]; evidence_ids: string[]; selection_reasons: string[]; provenance_id?: string; status?: string; }
export interface ReaderFacingRelationMetadata { evidence_span_ids: string[]; signal_labels: string[]; narrative_context: string[]; recurrence: boolean; structural_importance: "high" | "medium" | "low"; uncertainty: "reviewed_observation" | "machine_candidate" | "contestable"; selection_reasons: string[]; relevance: string; contestability: string; reader_trigger: string; }
export interface StructuralRelation { id: string; thread_id: string; source_id: string; target_id: string; type: string; evidence_ids: string[]; rationale: string; reader_metadata?: ReaderFacingRelationMetadata; review_status?: Calibration["review_status"]; provenance_id?: string; status?: string; }
export interface InterpretiveRelation { id: string; thread_id: string; source_ids: string[]; type: string; evidence_ids: string[]; grounding_relation_ids: string[]; relation_text: string; qualification: string; }
export interface Thread { id: string; neutral_label: string; carrier_ids: string[]; feature_ids?: string[]; evidence_ids: string[]; structural_relation_ids: string[]; interpretive_relation_ids: string[]; distribution: { chapter_ids: string[]; span_orders: number[] }; }
export interface Probe { id: string; thread_id: string; type: string; target_relation_ids: string[]; target_carrier_id?: string; prompt: string; config?: { suggested_replacement?: string }; }
export interface ScaffoldPath { id: string; label: string; prompt: string; node_ids: string[]; structural_relation_ids: string[]; evidence_ids: string[]; provenance_id?: string; status?: string; }
export interface ContextAnchor { id: string; type: "character" | "object" | "event" | "action" | "scene"; label: string; evidence_ids: string[]; provenance_id?: string; status?: string; }
export interface CandidateExploration { id: string; label: string; type: string; evidence_ids: string[]; signal_ids: string[]; uncertainty: "candidate" | "undecidable"; prompt: string; provenance_id?: string; }
export interface ChapterScaffold { chapter_id: string; context_anchors: ContextAnchor[]; candidate_explorations: CandidateExploration[]; reference_relation_ids: string[]; reader_prompt: string; provenance_id?: string; status?: string; }
// A reader-facing, evidence-granular projection. Unlike a Carrier or an
// InterpretiveRelation, this is never a claim about what the text means.
export interface MeaningElement { id: string; label: string; type: "passage" | "dialogue" | "character" | "object" | "event" | "action" | "scene" | "image" | "recurrence" | "pattern" | "candidate"; chapter_id: string; evidence_ids: string[]; source_ids: string[]; relation_ids: string[]; provenance_id?: string; status: string; }
// Canonical v3 construction records. The reader UI consumes only the projected
// arrays below; these records retain the pre-projection substrate for audit.
export interface FigurativeSignal { id: string; work_id: string; span_ids: string[]; evidence_ids: string[]; surface_form?: string; type: "MIP_METAPHOR" | "RECURRENCE" | "REPETITION" | "CONTRAST" | "JUXTAPOSITION" | "PARALLEL" | "ANOMALY" | "CONTEXT_SHIFT" | "CROSS_SPAN_ASSOCIATION"; mip_status?: "applicable" | "not_applicable" | "uncertain"; mip_record?: MipRecord; linked_narrative_ids?: string[]; score?: number; rationale?: string; provenance_id: string; status: string; }
export interface MipCoverageCandidate { id: string; lexical_unit: string; exact_quote: string; chapter_id: string; cue_types: string[]; }
export interface MipReviewRecord extends MipRecord { id: string; coverage_candidate_id: string; lexical_unit: string; exact_quote: string; chapter_id: string; cue_types: string[]; work_id: string; provenance_id: string; status: string; }
export interface CandidateCarrierV3 { id: string; work_id: string; label: string; type: string; signal_ids: string[]; evidence_ids: string[]; narrative_ids: string[]; selection_reasons: string[]; provenance_id: string; status: string; }
export interface CandidateRelationV3 { id: string; work_id: string; source_id: string; target_id: string; proposed_layer: "STRUCTURAL" | "INTERPRETIVE"; proposed_type: string; evidence_ids: string[]; evidence_span_ids?: string[]; figurative_signals?: string[]; narrative_context?: string[]; recurrence?: boolean; structural_importance?: "high" | "medium" | "low"; uncertainty?: string; selection_reasons?: string[]; reader_trigger?: string; grounding_relation_ids?: string[]; signal_ids: string[]; rationale: string; qualification?: string; provenance_id: string; status: string; }
export interface UNRManifest { id: string; work_id: string; schema_version: string; source_document_id: string; counts: Record<string, number>; construction_run_id: string; validation_run_ids: string[]; created_at: string; }
export interface ValidationRecord { id: string; work_id: string; target_type: string; target_id: string; validation_type: "schema" | "referential_integrity" | "source_anchor" | "grounding" | "rule" | "epistemic_wording"; passed: boolean; messages: string[]; validator_version: string; created_at: string; }
export interface WorkPackage {
  schema_version: string;
  package_id: string;
  package_status: string;
  work: { id: string; title: string; author: string; source_uri: string; status: string; chapter_markers?: Array<{ id: string; label: string; marker: string }> };
  text_spans: TextSpan[];
  evidence: Evidence[];
  narrative_units: NarrativeUnit[];
  narrative_entities: NarrativeEntity[];
  narrative_relations: NarrativeRelation[];
  figurative_features: FigurativeFeature[];
  carriers: Carrier[];
  threads: Thread[];
  structural_relations: StructuralRelation[];
  interpretive_relations: InterpretiveRelation[];
  probes: Probe[];
  scaffold_paths?: ScaffoldPath[];
  chapter_scaffolds?: ChapterScaffold[];
  meaning_elements?: MeaningElement[];
  source_document?: { id: string; text: string; checksum?: string; provenance_id: string };
  paragraphs?: Array<{ id: string; work_id: string; order: number; chapter_id: string; text: string; start_char: number; end_char: number; provenance_id: string }>;
  sentences?: Array<{ id: string; paragraph_id: string; order: number; text: string; start_char: number; end_char: number; provenance_id: string }>;
  entity_mentions?: Array<{ id: string; span_id: string; surface_form: string; type: string; start_char?: number; end_char?: number; canonical_entity_id?: string; coreference_cluster_id?: string; provenance_id: string; status: string }>;
  event_mentions?: Array<{ id: string; span_id: string; predicate: string; participant_mention_ids: string[]; canonical_event_id?: string; coreference_cluster_id?: string; provenance_id: string; status: string }>;
  narrative_events?: Array<{ id: string; label: string; mention_ids: string[]; participant_entity_ids?: string[]; evidence_ids: string[]; provenance_id: string; status: string }>;
  scenes?: Array<{ id: string; chapter_id: string; span_ids: string[]; evidence_ids: string[]; label: string; provenance_id: string; status: string }>;
  discourse_segments?: Array<{ id: string; span_id: string; type: "dialogue" | "narration"; evidence_ids: string[]; provenance_id: string; status: string }>;
  figurative_signals?: FigurativeSignal[];
  mip_coverage?: { candidate_count: number; reviewed_count: number; executor: "LLM" | "LLM_partial" | "not_run"; candidates: MipCoverageCandidate[] };
  mip_review_records?: MipReviewRecord[];
  candidate_carriers?: CandidateCarrierV3[];
  candidate_relations?: CandidateRelationV3[];
  unr_manifest?: UNRManifest;
  validations?: ValidationRecord[];
  projection_run?: { id: string; work_id: string; protocol_version: string; source_unr_manifest_id: string; projection_record_ids: string[]; created_at: string };
  reference_skeleton?: { id: string; work_id: string; carrier_ids: string[]; thread_ids: string[]; structural_relation_ids: string[]; interpretive_relation_ids: string[]; provenance_id: string };
  projection_records?: ProjectionRecord[];
  construction_run?: { protocol_version: string; stage_status: Record<string, "complete" | "skipped" | "draft">; frozen_at?: string; validation_summary?: string };
  provenance?: Array<{ id: string; method_basis: string; executor_type: string; method_note?: string }>;
  preparation?: { protocol: string; deterministic_pass: boolean; llm_review_used: boolean; review_notes: string[] };
}

export interface ReaderSession {
  package_id: string;
  selected_evidence_ids: string[];
  judgments: Record<string, { judgment: Judgment | "challenge"; revision?: string; reason?: string; created_at?: string; provenance?: "reader-authored" }>;
  reference_reviews: Record<string, { action: "accept" | "modify" | "reject"; reason?: string; created_at: string; provenance: "reader-authored"; reader_relation_id?: string }>;
  candidate_decisions: Record<string, { action: "explore" | "accept" | "reject" | "ignore"; created_at: string; provenance: "reader-authored"; reader_node_id?: string }>;
  counterevidence: Array<{ id: string; relation_id?: string; evidence_id: string; stance: "supporting" | "conflicting"; created_at: string; provenance: "reader-authored" }>;
  probes: Array<{ probe_id: string; replacement?: string; effect: ProbeEffect; note: string }>;
  reader_evidence_references: Array<{ id: string; session_id: string; reference_node_id: string; label: string; evidence_ids: string[]; created_at: string; provenance: "reader-selected-reference" }>;
  reader_nodes: Array<{ id: string; session_id: string; label: string; type: string; evidence_id?: string; evidence_ids: string[]; source_text_span_id?: string; source_candidate_id?: string; interpretation_type?: string; note?: string; rationale?: string; based_on_node_id?: string; created_at: string; provenance: "reader-authored"; history: Array<{ at: string; action: "create" | "revise"; label: string; type: string; note?: string }> }>;
  reader_relations: Array<{ id: string; session_id: string; source_id: string; target_id: string; label: string; relation_type?: string; explanation?: string; confidence?: "tentative" | "developing" | "confident"; uncertainty?: string; evidence_ids: string[]; rationale?: string; based_on_relation_id?: string; created_at: string; provenance: "reader-authored"; history: Array<{ at: string; action: "create" | "revise"; label: string; relation_type?: string; explanation?: string; confidence?: "tentative" | "developing" | "confident"; uncertainty?: string }> }>;
  claim: string;
  reader_claims: Array<{ id: string; session_id: string; text: string; evidence_ids: string[]; node_ids: string[]; relation_ids: string[]; confidence: "tentative" | "developing" | "confident"; created_at: string; updated_at: string; provenance: "reader-authored"; history: Array<{ at: string; text: string; evidence_ids: string[]; node_ids: string[]; relation_ids: string[]; confidence: "tentative" | "developing" | "confident"; trigger: "initial" | "new_evidence" | "reconsidered_evidence" | "new_relation" | "contradictory_evidence" | "context_change" | "reader_uncertainty"; trigger_note?: string }> }>;
  meaning_map?: { layout: "reference" | "reader" | "compare"; positions: Record<string, [number, number]> };
  events: Array<{ at: string; action: string; target_id?: string; target_type?: string; payload?: Record<string, string | number | boolean>; previous_state?: string; next_state?: string }>;
}

export const emptySession = (packageId: string): ReaderSession => ({
  package_id: packageId, selected_evidence_ids: [], judgments: {}, reference_reviews: {}, candidate_decisions: {}, counterevidence: [], probes: [], reader_evidence_references: [], reader_nodes: [], reader_relations: [], claim: "", reader_claims: [], events: [],
});
