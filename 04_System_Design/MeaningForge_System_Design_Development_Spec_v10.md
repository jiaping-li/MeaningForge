# MeaningForge System Design and Development Specification v10

## Reader Interface Redesign Update
## Low-Cognitive-Load Meaning Exploration Space

### 1. Design Motivation

The previous reader interface emphasized inspecting generated relations inside a whole-text scaffold. 
Based on formative design considerations, the right-side interaction space is redesigned from a dense structural inspection panel into a low-cognitive-load meaning exploration space.

The goal is not to expose the complete analytical structure produced by the backend.

Instead:

```
complex literary meaning structure
        ↓
compact visual representation
        ↓
reader exploration
        ↓
reader-authored interpretation
```

The system should help readers gradually discover how textual elements become meaningful, rather than requiring them to understand an analytical graph beforehand.

---

# 2. Three-Pane Reading Environment

The overall architecture remains:

```
-------------------------------------------------
| Import / Library | Literary Text | Meaning Space |
-------------------------------------------------
```

The left and middle panes remain unchanged:

- Left: document import and text management.
- Middle: original literary text reading surface.

The redesign mainly affects the right-side Meaning Space.

---

# 3. Meaning Space: From Dense Graph to Lightweight Visual Scaffold

## 3.1 Core Principle

MeaningForge does not directly display:

- raw UNR structures;
- all extracted figurative signals;
- all candidate relations;
- system-generated literary conclusions.

Instead, it presents a compact visual scaffold.

The default interface should answer:

> "What textual elements may be worth considering together?"

rather than:

> "What does this text mean?"

---

# 4. Meaning Map

## 4.1 Default View

The default right panel is a lightweight Meaning Map.

It uses:

- bubbles (nodes);
- simple connections (edges);
- progressive disclosure.

Example:

```
        ○

○────────○

        ○
```

The initial view should contain only a small number of high-value elements.

Recommended:

- 3-5 visible bubbles;
- limited connections;
- expandable details.

A complete graph is never shown by default.

---

## 4.2 Bubble Representation

A bubble represents a meaning-bearing textual element.

It may correspond to:

- recurring image;
- object;
- action;
- phrase;
- scene;
- character behavior;
- contextual pattern.

A bubble does NOT directly represent:

- final interpretation;
- symbolic meaning;
- author intention.

Example:

```
○ blood

○ darkness

○ repeated silence
```

not:

```
○ blood = social tragedy
```

## 4.2.1 Meaning Element Projection

The canvas must not depend on a small number of high-level metaphor or interpretation nodes. Its smallest interactive unit is a **Meaning Element**: an evidence-bearing textual unit that a reader can inspect and use in later reasoning.

```
UNR / Reference Scaffold
        ↓
Meaning Element Projection (frontend)
        ↓
Bubble Canvas
```

A Meaning Element is first projected as a grounded **Evidence Unit**: an exact clause, short dialogue turn, or source occurrence from a TextSpan. Its visible label must remain a textual cue or excerpt. Narrative-object, MIP, recurrence, and structural records can be retained as inspectable metadata, but cannot replace the visible cue with an interpretation-level label.

Each bubble must retain `evidenceId`, `TextSpan` provenance, type, and links to any available candidate/reference relation. It is therefore actionable: selecting it can return to its exact source passage.

This projection does **not** change the backend validation threshold and does not turn every element into a metaphor claim. It lowers the visual interaction granularity from “high-level interpretive carrier” to “inspectable textual evidence unit.” The default canvas must not render system-generated candidates, MIP labels, or thematic clusters as bubbles.

The system may retain 40–80 Meaning Elements for a work. The default chapter canvas should present a readable 20–30 evidence units, with further elements reachable by chapter change, selection, and progressive disclosure. Default canvas edges are omitted; a possible relation is shown only after a reader selects an element.

