# MeaningForge v7.3 — 对齐与可行性审计

审计日期：2026-08-13  
审计对象：`README_Current_Project.md`、研究 idea、formative guide、v7.3 系统规格，以及当前 demo。

## 结论先行

MeaningForge 指向的是一个**真实但尚待形成性研究具体化的 HCI 问题**，不是伪需求：初学到中等经验的读者确实需要把跨段、跨语境的语言细节组织成可辩护的精读论证；而目前常见的支持形式容易给出解释结果、局部注释或静态资料，却不一定让读者检查关系如何成立。

不过，不能把这句话写成已经证实的用户 finding。最严谨的表述是：这是一个由文学精读实践、expert–novice 差异和现有工具边界支持的 **candidate problem**；formative study 必须检验困难是否主要真的是跨段 relation reasoning，而非词汇、历史知识、文本熟悉度或一般阅读能力。

## 0. 问题来源、真实需求与边界

### 问题链条

1. 文学精读要求读者将具体措辞、意象、行动、重复、对照和叙事语境联系起来，而不是只复述情节或主题。
2. 这些依据通常分布在全文不同位置；novice reader 可以察觉局部细节，却可能难以追溯、比较、整合并限定其解释。
3. 现有的导读、标注、搜索与 AI 解释可降低获得答案的门槛，却可能掩盖“依据之间是什么关系、这是否足够支持一个读法”。
4. 因此，设计机会不是再生成一个文学答案，而是把经过锚定和限定的关系外化为可探索、可比较、可质疑、可编辑的参考初稿，并让读者写出自己的论证。

### 为什么不是伪需求

- 目标不是“用户想要一张图”或“用户想点击更多功能”，而是可观察的 reasoning task：从分散 evidence 建立、检验、限定 interpretation。
- 产出不是系统替用户给主题，而是有证据选择、关系判断、反证与限定的 reader-authored claim；这使评价可以落在 evidence specificity、cross-span integration、qualification 和 transfer 上。
- 需求对 AI 更容易直接生成解释的环境尤为重要：得到结论与学会从证据推理不是同一个目标。

### 伪需求风险与必要的证伪条件

以下发现会要求缩小或 pivot，而不是继续堆功能：

- 一句“请给出文本依据”的提示已足以解决主要困难；
- participant 的主要障碍是词汇、时代背景或字面理解；
- evidence list 与普通导读和交互骨架效果相当；
- 读者只把骨架当权威答案，不会加入、拒绝、改写或限定；
- 只有预先由专家精细手工制作的少数文本可用。

故目前正确的 claim 是“值得研究的 interaction configuration”，不是“已证明的普遍学习需求”。

## 1. 文档对齐检查

| 关键项 | Idea | Formative | v7.3 规格 | 结论 |
|---|---|---|---|---|
| HCI 核心 | 读者从全文证据主动推理，而非接受 AI 结论 | 先观察自然阅读和现有支持 | 原文优先、结构先于结论 | 对齐 |
| 核心 artifact | 可争议的 whole-text figurative scaffold | 比较 evidence list、路径、整体骨架 | Reference Skeleton 与个人层分开 | 对齐 |
| 用户 | novice-to-intermediate | 9–12 名目标读者 | 同一目标用户 | 对齐 |
| 操作 | trace / compare / challenge / compose；probe 待验证 | probes 是候选而非既定需求 | 同一循环，probe 有明确 relation target 才启用 | 对齐 |
| 研究评价 | reasoning、critical inspection、transfer、trade-off | 产出 design requirements，非验证系统 | 记录 interaction 供后续研究使用 | 对齐 |
| 自动化边界 | substrate，不是 HCI contribution | 不在 formative 中测试模型能力 | executor 可替换，运行期无需 LLM | 对齐 |
| 数据认识论 | reference draft 不是真理 | 检验 authority perception | provenance + reference/personal separation | 对齐 |

### 需要保持的时间顺序

