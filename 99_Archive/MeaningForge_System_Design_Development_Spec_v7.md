# MeaningForge System Design and Development Specification v7

> **Version:** 2026-08-12  
> **Status:** Consolidated implementation authority for the CHI 2027 prototype  
> **Supersedes for development:** `MeaningForge_System_Design_Development_Spec_v6.md` and `MeaningForge_System_Design_Development_Spec_v3_0811.md`  
> **Companion documents:** `MeaningForge_Data_Model_v1.md`, `MeaningForge_Medicine_Substrate_Annotation_Guide.md`, `Medicine_Substrate_v1.json`  
> **Important:** v7 is not a mechanical merge. It keeps stable research/design commitments, revises assumptions contradicted by the current Phase-1 strategy, and demotes details that formative study has not yet justified.

---

# 0. Consolidation Decisions

## 0.1 Why v7 exists

`v3_0811` is the strongest detailed interaction/system specification, while `v6` correctly resets the implementation strategy around a human-curated substrate and a real data-driven prototype.

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

### Revision A — “Generate on import” becomes “Publish before reader use”

Old assumption:

```text
import text
→ automatically construct whole-text skeleton
→ reader begins
```

Current Phase-1 requirement:

```text
fix literary text edition
→ construct / curate substrate offline
→ quality-check
→ publish study-ready WorkPackage
→ runtime loads the WorkPackage
→ reader begins
```

The architectural commitment is that a whole-text scaffold exists for the work before meaningful interaction begins.

The prototype **does not need to automatically generate that scaffold at runtime**.

---

### Revision B — Construction routes are authoring strategies, not runtime requirements

The earlier Route A / B / C distinction remains conceptually useful:

```text
A. lexical figurative feature identification
B. non-lexical literary carrier identification
C. relation grounding
```

However, in Phase 1 these are implemented through researcher/literature-informed annotation and curation, not claimed as automatic NLP modules.

Future computational methods may accelerate them.

---

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

## DC3 — Whole-text scaffold exists, but construction method is not the contribution

For every study work, a complete-enough whole-text reference scaffold must be available before reader interaction.

For Phase 1:

```text
offline human-curated authoring
→ quality gate
→ published WorkPackage
→ runtime loading
```

Future versions may automate parts of authoring.

The reader should not need to parse the entire scaffold before starting.

---

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

# 8. Phase-1 Substrate Construction

## 8.1 Critical boundary: authoring time vs runtime

### Authoring time

Researcher/literature-trained curators construct and validate the substrate.

### Runtime

MeaningForge reads a published, study-ready data package and supports reader interaction.

Runtime Phase 1 does **not** need to:

- execute MIP/MIPVU automatically;
- discover literary carriers automatically;
- generate reliable interpretive relations automatically;
- call an LLM to build the scaffold.

---

## 8.2 Required Phase-1 authoring pipeline

```text
Step 0  fix text edition + normalization
↓
Step 1  create stable TextSpan IDs
↓
Step 2  identify Evidence
↓
Step 3  annotate minimal Narrative Backbone
↓
Step 4  identify FigurativeFeature candidates where appropriate
↓
Step 5  select Carrier candidates
↓
Step 6  create StructuralRelations
↓
Step 7  create qualified InterpretiveRelations only after grounding
↓
Step 8  assemble FigurativeThreads
↓
Step 9  author diagnostic MeaningProbes only where useful
↓
Step 10 provenance + quality gate
↓
publish study-ready WorkPackage
```

The detailed annotation protocol remains in:

`MeaningForge_Medicine_Substrate_Annotation_Guide.md`.

v7 embeds only the rules that affect system behavior.

---

## 8.3 Evidence-first rule

Evidence must be addressable text.

Evidence can include:

- object description;
- action;
- dialogue;
- scene;
- sensory image;
- repetition;
- contrast;
- consequence;
- character relation;
- contextual event.

An interpretation is not Evidence.

---

## 8.4 MIP/MIPVU boundary

MIP/MIPVU-inspired annotation applies only where defensible to **lexical word use**.

For a lexical candidate, authoring may record:

- contextual meaning;
- possible more basic meaning;
- contrast;
- whether comparison is defensible.

MIP/MIPVU does not automatically establish:

- a symbolic object;
- a motif;
- a scene-level literary relation;
- a final literary interpretation.

