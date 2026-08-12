# MeaningForge Paper Writing Notes v2

> **Version:** 2026-08-12  
> **Purpose:** Writing guardrails for CHI 2027 under the current MeaningForge architecture.

---

# 1. Contribution Positioning

Do not claim:

- automatic literary interpretation;
- metaphor detection as the HCI novelty;
- an LLM/agent substrate-generation pipeline as the contribution;
- better AI literary answers;
- a gold-standard literary meaning graph.

Prefer:

> MeaningForge studies how a provenance-aware, whole-text, contestable figurative scaffold supports evidence-grounded close-reading reasoning.

The core empirical object is:

```text
reference scaffold
→ reader inspection/manipulation
→ reader-authored interpretation
```

---

# 2. Reference Scaffold Is Not Ground Truth

Use language such as:

```text
reference scaffold
reference proposal
initial scaffold
contestable relation
qualified interpretive relation
```

Avoid:

```text
correct graph
gold interpretation
true metaphor network
system's correct meaning
```

Reader actions are central:

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

# 3. MIP/MIPVU Position

MIP/MIPVU are methodological foundations for lexical word-use analysis.

They can help define:

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
- final literary themes;
- high-level interpretive claims.

Do not write:

> MIPVU builds the literary meaning network.

Prefer:

> MIP/MIPVU-informed analysis contributes to the figurative-feature layer of the reference substrate.

---

# 4. LLM Position

The current architecture separates:

```text
method
from
executor
```

MeaningForge fixes:

- ontology;
- annotation protocol;
- relation taxonomy;
- validation;
- reader interaction.

An LLM may execute preparation tasks that otherwise require researcher labor.

Do not frame this as:

> We propose an LLM substrate authoring pipeline.

Prefer:

> We used a fixed, theory-informed substrate preparation protocol; LLM assistance was used to execute selected annotation, checking, and structuring steps.

If relevant, report:

- model/version;
- protocol version;
- grounding validation;
- frozen WorkPackage version.

The key sentence:

> LLM assistance changes preparation labor, not the research object or epistemic status of the reference scaffold.

---

# 5. Do Not Overclaim Automation

If an LLM fills MIP/MIPVU-informed fields, do not write:

> We automatically applied MIPVU.

Prefer:

> We used an LLM to execute a structured MIP/MIPVU-informed annotation record.

If a structural relation is LLM-classified under a fixed taxonomy, do not describe the taxonomy as model-generated.

---

# 6. Human Curation Wording

Do not imply that the system requires exhaustive expert annotation if it does not.

Avoid:

> Two literature experts constructed the ground-truth graph.

unless that study actually occurred.

If only lightweight checking is performed, say so accurately:

> We froze the study scaffold after schema/grounding validation and a material sanity check.

Do not manufacture inter-annotator reliability claims.

---

# 7. Study-Ready Does Not Mean Correct

In implementation:

```text
study_ready
```

means:

> the item passed the project's fixed preparation and validation rules and was frozen for the study.

It does not mean:

> experts agreed this is the correct interpretation.

---

# 8. LLM-Free Runtime Claim

The main runtime can still be described as LLM-removable if the frozen WorkPackage was prepared with LLM assistance.

Correct distinction:

```text
preparation may use LLM
runtime interaction need not use live LLM
```

This supports the causal argument that the user study evaluates the interactive scaffold rather than model intelligence.

---

# 9. Evaluation

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

# 10. Reviewer Risks

Prepare concise answers for:

## Why not ChatGPT?

MeaningForge does not primarily expose generated prose; it externalizes evidence/relations as manipulable reasoning objects.

## Isn't the scaffold authoritative?

It is explicitly a reference proposal. Provenance is visible and readers can reject/edit/add.

## If LLM prepared the scaffold, isn't this an LLM system?

LLM executes a fixed substrate-preparation protocol. The contribution and evaluation concern reader interaction with the frozen scaffold.

## How do you know the interpretation is correct?

The system does not optimize for a single correct literary reading. The substrate must be grounded and qualified; reader reasoning remains open and contestable.

## Why MIP/MIPVU?

It provides a defensible lexical-analysis basis for part of the substrate, not the complete literary interpretation.

## Why not a graph visualization?

MeaningForge requires reasoning operations and a personal layer, not passive graph browsing.

---

# 11. Recommended Methods Wording

Possible formulation:

> We constructed a frozen reference scaffold using a predefined, theory-informed substrate protocol. The protocol specified text segmentation, evidence units, MIP/MIPVU-informed lexical records where applicable, carrier-selection criteria, structural-relation types, qualified interpretive-relation types, thread construction, provenance, and validation. We used deterministic processing and LLM assistance to execute selected preparation steps. LLM outputs were constrained by the fixed schema and grounding requirements. The resulting scaffold was presented as a contestable reference structure rather than a gold-standard interpretation; participants could reject, revise, and extend it.

This wording should be adapted to what is actually implemented.

---

# 12. One-Line Guardrail

> **MeaningForge is about human reasoning with structured literary meaning, not about proving that an LLM can analyze literature.**
