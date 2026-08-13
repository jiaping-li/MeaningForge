# MeaningForge Data Model v3

> **Version:** 2026-08-13  
> **Status:** Canonical data contract for the current MeaningForge prototype  
> **Supersedes:** `MeaningForge_Data_Model_v2.md`  
> **Companion authority:** `MeaningForge_System_Design_Development_Spec_v7_3.md`  
> **Core revision:** v3 adds exact source anchoring, mention/entity separation, explicit multi-source `FigurativeSignal`, an internal Unified Narrative Representation (UNR), candidate-generation objects, and Meaning-Relevance Projection metadata.

---

# 1. Modeling Principle

MeaningForge does not store a final literary answer.

The backend represents a traceable construction chain:

```text
SourceDocument
→ Paragraph / Sentence / TextSpan
→ Evidence
→ Narrative mentions / entities / events / scenes / discourse
→ FigurativeSignal
→ CandidateCarrier / CandidateRelation
→ UNR (logical integrated representation)
→ Grounding / Rule Validation
→ Meaning-Relevance Projection
→ ReferenceSkeleton
```

The reader then works in a separate personal layer:

```text
ReferenceSkeleton
↕
keep / unsure / reject / edit / add
↓
Reader Evidence + Relations + Claims
```

Four rules are non-negotiable:

1. **Every reader-facing object can return to exact original text.**
2. **Mention and canonical narrative entity/event are different objects.**
3. **UNR is an internal logical integration layer, not a claim of a novel universal representation and not a generic node/edge dump.**
4. **Reference interpretation is a contestable proposal; reader-authored data remains separate.**

---

# 2. Automatic Does Not Mean Purely Rule-Based

The construction pipeline can combine:

```text
deterministic algorithms
+ traditional NLP
+ fixed theoretical procedures
+ LLM-assisted semantic execution
```

The user-facing action can remain:

```text
Import text
→ Generate skeleton
```

but every generated record still preserves methodological basis, executor, grounding, and validation status.

## 2.1 MethodBasis

```text
DIRECT_TEXT
TEXT_STRUCTURE_RULE
COREFERENCE_RULE
NARRATIVE_RULE
MIP_MIPVU_INFORMED
FIGURATIVE_SIGNAL_RULE
STRUCTURAL_RULE
REFERENCE_INTERPRETIVE_PROTOCOL
PROJECTION_RULE
SCHOLARSHIP
READER_REASONING
```

## 2.2 ExecutorType

```text
DETERMINISTIC
TRADITIONAL_NLP
LLM
HUMAN
IMPORTED
READER
```

`methodBasis` answers **what procedure justifies the record**.  
`executorType` answers **what executed that procedure**.

---

# 3. Common Types

```ts
type WorkStatus =
  | "draft"
  | "development"
  | "reference_ready"
  | "pilot_ready"
  | "study_ready";

type PreparationStatus =
  | "candidate"
  | "schema_validated"
  | "grounding_validated"
  | "rule_validated"
  | "projection_ready"
  | "reference_ready"
  | "pilot_ready"
  | "study_ready"
  | "rejected";

type ProjectionStatus =
  | "candidate"
  | "selected"
  | "excluded";

type RelationLayer =
  | "NARRATIVE"
  | "STRUCTURAL"
  | "INTERPRETIVE";

type ReaderJudgmentStatus =
  | "keep"
  | "unsure"
  | "reject"
  | "edit";
```

`study_ready` means protocol-valid and frozen for a study condition. It does not mean “correct literary interpretation.”

---

# 4. Work and Source Anchoring

## 4.1 Work

```ts
Work {
  id: string
  title: string
  author?: string
  language: string
  editionId: string
  status: WorkStatus
  sourceDocumentId: string
  createdAt?: string
}
```

## 4.2 SourceDocument

```ts
SourceDocument {
  id: string
  workId: string
  editionId: string
  sourceDescription?: string
  sourceUri?: string

  rawText?: string
  text: string
  normalizationVersion: string

  charLength: number
  checksum?: string
  createdAt?: string
}
```

`SourceDocument.text` is the canonical coordinate space for all `startChar` / `endChar` values.

Character offsets use a half-open interval:

```text
[startChar, endChar)
```

so `text.slice(startChar, endChar)` must reproduce the anchored text exactly.

