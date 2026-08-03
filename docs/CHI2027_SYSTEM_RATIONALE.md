# MeaningForge CHI 2027 系统设计 Rationale

## Research Gap

很多文学解释会直接告诉读者“某个意象/隐喻意味着什么”，但没有展示这个意义是如何从具体文本载体、局部证据、文化/文学传统、以及替代可能性的比较中被建构出来的。

MeaningForge 不定位为更强的文学解释生成器，而是一个面向读者的 close-reading scaffold：它让文学意义建构过程变得可看见、可试探、可修改。

## 理论闭环

当前完整技术路线以项目根目录 `MeaningForge_Final_Technical_Route.md` 为准。本文件只保留系统设计 rationale 的简版。

MeaningForge 当前的核心理论问题可以表述为 **latent interpretive relation gaps**：

```text
读者可能知道一个解释结论，
但看不见这个结论如何由具体文本载体、局部证据、文化经验和替换后的意义变化共同支撑。
```

系统因此不是生成解释，而是提供 counterfactual meaning scaffold：

```text
latent interpretive relation gaps
  -> theory-guided UIRR packet construction
  -> counterfactual meaning scaffold
  -> evidence-aware reader judgment
  -> reader-authored interpretation
```

这一闭环对应到系统模块：

- concrete carrier highlight：让抽象解释先回到可观察文本对象；
- carrier type classification：区分物件、动作、话语、场景/仪式、感官/图像，不同类型绑定不同证据和替换策略；
- type-specific decomposition：把每类 carrier 拆成不同的 evidence cue、replacement probe 和 consequence prompt，避免把所有隐喻都压成“X 象征 Y”；
- replacement probe：用 “what if we change this carrier?” 测试意义关系；
- preserved / weakened / emergent / broken cards：把替换后果从“对/错”改成关系变化，并显化原 carrier 不可替代的关系；
- evidence peek：把解释推断重新绑定回原文；
- source strip：区分原文证据、研究者整理材料、读者动作和模型辅助试探；
- reader-authored paragraph：最终解释由读者修改和承担。
- packet protocol status：区分模型草稿、本地脚手架、研究者整理和可 study 材料。

详细文献依据见项目根目录的 `MeaningForge_Theoretical_Foundation_and_Bibliography.md`。

## 更新后的系统定位

MeaningForge 的研究链条应当借鉴 VeriForge 的结构：

```text
reader breakdowns
  -> design goals
  -> mixed-initiative mechanisms
  -> target-reader evaluation
  -> expert artifact validation
```

Primary users 是 novice-to-intermediate close readers。文学训练者可以帮助校准材料和盲评输出，但他们不是系统可用性或学习效果 claim 的主要人群。

## UIRR Packet Construction

MeaningForge 的材料层不应被描述为“LLM 自动解释文学”。更准确的流程是 **type-aware, researcher-curated UIRR authoring pipeline**：

这里的 carrier 不是 strict lexical metaphor 的同义词。系统处理的是 metaphorical / symbolic meaning carriers：包括词汇隐喻、象征物、反复母题、叙事动作、话语承诺和场景/仪式结构。以鲁迅《药》为例，`人血馒头` 更准确地是 symbolic object / narrative carrier，而不是单纯的 lexical metaphor。

Reader-facing 目标不是让系统告诉读者“这个意象象征什么”，而是让读者经历 carrier-mediated interpretive transfer：从具体载体和原文证据出发，观察替换后哪些意义关系保留、变弱、涌现或断裂，从而判断这条解释转移是否成立。

```text
完整文本
  -> passage segmentation
  -> structured reading index
  -> structured literary substrate
  -> metaphorical meaning carrier discovery
  -> candidate carrier triage
  -> carrier type classification
  -> type-specific decomposition checklist
  -> evidence binding
  -> replacement probe drafting
  -> consequence hypothesis generation
  -> automatic packet consistency checks
  -> researcher curation
  -> lightweight expert validation
  -> reader-facing Meaning Lens
  -> reader judgment
  -> reader-authored interpretation
```

V2 的关键不是把“隐喻识别”做成一个更激进的自动分类器，而是在候选发现之前建立 **structured literary substrate**：章节 / 场景 / 段落 reading index、叙述/对话/动作/场景单元、人物-物件-事件共现、重复与分布、语义异常、证据回链和校准状态。这个结构化底座让系统能解释为什么某个 span 被提出为 candidate，也能解释为什么 `說著`、`自然，自然` 这类 discourse filler 不应进入 Meaning Lens。

因此，候选 carrier 的可靠性来自一个分层过程：

```text
structured literary substrate
  -> high-recall candidate discovery
  -> negative filtering
  -> type-aware salience scoring
  -> replacement diagnosticity check
  -> researcher calibration
```

结构化全文处理是必要前置层，但不是最终判定层。它提高 candidate quality 和 auditability；真正的 study-ready packet 仍需要 evidence binding、replacement consequence 和 researcher / expert validation。

