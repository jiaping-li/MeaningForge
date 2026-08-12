# MeaningForge System Design and Development Specification v7.2

> **Version:** 2026-08-12  
> **Status:** Current system-design and prototype-development authority for the CHI 2027 research prototype  
> **Supersedes for development:** `MeaningForge_System_Design_Development_Spec_v6.md` and `MeaningForge_System_Design_Development_Spec_v3_0811.md`  
> **Companion documents:** `MeaningForge_Data_Model_v2.md`, `MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md`, `Medicine_Substrate_v1.json`
> **Prototype principle:** Keep the implementation research-demo-level and locally runnable. JSON-driven data and browser/local persistence are sufficient; production infrastructure is not part of the current requirement.  
> **Important:** v7 is not a mechanical merge. It keeps stable research/design commitments, revises assumptions contradicted by the current Phase-1 strategy, and demotes details that formative study has not yet justified.

---

# 0. Consolidation Decisions

## 0.1 Why v7 exists

`v3_0811` is the strongest detailed interaction/system specification, while `v6` correctly resets the implementation strategy around a frozen, data-driven substrate and a real prototype. v7.1 further clarifies that the substrate protocol is fixed by MeaningForge, while LLMs may execute annotation, checking, and structuring work that would otherwise be manual.

The problem is that they are not simply additive.

Several statements in `v3_0811` assume an end-to-end construction pipeline that automatically runs when a work is imported. The current CHI prototype strategy does not require that automation. Conversely, `v6` is directionally correct but too thin to give directly to a developer.

v7 therefore becomes the **single implementation authority** by making explicit decisions about what is:

1. **retained as a stable design commitment**;
2. **revised because the implementation strategy changed**;
3. **demoted to an optional or researcher-only mechanism**;
4. **left open until formative findings exist**;
5. **removed from the current prototype scope**.

---

## 0.2 What is retained from v3_0811

The following are preserved because they define the HCI system rather than a particular extraction implementation:

- text remains the primary reading surface;
- the core artifact is a whole-text figurative-meaning scaffold;
- the reader-facing unit is a **figurative thread**;
- Narrative Backbone, Reference Scaffold, and Personal Reading Layer remain distinct;
- the scaffold is a proposal, not literary truth;
- provenance must be inspectable;
- the system supports both text-led and overview-led entry;
- one open thread should remain the coherent local workspace;
- reader actions create a personal layer rather than silently rewriting reference data;
- Trace, Compare, Challenge, suitable testing/probing, and Compose are the core reasoning cycle;
- a raw narrative graph is not the default reader interface;
- replacement is not the central interaction;
- every reader-facing relation must reach exact textual evidence;
- researcher/debug information stays separate from the reader-facing experience.

---

## 0.3 What is revised

### Revision A — “Generate on import” becomes “Prepare and freeze before reader use”

Old assumption:

```text
import text
→ automatically construct whole-text skeleton
→ reader begins
```

Current Phase-1 requirement:

```text
fix literary text edition
→ execute fixed MeaningForge substrate protocol
   (deterministic tools / LLM / human are interchangeable executors)
→ machine validation
→ freeze reference WorkPackage
→ runtime loads the WorkPackage
→ reader begins
```

The architectural commitment is that a whole-text scaffold exists before meaningful reader interaction.

The prototype does **not** require the scaffold to be regenerated at runtime or independently for every participant.

---

### Revision B — Protocol is fixed; executor is replaceable

The substrate method remains fixed:

```text
A. lexical figurative feature analysis
B. non-lexical literary carrier identification
C. narrative / structural relation grounding
D. qualified interpretive proposal construction
E. thread construction
F. provenance + validation
```

Phase 1 may use an LLM to execute the same steps that a research assistant could perform.

The LLM does not define:

- ontology;
- relation taxonomy;
- MIP/MIPVU-informed record;
- carrier gates;
- thread-label rules;
- validation rules;
- study logic.

Therefore LLM-assisted preparation is an implementation convenience, not a new research contribution.

### Revision C — Structural and interpretive relations are logically different

A recurrence, consequence, context shift, or co-occurrence is not the same epistemic object as a possible literary implication.