## 4.3 Paragraph

```ts
Paragraph {
  id: string
  documentId: string
  order: number
  startChar: number
  endChar: number
  text: string
}
```

## 4.4 Sentence

```ts
Sentence {
  id: string
  documentId: string
  paragraphId: string
  order: number
  paragraphOrder: number
  startChar: number
  endChar: number
  text: string
}
```

## 4.5 TextSpan

```ts
TextSpan {
  id: string
  workId: string
  documentId: string
  paragraphId: string
  sentenceId?: string

  order: number
  startChar: number
  endChar: number
  text: string

  speakerId?: string
  sceneId?: string
}
```

A `TextSpan` is the canonical reader-returnable evidence anchor. `paragraphId`, `sentenceId`, `startChar`, `endChar`, and `order` are not optional in generated study data unless the source format genuinely prevents sentence segmentation.

---

# 5. Evidence

```ts
Evidence {
  id: string
  workId: string
  spanIds: string[]

  type:
    | "object_description"
    | "action"
    | "dialogue"
    | "scene"
    | "sensory_image"
    | "repetition"
    | "contrast"
    | "consequence"
    | "character_relation"
    | "contextual_event"
    | "discourse_move"
    | "other_textual_evidence"

  note?: string
  provenanceId: string
  status: PreparationStatus
}
```

Evidence is textual grounding. A theme, symbolism claim, or final interpretation is not Evidence.

---

# 6. Mention Layer

Mention-level objects preserve the difference between surface realizations and canonical narrative objects.

For example:

```text
“华老栓”  → EntityMention M001
“老栓”    → EntityMention M002
“他”      → EntityMention M003
              ↓ corefers_to
            NarrativeEntity C001
```

## 6.1 EntityMention

```ts
EntityMention {
  id: string
  workId: string
  spanId: string
  startChar: number
  endChar: number
  surfaceForm: string

  mentionType:
    | "character"
    | "object"
    | "place"
    | "organization"
    | "other"

  canonicalEntityId?: string
  coreferenceClusterId?: string
  provenanceId: string
  status: PreparationStatus
}
```

## 6.2 EventMention

```ts
EventMention {
  id: string
  workId: string
  spanId: string
  startChar: number
  endChar: number
  triggerText?: string

  canonicalEventId?: string
  coreferenceClusterId?: string
  provenanceId: string
  status: PreparationStatus
}
```

Mention objects are not reader-facing by default; they support traceable coreference and narrative extraction.

---

# 7. Narrative Backbone

The Narrative Backbone is contextual infrastructure. It is not automatically figurative and is not the default reader graph.

## 7.1 NarrativeEntity

```ts
NarrativeEntity {
  id: string
  workId: string

  type:
    | "character"
    | "object"
    | "place"
    | "organization"
    | "other"

  canonicalLabel: string
  mentionIds: string[]
  evidenceIds: string[]
  provenanceId: string
  status: PreparationStatus
}
```

## 7.2 NarrativeEvent

```ts
NarrativeEvent {
  id: string
  workId: string
  label: string
  eventType?: string
  mentionIds: string[]
  participantEntityIds: string[]
  evidenceIds: string[]
  sceneId?: string
  order?: number
  provenanceId: string
  status: PreparationStatus
}
```

## 7.3 Scene

```ts
Scene {
  id: string
  workId: string
  label?: string
  spanIds: string[]
  entityIds: string[]
  eventIds: string[]
  placeId?: string
  order: number
  provenanceId: string
  status: PreparationStatus
}
```

## 7.4 DiscourseSegment

```ts
DiscourseSegment {
  id: string
  workId: string
  spanIds: string[]

  type:
    | "narration"
    | "dialogue"
    | "quotation"
    | "reported_speech"
    | "other"

  speakerEntityId?: string
  addresseeEntityIds?: string[]
  order: number
  provenanceId: string
  status: PreparationStatus
}
```

## 7.5 NarrativeRelation

```ts
NarrativeRelation {
  id: string
  workId: string
  sourceId: string
  targetId: string

  type:
    | "corefers_to"
    | "participates_in"
    | "performed_by"
    | "acts_on"
    | "occurs_in"
    | "precedes"
    | "follows"
    | "causes"
    | "results_in"
    | "associated_with"
    | "spoken_by"
    | "directed_to"
    | "located_in"

  evidenceIds: string[]
  provenanceId: string
  status: PreparationStatus
}
```

