# MeaningForge — CHI 2027 完整研究 Idea（平衡文献边界版）

**Working title**  
**MeaningForge: An Interactive Whole-Text Figurative-Meaning Scaffold for Evidence-Grounded Close Reading**

**中文工作标题**  
**MeaningForge：面向证据驱动文学精读的全文隐喻/修辞意义骨架**

**版本定位**：在系统性/对抗式 nearest-neighbor 文献调研后，对原始“隐喻网络”设想重新做 HCI 问题定义。该版本既不采取“只要某个模块有人用过就不能再用”的专利式 novelty 判断，也不把已有理论、算法或交互原语当作可以无限制复用的公共零件；而是以 **已有工作的完整 contribution claim 覆盖到哪一层** 为边界。

---

## 0. Executive Summary：最终建议押注的 Idea

MeaningForge 不应以“自动识别隐喻”“文学知识图谱”“让 LLM 解读名著”或“replacement 工具”作为核心贡献。

更合理的 HCI 主线是：

> **MeaningForge 研究一种由隐喻理论、传统文本分析方法和可追溯文学资料构建的“全文隐喻/修辞意义骨架”，如何通过可探索、可比较、可质疑和可操作的交互，帮助 novice-to-intermediate readers 从分散的文本证据出发，形成更有文本依据的文学精读 reasoning，而不是只接收一段解释结论。**

英文 reviewer-facing 版本：

> **MeaningForge investigates how an interactive, theory-guided whole-text figurative-meaning scaffold can help novice readers trace, explore, and actively test how distributed textual evidence and figurative relations support literary interpretations.**

这篇论文真正要研究的不是：

```text
Can AI produce a good literary interpretation?
```

而是：

```text
Can a structured interactive substrate help readers
reason from the text themselves?
```

更完整地说：

```text
Difficult literary / figurative reading
        ↓
meaning is distributed across concrete words, images,
actions, repetitions, contrasts and contexts
        ↓
existing support often appears as
linear text / annotation / expert explanation / AI answer
        ↓
reader may obtain an interpretation
without seeing or actively working through
its whole-text relational structure
        ↓
HCI design opportunity:
externalize that structure as an interactive scaffold
        ↓
reader explores / traces / compares / challenges / tests
        ↓
reader authors an evidence-grounded interpretation
        ↓
empirical question:
does this change close-reading reasoning,
not merely final-answer quality?
```

**网络是核心 artifact，但“用了网络”不是 novelty。**  
**MIP/MIPVU、MetaNet/FrameNet、传统 NLP 是核心 substrate，但不是 HCI contribution claim。**  
**LLM 不是研究对象；automatic construction 阶段可以使用 traditional NLP / LLM-assisted semantic execution，但生成 reference scaffold 后的 reader-facing reasoning phase 不需要 live LLM 才能成立。**

### 0.0.1 Substrate protocol 与执行者分离

MeaningForge 必须固定：

```text
ontology
relation taxonomy
MIP/MIPVU-informed record
carrier inclusion criteria
thread construction criteria
provenance rules
schema / validation rules
```

然后执行这些规则的主体可以是：

```text
deterministic code
traditional NLP
LLM
human researcher
```

LLM 的使用不改变 MeaningForge 的研究问题，也不把 substrate construction 变成新的 agent/LLM contribution。

### 0.0.2 Implementation boundary：自动构建是 substrate，不是 HCI contribution

Implementation-wise, MeaningForge may automatically construct an internal unified narrative representation from traceable text structure, narrative entities/events, and multiple figurative signals, and then apply a predefined meaning-relevance projection to generate the reader-facing reference scaffold. The construction pipeline may combine deterministic processing, traditional NLP, fixed theoretical procedures, and LLM-assisted semantic execution. **This computational construction is substrate, not the HCI contribution, and it should not be described as the system automatically understanding literary meaning.**

## 0.1 核心 artifact：系统初稿与读者修订共同构成的全文骨架

这里的“全文隐喻/修辞意义骨架”不是后台不可见的候选索引，也不是一张把所有人物、事件和物件都堆进去的故事图。它是系统从作品全文自动构建、或在 controlled study 中加载已冻结版本的一份**可编辑、可追溯、可质疑的 reference draft**。这份 draft 按 MeaningForge 预先固定的 substrate protocol 构建；执行这些标注、核查与结构化步骤的人可以是研究者，也可以由 LLM 代执行，但规则、ontology 与输出 schema 不由 LLM 自由定义：

```text
全文
→ 理论/规则支持的 figurative features 与 carriers
→ 跨段 evidence 与 narrative context relations
→ 带 provenance 的默认节点、边与局部 interpretation paths
→ 读者保留 / 质疑 / 删除个人层中的边 / 改写 / 新增节点与关系
→ 读者自己的 evidence-grounded reading
```

因此，系统不是把骨架“交给”读者后要求其接受，而是让读者和一份可检查的默认骨架共同工作。

需要严格区分三种对象：

- **narrative backbone（叙事底座）**：人物、事件、场景、话语、物件及其时间/因果关系；它为全文骨架提供语境。
- **figurative-meaning skeleton（全文隐喻/修辞意义骨架）**：从 figurative features / carriers 出发，组织跨段证据和可质疑关系；这是读者面对的核心 artifact。
- **reader-authored layer（读者层）**：读者新增、保留、拒绝、改写的节点、边、证据和主张；它不覆盖 reference draft，而是与其并置。

这也意味着，读者不是只能点击系统给出的“关键点”。当系统遗漏一个线索或某条关系不成立时，读者应能从原文添加证据节点、把它接入已有关系、写出不同的关系说明，或保留“尚不确定”。

---

# 1. 为什么重新回到“隐喻/修辞意义骨架”是合理的

最初 MeaningForge 的直觉并没有错：经典文学中较难的部分通常并不是“把故事情节读出来”，而是理解具体语言为什么具有超出字面层面的意义，以及不同文本细节如何在全文范围内共同形成某种解释。

早期 expert–novice 文学阅读研究已经表明，专家与 novice 在构造诗歌意义时使用的解释策略不同；novice 的困难会影响其把文本组织为连贯意义的能力。近年来 KRISTEVA 又从计算任务角度把 close reading 明确描述为“从 textual details 形成 evidence-based arguments”，并将 feature extraction、context retrieval 和 multi-hop reasoning 作为不同难度层级的 interpretive reasoning task。

因此，以下问题不是需要 MeaningForge “首次发现”的：

- 文学/诗歌很难理解；
- novice 与 expert 的阅读策略不同；
- close reading 需要文本证据；
- metaphor identification 是困难任务；
- 可视化能够展示文本结构。

MeaningForge 需要做的是一个 **新的 HCI system formulation**：

> 当文学意义由全文中分散的 metaphor-related features、重复、对照、行为、场景和上下文关系共同形成时，怎样把这些关系组织成一个 novice 可以主动操作的 reading substrate，而不是把它压缩成一个专家答案或 LLM 段落？

这比“读者识别不了隐喻，因此系统替他识别”更合理，也比后来完全转向 generic reconsideration 更贴近 MeaningForge 最初要做的事情。

---

# 2. HCI Novelty 应该怎样判断：既不过严，也不过松

CHI 2026 官方对 artifact/technique contribution 的表述明确允许新工作 **build on、reframe 或 critique 已有 HCI artifacts/techniques**。CHI 评审同时要求 contribution 相对于已有工作是 original，并且真正给 HCI community 带来新增知识。

因此，本项目采用下面的 novelty 判断法。

## 2.1 五轴重合模型