v7 therefore requires:

```text
StructuralRelation
    ↓ may support
InterpretiveRelation
```

They may share one physical database table, but they must have distinct logical types, validation rules, provenance expectations, and UI treatments.

---

### Revision D — Core operations and diagnostic probes are separated

`Trace`, `Compare`, `Challenge`, and `Compose` are general reader operations.

`Counterevidence` is a general reasoning lens/action available around a relation.

A **MeaningProbe** is a more specific stress test of a relation, such as:

- edge removal;
- replacement/counterfactual;
- alternative path.

Trace and Compare are therefore not stored as pre-authored probes.

---

### Revision E — The data model is expanded beyond v6

v6 lists only the minimum entities. v7 adds the objects required for a real study system:

- `FigurativeThread`;
- `StructuralRelation`;
- `InterpretiveRelation`;
- `ProvenanceRecord`;
- `ReaderSession`;
- reader-authored nodes and relations;
- interaction logging.

---

## 0.4 What is demoted

The following are useful but not required as primary reader-facing structures:

- full raw story graph;
- all-node narrative network;
- pre-authored `ReferencePath` as a mandatory stored object;
- graph dragging as interaction;
- LLM-generated explanation during normal study use;
- global top-level modes such as “storyline / convergence / variable test”.

A local path may be **derived from relations** when Trace is used. A curated reference path can exist when needed, but it is not a required foundational entity.

---

## 0.5 What remains open until formative findings

Do not freeze the following as validated design findings yet:

- exact visual form of the whole-text overview;
- list vs path vs compact graph balance;
- how much provenance appears by default;
- ideal density of relations in the thread workspace;
- whether replacement deserves a visible control or remains secondary;
- exact compare layout;
- whether users prefer overview-led or text-led entry in practice.

The prototype may implement reasonable defaults, but the paper must not describe those defaults as formative findings before the study is complete.

---

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
| **Reference Figurative Scaffold** | features, carriers, threads, evidence, structural relations, qualified interpretive relations, provenance | shared contestable artifact | core reader-facing structure |
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
FigurativeFeature / Carrier
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

## DC3 — Whole-text scaffold exists; preparation is protocol-driven

For every study work, a complete-enough whole-text reference scaffold must be available before reader interaction.

Phase 1:

```text
fixed substrate protocol
→ deterministic / LLM / human execution
→ schema + grounding validation
→ frozen WorkPackage
→ runtime loading
```

MeaningForge does not require expert manual construction of every item.

MeaningForge also does not let an LLM freely invent the ontology or regenerate a different scaffold for each participant.

The reader should not need to parse the entire scaffold before starting.

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

# 8. Phase-1 Substrate Preparation

## 8.1 Critical boundary: preparation time vs runtime

### Preparation time

MeaningForge defines a fixed substrate protocol.

The executor of each step may be:

```text
DETERMINISTIC
LLM
HUMAN
IMPORTED
```

The executor is not the methodological basis.

Example:

```text
methodBasis = MIP_MIPVU_INFORMED
executorType = LLM
```

means an LLM executed a fixed MIP/MIPVU-informed record.

### Runtime

MeaningForge loads a frozen reference WorkPackage and supports reader interaction.

The main study runtime does not need to:

- rerun MIP/MIPVU;
- rediscover carriers;
- regenerate reference interpretations;
- call an LLM to rebuild the scaffold for each reader.

This keeps the study focused on the interaction substrate.

---

## 8.2 Required Phase-1 preparation pipeline

```text
Step 0  fix source edition + normalization
↓
Step 1  create stable TextSpan IDs
↓
Step 2  identify / structure Evidence
↓
Step 3  construct minimal Narrative Backbone
↓
Step 4  apply FigurativeFeature protocol
↓
Step 5  apply Carrier inclusion gates
↓
Step 6  create StructuralRelations
↓
Step 7  create qualified InterpretiveRelations after grounding
↓
Step 8  assemble neutral FigurativeThreads
↓
Step 9  add diagnostic MeaningProbes where useful
↓
Step 10 schema + referential + grounding validation
↓
freeze reference WorkPackage
```

The detailed execution protocol is:

`MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md`.

---

## 8.3 LLM role in substrate preparation

LLM use is allowed because it replaces labor, not theory.

Allowed examples:

- classify Evidence under a fixed enum;
- populate MIP/MIPVU-informed fields;
- normalize entities/events/scenes;
- apply Carrier inclusion criteria;
- classify a relation into the fixed StructuralRelation taxonomy;
- formulate a qualified InterpretiveRelation proposal from already-grounded evidence;
- group items into neutral threads;
- repair invalid JSON after validator feedback.

The LLM must not:

- invent new relation types;
- redefine ontology;
- modify source text;
- fabricate source evidence;
- bypass grounding;
- present a reference proposal as literary truth.

---

## 8.4 Evidence-first rule

Evidence must resolve to addressable original text.

An interpretation is not Evidence.

---

## 8.5 MIP/MIPVU boundary

MIP/MIPVU-informed analysis applies only where defensible at lexical word-use level.

The fixed record may include:

- lexical unit;
- contextual meaning;
- possible more basic meaning;
- contrast;
- whether comparison is defensible.

A narrative object can become a Carrier even if `mipStatus = not_applicable`.

LLM execution does not turn this into “automatic MIPVU” as a methodological claim; the implementation should be described accurately as protocol-guided assistance.

---

## 8.6 Carrier inclusion

A reader-facing Carrier should normally satisfy multiple gates:

- observability;
- recurrence/distribution;
- narrative salience;
- relational load;
- interpretive tension;
- reader actionability;
- optional probe potential.

The gates are fixed.

An LLM may apply them.

---

## 8.7 Structural before interpretive relation

StructuralRelation types remain fixed:

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

InterpretiveRelation families remain fixed:

```text
supports
complicates
weakens
qualifies
possible_implication
alternative_to
reframes
```

InterpretiveRelation must have:

- evidence;
- grounding relation(s);
- qualified wording;
- provenance.

---

## 8.8 Thread construction

Thread labels should be neutral and observable-material oriented.

Prefer:

```text
blood / food / treatment
grave / crow / memorial
public talk / certainty / rumor
```

Avoid labels that already state a final thesis.

---

## 8.9 Provenance: method basis vs executor

Canonical method basis:

```text
DIRECT_TEXT
MIP_MIPVU_INFORMED
NARRATIVE_RULE
STRUCTURAL_RULE
SCHOLARSHIP
REFERENCE_INTERPRETIVE_PROTOCOL
READER_REASONING
```

Canonical executor:

```text
DETERMINISTIC
LLM
HUMAN
IMPORTED
READER
```

This prevents “LLM” from becoming an epistemic category.

---

## 8.10 Preparation status

Canonical lifecycle:

```text
candidate
→ schema_validated
→ grounding_validated
→ reference_ready
→ pilot_ready / study_ready
```

Optional sanity check can be recorded, but:

```text
researcher_curated
→ literature_checked
```

is no longer a mandatory technical gate.

`study_ready` means protocol-valid and frozen for study, not gold-standard interpretation.

---

## 8.11 Machine validation

Codex must implement validators for:

- schema;
- enums;
- referential integrity;
- evidence-to-span grounding;
- StructuralRelation evidence;
- InterpretiveRelation groundingRelationIds;
- InterpretiveRelation qualification;
- provenance;
- reference/personal separation.

LLM retry should repair only the invalid records identified by validation.

---

## 8.12 Human involvement

Full manual annotation is not required.

Recommended workflow:

```text
deterministic + LLM protocol execution
→ machine validation
→ optional lightweight sanity check
→ freeze WorkPackage
```

Human sanity check is material QA, not the research contribution.

---

## 8.13 Minimum first real dataset

Engineering target:

```text
1 work
50–100 TextSpan / Evidence
15–25 Carriers
3–5 FigurativeThreads
30–50 Structural + Interpretive Relations
5–10 optional diagnostic probes
```

The important requirement is not who typed each record.

The important requirements are:

- fixed protocol;
- evidence grounding;
- valid schema;
- explicit provenance;
- contestable reference presentation;
- reader-editable personal layer.

# 9. Canonical Logical Data Model