---

# 8. FigurativeSignal

`FigurativeSignal` is the canonical v3 object for computationally detected or protocol-identified cues that may matter to figurative interpretation.

It replaces the assumption that the figurative layer is equivalent to MIP output.

```ts
FigurativeSignal {
  id: string
  workId: string
  spanIds: string[]
  evidenceIds: string[]
  surfaceForm?: string

  type:
    | "MIP_METAPHOR"
    | "RECURRENCE"
    | "REPETITION"
    | "CONTRAST"
    | "JUXTAPOSITION"
    | "PARALLEL"
    | "ANOMALY"
    | "CONTEXT_SHIFT"
    | "CROSS_SPAN_ASSOCIATION"

  mipStatus?: "applicable" | "not_applicable" | "uncertain"
  mipRecord?: {
    lexicalUnit?: string
    contextualMeaning?: string
    basicMeaning?: string
    contrastPresent?: boolean
    comparisonDefensible?: boolean
  }

  linkedNarrativeIds?: string[]
  score?: number
  rationale?: string

  provenanceId: string
  status: PreparationStatus
}
```

A signal is a **candidate cue**, not automatically a reader-facing node and not automatically an interpretation.

`FigurativeFeature` from v2 is deprecated as a canonical object. Existing prototype data may be migrated by mapping compatible records into `FigurativeSignal`.

---

# 9. Candidate Generation Layer

## 9.1 CandidateCarrier

```ts
CandidateCarrier {
  id: string
  workId: string
  label: string

  type:
    | "object"
    | "action"
    | "discourse"
    | "scene_ritual"
    | "sensory_image"
    | "recurrent_expression"
    | "conceptual_feature"

  signalIds: string[]
  evidenceIds: string[]
  narrativeIds?: string[]

  selectionReasons: Array<
    | "observability"
    | "recurrence"
    | "cross_span_distribution"
    | "narrative_salience"
    | "figurative_signal"
    | "relational_load"
    | "interpretive_tension"
    | "reader_actionability"
    | "probe_potential"
  >

  provenanceId: string
  status: PreparationStatus
}
```

## 9.2 CandidateRelation

```ts
CandidateRelation {
  id: string
  workId: string
  sourceId: string
  targetId: string

  proposedLayer:
    | "STRUCTURAL"
    | "INTERPRETIVE"

  proposedType: string
  evidenceIds: string[]
  groundingRelationIds?: string[]
  signalIds?: string[]
  rationale: string
  qualification?: string

  provenanceId: string
  status: PreparationStatus
}
```

Candidates belong to the internal construction substrate. Projection determines whether they become reader-facing reference objects.

---

# 10. Unified Narrative Representation (UNR)

UNR is **not** modeled as `UNRNode` / `UNREdge`.

It is a logical integrated representation composed of typed objects connected by IDs:

```text
UNR =
  SourceDocument / Paragraph / Sentence / TextSpan
  + Evidence
  + EntityMention / EventMention
  + NarrativeEntity / NarrativeEvent / Scene / DiscourseSegment
  + NarrativeRelation
  + FigurativeSignal
  + CandidateCarrier
  + CandidateRelation
  + ProvenanceRecord
```

A pipeline run may store a light-weight manifest:

```ts
UNRManifest {
  id: string
  workId: string
  schemaVersion: string
  sourceDocumentId: string

  counts: {
    textSpans: number
    evidence: number
    mentions: number
    narrativeObjects: number
    figurativeSignals: number
    candidateCarriers: number
    candidateRelations: number
  }

  constructionRunId: string
  validationRunIds: string[]
  createdAt: string
}
```

`UNRManifest` indexes a typed representation; it does not flatten it.

---

# 11. Grounding and Rule Validation

Validation results should be addressable records rather than only log strings.

```ts
ValidationRecord {
  id: string
  workId: string
  targetType: string
  targetId: string

  validationType:
    | "schema"
    | "referential_integrity"
    | "source_anchor"
    | "grounding"
    | "rule"
    | "epistemic_wording"

  passed: boolean
  messages: string[]
  validatorVersion: string
  createdAt: string
}
```

