# MeaningForge

MeaningForge is a CHI27 demo prototype for making literary meaning construction inspectable during close reading.

It uses a Plotscape-inspired structured substrate: passages, mapping relations, evidence links, and replacement-comparison states. Its interaction design follows the VeriForge lesson more closely: the system surfaces scaffolded material while readers keep control over final interpretation.

## Reader Workflows and Research Panels

The demo separates reader-facing workflows from optional study instrumentation:

- **Light Reading** keeps the workflow low-friction: choose a passage, scan candidate carriers, select one, generate a Metaphor Lens Story, and copy an evidence-grounded close reading draft. The story uses progressive disclosure and replacement probes rather than exposing the mapping table first.
- **Interpretation Polishing** expands the structured workspace with evidence checking, mapping graphs, and replacement probes for coursework, seminar discussion, or paper paragraphs.

Researchers can additionally enable **Research Panels**. This is a separate instrumentation toggle, not a third reader workflow. It reveals study conditions, event logs, and structured measures for formative studies and controlled user studies.

## Metaphor Lens Story

The default light-reading result is not a full text-to-image comic and does not claim novelty in scrollytelling itself. Instead, it uses a controllable, progressive intermediate representation:

1. a spotlighted passage with the selected carrier highlighted;
2. a concrete carrier stage with visible attributes;
3. replacement probes that invite readers to try alternate carriers;
4. a consequence stage showing what stays, breaks, or newly appears;
5. a short explanation with optional evidence peek.

This keeps the exploratory character of LLM output visible: generated interpretations are framed as revisable probes, not authoritative annotations. The advanced mapping workspace remains available only when readers choose to inspect the reasoning process.

## Design Lineage

MeaningForge adapts VeriForge's mixed-initiative UI pattern for readers:

- Proactive alerts become candidate mapping alerts.
- Knowledge Cards become textual/cultural/critical evidence cards.
- Dual-stream querying becomes conversational meaning scaffold plus structured relation bubbles.
- Knowledge Canvas becomes a Meaning Canvas that gathers carrier nodes, relation nodes, and replacement consequences.
- Authorial ownership becomes reader interpretive agency.

Plotscape remains relevant at the representation layer, not the final UI: MeaningForge keeps explicit typed objects, relation links, evidence IDs, and comparison states, but removes branching-narrative authoring concepts.

## Full-Book Support

MeaningForge includes a full public-domain text:

- Jane Austen, *Pride and Prejudice*, from Project Gutenberg.

Use **Load full text** in the UI to split the book into chapter/section passages. You can also import your own `.txt` classic; the app will split it by chapter headings when possible, or into readable sections when chapter headings are absent.

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

Before starting the API on Windows, check that the LM Studio port is reachable:

```powershell
Test-NetConnection 10.16.87.206 -Port 1234
curl.exe http://10.16.87.206:1234/v1/models
```

or:

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-chat
```

Without a key, the UI falls back to a local scaffold so the workflow remains demonstrable.
