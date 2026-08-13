# MeaningForge System Design and Development Specification v7.3

> **Version:** 2026-08-13  
> **Status:** Current system-design and prototype-development authority for the CHI 2027 research prototype  
> **Supersedes for development:** `MeaningForge_System_Design_Development_Spec_v7_2.md` and older system specs  
> **Companion documents:** `MeaningForge_Data_Model_v3.md`, `MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md`, `README_Current_Project.md`  
> **Prototype principle:** Keep the implementation research-demo-level and locally runnable. The system must now support end-to-end **full-text import → automatic substrate construction → UNR → Meaning-Relevance Projection → reader-facing skeleton**, while JSON remains the persistence/export contract rather than the required starting point.  
> **Important:** v7.3 changes the technical entry path, not the HCI research question. Existing reader-facing commitments remain unless explicitly revised below.

---

# 0. v7.3 Consolidation Decisions

## 0.1 Why v7.3 exists

v7.2 correctly stabilized the reader-facing architecture, provenance model, structural/interpretive distinction, and contestable reference scaffold. However, it intentionally reduced Phase-1 engineering to a preconstructed/frozen WorkPackage loaded by the runtime.

That implementation shortcut is no longer the target architecture.

v7.3 restores the end-to-end construction path as a **required engineering capability**:

```text
user imports full literary text
→ MeaningForge automatically executes substrate construction
→ validated UNR
→ Meaning-Relevance Projection
→ Whole-text Figurative Reference Skeleton
→ reader begins close reading and revision
```

The key change is therefore not “more fields.” It is that MeaningForge itself must be able to produce the initial nodes and edges from an imported full text rather than requiring the team to hand-author the complete substrate JSON first.

## 0.2 What remains unchanged from v7.2

The following are stable HCI/system commitments:

- text remains the primary reading surface;
- the reader-facing artifact is a whole-text figurative reference scaffold/skeleton;
- `Narrative Backbone`, reader-facing reference scaffold, and `Personal Reading Layer` remain distinct epistemic roles;
- the scaffold is a proposal, not literary truth;
- provenance and exact evidence grounding are first-class;
- the system supports text-led and overview-led entry;
- one open thread remains a coherent local reasoning workspace;
- reader actions create a personal layer rather than rewriting reference data;
- Trace, Compare, Challenge, Counterevidence, suitable probes, and Compose remain the core reasoning loop;
- a raw all-node narrative graph is not the default interface;
- replacement remains secondary;
- researcher/debug information stays separate from the normal reader experience.

## 0.3 Revision A — System entry becomes full-text import + automatic construction

Canonical product flow:

```text
Import literary text
↓
Generate skeleton
↓
Reader Interface
```

Internally, `Generate skeleton` expands to:

```text
1. Text Structuring & Traceable Evidence Anchoring
2. Narrative Backbone Extraction
3. Coreference / Event Linking
4. Multi-source Figurative Signal Detection
5. Candidate Carrier / Relation Generation
6. UNR — Unified Narrative Representation
7. Grounding / Rule Validation
8. Meaning-Relevance Projection
9. Whole-text Figurative Reference Skeleton
```

A prebuilt `WorkPackageV3` remains a valid cache, test fixture, import/export format, and controlled-study artifact. It is no longer the only supported starting point.

## 0.4 Revision B — Automatic does not mean purely rule-based

The construction pipeline may combine:

```text
deterministic algorithms
+ traditional NLP
+ fixed theoretical procedures
+ LLM-assisted semantic execution
```

The user does not need to understand which executor handled each stage.

The system must, however, record that distinction for reproducibility and audit.

`methodBasis` and `executorType` remain separate.

## 0.5 Revision C — FigurativeSignal becomes explicit and multi-source

The computational figurative layer is not equivalent to MIP/MIPVU.

Canonical signal families include:

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

MIP/MIPVU informs one lexical route; other signals arise from textual distribution, narrative structure, discourse/context change, or cross-span relations.

## 0.6 Revision D — UNR is a logical integration layer

UNR is not a new generic `UNRNode` / `UNREdge` ontology.

It is the typed, ID-linked backend representation integrating:

```text
source anchors
Evidence
mentions / canonical narrative objects
NarrativeRelation
FigurativeSignal
CandidateCarrier
CandidateRelation
Provenance
```

UNR is implementation substrate, not the HCI contribution claim.

## 0.7 Revision E — UNR and reader-facing skeleton are separated by projection

UNR should be richer than the initial reader interface.

Meaning-Relevance Projection determines which validated objects become reader-facing and records:

```text
projectionStatus = candidate | selected | excluded
readerFacing = true | false
selectionReasons[]
selectionRationale
```

Typical selection reasons include:

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

This gives a concrete answer to:

> Why was this node or relation shown to the reader?

## 0.8 Controlled-study compatibility

The architecture supports generation after text import.

For a controlled study, the team may still:

```text
run automatic construction once
→ validate
→ freeze one generated ReferenceSkeleton / WorkPackageV3 per material/condition
→ give the same frozen scaffold to all relevant participants
```

This prevents participant-specific model/version drift while preserving the actual system architecture.

## 0.9 What remains open until formative findings

Do not freeze as validated design findings yet:

- exact visual form of the whole-text overview;
- list vs path vs compact graph balance;
- provenance detail shown by default;
- ideal relation density;
- whether replacement deserves a visible control;
- exact Compare layout;
- preferred text-led vs overview-led entry.

# 1. One-Sentence System Definition

**MeaningForge is a provenance-aware, evidence-grounded literary close-reading system that gives novice-to-intermediate readers a whole-text figurative-meaning scaffold they can trace, compare, challenge, revise, and use to build interpretations in their own words.**