Invalid objects remain internal candidates or are rejected; they cannot be projected to the reader-facing skeleton.

---

# 12. Meaning-Relevance Projection

UNR is intentionally richer than the reader-facing skeleton.

Projection is the explicit selection stage that answers:

> Which validated objects and relations are useful enough, grounded enough, and actionable enough to expose as an initial close-reading scaffold?

## 12.1 ProjectionRecord

```ts
ProjectionRecord {
  id: string
  workId: string
  projectionRunId: string

  sourceObjectType: string
  sourceObjectId: string

  projectionStatus: ProjectionStatus
  readerFacing: boolean

  selectionReasons: Array<
    | "recurrence"
    | "narrative_salience"
    | "figurative_signal"
    | "relational_load"
    | "cross_span_distribution"
    | "reader_actionability"
    | "interpretive_tension"
    | "grounding_quality"
  >

  selectionRationale: string
  provenanceId: string
  createdAt?: string
}
```

The combination of `projectionStatus`, `readerFacing`, and `selectionReasons` allows the system to answer reviewer/developer questions such as:

> Why was this node or relation shown?

## 12.2 ProjectionRun

```ts
ProjectionRun {
  id: string
  workId: string
  protocolVersion: string
  sourceUNRManifestId: string
  projectionRecordIds: string[]
  createdAt: string
}
```

---

# 13. Reader-Facing Reference Skeleton

The reader-facing skeleton is a projection from validated UNR objects, not a visualization of the entire UNR.

## 13.1 Carrier

```ts
Carrier {
  id: string
  workId: string
  candidateCarrierId: string
  label: string
  type: string
  signalIds: string[]
  evidenceIds: string[]
  projectionRecordId: string
  provenanceId: string
  status: PreparationStatus
}
```

## 13.2 StructuralRelation

```ts
StructuralRelation {
  id: string
  workId: string
  threadId?: string
  candidateRelationId?: string
  sourceId: string
  targetId: string

  type:
    | "recurs_with"
    | "contrasts_with"
    | "parallels"
    | "co_occurs_with"
    | "precedes"
    | "follows"
    | "changes_context"
    | "changes_function"
    | "shares_actor"
    | "shares_scene"
    | "causal_link"
    | "consequence_link"

  evidenceIds: string[]
  signalIds?: string[]
  rationale: string
  projectionRecordId: string
  provenanceId: string
  status: PreparationStatus
}
```

## 13.3 InterpretiveRelation

```ts
InterpretiveRelation {
  id: string
  workId: string
  threadId?: string
  candidateRelationId?: string

  sourceIds: string[]
  targetClaimId?: string

  type:
    | "supports"
    | "complicates"
    | "weakens"
    | "qualifies"
    | "possible_implication"
    | "alternative_to"
    | "reframes"

  evidenceIds: string[]
  groundingRelationIds: string[]
  relationText: string
  qualification: string

  projectionRecordId: string
  provenanceId: string
  status: PreparationStatus
}
```

A reference `InterpretiveRelation` is always an inspectable proposal.

## 13.4 FigurativeThread

```ts
FigurativeThread {
  id: string
  workId: string
  neutralLabel: string

  carrierIds: string[]
  signalIds: string[]
  evidenceIds: string[]
  structuralRelationIds: string[]
  interpretiveRelationIds: string[]

  distribution: {
    paragraphIds?: string[]
    sentenceIds?: string[]
    spanIds?: string[]
    spanOrders?: number[]
  }

  provenanceId: string
  status: PreparationStatus
}
```

Thread labels remain neutral enough not to encode a final thesis.

## 13.5 ReferenceSkeleton

```ts
ReferenceSkeleton {
  id: string
  workId: string
  projectionRunId: string

  carrierIds: string[]
  threadIds: string[]
  structuralRelationIds: string[]
  interpretiveRelationIds: string[]

  createdAt: string
  status: WorkStatus
}
```

---

# 14. MeaningProbe

```ts
MeaningProbe {
  id: string
  workId: string
  threadId?: string

  type:
    | "edge_removal"
    | "replacement"
    | "alternative_path"

  targetRelationIds: string[]
  targetCarrierId?: string
  prompt: string
  config?: object

  provenanceId: string
  status: PreparationStatus
}
```