研究 idea 的第 26 节明确要求：先材料校准和 formative，再冻结最终 UI/interaction，再作 controlled study。demo 可以实现所有候选交互以便技术和材料校准，但论文不能把该 demo 的具体图形、replacement 或 relation taxonomy 当作 formative 已验证的设计要求。

## 2. v7.3 技术路线可行性

### 可实现，且适合 demo/研究原型的部分

| 阶段 | 可行判断 | 合理实现方式 |
|---|---|---|
| 文本结构与精确锚定 | 高 | 确定性分段、稳定 ID、字符 offset、原文重建校验 |
| Evidence / provenance | 高 | typed records、引用到 TextSpan、来源与执行者记录 |
| 叙事底座 | 中 | NER、事件/场景候选、受控语料上的人工或 LLM record-level review |
| 多源 FigurativeSignal | 中 | MIP/MIPVU-informed lexical records + recurrence/contrast/context-shift rules；不能声称自动完成文学阐释 |
| Candidate Carrier / Relation | 中 | 固定 taxonomy 与 gates 产生候选，再进行 grounding/validation |
| UNR | 高 | 作为 typed integration layer，而不是读者直接看的 generic graph |
| Grounding / validation | 高 | schema、offset、引用完整性、relation evidence、provenance、projection eligibility 的机器校验 |
| Meaning-Relevance Projection | 中高 | 以可审计的规则选择少量 ground、distributed、actionable 的对象；记录 excluded reason |
| 参考骨架与读者交互 | 高 | 冻结 WorkPackage 后以本地 UI 运行；reader state 与 reference data 分离 |

### 不能承诺的内容

1. MIP/MIPVU 不能自动推出高层文学意义；它至多为 lexical metaphor-related record 提供可审计依据。
2. UNR 不是“理解文学”的算法，也不是 HCI novelty；它是防止 source、mention、event、feature 和 relation 混淆的工程层。
3. LLM 可以在固定 schema 内提候选、做消歧、分类和 record-level repair；它不得自由定义 ontology、捏造证据、把 proposal 写成确定主题。
4. “从任意全文自动生成高质量 scaffold”在 CHI 2027 的研究范围内不现实，也不需要。可行目标是少量经校准文本、可复现的 construction run 和冻结 package。

### 最小可辩护技术主张

系统可实现“从导入文本自动构造**可检查的候选参考骨架**”；不应主张“自动理解全文隐喻意义”。controlled study 应使用相同、验证后、冻结的 WorkPackage，避免 runtime model drift 成为混杂变量。

## 3. 重写后的 demo 对应关系

当前 demo 重写为以下 reader flow：

```text
原文（默认入口）
  → 全文线索分布（不是 raw UNR graph）
  → 单条 FigurativeThread 工作台
  → 追踪 / 比较 / 质疑 / 反证 / 有条件测试
  → 我的阅读：证据、判断与读者自写 claim
```

实现上：

- 导入全文走 API construction draft；新 draft 含稳定字符 offsets、v7.3 construction metadata 与可审计 projection records。
- 参考数据不被读者操作覆盖；judgment、saved evidence、probe outcome、claim 和 event log 只进入 localStorage 中的 ReaderSession。
- overview 以中性 thread label 和文本分布表示全文结构；不将 narrative backbone 默认显示为图。
- relation workspace 明确把 interpretive relation 标为 proposal，并显示 qualification/provenance。
- probe 只展示 schema 中明确绑定 target relation 的项目；没有合适 probe 的 thread 不强造替换交互。
- 导出 session JSON 可用于后续 formative/pilot 的 interaction analysis。

## 4. 下一步优先级

1. 先跑 materials calibration 和 formative；将真实 breakdown 转写为 design requirements。
2. 对 2–3 篇低熟悉度文本建立/核查 v7.3 WorkPackage；将 `development` 和 `study-ready` 严格分开。
3. 为 projection record 增加完整的 selected/excluded audit，并在 validation tool 中校验它。
4. 冻结材料后才确定 controlled-study 信息匹配的 prose baseline、任务 rubric 和日志分析方案。

