export type EvidenceKind = "textual" | "cultural" | "critical";

export type ExpressionType =
  | "lexical_metaphor"
  | "metaphorically_structured_image"
  | "recurring_metaphorical_motif"
  | "metaphorically_structured_action";

export type CarrierType =
  | "object"
  | "action"
  | "discourse"
  | "scene_ritual"
  | "sensory_image";

export type RelationImportance = "high" | "medium" | "low";

export type ComparisonStatus = "preserved" | "weakened" | "emergent" | "broken";

export type PacketValidationStatus =
  | "llm_draft"
  | "researcher_curated"
  | "expert_checked"
  | "pilot_ready"
  | "study_ready";

export type TheoryLens =
  | "mip_mipvu"
  | "chinese_poetics"
  | "symbol_motif"
  | "narrative_structure";

export type DetectionMethod =
  | "MIP/MIPVU"
  | "Chinese poetics"
  | "Symbol/motif"
  | "Narrative structure"
  | "LLM semantic scan";

export interface LiteraryEvidence {
  id: string;
  kind: EvidenceKind;
  label: string;
  excerpt: string;
  note: string;
  sourceRole?: "passage" | "cultural_context" | "critical_context" | "reader_added";
  groundedness?: "direct_quote" | "paraphrase" | "inference";
}

export interface MappingRelation {
  id: string;
  carrierRelation: string;
  meaningRelation: string;
  importance: RelationImportance;
  evidenceIds: string[];
  relationType?: "attribute" | "action" | "affect" | "cultural" | "narrative" | "contrast";
  readerStatus?: "unreviewed" | "accepted" | "revised" | "rejected";
}

export interface ReplacementComparison {
  id: string;
  status: ComparisonStatus;
  title: string;
  explanation: string;
  relationIds: string[];
  diagnosticQuestion?: string;
  readerStatus?: "unreviewed" | "confirmed" | "revised" | "rejected" | "uncertain";
}

export interface ReplacementAnalysis {
  id: string;
  label: string;
  replacementCarrier: string;
  purpose: string;
  comparisons: ReplacementComparison[];
  replacementStrategy?: "near_neighbor" | "cultural_variant" | "oppositional" | "literalizing" | "reader_authored";
}

export interface CandidateCarrier {
  id: string;
  span: string;
  label: string;
  carrierTypes?: CarrierType[];
  whyCandidate: string;
  evidenceExcerpt: string;
  priority: RelationImportance;
  detectionMethod?: DetectionMethod;
  basicMeaning?: string;
  contextualMeaning?: string;
  semanticTension?: string;
  culturalResonance?: string;
  readerSalience?: "high" | "medium" | "low";
  confidence?: "high" | "medium" | "low";
  replaceability?: "high" | "medium" | "low";
  theoryTrace?: {
    mipVu?: string;
    chinesePoetics?: string;
    symbolMotif?: string;
    narrativeStructure?: string;
  };
  scores?: {
    mipTension: number;
    poeticImagery: number;
    motifRecurrence: number;
    narrativeImportance: number;
    evidenceDensity: number;
  };
}

export interface LiteraryMapping {
  id: string;
  title: string;
  workTitle: string;
  passageLabel: string;
  passage: string;
  selectedSpan: string;
  carrierTypes?: CarrierType[];
  expressionTypes: ExpressionType[];
  literalScene: {
    entities: string[];
    actions: string[];
  };
  concreteCarrier: {
    name: string;
    attributes: string[];
    relations: string[];
  };
  broaderMeaningHypotheses: string[];
  mappingRelations: MappingRelation[];
  evidence: LiteraryEvidence[];
  candidateCarriers?: CandidateCarrier[];
  alternativeInterpretations: string[];
  replacements: ReplacementAnalysis[];
  uncertainty: "low" | "medium" | "high";
  analysisProvenance?: {
    systemRole: "scaffold" | "fallback" | "reader_authored";
    theoryLenses: TheoryLens[];
    source: "llm" | "local_scaffold" | "demo";
    generatedAt?: string;
    temporaryLens?: boolean;
    packetProtocol?: {
      status: PacketValidationStatus;
      constructionMethod: "theory_guided_packet" | "llm_assisted_draft" | "local_scaffold";
      validationNote: string;
      requiredChecks: string[];
    };
  };
  studyHooks?: {
    designGoal: string[];
    expectedUserAction: string[];
    measurableOutcome: string[];
  };
}

