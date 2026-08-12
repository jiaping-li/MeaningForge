# MeaningForge Data Model v2

> **Version:** 2026-08-12  
> **Status:** Canonical data contract for the current MeaningForge prototype  
> **Relationship to v1:** v2 separates structural vs interpretive relations and, critically, separates the **methodological basis** of an annotation from the **executor** that performed the fixed protocol.

---

# 1. Modeling Principle

MeaningForge does not store a final literary answer.

The reference substrate represents:

```text
Text
→ Evidence
→ Figurative / Narrative Objects
→ Structural Relations
→ Qualified Interpretive Proposals
→ Figurative Threads
```

The reader then creates a separate personal layer:

```text
Reference Scaffold
↕
keep / unsure / reject / edit / add
↓
Reader Evidence + Relations + Claims
```

Three epistemic rules are non-negotiable:

1. **Text grounding is addressable.**
2. **Reference interpretation is a proposal, not truth.**
3. **Reference data and reader-authored data never collapse into one layer.**

---

# 2. Method Basis vs Executor

This distinction is central to v2.

A record can be based on MIP/MIPVU-informed rules while being executed by an LLM.

For example:

```text
method_basis = MIP_MIPVU_INFORMED
executor_type = LLM
```

This means:

> an LLM executed a fixed MIP/MIPVU-informed annotation step.

It does **not** mean:

> the LLM invented the method or that the output is automatically a correct literary interpretation.

## 2.1 MethodBasis

```text
DIRECT_TEXT
MIP_MIPVU_INFORMED
NARRATIVE_RULE
STRUCTURAL_RULE
SCHOLARSHIP
REFERENCE_INTERPRETIVE_PROTOCOL
READER_REASONING
```

## 2.2 ExecutorType

```text
DETERMINISTIC
LLM
HUMAN
IMPORTED
READER
```

---

# 3. Common Types

```ts
type WorkStatus =
  | "draft"
  | "development"
  | "pilot_ready"
  | "study_ready";

type PreparationStatus =
  | "candidate"
  | "schema_validated"
  | "grounding_validated"
  | "reference_ready"
  | "pilot_ready"
  | "study_ready"
  | "rejected";

type RelationLayer =
  | "STRUCTURAL"
  | "INTERPRETIVE";

type ReaderJudgmentStatus =
  | "keep"
  | "unsure"
  | "reject"
  | "edit";
```

`study_ready` does not imply a gold-standard interpretation. It means the item satisfies the current protocol and validation requirements for use as a frozen reference scaffold.

---

# 4. Work

```ts
Work {
  id: string
  title: string
  author?: string
  language: string
  editionId: string
  sourceDescription?: string
  sourceUri?: string
  status: WorkStatus
  createdAt?: string
}
```

---

# 5. TextSpan

```ts
TextSpan {
  id: string
  workId: string
  chapterId?: string
  paragraphId?: string
  sentenceId?: string
  order: number
  text: string
  startOffset?: number
  endOffset?: number
  speaker?: string
  sceneId?: string
}
```

A TextSpan is the canonical addressable return point from the scaffold to the original text.

---