The reader may reorganize this evidence presentation without changing the reference scaffold: cluster by source position, evidence form, or occurrence frequency; color by evidence form, recurrence, or reader attention; and size by frequency, linked passages, or an equal-size view. These controls organize evidence for inspection. They must not assign interpretive themes or alter the underlying reference relations.

Readers can select several Evidence Units and use that set as the starting evidence for a new ReaderNode, ReaderRelation, or ReaderArgument. The resulting purple object is reader-authored; it is never automatically named, grouped, or concluded by the system.

Reader-authored nodes may appear as a separate purple overlay in the same chapter canvas when they retain an anchored evidence reference. Selecting one opens only its reader-authored note and the route back to its source text; it never changes the visual status or provenance of a reference Meaning Element.

The canvas has two deliberately separate arrangements. **System reference** is a reproducible, neutral placement based on source order and selected evidence attributes. **My arrangement** lets a reader move evidence and their own purple nodes to create a temporary comparison workspace; positions are saved in that ReaderSession with an interaction record. Moving a bubble is an act of organization, not an assertion that a system relation or literary interpretation is true.

## 4.3 Spatial Meaning Map Style

The Meaning Map uses a quiet dotted canvas and a small number of spatially grouped bubbles. It is inspired by exploratory visual interfaces, but is not a free-form mind map or a complete knowledge graph.

Evidence bubbles are readable, rounded micro-cards rather than text forced into tiny circular tokens. Their size has a minimum legible footprint; it can then vary only with recurrence or reader attention. A chapter starts with a readable subset (about 18 Evidence Units) and may disclose further units on request. This preserves an overview without pretending that dense display is itself a meaningful analysis.

```
      ┌──── local context cluster ────┐
      ○ detail A      ○ detail B
                ○ detail C
      └───────────────────────────────┘
```

Visual rules:

- Bubbles use restrained colour to distinguish **reference context** (blue-green), **candidate for exploration** (warm amber), and **reader-authored material** (purple).
- A faint enclosing region may group details that occur in the same scene or local reading context. The region names a neutral context, never a theme or literary conclusion.
- Prefer leaving the region unnamed in the default view. If a label is necessary, use a textual reference such as “血馒头相关文本” or “茶馆场景相关文本”, never an inferred theme such as “治疗与死亡” or “社会悲剧”.
- Spatial proximity means “may be useful to compare”, not “is semantically equivalent”.
- Thin dashed lines denote a checkable structural basis. They must not visually imply causality, hierarchy, or interpretive certainty.
- Bubble size may modestly reflect available evidence/recurrence, but never importance, literary value, or correctness.
- The default map contains one local cluster and no more than 3–5 bubbles. Additional details remain behind an explicit expansion action.

The map should feel like a reader-facing exploration surface: spacious, calm, and manipulable through selection. It must not resemble a dense NLP dashboard.

## 4.4 Text Budget and Visual Priority

The participant-facing map has a strict text budget. Spatial form, colour, grouping, and selection state carry first-level information; prose is only revealed after an intentional action.

Default visible text:

- one short map title;
- one neutral local-context label;
- 3–5 bubble labels;
- at most three short action labels: **Original text**, **Trace**, **My interpretation**.

Hidden until a click or disclosure:

- extraction rationale;
- relation basis;
- provenance;
- technical terms and counts;
- explanatory paragraphs;
- cross-chapter evidence quotations.

This is not a removal of traceability. It is a timing rule: evidence and provenance remain available, but are not read before the reader has selected an object or asked a question.

---

# 5. Progressive Disclosure Interaction

MeaningForge adopts a progressive disclosure model.

## Level 1 — Overview

Reader sees:

```
○ element A

      |
      |
○ element B
```

Only lightweight information is visible.

---

## Level 2 — Bubble Expansion

When the reader clicks a bubble:

The system reveals:

```
Selected element

↓


Text evidence

Chapter 2
Chapter 5
Chapter 8


Possible relations

Repeated image
Context change
Contrast
Parallel scene
```

---

## Level 3 — Evidence Grounding

Reader can continue:

```
Relation
    ↓
Evidence
    ↓
Original passage
```