对于任意 nearest-neighbor paper，不问：

> “它有没有用 graph？”

而问五件事：

1. **Target user 是否相同？**  
   novice/intermediate literary readers，还是专家、写作者、研究者、LLM？

2. **Human problem/task 是否相同？**  
   是 close-reading figurative meaning construction，还是写作、概念检索、character analysis、scholarly QA？

3. **Core representation 是否相同？**  
   是全文 figurative-meaning scaffold，还是 expert think-aloud、metadata、sonic pattern、general KG、claim–evidence map？

4. **Core interaction 是否相同？**  
   reader 是否需要 trace / manipulate / compare / challenge figurative meaning relations，还是主要 browse / receive / annotate？

5. **Empirical claim 是否相同？**  
   是否都在 claim “改善 evidence-grounded close-reading reasoning / transfer”，还是 comprehension、navigation、model accuracy、trust、creative exploration？

### 判定原则

- **1–2 轴重合：Building block。** 可大胆复用，但不 claim 该模块本身创新。
- **3 轴重合：Strong neighbor。** Related Work 中必须正面比较，系统设计需要有清楚 differentiation。
- **4–5 轴高度重合：Direct novelty threat。** 若交互和 evaluation 也重合，应 pivot 或缩窄 claim。

这比“一个组件有人做过就不能用”更符合 CHI，也比“只要整体没一模一样就什么都能 claim”更安全。

---

# 3. 对抗式文献审查：哪些工作真的覆盖到了哪里

## 3.1 Soliloquy — CHI 2023

**Risha et al. — Soliloquy: Fostering Poetry Comprehension Using an Interactive Think-aloud Visualization.**

Soliloquy 直接面向 novice poetry readers，将专家阅读和解释诗歌时的 thoughts 通过文本动画和 pop-up explanation 可视化。它与 MeaningForge 在 **用户群、文学理解任务、教育性 HCI 目标** 上重合度很高。

### 已明确覆盖

- novice poetry comprehension；
- 将 expert interpretive cognition 外化；
- 用 interface 支持文学理解；
- 评估 interface 对 comprehension 的影响。

### 因此 MeaningForge 不应 claim

- “首次用交互界面帮助 novice 做文学理解”；
- “首次让不可见的 close-reading process 可视化”。

### 尚未覆盖 MeaningForge 的核心链

Soliloquy 的主要 interaction 是 **跟随/观看 expert thought trace**。MeaningForge 计划让 reader 面对一个由文本与理论构成的 whole-text substrate，主动追踪、比较、删除/拒绝、重新连接和测试意义关系，再写自己的 interpretation。

**Novelty risk：High neighbor，但不是 direct collision。**

---

## 3.2 Metatation — TOCHI 2017

Metatation 研究 literary critics 的 close-reading annotations，将纸笔自由标注作为 implicit queries，为当前思考提供 relevant supplemental information，并 bridge close and distant reading。

### 已明确覆盖

- close reading 的计算支持；
- annotation-driven interaction；
- context-specific supplemental information；
- 文学专家 workflow。

### MeaningForge 的边界

MeaningForge 不能把“close reading + annotation + context retrieval”当创新。  
但它的主要用户是 novice/intermediate readers，核心对象是 **figurative structure本身**，而不是从 annotation 推断 critic 的信息需求。

**Novelty risk：Medium–High neighbor。**

---

## 3.3 Poemage — IEEE TVCG 2016

Poemage 将诗歌的 sonic topology 可视化，以支持对 rhyme、phonetic pattern 等结构的 close reading。

### 已覆盖

- 文学形式结构的 interactive visualization；
- 通过 computational pattern 支持 close reading。

### MeaningForge 的边界

所以不能说“过去文学结构不可视化”。MeaningForge 的独特性必须来自：

> 从 metaphor/figurative carrier 出发，把跨全文的 textual evidence 与 interpretive meaning 组织为 reader-manipulable scaffold。

**Novelty risk：Building block / medium neighbor。**

---

## 3.4 Interacting with Literary Style — CHI 2020

Sterman et al. 用 computational representation 帮助用户 surface 和 explore literary style，并研究 visualization/browsing/editing 的应用。

### 已覆盖

- nuanced literary quality 可以通过 computation 外化；
- 用户可以通过 interactive representation 反思文学 style；
- “原本难以 articulate 的文学判断”并不是 MeaningForge 首次提出的现象。

### MeaningForge 的边界

MeaningForge 不研究 style similarity/representation，而研究 metaphor-centered whole-text meaning structure 以及 reader 如何从 evidence 到 interpretation。

**Novelty risk：Medium neighbor。**

---

## 3.5 Portrayal — DIS 2023

Portrayal 从 fiction 中抽取 characterization indicators，并通过 visual analytics 支持 character analysis。

### 已覆盖

- NLP + literary text + interactive visualization；
- computationally surfaced evidence 支持文学分析。

### MeaningForge 的边界

如果 MeaningForge 最后只是“把 NLP 抽到的 feature 画出来”，它会落入已有 visualization family。MeaningForge 必须有 distinct interaction：**用 whole-text figurative scaffold 做 evidence-grounded interpretation construction/testing。**

**Novelty risk：Medium neighbor。**

---

## 3.6 Clover Connections / Visualising Character Dynamics for Non-Experts — 2023/2024

该工作面向 non-experts，通过 glyphs、storylines 和 arcs 可视化小说人物的 temporal、social、personal dynamics。

### 意义

它进一步说明：

> “non-expert + novel + whole-text visualization”本身不能作为 novelty。

但其 task 是 character-dynamics analysis，而不是 figurative meaning reasoning。

**Novelty risk：Building block / medium。**

---

## 3.7 ConceptScope — CHI 2021

ConceptScope 用 domain ontology 组织文档中的 conceptual relationships，并通过 Bubble Treemap 进行 visualization。

### 已覆盖

- ontology-guided document structure；
- whole-document knowledge organization；
- interactive conceptual overview。

### MeaningForge 的边界

所以“domain ontology + document graph/overview”不是新点。MeaningForge 若使用 ontology，需要把创新放在 **literary task-specific representation and interaction** 上。

**Novelty risk：Building block。**

---

## 3.8 Scholastic — UIST 2022

Scholastic 是 graphical human–AI collaboration system，支持 inductive / interpretive qualitative text analysis。

### 已覆盖

- graphical human-AI interpretive text analysis；
- human coding + machine assistance + visual analytics。

### MeaningForge 的边界

不能 claim “首次 graphical human-AI interpretive text analysis”。

MeaningForge 的任务是 passage/whole-text literary close reading for learners，而非 researcher-driven qualitative coding。

**Novelty risk：Medium–High neighbor。**

---

## 3.9 TSI — NAACL 2024

**Tian, Xu & Mao — Theory Guided Scaffolding Instruction Framework for LLM-Enabled Metaphor Reasoning.**

这是对 MeaningForge backend 最重要的边界工作之一。TSI 建立 metaphor-theory-grounded knowledge graph，将其作为 instructional structure，生成 scaffolding questions，引导 **LLM** 逐步完成 metaphor detection/reasoning。

### 已明确覆盖

- metaphor theory + KG；
- theory-guided scaffolding；
- metaphor reasoning 的 structured process；
- graph 作为 instruction structure。

### 因此 MeaningForge 绝对不能 claim

- “首次用隐喻理论构建 metaphor KG”；
- “首次用 metaphor KG 做 scaffolding”；
- “首次把隐喻 reasoning 拆成逐步结构”。

### 但它并未覆盖

