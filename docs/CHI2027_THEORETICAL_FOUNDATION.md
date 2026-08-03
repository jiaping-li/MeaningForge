# MeaningForge CHI 2027 理论依据

本文档是 MeaningForge demo 和 CHI 2027 论文写作的系统内理论底稿。更完整的研究者版见项目根目录 `MeaningForge_Theoretical_Foundation_and_Bibliography.md`。

## 1. 核心问题

MeaningForge 不研究 “LLM 能不能解释文学”，而研究：

```text
当解释结论已经可以由导读、课堂讲解或 LLM 给出时，
novice-to-intermediate readers 如何看见这个解释是怎样由具体文本关系建构出来的？
```

这里的核心困难是 **latent interpretive relation gaps**：

- 读者可能知道“这句表达丰年期待”；
- 或者知道鲁迅《药》中的“人血馒头”与迷信、愚昧和社会批判有关；
- 但说不清“人血馒头”如何通过食物、血、治病承诺、身体摄入、处决暴力和看客社会共同支撑这个解释；
- 也说不清换成“普通药丸”或“白馒头”后，哪些意义还在、哪些意义变弱、哪些新方向出现或直接断裂；
- 因而最终解释容易变成背诵结论，而不是读者自己的 close-reading judgment。

## 2. 理论闭环

```text
latent interpretive relation gaps
  -> theory-guided UIRR packet construction
  -> counterfactual meaning scaffold
  -> evidence-aware reader judgment
  -> reader-authored interpretation
```

与 VeriForge 的对应关系：

```text
VeriForge:
latent knowledge gaps
  -> source-grounded knowledge scaffold
  -> author synthesis

MeaningForge:
latent interpretive relation gaps
  -> theory-guided UIRR packet construction
  -> counterfactual meaning scaffold
  -> reader-authored interpretation
```

MeaningForge 借鉴 VeriForge 的是研究结构：从真实任务中的隐性断点出发，设计脚手架，并把最终综合权留给用户。它不是把写作系统简单换成阅读系统。

## 3. UIRR Packet Construction 为什么关键

MeaningForge 不能把完整 txt / md / pdf 直接交给 LLM，然后把输出当作文学有效材料。更合理的中间层是 theory-guided UIRR packet construction：

```text
完整文本
  -> 理论镜头扫描 passage / carrier
  -> LLM 或本地脚手架生成 packet draft
  -> 研究者校准 carrier、relation、evidence 和 replacement
  -> 文学训练者快速检查材料是否站稳
  -> 进入 demo、pilot 或正式 study
```

这意味着系统要显式区分：

- **llm_draft**：模型辅助草稿，只能探索；
- **local_scaffold**：本地脚手架试探，只能探索；
- **researcher_curated**：研究者按理论标准整理；
- **expert_checked**：文学训练者快速检查过材料有效性；
- **pilot_ready / study_ready**：可以进入 pilot 或正式 study。

这一层是 MeaningForge 和普通 LLM 文学解释工具的分界。LLM 可以帮助草拟 packet，但不能自动把一个 packet 变成“已校准材料”。

UIRR packet 需要按 carrier type 校准。当前 demo 使用五类操作性 carrier：

- 物件型 carrier：如《药》“人血馒头”；
- 动作型 carrier：如《药》“趁热吃下”；
- 话语型 carrier：如《药》“包好”、《阿Q正传》“儿子”；
- 场景/仪式型 carrier：如《祝福》“祝福仪式”；
- 感官/图像型 carrier：如《故乡》“金黄的圆月”。

这套分类不是文学分类学的终极定义，而是为了让系统能决定：应该绑定什么证据、设计什么替换探针、检查哪些 preserved / weakened / emergent / broken 后果。

## 4. Replacement Probing 为什么不是文字游戏

Replacement probing 的定义不是“改写原文”，而是：

```text
如果把当前具体载体换成另一个具体载体，
原来的意义关系还能成立吗？
哪里保留，哪里变弱，哪里出现新方向，哪里直接断裂？
```

它有三组理论支撑：

- **Counterfactual thinking**：通过 “what if” 替代情境理解关系、原因和边界。
- **Analogical comparison**：通过比较两个相似但不同的案例，更容易看见底层结构。
- **Defamiliarization**：替换让被自动接受的意象关系重新变得可见。

所以 curated replacement 必须满足：