This section is the v7 implementation model.

`MeaningForge_Data_Model_v2.md` is the canonical companion contract. Where v7.1 and the data model differ, **v7.1 governs research/system semantics and Data Model v2 governs field-level representation unless v7.1 explicitly overrides it**.

---

## 9.1 Work

```ts
Work {
  id: string
  title: string
  author?: string
  language: string
  editionId: string
  sourceDescription?: string
  status: "draft" | "pilot_ready" | "study_ready"
}
```

---

## 9.2 TextSpan

```ts
TextSpan {
  id: string
  workId: string
  chapterId?: string
  paragraphId?: string
  order: number
  text: string
  startOffset?: number
  endOffset?: number
  speaker?: string
  sceneId?: string
}
```

A TextSpan is the canonical addressable unit for returning to the original text.

---

## 9.3 Evidence

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
}
```

Evidence does not contain a final literary claim.

---

## 9.4 NarrativeUnit / NarrativeEntity / NarrativeRelation

```ts
NarrativeUnit {
  id: string
  workId: string
  order: number
  chapterId?: string
  spanIds: string[]
}

NarrativeEntity {
  id: string
  workId: string
  type: "character" | "object" | "event" | "action" | "scene" | "discourse" | "place"
  label: string
  evidenceIds: string[]
}

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
}
```

The backbone may be intentionally minimal for Phase 1.

---

## 9.5 FigurativeFeature

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
    contextualMeaning?: string
    basicMeaning?: string
    contrastPresent?: boolean
    comparisonDefensible?: boolean
  }
  confidence?: number
  provenanceId: string
  status: CurationStatus
}
```

---

## 9.6 Carrier

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
  selectionReasons: string[]
  provenanceId: string
  status: CurationStatus
}
```

Carrier and FigurativeFeature are not interchangeable.

---

## 9.7 FigurativeThread

```ts
FigurativeThread {
  id: string
  workId: string
  neutralLabel: string
  carrierIds: string[]
  featureIds: string[]
  evidenceIds: string[]
  relationIds: string[]
  distribution: {
    chapterIds?: string[]
    spanOrders?: number[]
  }
  provenanceId: string
  status: CurationStatus
}
```

Thread is the main reader-facing grouping object.

---

## 9.8 StructuralRelation

Logical schema:

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
  status: CurationStatus
}
```

---

## 9.9 InterpretiveRelation

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
  status: CurationStatus
}
```

Every study-ready InterpretiveRelation should have at least:

- evidence;
- one grounding relation or equivalent structural rationale;
- qualification;
- provenance.

---

## 9.10 MeaningProbe

```ts
MeaningProbe {
  id: string
  workId: string
  threadId?: string
  type:
    | "counterevidence"
    | "edge_removal"
    | "replacement"
    | "alternative_path"
  targetRelationIds: string[]
  targetCarrierId?: string
  prompt: string
  config?: object
  provenanceId: string
  status: "candidate" | "pilot_ready" | "study_ready"
}
```

Not every thread or relation needs a probe.

---

## 9.11 ProvenanceRecord

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

The method basis and executor are separate.

For example:

```text
MIP_MIPVU_INFORMED + LLM
```

means an LLM executed a fixed theory-informed annotation protocol.

It does not mean the LLM is the theoretical source of the record.

## 9.12 ReaderSession

```ts
ReaderSession {
  id: string
  workId: string
  participantCode: string
  startedAt: string
  endedAt?: string
  condition?: string
}
```

Do not store unnecessary identifying information in the research runtime package.

---

## 9.13 ReaderJudgment

```ts
ReaderJudgment {
  id: string
  sessionId: string
  relationId: string
  status: "keep" | "unsure" | "reject" | "edit"
  rationale?: string
  createdAt: string
}
```

---

## 9.14 ReaderNode / ReaderRelation

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

---

## 9.15 ReaderSelection / ReaderClaim

```ts
ReaderSelection {
  id: string
  sessionId: string
  itemType: "evidence" | "carrier" | "relation" | "thread"
  itemId: string
  note?: string
}

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

---

## 9.16 MeaningProbeEvent

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