- human novice literary readers；
- whole literary text interaction；
- reader manipulation of the scaffold；
- evidence-grounded close-reading artifact；
- human reasoning/transfer evaluation。

因此 TSI 是 **backend theory/algorithm-level strong overlap**，但不是同一个 HCI contribution。

**Novelty risk：High on computational substrate；Medium on HCI contribution。**

---

## 3.10 MIP / MIPVU 与 MetaNet

MIPVU 是 word-use level 的 systematic metaphor identification method。MetaNet 则将 frames 与 metaphor repository / metaphor analysis 结合。

### 它们覆盖的是

- metaphor-related lexical unit 的 identification；
- conceptual metaphor / frame resources；
- metaphor computational representation。

### 它们没有自动解决

- 一个文学 metaphor 在某篇作品中的最终 literary interpretation；
- reader 如何交互地理解它；
- 多个文本 evidence 怎样变成自己的 close-reading argument。

因此它们是 MeaningForge 的 **legitimate theoretical/computational substrate**，不是 novelty threat。

但要避免技术夸张：

> MIP/MIPVU 可以帮助确定 metaphor-related lexical usage，不等于自动生成“社会麻木”“革命牺牲”“现代性”等高层 literary meaning。

---

## 3.11 KRISTEVA — ACL 2025

KRISTEVA 将 close reading benchmark 分为 stylistic feature extraction、context retrieval 和 multi-hop reasoning 等任务，用来评估 LLM interpretive reasoning。

### 已覆盖

- close reading 可以拆为 intermediate reasoning operations；
- evidence-based literary reasoning 可以操作化。

### MeaningForge 的边界

不能 claim “首次发现 close reading 是多步 reasoning”。

但 KRISTEVA 是 **model benchmark**，不是 reader-facing interactive system。它反而可以为 MeaningForge 的 task decomposition 和 evaluation rubric 提供依据。

**Novelty risk：Building block。**

---

## 3.12 What Does AI Do for Cultural Interpretation? — CHI 2026

该工作通过 preregistered randomized experiment（N=400）研究单个/多个 AI interpretations 对 poetry close reading 的影响。结果表明 AI interpretation exposure 能提高 close-reading performance；高依赖 AI 与 pleasure 存在 trade-off。

### 它明确占领的 claim

MeaningForge 不能 claim：

> “我们首次证明 AI interpretation 能帮助普通读者理解文学。”

### 它没有回答 MeaningForge 的问题

它研究的是 **exposure to AI interpretation**。MeaningForge 想研究：

> 如果不只是给答案，而是把全文 figurative structure 作为 interactive scaffold，让 reader 自己 trace/manipulate evidence relations，会不会改变 reasoning behavior，甚至在拿走系统后仍能 transfer？

**Novelty risk：High on problem domain/outcome；low on representation/interaction。**

---

## 3.13 PoemPalette — CHI 2026

PoemPalette 利用 generative AI，帮助 poetry enthusiasts 构建和探索 poem–painting ideorealm alignment，强调 creative exploration 与 foundational understanding。

这是非常需要正面对比的新近 CHI 工作，因为它已经：

- 面向 poetry enthusiasts / novices；
- 目标包含 poetry understanding；
- 使用 interactive AI system；
- 尝试让抽象 poetic meaning 变得可探索。

### MeaningForge 如果变成以下样子会危险

```text
AI analyzes poem
→ generates visual semantic space
→ user browses meaning
```

这会越来越接近 PoemPalette 的 HCI territory。

### MeaningForge 必须保持的区别

- primary domain 不限定诗画 alignment；
- whole-text textual structure，而非 cross-modal ideorealm；
- skeleton 主要由 traditional/theory-guided pipeline + curated evidence 构建；
- reader 操作的是 metaphor/evidence relations；
- primary outcome 是 evidence-grounded close-reading reasoning / transfer，不只是 understanding/creative exploration。

**Novelty risk：High neighbor。**

---

## 3.14 Graphilosophy — 2026 preprint

Graphilosophy 是当前对“经典文本 + interpretive KG + non-expert interface”最直接的警告。它构建 ontology-guided multi-layer knowledge graph，对《四书》的 linguistic、conceptual 和 interpretive relationships 进行表示，并让 non-expert users 追踪概念演化；其 preliminary study 指向 conceptual understanding 和 cross-cultural learning。

### 它已经明确覆盖

- classical text；
- ontology-guided multi-layer KG；
- interpretive relationships；
- non-expert interactive interface；
- plurality / nuance；
- conceptual understanding。

### 这意味着 MeaningForge 不能 claim

- “首次把经典文本做成 multilayer interpretive KG”；
- “首次让非专家浏览文学/人文 interpretive network”。

### MeaningForge 必须与之拉开的 HCI 主线

Graphilosophy 的核心使用更接近：

```text
concept representation
→ cross-lingual / conceptual navigation
→ understanding concepts
```

MeaningForge 应该坚持：

```text
literary close-reading task
→ metaphor-centered whole-text scaffold
→ reader actively traces and manipulates textual evidence relations
→ authors interpretation
→ reasoning / verification / transfer evaluation
```

如果 MeaningForge 最后只是 browse 一个 multilayer graph，则 novelty 风险极高。

**Novelty risk：Highest representation-level neighbor。**

---

## 3.15 PaperTrail — CHI 2026

PaperTrail 将 LLM scholarly answers 和 source documents 拆成 discrete claims 与 evidence，并建立 mapping，帮助用户检查 provenance/support。

### 已覆盖

- claim–evidence decomposition；
- evidence mapping；
- provenance-oriented interactive verification。

### MeaningForge 的边界

所以不能把“把 claim 与 evidence 连起来”本身当 novelty。

文学解释与 scholarly QA 的区别在于：文本 evidence 通常不是 factual entailment。MeaningForge 必须支持：

- metaphor/formal features；
- interpretive relation；
- multiple plausible readings；
- counterevidence / ambiguity；
- reader-authored meaning。

**Novelty risk：Medium neighbor；重要 interaction reference。**

---

## 3.16 Chasing Meaning and/or Insight? — CHI 2026

该 survey 分析 171 篇 visualization × humanities design studies，指出 humanities visualization evaluation 在 analytical “insight” 与 interpretive “meaning” 之间存在 tension，并倡导更适合 humanities 的多证据/triangulated evaluation。

这不是 novelty threat，而是 MeaningForge evaluation 需要认真吸收的方法学工作。

---

# 4. 文献审查后的真正研究空位

调研后的结论不是：

> “没人做过文学可视化。” —— 错。

也不是：

> “没人做过 metaphor KG。” —— 错。

也不是：

> “没人用 AI 帮人理解诗歌。” —— 错。

也不是：

> “没人让 non-expert 浏览 interpretive KG。” —— Graphilosophy 已经非常接近。

目前仍然值得研究、而且没有在上述 nearest neighbors 中被完整覆盖的是以下 **interaction configuration**：

> **把由传统隐喻理论与文本分析方法构建的全文 figurative structure，作为 novice literary reader 的可操作 reading substrate；reader 不是只浏览它，也不是跟随专家答案，而是通过 trace、compare、challenge、compose，以及可能的 replacement/counterfactual probes，主动检查“这些文本关系如何支撑某种解释”，最终形成自己的 evidence-grounded close reading。**

尤其重要的是最后一项 empirical claim：

> **研究这种 interaction 是否改变读者的 close-reading reasoning，并在系统被拿掉后表现出 transfer，而不仅是当场交出更好的答案。**

在本轮 nearest-neighbor review 中，没有发现一个 archival HCI system 同时高度覆盖以下五项：