- 可观察：替换后仍有具体对象、感官线索或场景动作；
- 可比较：能与原 carrier 在至少一条意义关系上形成差异；
- 可解释：差异能回到原文证据，而不是纯脑补；
- 有诊断目的：能说明它测试哪条关系。
- 有边界标签：说明它是近邻替换、边界测试、文化变体、字面化还是读者自定。

系统中 replacement 需要明确标记探针类型：

- **近邻替换**：保留部分感官或场景维度，测试关键意义关系是否仍成立。
- **边界测试**：故意把意象推远，测试原文关系在哪里断裂。
- **文化变体**：保留相近文化功能，测试意义是否依赖特定习俗、物件或仪式。
- **字面化替换**：把含混或象征性表达换成直接表达，测试文学压缩是否消失。
- **读者自定**：由读者输入，默认是待校验试探。

远替换不能被呈现为普通建议，否则很容易让 reviewer 认为 replacement probing 只是文字游戏。

因此 MeaningForge 的 replacement authoring 需要一个 selection gate：

```text
replacement 是否保留了一个可比较锚点？
replacement 是否改变了一条明确关系？
replacement 是否绑定 targetRelationIds？
replacement 后果是否能回到原文证据？
replacement 是否能产生 preserved / weakened / emergent / broken 中至少一种有意义变化？
```

如果这些问题答不上来，这个 replacement 应该被标记为低诊断性，不能直接进入 study-ready packet。

例子：

```text
人血馒头 -> 普通药丸

保留：求医治病的希望仍在。
变弱：血腥暴力、处决来源和看客社会关系变弱。
新增：现代医疗或正规治疗方向出现。
断裂：“药”和社会病症被压缩到同一物件中的结构不再成立。
```

这说明原文意义不是来自“药”这个抽象主题，也不是来自“人血馒头=愚昧”的固定查找，而是来自食物、血、治疗承诺和社会关系的压缩。

## 5. 系统模块与理论映射

| 系统模块 | 理论支撑 | 设计含义 |
| --- | --- | --- |
| Four-Step Workspace | scaffolding、cognitive load、reader-response | 把解释拆成 notice、ground、compare、author 四个动作 |
| carrier highlight | close reading、MIP/MIPVU、concrete carrier | 先显化具体文本对象，再谈抽象意义 |
| replacement probes | counterfactual thinking、analogical comparison、defamiliarization | 通过替代情境看见原文关系 |
| preserved / weakened / emergent / broken cards | analogical encoding、interpretive boundary awareness | 把替换后果从“对/错”改成关系变化 |
| evidence peek | textual evidence、trust calibration | 让读者把解释回扣到文本 |
| source strip | provenance、human-AI collaboration | 区分原文、curated packet、读者动作、模型试探 |
| reader-authored paragraph | reader-response、agency | 最终解释由读者生成、修改和承担 |

## 6. LLM 应该做什么

LLM 可以做：

- 整理 candidate carriers；
- 建议 replacement probes；
- 草拟 preserved / weakened / emergent / broken hypotheses；
- 初步链接 evidence；
- 把读者判断整理成可编辑解释草稿。

LLM 不应该做：

- 宣称某个解释是标准答案；
- 把 speculative interpretation 和 textual evidence 混在一起；
- 替读者做最终解释判断；
- 在主界面以权威批注形式输出长篇文学解释。

因此系统需要持续显示来源：

```text
原文证据 / 研究者整理材料 / 读者动作 / 模型或脚手架试探
```

导入文本或未经过 UIRR packet validation 的文本必须额外标记为“未校准文本”。这类内容可以用于探索功能展示，但不应成为 formative/user study 中支撑文学有效性的主要材料。

## 7. Formative Study 应验证什么

Reader Formative Study 应先验证理论假设，而不是直接证明当前界面有效：

1. 目标读者是否真的存在 latent interpretive relation gaps；
2. replacement probing 是否被理解为合法 close-reading activity；
3. 哪些 replacement 帮助读者看见 preserved / weakened / emergent / broken relations；
4. 哪些 replacement 像文字游戏，应从 packet 删除；
5. 读者需要多少 evidence/context 才能形成判断；
6. source strip 是否降低 LLM 权威感；
7. Four-Step Workspace 的顺序、命名和信息密度是否符合自然阅读过程。

Curated Passage Packet Validation 只回答材料是否站稳，不回答系统是否有用。

## 8. User Study 应测什么

