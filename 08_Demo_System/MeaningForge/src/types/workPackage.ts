export type Judgment = "keep" | "unsure" | "reject";
export type ProbeEffect = "preserved" | "weakened" | "broken" | "emergent" | "mixed" | "unsure";

export interface TextSpan { id: string; chapter_id: string; paragraph_id: string; order: number; text: string; start_char?: number; end_char?: number; provenance_id?: string; }
export interface ProjectionRecord { id: string; target_id: string; target_type: string; projection_status: "selected" | "excluded" | "candidate"; reader_facing: boolean; selection_reasons: string[]; selection_rationale: string; provenance_id?: string; }
export interface Evidence { id: string; span_ids: string[]; type: string; note: string; provenance_id?: string; }
export interface NarrativeUnit { id: string; order: number; chapter_id?: string; span_ids: string[]; summary?: string; }
export interface NarrativeEntity { id: string; type: string; label: string; evidence_ids: string[]; provenance_id?: string; }
export interface NarrativeRelation { id: string; source_id: string; target_id: string; type: string; evidence_ids: string[]; }
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