1. novice literary readers；
2. whole-text metaphor/figurative scaffold；
3. theory-guided / non-LLM core substrate；
4. reader manipulation of textual–figurative relations；
5. reasoning + unassisted transfer evaluation。

这是目前最合理的 novelty position。它是 **underexplored configuration**，不是“从未有人碰过任何组件”。

---

# 5. Core Research Problem

## 5.1 Problem statement

> **Literary interpretations are increasingly easy to obtain, but the distributed textual structure from which figurative meanings are constructed remains difficult for novice readers to inspect and actively reason with.**

中文：

> **文学解释结论越来越容易获得，但对 novice readers 来说，隐喻/修辞意义是怎样由全文中分散的语言、动作、意象、重复、对照与上下文关系共同形成的，仍然不容易被整体看见和主动操作。**

这里需要特别强调：这仍然是一个 **candidate HCI problem**。它需要通过 formative study 具体化成真实的 user difficulty 和 design requirements，而不能直接写成已验证 finding。

---

# 6. 研究对象：不是“所有隐喻”，而是 Metaphor-Centered Figurative Structure

为了避免 scope 爆炸，不建议把“隐喻”泛化成所有 symbolism/imagery/irony。

## 6.1 Core computational anchor

正式 backend 的核心 anchor 是：

> **metaphor-related lexical units / phrases**

使用 MIP/MIPVU-inspired annotation 或经验证的 computational detector 获得。

## 6.2 Supplementary evidence

解释一个 metaphor 必须允许连接到非-metaphor evidence，例如：

- repeated expressions；
- actions/events；
- speaker/dialogue；
- character relations；
- contrasts；
- later consequences；
- scene/ritual structure；
- culturally relevant frames；
- published scholarly commentary。

因此 MeaningForge 的 network 是 **metaphor-centered**, 但不是“所有节点都必须是 metaphor”。

这比定义一个巨大的“所有 literary meaning carrier taxonomy”更可控。

---

# 7. 整体 HCI 思维链

```text
Domain observation
经典文学中的 figurative meaning 高密度、跨文本分布
        ↓
Prior evidence
novice 与 expert 的意义构造策略不同；
close reading 依赖 textual details / evidence-based reasoning
        ↓
Current support landscape
annotation / visualization / expert think-aloud /
AI interpretation / KG / metaphor NLP
        ↓
Remaining design issue
结构虽然能被计算、解释也能被生成，
但怎样把“全文隐喻意义结构”设计成
novice 可以主动 reasoning-with 的交互对象仍不清楚
        ↓
Formative study
观察 novice 的自然 close-reading process
找出 local metaphor → whole-text meaning 之间真实困难
以及用户如何使用 explanation/structure
        ↓
Design requirements
决定 overview、trace、source、compare、challenge、replacement
哪些是真正需要的
        ↓
MeaningForge
interactive whole-text figurative scaffold
        ↓
Controlled user study
same interpretive information,
linear explanation vs interactive scaffold
        ↓
Primary outcome
Evidence-grounded close-reading reasoning
        ↓
Transfer
拿走系统后，reader 是否更会独立 reason from text
```

---

# 8. Research Questions

## RQ-F：Formative

### RQ-F1 — Reading process
novice-to-intermediate readers 在面对较难 figurative literary passages 时，怎样从具体语言现象走向整体 interpretation？

### RQ-F2 — Breakdown
他们的困难主要出现在哪里：

- noticing metaphor-related features；
-理解 local metaphor；
- connecting distributed evidence；
- moving from local meaning to whole-text interpretation；
- integrating context；
- distinguishing textual evidence from learned/canonical explanation；
- handling ambiguity / alternative readings？

### RQ-F3 — Current support
他们使用 annotation、搜索、导读或 ChatGPT 时，什么被解决了，什么仍然困难？

### RQ-F4 — Representation & interaction
whole-text scaffold 的哪些形式和 interaction 真正有帮助，哪些造成 cognitive overload 或 answer steering？

---

## RQ-S：System / Controlled Study

### RQ-S1 — Reasoning
与包含相同 information 的 linear/prose explanation 相比，MeaningForge 是否支持更有文本依据的 close-reading reasoning？

### RQ-S2 — Structural understanding
MeaningForge 是否帮助 readers 更好地连接跨段落 metaphor-related evidence，而不是只依赖局部/最近文本？

### RQ-S3 — Critical inspection
MeaningForge 是否帮助 readers 发现一个 plausible interpretation 中弱、过度或缺乏证据的 relation？

### RQ-S4 — Transfer
使用 MeaningForge 后，reader 在没有系统辅助的新文本上是否表现出更好的 evidence-grounded close-reading reasoning？

### RQ-S5 — Interaction trade-offs
这种 scaffold 带来的 cognitive load、reading disruption、authority perception 和 enjoyment trade-offs 是什么？

---

# 9. Formative Study：先发现设计需求，而不是验证预制系统

## 9.1 Participants

主 formative：**9–12 名 novice-to-intermediate target readers**。

优先招募：

- 本科生；
- 有 general education / humanities / literature reading experience；
- 做过 evidence-based reading response / essay / discussion；
- 不要求文学专业。

另外：

- 1–2 名 literature-trained validators：只校准材料和 reference interpretations；
- 2–3 名 target-user material pilots：正式 formative 前校准难度。

人数不以“formative 必须 3–5 人”机械决定，而以需要观察多种 reasoning pattern、材料数量和 saturation 为准。

---

## 9.2 Materials

使用 2–3 个 **中等难度、低熟悉度** 的文学材料。

Ideal difficulty：

```text
literal comprehension: low–medium difficulty
figurative interpretation: medium difficulty
whole-text integration: medium–high difficulty
```

避免：

- 大量古典语言理解成为主要障碍；
- participant 已学过标准答案；
- 某个单一象征反复出现到 relation 一眼可见；
- 文本太长，以至于 study 变成 memory test。

每个材料先用 2–3 个 target users 做 calibration。

---

## 9.3 Phase A — Natural Close Reading

不给 MeaningForge、不给 graph、不给 MIP 标签。

任务：

> 阅读材料，然后用自己的话说明你觉得文本中哪些表达/细节很重要，它们可能意味着什么，以及哪些地方支撑你的理解。

支持：

- 普通高亮；
- 简单 note；
- light think-aloud（自然想到可以说，不要求持续说）。

收集：

- highlighted spans；
- written interpretation；
- reading sequence；
- optional notes；
- screen/audio recording；
- moderator notes。

目的：观察真实 reasoning，而不是诱导用户按研究者的 graph 思考。

---

## 9.4 Phase B — Retrospective Reasoning Reconstruction

完成自然任务后，再回顾：

```text
你为什么注意到这个表达？
↓
这里首先让你想到什么？
↓
还有别的文本位置让你这样理解吗？
↓
这些位置之间是什么关系？
↓
为什么这些细节足以支持你的 interpretation？
↓
如果有人不同意，你觉得哪一部分最值得争论？
```

研究者将 episode 编码成可能的 reasoning gap。

候选 coding seed（不是预设 finding）：

- Feature Noticing Gap；
- Local Metaphor Interpretation Gap；
- Cross-Span Connection Gap；
- Evidence Integration Gap；
- Context Grounding Gap；
- Abstraction Jump；
- Alternative/Boundary Gap；
- Authority/Canonical-Answer Dependence。

---

## 9.5 Phase C — Low-Fi Design Probes

这时才展示候选 representation，不直接给完整 MeaningForge。

对同一份 interpretive information，测试例如：

