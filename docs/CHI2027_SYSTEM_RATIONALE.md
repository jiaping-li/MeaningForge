# MeaningForge CHI 2027 System Rationale

## Research Gap

Literary explanations often tell readers what a metaphor means, but leave implicit how that meaning is constructed through concrete textual carriers, relation mappings, evidence, cultural context, and counterfactual comparison.

MeaningForge is not positioned as a stronger literary interpretation generator. It is a reader-facing interaction system for making metaphorical meaning construction inspectable and revisable during close reading.

## System Positioning

MeaningForge combines two prior design logics:

- **Plotscape-style representation:** meaning is represented as a graph-like structure of carriers, mapping relations, evidence, replacement comparisons, and reader judgments.
- **VeriForge-style interaction:** the LLM proactively surfaces scaffolded candidates, but the reader accepts, revises, rejects, compares, and records the final interpretation.

## Core Workflow

1. **线索扫描**
   The system scans a passage using theory-guided lenses such as MIP/MIPVU, Chinese poetics, symbol/motif, and narrative structure. The output is not a final interpretation, but a set of candidate carriers.

2. **意义图谱**
   Reader-selected candidates are expanded into a mapping graph: concrete carrier, broader meaning hypotheses, mapping relations, and textual/cultural evidence. Readers validate the evidence instead of passively accepting an explanation.

3. **替换探针**
   The system generates or accepts replacement carriers. Each replacement is compared against the original mapping to show which relations are preserved, broken, or newly generated. Readers confirm or revise these effects and then record a final interpretation.

## Data Structure

The current system structure includes:

- `CandidateCarrier`: theory-guided candidate with span, evidence excerpt, detection method, theory trace, confidence, salience, and replaceability.
- `LiteraryMapping`: selected carrier, literal scene, broader meaning hypotheses, mapping relations, evidence, alternative interpretations, replacements, provenance, and study hooks.
- `MappingRelation`: relation between carrier properties/actions and broader meanings, with evidence links and relation type.
- `LiteraryEvidence`: textual, cultural, or critical evidence with source role and groundedness.
- `ReplacementAnalysis`: alternative carrier plus comparison effects.
- `ReplacementComparison`: preserved, broken, or emergent mapping effects with diagnostic questions.

## User Study Relevance

The interface should support tasks aligned with the CHI 2027 paper:

- Whether readers notice metaphorical meaning construction rather than only final interpretations.
- Whether readers can identify concrete carriers, abstract meanings, and mapping relations.
- Whether readers can judge textual and cultural grounding.
- Whether replacement comparison helps readers understand meaning loss, boundary conditions, and emergent interpretations.
- Whether readers treat LLM output as editable material rather than final authority.

## Study Measures

Potential logged or coded measures:

- Candidate selections and revisions.
- Mapping relations inspected.
- Evidence accepted, revised, or rejected.
- Replacement carriers selected or authored.
- Preserved, broken, and emergent effects confirmed or revised.
- Final interpretation specificity.
- Evidence grounding quality.
- Awareness of meaning loss or interpretive boundary.
- Reader agency in final judgment.

## Demo Boundary

The deployed demo should not display this rationale to participants as an in-app panel. It belongs in researcher-facing materials, paper writing notes, study briefing scripts, or appendix documentation.