Counterevidence remains primarily a general reader reasoning operation; it does not need to be pre-authored as a probe.

---

# 15. ProvenanceRecord

```ts
ProvenanceRecord {
  id: string

  methodBasis:
    | "DIRECT_TEXT"
    | "TEXT_STRUCTURE_RULE"
    | "COREFERENCE_RULE"
    | "NARRATIVE_RULE"
    | "MIP_MIPVU_INFORMED"
    | "FIGURATIVE_SIGNAL_RULE"
    | "STRUCTURAL_RULE"
    | "REFERENCE_INTERPRETIVE_PROTOCOL"
    | "PROJECTION_RULE"
    | "SCHOLARSHIP"
    | "READER_REASONING"

  executorType:
    | "DETERMINISTIC"
    | "TRADITIONAL_NLP"
    | "LLM"
    | "HUMAN"
    | "IMPORTED"
    | "READER"

  executorName?: string
  toolName?: string
  toolVersion?: string
  modelName?: string
  modelVersion?: string
  promptProtocolVersion?: string

  sourceRefs?: string[]
  methodNote?: string
  confidence?: number
  createdAt?: string
}
```

A confidence score never replaces grounding or provenance.

---

# 16. ConstructionRun

```ts
ConstructionRun {
  id: string
  workId: string
  sourceDocumentId: string
  protocolVersion: string
  startedAt: string
  completedAt?: string

  stages: Array<{
    stage: string
    status: "pending" | "running" | "completed" | "failed"
    executorSummary?: string
    outputCount?: number
    errorMessage?: string
  }>
}
```

This is useful for the user-facing `Import text → Generate skeleton` workflow and for reproducibility.

---

# 17. Reader Layer

## 17.1 ReaderSession

```ts
ReaderSession {
  id: string
  workId: string
  referenceSkeletonId: string
  participantCode: string
  condition?: string
  startedAt: string
  endedAt?: string
}
```

## 17.2 ReaderJudgment

```ts
ReaderJudgment {
  id: string
  sessionId: string
  relationId: string
  status: ReaderJudgmentStatus
  rationale?: string
  createdAt: string
}
```

## 17.3 ReaderNode

```ts
ReaderNode {
  id: string
  sessionId: string
  spanIds?: string[]
  evidenceId?: string
  label: string
  type: string
  rationale?: string
  basedOnNodeId?: string
}
```

## 17.4 ReaderRelation

```ts
ReaderRelation {
  id: string
  sessionId: string
  sourceId: string
  targetId: string
  label: string
  evidenceIds: string[]
  rationale?: string
  basedOnRelationId?: string
}
```

## 17.5 ReaderSelection

```ts
ReaderSelection {
  id: string
  sessionId: string
  itemType: "evidence" | "carrier" | "relation" | "thread" | "text_span"
  itemId: string
  note?: string
}
```

## 17.6 ReaderClaim

```ts
ReaderClaim {
  id: string
  sessionId: string
  text: string
  selectionIds: string[]
  relationIds: string[]
  qualification?: string
  createdAt: string
}
```

## 17.7 MeaningProbeEvent

```ts
MeaningProbeEvent {
  id: string
  sessionId: string
  probeId: string
  targetRelationIds: string[]

  result:
    | "preserved"
    | "weakened"
    | "broken"
    | "emergent"
    | "mixed"
    | "unsure"

  note?: string
  createdAt: string
}
```

## 17.8 InteractionEvent

```ts
InteractionEvent {
  id: string
  sessionId: string
  eventType: string
  targetType?: string
  targetId?: string
  payload?: object
  timestamp: string
}
```

---

# 18. WorkPackage v3

The package can contain both backend construction artifacts and the projected reader-facing skeleton. The UI must not expose all backend objects by default.