It is not:

- an AI literary-answer generator;
- a metaphor detector presented as a reading interface;
- a generic story-graph browser;
- a visualization of a fixed scholarly interpretation;
- a replacement-word game.

---

# 2. Research Object and Reader Task

## 2.1 Research object

The target difficulty is not merely recognizing one metaphorical word.

The system addresses the work of integrating distributed details across a literary text:

- repeated images or expressions;
- objects;
- actions;
- dialogue and discourse;
- scenes;
- contrasts;
- changed contexts;
- events and consequences.

MeaningForge externalizes a selected, evidence-grounded portion of those relations as a reader-contestable scaffold.

The scaffold provides structure for reasoning without settling what the literary work finally means.

---

## 2.2 Primary reader-facing unit: FigurativeThread

A **FigurativeThread** is:

> a bounded, inspectable grouping of textual features, carriers, evidence, and relations distributed across a work that may matter to an interpretation.

A thread is not identical to:

- one metaphor;
- one theme;
- one symbol;
- one story event.

For a work such as *Medicine*, a thread may be anchored by a salient object, image, discourse pattern, or action, but the thread becomes meaningful through its relations across scenes, speakers, events, consequences, and later textual contexts.

---

## 2.3 Core reasoning loop

```text
read original text
        ↕
open / discover a figurative thread
        ↓
trace exact evidence and relations
        ↓
compare contexts / paths / evidence
        ↓
challenge / qualify / reject / revise
        ↓
inspect counterevidence
        ↓
use a diagnostic probe when appropriate
        ↓
save evidence and judgments to My Reading
        ↓
compose an evidence-grounded interpretation
        ↺
return to text
```

No reader must begin with:

- a system-authored literary question;
- a raw graph;
- a replacement operation.

---

# 3. Three-Layer Architecture

MeaningForge separates three connected structures.

| Layer | Contains | Role | Default reader visibility |
|---|---|---|---|
| **Narrative Backbone** | entities, events, objects, actions, scenes, discourse, temporal/causal/context links | contextual grounding | selective / on demand |
| **Reference Figurative Scaffold / Skeleton** | projected figurative signals, carriers, threads, evidence, structural relations, qualified interpretive relations, provenance | shared contestable artifact | core reader-facing structure |
| **Personal Reading Layer** | reader selections, judgments, edits, alternatives, reader relations and claims | reader-owned interpretation | persistent reader-facing layer |

---

## 3.1 Narrative Backbone

The Narrative Backbone answers questions such as:

- who acts?
- what object is involved?
- which scene is this?
- what happens before/after?
- what consequence follows?
- who speaks and to whom?

It is contextual infrastructure.

A narrative relation does not automatically become a figurative relation.

A full backbone graph belongs in researcher/debug tooling, not on the default reading screen.

---

## 3.2 Reference Figurative Scaffold

This is the main shared artifact.

It contains a qualified subset of the work:

```text
TextSpan / Evidence
        ↓
FigurativeSignal / projected Carrier
        ↓
StructuralRelation
        ↓
possible InterpretiveRelation
        ↓
FigurativeThread
```

Every reader-facing reference relation must provide:

- exact evidence;
- a rationale;
- provenance;
- status/qualification where applicable.

Reference interpretive relations are **proposals**.

---

## 3.3 Personal Reading Layer

The personal layer stores what the reader is building.

It includes:

- selected evidence;
- keep / unsure / reject / edit judgments;
- reader-authored nodes;
- reader-authored relations;
- alternatives;
- notes;
- claims;
- probe outcomes.

A reference relation is never silently mutated into reader truth or system truth.

---

# 4. Stable Design Commitments

These are implementation commitments, not claimed formative findings.

## DC1 — Text remains primary

The literary work opens as readable original text.

Scaffold cues should not visually dominate the text before the reader requests them.

---

## DC2 — Structure before supplied conclusion

Early interaction may reveal:

- recurrence;
- contrast;
- context shift;
- consequence;
- parallel;
- textual/narrative connection.

It should not begin with an unqualified thematic verdict.

High-level interpretive relations appear later and remain visibly qualified.

---

## DC3 — Whole-text skeleton is automatically constructible from imported text

For every supported work, MeaningForge must be able to construct a complete-enough initial reference skeleton from the literary text itself.

Canonical architecture:

```text
Import text
→ automatic construction pipeline
→ validated UNR
→ Meaning-Relevance Projection
→ ReferenceSkeleton
→ reader interaction
```

A cached/frozen `WorkPackageV3` may be loaded for development, reproducibility, or a controlled study, but the project is not technically complete if it can only consume a hand-authored JSON substrate.

MeaningForge does not require expert manual construction of every item.

MeaningForge also does not let an LLM freely invent the ontology, relation taxonomy, theoretical procedure, or final literary meaning.

The reader should not need to inspect the entire UNR before starting.

## DC4 — Overview + focused workspace

MeaningForge must support both:

1. a whole-text orientation view showing threads and their distribution;
2. a focused thread workspace for close reasoning.

The overview is not a raw all-node graph.

---

## DC5 — One thread, one coherent local workspace

Once a thread is open, its:

- evidence;
- relations;
- compare actions;
- challenges;
- counterevidence;
- probes;

remain coordinated in the same workspace.

They are not disconnected global modes.

---

## DC6 — Personal judgment does not overwrite reference data

Reference and personal layers remain distinguishable.

Allowed reader judgments:

```text
keep
unsure
reject
edit
```

An edit creates a personal revision linked to the reference object.

---

## DC7 — A diagnostic probe must test a relation

A probe exists only when it has a clear diagnostic target.

