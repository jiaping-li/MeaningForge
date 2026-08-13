import { scaffoldScanCandidates } from "@/services/meaningApi";
import type {
  CandidateCarrier,
  CandidateScanResult,
  CarrierRecurrence,
  LiteraryMapping,
  LiteraryPassage,
  LiterarySubstrate,
  LiterarySubstrateCalibrationStatus,
  LiterarySubstrateNode,
  LiterarySubstrateUnitKind,
  LiteraryWork,
  TheoryLens,
} from "@/types/literaryMapping";

function compact(value: string) {
  return value.replace(/[\s/／“”"《》·。，“”，、：:；;（）()！？!？‘’'——…]/g, "").toLowerCase();
}

function unique(values: string[], limit = 12) {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = compact(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function detectUnitKinds(passage: LiteraryPassage, scan: CandidateScanResult): LiterarySubstrateUnitKind[] {
  const kinds = new Set<LiterarySubstrateUnitKind>(["narration"]);
  if (/[“”"']/.test(passage.text)) kinds.add("dialogue");
  if (scan.preprocess.images.length > 0) kinds.add("description");
  if (scan.preprocess.actions.length > 0) kinds.add("action");
  if (/(祝福|祭祀|茶馆|茶館|刑场|刑場|坟地|墳地|看客|众人|眾人|仪式|儀式|court|trial|wedding|funeral)/i.test(passage.text)) {
    kinds.add("scene_ritual");
  }
  return Array.from(kinds);
}

function detectSemanticAnomalies(text: string) {
  const compactText = compact(text);
  const anomalies: string[] = [];
  if (/血/.test(compactText) && /(馒头|饅頭|饭|飯|吃|食|药|藥|治|病)/.test(compactText)) {
    anomalies.push("身体/暴力 + 食物/治病");
  }
  if (/(刑场|刑場|处决|處決|杀|殺)/.test(compactText) && /(药|藥|治|病|吃|馒头|饅頭)/.test(compactText)) {
    anomalies.push("处决/暴力 + 治疗流程");
  }
  if (/(祝福|祭祀|仪式|儀式|规矩|規矩)/.test(compactText) && /(不要|不能|不配|忌|排除|赶|趕)/.test(compactText)) {
    anomalies.push("仪式秩序 + 排除机制");
  }
  if (/(月|光|花|声|聲|香|梦|夢|影)/.test(compactText) && /(故乡|故鄉|记忆|記憶|少年|童年|远|遠)/.test(compactText)) {
    anomalies.push("感官图像 + 记忆/时间距离");
  }
  if (/(胜利|勝利)/.test(compactText) && /(打|败|敗|屈辱|骂|罵|输|輸)/.test(compactText)) {
    anomalies.push("失败/屈辱 + 胜利命名");
  }
  return unique(anomalies, 6);
}

function statusFromCuratedMappings(
  curatedMappings: LiteraryMapping[],
  work: LiteraryWork,
  passage: LiteraryPassage
): LiterarySubstrateCalibrationStatus {
  const related = curatedMappings.filter((mapping) => {
    const compactPassage = compact(passage.text);
    const compactMappingPassage = compact(mapping.passage);
    return (
      mapping.workTitle === work.title &&
      (mapping.passageLabel === passage.label ||
        compactPassage.includes(compactMappingPassage) ||
        compactMappingPassage.includes(compactPassage) ||
        compactPassage.includes(compact(mapping.selectedSpan)))
    );
  });
  if (related.some((mapping) => mapping.analysisProvenance?.packetProtocol?.status === "study_ready")) return "study_ready";
  if (related.some((mapping) => mapping.analysisProvenance?.packetProtocol?.status === "expert_checked")) return "expert_checked";
  if (related.length > 0) return "researcher_curated";
  return "uncalibrated_draft";
}

function buildNode(
  work: LiteraryWork,
  passage: LiteraryPassage,
  scan: CandidateScanResult,
  curatedMappings: LiteraryMapping[]
): LiterarySubstrateNode {
  const calibrationStatus = statusFromCuratedMappings(curatedMappings, work, passage);
  const semanticAnomalies = detectSemanticAnomalies(passage.text);
  return {
    id: `substrate_node_${passage.id}`,
    passageId: passage.id,
    label: passage.label,
    chapter: passage.chapter,
    unitKinds: detectUnitKinds(passage, scan),
    entities: unique(scan.preprocess.entities, 12),
    actions: unique(scan.preprocess.actions, 10),
    scenes: unique(
      scan.candidates
        .filter((candidate) => candidate.carrierTypes?.includes("scene_ritual"))
        .map((candidate) => candidate.span),
      8
    ),
    sensoryImages: unique(scan.preprocess.images, 12),
    repeatedTerms: unique(scan.preprocess.repeatedTerms, 10),
    semanticAnomalies,
    candidateIds: scan.candidates.map((candidate) => `${passage.id}:${candidate.id}`),
    candidateCount: scan.candidates.length,
    calibrationStatus,
  };
}

function scoreCandidate(
  candidate: CandidateCarrier,
  node: LiterarySubstrateNode,
  passageIds: string[],
  totalScanned: number
): CarrierRecurrence["salienceSignals"] {
  const recurrence = Math.min(1, passageIds.length / 3);
  const distribution = totalScanned > 0 ? Math.min(1, passageIds.length / Math.min(totalScanned, 8)) : 0;
  const narrativeCentrality =
    (candidate.scores?.narrativeImportance ?? 0.45) +
    (candidate.priority === "high" ? 0.18 : candidate.priority === "medium" ? 0.08 : 0);
  const semanticAnomaly = node.semanticAnomalies.length > 0 ? 0.82 : candidate.scores?.mipTension ?? 0.35;
  const evidenceTrace = candidate.evidenceExcerpt ? 0.78 : 0.25;
  return {
    recurrence: Number(recurrence.toFixed(2)),
    distribution: Number(distribution.toFixed(2)),
    narrativeCentrality: Number(Math.min(1, narrativeCentrality).toFixed(2)),
    semanticAnomaly: Number(Math.min(1, semanticAnomaly).toFixed(2)),
    evidenceTrace,
  };
}

function mergeStatus(
  current: LiterarySubstrateCalibrationStatus,
  next: LiterarySubstrateCalibrationStatus
): LiterarySubstrateCalibrationStatus {
  const rank: LiterarySubstrateCalibrationStatus[] = [
    "unscanned",
    "uncalibrated_draft",
    "researcher_curated",
    "expert_checked",
    "study_ready",
  ];
  return rank.indexOf(next) > rank.indexOf(current) ? next : current;
}

function buildCarrierIndex(nodes: LiterarySubstrateNode[], scans: Record<string, CandidateScanResult>) {
  const grouped = new Map<
    string,
    {
      candidate: CandidateCarrier;
      passageIds: string[];
      distribution: string[];
      status: LiterarySubstrateCalibrationStatus;
      node: LiterarySubstrateNode;
    }
  >();

  nodes.forEach((node) => {
    const scan = scans[node.passageId];
    scan?.candidates.forEach((candidate) => {
      const key = compact(candidate.span);
      if (!key) return;
      const existing = grouped.get(key);
      if (existing) {
        if (!existing.passageIds.includes(node.passageId)) existing.passageIds.push(node.passageId);
        if (!existing.distribution.includes(node.label)) existing.distribution.push(node.label);
        existing.status = mergeStatus(existing.status, node.calibrationStatus);
      } else {
        grouped.set(key, {
          candidate,
          passageIds: [node.passageId],
          distribution: [node.label],
          status: node.calibrationStatus,
          node,
        });
      }
    });
  });

  return Array.from(grouped.values())
    .map<CarrierRecurrence>(({ candidate, passageIds, distribution, status, node }) => ({
      span: candidate.span,
      label: candidate.label,
      carrierTypes: candidate.carrierTypes ?? [],
      occurrenceCount: passageIds.length,
      passageIds,
      distribution,
      calibrationStatus: status,
      salienceSignals: scoreCandidate(candidate, node, passageIds, nodes.length),
    }))
    .sort((a, b) => {
      const scoreA =
        a.occurrenceCount +
        a.salienceSignals.narrativeCentrality +
        a.salienceSignals.semanticAnomaly +
        a.salienceSignals.evidenceTrace;
      const scoreB =
        b.occurrenceCount +
        b.salienceSignals.narrativeCentrality +
        b.salienceSignals.semanticAnomaly +
        b.salienceSignals.evidenceTrace;
      return scoreB - scoreA;
    });
}

export function buildLiterarySubstrate({
  work,
  passages,
  theoryLenses,
  curatedMappings = [],
  scanLimit = 80,
}: {
  work: LiteraryWork;
  passages: LiteraryPassage[];
  theoryLenses: TheoryLens[];
  curatedMappings?: LiteraryMapping[];
  scanLimit?: number;
}): LiterarySubstrate {
  const scannedPassages = passages.slice(0, Math.min(passages.length, scanLimit));
  const passageScans = Object.fromEntries(
    scannedPassages.map((passage) => [
      passage.id,
      scaffoldScanCandidates({
        workTitle: work.title,
        author: work.author,
        language: work.language,
        tradition: work.tradition,
        passageLabel: passage.label,
        passage: passage.text,
        theoryLenses,
      }),
    ])
  );
  const scannedNodes = scannedPassages.map((passage) =>
    buildNode(work, passage, passageScans[passage.id], curatedMappings)
  );
  const unscannedNodes = passages.slice(scannedPassages.length).map<LiterarySubstrateNode>((passage) => ({
    id: `substrate_node_${passage.id}`,
    passageId: passage.id,
    label: passage.label,
    chapter: passage.chapter,
    unitKinds: ["narration"],
    entities: [],
    actions: [],
    scenes: [],
    sensoryImages: [],
    repeatedTerms: [],
    semanticAnomalies: [],
    candidateIds: [],
    candidateCount: 0,
    calibrationStatus: "unscanned",
  }));
  const nodes = [...scannedNodes, ...unscannedNodes];
  const carrierIndex = buildCarrierIndex(scannedNodes, passageScans);
  const nodesByPassageId = Object.fromEntries(nodes.map((node) => [node.passageId, node]));
  const curatedCandidateCount = carrierIndex.filter((item) => item.calibrationStatus !== "uncalibrated_draft").length;

  return {
    id: `substrate_${work.id}_${Date.now()}`,
    workId: work.id,
    workTitle: work.title,
    generatedAt: new Date().toISOString(),
    coverage: {
      scannedPassages: scannedPassages.length,
      totalPassages: passages.length,
      scanLimit,
    },
    nodes,
    nodesByPassageId,
    passageScans,
    carrierIndex,
    summary: {
      candidateCount: carrierIndex.length,
      curatedCandidateCount,
      uncalibratedCandidateCount: Math.max(0, carrierIndex.length - curatedCandidateCount),
      semanticAnomalyCount: nodes.reduce((count, node) => count + node.semanticAnomalies.length, 0),
      topRecurringCarriers: carrierIndex.slice(0, 8).map((item) => item.label),
    },
  };
}
