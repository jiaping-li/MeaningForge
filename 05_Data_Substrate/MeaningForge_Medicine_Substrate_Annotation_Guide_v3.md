# MeaningForge Medicine Substrate Construction Specification v3

> **Version:** 2026-08-13  
> **Filename retained for continuity:** `MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md`  
> **Status:** Canonical automatic substrate-construction protocol  
> **Supersedes:** `MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md`  
> **Scope:** How an imported literary text is automatically converted into a validated UNR and then projected into a reader-facing MeaningForge reference skeleton.  
> **Important revision:** This is no longer primarily an annotator instruction manual. It is an executable construction specification. Each stage defines **Input → Processing → Output**.

---

# 1. Purpose

MeaningForge v3 implements this end-to-end route:

```text
Literary Text
↓
1. Text Structuring & Traceable Evidence Anchoring
↓
2. Narrative Backbone Extraction
↓
3. Coreference / Event Linking
↓
4. Multi-source Figurative Signal Detection
↓
5. Candidate Carrier Generation
↓
6. Candidate Relation Generation
↓
7. UNR — Unified Narrative Representation
↓
8. Grounding / Rule Validation
↓
9. Meaning-Relevance Projection
↓
10. Whole-text Figurative Reference Skeleton Construction
↓
11. Reference Skeleton Export / Reader Handoff
```

The user-facing interaction can be as simple as:

```text
Import text
→ Generate skeleton
```

The internal implementation is not required to be one algorithm and is not required to be purely rule-based.

---

# 2. Automatic ≠ Purely Rule-Based

The pipeline may combine:

```text
deterministic algorithms
+ traditional NLP
+ fixed theoretical procedures
+ LLM-assisted semantic execution
```

Examples:

- deterministic: offsets, segmentation bookkeeping, exact string matching, schema validation;
- traditional NLP: sentence segmentation, NER, dependency/predicate-argument extraction, coreference, event candidates;
- fixed theoretical procedures: MIP/MIPVU-informed lexical analysis, carrier gates, relation taxonomy, projection rules;
- LLM-assisted semantic execution: normalize ambiguous entities/events, execute structured lexical records, classify candidate relations, apply fixed projection criteria, generate qualified rationale text.

The executor does not redefine the method.

---

# 3. Core Epistemic Principle

The generated skeleton is:

> **an evidence-grounded, inspectable, contestable reference scaffold**

not:

> **an automatically discovered correct literary meaning**

The construction system must therefore preserve:

1. exact source anchoring;
2. typed narrative and figurative objects;
3. grounding for candidate relations;
4. method/executor provenance;
5. explicit projection reasons;
6. qualified interpretive wording;
7. separation between reference and reader-authored layers.

---

# 4. Global Input and Output Contract

## Input

Minimum:

```ts
ImportedWork {
  title: string
  author?: string
  language: string
  editionId?: string
  text: string
  sourceDescription?: string
}
```

## Final output

```text
WorkPackageV3
+
ReferenceSkeleton
```

The full package can retain backend UNR/candidate/validation objects for debugging and reproducibility, while the reader UI consumes only the projected skeleton plus exact source text.

---

# 5. Step 1 — Text Structuring & Traceable Evidence Anchoring

## Input

```text
ImportedWork.text
```

## Processing

1. preserve or normalize paragraph boundaries under a versioned normalization policy;
2. generate `SourceDocument`;
3. split into `Paragraph[]`;
4. split paragraphs into `Sentence[]`;
5. create stable `TextSpan[]` suitable for evidence return;
6. compute canonical `[startChar, endChar)` offsets against `SourceDocument.text`;
7. generate deterministic IDs;
8. optionally preclassify obvious evidence forms such as dialogue, repeated exact strings, or quoted spans.

Recommended executors:

```text
DETERMINISTIC
+ TRADITIONAL_NLP
```

## Output

```text
SourceDocument
Paragraph[]
Sentence[]
TextSpan[]
initial Evidence[]
```

## Required checks

- `text.slice(startChar, endChar) == storedText`;
- every span belongs to the correct sentence/paragraph;
- no source text is silently rewritten;
- paragraph order and sentence order are stable.

---

# 6. Step 2 — Narrative Backbone Extraction

## Input

```text
TextSpan[]
Sentence[]
initial Evidence[]
```

## Processing

The pipeline should implement or orchestrate:

```text
NER / mention detection
object mention extraction
predicate-argument extraction
event extraction
scene segmentation
quote detection
speaker attribution
addressee attribution where defensible
place/context detection
basic temporal / causal proposal
```

