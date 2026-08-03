# MeaningForge

MeaningForge 是 CHI 2027 demo prototype，用于让 novice-to-intermediate readers 在文学精读中看见“意义如何被建构”。

当前版本不定位为 LLM 名著解读生成器。它把 LLM 放在“辅助组织阅读试探”的位置，而不是“给出权威批注”的位置。读者通过选择具体意象、尝试替换、比较意义变化，来理解原文意象为什么重要。

## 当前默认案例

Demo 默认包含诗词和叙事案例：

- 李白《静夜思》：warm-up 案例
- 鲁迅《药》：当前主案例，测试名著叙事场景中的物件型、动作型和话语型 carrier；本地提供全文，并保留“人血馒头与治病承诺”作为 polished UIRR packet。
- 鲁迅《阿Q正传》《祝福》《故乡》：secondary narrative cases，用于展示动作/话语、场景/仪式、感官/记忆图像等不同 carrier type。
- 辛弃疾《西江月·夜行黄沙道中》、杜甫《春望》：warm-up / transfer cases，不作为当前论文主案例。

主案例核心问题：

```text
“人血馒头”为什么能把治病希望、迷信、暴力消费和社会麻木压缩在同一个具体物件里？
如果换成“普通药丸”或“白馒头”，哪些意义还在，哪些变弱，哪些新出现或断裂？
```

## Reader Workflow

默认读者流程不是功能削弱版，而是一条逐步展开的阅读路径：

1. 读一小段文本。
2. 看到本段多个可追踪线索。
3. 临时聚焦一个具体 carrier，例如“人血馒头”。
4. 尝试 replacement，例如“普通药丸”。
5. 比较意义后果：
   - 保留；
   - 变弱；
   - 涌现；
   - 断裂。
6. 把替换结果放回整段意义地图中理解。
7. 查看来源条：
   - 原文证据；
   - 读者动作；
   - 整理材料；
   - 模型辅助试探。
8. 继续展开证据、关系和替换判断。
9. 写出或修改一版自己的阅读解释。

## Interface Model

MeaningForge 不再把产品理解成三个互相分离的模式，而是：

- **Reader Workspace**：MeaningForge 的主系统，而不是弱化的参与者页。读者先看原文，在阅读过程中临时点开某个 carrier 的 Meaning Lens；Lens 内部再展开证据、关系、替换判断和解释草稿，用完回到原文继续读。
- **Research Inspector**：同一个 Reader Workspace 上的可折叠研究者检查层，不是另一套阅读系统。它用于 study 前材料构建，以及 study 中/后由实验员记录 logs、metrics、condition 和导出数据。

Research Inspector 不是参与者可见界面。正式 formative study 或 user study 中，参与者屏幕使用 `/`，可以完成完整阅读流程，但不显示结构化底座、packet readiness、logs 和 researcher calibration。只有实验员自己的后台屏幕可以打开 `/#researcher`；如果同一台电脑共享给参与者看，必须回到 `/`。

V2.0 操作入口：

```text
参与者屏幕：
打开 demo
  -> 选择阅读材料，或载入全文
  -> 从阅读目录进入章节 / 片段
  -> 在连续阅读区读原文
  -> 点击一个可临时点开的线索
  -> 在 Meaning Lens 中看证据、试换、判断、整理解释
  -> 回到原文继续读

实验员后台：
打开 demo/#researcher
  -> 使用同一套 Reader Workspace 准备材料或预览任务
  -> 右侧打开 Research Inspector
  -> 检查结构化底座、校准状态、packet readiness、logs 和导出
```

Research Inspector 包含 Type-specific Checklist、Evidence Gap Check、Probe Template Suggestions 和 Packet Readiness，用来把技术路线里的 type-aware UIRR authoring workflow 落到可见操作。

注意：Meaning Lens 内部可以有 4-5 个微步骤，但它不是整个产品的单案例展示流程；主界面应保持 text-first 的连续阅读感。
当前 demo 默认先打开一个 researcher-curated packet，所以未载入全文时会显示“研究者整理片段”。这只是启动状态，不代表系统只能展示一个 case；参与者端可以切换内置材料，也可以对带全文的作品点击“载入全文”后通过阅读目录进入不同章节 / 片段。

载入全文后，并不是每一段都会预置 study-ready Meaning Lens。普通段落需要点击“发现本段线索”生成一组未校准的临时线索；这些线索适合探索系统交互，不应直接作为正式 study 的材料证据。

技术上，这一步不叫“自动识别一个隐喻”，而是 metaphorical / symbolic meaning carrier discovery：从当前片段中提出多个可能的物件、动作、话语、场景或感官图像候选，再由读者或研究者决定是否值得展开 Meaning Lens。这里的 carrier 不等于 strict lexical metaphor；例如《药》中的“人血馒头”更准确地是 symbolic object / narrative carrier。当前本地脚手架会尽量覆盖繁体/简体文本中的候选短语，但这些候选仍是 exploration-only。

