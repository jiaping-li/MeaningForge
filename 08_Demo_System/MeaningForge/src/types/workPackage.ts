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
  review_status: "machine_draft" | "researcher_checked";
}
export interface FigurativeFeature { id: string; evidence_id: string; surface_form: string; type: string; mip_status?: "applicable" | "not_applicable" | "uncertain"; mip_record?: MipRecord; provenance_id?: string; }
export interface Carrier { id: string; label: string; type: string; feature_ids: string[]; evidence_ids: string[]; selection_reasons: string[]; provenance_id?: string; }
export interface StructuralRelation { id: string; thread_id: string; source_id: string; target_id: string; type: string; evidence_ids: string[]; rationale: string; }
export interface InterpretiveRelation { id: string; thread_id: string; source_ids: string[]; type: string; evidence_ids: string[]; grounding_relation_ids: string[]; relation_text: string; qualification: string; }
export interface Thread { id: string; neutral_label: string; carrier_ids: string[]; feature_ids?: string[]; evidence_ids: string[]; structural_relation_ids: string[]; interpretive_relation_ids: string[]; distribution: { chapter_ids: string[]; span_orders: number[] }; }
export interface Probe { id: string; thread_id: string; type: string; target_relation_ids: string[]; target_carrier_id?: string; prompt: string; config?: { suggested_replacement?: string }; }
// Canonical v3 construction records. The reader UI consumes only the projected
// arrays below; these records retain the pre-projection substrate for audit.
export interface FigurativeSignal { id: string; work_id: string; span_ids: string[]; evidence_ids: string[]; surface_form?: string; type: "MIP_METAPHOR" | "RECURRENCE" | "REPETITION" | "CONTRAST" | "JUXTAPOSITION" | "PARALLEL" | "ANOMALY" | "CONTEXT_SHIFT" | "CROSS_SPAN_ASSOCIATION"; mip_status?: "applicable" | "not_applicable" | "uncertain"; mip_record?: MipRecord; linked_narrative_ids?: string[]; score?: number; rationale?: string; provenance_id: string; status: string; }
export interface CandidateCarrierV3 { id: string; work_id: string; label: string; type: string; signal_ids: string[]; evidence_ids: string[]; narrative_ids: string[]; selection_reasons: string[]; provenance_id: string; status: string; }
export interface CandidateRelationV3 { id: string; work_id: string; source_id: string; target_id: string; proposed_layer: "STRUCTURAL" | "INTERPRETIVE"; proposed_type: string; evidence_ids: string[]; grounding_relation_ids?: string[]; signal_ids: string[]; rationale: string; qualification?: string; provenance_id: string; status: string; }
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
  source_document?: { id: string; text: string; checksum?: string; provenance_id: string };
  paragraphs?: Array<{ id: string; work_id: string; order: number; chapter_id: string; text: string; start_char: number; end_char: number; provenance_id: string }>;
  sentences?: Array<{ id: string; paragraph_id: string; order: number; text: string; start_char: number; end_char: number; provenance_id: string }>;
  entity_mentions?: Array<{ id: string; span_id: string; surface_form: string; type: string; start_char?: number; end_char?: number; canonical_entity_id?: string; coreference_cluster_id?: string; provenance_id: string; status: string }>;
  event_mentions?: Array<{ id: string; span_id: string; predicate: string; participant_mention_ids: string[]; canonical_event_id?: string; coreference_cluster_id?: string; provenance_id: string; status: string }>;
  narrative_events?: Array<{ id: string; label: string; mention_ids: string[]; participant_entity_ids?: string[]; evidence_ids: string[]; provenance_id: string; status: string }>;
  scenes?: Array<{ id: string; chapter_id: string; span_ids: string[]; evidence_ids: string[]; label: string; provenance_id: string; status: string }>;
  discourse_segments?: Array<{ id: string; span_id: string; type: "dialogue" | "narration"; evidence_ids: string[]; provenance_id: string; status: string }>;
  figurative_signals?: FigurativeSignal[];
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
  judgments: Record<string, { judgment: Judgment; revision?: string }>;
  probes: Array<{ probe_id: string; replacement?: string; effect: ProbeEffect; note: string }>;
  reader_nodes: Array<{ id: string; label: string; type: string; evidence_id?: string; rationale?: string; based_on_node_id?: string }>;
  reader_relations: Array<{ id: string; source_id: string; target_id: string; label: string; evidence_ids: string[]; rationale?: string; based_on_relation_id?: string }>;
  claim: string;
  events: Array<{ at: string; action: string; target_id?: string; target_type?: string; payload?: Record<string, string | number | boolean> }>;
}

export const emptySession = (packageId: string): ReaderSession => ({
  package_id: packageId, selected_evidence_ids: [], judgments: {}, probes: [], reader_nodes: [], reader_relations: [], claim: "", events: [],
});