For literary Chinese or other texts where generic NER performs poorly, LLM-assisted structured extraction may supplement traditional NLP, but outputs must use the fixed schema.

## Output

```text
EntityMention[]
EventMention[]
NarrativeEntity[]
NarrativeEvent[]
Scene[]
DiscourseSegment[]
NarrativeRelation[]
updated Evidence[]
```

## Important boundary

A narrative object is contextual infrastructure. It does **not** become figurative merely because it is salient in the story.

---

# 7. Step 3 — Coreference / Event Linking

## Input

```text
EntityMention[]
EventMention[]
NarrativeEntity[]
NarrativeEvent[]
```

## Processing

1. cluster aliases, names, pronouns, and repeated references;
2. link mentions to canonical entities;
3. link compatible event mentions to canonical events;
4. resolve speaker references when possible;
5. preserve uncertainty rather than forcing a merge when evidence is weak.

Example:

```text
华老栓 / 老栓 / 他
→ distinct EntityMention records
→ corefers_to
→ one NarrativeEntity
```

Recommended executors:

```text
TRADITIONAL_NLP
+ fixed coreference rules
+ optional LLM-assisted disambiguation
```

## Output

```text
resolved EntityMention[]
resolved EventMention[]
canonical NarrativeEntity[]
canonical NarrativeEvent[]
coreference NarrativeRelation[]
```

---

# 8. Step 4 — Multi-source Figurative Signal Detection

This stage explicitly replaces the old assumption that the figurative layer is equivalent to lexical metaphor detection.

## Input

```text
TextSpan[]
Evidence[]
Narrative Backbone
```

## Processing routes

### Route A — MIP/MIPVU-informed lexical analysis

For defensible lexical candidates, fill the fixed record:

```text
lexical unit
contextual meaning
possible basic meaning
contrast present?
comparison defensible?
```

This route yields `MIP_METAPHOR` signals when the protocol supports that label.

### Route B — Recurrence / repetition

Use exact matching, normalized matching, lemma/semantic grouping, and cross-span distribution to find recurring expressions, images, objects, or phrases.

### Route C — Contrast / juxtaposition / parallel

Use discourse structure, co-location, syntax, event/narrative alignment, and fixed relation cues to propose:

```text
CONTRAST
JUXTAPOSITION
PARALLEL
```

### Route D — Anomaly / context shift

Detect unusual use, role/function changes, narrative expectation violations, speaker/context shifts, or repeated object/action appearing in a changed context.

### Route E — Cross-span association

Use shared entity/event/object, recurrence, semantic similarity, structural relation, and discourse context to propose associations that are distributed across the work.

## Output

```text
FigurativeSignal[]
```

Canonical signal types:

```text
MIP_METAPHOR
RECURRENCE
REPETITION
CONTRAST
JUXTAPOSITION
PARALLEL
ANOMALY
CONTEXT_SHIFT
CROSS_SPAN_ASSOCIATION
```

## Required rule

A signal is not yet a Carrier, relation, theme, or interpretation.

---

# 9. Step 5 — Candidate Carrier Generation

## Input

```text
FigurativeSignal[]
NarrativeEntity[]
NarrativeEvent[]
Scene[]
DiscourseSegment[]
Evidence[]
```

## Processing

Generate candidate reader anchors from observable objects such as:

```text
object
action
discourse
scene / ritual
sensory image
recurrent expression
conceptual feature
```

Apply fixed gates:

```text
A. observability
B. recurrence / cross-span distribution
C. narrative salience
D. figurative signal support
E. relational load
F. interpretive tension
G. reader actionability
H. optional probe potential
```

The pipeline should retain the reasons that fired for each candidate.

## Output

```text
CandidateCarrier[]
```

A candidate can later be excluded by validation or projection.

---

# 10. Step 6 — Candidate Relation Generation

## Input

```text
CandidateCarrier[]
FigurativeSignal[]
NarrativeRelation[]
Evidence[]
```

## Processing A — Structural candidates

Generate relation candidates using signals and narrative context.

Allowed structural types:

```text
recurs_with
contrasts_with
parallels
co_occurs_with
precedes
follows
changes_context
changes_function
shares_actor
shares_scene
causal_link
consequence_link
```

Every Structural candidate requires:

```text
source
target
evidence
rationale
provenance
```

## Processing B — Interpretive candidates

Only after structural/textual grounding exists, the pipeline may generate qualified interpretive proposals.

Allowed interpretive types:

```text
supports
complicates
weakens
qualifies
possible_implication
alternative_to
reframes
```

Every Interpretive candidate requires:

```text
evidenceIds
groundingRelationIds
relationText
qualification
provenance
```

Prefer wording such as:

```text
may support...
a possible reading is...
these passages make ... plausible...
```

Avoid absolute wording such as:

```text
the author clearly means...
this definitely symbolizes...
the only interpretation is...
```

## Output

```text
CandidateRelation[]
```

---

# 11. Step 7 — UNR Construction

## Input

All typed objects produced so far.

## Processing

Build an ID-linked logical integrated representation:

```text
Text anchors
+ Evidence
+ Mentions
+ Narrative objects / relations
+ FigurativeSignal
+ CandidateCarrier
+ CandidateRelation
+ Provenance
```

Do **not** flatten everything into generic `UNRNode` / `UNREdge` records unless a visualization/debug adapter requires a derived graph view.

## Output

```text
UNRManifest
+ all typed UNR component arrays
```

## UNR principle

UNR is backend substrate, not the HCI contribution and not a claimed new literary theory.

---

# 12. Step 8 — Grounding / Rule Validation

## Input

```text
UNR components
```

## Processing

### Schema validation

- required fields;
- enum values;
- IDs;
- field types.

### Source-anchor validation

- offsets inside source bounds;
- exact text matches offsets;
- mention/span nesting is valid.

### Referential integrity

- every reference resolves;
- candidate source/target exists;
- evidence IDs exist;
- provenance IDs exist.

### Narrative validation

- mention/entity links resolve;
- event participants resolve;
- scene/discourse anchors exist.

### Figurative-signal validation

- signal spans exist;
- MIP-specific fields only used where appropriate;
- non-MIP signals are not relabeled as lexical metaphor.

### Relation grounding validation

- Structural candidate has evidence;
- Interpretive candidate has evidence + grounding relation + qualification.

### Epistemic validation

Warn or reject:

- theme-like certainty presented as fact;
- fabricated source quotation;
- ungrounded high-level relation;
- executor identity used as epistemic authority.

## Output

```text
ValidationRecord[]
validated UNR
rejected/repairable object IDs
```

## Repair loop

```text
validator failure
→ targeted repair request
→ repair only invalid records
→ rerun validators
```

Do not regenerate the entire work merely because one record fails.

---

# 13. Step 9 — Meaning-Relevance Projection

This is the major v3 stage that separates **what the backend knows/proposes** from **what the reader should initially see**.

## Input

```text
validated UNR
```

## Processing

For every projection candidate, record:

```text
projectionStatus: candidate | selected | excluded
readerFacing: true | false
selectionReasons[]
selectionRationale
```

Canonical projection reasons:

```text
recurrence
narrative_salience
figurative_signal
relational_load
cross_span_distribution
reader_actionability
interpretive_tension
grounding_quality
```

Projection should prefer objects that:

1. are exactly traceable;
2. connect multiple meaningful spans/contexts;
3. have sufficient relational load;
4. support an inspectable reader action;
5. do not require presenting an unqualified final thesis;
6. keep the whole-text skeleton sparse enough to inspect.

## Output

```text
ProjectionRun
ProjectionRecord[]
selected CandidateCarrier IDs
selected CandidateRelation IDs
```

## Reviewer-facing reason

This stage allows the system to answer:

> Why was this node/relation exposed to the reader while another UNR object was not?

---

# 14. Step 10 — Whole-text Figurative Reference Skeleton Construction

## Input

```text
selected projected carriers
selected projected relations
validated evidence
figurative signals
```

## Processing

1. materialize projected `Carrier[]`;
2. materialize projected `StructuralRelation[]`;
3. materialize only qualified projected `InterpretiveRelation[]`;
4. group connected projected objects into neutral `FigurativeThread[]`;
5. calculate cross-text distribution;
6. create `ReferenceSkeleton`;
7. optionally generate eligible `MeaningProbe[]`.

Thread labels should describe observable material, not final themes.

Prefer:

```text
blood / food / treatment
grave / crow / memorial
public talk / certainty / rumor
```

Avoid:

```text
feudal ignorance
failed revolution
authorial despair
```

## Output

```text
Carrier[]
StructuralRelation[]
InterpretiveRelation[]
FigurativeThread[]
ReferenceSkeleton
optional MeaningProbe[]
```

---

# 15. Step 11 — Reference Skeleton Export / Reader Handoff

## Input

```text
SourceDocument
validated UNR
ProjectionRun
ReferenceSkeleton
```

## Processing

Assemble `WorkPackageV3` and expose the reader-facing subset to the UI.

Recommended package:

```text
WorkPackageV3
├── work
├── sourceDocument
├── paragraphs
├── sentences
├── textSpans
├── evidence
├── entityMentions / eventMentions
├── narrativeEntities / narrativeEvents / scenes / discourseSegments
├── narrativeRelations
├── figurativeSignals
├── candidateCarriers / candidateRelations
├── unrManifest
├── validations
├── projectionRun / projectionRecords
├── carriers
├── threads
├── structuralRelations
├── interpretiveRelations
├── probes
├── referenceSkeleton
└── provenance
```

Reader-authored data is stored separately.

## Reader handoff

```text
ReferenceSkeleton
↓
════════ Reader Interface ════════
↓
Reader Interpretive Layer
↓
Reader-authored Interpretation
```

---

# 16. Execution Orchestration

A simple local implementation may expose one orchestrator:

```text
constructSubstrate(importedText)
```

Internally it calls stage modules, for example:

```text
structureText
extractNarrativeBackbone
resolveCoreference
findFigurativeSignals
generateCarrierCandidates
generateRelationCandidates
buildUNR
validateUNR
projectMeaningRelevance
buildReferenceSkeleton
exportWorkPackage
```

This does **not** require microservices or an agent framework.

---

# 17. LLM Execution Contract

Whenever an LLM is used:

## Input must include

- exact source spans or bounded source context;
- the fixed schema;
- allowed enums;
- method/protocol instructions;
- explicit requirement not to fabricate evidence.

## Output must be

- structured JSON or another machine-validated structure;
- linked to exact IDs;
- repairable at record level.

## Prohibited behavior

The LLM must not:

- invent ontology types;
- rewrite the source as evidence;
- invent quotations;
- infer a final theme and then backfill fake support;
- skip source IDs;
- silently turn uncertainty into certainty.

## Retry

Retry only failed records with validator feedback.

---

# 18. Human Involvement

Human annotation is not a hard dependency of the automatic construction architecture.

Human work may be used for:

```text
spot check
material sanity check
protocol audit
study-material freezing
```

For a controlled study, one generated skeleton may be frozen and reused across participants to avoid model-version or participant-specific scaffold drift. That is a **study-control choice**, not a limitation of the product architecture.

Do not claim expert agreement unless such a study is actually conducted.

---

# 19. Reliability / Audit

Record at minimum:

```text
construction protocol version
source edition / checksum
stage executor
traditional NLP tool/model versions where relevant
LLM model/version where relevant
prompt protocol version where relevant
validation results
projection protocol version
reference skeleton ID
```

Inter-annotator agreement is not automatically required unless the paper claims the annotation scheme itself has high inter-rater reliability.

---

# 20. Automatic Construction Acceptance Checklist

- [ ] user can import a complete text
- [ ] SourceDocument is created
- [ ] paragraph/sentence/span offsets are exact
- [ ] mention and canonical entity are separated
- [ ] narrative entity/event/scene/discourse extraction runs
- [ ] coreference/event linking runs
- [ ] multi-source FigurativeSignal detection runs
- [ ] candidate carriers are generated with reasons
- [ ] candidate relations are grounded
- [ ] UNR manifest is produced
- [ ] schema/source/referential/grounding/rule validation passes for projected objects
- [ ] ProjectionRecord exists for every reader-facing object
- [ ] selected/excluded projection state is inspectable
- [ ] skeleton contains nodes and edges, not only a flat feature list
- [ ] every reader-facing relation can return to exact source text
- [ ] interpretive relations remain qualified
- [ ] reader layer is separate
- [ ] generated skeleton can be exported/reloaded

---

# 21. Correct Project Framing

Do not describe this specification as:

> an LLM system that automatically understands literary meaning.

Prefer:

> **MeaningForge automatically constructs an initial, evidence-grounded and contestable reference scaffold using predefined textual, narrative, figurative, validation, and projection procedures.**

Also acceptable:

> **The automatic construction layer may combine deterministic processing, traditional NLP, fixed theoretical procedures, and LLM-assisted semantic execution. The resulting scaffold is a substrate for reader reasoning, not the system's final interpretation.**

---

# 22. Development Priority

For Codex, the correct technical priority is now:

```text
P0  import full text + stable source anchors
P1  narrative backbone + mention/entity separation
P2  multi-source FigurativeSignal
P3  candidate carrier/relation generation
P4  UNR + validation
P5  Meaning-Relevance Projection
P6  automatic ReferenceSkeleton generation
P7  connect generated skeleton to existing reader interface
P8  reader personal layer + logging/export
```

The project is no longer complete if it can only load a hand-authored substrate JSON.