Probe-specific fields can live in `payload`.

---

## 9.17 InteractionEvent

Added in v7 because the prototype must support study logging.

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

This log is for research analysis.

It is not the reader's My Reading artifact.

---

## 9.18 Derived rather than mandatory entities

The following are not required as foundational stored entities:

- `ReferencePath`;
- graph layout coordinates;
- visualization-specific nodes.

A path can be generated from relation IDs for a particular view.

Persist it only when:

- a curator intentionally authored a reference path;
- a reader saves a personal path;
- reproducible study material requires a fixed path.

---

# 10. WorkPackage JSON Contract

The Phase-1 runtime consumes a published package.

Recommended top-level format:

```json
{
  "schema_version": "meaningforge-1.0",
  "work": {},
  "text_spans": [],
  "evidence": [],
  "narrative_units": [],
  "narrative_entities": [],
  "narrative_relations": [],
  "figurative_features": [],
  "carriers": [],
  "threads": [],
  "structural_relations": [],
  "interpretive_relations": [],
  "probes": [],
  "provenance": []
}
```

Reader data is never stored inside the reference WorkPackage.

---

## 10.1 Import validation

A WorkPackage cannot be marked `study_ready` unless:

- every referenced ID exists;
- every Evidence resolves to at least one TextSpan;
- every reader-facing relation resolves to evidence;
- every InterpretiveRelation has qualification and provenance;
- every thread has at least one Carrier or Feature and evidence;
- LLM-executed records include both method basis and executor provenance and pass the same schema/grounding validation as any other record;
- all TextSpan ordering is valid;
- no personal reader object is embedded in the reference package.

---

## 10.2 Current `Medicine_Substrate_v1.json` status

`Medicine_Substrate_v1.json` is currently a schema/integration skeleton.

It is useful for:

- parser development;
- endpoint development;
- frontend component wiring.

It is **not** the study-ready *Medicine* substrate.

The next target should be:

```text
Medicine_Substrate_v2_study_ready.json
```

constructed through the Annotation Guide and the validation rules in this section.

---

# 11. Prototype Implementation Architecture

MeaningForge 当前需要的是一个 **可本地运行、数据驱动的 research prototype**。

不要求：

- production deployment；
- Docker；
- PostgreSQL；
- microservices；
- authentication system；
- cloud infrastructure；
- complex REST architecture。

这些都不是 MeaningForge 的研究贡献，也不是当前 prototype 的前置条件。

---

## 11.1 Recommended prototype form

Codex 可以根据已有 demo 和仓库情况选择最简单的实现方式，例如：

```text
Option A
HTML + CSS + JavaScript

Option B
React + TypeScript + Vite
```

选择标准只有：

1. 能稳定运行；
2. 能从 JSON 动态加载数据；
3. 能完成完整 MeaningForge interaction loop；
4. 能保存并导出 participant data；
5. 不把文学解释硬编码在 UI 中。

不需要因为“架构更专业”而主动增加服务器、数据库或容器。

---

## 11.2 Prototype data flow

推荐：

```text
literary source / prepared substrate
        ↓
JSON WorkPackage
        ↓
MeaningForge local prototype
        │
        ├── Reading Pane
        ├── Whole-text Skeleton
        ├── Thread Workspace
        └── My Reading
        ↓
reader interaction state
        ↓
localStorage / browser state
        ↓
JSON export
```

Reference scaffold 与 reader personal layer 必须逻辑分离。

---

## 11.3 Reference data

Reference data 默认从 JSON 加载。

例如：

```text
data/
└── medicine.json
```

至少包含：

```text
work
textSpans
evidence
narrative*
figurativeFeatures
carriers
threads
structuralRelations
interpretiveRelations
probes
provenance
```

Codex 可以把 `MeaningForge_Data_Model_v2.md` 映射成 JavaScript/TypeScript objects。

---

## 11.4 Reader state

第一版可以直接使用：

```text
in-memory state
+
localStorage
```

保存：

- current reading position；
- highlights / notes；
- ReaderJudgment；
- ReaderSelection；
- ReaderNode；
- ReaderRelation；
- ReaderClaim；
- MeaningProbeEvent；
- InteractionEvent。

