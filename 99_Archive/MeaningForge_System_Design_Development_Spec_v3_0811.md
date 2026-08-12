# MeaningForge System Design and Development Spec v3

> **Version:** 2026-08-12  
> **Status:** Revised design specification. It aligns the current research idea, the formative-study protocol, and subsequent demo development.  
> **Relationship to v2:** v2 remains a useful detailed inventory of interactions and data fields. This document corrects the architecture and priorities that later demo iterations blurred. Future development should use v3 as the governing specification.

---

# 0. One Sentence

**MeaningForge turns an imported literary work into a provenance-aware, editable whole-text figurative-meaning skeleton, so novice-to-intermediate readers can inspect, test, revise, and build an interpretation from its textual relations in their own words.**

It is not an AI answer generator, a generic story-graph browser, or a metaphor detector presented as an educational interface.

---

# 1. What the System Is Actually Trying to Do

## 1.1 The research object

The difficult part of literary close reading is often not locating one expressive word. It is working out how dispersed details—an image, repeated phrasing, an action, a contrast, an event, or a later consequence—can jointly make an interpretation plausible.

MeaningForge externalizes this **whole-text figurative-meaning structure** as a reader-contestable scaffold. The scaffold gives the reader something to inspect and work with; it does not settle what the work finally means.

```text
original text
  ↕
figurative feature / carrier occurrences
  ↕
relations across passages and narrative context
  ↕
possible interpretive paths
  ↕
reader's evidence-grounded claim
```

## 1.2 The reader's actual task

The unit of interaction is **not** a chapter summary, a pre-written reading question, or an isolated metaphor label. It is a **figurative thread**:

> A bounded, inspectable grouping of textual features and relations that may matter to a literary reading.

For example, in *Medicine*, a thread may begin with the carrier `人血馒头`, but it only becomes meaningful through its links to buying medicine, execution, eating, public talk, death, and the ending. The object is an anchor; the meaning is a relation pattern around it.

There is no single mandatory reader route. The system first constructs a default skeleton from the whole work; the reader then enters from either the text or that skeleton and can repeatedly move between them. The recurring reasoning cycle is:

```text
whole-text default skeleton is available
↕
read / select original text  ↔  open or add a node / thread
                                  ↓
                        trace evidence and relations
                                  ↓
                 compare / challenge / test / revise
                                  ↓
                  save to a personal reading layer
                                  ↺
                       return to text or skeleton
```

## 1.3 What this system must not become

- A full raw story graph that readers must decode before they can read.
- A sequence of unrelated feature tabs.
- A task system that tells the reader which literary question to answer.
- A replacement-word game detached from textual relations.
- A visually impressive network that has no reader action or provenance.
- A hidden backend whose generated relations are presented as literary fact.

---

# 2. The Key Architectural Distinction

The previous demo drifted because it merged three different structures. They must remain connected but distinct.

| Layer | What it contains | Who primarily uses it | Reader-facing role |
|---|---|---|---|
| **Narrative backbone** | characters, events, objects, scenes, discourse, chronology, causal or contrast links | generation pipeline / researcher | contextual grounding for the reader-facing skeleton |
| **Figurative-meaning skeleton** | system-proposed figurative features, carriers, distributed evidence, structural and interpretive relations, provenance | the reader | editable reference draft and core interaction surface |
| **Personal reading layer** | evidence selected by the reader, accepted/rejected/edited relations, alternatives, claims | the reader | the reader's evolving interpretation and trace |

## 2.1 Narrative backbone grounds the skeleton; it does not replace it

The whole text is first structured into narrative units, entities, events, scenes, objects, discourse and trajectories. This is necessary because a figurative relation often reaches beyond the local sentence.

However, `人物 → 事件 → 物件` is **not automatically a figurative thread**, and a raw narrative graph is not itself a close-reading interface. It is the contextual substrate from which the reader-facing figurative-meaning skeleton can be grounded.

## 2.2 Figurative-meaning skeleton is the shared working artifact

The reader-facing skeleton organizes a smaller, qualified subset of the backbone around potentially meaningful features. It begins as a system-proposed reference draft, but is intentionally incomplete and contestable. A relation can be:

- textual: recurrence, lexical contrast, changed speaker/context, co-occurrence;
- narrative: consequence, juxtaposition, transformation, parallel event;
- interpretive: possible implication, qualified mapping, scholarly or curated reading;
- reader-authored: a relation the reader adds or rewrites.

Every default relation needs an explanation of **why it exists**, its exact source passage(s), and provenance. Readers can add a new evidence node, add or rewrite a relation, reject a relation in their personal layer, or mark it unresolved.

## 2.3 Personal reading is not a log panel

The reader's actions become an editable, evidence-grounded personal structure. It should show what the reader kept, rejected, changed, and still finds uncertain. This makes interpretive ownership visible and gives the final composition a real source, rather than simply saving button clicks.

---

# 3. Stable Design Commitments

These are derived from the current Idea. They are commitments for the demo and later study; they are not claimed as formative findings.

## DC1. Text remains primary

The work should open in the original text. Markers are quiet and on request. A reader can read uninterrupted, then open the scaffold from a selected span, a margin cue, or an overview control.

## DC2. Start with structure, not a supplied conclusion

The first reader-facing layer can reveal that passages recur, contrast, change context, or connect to an event. It should not open with a thematic verdict such as “this symbolizes alienation.” Candidate high-level readings appear later and remain visibly qualified.

## DC3. Generate a full-text skeleton, then let readers disclose it progressively

The whole-text skeleton is generated when a text is imported because the research contribution is whole-text reasoning. It is a necessary shared reference object, not a hidden backend artifact. Yet a reader should never need to parse every node to begin.

The system must offer both:

1. an **overview of default nodes, threads and their distribution across the work**, for orientation and discovery; and
2. a **focused local path**, for actual close reading and editing.

The overview is expandable and interactive: its default nodes can be opened, linked to text, saved, qualified, or extended. It is not merely decorative, but neither is it a mandatory graph-decoding task screen.

## DC4. One thread, one coherent local workspace

Once a thread is open, evidence, relation tracing, comparison, challenge and testing must remain coordinated around that same thread. They are contextual actions, not separate top-level destinations that lose the reader's current object.

## DC5. Reader judgment changes the personal layer, never silently edits reference data

Reference relations remain visible with provenance. Agree, unsure, reject, edit, and alternative actions create a separate personal layer. Rejected reference relations are visibly crossed out only in the reader's view.

## DC6. A probe has to test a relation

Replacement is only offered where a carrier is suitable and only after a reader has traced a path. Its result is never an auto-generated meaning; the reader judges which relations remain, weaken, break, or newly arise. Edge removal and counterevidence are equally legitimate probes.

## DC7. The system never hides its source of authority

Every feature, relation and interpretation is labeled as text-derived, theory/rule-derived, curated/scholarly, optional LLM-suggested, or reader-authored. Confidence is not a substitute for provenance.

## DC8. The default skeleton is a proposal, not a closed curriculum

The system may initialize nodes and relations from MIP/MIPVU-inspired analysis, traditional text processing, curated sources, and optional LLM-assisted proposal/refinement. It must not confine readers to those defaults. At every relevant point, the reader can:

```text
add a textual clue
add a relation
rewrite a relation label or rationale
keep / reject / mark unsure
attach an alternative path or claim
```

The reference and reader-authored layers remain separately visible, so reader additions never silently become system truth.

---

# 4. What Formative Study Will Decide

The existing formative protocol compares the same case information in four representations:

| Study representation | What it tests | It should not yet be treated as |
|---|---|---|
| A. Paragraph explanation | a linear explanatory baseline | the MeaningForge interface |
| B. Evidence list | whether traceability needs explicit relations | proof that lists are insufficient |
| C. Layered relation path | whether a local evidence-to-interpretation path supports reasoning | proof that paths should be the only view |
| D. Whole-text skeleton | whether overview + relations supports global organization without excess load | proof that a large graph belongs on the default screen |

It also probes relation judgments, alternative readings, counterevidence, and an optional replacement/counterfactual interaction.

Therefore the study can inform:

- whether overview is useful, and when;
- whether readers prefer list, path, or overview for different reasoning work;
- where readers experience authority pressure;
- whether replacement is diagnostic or merely a word game;
- which evidence/relations readers want to retain in an interpretation.

