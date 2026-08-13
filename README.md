# MeaningForge

**MeaningForge** 是一个面向 CHI 2027 的文学精读研究原型。它研究的不是让 AI 替读者生成文学结论，而是如何把可追溯的全文隐喻/修辞意义结构设计为一个可操作的阅读支架，使 novice-to-intermediate readers 能从分散的文本证据出发，追踪、比较、质疑并写出自己的解释。

> 当前系统是研究原型；其中的参考骨架是可检查、可争议的初稿，而不是文学作品的标准答案。

## 研究问题

文学精读要求读者把具体措辞、意象、行动、重复、对照与叙事语境联系起来。困难往往不在于获得一个“主题答案”，而在于检查跨段证据如何共同支撑、复杂化或限定一种读法。

MeaningForge 将这一过程组织为：

```text
全文原文
  → 可追溯的文本、叙事与修辞候选
  → UNR（统一叙事表征）与 grounding / validation
  → Meaning-Relevance Projection
  → 可质疑的全文参考骨架
  → 读者追踪 / 比较 / 质疑 / 反证 / 测试
  → 读者自己的 evidence-grounded interpretation
```

自动构建是系统 substrate，不是论文的 HCI contribution，也不应被描述为“自动理解文学意义”。

## Reader Workflow

1. 在完整原文中连续阅读，并用章节滑块、下拉或上一页/下一页导航。
2. 从层级式全文骨架进入一条 `FigurativeThread`。
3. 查看精确原文证据、可观察关系、限定性的解释提案与 provenance。
4. 比较不同语境；保留、标记不确定、拒绝或改写关系；加入复杂化证据。
5. 对有明确 target relation 的项目进行 diagnostic probe。
6. 将选择、判断与限定写入独立的 **My Reading** 层，并用自己的话形成论证草稿。

参考数据不会被读者操作覆盖；读者的选择、关系、probe 结果与 claim 保存在独立 session 中，可导出 JSON。

## 当前材料状态

- **冻结的开发参考骨架**：鲁迅《药》、鲁迅《阿Q正传》。它们用于 reader-interface 集成与数据合同验证，不等于 study-ready release。
- **可生成草稿的原文**：鲁迅《故乡》《祝福》、`西游记`、`红楼梦`、`Hamlet`、`Pride and Prejudice`、`The Great Gatsby`。这些文本点击后由本地 API 按固定 schema 建立可检查草稿；正式研究材料仍需校准、验证与冻结。

## 技术边界

- **UNR** 是 typed logical integration layer，不是读者默认看到的 raw graph。
- 每个 reader-facing reference item 应可回溯至原文 evidence、relation rationale 和 provenance。
- MIP/MIPVU-informed record、传统 NLP、规则与受控 LLM 执行都可用于候选构建；LLM 不可捏造证据、定义 ontology 或生成读者的最终解释。
- 正式 study 使用同一份验证并冻结的 WorkPackage，避免 runtime model drift 形成混杂变量。

## 项目目录

```text
01_Research_Idea/       CHI 2027 研究 framing 与文献边界
03_Formative_Study/     formative 材料与主持人指南
04_System_Design/       v7.3 当前系统开发规格
05_Data_Substrate/      v3 数据模型与标注/构建指南
08_Demo_System/         React + TypeScript + Vite 本地 demo
09_Alignment_Audit/     idea、formative、系统规格与可行性审计
```

主要入口：

- [Research Idea](01_Research_Idea/MeaningForge_CHI2027_Balanced_Literature_Idea.md)
- [System Design v7.3](04_System_Design/MeaningForge_System_Design_Development_Spec_v7_3.md)
- [Alignment & Feasibility Audit](09_Alignment_Audit/MeaningForge_v7_3_Alignment_and_Feasibility.md)
- [Demo README](08_Demo_System/MeaningForge/README.md)

## 运行 Demo（WSL / Linux）

需 Node.js 22.6+，推荐 Node 24。

```bash
cd 08_Demo_System/MeaningForge
npm ci
```

启动 API（导入全文与草稿构建需要）：

```bash
npm run dev:api
```

另开一个终端启动前端：

```bash
npm run dev
```

打开 `http://localhost:5175/`。

## 研究纪律

“全文骨架是否真的帮助读者进行 relation reasoning、能否支持 transfer、是否增加 authority perception 或 cognitive load”仍须由材料校准与 formative / controlled study 检验。系统实现候选交互，但不将这些 interaction 误写为已验证的用户 finding。
