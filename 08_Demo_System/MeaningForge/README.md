# MeaningForge Demo

This demo implements the current MeaningForge reader boundary:

```text
prepared source text
→ protocol-guided, validated, frozen WorkPackage
→ reader traces reference evidence and relations
→ reader compares, challenges, optionally probes
→ reader saves a separate personal reading layer
```

The browser does not regenerate the bundled reference scaffold. It can optionally ask a configured local LLM to review a reader-authored relation against the reader-selected evidence. The API may also prepare a **draft** from imported text; that draft must still be validated and explicitly frozen before it becomes a reference WorkPackage. The bundled `medicine-v3-reference.json` is a frozen, auditable reference package for 《药》.

## Start

This project requires a native WSL Node.js runtime that supports TypeScript stripping (Node.js 22.6+; Node.js 24 recommended). In this directory, install dependencies once, then open two terminals:

```bash
npm install
npm run dev:api
npm run dev
```

Open `http://localhost:5175/`.

`npm run dev:api` starts the WorkPackage validation service. The reader itself remains usable if that service is not running. To validate the bundled package against its frozen source text:

```bash
npm run validate:medicine
```

## Optional full-text MIP/MIPVU-assisted draft pass

The deterministic pass scans the full imported text for source-anchored
comparison and anomaly cues. When a local model is configured, enable
**“运行本地模型的 MIP 辅助核查”** before selecting a draft text (or the matching
option during TXT import). The model reviews those fixed candidates in batches.
For every candidate it must return the same lexical unit and exact quote,
contextual meaning, basic meaning, comparison, and one of
`metaphor_candidate`, `literal`, or `undecidable`. Invalid records are rejected;
literal and undecidable records remain in the audit layer. Accepted records are
`machine_reviewed`, not literary truth: researchers and readers can challenge them.

Configure the local endpoint in `api/.env.local` (do not commit this file):

```text
OPENAI_API_URL=your-local-compatible-endpoint
OPENAI_MODEL=your-local-model-name
OPENAI_API_KEY=optional
MF_MIP_MAX_CANDIDATES=96
MF_MIP_BATCH_SIZE=12
```

## Optional traditional NLP executor

MeaningForge can also use a local [Stanza](https://stanfordnlp.github.io/stanza/)
pass for tokenization, POS, dependency parsing, NER, and event candidates. It
is deliberately optional: an unavailable model leaves the deterministic pass
working and records the narrative stage as `draft` rather than pretending it
ran. Install Stanza and its `zh-hans` / `en` resources in a local Python
environment, then add the following to `api/.env.local` before starting the
API:

```text
MF_ENABLE_STANZA=true
MF_STANZA_PYTHON=python3
```

The bridge never downloads models during reader interaction. Stanza output is
kept as traceable narrative candidates and is still subject to MeaningForge's
source-anchor and reference checks.

With Stanza enabled, construction can take roughly tens of seconds on a first
pass. The UI waits for this local stage instead of treating it as a failed API
request. For controlled materials, generate, validate, and freeze packages in
advance rather than constructing them during participant sessions.

## Data boundaries

- Reference data lives in `public/data/medicine-v3-reference.json` and is never mutated by reader actions.
- 《药》的初始骨架使用 `medicine-calibration-v2` 的研究者校准层：8 个主节点均有精确原文锚点；其中“眼光／刀”“坟冢／馒头”“乌鸦／铁铸”“无形的手／鸭”“枯草／铜丝”有完整、人工复核的 MIP/MIPVU 比较记录。其余 3 个是人工复核的可观察叙事物件或话语意象，并不被表述为已确定的隐喻。
- 6 条核心结构关系同样标为 `researcher_checked`，且只陈述可回到原文检查的回返、共现、场景连接或先后关系；系统不把它们升级为主题或象征结论。自动生成的其余结构边仍是可质疑候选。
- Reader actions are stored separately in browser local storage and can be exported as JSON from the header. The reader graph workspace renders reference nodes/edges alongside a separate personal layer: readers may add, rename, and delete only personal nodes and relations.
- The optional live reviewer returns support, gaps, complications, and questions. It never decides whether a reader interpretation is correct and never writes into the reference package.
- The preparation-time protocol, WorkPackage schema, and validation requirements are defined in the project-level idea, specification, data-model, and annotation-guide documents.