正式 controlled study 如果以后需要集中收集多 participant 数据，再决定是否增加 backend。

当前不要求。

---

## 11.5 Study export

必须支持：

```text
Export Session JSON
```

导出至少包括：

```text
session metadata
reader judgments
reader-added nodes
reader-added relations
reader selections
reader claims
probe results
interaction events
```

这比当前是否有数据库重要得多。

---

## 11.6 Substrate preparation

Substrate preparation 可以在 prototype 外完成。

推荐最简单流程：

```text
source text
↓
fixed MeaningForge protocol
↓
deterministic / LLM-assisted preparation
↓
JSON
↓
load into prototype
```

不要求把“文本 → substrate”做成复杂的在线 authoring platform。

如果 Codex 能方便地提供一个简单脚本或页面用于生成/整理 JSON，可以实现；但这不是 reader-facing MeaningForge prototype 的必要前置条件。

---

## 11.7 LLM use during preparation

LLM 可以代替研究者执行固定的：

- Evidence 整理；
- MIP/MIPVU-informed fields；
- Narrative Backbone 整理；
- Carrier gate 判断；
- StructuralRelation 分类；
- qualified InterpretiveRelation 整理；
- Thread grouping；
- JSON formatting/checking。

重点是：

> protocol 固定，LLM 只是执行者。

不需要专门开发 multi-agent framework、provider abstraction 或 LLM orchestration platform。

---

## 11.8 Suggested simple file organization

如果从空目录开始，可采用：

```text
MeaningForge/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── reading.js
│   ├── skeleton.js
│   ├── thread.js
│   ├── personal-layer.js
│   └── logging.js
├── data/
│   └── medicine.json
└── docs/
```

或者 React/Vite：

```text
MeaningForge/
├── src/
│   ├── components/
│   ├── data/
│   ├── state/
│   └── utils/
├── public/
└── docs/
```

这只是实现建议，不是研究架构。

---

# 12. Reader-Facing Component Architecture

无论使用 vanilla JavaScript 还是 React，reader-facing 功能保持一致。