Therefore a salient narrative object may enter as a Carrier even when `mip_status = not_applicable`.

---

## 8.5 Carrier inclusion

A reader-facing Carrier should normally satisfy multiple gates:

- observable in the text;
- recurrence/distribution or important narrative position;
- relational load;
- interpretive tension;
- reader actionability;
- optional probe potential.

Do not promote ordinary filler items solely because they can be extracted computationally.

---

## 8.6 Structural before interpretive relation

StructuralRelation should be as text/narrative-grounded as possible.

Examples of allowed structural relation types:

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

Only after structural grounding may an InterpretiveRelation be authored.

Allowed interpretive relation families:

```text
supports
complicates
weakens
qualifies
possible_implication
alternative_to
reframes
```

Interpretive language must remain qualified.

---

## 8.7 Thread construction

A thread is not named as a final theme.

Prefer neutral labels tied to observable material, such as:

```text
blood / food / treatment
grave / crow / memorial
public talk / certainty / rumor
```

Avoid default labels that already state the final literary thesis.

---

## 8.8 Provenance

Canonical source types:

```text
TEXT
MIP_THEORY
NLP_RULE
SCHOLARSHIP
CURATOR
LLM_CANDIDATE
READER
```

Short authoring codes may be used:

```text
T M N S C L R
```

Rules:

1. `LLM_CANDIDATE` cannot directly become `study_ready`.
2. scholarship must not be represented as direct text.
3. curator-created interpretive relations remain marked as curator-created.
4. reader-authored objects remain in the personal layer.
5. every interpretive relation exposes provenance.

---

## 8.9 Curation status

Recommended lifecycle:

```text
candidate
→ researcher_curated
→ literature_checked
→ pilot_ready
→ study_ready
```

LLM-originated candidate:

```text
llm_candidate
→ researcher_reviewed
→ researcher_curated
→ ...
```

---

## 8.10 Minimum first real dataset

Target, not an absolute statistical requirement:

```text
1 work
50–100 TextSpan / Evidence items
15–25 Carriers
3–5 FigurativeThreads
30–50 Structural + Interpretive Relations
5–10 diagnostic Probe candidates
```

The previous “20 carriers” target should be treated as a midpoint, not a rigid schema requirement.

---

# 9. Canonical Logical Data Model

This section is the v7 implementation model.

`MeaningForge_Data_Model_v1.md` remains a useful companion reference, but where its simplified schema differs from v7, **v7 governs implementation**.

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
  sourceType:
    | "TEXT"
    | "MIP_THEORY"
    | "NLP_RULE"
    | "SCHOLARSHIP"
    | "CURATOR"
    | "LLM_CANDIDATE"
    | "READER"
  sourceRef?: string
  curatorId?: string
  methodNote?: string
  confidence?: number
  createdAt?: string
}
```

Confidence and source authority are separate concepts.

---

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
- no `LLM_CANDIDATE` item is directly study-ready without human review;
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

# 11. Backend Architecture

## 11.1 Recommended stack

Phase-1 application backend:

```text
Spring Boot
PostgreSQL
REST JSON API
```

A graph database is not required for the first prototype.

The graph-like relations can be represented relationally because:

- dataset size is small;
- path depth is limited;
- provenance and study records benefit from relational integrity;
- PostgreSQL is sufficient for thread/relation queries.

Neo4j may be explored later if graph-authoring or corpus-scale traversal becomes a real requirement.

---

## 11.2 Runtime boundary

The backend runtime serves:

- published reference substrate;
- reader session state;
- reader personal layer;
- interaction events.

It does not need to generate literary relations.

---

## 11.3 Suggested backend modules

```text
meaningforge-backend/
├── work/
│   ├── WorkController
│   ├── TextController
│   ├── WorkService
│   └── WorkRepository
│
├── scaffold/
│   ├── ThreadController
│   ├── RelationController
│   ├── EvidenceController
│   ├── ScaffoldService
│   └── ScaffoldRepository
│
├── reader/
│   ├── SessionController
│   ├── ReadingController
│   ├── ClaimController
│   ├── ReaderService
│   └── ReaderRepository
│
├── probe/
│   ├── ProbeController
│   └── ProbeService
│
├── importpkg/
│   ├── WorkPackageImporter
│   ├── WorkPackageValidator
│   └── ImportReport
│
└── logging/
    ├── EventController
    └── EventService
