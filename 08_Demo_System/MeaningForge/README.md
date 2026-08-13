# MeaningForge Demo

This demo implements the current MeaningForge reader boundary:

```text
prepared source text
→ protocol-guided, validated, frozen WorkPackage
→ reader traces reference evidence and relations
→ reader compares, challenges, optionally probes
→ reader saves a separate personal reading layer
```

The browser does not regenerate the bundled reference scaffold. It can optionally ask a configured local LLM to review a reader-authored relation against the reader-selected evidence. The API may also prepare a **draft** from imported text; that draft must still be validated and explicitly frozen before it becomes a reference WorkPackage. The bundled `medicine-substrate-v2-development.json` is a small development WorkPackage for integration testing, not a study-ready annotation release.

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

## Optional MIP/MIPVU-assisted draft pass

The deterministic pass never claims to have completed MIP. When a local model
is configured, enable **“运行本地模型的 MIP 辅助核查”** before selecting a
draft text (or the matching option during TXT import). The model must produce,
for each lexical candidate, an exact-source lexical unit, contextual meaning,
basic meaning, comparison, and one of `metaphor_candidate`, `literal`, or
`undecidable`. Invalid or ungrounded records are rejected. Accepted records
remain `machine_draft` and are displayed for researcher review; they are not
study-ready metaphor annotations.

Configure the local endpoint in `api/.env.local` (do not commit this file):

```text
OPENAI_API_URL=your-local-compatible-endpoint
OPENAI_MODEL=your-local-model-name
OPENAI_API_KEY=optional
```

## Data boundaries

- Reference data lives in `public/data/medicine-substrate-v2-development.json` and is never mutated by reader actions.
- Reader actions are stored separately in browser local storage and can be exported as JSON from the header. The reader graph workspace renders reference nodes/edges alongside a separate personal layer: readers may add, rename, and delete only personal nodes and relations.
- The optional live reviewer returns support, gaps, complications, and questions. It never decides whether a reader interpretation is correct and never writes into the reference package.
- The preparation-time protocol, WorkPackage schema, and validation requirements are defined in the project-level idea, specification, data-model, and annotation-guide documents.