Replacement/counterfactual is allowed only when:

- a specific relation is being tested;
- the comparison is meaningful;
- the result can be discussed through evidence;
- it is not simply a vocabulary game.

---

## DC8 — Provenance is first-class

A confidence number never replaces provenance.

A user must be able to distinguish:

```text
direct text
theory / MIP-inspired annotation
NLP / structural rule
published scholarship
researcher / literature-trained curation
LLM candidate
reader authored
```

---

## DC9 — Default scaffold is open, not a closed curriculum

Readers can:

- add a textual clue;
- add a relation;
- revise a relation;
- reject or mark unsure;
- add an alternative;
- write a competing or qualified claim.

The system should support reasoning beyond its initial reference scaffold.

---

# 5. What Formative Study Can Change

Current formative work may inform:

- whether the overview is useful and at what moment;
- whether users prefer list/path/overview for different tasks;
- how much structure creates cognitive load;
- where authority pressure appears;
- how users interpret provenance;
- whether counterevidence is useful;
- whether replacement is diagnostic;
- what evidence readers want to retain.

It does **not** currently change:

- the three-layer architecture;
- text primacy;
- provenance separation;
- the personal/reference distinction;
- the need for exact evidence grounding;
- the non-canonical status of interpretive relations.

---

# 6. Reader Information Architecture

The required architecture is one coordinated system.

```text
                           [ My Reading ]
                                ↑
TEXT  ↔  WHOLE-TEXT SKELETON  ↔  THREAD WORKSPACE
                                ↕
                      evidence / context / provenance
```

The exact visual layout remains refinable.

---

## 6.1 Primary Reading Pane

Required capabilities:

- display actual literary text by section/chapter;
- maintain reading position;
- allow text selection;
- allow private note/highlight;
- show quiet availability cues for related evidence/threads;
- open a related thread from selected text;
- open the whole-text overview;
- jump from an evidence item back to its exact text.

Do not permanently highlight every candidate feature.

---

## 6.2 Whole-Text Skeleton Overview

Purpose:

> What potentially meaningful patterns are distributed across this work?

Required information per thread:

- neutral label;
- distribution across the work;
- number / locations of evidence items;
- curation/status indicator;
- entry to the focused thread workspace.

Recommended, but not yet empirically fixed:

```text
[ Blood / food / body ]    ●────●──●──────●
[ Public certainty ]       ─●──────●─────●─
[ Grave / memorial ]       ────────●──────●
```

The visual encoding may change after formative findings.

A raw narrative network is not the default overview.

---

## 6.3 Thread Workspace

Purpose:

> Why might these passages and relations matter together?

Required elements:

- selected thread title/status;
- exact evidence items;
- relation view;
- rationale;
- provenance;
- textual context links;
- reader judgment controls;
- contextual reasoning operations.

Core operations:

| Operation | Reader activity | Persisted result |
|---|---|---|
| **Trace** | follow evidence and relation grounding | selection / viewed path / event |
| **Compare** | compare evidence, contexts, or relation states | comparison note / event |
| **Challenge** | keep, qualify, reject, edit, add alternative | ReaderJudgment / ReaderRelation |
| **Counterevidence** | inspect or attach complicating/opposing evidence | ReaderSelection / judgment |
| **Probe** | stress-test a specific relation | MeaningProbeEvent |
| **Save** | keep an item in personal reading | ReaderSelection |

A local path is a view over relations, not automatically a forced interpretation.

---

## 6.4 My Reading

Purpose:

> What interpretation am I building, and what does it rest on?

Required contents:

- selected evidence;
- kept/edited/rejected relations;
- alternatives;
- uncertainties;
- reader-authored relations;
- reader claim(s);
- supporting evidence and relation references.

A small personal map may be shown after enough personal material exists.

My Reading is a reader argument workspace, not merely an analytics log.

---

## 6.5 Researcher / Debug Layer

Not part of the normal reader UI:

- raw narrative graph;
- all candidate features;
- extraction/candidate scores;
- provenance audit;
- rejected authoring candidates;
- LLM/rule proposal logs;
- calibration/validation status;
- event log export.

---

# 7. Reader Entry and Navigation

MeaningForge supports two legitimate entrances.

## 7.1 Text-led entrance

```text
read text
→ select span / open quiet cue
→ inspect related thread(s)
→ open Thread Workspace
→ Trace / Compare / Challenge / Counterevidence / Probe
→ Save to My Reading
→ return to same or connected text
```

---

## 7.2 Overview-led entrance

```text
open whole-text skeleton
→ inspect thread distribution
→ open one Thread Workspace
→ jump to evidence passage
→ Trace / Compare / Challenge / Counterevidence / Probe
→ Save to My Reading
→ return to overview or text
```

Both routes converge on the same thread workspace.

---

# 8. Automatic Substrate Construction Pipeline

## 8.1 Reader-visible entry

The normal user-facing construction flow should be:

```text
Import text
→ Generate skeleton
```

`Generate skeleton` is a coordinated pipeline, not a single model call.

The UI may show stage progress, errors, and a final ready state, but it should not require the reader to manually annotate the substrate.

## 8.2 Canonical technical route

```text
Literary Text
↓
1. Text Structuring & Traceable Evidence Anchoring
↓
2. Narrative Backbone Extraction
   Character / Object / Event / Action / Scene / Discourse / Place
↓
3. Coreference / Event Linking
↓
4. Multi-source Figurative Signal Detection
   MIP/MIPVU
   recurrence / repetition
   contrast / juxtaposition / parallel
   anomaly / context shift
   cross-span association
↓
5. Candidate Carrier / Relation Generation
↓
6. UNR — Unified Narrative Representation
↓
7. Grounding / Rule Validation
↓
8. Meaning-Relevance Projection
↓
9. Whole-text Figurative Reference Skeleton
↓
════════ Reader Interface ════════
↓
10. Reader Interpretive Layer
↓
11. Reader-authored Interpretation
```

