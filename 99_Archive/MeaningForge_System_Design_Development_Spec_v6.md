# MeaningForge System Design and Development Specification v6

## Purpose

MeaningForge is an interactive evidence-grounded literary reasoning
system.

It does not attempt to automatically solve literary interpretation.

The system provides:

    Literary text
    → structured substrate
    → meaning relations
    → reader exploration
    → reader-authored interpretation

------------------------------------------------------------------------

# 1. Core Artifact

The core artifact is a provenance-aware Whole-text Figurative Meaning
Skeleton.

It contains:

1.  Narrative backbone
2.  Figurative features and carriers
3.  Meaning relations
4.  Reader interpretation layer

------------------------------------------------------------------------

# 2. Construction Pipeline

Phase 1 prototype:

Human-curated substrate.

Scale:

-   one literary work
-   50-100 evidence spans
-   20 carriers
-   30-50 relations

Automation is future work.

Potential future:

-   MIP-inspired extraction
-   LLM-assisted candidate generation
-   corpus-scale processing

------------------------------------------------------------------------

# 3. Data Model

The implementation uses:

-   Work
-   TextSpan
-   Carrier
-   Evidence
-   MeaningRelation
-   ReaderClaim
-   ReaderJudgment

(See MeaningForge_Data_Model_v1)

------------------------------------------------------------------------

# 4. Prototype Dataset

The Medicine_Substrate_v1.json demonstrates how one literary work is
encoded.

It is a prototype artifact, not an evaluation case.

------------------------------------------------------------------------

# 5. Backend Architecture

Recommended:

Spring Boot + PostgreSQL.

Modules:

-   text-service
-   substrate-service
-   relation-service
-   reader-service

------------------------------------------------------------------------

# 6. Frontend Architecture

React components:

-   ReaderView
-   MeaningLens
-   EvidencePanel
-   RelationInspector
-   CompareView
-   MyReading

------------------------------------------------------------------------

# 7. API

GET /api/work/{id}/text

GET /api/work/{id}/carriers

GET /api/carrier/{id}/relations

POST /api/reader/claim

------------------------------------------------------------------------

# 8. Interaction Operations

-   Trace
-   Compare
-   Challenge
-   Counter-evidence
-   Replacement/Counterfactual
-   Compose

Replacement is one probe, not the whole system.

------------------------------------------------------------------------

# 9. LLM Boundary

LLM can provide:

-   candidate suggestions
-   retrieval
-   explanation

LLM cannot provide authoritative interpretation.