```text
MeaningForge
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

---

## 12.1 ReadingPane

必须支持：

- 显示真实文学文本；
- 保持阅读位置；
- highlight / note；
- 从文本打开相关 thread；
- 从 evidence 返回 exact passage。

---

## 12.2 SkeletonOverview

显示：

- neutral thread label；
- whole-text distribution；
- evidence locations；
- thread entry。

默认不要展示 giant raw graph。

---

## 12.3 ThreadWorkspace

必须支持：

```text
Trace
Compare
Challenge
Counterevidence
optional Probe
Save
```

核心是同一个 thread 中连续 reasoning，而不是跳到多个割裂页面。

---

## 12.4 MyReading

保存：

- selected evidence；
- kept / unsure / rejected relations；
- edited / alternative relations；
- reader-added nodes；
- reader-added evidence；
- reader claim；
- qualification。

My Reading 是 reader-owned artifact。

---

## 12.5 Reference vs personal visual distinction

UI 必须让用户看出：

```text
system/reference proposal
reader-kept
reader-rejected
reader-edited
reader-authored
```

不要只靠颜色区分。

---

# 13. Local Running Requirement

Prototype 必须能够简单启动。

如果是纯前端：

```bash
python -m http.server 8000
```

或其他等价静态服务器。

如果是 Vite：

```bash
npm install
npm run dev
```

即可。

不要求 Docker。

不要求 production server。

不要求数据库。

---

# 14. Prototype Data Contract

Prototype 应按照 `MeaningForge_Data_Model_v2.md` 读取 JSON。

最重要的不是建立复杂 API，而是保证：

1. 所有 reference relation 都能追溯到 Evidence / TextSpan；
2. StructuralRelation 与 InterpretiveRelation 不混淆；
3. provenance 可查看；
4. reader state 与 reference data 分离；
5. reader 可以新增/修改自己的节点和关系；
6. 所有 participant interaction 可以导出。

如果后续真的增加 backend，也不能改变这些语义。

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

# 16. LLM Boundary

## 16.1 MeaningForge is model-enabled, not model-defined

LLM is not the research object.

MeaningForge defines:

- the substrate ontology;
- the MIP/MIPVU-informed record;
- the Carrier gates;
- relation taxonomies;
- thread rules;
- validation;
- interaction design.

LLM may execute some preparation steps, but does not define them.

---

## 16.2 Substrate-preparation use

Allowed:

- semantic annotation under fixed enums;
- MIP/MIPVU-informed field completion;
- candidate normalization;
- Carrier gate application;
- StructuralRelation classification;
- qualified InterpretiveRelation proposal after grounding;
- thread organization under neutral-label rules;
- JSON repair from validator feedback.

Every LLM-executed record must preserve:

```text
methodBasis
executorType = LLM
modelName/version when available
promptProtocolVersion
source grounding
```

No human approval is automatically required merely because the executor is an LLM.

The gate is validation, not executor identity.

---

## 16.3 Main runtime

The core reader study should work with live LLM generation disabled.

The runtime loads the same frozen reference WorkPackage for the relevant study condition.

This prevents:

- participant-specific scaffold drift;
- model-version drift;
- runtime model-intelligence confounds.

---

## 16.4 Optional live LLM features

If a later deployment or explicit study condition uses live LLM:

- log model/version;
- log prompt/context where appropriate;
- mark outputs as model-assisted;
- never silently merge model output into reader-authored understanding;
- do not let live LLM create an uncontrolled baseline difference.

---

## 16.5 What LLM must never become

LLM must not become:

- the source of MeaningForge ontology;
- an authority label equivalent to truth;
- an automatic final-essay generator;
- a substitute for the reader's final interpretation;
- a reason to turn the paper into an LLM/agent-pipeline contribution.

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

## 18.1 Substrate acceptance

A study-ready work must satisfy:

- [ ] fixed source edition;
- [ ] stable TextSpan IDs;
- [ ] every Evidence reaches exact text;
- [ ] every Carrier has evidence and provenance;
- [ ] structural relations are grounded;
- [ ] interpretive relations are qualified;
- [ ] reference vs reader layers are separated;
- [ ] thread labels do not encode a final thesis by default;
- [ ] LLM-executed records preserve method/executor provenance and pass schema + grounding validation;
- [ ] at least one thread supports the complete reasoning loop.

---

## 18.2 Runtime acceptance

The application must:

- [ ] load the work from JSON/database rather than hard-coded UI strings;
- [ ] display actual text;
- [ ] dynamically load threads;
- [ ] open exact evidence from a relation;
- [ ] display rationale and provenance;
- [ ] persist reader judgments;
- [ ] persist reader-created relations/claims;
- [ ] preserve state across refresh/session reload where required;
- [ ] support return-to-text from every evidence item;
- [ ] main reader runtime works without live LLM generation.

---

## 18.3 Interaction acceptance

For at least one complete thread, the reader can:

```text
Text
→ open thread
→ Trace
→ Compare
→ Challenge
→ inspect Counterevidence
→ optional Probe
→ Save
→ Compose
→ return to Text
```

---

## 18.4 UI redesign test

Before adding a surface, answer:

1. What reader question does it answer?
2. Which layer does it show?
3. What exact original passage can the reader reach?
4. Does it preserve provenance and uncertainty?
5. What reasoning action does it enable?
6. Is this design already supported by formative evidence, or is it still provisional?

If these cannot be answered, do not add the surface merely for visual richness.

---

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

## Milestone A — One real JSON substrate

先准备一份能驱动 UI 的真实/半真实 substrate。

开发阶段可以先使用：

```text
Medicine_Substrate_v1.json
```

作为结构参考。

正式 study 前再形成：

```text
Medicine_Substrate_v2_study_ready.json
```

---

## Milestone B — Reading + JSON loading

完成：

```text
load JSON
→ render actual text
→ render threads
→ click evidence
→ return to exact text
```

---

## Milestone C — One complete MeaningForge loop

先只把一个 thread 做完整：

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

这一步完成之前，不扩展额外功能。

---

## Milestone D — Personal layer persistence

实现：

```text
reader keep / unsure / reject / edit
reader-added evidence
reader-added node
reader-added relation
reader claim
```

并使用 localStorage / browser state 持久化。

刷新页面后，在合理范围内能够恢复 session state。

---

## Milestone E — Study logging/export

实现 interaction logging，并允许导出 JSON。

重点记录：

- opened evidence；
- opened relation；
- Trace / Compare；
- judgments；
- added relation/evidence；
- probe result；
- claim；
- timestamps。

---

## Milestone F — Expand remaining threads

只有一个完整 thread 稳定后，才扩展到其他 threads / works。

---

## Milestone G — Formative-informed refinement

根据 formative findings 再决定：

- overview 用 graph / cards / path；
- relation density；
- provenance 展示程度；
- replacement 是否保留；
- compare 的具体形式。

不要在 formative 前为了“看起来完整”把所有候选交互都做得很重。

# 21. Future Scaling, Not the HCI Core

Phase 1 already permits LLM-assisted execution of fixed substrate-preparation steps.

Future scaling may improve:

```text
automatic lexical candidate detection
better entity/event/discourse extraction
automatic recurrence/coreference/contrast proposal
batch corpus ingestion
scholarship retrieval
quality ranking
cross-work portability
```

These improve preparation efficiency.

They do not change the central system claim:

> MeaningForge studies human interaction with a structured, evidence-grounded, contestable literary scaffold.

Any future automation must preserve the distinctions among:

```text
text evidence
method basis
executor
structural relation
interpretive proposal
reader judgment
```

# 22. Codex / Developer Handoff Summary

Codex 不需要额外的 agent framework 文档。

只需按以下顺序理解当前项目：

```text
1. README_Current_Project.md
2. MeaningForge_CHI2027_Balanced_Literature_Idea.md
3. MeaningForge_System_Design_Development_Spec_v7_2.md
4. MeaningForge_Data_Model_v2.md
5. MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
```

然后开发一个本地可运行、JSON-driven 的 MeaningForge research prototype。

## Input

```text
literary text
+
reference substrate JSON
```

## Required system objects

```text
Work
TextSpan
Evidence
Narrative*
FigurativeFeature
Carrier
FigurativeThread
StructuralRelation
InterpretiveRelation
MeaningProbe
ProvenanceRecord

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