Detailed stage-level Input / Processing / Output contracts are defined in `MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md`.

## 8.3 Stage 1 — Text structuring and evidence anchoring

Required outputs:

```text
SourceDocument
Paragraph[]
Sentence[]
TextSpan[]
Evidence[]
```

`TextSpan` must carry stable `paragraphId`, `sentenceId` where available, `order`, `startChar`, and `endChar` against the canonical source text.

Every reader-facing relation must eventually resolve through Evidence → TextSpan → exact source offsets.

## 8.4 Stage 2–3 — Narrative backbone + mention/entity separation

The pipeline should support:

```text
NER / mention detection
coreference
predicate-argument extraction
event extraction
event linking
scene segmentation
quote / speaker attribution
discourse segmentation
place/context extraction
```

Surface mentions and canonical entities must remain distinct.

Example:

```text
华老栓 / 老栓 / 他
→ three EntityMention records
→ one canonical NarrativeEntity
```

The same principle applies to event mentions and canonical events when event linking is used.

## 8.5 Stage 4 — Multi-source FigurativeSignal

The canonical object is now `FigurativeSignal`, not a monolithic metaphor feature layer.

Signal types:

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

MIP/MIPVU-informed lexical analysis remains defensible where applicable, but must not be treated as the only route into figurative structure.

## 8.6 Stage 5 — CandidateCarrier / CandidateRelation

Candidate generation is broader than projection.

A `CandidateCarrier` may be proposed from objects, actions, discourse, scenes, sensory images, recurrent expressions, or conceptual features when multiple gates fire.

Recommended gates:

```text
observability
recurrence / cross-span distribution
narrative salience
figurative signal support
relational load
interpretive tension
reader actionability
optional probe potential
```

A `CandidateRelation` can propose a Structural or qualified Interpretive relation, but it is not reader-facing until validation and projection succeed.

## 8.7 Stage 6 — UNR

UNR is a typed logical integration layer.

Do not flatten the substrate into one generic node/edge schema.

Canonical components:

```text
SourceDocument / Paragraph / Sentence / TextSpan
Evidence
EntityMention / EventMention
NarrativeEntity / NarrativeEvent / Scene / DiscourseSegment
NarrativeRelation
FigurativeSignal
CandidateCarrier
CandidateRelation
ProvenanceRecord
```

The v3 data model defines the field contract.

## 8.8 Stage 7 — Grounding / rule validation

Codex must implement machine validation for at least:

- schema;
- source offsets / exact-text reconstruction;
- referential integrity;
- mention/entity links;
- narrative references;
- FigurativeSignal grounding;
- CandidateCarrier evidence;
- Structural relation grounding;
- Interpretive relation grounding + qualification;
- provenance;
- projection eligibility;
- reference/personal separation.

Repair loops should target invalid records rather than regenerating the entire substrate by default.

## 8.9 Stage 8 — Meaning-Relevance Projection

Projection converts validated UNR into a sparse reader-facing reference scaffold.

Every projected object must store:

```text
projectionStatus
readerFacing
selectionReasons
selectionRationale
```

Projection is not “deciding true literary meaning.”

It selects items that are sufficiently grounded, distributed, relationally useful, and reader-actionable for the initial scaffold.

## 8.10 Stage 9 — ReferenceSkeleton

Required reader-facing outputs:

```text
Carrier[]
FigurativeThread[]
StructuralRelation[]
qualified InterpretiveRelation[]
ReferenceSkeleton
optional MeaningProbe[]
```

Thread labels should remain neutral and observable-material oriented.

## 8.11 Executor orchestration

Automatic construction may combine:

```text
DETERMINISTIC
TRADITIONAL_NLP
LLM
HUMAN / IMPORTED where used
```

A stage's executor is not its methodological basis.

LLM use is allowed for bounded semantic execution such as:

- ambiguous entity/event normalization;
- structured MIP/MIPVU-informed record completion;
- candidate relation classification under fixed taxonomies;
- qualified relation wording from grounded evidence;
- projection-criteria application;
- record-level repair from validator feedback.

LLM must not:

- invent source evidence;
- redefine schema/taxonomy;
- bypass grounding;
- silently make an interpretation certain;
- become the source of the reader's final interpretation.

## 8.12 Controlled-study freezing

For controlled evaluation, the generated package may be frozen after construction and validation:

```text
Import / generate once
→ validate + project
→ freeze ReferenceSkeleton / WorkPackageV3
→ reuse across participants in the same condition
```

This is a study-control mechanism, not the product's required input path.

# 9. Canonical Logical Data Model

`MeaningForge_Data_Model_v3.md` is the canonical field-level contract.

v7.3 uses the following object families.

## 9.1 Source layer

```text
Work
SourceDocument
Paragraph
Sentence
TextSpan
Evidence
```

Exact source offsets are first-class.

## 9.2 Mention + narrative layer

```text
EntityMention
EventMention
NarrativeEntity
NarrativeEvent
Scene
DiscourseSegment
NarrativeRelation
```

Mention/entity separation is mandatory for robust full-text extraction.

## 9.3 Figurative-signal + candidate layer

```text
FigurativeSignal
CandidateCarrier
CandidateRelation
```

`FigurativeFeature` is no longer the canonical v3 object; compatible legacy records should migrate into `FigurativeSignal`.

## 9.4 UNR + validation + projection layer

