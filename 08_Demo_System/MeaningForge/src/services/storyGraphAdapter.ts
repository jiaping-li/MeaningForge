import type { ReaderSession, WorkPackage } from "@/types/workPackage";

export type StoryGraphNodeKind = "narrative" | "carrier" | "convergence" | "reader";

export interface StoryGraphNode {
  id: string;
  label: string;
  kind: StoryGraphNodeKind;
  chapterIds: string[];
  threadIds: string[];
  evidenceIds: string[];
  replaceable: boolean;
}

export interface StoryGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  threadId?: string;
  relationType: string;
  layer: "narrative" | "figurative";
}

export interface StoryGraphUnit {
  id: string;
  chapterId?: string;
  label: string;
  order: number;
  threadIds: string[];
}

export interface StoryGraphView {
  units: StoryGraphUnit[];
  nodes: StoryGraphNode[];
  edges: StoryGraphEdge[];
  threadLabels: Array<{ id: string; label: string }>;
  readerHasWork: boolean;
}

function chapterOrder(workPackage: WorkPackage, chapterId: string) {
  const index = workPackage.work.chapter_markers?.findIndex((item) => item.id === chapterId) ?? -1;
  return index >= 0 ? index : Number(chapterId) || 0;
}

function chaptersForEvidence(workPackage: WorkPackage, evidenceIds: string[]) {
  const chapterIds = new Set<string>();
  evidenceIds.forEach((evidenceId) => {
    const evidence = workPackage.evidence.find((item) => item.id === evidenceId);
    evidence?.span_ids.forEach((spanId) => {
      const span = workPackage.text_spans.find((item) => item.id === spanId);
      if (span) chapterIds.add(span.chapter_id);
    });
  });
  return [...chapterIds].sort((a, b) => chapterOrder(workPackage, a) - chapterOrder(workPackage, b));
}

/**
 * Converts the frozen protocol objects into a reader-facing graph projection.
 * It does not add literary claims or mutate the reference WorkPackage.
 */
export function createStoryGraphView(workPackage: WorkPackage, session: ReaderSession): StoryGraphView {
  const probeCarrierIds = new Set(workPackage.probes.map((item) => item.target_carrier_id).filter((id): id is string => Boolean(id)));
  const edgeDegree = new Map<string, number>();
  workPackage.structural_relations.forEach((edge) => {
    edgeDegree.set(edge.source_id, (edgeDegree.get(edge.source_id) ?? 0) + 1);
    edgeDegree.set(edge.target_id, (edgeDegree.get(edge.target_id) ?? 0) + 1);
  });
  const threadIdsFor = (nodeId: string) => workPackage.threads.filter((thread) => thread.carrier_ids.includes(nodeId) || thread.structural_relation_ids.some((relationId) => {
    const relation = workPackage.structural_relations.find((item) => item.id === relationId);
    return relation?.source_id === nodeId || relation?.target_id === nodeId;
  })).map((thread) => thread.id);
  const carrierNodes: StoryGraphNode[] = workPackage.carriers.map((carrier) => ({
    id: carrier.id,
    label: carrier.label,
    kind: (edgeDegree.get(carrier.id) ?? 0) > 1 ? "convergence" : "carrier",
    chapterIds: chaptersForEvidence(workPackage, carrier.evidence_ids),
    threadIds: threadIdsFor(carrier.id),
    evidenceIds: carrier.evidence_ids,
    replaceable: probeCarrierIds.has(carrier.id),
  }));
  const narrativeNodes: StoryGraphNode[] = workPackage.narrative_entities.map((entity) => ({
    id: entity.id,
    label: entity.label,
    kind: "narrative",
    chapterIds: chaptersForEvidence(workPackage, entity.evidence_ids),
    threadIds: threadIdsFor(entity.id),
    evidenceIds: entity.evidence_ids,
    replaceable: false,
  }));
  const units = [...workPackage.narrative_units].sort((a, b) => a.order - b.order).map((unit) => ({
    id: unit.id,
    chapterId: unit.chapter_id,
    label: unit.summary ?? workPackage.work.chapter_markers?.find((item) => item.id === unit.chapter_id)?.label ?? `叙事单元 ${unit.order}`,
    order: unit.order,
    threadIds: workPackage.threads.filter((thread) => unit.chapter_id && thread.distribution.chapter_ids.includes(unit.chapter_id)).map((thread) => thread.id),
  }));
  const fallbackUnits = workPackage.work.chapter_markers?.map((item, index) => ({ id: item.id, chapterId: item.id, label: item.label, order: index + 1, threadIds: workPackage.threads.filter((thread) => thread.distribution.chapter_ids.includes(item.id)).map((thread) => thread.id) })) ?? [];
  return {
    units: units.length ? units : fallbackUnits,
    nodes: [...carrierNodes, ...narrativeNodes],
    edges: [
      ...workPackage.narrative_relations.map((relation) => ({ id: relation.id, sourceId: relation.source_id, targetId: relation.target_id, relationType: relation.type, layer: "narrative" as const })),
      ...workPackage.structural_relations.map((relation) => ({ id: relation.id, sourceId: relation.source_id, targetId: relation.target_id, threadId: relation.thread_id, relationType: relation.type, layer: "figurative" as const })),
    ],
    threadLabels: workPackage.threads.map((thread) => ({ id: thread.id, label: thread.neutral_label })),
    readerHasWork: Boolean(session.claim.trim() || session.reader_nodes.length || session.reader_relations.length || Object.keys(session.judgments).length || session.probes.length),
  };
}