```

The exact package naming is flexible; the service boundaries are not.

---

# 12. Database Design

Logical tables:

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
relation_source
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
reader_claim_selection
reader_claim_relation
meaning_probe_event
interaction_event
```

---

## 12.1 Relation table discriminator

Physical storage may use one table:

```text
meaning_relation
```

with:

```text
layer = STRUCTURAL | INTERPRETIVE
relation_type = ...
```

This is acceptable only if:

- validation rules differ by layer;
- API responses preserve the distinction;
- UI visually distinguishes them;
- interpretive relations require qualification/provenance.

---

## 12.2 Required indexes

At minimum:

```text
text_span(work_id, order)
evidence_span(evidence_id, span_id)
figurative_thread(work_id)
thread_evidence(thread_id, evidence_id)
meaning_relation(thread_id)
relation_evidence(relation_id, evidence_id)
reader_judgment(session_id, relation_id)
reader_selection(session_id)
interaction_event(session_id, timestamp)
```

---

# 13. API Contract

Exact URI naming can change, but the capability set should remain.

## 13.1 Work and text

```http
GET /api/works/{workId}
GET /api/works/{workId}/text
GET /api/works/{workId}/text/spans/{spanId}
```

---

## 13.2 Whole-text scaffold

```http
GET /api/works/{workId}/threads
GET /api/threads/{threadId}
GET /api/threads/{threadId}/evidence
GET /api/threads/{threadId}/relations
GET /api/evidence/{evidenceId}
GET /api/relations/{relationId}
GET /api/relations/{relationId}/counterevidence
GET /api/threads/{threadId}/probes
```

---

## 13.3 Session

```http
POST /api/sessions
GET  /api/sessions/{sessionId}
GET  /api/sessions/{sessionId}/reading-state
```

---

## 13.4 Personal reading layer

```http
POST /api/sessions/{sessionId}/judgments
POST /api/sessions/{sessionId}/selections
POST /api/sessions/{sessionId}/reader-nodes
POST /api/sessions/{sessionId}/reader-relations
POST /api/sessions/{sessionId}/claims

GET  /api/sessions/{sessionId}/my-reading
```

---

## 13.5 Probe

```http
POST /api/sessions/{sessionId}/probe-events
```

The server saves the reader's judgment; it does not automatically declare the meaning impact.

---

## 13.6 Logging

```http
POST /api/sessions/{sessionId}/events
```

Frontend may batch non-critical interaction events.

Reader-authored content should use domain endpoints, not only generic logs.

---

## 13.7 Researcher import

For Phase 1, import may be a CLI or restricted endpoint:

```http
POST /api/admin/work-packages/import
```

Import must:

1. validate schema;
2. validate references;
3. validate provenance/status;
4. return an import report;
5. reject invalid study-ready packages.

---

# 14. Frontend Architecture

## 14.1 Recommended stack

```text
React
TypeScript
REST API client
```

The visualization library is an implementation choice, not a research contribution.

---

## 14.2 Top-level structure

```text
AppShell
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
└── MyReadingDrawer
```

---

## 14.3 What is not a top-level mode

Do not make these independent app destinations:

```text
Trace
Compare
Challenge
Replacement
Counterevidence
```

They are actions in the current thread context.

---

## 14.4 Reference vs personal visual state

The UI must clearly distinguish:

```text
reference item
reader-kept item
reader-rejected reference
reader-edited version
reader-authored item
tentative / qualified item
```

Do not rely on color alone; labels/icons/text should also communicate state.

---

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

## 16.1 Phase-1 main runtime

The CHI prototype must work with the LLM completely disabled.

This is important for:

- reproducibility;
- provenance;
- interaction-focused contribution;
- avoiding the “ChatGPT with visualization” critique.

---

## 16.2 Allowed optional authoring use

An LLM may propose:

- candidate carriers;
- relation candidates;
- alternative readings;
- possible counterevidence locations;
- draft rationales.

Every proposal must:

- link to original text;
- remain `LLM_CANDIDATE`;
- receive human review before publication.

---

## 16.3 Live LLM during user study

Do not enable uncontrolled live LLM generation in the main evaluation unless it is itself an explicit experimental condition.

If used, log:

- prompt/context;
- model/version;
- response;
- provenance;
- whether the reader accepted or edited it.