```text
UNRManifest
ValidationRecord
ProjectionRun
ProjectionRecord
ConstructionRun
```

UNR is a logical composition of typed records.

## 9.5 Reader-facing reference layer

```text
Carrier
FigurativeThread
StructuralRelation
InterpretiveRelation
MeaningProbe
ReferenceSkeleton
```

Only projected, validated objects belong in the initial reader-facing skeleton.

## 9.6 Provenance

Every generated reference object must preserve `ProvenanceRecord` with both:

```text
methodBasis
executorType
```

Recommended executor values:

```text
DETERMINISTIC
TRADITIONAL_NLP
LLM
HUMAN
IMPORTED
READER
```

## 9.7 Reader layer

```text
ReaderSession
ReaderJudgment
ReaderNode
ReaderRelation
ReaderSelection
ReaderClaim
MeaningProbeEvent
InteractionEvent
```

Reader-authored objects never collapse into immutable reference data.

## 9.8 Derived rather than mandatory graph adapters

A generic graph view may be derived for debug/visualization from UNR or ReferenceSkeleton.

It is not the canonical storage model.

# 10. WorkPackageV3 Contract

JSON remains the canonical interchange, cache, debug, study-freeze, and export format.

It is no longer the only system input.

Canonical entry paths:

```text
A. Literary text → automatic construction → WorkPackageV3 → reader UI
B. Existing WorkPackageV3 → validation/load → reader UI
```

Recommended top-level shape:

```text
WorkPackageV3
├── work / sourceDocument
├── paragraphs / sentences / textSpans / evidence
├── entityMentions / eventMentions
├── narrativeEntities / narrativeEvents / scenes / discourseSegments
├── narrativeRelations
├── figurativeSignals
├── candidateCarriers / candidateRelations
├── unrManifest
├── validations
├── projectionRun / projectionRecords
├── carriers / threads
├── structuralRelations / interpretiveRelations
├── probes
├── referenceSkeleton
├── provenance
└── constructionRun
```

## 10.1 Import validation

When loading a `WorkPackageV3`, validate:

- schema version;
- source-document checksum/offset consistency where available;
- referential integrity;
- projected-object integrity;
- reader/reference separation.

## 10.2 Legacy `Medicine_Substrate_v1.json`

`Medicine_Substrate_v1.json` is now a migration/development fixture.

It can help test the reader UI, but it does not satisfy the v7.3 end-to-end construction requirement and should be migrated toward Data Model v3.

# 11. Prototype Implementation Architecture

MeaningForge remains a **locally runnable research prototype**.

The new requirement is not production infrastructure; it is an end-to-end construction layer in front of the existing reader interface.

## 11.1 Recommended prototype form

Use the cheapest stable path compatible with the existing repository:

```text
Option A: React + TypeScript + Vite
Option B: existing HTML + CSS + JavaScript architecture
```

Selection criteria:

1. full-text import works;
2. automatic construction can be orchestrated;
3. generated skeleton drives the existing reader UI;
4. reader state persists;
5. study data exports;
6. literary interpretation is not hard-coded in UI strings.

Do not add Docker/database/microservices merely for architectural appearance.

## 11.2 Prototype data flow

```text
User imports literary text
        ↓
Construction Orchestrator
        ├── text structuring
        ├── narrative extraction
        ├── coreference/event linking
        ├── figurative-signal detection
        ├── candidate generation
        ├── UNR assembly
        ├── validation
        ├── projection
        └── skeleton builder
        ↓
WorkPackageV3 + ReferenceSkeleton
        ↓
MeaningForge Reader Interface
        ├── Reading Pane
        ├── Whole-text Skeleton
        ├── Thread Workspace
        └── My Reading
        ↓
reader state / logs
        ↓
localStorage + JSON export
```

## 11.3 Construction orchestrator

A simple implementation contract is sufficient:

```text
constructSubstrate(importedText)
```

Internal modules may be:

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

This does not require an agent framework.

## 11.4 External NLP / LLM calls

If the local prototype uses external services for traditional NLP or LLM-assisted stages:

- isolate them behind adapters;
- persist stage inputs/outputs needed for reproducibility;
- preserve source IDs;
- allow record-level retry;
- do not leak API/model details into the reader-facing epistemic label.

Where practical, deterministic/local modules should handle segmentation, IDs, offsets, exact matching, and validators.

## 11.5 Reader state

First version may still use:

```text
in-memory state
+
localStorage
```

Persist reader judgments, selections, nodes, relations, claims, probe outcomes, and relevant interaction events.

## 11.6 Study export

Support:

```text
Export Session JSON
```

and, for reproducibility/debugging:

```text
Export WorkPackageV3
Export ConstructionRun / validation / projection metadata
```

## 11.7 Suggested file organization

```text
src/
├── construction/
│   ├── text/
│   ├── narrative/
│   ├── figurative/
│   ├── candidates/
│   ├── unr/
│   ├── validation/
│   ├── projection/
│   └── skeleton/
├── data/
├── reader/
│   ├── ReadingPane
│   ├── SkeletonOverview
│   ├── ThreadWorkspace
│   └── MyReading
├── state/
└── export/
```

Exact folder names may follow the existing repository.

# 12. Reader-Facing Component Architecture

The construction phase is part of the product flow, but it remains visually distinct from the reader reasoning workspace.

```text
MeaningForge
├── ImportGenerateView
│   ├── TextImport
│   ├── ConstructionProgress
│   ├── ValidationSummary
│   └── SkeletonReadyHandoff
├── ReadingPane
├── SkeletonOverview
├── ThreadWorkspace
│   ├── EvidenceView
│   ├── RelationInspector
│   ├── ComparePanel
│   ├── ChallengePanel
│   ├── CounterevidencePanel
│   ├── ProbePanel
│   └── ProvenanceView
└── MyReading
```