# 6. Evidence

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
  note?: string
  provenanceId: string
  status: PreparationStatus
}
```

Evidence is textual grounding. A high-level theme or claim is not Evidence.

---

# 7. Narrative Backbone

## 7.1 NarrativeUnit

```ts
NarrativeUnit {
  id: string
  workId: string
  order: number
  chapterId?: string
  spanIds: string[]
  summary?: string
}
```

## 7.2 NarrativeEntity

```ts
NarrativeEntity {
  id: string
  workId: string
  type:
    | "character"
    | "object"
    | "event"
    | "action"
    | "scene"
    | "discourse"
    | "place"
  label: string
  evidenceIds: string[]
  provenanceId: string
}
```

## 7.3 NarrativeRelation

```ts
NarrativeRelation {
  id: string
  workId: string
  sourceId: string
  targetId: string
  type:
    | "participates_in"
    | "performed_by"
    | "acts_on"
    | "occurs_in"
    | "precedes"
    | "causes"
    | "results_in"
    | "associated_with"
    | "spoken_by"
    | "directed_to"
  evidenceIds: string[]
  provenanceId: string
  status: PreparationStatus
}
```

Narrative relations provide context. They are not automatically figurative or interpretive relations.

---

# 8. FigurativeFeature

```ts
FigurativeFeature {
  id: string
  workId: string
  evidenceId: string
  surfaceForm: string
  type:
    | "metaphor_related"
    | "recurrent_imagery"
    | "symbolic_object_candidate"
    | "narrative_pattern"
    | "discourse_pattern"

  mipStatus?: "applicable" | "not_applicable" | "uncertain"

  mipRecord?: {
    lexicalUnit?: string
    contextualMeaning?: string
    basicMeaning?: string
    contrastPresent?: boolean
    comparisonDefensible?: boolean
  }

  provenanceId: string
  status: PreparationStatus
}
```

MIP/MIPVU-informed fields are relevant only where word-use level analysis is defensible.

---

# 9. Carrier

```ts
Carrier {
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

  featureIds: string[]
  evidenceIds: string[]

  selectionReasons: Array<
    | "observability"
    | "recurrence_distribution"
    | "narrative_salience"
    | "relational_load"
    | "interpretive_tension"
    | "reader_actionability"
    | "probe_potential"
  >

  provenanceId: string
  status: PreparationStatus
}
```

Carrier is a reader-facing anchor. It is not automatically a literary theme.

---

# 10. FigurativeThread

```ts
FigurativeThread {
  id: string
  workId: string
  neutralLabel: string
  carrierIds: string[]
  featureIds: string[]
  evidenceIds: string[]
  structuralRelationIds: string[]
  interpretiveRelationIds: string[]

  distribution: {
    chapterIds?: string[]
    spanIds?: string[]
    spanOrders?: number[]
  }

  provenanceId: string
  status: PreparationStatus
}
```

Thread labels should remain neutral enough not to encode a final thesis.

---

# 11. StructuralRelation

```ts
StructuralRelation {
  id: string
  workId: string
  threadId?: string
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
  rationale: string
  provenanceId: string
  status: PreparationStatus
}
```

Structural relations should be grounded as closely as possible in observable textual/narrative structure.

---

# 12. InterpretiveRelation

```ts
InterpretiveRelation {
  id: string
  workId: string
  threadId?: string

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

  provenanceId: string
  status: PreparationStatus
}
```

A reference InterpretiveRelation is an inspectable proposal.

`study_ready` requires grounding and qualification, not expert consensus.

---

# 13. MeaningProbe

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

Counterevidence is primarily a general reasoning lens/operation. It can also be encoded in probe configuration when a study material explicitly requires it.

---

# 14. ProvenanceRecord

```ts
ProvenanceRecord {
  id: string

  methodBasis:
    | "DIRECT_TEXT"
    | "MIP_MIPVU_INFORMED"
    | "NARRATIVE_RULE"
    | "STRUCTURAL_RULE"
    | "SCHOLARSHIP"
    | "REFERENCE_INTERPRETIVE_PROTOCOL"
    | "READER_REASONING"

  executorType:
    | "DETERMINISTIC"
    | "LLM"
    | "HUMAN"
    | "IMPORTED"
    | "READER"

  executorName?: string
  modelName?: string
  modelVersion?: string
  promptProtocolVersion?: string

  sourceRefs?: string[]
  methodNote?: string
  confidence?: number

  createdAt?: string
}
```

Important examples:

```json
{
  "methodBasis": "MIP_MIPVU_INFORMED",
  "executorType": "LLM"
}
```

and:

```json
{
  "methodBasis": "STRUCTURAL_RULE",
  "executorType": "DETERMINISTIC"
}
```

Both are valid.

---

# 15. Reader Layer

## 15.1 ReaderSession

```ts
ReaderSession {
  id: string
  workId: string
  participantCode: string
  condition?: string
  startedAt: string
  endedAt?: string
}
```

## 15.2 ReaderJudgment

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

## 15.3 ReaderNode

```ts
ReaderNode {
  id: string
  sessionId: string
  evidenceId?: string
  label: string
  type: string
  rationale?: string
  basedOnNodeId?: string
}
```

## 15.4 ReaderRelation

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

## 15.5 ReaderSelection

```ts
ReaderSelection {
  id: string
  sessionId: string
  itemType: "evidence" | "carrier" | "relation" | "thread"
  itemId: string
  note?: string
}
```

## 15.6 ReaderClaim

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

## 15.7 MeaningProbeEvent

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

## 15.8 InteractionEvent

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

InteractionEvent is a research log, not the reader's personal interpretation.

---

# 16. WorkPackage

Reference data is frozen independently of reader data.

```ts
WorkPackage {
  schemaVersion: string
  packageId: string
  packageStatus: WorkStatus

  work: Work
  textSpans: TextSpan[]
  evidence: Evidence[]

  narrativeUnits: NarrativeUnit[]
  narrativeEntities: NarrativeEntity[]
  narrativeRelations: NarrativeRelation[]

  figurativeFeatures: FigurativeFeature[]
  carriers: Carrier[]
  threads: FigurativeThread[]

  structuralRelations: StructuralRelation[]
  interpretiveRelations: InterpretiveRelation[]
  probes: MeaningProbe[]

  provenance: ProvenanceRecord[]
}
```

---

# 17. Validation Rules

A package can be `study_ready` when all applicable validation rules pass.

## Referential integrity

- every ID reference resolves;
- every Evidence resolves to TextSpan;
- every Carrier resolves to Evidence;
- every Thread resolves to its members;
- every relation source/target exists.

## Grounding

- StructuralRelation has evidence;
- InterpretiveRelation has evidence;
- InterpretiveRelation has groundingRelationIds or an explicit equivalent grounding record;
- InterpretiveRelation has non-empty qualification.

## Provenance

- every reference object has provenance;
- methodBasis and executorType are both recorded;
- LLM execution is not mislabeled as theoretical provenance.

## Reader/reference separation

- reader records never appear inside a frozen reference WorkPackage.

## Epistemic presentation

- `study_ready` never means “correct interpretation”;
- it means “validated reference proposal suitable for the frozen study material.”

---

# 18. Database Mapping

A relational database may store structural and interpretive relations in separate tables or in a shared table with:

```text
relation_layer = STRUCTURAL | INTERPRETIVE
```

If a shared table is used, layer-specific validation remains mandatory.

Recommended normalized groups:

```text
work
text_span
evidence
evidence_span

narrative_unit
narrative_entity
narrative_relation
narrative_relation_evidence

figurative_feature
carrier
carrier_feature
carrier_evidence

figurative_thread
thread_carrier
thread_feature
thread_evidence

meaning_relation
relation_evidence
relation_grounding

meaning_probe
probe_target_relation

provenance_record

reader_session
reader_judgment
reader_node
reader_relation
reader_relation_evidence
reader_selection
reader_claim
meaning_probe_event
interaction_event
```

---

# 19. Authority Rule

When schema descriptions conflict:

```text
MeaningForge_System_Design_Development_Spec_v7_1
    >
MeaningForge_Data_Model_v2
    >
older Data Model / prototype JSON
```

The Annotation Guide decides **how records are produced**.

This Data Model decides **what records must look like**.
