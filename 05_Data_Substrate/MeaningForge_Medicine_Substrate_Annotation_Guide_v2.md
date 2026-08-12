# MeaningForge Medicine Substrate Annotation Guide v2

> **Version:** 2026-08-12  
> **Status:** Canonical substrate-preparation protocol  
> **Scope:** How a literary text is converted into a MeaningForge reference WorkPackage  
> **Important revision:** The protocol is fixed by MeaningForge. A deterministic program, an LLM, or a human can execute individual steps. The executor does not redefine the method.

---

# 1. Purpose

本文件定义：

> 文学文本如何按照 MeaningForge 已固定的理论与数据规则，变成可运行、可追溯、可质疑的 reference scaffold。

完整路线：

```text
Literary Text
→ stable text structure
→ Evidence
→ Narrative Backbone
→ FigurativeFeature
→ Carrier
→ StructuralRelation
→ qualified InterpretiveRelation
→ FigurativeThread
→ optional MeaningProbe
→ validation
→ frozen WorkPackage
→ MeaningForge
```

本文件不是一套“让 LLM 自由分析文学”的 prompt。

也不是要求研究者寻找唯一正确解释。

它定义的是：

```text
fixed protocol
+ fixed ontology
+ fixed relation taxonomy
+ fixed schema
+ fixed validation rules
```

然后执行工作可以交给：

```text
deterministic code
LLM
human researcher
```

---

# 2. Core Epistemic Principle

MeaningForge 的 reference scaffold 是：

> **structured, evidence-grounded, contestable starting scaffold**

不是：

> gold-standard literary interpretation

因此 substrate 的目标不是让所有 relation 达到“文学专家唯一认可”。

目标是：

1. evidence 真实可定位；
2. relation 有可说明的 grounding；
3. interpretive relation 保持 qualified；
4. provenance / executor 可查；
5. reader 可以 keep / unsure / reject / edit / add；
6. reader 最终形成自己的 understanding。

---

# 3. Method and Executor Must Be Separated

这是 v2 最重要的规则。

例如某条 FigurativeFeature：

```text
method basis:
MIP/MIPVU-informed

executor:
LLM
```

含义是：

> LLM 按固定的 MIP/MIPVU-informed record 执行了标注。

不能写成：

> LLM 自己发明了一套 metaphor theory。

同样：

```text
method basis:
StructuralRelation rule

executor:
LLM
```

表示 LLM 按已定义的 relation taxonomy 整理文本关系。

---

# 4. Allowed Executors

## 4.1 Deterministic code

适合：

- paragraph/sentence segmentation；
- stable ID generation；
- exact offsets；
- repeated string matching；
- schema validation；
- referential-integrity validation；
- fixed format conversion。

## 4.2 LLM

适合代替研究者执行：

- evidence semantic classification；
- MIP/MIPVU-informed fields 的填写；
- NarrativeEntity / event / scene 的整理；
- Carrier inclusion criteria 的判断；
- StructuralRelation classification；
- qualified InterpretiveRelation proposal；
- neutral Thread grouping；
- rationale / qualification normalization；
- consistency checking。

## 4.3 Human

Human 不是 Phase-1 技术路线的硬依赖。

可以用于：

- spot check；
- material sanity check；
- 研究团队希望做额外 methodological audit 时的复核。

不要求：

```text
所有数据必须由文学专家逐条标完
```

除非未来论文明确要对 annotation reliability 做独立研究声明。

---

# 5. Stable Text / Edition Control

正式数据准备前必须固定文本版本。

```json
{
  "work_id": "lu_xun_medicine",
  "title": "药",
  "author": "鲁迅",
  "language": "zh",
  "edition_id": "medicine_ed_01",
  "source_description": "...",
  "normalization": {
    "punctuation_normalized": true,
    "paragraph_boundaries_preserved": true
  }
}
```

允许：

- 清理 OCR noise；
- 标点标准化；
- 稳定 paragraph/sentence/span IDs。

禁止：

- 改写原文；
- 为了 relation 更明显而修改句子；
- 把解释写回 source text。

---

# 6. Step 1 — TextSpan and Evidence

## 6.1 TextSpan

TextSpan 是最小的 reader-returnable addressable unit。

规则：

- 足够短；
- 保留必要局部语境；
- 不把关键词从上下文完全剥离；
- 有稳定 ID；
- 能回原文。

## 6.2 Evidence

Evidence 是：

> 可以用来支持、质疑或比较某个 relation / interpretation 的具体文本证据。

允许类型：

```text
object_description
action
dialogue
scene
sensory_image
repetition
contrast
consequence
character_relation
contextual_event
```

不是 Evidence：

```text
作者批判……
主题是……
这里象征……
```

这些属于 interpretive proposal。

---

# 7. Step 2 — Narrative Backbone

Narrative Backbone 回答：