export interface LiteraryPassage {
  id: string;
  label: string;
  chapter?: string;
  text: string;
}

export interface LiteraryWork {
  id: string;
  title: string;
  author: string;
  language: "zh" | "en" | "other";
  tradition: "Chinese classic" | "World classic" | "Imported";
  publicationNote: string;
  sourceNote: string;
  fullTextUrl?: string;
  isFullTextLoaded?: boolean;
  passages: LiteraryPassage[];
}

export interface AnalyzePassageRequest {
  workTitle: string;
  author?: string;
  language?: LiteraryWork["language"];
  tradition?: LiteraryWork["tradition"];
  passageLabel: string;
  passage: string;
  selectedSpan?: string;
  theoryLenses?: TheoryLens[];
}

export interface ScanCandidatesRequest {
  workTitle: string;
  author?: string;
  language?: LiteraryWork["language"];
  tradition?: LiteraryWork["tradition"];
  passageLabel: string;
  passage: string;
  theoryLenses?: TheoryLens[];
}

export interface TextPreprocessResult {
  segments: string[];
  entities: string[];
  images: string[];
  actions: string[];
  repeatedTerms: string[];
  allusions: string[];
  narrativeFrames: string[];
}

export interface CandidateScanResult {
  workTitle: string;
  passageLabel: string;
  preprocess: TextPreprocessResult;
  candidates: CandidateCarrier[];
}

export type LiterarySubstrateUnitKind =
  | "narration"
  | "dialogue"
  | "description"
  | "action"
  | "scene_ritual";

export type LiterarySubstrateCalibrationStatus =
  | "unscanned"
  | "uncalibrated_draft"
  | "researcher_curated"
  | "expert_checked"
  | "study_ready";

export interface LiterarySubstrateNode {
  id: string;
  passageId: string;
  label: string;
  chapter?: string;
  unitKinds: LiterarySubstrateUnitKind[];
  entities: string[];
  actions: string[];
  scenes: string[];
  sensoryImages: string[];
  repeatedTerms: string[];
  semanticAnomalies: string[];
  candidateIds: string[];
  candidateCount: number;
  calibrationStatus: LiterarySubstrateCalibrationStatus;
}

export interface CarrierRecurrence {
  span: string;
  label: string;
  carrierTypes: CarrierType[];
  occurrenceCount: number;
  passageIds: string[];
  distribution: string[];
  calibrationStatus: LiterarySubstrateCalibrationStatus;
  salienceSignals: {
    recurrence: number;
    distribution: number;
    narrativeCentrality: number;
    semanticAnomaly: number;
    evidenceTrace: number;
  };
}

export interface LiterarySubstrate {
  id: string;
  workId: string;
  workTitle: string;
  generatedAt: string;
  coverage: {
    scannedPassages: number;
    totalPassages: number;
    scanLimit: number;
  };
  nodes: LiterarySubstrateNode[];
  nodesByPassageId: Record<string, LiterarySubstrateNode>;
  passageScans: Record<string, CandidateScanResult>;
  carrierIndex: CarrierRecurrence[];
  summary: {
    candidateCount: number;
    curatedCandidateCount: number;
    uncalibratedCandidateCount: number;
    semanticAnomalyCount: number;
    topRecurringCarriers: string[];
  };
}

export interface CompareReplacementRequest {
  mapping: LiteraryMapping;
  replacementCarrier: string;
}

export type StudyCondition = "explanation" | "visible_mapping" | "interactive_reworking";

export type MappingWorkspaceMode = "focused" | "multi";

export type EvidenceReviewStatus = "unreviewed" | "accepted" | "revised" | "rejected";

export type CandidateReviewStatus = "pending" | "accepted" | "revised" | "rejected" | "saved";

export type ReplacementReviewStatus = "unreviewed" | "confirmed" | "revised" | "rejected" | "uncertain";

export interface StudyLogEvent {
  id: string;
  timestamp: number;
  type: string;
  detail: string;
}