```ts
WorkPackageV3 {
  schemaVersion: "3"
  packageId: string
  packageStatus: WorkStatus

  work: Work
  sourceDocument: SourceDocument
  paragraphs: Paragraph[]
  sentences: Sentence[]
  textSpans: TextSpan[]
  evidence: Evidence[]

  entityMentions: EntityMention[]
  eventMentions: EventMention[]
  narrativeEntities: NarrativeEntity[]
  narrativeEvents: NarrativeEvent[]
  scenes: Scene[]
  discourseSegments: DiscourseSegment[]
  narrativeRelations: NarrativeRelation[]

  figurativeSignals: FigurativeSignal[]
  candidateCarriers: CandidateCarrier[]
  candidateRelations: CandidateRelation[]

  unrManifest: UNRManifest
  validations: ValidationRecord[]
  projectionRun: ProjectionRun
  projectionRecords: ProjectionRecord[]

  carriers: Carrier[]
  threads: FigurativeThread[]
  structuralRelations: StructuralRelation[]
  interpretiveRelations: InterpretiveRelation[]
  probes: MeaningProbe[]
  referenceSkeleton: ReferenceSkeleton

  provenance: ProvenanceRecord[]
  constructionRun?: ConstructionRun
}
```

ReaderSession / ReaderClaim / reader-authored records do not belong inside the immutable reference package.

---

# 19. Validation Rules

A reader-facing skeleton may be generated only when all selected source objects satisfy applicable rules.

## 19.1 Source anchoring

- every `Paragraph`, `Sentence`, `TextSpan`, mention, and event mention stays inside `SourceDocument.text` bounds;
- `startChar < endChar`;
- exact text reconstructed from offsets matches stored text;
- TextSpan → Sentence → Paragraph → SourceDocument references resolve.

## 19.2 Mention/entity integrity

- every canonical mention link resolves;
- a pronoun or alias mention does not become a separate canonical character merely because surface form differs;
- event mentions and canonical events remain distinguishable.

## 19.3 Narrative integrity

- narrative relation source/target IDs resolve;
- event participants resolve to canonical entities;
- scene/discourse links resolve to text spans.

## 19.4 Figurative signal grounding

- every signal points to exact spans/evidence;
- `MIP_METAPHOR` includes an MIP/MIPVU-informed record where applicable;
- non-MIP signals are not mislabeled as lexical metaphors.

## 19.5 Candidate relation grounding

- candidate StructuralRelation has source, target, evidence, and rationale;
- candidate InterpretiveRelation additionally has qualified wording and grounding relation(s).

## 19.6 Projection integrity

- every reader-facing carrier/relation/thread has a `ProjectionRecord` with `projectionStatus = selected` and `readerFacing = true`;
- excluded objects do not silently appear in the skeleton;
- every selection has at least one `selectionReason` and a rationale.

## 19.7 Provenance

- reference objects record both `methodBasis` and `executorType`;
- `executorType = LLM` never substitutes for theoretical or procedural provenance.

## 19.8 Reader/reference separation

- reader-authored objects remain outside the immutable reference package;
- editing a reference relation creates a reader-layer revision.

---

# 20. Database Mapping

A database is optional for the current research prototype. If a normalized relational store is later used, recommended groups are:

```text
work
source_document
paragraph
sentence
text_span
evidence
evidence_span

entity_mention
event_mention
narrative_entity
narrative_event
scene
discourse_segment
narrative_relation

figurative_signal
candidate_carrier
candidate_relation
unr_manifest
validation_record
projection_run
projection_record

carrier
figurative_thread
structural_relation
interpretive_relation
meaning_probe
reference_skeleton

provenance_record
construction_run

reader_session
reader_judgment
reader_node
reader_relation
reader_selection
reader_claim
meaning_probe_event
interaction_event
```

---

# 21. Migration from v2

Minimum migration rules:

```text
Work.source*                 → SourceDocument
TextSpan.startOffset/endOffset → startChar/endChar
FigurativeFeature            → FigurativeSignal where semantically compatible
NarrativeEntity(event/action/scene/discourse)
                             → split into typed NarrativeEvent / Scene / DiscourseSegment
Carrier                      → CandidateCarrier + projected Carrier
existing relations           → CandidateRelation + validated/projected reference relation
v2 WorkPackage               → WorkPackageV3
```

Do not mechanically convert every v2 `FigurativeFeature` into `MIP_METAPHOR`.

---

# 22. Authority Rule

When current schema descriptions conflict:

```text
MeaningForge_System_Design_Development_Spec_v7_3.md
    >
MeaningForge_Data_Model_v3.md
    >
MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md
    >
older Data Model / prototype JSON
```

The Construction Guide decides **how records are produced**.  
This Data Model decides **what records look like**.  
The System Spec decides **what the system must do and what the reader experiences**.
