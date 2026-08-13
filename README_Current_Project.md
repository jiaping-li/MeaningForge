# MeaningForge Current Project Map

**Last updated:** 2026-08-13  
**Target venue:** CHI 2027  
**Current goal:** develop a locally runnable MeaningForge research prototype that can go from **full-text import → automatic substrate construction → UNR → Meaning-Relevance Projection → whole-text reference skeleton → reader reasoning**.

---

# 1. Current Project Directory

```text
MeaningForge/
│
├── README_Current_Project.md
│
├── 01_Research_Idea/
│   └── MeaningForge_CHI2027_Balanced_Literature_Idea.md
│
├── 02_Literature_Review/
│   └── MeaningForge_Step2_5Axis_Evidence_Matrix.xlsx
│
├── 03_Formative_Study/
│   ├── MeaningForge_Formative_Study_Ready_v6.html
│   └── MeaningForge_Formative_v6_Moderator_Guide.md
│
├── 04_System_Design/
│   └── MeaningForge_System_Design_Development_Spec_v7_3.md
│
├── 05_Data_Substrate/
│   ├── MeaningForge_Data_Model_v3.md
│   ├── MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md
│   └── Medicine_Substrate_v1.json
│
├── 06_Paper/
│   └── MeaningForge_Paper_Writing_Notes_v2_1.md
│
├── 07_User_Study/
│   └── [Controlled User Study pending formative + prototype stabilization]
│
└── 99_Archive/
    ├── MeaningForge_System_Design_Development_Spec_v7_2.md
    ├── MeaningForge_Data_Model_v2.md
    ├── MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
    └── older project documents
```

No separate Codex agent-framework document is required.

---

# 2. Current Main Documents

| Layer | File | Status |
|---|---|---|
| Research Idea | `MeaningForge_CHI2027_Balanced_Literature_Idea.md` | **CANONICAL / wording-calibrated only** |
| Literature Review | `MeaningForge_Step2_5Axis_Evidence_Matrix.xlsx` | **SUPPORTING / unchanged** |
| Formative UI | `MeaningForge_Formative_Study_Ready_v6.html` | **CANONICAL / unchanged** |
| Formative Guide | `MeaningForge_Formative_v6_Moderator_Guide.md` | **CANONICAL / unchanged** |
| System Design | `MeaningForge_System_Design_Development_Spec_v7_3.md` | **CURRENT IMPLEMENTATION AUTHORITY** |
| Data Model | `MeaningForge_Data_Model_v3.md` | **CANONICAL v3** |
| Construction Guide | `MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md` | **CANONICAL v3** |
| Prototype Data | `Medicine_Substrate_v1.json` | **LEGACY DEVELOPMENT SKELETON / migration input** |
| Paper Notes | `MeaningForge_Paper_Writing_Notes_v2_1.md` | **ACTIVE v2.1** |
| User Study | TBD | **PENDING** |

---

# 3. Current Core Idea

MeaningForge is not:

```text
AI gives the reader a literary answer
```

The HCI core remains:

```text
Whole-text reference skeleton
↓
reader traces / compares / challenges / edits / extends
↓
Personal Reading Layer
↓
Reader-authored Interpretation
```

The reference skeleton is:

> **an evidence-grounded, structured, contestable starting scaffold**

not a gold-standard interpretation.

---

# 4. Current Technical Route

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

User-facing flow:

```text
Import text
→ Generate skeleton
→ Read / Trace / Compare / Challenge / Compose
```

`automatic` does not mean `purely rule-based`.

The construction layer may combine:

```text
deterministic algorithms
+ traditional NLP
+ fixed theoretical procedures
+ LLM-assisted semantic execution
```

---

# 5. UNR and Projection Boundary

UNR is an internal logical integration layer, not a novel HCI contribution and not a generic node/edge graph.

It integrates typed objects such as:

```text
SourceDocument / Paragraph / Sentence / TextSpan / Evidence
EntityMention / EventMention / Entity / Event / Scene / Discourse
FigurativeSignal
CandidateCarrier
CandidateRelation
Provenance
```

The reader-facing skeleton is a **projection** from validated UNR objects.

Every reader-facing object should have inspectable projection metadata:

```text
projectionStatus
readerFacing
selectionReasons
selectionRationale
```

---

# 6. Current Prototype Implementation

The prototype should stay research-demo-level and locally runnable.

Recommended:

```text
React + TypeScript + Vite
or existing HTML/CSS/JavaScript codebase if cheaper to extend
```

The main new engineering requirement is an automatic construction orchestrator before the reading interface.

A simple local architecture is sufficient:

```text
UI
├── Import / Generate view
├── Reading Pane
├── Whole-text Skeleton
├── Thread Workspace
└── My Reading

Construction modules
├── text structuring
├── narrative extraction
├── figurative-signal detection
├── candidate generation
├── UNR assembly
├── validation
├── projection
└── skeleton builder

Persistence
├── JSON WorkPackageV3
└── localStorage / browser state for reader data
```

No production requirement for:

- Docker;
- PostgreSQL;
- microservices;
- authentication;
- cloud deployment;
- complex REST infrastructure.

---

# 7. Required MeaningForge Interaction Loop

The reader interaction loop is unchanged:

```text
Read
→ Whole-text Skeleton
→ open one Thread
→ Trace
→ Compare
→ Challenge
→ Counterevidence
→ optional Probe
→ My Reading
→ Compose
→ return to text
```

Reader actions must include:

```text
keep
unsure
reject
edit relation
add evidence
add node
add relation
add alternative
write claim
```

---

# 8. Three Semantic Layers

```text
Narrative Backbone
    = contextual substrate inside UNR

Reference Figurative Skeleton
    = projected system/reference proposal

Personal Reading Layer
    = reader's own evidence / relations / claims
```

Reference data is never silently overwritten by reader actions.

---

# 9. Structural vs Interpretive Relations

```text
StructuralRelation
    = recurrence / contrast / consequence /
      context change / parallel etc.
        ↓ grounds
InterpretiveRelation
    = qualified possible reading
```

InterpretiveRelation is not literary fact.

---

# 10. Construction Protocol Boundary

MeaningForge fixes:

```text
source anchoring rules
ontology and typed schema
mention/entity distinction
MIP/MIPVU-informed lexical record
figurative-signal taxonomy
carrier gates
relation taxonomy
validation rules
projection rules
reader interaction semantics
```

The executor can be:

```text
DETERMINISTIC
TRADITIONAL_NLP
LLM
HUMAN
IMPORTED
```

The LLM can execute fixed semantic procedures but does not define MeaningForge's ontology or research question.

---

# 11. What Codex Should Read

Give Codex the project directory and instruct it to read in this order:

```text
1. README_Current_Project.md
2. 01_Research_Idea/MeaningForge_CHI2027_Balanced_Literature_Idea.md
3. 04_System_Design/MeaningForge_System_Design_Development_Spec_v7_3.md
4. 05_Data_Substrate/MeaningForge_Data_Model_v3.md
5. 05_Data_Substrate/MeaningForge_Medicine_Substrate_Annotation_Guide_v3.md
6. 06_Paper/MeaningForge_Paper_Writing_Notes_v2_1.md
```

Then tell it:

> Build a locally runnable MeaningForge research prototype that accepts a literary text, automatically constructs a validated UNR, projects a reader-facing whole-text figurative reference skeleton, and connects that generated skeleton to the existing reader reasoning interface. Keep the implementation simple and do not add production infrastructure that the study does not require.

The implementation is not complete if it only loads a manually prepared JSON scaffold.

---

# 12. Formative and Literature Review

Keep unchanged:

```text
MeaningForge_Formative_Study_Ready_v6.html
MeaningForge_Formative_v6_Moderator_Guide.md
MeaningForge_Step2_5Axis_Evidence_Matrix.xlsx
```

Reason: these materials concern reader reasoning, representation, and interaction requirements; they do not depend on whether the backend substrate was manually annotated or automatically constructed.

---

# 13. Controlled Study Note

The product architecture supports:

```text
Import text → Generate skeleton
```

For a controlled study, the research team may generate once and freeze the resulting reference skeleton for a condition so that every participant sees the same substrate. This is a study-control decision, not the system's architectural limitation.

---

# 14. Archive Rule

Current implementation authority:

```text
v7.3 System Spec
v3 Data Model
v3 Construction Guide
```

Archive:

```text
v7.2 and older System Specs
v2 and older Data Models
v2 Annotation Guide
```

Do not let Codex implement against old versions in parallel.

---

# 15. One-Line Rule

> **MeaningForge's technical complexity belongs in traceable representation, validated projection, and reader reasoning—not in production infrastructure or claims of automatic literary understanding.**