### Probe A — Linear explanation
传统导读式 paragraph。

### Probe B — Evidence list
interpretation + supporting passages。

### Probe C — Layered relation path
把 evidence / feature、interpretive bridge 与 broader reading 显式连成局部路径，同时显示 alternative 与 counter / limit。

### Probe D — Whole-text skeleton
将同一组 textual features、relations 与 interpretive possibilities 组织成系统默认的全文概览骨架。它明确是可质疑的 reference draft，而不是标准答案。

### Interaction probes — Manipulate the default skeleton
在四种静态呈现之后，参与者可以判断、隐藏/拒绝、改写 relation，加入 evidence，比较 alternative，并指出系统默认骨架遗漏或应修改的节点和连接。

### Probe E — Replacement / counterfactual（仅适合的 carrier）

例如：

> 如果把这个 metaphorical expression 换成一个更 literal 或 near-neighbor 表达，哪些关系会保留、变弱或消失？

关键：**replacement 是 candidate interaction，不是预先假定的 user need。**

---

## 9.6 Formative 输出

Formative 应该产出：

1. novice figurative close-reading workflow；
2. breakdown taxonomy；
3. current-tool limitations；
4. design requirements；
5. representation choice；
6. interaction choice；
7. material calibration rules。

---

## 9.7 Go / Redesign / No-Go

### GO

如果发现：

