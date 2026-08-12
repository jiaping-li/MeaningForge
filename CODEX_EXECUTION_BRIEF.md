# MeaningForge Execution Brief

## Current authority

Use `MeaningForge_System_Design_Development_Spec_v7_2.md` as the current implementation authority. The `v7.1` file is archived and must not be used for new implementation decisions.

## Build order

1. Prepare and validate a frozen JSON WorkPackage.
2. Load that immutable package in the local reader runtime.
3. Store reader state separately in localStorage and export it as session JSON.
4. Implement one complete thread loop before expanding the corpus or visual complexity.

## Runtime boundary

`npm run dev` must remain usable when the API and live LLM are disabled: it reads a frozen reference JSON package. When enabled, a live LLM has two bounded roles: it may prepare a **draft** WorkPackage from an imported text, or review a reader-authored relation against reader-selected evidence. Neither role may silently mutate the frozen reference package or author the reader's final interpretation.

## Non-negotiable checks

- A reference relation reaches Evidence and exact TextSpan.
- StructuralRelation and InterpretiveRelation remain distinct.
- InterpretiveRelation has grounding, qualification and provenance.
- Reader edits never mutate the WorkPackage.
- Thread labels are neutral.