The middle reading pane highlights the exact source text.

The original text remains the authority.

---

## Level 4 — Interpretation Workspace

Only after exploration does the reader enter deeper reasoning:

```
Evidence

+

Relations

+

Reader judgment

↓

My Interpretation
```

---

# 6. Edge Representation

Edges should represent possible relationships, not conclusions.

Avoid:

```
blood → represents death
```

Prefer:

```
blood
 |
 | repeated appearance
 |
death scene
```

Allowed relation labels:

- appears with;
- repeats with;
- contrasts with;
- changes after;
- connected through context;
- occurs alongside.

Interpretive relations remain qualified and contestable.

---

# 7. Thread Workspace Redesign

Thread Workspace is not a graph browser.

It is a local reasoning workspace.

Structure:

```
Meaning Map

      ○ blood


Evidence
---------
Text span 1
Text span 2
Text span 3


Relation Exploration


Reader Reflection

"My interpretation..."
```

The workspace supports:

## Trace

Follow:

```
bubble
 ↓
relation
 ↓
evidence
 ↓
original text
```

---

## Compare

Compare:

- different occurrences;
- different contexts;
- changing meanings across the text.

---

## Challenge

Readers can:

- keep;
- question;
- reject;
- modify;
- add alternative relations.

---

## Compose

Readers build:

```
My Interpretation

Supported by:
Evidence A
Evidence B
Relation C
```

The final interpretation belongs to the reader.

## 7.1 Persistent Right-side Bubble Canvas

Meaning Space is not a separate screen and does not require a mode switch. The right-side region itself is the persistent Bubble Canvas, while the original text remains visible in the middle pane.

The default canvas uses the same visual language as an exploratory workspace:

```
Literary Text                 Meaning Space
─────────────                 ─────────────
exact passage                 dotted canvas
                              local bubble cluster
                              ○ A  ·  ○ B
                              click one bubble → compact action card
```

The reader remains in the same reading environment throughout. Selecting a bubble only reveals a compact local card below the canvas; it does not open another graph page. Reference bubbles remain proposals grounded in text, and purple bubbles remain reader-authored.

---

# 8. My Reading Layer

My Reading becomes a personal meaning map.

It contains:

- selected evidence;
- accepted relations;
- rejected relations;
- modified relations;
- reader-created connections;
- reader claims.

Example:

```
My Reading


○ hope

 |
 |
○ darkness


Evidence:
1.
2.

Reason:
...
```

The personal layer never overwrites the reference scaffold.

---

# 9. Design Principles

## DP1 — Progressive Disclosure

Complex literary structures are revealed only when needed.

## DP2 — Evidence Before Interpretation

The system exposes:

```
text
 ↓
relation
 ↓
possible interpretation
```

not:

```
interpretation
 ↓
supporting text
```

## DP3 — Compact Representation

The visual layer compresses complex information into understandable objects.

## DP4 — Reader Negotiation

The scaffold is a proposal that readers can inspect, challenge, and revise.

## DP5 — Text Remains Primary

Every visual object must return to exact textual evidence.

---

# 10. Updated Reader Component Architecture

```
MeaningForge

├── ReadingPane
│
├── MeaningSpace
│
│   ├── MeaningMap
│   │   ├── SpatialClusterCanvas
│   │   └── MapExpansionControl
│   │
│   ├── BubbleExplorer
│   │
│   ├── EvidenceInspector
│   │
│   └── ThreadWorkspace
│
└── MyReading
```

---

# 11. Relationship to Backend

The backend remains unchanged:

```
Text
 ↓
Evidence
 ↓
UNR
 ↓
Meaning-Relevance Projection
 ↓
Reference Scaffold
```

The frontend introduces an additional compression layer:

```
Reference Scaffold
        ↓
Meaning Map
        ↓
Reader Exploration
```

The Meaning Map is therefore not a visualization of the entire UNR.

It is a reader-oriented projection optimized for exploration and reasoning.