- participants 能获得 broad interpretation，但难以组织 whole-text textual relations；
- evidence 在多个 passage 中分散，用户难以主动组合；
- prose explanation 容易让人“知道答案”，但不一定支持 active inspection；
- whole-text structure 帮助用户找到/组织 evidence；
- user 会主动 reject/edit/compare/**add**，而不是只接受 reference graph；
- 至少一个 active probe 明显帮助 reasoning。

### REDESIGN

如果：

- giant graph cognitive load 很高；
- evidence list 已经足够，network 没有额外价值；
- replacement 被普遍认为 artificial；
- participant 的主要问题其实是 vocabulary/history，而不是 relation reasoning；
- scaffold 变成标准答案展示器。

### NO-GO / Pivot

如果：

- 简单“请指出依据”prompt 就解决核心问题；
- 结构化 representation 对 reasoning 没有明显行为价值；
- 系统价值只能体现在 final answer 分数；
- 完整 graph 只能由大量 bespoke expert tutoring 人工制作，且 HCI interaction 本身贡献很弱。

---

# 10. System Architecture：model-enabled, not model-defined

MeaningForge 的 backend 分四层。

## Layer 1 — Text & Evidence Layer

包含：

- document / chapter / paragraph / sentence；
- exact text span；
- character/entity；
- event/action；
- speaker/dialogue；
- time/location where relevant。

构建方法：传统 segmentation、NER、coreference、dependency/event extraction，以及按固定 protocol 执行的核查/整理。这里允许 LLM 代替人工完成繁琐的语义标注与结构化，但方法定义、relation taxonomy 与输出 schema 由 MeaningForge 固定。

---

## Layer 2 — Metaphor / Figurative Feature Layer

核心：

- MIP/MIPVU-inspired metaphor-related lexical units；
- direct/indirect metaphor candidate；
- source/target frame/domain mapping where defensible；
- recurrence / lexical repetition；
- contrast / parallel construction。

这里的输出是：

> **candidate linguistic/figurative structure**

不是最终文学 interpretation。

---

## Layer 3 — Whole-Text Structural Relation Layer

网络边包括：

```text
appears_in
recurs_with
shares_source_domain
shares_target_frame
contrasts_with
co_occurs_with
performed_by
precedes
references
parallels
counterevidence_to
```

这些 relation 尽量由 deterministic / traditional NLP / validated rules 生成。

---

## Layer 4 — Interpretive Reference Layer

高层 literary meaning 不能伪装成 automatic fact。

这一层存储的是 **reference proposals**，不是 gold-standard interpretation。它们必须建立在前面的 textual / narrative / structural grounding 上，并保持可质疑、可修改。

需要区分两个维度：

1. **method basis**：这条 relation 根据什么规则或证据建立，例如 text、MIP/MIPVU-informed analysis、structural/narrative rule、scholarship；
2. **executor**：谁执行了固定 protocol，例如 deterministic code、LLM、human researcher。

因此，“LLM 执行了某一步”不等于“LLM 是这条文学意义的理论来源”。

所有 high-level interpretive edges 必须保存 provenance / execution metadata，并在 reader-facing scaffold 中保持 qualified。

例如：

```text
TEXT-DERIVED
直接文本证据

THEORY-DERIVED
MIP/MIPVU / frame-informed method basis

STRUCTURAL
recurrence / contrast / consequence / context relation

SCHOLARLY
来源于某篇注释/研究

PROTOCOL-EXECUTED-BY-LLM
LLM 按固定规则完成标注/整理，不代表 literary truth

READER-AUTHORED
用户自己的 interpretation
```

UI 中最重要的是区分 **reference proposal** 与 **reader-authored understanding**，而不是把 executor 当成权威等级。

---

# 11. LLM 的边界

## 核心原则

> **MeaningForge 是 model-enabled but not model-defined：automatic construction 可以使用 LLM-assisted execution，但 reference scaffold 生成后，core reading interaction 与 study hypothesis 不依赖 live LLM。**

LLM 在本项目中可以承担两类辅助工作。

### A. Automatic substrate-construction executor

LLM 可以代替研究者执行已经固定好的繁琐步骤，例如：

- 按 TextSpan schema 整理 evidence；
- 按 MIP/MIPVU-informed record 填写 contextual/basic meaning 等字段；
- 按 Carrier inclusion criteria 判断候选项；
- 按固定 StructuralRelation taxonomy 整理 recurrence / contrast / consequence / context shift；
- 在已有 grounding 上形成 qualified InterpretiveRelation proposal；
- 按 neutral-label rule 组织 FigurativeThread；
- 检查、标准化、补齐 JSON 字段。

这里 **LLM 不能改变 protocol、ontology、relation taxonomy 或 study logic**。它只是执行者。

### B. Optional runtime assistance

若未来需要，可用于：

- scholarly source retrieval/query expansion；
- difficult source paraphrasing；
- natural-language scaffold query；
- phrasing / search / organization support。

LLM 不应：

- 把 reference scaffold 宣称为 authoritative meaning graph；
- 绕过固定的 evidence/grounding rules；
- 把一个没有 text grounding 的 high-level meaning 静默写入 reference layer；
- 替读者生成可直接提交的 final interpretation；
- 在 controlled study 中制造未控制的 model-intelligence confound。

### Controlled-study implementation

**主 controlled study 的 reader-facing reasoning phase 可以完全没有 live runtime LLM。**

研究材料可以先通过 automatic construction pipeline 生成，再冻结成同一版本的 WorkPackage / ReferenceSkeleton；pipeline 内部可以使用 LLM 按固定 substrate protocol 执行语义整理和结构化。研究问题仍然是 reader 与 structured scaffold 的 interaction，而不是 LLM 的文学解释能力。

因此：

> LLM 可以参与 automatic construction 的 bounded semantic execution，但不能成为 MeaningForge 的研究对象或 reader-facing authority。

# 12. Reader-Facing System Design

## 12.1 原文永远是主界面

不要一打开就是一张 hairball graph。

推荐布局：

```text
┌──────────────────────────────┐
│ Primary Reading Pane         │
│ 原文                          │
│ highlight / note             │
└──────────────────────────────┘

┌──────────────┐ ┌─────────────┐
│ Skeleton Map │ │ Path Inspector│
│ 全文小骨架   │ │ 当前关系展开 │
└──────────────┘ └─────────────┘
```

---

## 12.2 Interaction 1 — Overview：看见全文结构

系统只显示有限的 metaphor clusters / recurring figurative threads。

目标：

> “这篇作品里哪些隐喻关系在多个位置反复/变化？”

而不是直接告诉：

> “主题就是 X。”

---

## 12.3 Interaction 2 — Trace：从一个表达追到全文 evidence

用户点击一个 metaphor-related span：

```text
Current expression
↓
source/target frame
↓
related occurrences
↓
repetition / contrast / consequence
↓
relevant passages
```

用户始终可以跳回原文。

---

## 12.4 Interaction 3 — Compare：并排比较关系

例如：

- 同一个 target concept 的不同 metaphor；
- 同一个 metaphor 在不同 passage 的使用；
- 两个可能 supporting evidence；
- 两条不同 interpretation path。

目标不是增加解释数量，而是让 reader 看见：

> interpretation 的差异具体来自哪一组 textual relation。

---

## 12.5 Interaction 4 — Challenge：质疑骨架

每一条 interpretive relation 都允许：

```text
Agree
Unsure
Reject
Edit
Add alternative
```

这一步非常重要。

如果 network 只能 browse，Graphilosophy / visualization literature 会成为更强 novelty threat。

如果 reader 能真正改变自己的 scaffold，它才成为 HCI epistemic workspace。

---

## 12.6 Interaction 5 — Active Meaning Probe

Formative 后选择至少一种 active probe。

候选 A：**Edge Removal**

> 暂时拿掉某条 evidence/relation，看 interpretation path 还剩什么。

候选 B：**Replacement / Counterfactual Probe**

> 把 metaphorical carrier 换成 literal / near-neighbor alternative，看哪些 connection 弱化/断裂。

候选 C：**Counterevidence Lens**

> 主动显示支持与削弱同一 reading 的 evidence。

### Replacement 的正确定位

不是：

> “用户有 replacement 需求。”

而是：

> **一种研究者提出并通过 formative + user study 验证的 interaction technique，用来让 reader 检查特定 carrier 对整体 meaning structure 的贡献。**

这在 HCI 上完全合理。

---

## 12.7 Interaction 6 — Compose My Reading

reader 从 skeleton 选：

- evidence；
- relations；
- optional sources；
- alternative/counterevidence。

然后自己写 3–5 句 interpretation。

系统不直接生成 final paragraph。

输出记录：

```text
My claim
Evidence I selected
Relations I accepted
Relations I rejected
My explanation
Alternative / qualification
```

---

# 13. Data Model

## Node Types

```text
TextSpan
MetaphorRelatedUnit
SourceFrame
TargetFrame
Entity
Action/Event
Passage
ContextSource
ReferenceInterpretation
ReaderInterpretation
```

## Edge Types

```text
appears_in
maps_source_to_target
recurs_with
contrasts_with
parallels
co_occurs_with
performed_by
supports
complicates
weakens
alternative_to
cited_from
reader_accepts
reader_rejects
```

不是所有 edge 都同一 epistemic status。

### Edge provenance

```text
T = text-derived
M = metaphor-theory-derived
S = scholarly/source-backed
R = reader-authored
L = optional LLM suggestion (unconfirmed)
```

---

# 14. 控制复杂度：全文骨架 ≠ 全部节点同时显示

这是系统能不能成功的核心设计问题。

全图可以在 backend 存在，但 novice UI 必须 progressive disclosure。

## Level 0 — Reading
只读原文。

## Level 1 — Skeleton Overview
只显示 4–8 个 active figurative threads/clusters。

## Level 2 — Local Path
点一个 thread 才展开 3–7 个 relevant evidence/relations。

## Level 3 — Interpretation Layer
需要时再打开 reference/source/alternative interpretations。

## Level 4 — Research/Debug
完整 graph、packet status、algorithm confidence，仅 researcher/admin 可见。

这样既保留“全文骨架”的核心，又避免把 HCI 论文做成一张不可读的知识图谱。

---

# 15. Controlled User Study

## 15.1 核心 causal question

> **在提供相同 textual / interpretive information 的情况下，把这些信息变成可探索、可操作的 whole-text figurative scaffold，是否比 linear explanation 更能支持 evidence-grounded close-reading reasoning？**

---

## 15.2 Conditions

### Condition A — Information-Matched Linear Explanation

- original text；
- conventional annotation/prose explanation；
- reference interpretations；
- same evidence；
- same source information。

### Condition B — MeaningForge

完全相同 information，但通过：

- skeleton overview；
- trace；
- compare；
- challenge；
- selected active probe；
- reader composition。

### Optional Condition C — Static Skeleton

若资源允许：

- same structure；
- no manipulation。

用于区分：

```text
prose vs structure
structure vs interaction
```

这是比“MeaningForge vs ChatGPT”更干净的主实验。

ChatGPT 可作为 ecological secondary baseline，但不建议作为唯一 baseline。

---

## 15.3 Study design

若 primary claim 包含 transfer，推荐 **between-subjects**：避免 participant 先学会 MeaningForge interaction 后污染 baseline condition。

初步规划：

- 2 conditions；
- 每组约 24–30 人；
- total N 约 48–60；
- 最终通过 pilot effect + prospective power/sensitivity analysis 决定，不把这个数字写死。

如果资源明显不足，可先做 smaller within-subject system evaluation，但此时不要做强 transfer causal claim。

---

# 16. Tasks

## T1 — Assisted Close Reading

读一个未熟悉文本，完成短 close-reading response。

要求：

> 给出 interpretation，并明确指出 textual evidence。

---

## T2 — Challenge a Weak Interpretation

给 participant 一个：

> 流畅、听起来很“文学”，但其中某个 evidence/relation 并不充分的解释。

要求：

- 判断是否接受；
- 标出 weak relation；
- 找 evidence；
- 修改或限定 interpretation。

这比只看 final essay 更直接测试 MeaningForge 的核心 interaction value。

---

## T3 — Unassisted Transfer

给新文本：

- no MeaningForge；
- no explanation；
- no graph。

要求自己完成 close reading。

这是整个 study 最关键的任务之一。

如果 B condition 只在有系统时答案更漂亮，但 transfer 没差异，那么 MeaningForge 更像 answer organization tool，而不是 reasoning scaffold。

---

# 17. Primary Outcome：Evidence-Grounded Close-Reading Reasoning

不宣称创造一个新的心理量表。

由 2 名 literature-trained blind raters 使用 rubric 评分。

## Dimension 1 — Evidence specificity
是否使用具体、相关 textual evidence？

## Dimension 2 — Figurative feature articulation
是否说清楚具体 expression / metaphor / repetition / contrast 在文本层面发生了什么？

## Dimension 3 — Relation reasoning
是否说明 evidence 为什么支持 interpretation，而不仅是贴 theme 标签？

## Dimension 4 — Cross-span integration
是否整合跨段落/跨位置 evidence？

## Dimension 5 — Qualification / alternatives
是否知道 interpretation 的边界、counterevidence 或 alternative？

## Dimension 6 — Reader authorship
是否能用自己的语言 defend interpretation，而不是复刻 system wording？

Secondary outcomes：

- final interpretation quality；
- literal comprehension；
- metaphor identification accuracy；
- confidence；
- NASA-TLX；
- reading time；
- perceived agency；
- perceived authority；
- enjoyment；
- interaction logs。

---

# 18. Candidate Hypotheses（只能在 formative 后正式锁定）

### H1 — Reasoning
MeaningForge condition 在 evidence-grounded reasoning rubric 上优于 information-matched prose。

### H2 — Cross-span integration
MeaningForge readers 更频繁、且更准确地连接跨文本 evidence。

### H3 — Weak interpretation detection
MeaningForge readers 更能发现/修正 unsupported 或 overextended interpretive relation。

### H4 — Transfer
MeaningForge readers 在无辅助新文本上表现出更好的 evidence–relation reasoning。

### H5 — Trade-off
MeaningForge 增加了 interaction effort，但 progressive disclosure 可使 workload 保持可接受，并提升 perceived inspectability/agency。

---

# 19. CHI Contributions：不要过度理论化，也不要只说“做了一个系统”

如果 formative + controlled study 成功，推荐 3 个主要贡献。

## C1. Empirical Understanding + Design Requirements

> Characterize how novice-to-intermediate readers work with figurative evidence during close reading, and identify design requirements for whole-text figurative scaffolds.

贡献不是“首次发现 novice 不懂 metaphor”，而是给出与交互系统直接相关的任务过程、breakdown 和 design requirements。

---

## C2. Artifact / Interaction Contribution

> Introduce MeaningForge, an interactive whole-text figurative-meaning scaffold that combines theory-guided textual structure with progressive exploration, evidence tracing, reader challenge/editing, and active meaning probes.

这一 contribution 可以合法地建立在 MIPVU、NLP、knowledge graph、visualization 等已有技术之上，因为创新单位是 **完整 interaction artifact + workflow**。

但是如果 Graphilosophy/PoemPalette 等已覆盖某个具体 interaction，论文必须明确说明差异，不能重复 claim。

---

## C3. Empirical HCI Design Knowledge

> Provide controlled evidence about how structured, manipulable figurative scaffolds affect evidence-grounded close-reading reasoning, verification, workload, agency, and unassisted transfer relative to information-matched linear support.

这是最重要的 community knowledge：

> 什么时候 structure/manipulation 比解释 paragraph 真正有价值，什么时候反而 overload 或 steering？

---

# 20. 什么可以大胆复用，什么必须小心

## Green — 可以作为 ingredient 使用

- MIP/MIPVU；
- MetaNet / FrameNet；
- tokenization / NER / coreference / dependency；
- graph database；
- standard node-link / overview+detail techniques；
- provenance labels；
- search/retrieval；
- basic annotation；
- standard usability metrics。

前提：不要把这些本身写成 contribution。

---

## Yellow — 可以 build on，但必须明确 difference

- literary visualization；
- expert think-aloud visualization；
- interactive interpretive text analysis；
- non-expert classical-text KG；
- AI-assisted poetry understanding；
- claim–evidence interface；
- reasoning graphs；
- scaffolding questions。

这些属于 MeaningForge 的 direct research neighborhood。

---

## Orange / Red — 真的会迫使 pivot 的情况

如果找到 archival prior work 同时实现：

```text
novice literary readers
+
whole-text metaphor / figurative network
+
theory-guided structure
+
reader manipulates evidence/meaning relations
+
close-reading construction rather than browsing
+
information-matched comparison
+
reasoning / transfer outcomes
```

则不能再靠措辞区分，需要改变 core interaction 或 empirical claim。

当前调研中 **尚未发现这样的 end-to-end 直接碰撞**。

---

# 21. 最大的方法和系统风险

## Risk 1 — Full graph 是“专家答案图”

如果所有高层 meaning 都由专家预先写好，用户只是在浏览，paper 很容易被评价为 digitized teaching material。

### 控制

- reference meaning 与 reader meaning 分层；
- 必须允许 reject/edit/add；
- final response reader-authored；
- transfer task 检查独立 reasoning。

---

## Risk 2 — Automatic metaphor network 技术上过度承诺

MIPVU ≠ literary interpretation engine。

### 控制

- automated layer 限定到 metaphor-related units / structural relations；
- high-level interpretation 有 source/expert provenance；
- controlled corpus 允许 manual validation。

---

## Risk 3 — Graph cognitive overload

### 控制

- progressive disclosure；
- full graph 后台；
- overview 只显示 active threads；
- formative 比较 card/path/map 等 representation，不预设 node-link graph 一定最好。

---

## Risk 4 — AI authority

即使 LLM 不在 runtime，reference graph 也可能成为 authority。

### 控制

- multiple interpretations；
- provenance；
- “reference / source / reader”分层；
- explicit reject；
- weak-interpretation task；
- authority perception measure。

---

## Risk 5 — 只在 cherry-picked 文本有效

### 控制

- 2–3 relation types；
- 至少 2 类 metaphor structure；
- main study 用多篇 matched texts；
- 不 claim automatic generalization to all classics。

---

# 22. 推荐材料策略

不要把《药》《阿Q正传》等高度熟悉作品直接作为唯一 main study material。

正式材料满足：

1. surface comprehension 可控；
2. metaphor/figurative structure 明显但非一眼给答案；
3. evidence 分布于多个 passage；
4. 至少两个 defensible interpretation；
5. 有 reference commentary 可做 material validation；
6. participant familiarity 较低。

可以保留鲁迅类文本作为 demo / expert calibration，但 main experiment 最好包含 unfamiliar or less-canonical excerpts。

---

# 23. 论文 Intro 最理想的 HCI Story

```text
文学 close reading 是 evidence-based interpretive practice
        ↓
novice 在 figurative texts 中尤其容易遇到困难
        ↓
AI 现在能直接给解释，而且已有 CHI 证据说明这种解释可以提高 performance
        ↓
但“获得 interpretation”与“自己从全文 evidence 构造 interpretation”不是同一个 interaction goal
        ↓
已有 HCI 系统分别展示 expert thought、visualize literary patterns、support annotations、
explore concepts/characters，humanities KGs 也越来越成熟
        ↓
尚不清楚：
怎样把 theory-guided whole-text figurative structure
做成 novice 可以主动 reasoning-with 的 interface
        ↓
formative study → design requirements
        ↓
MeaningForge
        ↓
controlled study:
information-matched prose vs interactive scaffold
        ↓
reasoning + challenge + transfer + trade-offs
```

这个 story 不需要发明新 cognitive theory，也不需要声称每个 technical component 都新。

---

# 24. 30 秒 Pitch

### English

> Literary interpretations are now easy to obtain from AI, but close reading requires more than receiving a theme: readers must connect concrete language and figurative patterns across a text to build an evidence-grounded interpretation. Prior HCI systems visualize expert reading processes, textual patterns, or interpretive knowledge, while NLP provides theory-guided methods for identifying metaphorical structure. MeaningForge brings these capabilities into a different interaction model: a whole-text figurative scaffold that readers can trace, compare, challenge, and actively test while constructing their own interpretation. We study whether this structured interaction changes close-reading reasoning and whether any benefit transfers when the scaffold is removed.

### 中文

> AI 已经能很快给出文学解释，但精读不只是拿到一个主题答案，而是要把全文中具体语言、隐喻和其他证据组织成自己的解释。MeaningForge 不是让 LLM 替读者解释，而是利用隐喻理论与传统文本分析构造一套全文意义骨架，让读者主动追踪、比较、质疑和测试其中的关系，再形成自己的 close-reading argument。我们最终研究的不是“答案有没有变好”，而是这种交互是否改变了 evidence-grounded reasoning，以及拿掉系统后这种能力能不能迁移。

---

# 25. 一句话 Working Framing

## 最推荐

> **MeaningForge investigates how an interactive, theory-guided whole-text figurative-meaning scaffold can support evidence-grounded close reading by novice readers.**

## 更明确的版本

> **MeaningForge investigates how novice readers can use a theory-guided whole-text metaphor scaffold to trace, challenge, and actively test the textual relations underlying literary interpretations.**

中文：

> **MeaningForge 研究由隐喻理论与传统文本分析方法构建的全文隐喻/修辞意义骨架，如何通过可追踪、可质疑和可操作的交互，帮助非专家读者进行更有文本依据的文学精读。**

---

# 26. 推荐下一步顺序

## Step 1 — 暂停开发完整系统

先冻结上面的 research problem 和 novelty boundary。

## Step 2 — 建立 30–50 篇 evidence matrix

对每篇记录五轴：

```text
User
Task/problem
Representation
Core interaction
Evaluation claim
```

重点继续追踪 CHI 2026/2027 前的新工作。

## Step 3 — 设计新的 formative protocol

不要再使用之前 E1–H1–E7 reconsideration HTML 作为主 study。

## Step 4 — 先做 2–3 个 materials calibration

确定难度和 familiarity。

## Step 5 — 跑 9–12 人 formative

得到真实 design requirements。

## Step 6 — 再确定 MeaningForge UI

尤其决定：

- overview 是 graph 还是 cards/map；
- replacement 是否保留；
- challenge/edit 怎么做；
- source/context 怎样展开。

## Step 7 — 实现 automatic construction，并为 controlled study 冻结生成的 WorkPackage

4–6 个 study texts 足够，不追求“自动覆盖所有名著”。

这里冻结的是 **protocol、schema、evidence grounding 与最终 WorkPackage 版本**，不是要求所有 substrate 数据必须人工制作。LLM 可以代替研究者执行固定的标注、核查和结构化步骤；但 controlled study 运行时应使用冻结后的同一 reference scaffold，避免 model drift / runtime intelligence confound。

## Step 8 — controlled pilot + power analysis

先验证 rubric、task difficulty、baseline information matching。

---

# 27. 最终判断

经过这轮“不过严、也不过松”的 literature boundary review，我建议 **继续 MeaningForge，但回到“全文隐喻/修辞意义骨架 + active close-reading interaction”这条主线**。

原因不是“没人做过 graph”。相反，graph、literary visualization、metaphor KG、AI interpretation、non-expert humanities KG 都已经有重要工作。

MeaningForge 仍然成立的原因是：

> **现有工作尚未完整回答：一个由 theory-guided computation 构建的 whole-text figurative structure，怎样成为 novice reader 主动 close-reading 的 interaction substrate，以及这种 interaction 是否真正改变 evidence-grounded reasoning，而不仅是让 interpretation 更容易获得。**

这是一条足够 HCI、足够接近原始研究兴趣、同时又能被 formative study 和 controlled user study 真正证伪/验证的路线。

系统最核心的设计自检仍然是：

> **把 LLM 拿掉后，MeaningForge 的骨架、interaction 和 user-study hypothesis 仍然成立。**

如果这一条成立，LLM 就只是辅助；MeaningForge 的真正研究对象是 **human interaction with structured literary meaning**。

---

# References / Nearest Neighbors

1. Peskin, J. (1998). *Constructing Meaning When Reading Poetry: An Expert-Novice Study*. Cognition and Instruction, 16(3), 235–263. DOI: 10.1207/s1532690xci1603_1.
2. Steen, G. J., et al. (2010). *A Method for Linguistic Metaphor Identification: From MIP to MIPVU*. John Benjamins.
3. Dodge, E., Hong, J., & Stickles, E. (2015). *MetaNet: Deep semantic automatic metaphor analysis*. Workshop on Metaphor in NLP, ACL Anthology W15-1405.
4. McCurdy, N., et al. (2016). *Poemage: Visualizing the Sonic Topology of a Poem*. IEEE TVCG, 22(1). DOI: 10.1109/TVCG.2015.2467811.
5. Mehta, H., Bradley, A., Hancock, M., & Collins, C. (2017). *Metatation: Annotation as Implicit Interaction to Bridge Close and Distant Reading*. ACM TOCHI 24(5). DOI: 10.1145/3131609.
6. Sterman, S., Huang, E., Liu, V., & Paulos, E. (2020). *Interacting with Literary Style through Computational Tools*. CHI 2020. DOI: 10.1145/3313831.3376730.
7. Zhang, X., et al. (2021). *ConceptScope: Organizing and Visualizing Knowledge in Documents based on Domain Ontology*. CHI 2021. DOI: 10.1145/3411764.3445396.
8. Hong, M.-H., et al. (2022). *Scholastic: Graphical Human-AI Collaboration for Inductive and Interpretive Text Analysis*. UIST 2022. DOI: 10.1145/3526113.3545681.
9. Risha, Z., Sonmez Unal, D., & Walker, E. (2023). *Soliloquy: Fostering Poetry Comprehension Using an Interactive Think-aloud Visualization*. CHI 2023. DOI: 10.1145/3544548.3581374.
10. Hoque, M. N., et al. (2023). *Portrayal: Leveraging NLP and Visualization for Analyzing Fictional Characters*. DIS 2023. DOI: 10.1145/3563657.3596000.
11. House, N., et al. (2024). *Visualising Character Dynamics in Novels for Non-Experts*. OzCHI. DOI: 10.1145/3638380.3638384.
12. Tian, Y., Xu, N., & Mao, W. (2024). *A Theory Guided Scaffolding Instruction Framework for LLM-Enabled Metaphor Reasoning*. NAACL 2024. DOI: 10.18653/v1/2024.naacl-long.428.
13. Sui, P., et al. (2025). *KRISTEVA: Close Reading as a Novel Task for Benchmarking Interpretive Reasoning*. ACL 2025, ACL Anthology 2025.acl-long.1577.
14. Zhi, J., Long, H., So, R. J., & Lee, M. (2026). *What Does AI Do for Cultural Interpretation? A Randomized Experiment on Close Reading Poems with Exposure to AI Interpretation*. CHI 2026. DOI: 10.1145/3772318.3791727.
15. Zhang, Y., Jia, K., Zhang, H. J., Zhu, K., Meng, C., Zhang, J., Li, Z., Chen, P., & Sun, L. (2026). *PoemPalette: Facilitating Poetry Creative Exploration and Foundational Understanding through the Ideorealm Alignment of Paintings and Poems*. CHI 2026. DOI: 10.1145/3772318.3791460.
16. Martin-Boyle, A., Leckey, C. A. C., Brown, M. C., & Kaur, H. (2026). *PaperTrail: A Claim-Evidence Interface for Grounding Provenance in LLM-based Scholarly Q&A*. CHI 2026. DOI: 10.1145/3772318.3791101.
17. Benito-Santos, A., et al. (2026). *Chasing Meaning and/or Insight? A Survey on Evaluation Practices at the Intersection of Visualization and the Humanities*. CHI 2026. DOI: 10.1145/3772318.3793150.
18. Do, M.-T., et al. (2026). *Graphilosophy: Graph-Based Digital Humanities Computing with The Four Books*. arXiv:2603.28755 (preprint; listed as AI & Society submission/comment).
19. ACM SIGCHI. (2026). *Contributions to CHI* and *Guide to a Successful Submission*. Official CHI 2026 author guidance.

---

## Final Research Discipline

```text
Do not claim a component is new merely because MeaningForge uses it differently.
Do not abandon a useful component merely because another paper has used it.
Ask instead:
Has prior work already made the same HCI contribution,
for the same users, task, interaction, and empirical outcome?
```