Until those findings exist, the demo is a **theory-grounded research prototype**. It should implement the stable commitments above and preserve alternative representations rather than prematurely declaring one final UI correct.

---

# 5. Reader Information Architecture

The architecture is a single system with four coordinated reader layers, not five separate modes.

```text
                            [ My Reading ]
                                  ↑
TEXT  ↔  EDITABLE WHOLE-TEXT SKELETON  ↔  THREAD WORKSPACE
                                  ↕
                      narrative context / provenance
```

## 5.1 Layer A: Primary Reading Pane

**Question it answers:** “What does the text say here?”

Visible by default:

- original text, divided by actual section/chapter;
- table of contents and reading position;
- normal highlights and private notes;
- quiet margin cues such as `3 related passages`, without colouring every candidate;
- a clear control to open the whole-text overview or a selected thread.

## 5.2 Layer B: Editable Whole-Text Figurative-Meaning Skeleton

**Question it answers:** “What potentially meaningful patterns and relations has the system proposed across this work, and where do I agree, disagree, or see something missing?”

This is the reader-facing form of the whole-text scaffold. It is generated at import time as a default, provenance-aware draft. Its primary marks are **figurative features/carriers, threads, and their occurrences and relations across the text**, rather than every raw narrative node and edge.

Recommended initial form:

```text
[ Blood / food / body ]     ●────●──●──────●     4 passages
[ Public certainty ]        ─●──────●─────●─     3 passages
[ Grave / memorial ]        ────────●──────●     2 passages
```

Each thread exposes, on demand:

- a neutral label and its evidence locations;
- a small number of relation anchors;
- provenance/curation status;
- an action to open the focused workspace.

The reader can also create a node from selected original text and connect it to an existing node or path. New reader-authored marks are visibly distinct from reference nodes; editing a reference relation creates a personal revision rather than overwriting it.

The overview may also provide a toggled **narrative context map**. This map is a deliberately simplified subset showing only the story events and carriers relevant to the selected thread. A raw all-node network belongs only in the research/debug layer.

## 5.3 Layer C: Thread Workspace

**Question it answers:** “Why might these passages and relations support this reading?”

This is the core interaction surface. It opens one thread at a time and keeps the source text visibly linked.

The workspace has one path canvas and four contextual actions:

| Action | Reader activity | Output |
|---|---|---|
| **Trace** | follow a relation from a feature to exact passages and narrative context | a qualified local path |
| **Compare** | place two evidence items, two threads, or two paths side by side | a marked point of divergence or change |
| **Challenge / test** | retain, qualify, reject, edit, add an alternative; inspect support/complication/counterevidence; use a suitable probe | a reader judgment about a relation |
| **Save to My Reading** | keep evidence, relation, comparison or uncertainty | a personal interpretive component |

These are controls within the same thread workspace. They should not be global navigation labels such as `骨架 / 路径 / 对读 / 判断 / 我的阅读` competing for attention.

### A local path is not a forced answer

An initial path can display:

```text
textual feature / carrier
  → relation with explicit source
  → changed or parallel context
  → possible implication (qualified)
```

Alternative and counterevidence are adjacent to the path, not hidden in a different module.

## 5.4 Layer D: My Reading

**Question it answers:** “What interpretation am I building, and what does it rest on?”

This is a persistent tray/drawer that can later expand into a composition workspace. It contains:

- reader-selected evidence;
- accepted, edited, and rejected relations;
- alternative or complicating evidence;
- reader-written claim and explanation;
- a small personal map, only after there is enough reader-authored material.

It is not the same as a research log. It is a reader's working argument.

---

# 6. Correct System and Reader Sequences

## 6.1 System preparation sequence

```text
import full text
→ construct a grounded default figurative-meaning skeleton
→ expose the overview, source passages, provenance and edit affordances
→ preserve the reference layer while each reader develops a personal layer
```

This is a system sequence, not a reader task. It makes clear that whole-text structuring precedes interaction.

## 6.2 Reader reasoning sequence

The system supports two legitimate entrances, which converge immediately on the same thread workspace.

## Entrance A: text-led