## 12.1 ImportGenerateView

Required:

- paste/upload full text;
- capture title/language/source metadata as needed;
- start `Generate skeleton`;
- show stage-level progress without exposing low-level model internals by default;
- surface actionable validation failures;
- enter the reader interface when `ReferenceSkeleton` is ready;
- optionally export `WorkPackageV3` for debugging/study freezing.

The reader should not have to manually create narrative entities, metaphor labels, or relation JSON before reading.

## 12.2 ReadingPane

Must support:

- display the actual imported literary text;
- preserve reading position;
- highlight / note;
- open related thread(s) from text;
- return from evidence to exact passage.

## 12.3 SkeletonOverview

Displays:

- neutral thread labels;
- whole-text distribution;
- evidence locations;
- projected carriers/relations at an inspectable density;
- thread entry.

Do not default to the full raw UNR graph.

## 12.4 ThreadWorkspace

Must support:

```text
Trace
Compare
Challenge
Counterevidence
optional Probe
Save
```

Core requirement: continuous reasoning inside one thread, rather than disconnected global modes.

## 12.5 MyReading

Stores:

- selected evidence;
- kept / unsure / rejected relations;
- edited / alternative relations;
- reader-added nodes;
- reader-added evidence;
- reader claims;
- qualifications.

My Reading is reader-owned.

## 12.6 Reference vs personal visual distinction

The UI must distinguish:

```text
system/reference proposal
reader-kept
reader-rejected
reader-edited
reader-authored
```

Do not rely on color alone.

# 13. Local Running Requirement

The prototype must be easy to run locally.

If all construction modules are browser-safe and no secret keys are needed, a front-end-only implementation is acceptable.

If traditional NLP or LLM-assisted stages require server-side libraries or API credentials, use the smallest local backend needed, for example:

```text
frontend: React/Vite or existing web UI
local backend: Node/Express or Python/FastAPI/Flask
```

The local backend may expose a small construction API such as:

```text
POST /construct
GET  /construct/:runId
GET  /work-package/:id
```

Do not expose model/API secrets in browser JavaScript.

Still not required:

- Docker;
- production server;
- PostgreSQL;
- authentication;
- microservices;
- cloud deployment.

# 14. Prototype Data Contract

The prototype must support two data entry modes:

```text
A. full literary text
   → automatic construction
   → WorkPackageV3 / ReferenceSkeleton

B. existing WorkPackageV3
   → validate / load
   → ReferenceSkeleton
```

The most important semantic guarantees are:

1. exact source anchoring through `SourceDocument / TextSpan` offsets;
2. mention vs canonical entity/event separation;
3. StructuralRelation vs InterpretiveRelation separation;
4. `FigurativeSignal` is multi-source and not synonymous with MIP;
5. UNR remains typed backend substrate;
6. only validated/projected objects become reader-facing;
7. every reader-facing object has inspectable projection/provenance metadata;
8. reader state remains separate from reference data;
9. participant interaction and generated package metadata can be exported.

If a backend is later expanded, these semantics must not change.

# 15. Interaction Semantics

## 15.1 Trace

Input:

- relation / carrier / thread.

Shows:

- exact evidence;
- contextual links;
- rationale;
- provenance;
- connected structural relations;
- qualified interpretive relation if requested.

Trace never silently jumps directly to a final meaning.

---

## 15.2 Compare

Compare may operate on:

- two evidence items;
- two occurrences of one Carrier;
- two contexts;
- two relation alternatives;
- two threads.

The UI should expose what changes:

- speaker;
- scene;
- action;
- consequence;
- relation type;
- interpretive implication.

---

## 15.3 Challenge

Allowed actions:

```text
keep
unsure
reject
edit
add alternative
```

A reader may attach rationale and additional evidence.

---

## 15.4 Counterevidence

Counterevidence may be:

- pre-curated candidate evidence;
- evidence in another thread;
- evidence found by the reader.

The interface must not frame counterevidence as automatically disproving a relation.

It may:

- complicate;
- weaken;
- qualify;
- redirect.

---

## 15.5 Diagnostic probe

A diagnostic probe has:

```text
target relation
prompt
optional manipulation/config
reader judgment
```

### Replacement / Counterfactual

Only use when meaningful.

Reader result vocabulary:

```text
preserved
weakened
broken
emergent
mixed
unsure
```

The system records the result; it does not infer a definitive literary conclusion.

---

## 15.6 Compose

A reader claim should be linked to:

- selected evidence;
- accepted or edited relations;
- qualifications;
- optional counterevidence.

The system may help organize material, but the final claim remains reader-authored.

---

# 16. LLM / NLP Boundary

## 16.1 MeaningForge is method-defined, not model-defined

MeaningForge defines:

- source-anchoring semantics;
- typed schema;
- mention/entity distinction;
- MIP/MIPVU-informed lexical record;
- figurative-signal taxonomy;
- carrier gates;
- relation taxonomies;
- validation;
- projection rules;
- interaction design.

Different executors may implement bounded stages.

## 16.2 Automatic construction may use multiple executors

```text
DETERMINISTIC
TRADITIONAL_NLP
LLM
HUMAN / IMPORTED where used
```

Typical LLM-assisted tasks:

- semantic classification under fixed enums;
- ambiguous entity/event normalization;
- MIP/MIPVU-informed record completion;
- candidate relation classification;
- qualified interpretive proposal wording after grounding;
- projection-criteria application;
- record-level repair.

Every LLM-executed record must preserve relevant provenance such as:

```text
methodBasis
executorType = LLM
modelName/version
promptProtocolVersion
source grounding
```

## 16.3 Reader-facing reasoning need not use live LLM generation

The product may use LLM assistance during `Generate skeleton`.

After a `ReferenceSkeleton` exists, the core reader reasoning loop can run without live generative assistance.

For controlled studies, a generated scaffold can be frozen before sessions so participant interaction is not confounded by participant-specific scaffold generation.

## 16.4 Optional live reader assistance

If a later condition adds live LLM assistance during reading:

- log model/version;
- mark model-assisted outputs;
- preserve reference vs reader distinction;
- never silently merge model output into reader-authored interpretation;
- treat it as an explicit study/design condition.

## 16.5 What LLM must never become

LLM must not become:

- the source of MeaningForge ontology;
- a truth label;
- an automatic final-essay generator;
- a substitute for reader interpretation;
- the reason the paper is framed as an LLM/agent-pipeline contribution.

# 17. Study Instrumentation

The prototype should support analysis without turning analytics into the reader interface.

Recommended event categories:

```text
text_span_open
thread_open
evidence_open
relation_open
trace_follow
compare_open
judgment_create
judgment_update
counterevidence_open
probe_start
probe_submit
selection_save
reader_relation_create
claim_create
claim_update
return_to_text
```

Each event should include:

```text
sessionId
timestamp
targetType
targetId
minimal payload
```

Do not log unnecessary personal data.

---

# 18. Acceptance Criteria

## 18.1 Automatic construction acceptance

The application must:

- [ ] accept a complete literary text as input;
- [ ] create `SourceDocument`, paragraphs, sentences, and exact TextSpan offsets;
- [ ] separate mention records from canonical entities/events;
- [ ] construct narrative entities/events/scenes/discourse and links;
- [ ] generate multiple `FigurativeSignal` types rather than only lexical metaphor output;
- [ ] generate `CandidateCarrier` and `CandidateRelation` records;
- [ ] build a typed UNR / `UNRManifest`;
- [ ] run schema, source-anchor, referential, grounding, and rule validators;
- [ ] produce projection records with selected/excluded state and reasons;
- [ ] generate a `ReferenceSkeleton` with reader-facing nodes and edges;
- [ ] export/reload `WorkPackageV3`;
- [ ] preserve provenance for non-deterministic stages.

## 18.2 Skeleton acceptance

A reader-facing skeleton must satisfy:

- [ ] every selected object is exactly traceable to source evidence;
- [ ] every reader-facing object has `ProjectionRecord` metadata;
- [ ] every Carrier has evidence and provenance;
- [ ] structural relations are grounded;
- [ ] interpretive relations are grounded and qualified;
- [ ] thread labels do not encode a final thesis by default;
- [ ] reference vs reader layers are separate;
- [ ] at least one thread supports the complete reasoning loop.

## 18.3 Reader runtime acceptance

The application must:

- [ ] display the imported actual text;
- [ ] display the generated skeleton dynamically;
- [ ] open exact evidence from a node/relation;
- [ ] display rationale/provenance as designed;
- [ ] support Trace / Compare / Challenge / Counterevidence / Probe / Compose;
- [ ] persist reader judgments and reader-created relations/claims;
- [ ] support return-to-text;
- [ ] export reader session data.

## 18.4 Controlled-study mode

If a study uses frozen material:

- [ ] the frozen skeleton records its construction/projection versions;
- [ ] participants in the same condition receive the intended identical reference scaffold;
- [ ] the paper does not imply that “frozen for study” means “gold standard.”

## 18.5 UI redesign test

Before adding a reader-facing surface, answer:

1. What reader question does it answer?
2. Which semantic layer does it expose?
3. What exact source passage can the reader reach?
4. Does it preserve provenance and uncertainty?
5. What reasoning action does it enable?
6. Is this design supported by formative evidence or still provisional?

# 19. What Must Not Return

Do not reintroduce as the primary workflow:

- mandatory story-graph decoding;
- a system-authored literary question as the starting node;
- `故事线 / 交汇点 / 变量测试` as global main navigation;
- replacement as the defining interaction;
- prewritten “deep meaning” shown as fact;
- decorative graph manipulation with no reasoning consequence;
- runtime claims that MIP/MIPVU or LLM automatically produced study-ready relations when they did not.

---

# 20. Implementation Milestones

## Milestone A — Full-text import + exact anchoring

```text
import text
→ SourceDocument
→ Paragraph / Sentence / TextSpan
→ exact char offsets
```

Do this before complex semantic extraction.

## Milestone B — Narrative backbone

Implement:

```text
mention extraction
entity normalization
coreference
event extraction/linking
scene/discourse/speaker structure
NarrativeRelation
```

## Milestone C — Multi-source FigurativeSignal

Implement at least a useful subset covering:

```text
MIP/MIPVU-informed lexical route
recurrence / repetition
contrast / parallel / juxtaposition
context shift
cross-span association
```

## Milestone D — Candidate generation + UNR

```text
CandidateCarrier
CandidateRelation
UNRManifest
```

The first goal is traceable typed structure, not perfect literary coverage.

## Milestone E — Validation + Meaning-Relevance Projection

Implement validators and explicit projection records.

No item becomes reader-facing simply because a model proposed it.

## Milestone F — Automatic ReferenceSkeleton

```text
validated UNR
→ projection
→ Carrier / Relations / Threads
→ ReferenceSkeleton
```

At this milestone, a user should be able to import a text and receive a skeleton with nodes and edges.

## Milestone G — Connect to existing MeaningForge reasoning loop