```text
谁？
做了什么？
对什么对象？
发生在哪里？
先后关系是什么？
有什么后果？
谁在说话？
```

Node types：

```text
character
object
event
action
scene
discourse
place
```

Relation types：

```text
participates_in
performed_by
acts_on
occurs_in
precedes
causes
results_in
associated_with
spoken_by
directed_to
```

NarrativeRelation 不自动等于 figurative relation。

---

# 8. Step 3 — FigurativeFeature

MeaningForge 不把所有文学意义都压缩成 lexical metaphor。

## Route A — Lexical metaphor-related feature

适用时按 MIP/MIPVU-informed record：

```text
lexical unit
contextual meaning
possible basic meaning
contrast?
comparison defensible?
```

输出字段固定。

LLM 可以填写这些字段，但不能改变判断维度。

## Route B — Broader literary feature

包括：

- recurrent imagery；
- object；
- action；
- scene；
- discourse；
- ritualized behavior；
- narrative pattern。

例如一个叙事物件具有象征/主题潜力，并不意味着它是 MIP 识别出的 lexical metaphor。

---

# 9. Step 4 — Carrier Selection

Carrier 定义：

> 一个可观察、可定位、具有全文关系负载，并值得 reader 继续 Trace / Compare / Challenge 的文本对象。

固定 gate：

```text
A Observability
B Recurrence / Distribution
C Narrative Salience
D Relational Load
E Interpretive Tension
F Reader Actionability
G Optional Probe Potential
```

一个候选通常应满足多个 gate。

不要提升：

- 普通 filler；
- 无关系负载的随机名词；
- 仅因为“听起来文学”而加入的项目；
- 完全依赖长篇外部解释才能成立的节点。

LLM 在这里执行的是：

> 对候选逐项应用固定 gate。

而不是：

> 自由发挥找“最深刻的意象”。

---

# 10. Step 5 — StructuralRelation

StructuralRelation 尽量保持文本/叙事可观察。

固定类型：

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

每条 StructuralRelation 必须：

- source/target ID 存在；
- evidenceIds 存在；
- rationale 非空；
- method basis / executor 被记录。

示例：

```text
Carrier X
→ changes_context
→ occurrence/context Y
```

不要在这一层直接写：

```text
X
→ symbolizes
→ 社会愚昧
```

---

# 11. Step 6 — InterpretiveRelation

InterpretiveRelation 必须建立在前面 Evidence / StructuralRelation 之后。

它定义为：

> 由已有 grounding 支持、但仍允许 reader 不同意、修改或增加 alternative 的 reference proposal。

固定类型：

```text
supports
complicates
weakens
qualifies
possible_implication
alternative_to
reframes
```

写法：

避免：

```text
作者就是在……
这明确象征……
唯一意义是……
```

优先：

```text
这些证据可能支持……
一个可检验的读法是……
这一关系使……成为可能解释之一
```

每条 study-ready InterpretiveRelation 必须包含：

```text
evidenceIds
groundingRelationIds
relationText
qualification
provenance
```

---

# 12. Step 7 — FigurativeThread

Thread 是 reader-facing grouping object。

它不是 Theme 标签。

优先 neutral label：

```text
血 / 食物 / 治疗
坟地 / 乌鸦 / 纪念
公共谈话 / 确定性 / 传言
```

避免：

```text
封建愚昧
革命失败
作者的绝望
```

因为后者已经把 reference scaffold 变成答案展示器。

Thread 必须能够展开到：

```text
carrier
feature
evidence
structural relation
qualified interpretive relation
provenance
```

---

# 13. Step 8 — MeaningProbe

Probe 不是每个 Carrier 都必须有。

固定候选类型：

```text
edge_removal
replacement
alternative_path
```

Counterevidence 主要作为通用 reasoning lens。

## Replacement eligibility

只有满足以下条件时才建立：

1. target relation 明确；
2. 替换改变一个有意义的维度；
3. 能回到原文讨论；
4. 不是随机换词；
5. reader 能判断 preserved / weakened / broken / emergent / mixed / unsure。

---

# 14. Provenance / Execution Metadata

必须同时记录：

## Method basis

```text
DIRECT_TEXT
MIP_MIPVU_INFORMED
NARRATIVE_RULE
STRUCTURAL_RULE
SCHOLARSHIP
REFERENCE_INTERPRETIVE_PROTOCOL
READER_REASONING
```

## Executor

```text
DETERMINISTIC
LLM
HUMAN
IMPORTED
READER
```

LLM 不是一个 literary-authority label。

示例：

```json
{
  "methodBasis": "REFERENCE_INTERPRETIVE_PROTOCOL",
  "executorType": "LLM",
  "modelName": "...",
  "promptProtocolVersion": "medicine-substrate-v2"
}
```

---

# 15. Preparation Status