```text
read a passage
→ select a span or open its quiet marker
→ inspect available thread(s)
→ open one thread workspace
→ trace / compare / challenge / test
→ save to My Reading
→ return to passage or jump to a connected passage
```

## Entrance B: overview-led

```text
open whole-text thread overview
→ inspect a thread's distribution
→ open one thread workspace
→ jump to any linked passage
→ trace / compare / challenge / test
→ save to My Reading
→ return to text
```

The reader does **not** have to first select a system-authored question, decode a story graph, or use a replacement operation.

---

# 7. Data Model That Supports the Interaction

## 7.1 Narrative backbone (backend substrate)

```ts
NarrativeUnit { id, workId, order, chapterId, passageIds, summary? }
NarrativeEntity { id, type: character | object | scene | discourse | event }
NarrativeRelation {
  id,
  sourceId,
  targetId,
  type: temporal | causal | consequence | contrast | participation | location,
  evidenceIds,
  provenance
}
NarrativeTrajectory { id, entityId, unitIds }
```

This structure is generated from full text through segmentation, extraction, normalization, relation proposal, grounding and quality review. It is reusable across cases, but its raw form is not displayed as a reader task.

## 7.2 Figurative-meaning scaffold (reference layer)

```ts
FigurativeFeature {
  id, evidenceId, surfaceForm, type, mipStatus?,
  carrierRole?, confidence, provenance
}

FigurativeThread {
  id, workId, neutralLabel, featureIds, evidenceIds,
  distribution, status: default | curated | tentative, provenance
}

MeaningRelation {
  id, threadId, sourceId, targetId,
  type: recurrence | contrast | transformation | parallel | narrative_context |
        interpretive_bridge | possible_implication,
  evidenceIds, rationale, qualification, provenance
}

ReferencePath { id, threadId, relationIds, interpretationId? }
```

**Important ontology rule:** carrier/feature, narrative entity/event, relation, path, and interpretation are different object types. A reader question is a prompt attached to an object; it is not a reference-graph node.

## 7.3 Personal reading layer

```ts
ReaderJudgment { relationId, status: keep | unsure | reject | edit, rationale? }
ReaderNode { id, evidenceId?, label, type, rationale?, basedOnNodeId? }
ReaderRelation { id, sourceId, targetId, label, evidenceIds, rationale, basedOnRelationId? }
ReaderSelection { itemType, itemId, note? }
ReaderClaim { id, text, selectionIds, relationIds, qualification? }
MeaningProbeEvent { targetId, probeType, readerJudgments, note? }
```

---

# 8. Full-Text Construction Pipeline

The construction process must produce grounded data, not a one-turn LLM literary verdict.

## 8.0 Current demo status: what is and is not implemented

The current MeaningForge demo does **not** execute this pipeline at runtime. Its curated cases load pre-authored `candidateCarriers`, evidence, relations, narrative context, and probes from a researcher-curated packet. Runtime code currently performs only full-text loading/sectioning, grouping of those curated records into threads, chapter-level display, and reader-layer editing.

In particular, the current demo does **not** yet perform:

- executable MIP/MIPVU annotation;
- automatic entity/event/discourse extraction;
- automatic cross-passage relation discovery;
- automatic quality gating;
- live or offline LLM proposal/refinement during demo use.

The `mip_mipvu`, `symbol_motif`, and `narrative_structure` labels attached to a curated record indicate the theoretical lenses used when it was prepared. They are **not evidence that a corresponding algorithm has run**. The demo must therefore be described as a reader-interaction prototype over curated reference skeletons, not as an end-to-end automatic skeleton builder.

## 8.1 What a rigorous traditional-method core actually requires

MIP/MIPVU is a protocol for deciding whether a **word use** is metaphor-related: an annotator establishes contextual meaning, identifies a more basic meaning where applicable, and judges whether a contrast/comparison relation exists. It is one source of lexical figurative features; it does not itself extract a whole literary interpretation, a symbolic object, or a narrative relation.

Therefore the operational core needs separate, explicitly labeled routes:

```text
Route A: lexical figurative features
  MIP/MIPVU-informed annotation or detector
  → contextual/basic meaning record
  → metaphor-related word-use candidate

Route B: literary carriers beyond lexical metaphor
  entity / object / action / scene / discourse extraction
  + recurrence, salience, anomaly, narrative-position signals
  → symbolic / motif / action / scene candidate

Route C: relation grounding
  exact spans + coreference + event/discourse links + recurrence/contrast rules
  → text-derived relation candidates
```

