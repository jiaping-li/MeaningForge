# MeaningForge Paper Writing Notes v2.1

> **Version:** 2026-08-13  
> **Purpose:** Writing guardrails for CHI 2027 under the v7.3 automatic-construction architecture.  
> **Change from v2:** Preserve the same research framing while adding safe wording for UNR, automatic protocol execution, Meaning-Relevance Projection, and the distinction between construction-time model use and reader-facing interaction.

---

# 1. Contribution Positioning

Do not claim:

- automatic literary interpretation;
- metaphor detection as the HCI novelty;
- a novel UNR formalism as the contribution;
- an LLM/agent substrate-generation pipeline as the contribution;
- better AI literary answers;
- a gold-standard literary meaning graph.

Prefer:

> MeaningForge studies how a provenance-aware, whole-text, contestable figurative scaffold supports evidence-grounded close-reading reasoning.

The core empirical object remains:

```text
reference scaffold
→ reader inspection/manipulation
→ reader-authored interpretation
```

---

# 2. Reference Scaffold Is Not Ground Truth

Use:

```text
reference scaffold
reference proposal
initial scaffold
contestable relation
qualified interpretive relation
reader-facing projection
```

Avoid:

```text
correct graph
gold interpretation
true metaphor network
system's correct meaning
automatically understood meaning
```

Reader actions remain central:

```text
keep
unsure
reject
edit
add evidence
add relation
add alternative
compose
```

---

# 3. UNR Wording

Do not write:

> We propose a novel Unified Narrative Representation (UNR).

Prefer:

> We use an internal unified narrative representation to integrate textual, narrative, figurative, relational, and provenance information before projecting a reader-facing scaffold.

Also acceptable:

> UNR is an implementation-level integration layer rather than the HCI contribution; the study concerns how readers reason with the projected, contestable scaffold.

Avoid presenting UNR as a generic universal graph or as a new theory of literary meaning unless future work independently establishes such a contribution.

---

# 4. MIP/MIPVU Position

MIP/MIPVU are methodological foundations for lexical word-use analysis.

They can structure:

```text
lexical unit
contextual meaning
basic meaning
contrast
comparison
```

They do not by themselves derive:

- symbolic-object status;
- narrative motifs;
- cross-span recurrence;
- final literary themes;
- high-level interpretive claims.

Do not write:

> MIPVU builds the literary meaning network.

Prefer:

> MIP/MIPVU-informed analysis contributes one source of figurative signals within a broader substrate construction pipeline.

---

# 5. Automatic Construction Wording

The architecture may automatically execute:

```text
text structuring
narrative extraction
coreference / event linking
multi-source figurative-signal detection
candidate generation
UNR assembly
validation
Meaning-Relevance Projection
reference-skeleton construction
```

Do not write:

> MeaningForge automatically understands literary meaning.

Prefer:

> **MeaningForge automatically constructs an initial, evidence-grounded and contestable reference scaffold using predefined textual, narrative, figurative, validation, and projection procedures.**

The word `automatic` describes orchestration and execution. It does not imply that every internal step is deterministic or purely rule-based.

---

# 6. Method vs Executor

MeaningForge fixes:

- source anchoring rules;
- ontology/schema;
- MIP/MIPVU-informed record;
- figurative-signal taxonomy;
- carrier gates;
- relation taxonomy;
- validation;
- projection criteria;
- reader interaction.

Execution may combine:

```text
deterministic algorithms
traditional NLP
LLM assistance
human audit where used
```

Do not frame this as:

> We propose an LLM substrate authoring pipeline.

Prefer:

> We implemented a predefined, theory-informed construction protocol whose stages were executed using a combination of deterministic processing, traditional NLP, and LLM-assisted semantic operations.

Key sentence:

> LLM assistance changes how some construction steps are executed; it does not change the research object or the epistemic status of the reference scaffold.

---

# 7. Do Not Overclaim MIP or NLP Automation

If an LLM fills an MIP/MIPVU-informed record, do not write:

> We automatically applied MIPVU.

Prefer:

> We used an LLM to execute a structured MIP/MIPVU-informed lexical-analysis record under fixed fields and grounding constraints.

If traditional NLP proposes entities, events, or coreference links, do not imply that the downstream narrative or figurative structure is therefore ground truth.

---

# 8. Meaning-Relevance Projection Wording

UNR is richer than what the reader sees.