后续 controlled user study 的指标应对应理论闭环：

- relation articulation：能否说明 carrier 如何连接 broader meaning；
- evidence grounding：能否指出支撑证据；
- boundary awareness：能否说明替换后哪些意义保留、变弱、新增或断裂；
- interpretive agency：是否觉得最终解释是自己形成的；
- AI authority perception：是否把系统输出当标准答案；
- cognitive load：是否降低额外负担；
- final interpretation quality：专家盲评文本依据、关系具体性、细腻度和边界意识。

## 9. 关键文献

### Literary Interpretation and Reader Agency

- Rosenblatt, *The Reader, the Text, the Poem*: https://eric.ed.gov/?id=ED165145
- Rejan, “Reconciling Rosenblatt and the New Critics”: https://publicationsncte.org/content/journals/10.58680/ee201729318
- Topoi and literary interpretation: https://www.sciencedirect.com/science/article/pii/S0361476X11000282

### Metaphor, Symbol, and Concrete Carrier

- Lakoff, “Mapping the brain's metaphor circuitry”: https://pmc.ncbi.nlm.nih.gov/articles/PMC4267278/
- Pragglejaz Group, MIP: https://research.lancaster-university.uk/en/publications/mip-a-method-for-identifying-metaphorically-used-words-in-discour/
- MIPVU documentation: https://www.vismet.org/metcor/documentation/MIPVU.html

### Replacement, Comparison, and Defamiliarization

- Byrne, “Counterfactual Thought”: https://www.annualreviews.org/content/journals/10.1146/annurev-psych-122414-033249
- Gentner, Loewenstein, Thompson, “Learning and Transfer”: https://experts.illinois.edu/en/publications/learning-and-transfer-a-general-role-for-analogical-encoding/
- Loewenstein, Thompson, Gentner, “Analogical encoding facilitates knowledge transfer”: https://pubmed.ncbi.nlm.nih.gov/10682201/
- Shklovsky entry, Routledge Encyclopedia of Modernism: https://www.rem.routledge.com/articles/shklovsky-viktor-1893-1984
- Pangborn, “Defamiliarization”: https://onlinelibrary.wiley.com/doi/abs/10.1002/9781444337839.wbelctv1d001

### Scaffolding, Cognitive Load, and Progressive Disclosure

- Wood, Bruner, Ross, “The Role of Tutoring in Problem Solving”: https://pubmed.ncbi.nlm.nih.gov/932126/
- Sweller, “Cognitive Load During Problem Solving”: https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog1202_4
- Mayer, “Cognitive Theory of Multimedia Learning”: https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/24E5AEDEC8F4137E37E15BD2BCA91326
- Kim & Ji, “Exploratory search with generative AI”: https://www.sciencedirect.com/science/article/pii/S1071581926000467

### Human-AI Collaboration and LLM Authority

- Amershi et al., “Guidelines for Human-AI Interaction”: https://doi.org/10.1145/3290605.3300233
- Do et al., “Facilitating Human-LLM Collaboration through Factuality Scores and Source Attributions”: https://research.ibm.com/publications/facilitating-human-llm-collaboration-through-factuality-scores-and-source-attributions
- Pareek et al., “How Causal Attributions of AI Decisions Shape Trust in AI Systems”: https://doi.org/10.1145/3706598.3713468

### Adjacent CHI Inspiration, Not Core Contribution

- CHI 2026 poetry-to-2D-image paper: https://dl.acm.org/doi/pdf/10.1145/3772318.3790704
- CHI 2026 privacy policy animation/scrollytelling paper: https://dl.acm.org/doi/pdf/10.1145/3772318.3791460

## 10. Reviewer-facing Guardrails

不要这样写：

- MeaningForge automatically interprets classic literature.
- LLM identifies the correct metaphor.
- Four-Step Workspace was known to be optimal before formative study.
- Curated Passage Packet Validation is a second formative study.
- The contribution is scrollytelling or comic-style visualization.

推荐这样写：

- MeaningForge supports readers in probing and articulating how concrete textual carriers support broader meanings.
- LLM assistance is positioned as model-assisted probes, separated from textual evidence, curated materials, and reader actions.
- Replacement probes are diagnostic counterfactuals: they help readers observe what remains, weakens, or emerges when a carrier changes.
- The system contribution lies in the interaction framework that makes literary meaning construction observable, comparable, and reader-authored.