第一版：

```text
localStorage / browser state
```

## Export

```text
session JSON
```

## Non-negotiable rules

```text
Text is primary.
Reference scaffold is a proposal, not truth.
Every reference relation reaches textual evidence.
Structural and interpretive relations remain distinct.
Interpretive relations are qualified.
Reader can reject/edit/add.
Reader personal layer is separate.
The reader authors the final interpretation.
No production infrastructure is required.
```

# 23. Source Document Status After v7.2

After v7 is accepted as the project implementation authority:

```text
MeaningForge_System_Design_Development_Spec_v7_2.md
    = CURRENT IMPLEMENTATION AUTHORITY

MeaningForge_System_Design_Development_Spec_v6.md
    = ARCHIVE / consolidation source

MeaningForge_System_Design_Development_Spec_v3_0811.md
    = ARCHIVE / detailed consolidation source

MeaningForge_Data_Model_v2.md
    = CANONICAL DATA COMPANION

MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
    = CANONICAL SUBSTRATE PREPARATION PROTOCOL

Medicine_Substrate_v1.json
    = PROTOTYPE SKELETON, not study-ready
```

Do not delete v3_0811 or v6 immediately.

Archive them so design lineage remains recoverable.

---

# 24. Final Architecture

```text
                    SUBSTRATE PREPARATION
                              │
                        Literary Text
                              ↓
            Fixed MeaningForge Preparation Protocol
                              │
                  deterministic / LLM assistance
                              ↓
              evidence / carriers / relations / threads
                              ↓
                    reference substrate JSON
                              │
══════════════════════════════╪══════════════════════════════
                              │
                      LOCAL PROTOTYPE
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

The central v7.2 decision is:

> **MeaningForge should remain a simple, real research prototype. The complexity belongs in the representation and reader interaction—not in production infrastructure. JSON-driven data, local persistence, and exportable study logs are sufficient for the current stage.**

