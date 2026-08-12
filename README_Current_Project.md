# MeaningForge Current Project Map

**Last updated:** 2026-08-12  
**Target venue:** CHI 2027  
**Current goal:** develop a locally runnable, JSON-driven MeaningForge research prototype.

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
│   └── MeaningForge_System_Design_Development_Spec_v7_2.md
│
├── 05_Data_Substrate/
│   ├── MeaningForge_Data_Model_v2.md
│   ├── MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
│   └── Medicine_Substrate_v1.json
│
├── 06_Paper/
│   └── MeaningForge_Paper_Writing_Notes_v2.md
│
├── 07_User_Study/
│   └── [Controlled User Study 待 formative 后重写]
│
└── 99_Archive/
    ├── MeaningForge_System_Design_Development_Spec_v7_1.md
    ├── MeaningForge_System_Design_Development_Spec_v7.md
    ├── MeaningForge_System_Design_Development_Spec_v6.md
    ├── MeaningForge_System_Design_Development_Spec_v3_0811.md
    └── older project documents
```

没有额外的 Codex agent framework 文档。

Codex 直接阅读主线文档即可开发。

---

# 2. Current Main Documents

| Layer | File | Status |
|---|---|---|
| Research Idea | `MeaningForge_CHI2027_Balanced_Literature_Idea.md` | **CANONICAL** |
| Literature Review | `MeaningForge_Step2_5Axis_Evidence_Matrix.xlsx` | **SUPPORTING** |
| Formative UI | `MeaningForge_Formative_Study_Ready_v6.html` | **CANONICAL** |
| Formative Guide | `MeaningForge_Formative_v6_Moderator_Guide.md` | **CANONICAL** |
| System Design | `MeaningForge_System_Design_Development_Spec_v7_2.md` | **CURRENT IMPLEMENTATION AUTHORITY** |
| Data Model | `MeaningForge_Data_Model_v2.md` | **CANONICAL v2** |
| Annotation Guide | `MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md` | **CANONICAL v2** |
| Prototype Data | `Medicine_Substrate_v1.json` | **DEVELOPMENT SKELETON / NOT STUDY-READY** |
| Paper Notes | `MeaningForge_Paper_Writing_Notes_v2.md` | **ACTIVE** |
| User Study | TBD | **PENDING** |

---

# 3. Current Core Idea

MeaningForge 的核心不是：

```text
AI 给读者文学答案
```

而是：

```text
Whole-text reference scaffold
        ↓
reader traces / compares / challenges / edits / extends
        ↓
Personal Reading Layer
        ↓
Reader's Own Interpretation
```

Reference scaffold 是：

> **evidence-grounded, structured, contestable starting scaffold**

不是 gold-standard interpretation。

---

# 4. Current Technical Route

```text
Literary Text
      ↓
fixed MeaningForge substrate protocol
      ↓
MIP/MIPVU-informed + narrative/structural rules
      ↓
deterministic / LLM-assisted execution
      ↓
Evidence / Carrier / Relations / Threads
      ↓
reference JSON
      ↓
════════ MeaningForge Prototype ════════
      ↓
Reading Pane
↔ Whole-text Skeleton
↔ Thread Workspace
      ↓
Trace / Compare / Challenge /
Counterevidence / optional Probe
      ↓
My Reading
      ↓
Reader-authored Interpretation
```

LLM 只是代替人工执行繁琐的 substrate 标注/整理工作。

它不是 MeaningForge 的研究对象。

---

# 5. Current Prototype Implementation

当前 prototype **不要求生产级工程架构**。

默认足够：

```text
HTML / CSS / JavaScript
or
React / TypeScript
```

数据：

```text
JSON
```

Reader state：

```text
browser state / localStorage
```

研究数据：

```text
Export JSON
```

不要求：

- Docker；
- PostgreSQL；
- microservices；
- production deployment；
- authentication；
- complex backend/API。

如果未来 controlled study 真的需要服务器集中收数据，再单独增加。

---

# 6. Required MeaningForge Interaction Loop

Codex 开发时必须优先完成：

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

Reader 必须能够：

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

# 7. Three Data Layers

```text
Narrative Backbone
    = context

Reference Figurative Scaffold
    = system/reference proposal

Personal Reading Layer
    = reader's own evidence / relations / claims
```

Reference data 不被 reader 操作静默覆盖。

Personal layer 必须单独保存。

---

# 8. Structural vs Interpretive Relations

```text
StructuralRelation
    = recurrence / contrast / consequence /
      context change / parallel etc.
        ↓ grounds

InterpretiveRelation
    = qualified possible reading
```

InterpretiveRelation 不是 literary fact。

Reader 可以：

```text
keep / unsure / reject / edit / alternative
```

---

# 9. Substrate Preparation

固定的是：

```text
ontology
MIP/MIPVU-informed fields
Carrier gates
relation taxonomy
Thread rules
provenance rules
```

不是固定：

```text
必须人工逐条标注
```

执行者可以是：

```text
deterministic code
LLM
human
```

LLM 只是执行固定规则，不重新定义 MeaningForge。

---

# 10. What Codex Should Read

给 Codex 整个项目目录，然后让它依次阅读：

```text
1. README_Current_Project.md
2. 01_Research_Idea/MeaningForge_CHI2027_Balanced_Literature_Idea.md
3. 04_System_Design/MeaningForge_System_Design_Development_Spec_v7_2.md
4. 05_Data_Substrate/MeaningForge_Data_Model_v2.md
5. 05_Data_Substrate/MeaningForge_Medicine_Substrate_Annotation_Guide_v2.md
```

然后告诉它：

> 根据这些文档，直接开发一个本地可运行、JSON 数据驱动的 MeaningForge research prototype。保持实现简单，不增加当前研究不需要的生产级基础设施。

---

# 11. Formative and User Study

Formative v6 保持当前版本。

Formative 主要决定：

- overview 的形式；
- relation density；
- challenge/edit 形式；
- provenance 展示；
- replacement 是否保留。

Controlled User Study 等 formative + prototype 稳定后再重新写。

---

# 12. Archive Rule

当前：

```text
v7.2
= 唯一开发 authority
```

以下全部只作为历史来源：

```text
v7.1
v7
v6
v3_0811
older specs
```

不要让 Codex 同时按照旧 spec 开发。

---

# 13. One-Line Rule

> **MeaningForge 的复杂性应该体现在 evidence-grounded representation 和 reader interaction，而不是 Docker、数据库或生产级软件基础设施。**