---

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
- [ ] LLM candidates cannot bypass human review;
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
- [ ] work without an LLM.

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

## Milestone A — Study-ready *Medicine* substrate

Produce:

```text
Medicine_Substrate_v2_study_ready.json
```

from the Annotation Guide.

---

## Milestone B — Backend substrate + personal layer

Implement:

- WorkPackage import;
- thread/evidence/relation queries;
- provenance;
- reader sessions;
- judgments;
- My Reading persistence;
- event logging.

---

## Milestone C — One complete reader loop

Implement one high-quality thread end to end before scaling interface breadth.

Required:

```text
Read
→ Overview
→ Thread
→ Trace
→ Compare
→ Challenge / Counterevidence
→ optional Probe
→ My Reading
→ Compose
```

---

## Milestone D — Expand to remaining threads

Only after Milestone C works from actual stored data.

---

## Milestone E — Formative-informed UI refinement

Use formative findings to revise:

- overview density;
- local relation view;
- authority/provenance disclosure;
- compare presentation;
- probe prominence.

---

## Milestone F — Controlled user study build

Freeze:

- substrate version;
- frontend build;
- backend version;
- study protocol;
- event schema.

---

# 21. Future Automation, Not Phase-1 Dependency

Future work may implement:

```text
automatic MIP-inspired lexical candidate extraction
NLP-assisted entity/event/discourse extraction
automatic recurrence/coreference/contrast proposal
LLM-assisted carrier/relation candidate generation
semi-automatic quality review
larger literary corpus ingestion
```

The architecture must remain compatible with these additions through provenance and status fields.

However:

> automation should replace authoring labor, not erase the epistemic distinction between text evidence, structural relation, interpretive proposal, and reader judgment.

---

# 22. Developer Handoff Summary

A developer receiving v7 should understand the project as follows.

## Input

A validated, curated `WorkPackage`.

## Reference backend objects

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
```

## Reader objects

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

## Main frontend

```text
ReadingPane
SkeletonOverview
ThreadWorkspace
MyReading
```

## Core reader operations

```text
Trace
Compare
Challenge
Counterevidence
Probe
Compose
```

## Non-negotiable rules

```text
Text is primary.
Every reference relation reaches evidence.
Interpretive relations are qualified.
Provenance is visible.
Reference and personal layers do not collapse.
The prototype works without LLM generation.
Phase-1 substrate may be human-curated.
```

---

# 23. Source Document Status After v7

After v7 is accepted as the project implementation authority:

```text
MeaningForge_System_Design_Development_Spec_v7.md
    = CURRENT IMPLEMENTATION AUTHORITY

MeaningForge_System_Design_Development_Spec_v6.md
    = ARCHIVE / consolidation source

MeaningForge_System_Design_Development_Spec_v3_0811.md
    = ARCHIVE / detailed consolidation source

MeaningForge_Data_Model_v1.md
    = ACTIVE COMPANION, but v7 governs conflicts

MeaningForge_Medicine_Substrate_Annotation_Guide.md
    = ACTIVE AUTHORING PROTOCOL

Medicine_Substrate_v1.json
    = PROTOTYPE SKELETON, not study-ready
```

Do not delete v3_0811 or v6 immediately.

Archive them so design lineage remains recoverable.

---

# 24. Final Architecture

```text
                         AUTHORING SIDE
                              │
Literary Text
    ↓
stable TextSpan / Evidence
    ↓
Narrative Backbone
    ↓
FigurativeFeature + Carrier curation
    ↓
StructuralRelation grounding
    ↓
qualified InterpretiveRelation
    ↓
FigurativeThread
    ↓
Provenance + Quality Gate
    ↓
STUDY-READY WORKPACKAGE
                              │
══════════════════════════════╪══════════════════════════════
                              │
                         RUNTIME SIDE
                              ↓
                        Spring Boot API
                              ↓
TEXT  ↔  SKELETON OVERVIEW  ↔  THREAD WORKSPACE
                              ↕
                 evidence / relation / provenance
                              ↓
           Trace / Compare / Challenge / Counterevidence
                              ↓
                       optional Probe
                              ↓
                         My Reading
                              ↓
                 Reader-authored Interpretation
```

This separation is the central v7 development decision:

> **MeaningForge Phase 1 studies interaction with a carefully constructed literary reasoning substrate. It does not require the substrate itself to be generated automatically.**