Only after these routes are grounded can they be assembled into a candidate figurative thread. A `human-blood bun`, for example, should not be claimed as a MIP-identified lexical metaphor merely because it matters literary. It may enter through Route B as an object carrier, then gain significance through grounded relations to buying medicine, execution, eating, public talk, and the ending.

```text
full text
→ clean and segment into chapters / narrative units / passages
→ Route A: identify lexical metaphor-related word uses with MIP/MIPVU records where defensible
→ Route B: extract and normalize entities, events, objects, scenes and discourse as non-lexical carrier candidates
→ Route C: ground recurrence, contrast, coreference, event and discourse relations in exact spans
→ build grounded narrative relations and trajectories
→ assemble qualified candidate distributed figurative threads from A + B + C
→ propose relation paths with source spans and provenance
→ apply rule-based quality gates and optional LLM-assisted refinement
→ retain multiple qualified alternatives where evidence permits
→ publish an editable reader-facing default skeleton plus the underlying context links
```

### Engineering constraints

- Rules and traditional text-analysis resources provide deterministic boundaries, filtering and provenance.
- LLM assistance may help propose candidate features, relations and alternatives, but every published item must link back to original text.
- A candidate that cannot be grounded remains unpublished or explicitly marked tentative.
- Curated case data is valid for a study-ready demonstration, but must be labeled curated rather than represented as automatic extraction.
- The pipeline should be case-portable at the substrate level. The quality of a study-ready reference scaffold can still vary by work and requires evaluation.

---

# 9. What the Next Demo Must Implement

## 9.1 First implementation milestone: one coherent reader loop

For a curated case such as *Medicine*, the demo should reliably support:

1. Read actual chapters/sections of the text.
2. Open an overview of figurative threads across the work.
3. Open one thread and see its exact evidence distribution.
4. Trace a local path with relation rationale and provenance.
5. Compare evidence or paths and inspect a divergence.
6. Challenge a relation, including support / complicate / counter material.
7. Use one suitable test, with replacement only where it is meaningful.
8. Add, revise, preserve or reject nodes and relations, then write a qualified personal claim.
9. Return to the text at any time.

## 9.2 What must be removed or demoted from the current demo

- `故事线 / 交汇点 / 变量测试` as the main reader navigation.
- A full raw story graph as the default reading surface.
- `读者问题` as a reference-graph node or mandatory task.
- Separate global tabs that make the reader forget which thread they are examining.
- Prewritten “deep meaning” language that reads as a canonical answer.
- Decorative graph dragging that does not trace, compare, challenge, test, or compose.

## 9.3 What stays as a researcher-only layer

- raw narrative backbone graph;
- candidate index and quality scores;
- LLM/rule provenance audit;
- full extraction logs and exports;
- material calibration state.

---

# 10. Acceptance Criteria Before Another Visual Redesign

A proposed UI change is acceptable only if it can answer all six questions:

1. Which reader question does this surface answer?
2. Which of the three layers does it show: backbone, reference scaffold, or personal reading?
3. What exact original passage can the reader reach from it?
4. Does it preserve provenance and uncertainty?
5. What reader action does it enable: trace, compare, challenge, test, or compose?
6. Does it stay compatible with the formative study's still-open representation question?

If a visual element cannot answer these, it should not be added merely to make the interface feel fuller or more graph-like.

---

# 11. Alignment Summary

| Source | What v3 preserves |
|---|---|
| **Current Idea** | whole-text figurative-meaning scaffold; reader-led evidence reasoning; network as core artifact but not novelty; LLM-removable core |
| **Formative protocol** | representation is an empirical question; A/B/C/D share information; authority, load, traceability, alternative/counter evidence and replacement must be evaluated |
| **v2 specification** | text-first, progressive disclosure, trace, compare, challenge, test, provenance and personal composition |
| **Correction in v3** | treats the whole-text skeleton as a generated, visible and editable reference draft, while stopping a raw story graph or a system-authored reading question from becoming the primary reader workflow |