Prefer:

> After validation, MeaningForge applies a predefined meaning-relevance projection to select grounded, cross-text, reader-actionable objects and relations for the initial scaffold while retaining excluded candidates in the backend for audit/debugging.

Useful reviewer-facing detail:

> Each reader-facing object records why it was selected, such as recurrence, narrative salience, figurative signal support, relational load, cross-span distribution, grounding quality, or reader actionability.

Do not describe projection as:

> the system deciding which details are truly meaningful.

---

# 9. Human Curation Wording

Do not imply exhaustive expert annotation if it did not happen.

Avoid:

> Two literature experts constructed the ground-truth graph.

unless that study actually occurred.

If only lightweight checking is used:

> We performed a material sanity check after automatic construction and machine validation before freezing the study scaffold.

Do not manufacture inter-annotator reliability claims.

---

# 10. Study-Ready Does Not Mean Correct

`study_ready` means:

> the generated scaffold passed the project's source-anchoring, schema, grounding, rule, and projection requirements and was frozen for the study condition.

It does not mean:

> experts agreed that this is the correct interpretation.

---

# 11. Construction-Time Model Use vs Reader Interaction

Do not use the old shorthand `the runtime is LLM-free` without qualification, because the product route can now include automatic construction after text import.

Use the more precise distinction:

```text
construction phase may use deterministic / NLP / LLM-assisted execution
reader-facing reasoning phase need not use live LLM generation
```

For a controlled study, it is acceptable to write:

> We generated and froze one reference scaffold per study material/condition before participant sessions, so the evaluated reader interaction did not depend on participant-specific live model generation.

This controls scaffold drift without redefining the overall system architecture as “JSON loading only.”

---

# 12. Evaluation

Do not evaluate:

> Which AI gives the better interpretation?

Evaluate reader reasoning, for example:

- evidence grounding;
- cross-text integration;
- relation justification;
- qualification;
- alternative/counterevidence exploration;
- reader ownership;
- transfer where designed.

---

# 13. Reviewer Risks

## Why not ChatGPT?

MeaningForge does not primarily expose generated prose; it externalizes evidence and relations as inspectable, manipulable reasoning objects.

## Isn't the scaffold authoritative?

It is explicitly a reference proposal. Provenance and grounding are inspectable, and readers can reject, edit, and extend it.

## If an LLM participates in automatic construction, isn't this an LLM system paper?

The construction protocol, schemas, relation types, validation rules, projection criteria, and reader interaction are predefined by MeaningForge. LLMs may execute bounded semantic steps; the HCI contribution and evaluation concern reader reasoning with the projected scaffold.

## Is UNR the novelty?

No. UNR is an internal integration layer used to keep textual, narrative, figurative, relational, and provenance information typed and traceable before projection.

## How do you know the interpretation is correct?

MeaningForge does not optimize for one correct literary reading. The reference scaffold must be grounded, qualified, and contestable.

## Why MIP/MIPVU?

It provides a defensible lexical-analysis basis for one source of figurative signals, not the whole figurative layer.

## Why not just visualize all extracted nodes?

MeaningForge explicitly separates rich backend UNR from a meaning-relevance projection so that the reader sees a sparse, traceable, actionable scaffold rather than an all-node extraction graph.

---

# 14. Recommended Methods Wording

Possible formulation:

> We implemented an automatic substrate-construction pipeline that transforms an imported literary text into a reader-facing reference scaffold. The pipeline first creates stable source anchors, then constructs narrative objects and links, detects multiple sources of figurative signal, generates candidate carriers and relations, and integrates these typed objects in an internal unified narrative representation. Machine validation checks source anchoring, referential integrity, grounding, relation rules, and qualified interpretive wording. A predefined meaning-relevance projection then selects a sparse subset of grounded and reader-actionable objects for the initial scaffold. Individual stages may use deterministic processing, traditional NLP, or LLM-assisted semantic execution under fixed schemas and protocols. The resulting scaffold is presented as a contestable reference proposal rather than a gold-standard interpretation; readers can reject, revise, and extend it.

For a controlled study, add only if true:

> To avoid participant-specific scaffold drift, we froze the generated reference scaffold for each study material/condition before participant sessions.

---

# 15. One-Line Guardrail

> **MeaningForge is about human reasoning with a structured, evidence-grounded literary scaffold—not about proving that an AI can understand literature.**