因此内置案例应显示为 theory-guided packet / researcher-curated；导入文本应显示为 unvalidated exploration-only draft。这个状态是系统边界的一部分，不是实现细节。

当前 demo 中，这一层落在研究面板的 **UIRR 材料构建层**：

- 显示全文清洗/分段后的 passage 数量；
- 显示章节 / 片段 reading index，让读者按目录进入文本，而不是只靠上一段 / 下一段；
- 显示候选 carrier 扫描结果和读者/研究者标记数；候选层应覆盖物件、动作、话语、场景和感官图像，而不是每本书只给一个“隐喻”；
- 显示 carrier type：物件型、动作型、话语型、场景/仪式型、感官/图像型；
- 显示 type-specific decomposition cue：不同 carrier type 对应不同 evidence cue 和 replacement 设计；
- 汇总 mapping relations、direct evidence、replacement probes 和 preserved / weakened / emergent / broken 后果；
- 检查 packet 是否缺少 carrier type、evidence binding、diagnostic replacement 或 provenance separation；
- 显示 packet construction method 和 validation status；
- 允许研究者把当前 packet 标记为 researcher curated、expert checked、pilot ready 或 study ready；
- 支持导出当前 UIRR packet JSON，用于后续材料校准和 study 记录。

当前 demo 已经部分实现了这条路线：`carrierTypes`、curated UIRR packets、packet status、source separation、replacement consequence cards 和 reader-facing scaffold 都已存在。下一步应重点完善研究者侧 authoring engine：

```text
type labels
  -> type-specific checklist
  -> automatic consistency checks
  -> researcher validation workflow
```

这个优化方向比“让 LLM 自动给出正确文学解释”更稳，也更符合 CHI 对 mixed-initiative system、provenance 和 human judgment 的期待。

## 核心设计主张

Replacement-based probing 可以把文学隐喻/象征解释从一个完成态答案，转化为一个低负担、读者可控制的阅读动作。

默认 workflow 不应该先展示 dense mapping table，但也不应只是一个功能削弱的轻量 demo。更合理的是一条逐步展开的读者工作流：

```text
读一小段文本
  -> 注意一个具体 carrier
  -> 尝试替换
  -> 观察意义如何保留、变弱、新增或断裂
  -> 展开证据和意义关系
  -> 写出 reader-authored interpretation
```

## Source Separation

MeaningForge 必须把四类来源视觉上区分开：

- **原文证据**：文本中的词语、物件、动作、场景细节。
- **整理过的文学材料**：研究者/文学训练者准备的 UIRR packet、candidate carriers、replacement probes、boundary notes。
- **读者动作**：读者选择 carrier、选择 replacement、确认、修改、拒绝或标记不确定。
- **模型辅助试探**：模型基于当前材料进行候选整理、措辞和轻量 scaffolding。

这个区分是为了避免 LLM 输出被看作 authoritative annotation。

## Draft Design Goals

这些 design goals 需要在 Reader Formative Study 后根据真实 findings 调整：

DG1. 在抽象解释之前先显化 concrete carrier。

DG2. 把 replacement probing 设计成小而可逆的 close-reading action。

DG2a. 每个 replacement 都必须带有探针类型和风险标签，例如近邻替换、边界测试、读者自定。远替换不能伪装成普通建议，而应明确说明它用于观察意义关系在哪里断裂。

DG3. 通过 preserved / weakened / emergent / broken relations 展示意义后果。

DG4. 通过 confirm / revise / reject / uncertain 保留 reader agency。

DG5. 通过 progressive disclosure 降低认知负担，把 mapping table 作为 optional deeper mode。

DG6. 通过区分 text evidence、curated substrate、reader action 和 model-assisted probes，避免 LLM authority。

DG7. 对 imported / unvalidated text 默认显示“未校准文本”提示。导入文本的候选和替换只作为待校验试探，不作为论文中证明系统文学有效性的主要材料。

## 界面层级

### Layer A: Reader Workspace

默认读者体验是一条连续阅读路径，而不是单案例 walkthrough，也不是彼此割裂的轻量阅读/解释打磨两个模式。读者先在原文中阅读，再临时打开某个 carrier 的 Meaning Lens；Lens 用完后应回到原文继续读。

关键交互粒度不是 single-carrier analyzer，而是 **passage-level interpretive map with an active focal carrier**。读者在一段文本中看到多个可追踪线索，临时聚焦其中一个进行 replacement probing；替换结果再回到整段意义地图，而不是停留在孤立词语解释。

核心元素：

- continuous reading surface；
- passage-level trace map；
- active focal carrier；
- replacement choices with probe type / risk labels；
- consequence cards；
- evidence and relation expansion；
- reader-authored interpretation draft。

因此，原型中的“点亮原文 / 看见载体 / 试换意象 / 观察变化 / 收束解释”只应作为临时 Lens 内部的 micro-flow，而不是 MeaningForge 的整体产品结构。