读者体会“隐喻”的位置在 Meaning Lens 中：系统不直接给出“象征义答案”，而是让读者看见具体载体如何通过证据和语境支撑更宽解释，并通过替换后 preserved / weakened / emergent / broken 的变化来判断这条解释转移是否成立。

V2.0 demo 已把 replacement selection gate 做进界面：每个替换探针都会显示探针类型、风险/诊断性标签和“为什么选这个替换”。整理解释页会检查可比较锚点、关键关系变化、target relation、证据回链和 P/W/E/B 后果；低信息的读者自定义替换不会直接进入比较。

候选发现必须包含负例过滤：普通叙事功能词或语法性动作，如“說著 / 看著 / 走了”，默认不应进入候选，除非它们和反复话语、仪式动作、身份关系或明确文本证据绑定。当前本地脚手架已加入 stop-list 和 carrier substance check，但正式 study 仍需要 researcher curation。

类似“自然，自然”的重复应答、语气词和 discourse filler 也应被过滤。V2 的预识别层不能只靠宽松 regex 或一次 LLM 输出；它应包含 normalization、raw extraction、negative filtering、type-aware scoring、replacement diagnosticity check 和 researcher calibration。

当前 demo 的本地扫描已进一步改成 quality-gated discovery：系统先做简繁归一、泛量词/普通动作/话语填充过滤，再按 carrier substance、关系负荷、叙事中心性、重复/引用和证据回链打分。低质量片段不会再被硬塞成“周围场景”候选；没有足够 meaning carrier 信号的目录节点会诚实显示 0 个候选。

如果连接 live LLM，`/api/meaning/scan` 会使用两轮式 discovery：第一轮 work agent 生成高召回候选，第二轮 loop agent 批判并修订候选，删除 reporting verbs、discourse fillers、broken spans 和低诊断性条目。前端仍然只显示一次“发现线索”，避免增加读者操作负担。

V2.0 已加入轻量 full-text candidate index：载入全文后，demo 会对前一批目录节点做本地预扫描，并在阅读目录里显示“候选数量 / 已校准或未校准”。这不是最终的全书 LLM authoring engine，但能展示 MeaningForge 的正确骨架：目录节点先有候选索引，再由研究者把候选提升成 curated UIRR packet。

更完整的 V2 技术路线应先建立 structured literary substrate：章节 / 场景 / 段落 reading index、叙述/对话/动作/场景单元、人物-物件-事件共现、重复与分布、语义异常、证据回链和校准状态。候选 carrier discovery 发生在这个结构化底座之上，所以系统判断的不是“某个词是不是隐喻”，而是“这个可观察文本元素是否通过证据、语境和替换后果值得进入 Meaning Lens”。

防止 condition 污染的操作规则：

```text
Study 前准备材料：可以打开实验员后台 + Research Inspector
Study 中参与者做任务：参与者使用 `/` 的完整 Reader Workspace
Study 中实验员记录：只能在实验员自己的后台屏幕打开 `/#researcher`
Study 后整理数据：可以打开 `/#researcher` 导出 logs / packet / metrics
```

## Material Builder

研究面板中包含一个 UIRR 材料构建层，用来把 VeriForge 式的材料准备逻辑落到 MeaningForge：

```text
完整文本
  -> 清洗与分段
  -> 候选 carrier 扫描
  -> 意义关系草稿
  -> 证据 grounding
  -> 替换探针
  -> 研究者校准与状态标记
  -> Reader Interpretive Frame 记录运行时读者判断
```

内置案例显示为 `theory-guided UIRR packet / researcher curated`。导入文本或本地脚手架输出显示为未校准草稿，只用于探索，不能直接作为 study-ready packet。

## Current Research Framing

贡献不是：

- 更好的 LLM 文学解释；
- 自动专家批评；
- scrollytelling 本身；
- 文学 dashboard。

贡献是：

- type-specific decomposition routines for metaphorical meaning carriers；
- carrier-based operational taxonomy for close reading；
- replacement-based close-reading scaffold；
- preserved / weakened / emergent / broken consequence representation；
- UIRR-driven auditable material construction；
- low-load Meaning Lens；
- source-separated model assistance。

## Research Docs

- `docs/CHI2027_THEORETICAL_FOUNDATION.md`：理论闭环、核心文献和 reviewer-facing guardrails。
- `docs/CHI2027_SYSTEM_RATIONALE.md`：系统定位、模块层级和 study 关系。
- 项目根目录 `MeaningForge_Formative_Study_Package/`：可直接拿去 pilot/formative study 的中文材料包。

## Run

Install dependencies:

```powershell
npm install
```

Start the API:

```powershell
npm run dev:api
```

Start the web demo in another terminal:

```powershell
npm run dev
```

Open:

```text
http://localhost:5175/
```

## Live LLM

Create `api/.env.local`:

```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

For LM Studio on another machine, use the OpenAI-compatible chat endpoint:

```env
OPENAI_API_URL=http://10.16.87.206:1234/v1/chat/completions
OPENAI_API_KEY=lm-studio
OPENAI_MODEL=qwen/qwen3-235b-a22b
```

Without a key, the UI falls back to local scaffolded demo data, so the formative workflow remains demonstrable.