不再使用必须经过“researcher_curated → literature_checked”的硬性流程。

统一：

```text
candidate
↓
schema_validated
↓
grounding_validated
↓
reference_ready
↓
pilot_ready / study_ready
```

可选：

```text
sanity_checked
```

作为项目内部 QA 记录，但不是 ontology 必需的 epistemic authority。

`study_ready` 表示：

> 符合固定 protocol 且 frozen for study。

不表示：

> 这是正确文学答案。

---

# 16. LLM Execution Contract

如果使用 LLM 执行某一步，调用必须满足以下约束。

## 16.1 Input

只给它：

- fixed source text/span；
- 已有对象；
- 当前步骤允许使用的 taxonomy；
- 当前步骤的 inclusion/validation rules；
- 输出 schema。

## 16.2 Output

只允许：

- schema-defined fields；
- existing IDs；
- explicitly requested new IDs；
- evidence-grounded rationale。

## 16.3 Prohibited behavior

LLM 不得：

- 发明不存在的原文；
- 使用未声明 relation type；
- 把自己的文学判断写成 text fact；
- 跳过 StructuralRelation 直接生成无 grounding 的高层 InterpretiveRelation；
- 修改 source text；
- 把 reader layer 写进 reference package；
- 改写 MeaningForge ontology。

## 16.4 Retry

遇到 schema/grounding failure：

```text
validator reports exact error
→ LLM receives error + original allowed context
→ repair only invalid fields
→ validate again
```

不要让 LLM 在 retry 时重写整份文学分析。

---

# 17. Automatic Validation

Codex 应实现 machine validators。

## Schema validation

- required field；
- enum；
- ID format；
- array type。

## Referential integrity

- source/target exists；
- evidence IDs exist；
- thread members exist；
- provenance exists。

## Grounding validation

- evidence points to TextSpan；
- quoted/extracted text matches source；
- StructuralRelation has evidence；
- InterpretiveRelation has groundingRelationIds；
- qualification 非空。

## Epistemic validation

- theme-like absolute wording can be warned；
- thread neutral-label rule can be warned；
- `executorType=LLM` 不能替代 methodBasis；
- reader objects cannot enter reference package。

---

# 18. Human Involvement

MeaningForge 不要求研究者手工完成整个 substrate。

推荐：

```text
LLM / deterministic execution
→ automatic validation
→ optional lightweight sanity check
→ freeze WorkPackage
```

Sanity check 只需要关注：

- 明显 hallucination；
- source mismatch；
- relation 极端离谱；
- thread label 直接泄露标准答案；
- probe 明显成为 word game。

如果没有做 formal human agreement study，不要在论文里声称：

> expert-validated gold scaffold

也没有必要为了让系统成立而做完整 expert annotation。

---

# 19. Reliability / Audit

Inter-annotator agreement **不是 prototype construction 的硬要求**。

只有当论文提出以下 claim 时才需要专门设计：

> “我们的 annotation scheme 本身具有高 inter-rater reliability。”

MeaningForge 当前研究问题不是这个。

更适合记录：

```text
protocol version
executor
model/version if LLM
validation result
optional audit note
```

这样保证 reproducibility 和 provenance。

---

# 20. JSON Export

推荐：

```text
WorkPackage
├── work
├── textSpans
├── evidence
├── narrativeUnits
├── narrativeEntities
├── narrativeRelations
├── figurativeFeatures
├── carriers
├── threads
├── structuralRelations
├── interpretiveRelations
├── probes
└── provenance
```

ReaderSession / ReaderClaim 等不放入 reference WorkPackage。

---

# 21. First Real Dataset Target

建议目标：

```text
1 work
50–100 TextSpan / Evidence
15–25 Carrier
3–5 FigurativeThread
30–50 Structural + InterpretiveRelation
5–10 optional Probe
```

这些数字是工程 target，不是理论要求。

---

# 22. Study-Ready Checklist

- [ ] source edition frozen
- [ ] stable TextSpan IDs
- [ ] evidence resolves to exact text
- [ ] carrier has evidence
- [ ] structural relation has grounding
- [ ] interpretive relation has grounding + qualification
- [ ] thread uses non-answer-steering label
- [ ] provenance separates method basis from executor
- [ ] schema validation passes
- [ ] referential-integrity validation passes
- [ ] reader can challenge reference relations
- [ ] reference scaffold is frozen for the study
- [ ] runtime does not regenerate different reference relations per participant

---

# 23. Correct Project Framing

Do not describe this guide as:

> an LLM literary interpretation pipeline.

Describe it as:

> **MeaningForge substrate preparation protocol, whose fixed annotation and structuring steps may be executed with deterministic tools, LLM assistance, or human labor.**

The substrate is preparation.

The research object remains:

> **reader interaction with a whole-text, evidence-grounded, contestable figurative scaffold.**