```text
Read
→ Skeleton Overview
→ Thread Workspace
→ Trace
→ Compare
→ Challenge
→ Counterevidence
→ optional Probe
→ My Reading
→ Compose
```

## Milestone H — Personal persistence + study export

Persist reader layer and export session data.

## Milestone I — Formative-informed UI refinement

Adjust overview form, relation density, provenance display, replacement visibility, and Compare layout after formative findings.

# 21. Scaling and Quality Improvement, Not the HCI Core

After the end-to-end pipeline works, improve:

```text
entity/coreference robustness
event/discourse extraction
signal recall/precision
candidate ranking
projection calibration
batch corpus ingestion
scholarship retrieval
cross-work portability
latency / caching
```

These improve construction quality and efficiency.

They do not change the central claim:

> MeaningForge studies human reasoning with a structured, evidence-grounded, contestable literary scaffold.

Any quality improvement must preserve distinctions among:

```text
source evidence
method basis
executor
UNR candidate
validation
projection decision
reference relation
reader judgment
```

# 22. Codex / Developer Handoff Summary

Codex should read:

```text
1. README_Current_Project.md
2. MeaningForge_CHI2027_Balanced_Literature_Idea.md
3. MeaningForge_System_Design_Development_Spec_v7_3.md
4. MeaningForge_Data_Model_v3.md
5. MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md
6. MeaningForge_Paper_Writing_Notes_v2_1.md
```

Then implement a locally runnable MeaningForge research prototype whose required starting path is:

```text
literary text
→ automatic construction
→ validated UNR
→ Meaning-Relevance Projection
→ ReferenceSkeleton
→ reader interface
```

## Required backend objects

```text
Work / SourceDocument
Paragraph / Sentence / TextSpan / Evidence
EntityMention / EventMention
NarrativeEntity / NarrativeEvent / Scene / DiscourseSegment / NarrativeRelation
FigurativeSignal
CandidateCarrier / CandidateRelation
UNRManifest
ValidationRecord
ProjectionRun / ProjectionRecord
Carrier / FigurativeThread
StructuralRelation / InterpretiveRelation
ReferenceSkeleton
MeaningProbe
ProvenanceRecord / ConstructionRun
```

## Required reader objects

```text
ReaderSession
ReaderJudgment
ReaderNode
ReaderRelation
ReaderSelection
ReaderClaim
MeaningProbeEvent
InteractionEvent
```

## Required reader surfaces

```text
Import / Generate
ReadingPane
SkeletonOverview
ThreadWorkspace
MyReading
```

## Required reader operations

```text
Trace
Compare
Challenge
Counterevidence
Probe
Compose
```

## Persistence

```text
WorkPackageV3 JSON
+
localStorage / browser state for reader data
```

## Non-negotiable rules

```text
Full text is a valid primary input.
Exact source anchoring is mandatory.
Mention and canonical entity/event are separate.
FigurativeSignal is multi-source; MIP is one route.
UNR is typed backend substrate, not a generic reader graph.
Only validated/projected objects enter the initial skeleton.
Projection reasons are inspectable.
Reference scaffold is a proposal, not truth.
Structural and interpretive relations remain distinct.
Interpretive relations are qualified.
Reader can reject/edit/add.
Reader personal layer is separate.
The reader authors the final interpretation.
No production infrastructure is required.
```

# 23. Source Document Status After v7.3

```text
MeaningForge_System_Design_Development_Spec_v7_3.md
    = CURRENT IMPLEMENTATION AUTHORITY

MeaningForge_Data_Model_v3.md
    = CANONICAL DATA COMPANION

MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md
    = CANONICAL AUTOMATIC CONSTRUCTION PROTOCOL

MeaningForge_Paper_Writing_Notes_v2_1.md
    = ACTIVE PAPER-WORDING GUARDRAIL

MeaningForge_System_Design_Development_Spec_v7_2.md
MeaningForge_Data_Model_v2.md
MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
    = ARCHIVE / lineage sources

Medicine_Substrate_v1.json
    = LEGACY DEVELOPMENT FIXTURE / migration input
```

Formative v6 and the Literature Evidence Matrix remain unchanged.

---

# 24. Final Architecture

```text
                         USER
                          │
                    Import Full Text
                          ↓
════════════ AUTOMATIC CONSTRUCTION LAYER ════════════
                          ↓
     1. Text Structuring + Exact Source Anchoring
                          ↓
     2. Narrative Backbone + Mention/Entity Linking
                          ↓
     3. Multi-source FigurativeSignal Detection
                          ↓
     4. CandidateCarrier / CandidateRelation
                          ↓
                  5. Typed UNR
                          ↓
              6. Validation / Repair
                          ↓
          7. Meaning-Relevance Projection
                          ↓
   8. Whole-text Figurative Reference Skeleton
                          │
════════════════ READER INTERFACE ════════════════════
                          ↓
             ReadingPane ↔ SkeletonOverview
                          ↕
                  ThreadWorkspace
                          ↓
       Trace / Compare / Challenge / Counterevidence
                          ↓
                    optional Probe
                          ↓
                      MyReading
                          ↓
             Reader-authored Interpretation
                          ↓
              local state + JSON export
```

The central v7.3 decision is:

> **MeaningForge must now be technically capable of constructing its initial reference skeleton from an imported full text. The construction can combine deterministic processing, traditional NLP, fixed theoretical procedures, and LLM-assisted semantic execution; the resulting skeleton remains an evidence-grounded, contestable substrate for reader reasoning rather than an automatically discovered literary truth.**

The implementation should remain a simple research prototype. Complexity belongs in traceable representation, validation, projection, and reader interaction—not in unnecessary production infrastructure.