### Layer B: Research Inspector

研究者和实验员后台检查层，不是另一套阅读系统，也不是第三个参与者模式。它叠加在同一个 Reader Workspace 上，用于 material builder、study condition、logs、metrics 和 UIRR packet status。

Research Inspector 有两个使用时机：

1. **Study 前 / 后**：研究者使用它构建、检查、校准、导出 UIRR packets。
2. **Study 中**：只有实验员自己的后台屏幕可以打开它，用于 condition、logs、metrics 和导出；参与者屏幕必须隐藏它。

如果同一台屏幕给参与者看，必须使用 `/`，不要打开 `/#researcher`。否则 Type-specific Checklist、Evidence Gap、Packet Readiness 等研究者信息会增加认知负担，并污染 MeaningForge reader-facing condition。

核心元素：

- UIRR material builder；
- study conditions；
- interaction logs；
- exported structured metrics；
- provenance metadata。

因此 demo 实现中应区分：

```text
Participant display:
  Full Reader Workspace, without Research Inspector

Researcher console:
  Same Reader Workspace + collapsible Research Inspector + logs / metrics / packet status
```

## 数据结构

当前系统结构包括：

- `CandidateCarrier`：候选 carrier，包括 span、carrierTypes、evidence excerpt、detection method、theory trace、confidence、salience、replaceability。
- `LiteraryMapping`：选中的 carrier、carrierTypes、literal scene、broader meaning hypotheses、mapping relations、evidence、alternative interpretations、replacements、provenance、study hooks。
- `analysisProvenance.packetProtocol`：packet construction method、validation status、validation note 和 required checks。
- `MappingRelation`：carrier properties/actions 与 broader meanings 之间的关系，并链接 evidence。
- `LiteraryEvidence`：textual、cultural 或 critical evidence，并记录 source role 和 groundedness。
- `ReplacementAnalysis`：alternative carrier 及其比较结果。
- `ReplacementComparison`：preserved、weakened、emergent、broken mapping effects 和 diagnostic questions。

下一版 authoring engine 可增加：

- `DecompositionChecklist`：按 carrier type 列出必须检查的 relation 和 evidence cue。
- `ConsistencyCheckResult`：记录 evidence gap、generic-symbol fallback、replacement diagnosticity 和 provenance risk。
- `ValidationRecord`：记录 researcher curation、expert quick check、pilot adjustment 和 packet status change。

建议 V2 数据对象：

```ts
DecompositionChecklist {
  carrierId
  carrierTypes
  items: ChecklistItem[]
}

ChecklistItem {
  id
  type
  prompt
  status: "complete" | "weak" | "missing" | "not_applicable"
  linkedRelationIds
  linkedEvidenceIds
}

ConsistencyCheckResult {
  packetId
  severity: "info" | "warning" | "blocking"
  checkType:
    | "carrier_observability"
    | "type_coverage"
    | "relation_specificity"
    | "evidence_binding"
    | "replacement_diagnosticity"
    | "consequence_coverage"
    | "provenance_separation"
    | "status_gating"
  message
  suggestedResearcherAction
}

ProbeTemplate {
  carrierType
  templateType
  diagnosticPurpose
  riskLevel
  targetRelationType
}

PacketReadiness {
  packetId
  status:
    | "exploration_only"
    | "needs_researcher_revision"
    | "ready_for_expert_check"
    | "pilot_ready_candidate"
  reasons
}
```

这些对象应保留在 Research Tools，不进入普通读者主流程。读者只看到它们整理后的低负担结果：carrier type cue、replacement probe、P/W/E/B consequence 和 evidence peek。

## Formative Study 关系

正式 formative study 应该是 Reader Formative Study：

- 目标读者揭示阅读哪里困难；
- replacement probing 是否自然；
- 哪种 UI 降低负担；
- LLM 输出怎样才不像权威答案。

Curated Passage Packet Validation 是材料校准层：

- 文学训练者检查 UIRR packets、carrier choices、replacement probes、consequence cards 和 interpretive boundaries；
- 它不是第二个 formative study；
- 它不定义用户需求。

## User Study 关系

后续 summative user study 应主要招募目标读者。专家只做材料校准和最终 artifact blind rating。

可能条件：

- plain explanation；
- structured mapping dashboard；
- MeaningForge Meaning Lens。

可能 measures：

- cognitive load；
- perceived clarity；
- perceived AI authority；
- interpretive agency；
- carrier-to-meaning relation explanation；
- preserved / weakened / emergent / broken meaning identification；
- final interpretation quality；
- evidence inspection and revision behavior。

## Demo Boundary

这些 rationale 不应该作为 app 内参与者可见面板出现。它属于研究者材料、论文写作 notes、study briefing 或 appendix。

同理，Research Inspector 不应出现在参与者任务屏幕中。它可以作为实验员后台或 study preparation 工具存在，但不能作为 MeaningForge reader-facing condition 的一部分，除非研究问题明确评估 researcher dashboard。
