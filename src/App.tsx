import { Component, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus,
  GitCompareArrows,
  History,
  Library,
  Loader2,
  MessageSquareText,
  Network,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { literaryMappingDemo } from "@/data/literaryMappingDemo";
import { builtInLiteraryWorks } from "@/data/literaryWorks";
import { analyzePassage, compareReplacement, scanCandidates } from "@/services/meaningApi";
import { buildLiterarySubstrate } from "@/services/literarySubstrate";
import type {
  CandidateCarrier,
  CandidateScanResult,
  CandidateReviewStatus,
  CarrierType,
  ComparisonStatus,
  DetectionMethod,
  EvidenceKind,
  EvidenceReviewStatus,
  ExpressionType,
  LiteraryEvidence,
  LiteraryMapping,
  LiteraryPassage,
  LiterarySubstrate,
  LiterarySubstrateCalibrationStatus,
  LiteraryWork,
  MappingWorkspaceMode,
  MappingRelation,
  PacketValidationStatus,
  ReplacementAnalysis,
  ReplacementReviewStatus,
  StudyCondition,
  StudyLogEvent,
  TheoryLens,
} from "@/types/literaryMapping";

type InterpretationDecision = "pending" | "kept" | "revise" | "recorded";
type AppExperienceMode = "reader" | "polish";
type DisplayAudience = "participant" | "researcher";
type ResearchInspectorTab = "overview" | "substrate" | "authoring" | "packet" | "logs";
type PassageCandidateIndex = Record<string, CandidateScanResult>;

const interpretationDecisionLabels: Record<InterpretationDecision, string> = {
  pending: "等待",
  kept: "说得通",
  revise: "要修改",
  recorded: "已整理草稿",
};

const expressionTypes: ExpressionType[] = [
  "lexical_metaphor",
  "metaphorically_structured_image",
  "recurring_metaphorical_motif",
  "metaphorically_structured_action",
];
const carrierTypes: CarrierType[] = ["object", "action", "discourse", "scene_ritual", "sensory_image"];
const carrierTypeLabels: Record<CarrierType, { label: string; cue: string; className: string }> = {
  object: {
    label: "物件型",
    cue: "属性 / 身体 / 交换",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  action: {
    label: "动作型",
    cue: "行动者 / 顺序 / 急迫性",
    className: "border-sky-200 bg-sky-50 text-sky-900",
  },
  discourse: {
    label: "话语型",
    cue: "说话者 / 重复 / 权威",
    className: "border-violet-200 bg-violet-50 text-violet-900",
  },
  scene_ritual: {
    label: "场景/仪式型",
    cue: "规则 / 参与者 / 排除",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
  sensory_image: {
    label: "感官/图像型",
    cue: "颜色 / 声音 / 记忆方向",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
};
const evidenceKinds: EvidenceKind[] = ["textual", "cultural", "critical"];
const evidenceKindLabels: Record<EvidenceKind, string> = {
  textual: "文本",
  cultural: "文化",
  critical: "整理",
};
const comparisonStatuses: ComparisonStatus[] = ["preserved", "weakened", "emergent", "broken"];
const relationImportances: Array<MappingRelation["importance"]> = ["high", "medium", "low"];
const uncertaintyLevels: Array<LiteraryMapping["uncertainty"]> = ["low", "medium", "high"];
const importanceLabels: Record<MappingRelation["importance"], string> = {
  high: "强",
  medium: "中",
  low: "弱",
};
const uncertaintyLabels: Record<LiteraryMapping["uncertainty"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};
const relationTypes: NonNullable<MappingRelation["relationType"]>[] = [
  "attribute",
  "action",
  "affect",
  "cultural",
  "narrative",
  "contrast",
];
const sourceRoles: NonNullable<LiteraryEvidence["sourceRole"]>[] = [
  "passage",
  "cultural_context",
  "critical_context",
  "reader_added",
];
const sourceRoleLabels: Record<NonNullable<LiteraryEvidence["sourceRole"]>, string> = {
  passage: "原文",
  cultural_context: "文化语境",
  critical_context: "整理材料",
  reader_added: "读者补充",
};
const groundednessLevels: NonNullable<LiteraryEvidence["groundedness"]>[] = [
  "direct_quote",
  "paraphrase",
  "inference",
];
const groundednessLabels: Record<NonNullable<LiteraryEvidence["groundedness"]>, string> = {
  direct_quote: "直接引文",
  paraphrase: "转述",
  inference: "推断",
};
const packetStatusLabels: Record<
  NonNullable<NonNullable<LiteraryMapping["analysisProvenance"]>["packetProtocol"]>["status"],
  string
> = {
  llm_draft: "未校准草稿",
  researcher_curated: "研究者整理",
  expert_checked: "专家已快检",
  pilot_ready: "可 pilot",
  study_ready: "可正式 study",
};
const packetMethodLabels: Record<
  NonNullable<NonNullable<LiteraryMapping["analysisProvenance"]>["packetProtocol"]>["constructionMethod"],
  string
> = {
  theory_guided_packet: "理论驱动 packet",
  llm_assisted_draft: "模型辅助草稿",
  local_scaffold: "本地脚手架",
};
const replacementStrategies: NonNullable<ReplacementAnalysis["replacementStrategy"]>[] = [
  "near_neighbor",
  "cultural_variant",
  "oppositional",
  "literalizing",
  "reader_authored",
];
const replacementStrategyLabels: Record<NonNullable<ReplacementAnalysis["replacementStrategy"]>, { label: string; risk: string; className: string }> = {
  near_neighbor: {
    label: "近邻替换",
    risk: "低风险",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  cultural_variant: {
    label: "文化变体",
    risk: "中风险",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  oppositional: {
    label: "边界测试",
    risk: "高风险",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  literalizing: {
    label: "字面化测试",
    risk: "中风险",
    className: "border-violet-200 bg-violet-50 text-violet-800",
  },
  reader_authored: {
    label: "读者自定",
    risk: "待校验",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
};
const replacementStrategyPurposes: Record<NonNullable<ReplacementAnalysis["replacementStrategy"]>, string> = {
  near_neighbor: "保留一个相近锚点，只改变关键部分，看原关系是否还站得住。",
  cultural_variant: "保留相近文化功能，检查意义是否依赖特定习俗或物件。",
  oppositional: "故意推远一点，用来观察原文关系在哪里变弱或断裂。",
  literalizing: "把含混或象征表达变直接，检查文学压缩是否消失。",
  reader_authored: "读者提出的新试探，需要先检查它是否有明确诊断目的。",
};
const replacementGateLabels = {
  strong: {
    label: "诊断性强",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  draft: {
    label: "可试探",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  weak: {
    label: "需重写",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
} as const;
const lowInformationReplacementPattern = /^(一个)?(东西|物件|物品|意象|载体|词|词语|对象|某物|something|thing)$/i;
const theoryLenses: TheoryLens[] = ["mip_mipvu", "chinese_poetics", "symbol_motif", "narrative_structure"];
const theoryLensLabels: Record<TheoryLens, string> = {
  mip_mipvu: "MIP / MIPVU",
  chinese_poetics: "中文诗学",
  symbol_motif: "象征 / 母题",
  narrative_structure: "叙事结构",
};
const detectionMethods: DetectionMethod[] = [
  "MIP/MIPVU",
  "Chinese poetics",
  "Symbol/motif",
  "Narrative structure",
  "LLM semantic scan",
];
const detectionMethodLabels: Record<DetectionMethod, string> = {
  "MIP/MIPVU": "隐喻识别",
  "Chinese poetics": "中文诗学",
  "Symbol/motif": "象征 / 母题",
  "Narrative structure": "叙事结构",
  "LLM semantic scan": "模型辅助扫描",
};

const appExperienceLabels: Record<AppExperienceMode, { label: string; description: string }> = {
  reader: {
    label: "读原文",
    description: "先读原文，临时点开一个线索。",
  },
  polish: {
    label: "整理解释",
    description: "继续查看证据、关系、替换判断，并写出自己的解释。",
  },
};

const statusStyles: Record<ComparisonStatus, { label: string; className: string; icon: LucideIcon }> = {
  preserved: {
    label: "保留",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  weakened: {
    label: "变弱",
    className: "border-rose-200 bg-rose-50 text-rose-900",
    icon: TriangleAlert,
  },
  emergent: {
    label: "涌现",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    icon: Sparkles,
  },
  broken: {
    label: "断裂",
    className: "border-slate-300 bg-slate-100 text-slate-950",
    icon: TriangleAlert,
  },
};

const candidateReviewLabels: Record<CandidateReviewStatus, string> = {
  pending: "待确认",
  accepted: "接受",
  revised: "修订",
  rejected: "拒绝",
  saved: "暂存",
};

const replacementReviewLabels: Record<ReplacementReviewStatus, string> = {
  unreviewed: "未确认",
  confirmed: "确认",
  revised: "修订",
  rejected: "拒绝",
  uncertain: "不确定",
};

const evidenceReviewLabels: Record<EvidenceReviewStatus, string> = {
  unreviewed: "未审核",
  accepted: "接受",
  revised: "修订",
  rejected: "拒绝",
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createLogEvent(type: string, detail: string): StudyLogEvent {
  return {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp: Date.now(),
    type,
    detail,
  };
}

function compactForMatch(value: string) {
  return value.replace(/[\s/／“”"《》·。，“”，、：:；;（）()！？!？‘’'——…]/g, "").toLowerCase();
}

function mappingAnchors(mapping: LiteraryMapping) {
  return Array.from(
    new Set([
      mapping.selectedSpan,
      mapping.concreteCarrier?.name,
      ...(mapping.candidateCarriers ?? []).flatMap((candidate) => [
        candidate.span,
        candidate.label,
        candidate.evidenceExcerpt,
      ]),
      ...mapping.evidence.map((item) => item.excerpt),
    ])
  )
    .map((item) => item?.trim() || "")
    .filter((item) => compactForMatch(item).length >= 2);
}

function evaluateReplacementGate(replacement: ReplacementAnalysis) {
  const strategy = replacement.replacementStrategy ?? "near_neighbor";
  const statuses = new Set(replacement.comparisons.map((item) => item.status));
  const relationIds = replacement.comparisons.flatMap((item) => item.relationIds);
  const checks = [
    {
      label: "有可比较锚点",
      passed: strategy !== "reader_authored" || Boolean(replacement.purpose.trim()),
    },
    {
      label: "改变关键关系",
      passed: statuses.has("weakened") || statuses.has("broken") || statuses.has("emergent"),
    },
    {
      label: "绑定解释关系",
      passed: relationIds.length > 0,
    },
    {
      label: "能回到原文证据",
      passed: replacement.comparisons.some((item) => Boolean(item.diagnosticQuestion?.trim())),
    },
    {
      label: "有意义后果",
      passed: replacement.comparisons.length > 0 && statuses.size > 0,
    },
  ];
  const passedCount = checks.filter((item) => item.passed).length;
  const level: keyof typeof replacementGateLabels = passedCount >= 4 ? "strong" : passedCount >= 2 ? "draft" : "weak";
  return {
    level,
    checks,
    passedCount,
    summary:
      level === "strong"
        ? "这个替换可以帮助检查解释关系。"
        : level === "draft"
          ? "这个替换可以先试，但进入 study 前还要校准。"
          : "这个替换诊断性不足，容易变成任意改写。",
  };
}

function isLowInformationReplacement(value: string) {
  const compact = value.trim().replace(/[“”"']/g, "");
  return compact.length < 2 || lowInformationReplacementPattern.test(compact);
}

function isSameReadingPassage(mapping: LiteraryMapping, workTitle: string, passageLabel: string, passage: string) {
  const compactMappingPassage = compactForMatch(mapping.passage);
  const compactPassage = compactForMatch(passage);
  const anchorHit = mappingAnchors(mapping).some((anchor) => {
    const compactAnchor = compactForMatch(anchor);
    return compactPassage.includes(compactAnchor) || passage.includes(anchor);
  });
  return (
    mapping.workTitle === workTitle &&
    (mapping.passageLabel === passageLabel ||
      mapping.passage === passage ||
      passage.includes(mapping.passage) ||
      compactPassage.includes(compactMappingPassage) ||
      compactMappingPassage.includes(compactPassage) ||
      anchorHit)
  );
}

function findCuratedPassageForWork(mappings: LiteraryMapping[], workTitle: string, passages: LiteraryPassage[]) {
  return passages.find((passage) => findCuratedMapping(mappings, workTitle, passage.label, passage.text, ""));
}

function findCuratedMapping(
  mappings: LiteraryMapping[],
  workTitle: string,
  passageLabel: string,
  passage: string,
  selectedSpan: string
) {
  const related = mappings.filter(
    (mapping) => mapping.analysisProvenance?.source === "demo" && isSameReadingPassage(mapping, workTitle, passageLabel, passage)
  );
  if (related.length === 0) return undefined;
  const span = compactForMatch(selectedSpan);
  if (!span) return related[0];
  return (
    related.find((mapping) => {
      const target = compactForMatch(
        `${mapping.selectedSpan}${mapping.concreteCarrier.name}`
      );
      return target.includes(span) || span.includes(target) || (span.includes("月") && target.includes("月"));
    }) ?? related[0]
  );
}

function mergeCandidates(mappings: LiteraryMapping[]) {
  const seen = new Set<string>();
  return mappings
    .flatMap((mapping) =>
      (mapping.candidateCarriers ?? []).map((candidate) => ({
        ...candidate,
        carrierTypes: candidate.carrierTypes?.length ? candidate.carrierTypes : mapping.carrierTypes,
      }))
    )
    .filter((candidate) => {
      const key = compactForMatch(candidate.span);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function candidateDisplayAnchors(candidates: CandidateCarrier[]) {
  return Array.from(
    new Set(
      candidates.flatMap((candidate) => [
        candidate.span,
        candidate.label,
        candidate.evidenceExcerpt,
        candidate.span.replace(/的/g, ""),
        candidate.label.replace(/的/g, ""),
      ])
    )
  ).filter(Boolean);
}

function readerFacingAnomalyLabel(anomaly: string) {
  return anomaly
    .replace("身体/暴力 + 食物/治病", "食物、身体和暴力被放在一起")
    .replace("处决/暴力 + 治疗流程", "暴力现场被说成治病流程")
    .replace("仪式秩序 + 排除机制", "热闹仪式里出现了排除")
    .replace("感官图像 + 记忆/时间距离", "明亮图像和记忆距离连在一起")
    .replace("失败/屈辱 + 胜利命名", "失败被重新说成胜利");
}

function readerFacingCandidateReason(candidate: CandidateCarrier) {
  if (candidate.whyCandidate.length <= 46) return candidate.whyCandidate;
  return `${candidate.whyCandidate.slice(0, 46)}...`;
}

function coerceOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function inferCarrierTypes(mapping: LiteraryMapping): CarrierType[] {
  const text = [
    mapping.selectedSpan,
    mapping.concreteCarrier?.name,
    ...(mapping.concreteCarrier?.attributes ?? []),
    ...(mapping.concreteCarrier?.relations ?? []),
    ...(mapping.mappingRelations ?? []).flatMap((relation) => [relation.carrierRelation, relation.relationType ?? ""]),
  ].join(" ");
  const inferred = new Set<CarrierType>();

  if (/馒头|药丸|护身符|荷叶|灯笼|银圈|钢叉|物件|食物|包裹|器物/.test(text)) inferred.add("object");
  if (/吃下|拿来|举头|低头|承认|动作|行动|顺序|急迫|身体/.test(text)) inferred.add("action");
  if (/包好|说话|承诺|重复|权威|话语|命名|儿子|口吻/.test(text)) inferred.add("discourse");
  if (/祝福|仪式|茶馆|看客|公共|规则|排除|场景|参与者/.test(text)) inferred.add("scene_ritual");
  if (/明月|月|稻花香|蛙声|圆月|光|颜色|声音|气味|图像|记忆|感官|视觉|听觉|嗅觉/.test(text)) {
    inferred.add("sensory_image");
  }

  if (inferred.size === 0) {
    (mapping.expressionTypes ?? []).forEach((type) => {
      if (type === "metaphorically_structured_action") inferred.add("action");
      if (type === "metaphorically_structured_image") inferred.add("sensory_image");
      if (type === "recurring_metaphorical_motif") inferred.add("scene_ritual");
      if (type === "lexical_metaphor") inferred.add("discourse");
    });
  }

  return Array.from(inferred).slice(0, 3);
}

function normalizedCarrierTypeList(types: unknown): CarrierType[] {
  return Array.isArray(types)
    ? types
        .map((type) => coerceOneOf(type, carrierTypes, "sensory_image"))
        .filter((type, index, allTypes) => allTypes.indexOf(type) === index)
    : [];
}

function uniqueId(base: string | undefined, fallback: string, seen: Set<string>): string {
  const cleaned = (base || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\u4e00-\u9fff]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  const root = cleaned || fallback;
  let candidate = root;
  let counter = 2;
  while (seen.has(candidate)) {
    candidate = `${root}_${counter}`;
    counter += 1;
  }
  seen.add(candidate);
  return candidate;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-[#f5f6f1] p-6 text-slate-950">
          <section className="mx-auto max-w-3xl border border-rose-200 bg-white p-5">
            <div className="text-sm font-semibold text-rose-700">MeaningForge recovered from a UI error</div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The local model returned a structure the interface could not render. Refresh the page and try a shorter
              excerpt.
            </p>
            <pre className="mt-3 overflow-auto border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {this.state.error.message}
            </pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function fallbackReplacement(mappingId: string, carrier: string): ReplacementAnalysis {
  return {
    id: `${mappingId}_fallback_replacement`,
    label: `替换 ${carrier}`,
    replacementCarrier: "另一个具体意象",
    purpose: `测试当“${carrier}”被替换时，原来的意义关系会如何变化。`,
    comparisons: [
      {
        id: `${mappingId}_fallback_preserved`,
        status: "preserved",
        title: "具体载体仍可比较",
        explanation: "替换后仍然保留了一个可被读者观察和比较的具体对象。",
        relationIds: [],
        diagnosticQuestion: "替换后，原来哪一条由具体意象通向抽象意义的关系仍然成立？",
      },
      {
        id: `${mappingId}_fallback_broken`,
        status: "weakened",
        title: "原有联想被削弱",
        explanation: "原载体承载的一部分文本、文化或叙事关联在替换后不再稳定。",
        relationIds: [],
        diagnosticQuestion: "替换后，哪些原本依附于该意象的关联变弱或失效？",
      },
      {
        id: `${mappingId}_fallback_non_substitutable`,
        status: "broken",
        title: "可能存在不可替代核心",
        explanation: "如果替换后关键证据关系无法成立，说明原载体可能不是普通可换词，而是支撑读法的核心结构。",
        relationIds: [],
        diagnosticQuestion: "哪一条关系一换就断裂，从而说明原意象不可替代？",
      },
      {
        id: `${mappingId}_fallback_emergent`,
        status: "emergent",
        title: "新的意义方向出现",
        explanation: "新载体可能引入不同的感官、情感或文化方向。",
        relationIds: [],
        diagnosticQuestion: "替换后，出现了哪些原文本中不明显的新意义方向？",
      },
    ],
  };
}

function normalizeMapping(mapping: LiteraryMapping): LiteraryMapping {
  const selectedSpan =
    mapping.selectedSpan?.trim() ||
    mapping.concreteCarrier?.name?.trim() ||
    mapping.title?.trim() ||
    "可追踪线索";
  const mappingId = uniqueId(mapping.id, `mapping_${Date.now()}_${Math.floor(Math.random() * 10000)}`, new Set());
  const evidenceIds = new Set<string>();
  const evidence = (mapping.evidence ?? []).map((item, index) => ({
    ...item,
    id: uniqueId(item.id, `${mappingId}_e${index + 1}`, evidenceIds),
    kind: coerceOneOf(item.kind, evidenceKinds, "textual"),
    label: item.label?.trim() || `证据 ${index + 1}`,
    excerpt: item.excerpt ?? "",
    note: item.note ?? "",
    sourceRole: coerceOneOf(item.sourceRole, sourceRoles, item.kind === "textual" ? "passage" : "cultural_context"),
    groundedness: coerceOneOf(item.groundedness, groundednessLevels, item.kind === "textual" ? "direct_quote" : "inference"),
  }));
  const relationIds = new Set<string>();
  const mappingRelations = (mapping.mappingRelations ?? []).map((relation, index) => ({
    ...relation,
    id: uniqueId(relation.id, `${mappingId}_r${index + 1}`, relationIds),
    carrierRelation: relation.carrierRelation?.trim() || `“${selectedSpan}”出现在当前文本中。`,
    meaningRelation: relation.meaningRelation?.trim() || "这个具体意象可能指向更宽的意义。",
    importance: coerceOneOf(relation.importance, relationImportances, "medium"),
    evidenceIds: Array.isArray(relation.evidenceIds) ? relation.evidenceIds.filter(Boolean) : [],
    relationType: coerceOneOf(relation.relationType, relationTypes, "attribute"),
    readerStatus: coerceOneOf(relation.readerStatus, ["unreviewed", "accepted", "revised", "rejected"] as const, "unreviewed"),
  }));
  const replacementIds = new Set<string>();
  const replacements = (mapping.replacements ?? []).map((replacement, index) => ({
    ...replacement,
    id: uniqueId(replacement.id, `${mappingId}_replacement_${index + 1}`, replacementIds),
    label: replacement.label?.trim() || `替换 ${index + 1}`,
    replacementCarrier: replacement.replacementCarrier?.trim() || "另一个具体意象",
    purpose: replacement.purpose?.trim() || "比较换成另一个具体载体后，意义关系如何变化。",
    replacementStrategy: coerceOneOf(replacement.replacementStrategy, replacementStrategies, "near_neighbor"),
    comparisons: (() => {
      const comparisonIds = new Set<string>();
      return (replacement.comparisons ?? []).map((comparison, comparisonIndex) => ({
        ...comparison,
        id: uniqueId(
          comparison.id,
          `${mappingId}_replacement_${index + 1}_comparison_${comparisonIndex + 1}`,
          comparisonIds
        ),
        status: coerceOneOf(comparison.status, comparisonStatuses, "emergent"),
        title: comparison.title?.trim() || `比较 ${comparisonIndex + 1}`,
        explanation: comparison.explanation?.trim() || "替换改变了原有解释关系中的一部分。",
        relationIds: Array.isArray(comparison.relationIds) ? comparison.relationIds.filter(Boolean) : [],
        diagnosticQuestion:
          comparison.diagnosticQuestion?.trim() || "这个替换揭示了原解释关系的哪一部分？",
        readerStatus: coerceOneOf(
          comparison.readerStatus,
          ["unreviewed", "confirmed", "revised", "rejected", "uncertain"] as const,
          "unreviewed"
        ),
      }));
    })(),
  }));
  const candidateIds = new Set<string>();
  const explicitCarrierTypes = normalizedCarrierTypeList(mapping.carrierTypes);
  const normalizedCarrierTypes = explicitCarrierTypes.length > 0 ? explicitCarrierTypes : inferCarrierTypes(mapping);
  const candidateCarriers = (mapping.candidateCarriers ?? []).map((candidate, index) => ({
    ...candidate,
    id: uniqueId(candidate.id, `${mappingId}_candidate_${index + 1}`, candidateIds),
    span: candidate.span?.trim() || candidate.label?.trim() || selectedSpan,
    label: candidate.label?.trim() || candidate.span?.trim() || `线索 ${index + 1}`,
    carrierTypes: (() => {
      const explicitCandidateTypes = normalizedCarrierTypeList(candidate.carrierTypes);
      return explicitCandidateTypes.length > 0 ? explicitCandidateTypes : normalizedCarrierTypes;
    })(),
    whyCandidate: candidate.whyCandidate?.trim() || "这个意象可能支持一条可试探的读法。",
    evidenceExcerpt: candidate.evidenceExcerpt?.trim() || "",
    priority: coerceOneOf(candidate.priority, relationImportances, "medium"),
    detectionMethod: coerceOneOf(candidate.detectionMethod, detectionMethods, "LLM semantic scan"),
    basicMeaning: candidate.basicMeaning?.trim() || "",
    contextualMeaning: candidate.contextualMeaning?.trim() || "",
    semanticTension: candidate.semanticTension?.trim() || "",
    culturalResonance: candidate.culturalResonance?.trim() || "",
    readerSalience: coerceOneOf(candidate.readerSalience, relationImportances, "medium"),
    confidence: coerceOneOf(candidate.confidence, relationImportances, "medium"),
    replaceability: coerceOneOf(candidate.replaceability, relationImportances, "medium"),
    theoryTrace: {
      mipVu: candidate.theoryTrace?.mipVu?.trim() || "",
      chinesePoetics: candidate.theoryTrace?.chinesePoetics?.trim() || "",
      symbolMotif: candidate.theoryTrace?.symbolMotif?.trim() || "",
      narrativeStructure: candidate.theoryTrace?.narrativeStructure?.trim() || "",
    },
  }));

  return {
    ...mapping,
    id: mappingId,
    selectedSpan,
    carrierTypes: normalizedCarrierTypes,
    concreteCarrier: {
      ...mapping.concreteCarrier,
      name: mapping.concreteCarrier?.name?.trim() || selectedSpan,
      attributes: mapping.concreteCarrier?.attributes ?? [],
      relations: mapping.concreteCarrier?.relations ?? [],
    },
    expressionTypes: (mapping.expressionTypes ?? [])
      .map((type) => coerceOneOf(type, expressionTypes, "metaphorically_structured_image"))
      .filter((type, index, allTypes) => allTypes.indexOf(type) === index),
    broaderMeaningHypotheses: mapping.broaderMeaningHypotheses ?? [],
    mappingRelations,
    evidence,
    candidateCarriers:
      candidateCarriers.length > 0
        ? candidateCarriers
        : [
            {
              id: `${mappingId}_candidate_primary`,
              span: selectedSpan,
              label: selectedSpan,
              carrierTypes: normalizedCarrierTypes,
              whyCandidate: "当前用于细致分析的主载体。",
              evidenceExcerpt: mapping.passage?.slice(0, 160) || "",
              priority: "high",
              detectionMethod: "LLM semantic scan",
              basicMeaning: selectedSpan,
              contextualMeaning: "当前用于细致分析的主载体。",
              semanticTension: "检查这个短语是否承载了超出字面语境的意义。",
              culturalResonance: "",
              readerSalience: "medium",
              confidence: "medium",
            },
          ],
    alternativeInterpretations: mapping.alternativeInterpretations ?? [],
    replacements: replacements.length > 0 ? replacements : [fallbackReplacement(mappingId, selectedSpan)],
    uncertainty: coerceOneOf(mapping.uncertainty, uncertaintyLevels, "medium"),
    analysisProvenance: {
      systemRole: coerceOneOf(mapping.analysisProvenance?.systemRole, ["scaffold", "fallback", "reader_authored"] as const, "scaffold"),
      theoryLenses: Array.isArray(mapping.analysisProvenance?.theoryLenses)
        ? mapping.analysisProvenance.theoryLenses.map((lens) => coerceOneOf(lens, theoryLenses, "mip_mipvu"))
        : [],
      source: coerceOneOf(mapping.analysisProvenance?.source, ["llm", "local_scaffold", "demo"] as const, "llm"),
      generatedAt: mapping.analysisProvenance?.generatedAt || new Date().toISOString(),
      temporaryLens: mapping.analysisProvenance?.temporaryLens,
      packetProtocol: mapping.analysisProvenance?.packetProtocol,
    },
    studyHooks: {
      designGoal: mapping.studyHooks?.designGoal ?? [
        "把文学意义外化成可编辑结构。",
        "通过确认和修订支持读者判断。",
      ],
      expectedUserAction: mapping.studyHooks?.expectedUserAction ?? [
        "选择载体",
        "校验证据",
        "比较替换后果",
      ],
      measurableOutcome: mapping.studyHooks?.measurableOutcome ?? [
        "解释具体性",
        "证据 grounding",
        "替换带来的理解",
      ],
    },
  };
}

function makeCandidateMapping(base: LiteraryMapping, candidate: NonNullable<LiteraryMapping["candidateCarriers"]>[number]) {
  const mappingId = uniqueId(
    `${base.id}_${candidate.id}`,
    `${base.id}_candidate_mapping_${Math.floor(Math.random() * 10000)}`,
    new Set()
  );
  const relationId = `${mappingId}_r1`;
  const evidenceId = `${mappingId}_e1`;
  const candidatePassage = candidate.evidenceExcerpt?.trim() || base.passage;
  return normalizeMapping({
    ...base,
    id: mappingId,
    title: `${candidate.label} 作为意义载体`,
    passage: candidatePassage,
    passageLabel: `${base.passageLabel} / ${candidate.label}`,
    selectedSpan: candidate.span,
    carrierTypes: candidate.carrierTypes?.length ? candidate.carrierTypes : base.carrierTypes,
    concreteCarrier: {
      name: candidate.label,
      attributes: [
        importanceLabels[candidate.priority],
        candidate.detectionMethod ? detectionMethodLabels[candidate.detectionMethod] : "packet 节点",
        "临时 Lens",
      ],
      relations: [candidate.semanticTension || candidate.whyCandidate],
    },
    broaderMeaningHypotheses: [
      candidate.contextualMeaning || candidate.whyCandidate,
      candidate.culturalResonance || candidate.semanticTension || "基于理论镜头整理出的精读线索。",
    ],
    mappingRelations: [
      {
        id: relationId,
        carrierRelation: candidate.evidenceExcerpt || `“${candidate.span}”出现在当前选中文本中。`,
        meaningRelation: candidate.whyCandidate,
        importance: candidate.priority,
        evidenceIds: [evidenceId],
      },
    ],
    evidence: [
      {
        id: evidenceId,
        kind: "textual",
      label: "线索证据",
        excerpt: candidate.evidenceExcerpt || candidate.span,
        note: "这是从当前 UIRR packet 节点临时展开的 Lens，需要读者继续检查。",
      },
    ],
    candidateCarriers: base.candidateCarriers,
    replacements: [fallbackReplacement(mappingId, candidate.label)],
    analysisProvenance: {
      systemRole: "scaffold",
      theoryLenses: base.analysisProvenance?.theoryLenses ?? [],
      source: base.analysisProvenance?.source ?? "demo",
      generatedAt: new Date().toISOString(),
      temporaryLens: true,
      packetProtocol: base.analysisProvenance?.packetProtocol,
    },
  });
}

function defaultTheoryLensesForWork(work: LiteraryWork): TheoryLens[] {
  if (work.language === "zh" || work.tradition === "Chinese classic") {
    return ["chinese_poetics", "symbol_motif", "narrative_structure", "mip_mipvu"];
  }
  return ["mip_mipvu", "symbol_motif", "narrative_structure"];
}

const conditionLabels: Record<StudyCondition, { label: string; description: string }> = {
  explanation: {
    label: "C1 解释",
    description: "把意义呈现为一段自然语言解释。",
  },
  visible_mapping: {
    label: "C2 可见解释关系",
    description: "把意义拆成载体、关系和证据。",
  },
  interactive_reworking: {
    label: "C3 重制",
    description: "通过可编辑的替换比较来构建意义。",
  },
};

function makeImportedWork(text: string, fileName = "导入文本"): LiteraryWork {
  const cleanText = text.trim();
  const passages = splitFullTextIntoPassages(cleanText, fileName).slice(0, 200);

  return {
    id: `imported_${Date.now()}`,
    title: fileName.replace(/\.[^.]+$/, "") || "导入文本",
    author: "用户导入",
    language: "other",
    tradition: "Imported",
    publicationNote: "User-provided text. Check copyright and edition permissions before research use.",
    sourceNote: "本次 demo 会话中的本地导入文本。",
    isFullTextLoaded: passages.length > 1,
    passages,
  };
}

function cleanGutenbergText(text: string): string {
  return text
    .replace(/^[\s\S]*\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i, "")
    .replace(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*$/i, "")
    .trim();
}

function normalizeProseLineBreaks(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length <= 1) return lines[0] || "";

      return lines.reduce((current, line) => {
        if (!current) return line;
        if (current.endsWith("-")) return `${current.slice(0, -1)}${line}`;
        return `${current} ${line}`;
      }, "");
    })
    .filter(Boolean)
    .join("\n\n");
}

function splitOversizedParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const sentences = paragraph.match(/[^。！？.!?]+[。！？.!?]?/g) ?? [paragraph];
  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    const candidate = `${current}${sentence}`.trim();
    if (candidate.length > maxChars && current.trim()) {
      chunks.push(current.trim());
      current = sentence.trim();
    } else {
      current = candidate;
    }
  });

  if (current.length > maxChars) {
    for (let index = 0; index < current.length; index += maxChars) {
      chunks.push(current.slice(index, index + maxChars).trim());
    }
  } else if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function chunkLongSection(section: string, maxChars = 4200): string[] {
  if (section.length <= maxChars) return [section];
  const paragraphs = section
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitOversizedParagraph(paragraph, maxChars));
  const chunks: string[] = [];
  let current = "";

  paragraphs.forEach((paragraph) => {
    const candidate = `${current}\n\n${paragraph}`.trim();
    if (candidate.length > maxChars && current.trim()) {
      if (current.length < 400) {
        current = candidate;
      } else {
        chunks.push(current.trim());
        current = paragraph;
      }
    } else {
      current = candidate;
    }
  });

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function splitFullTextIntoPassages(text: string, title: string): LiteraryPassage[] {
  const cleanText = cleanGutenbergText(text);
  const sectionPatterns = [
    /^\s*(第[一二三四五六七八九十百零〇两]+回(?:[ 　]+[^\n]*)?)\s*$/gm,
    /^\s*([一二三四五六七八九十])\s*$/gm,
    /^\s*((?:CHAPTER|ACT)\s+(?:[IVXLCDM]+|\d+)\.?.*)\s*$/gim,
    /^\s*((?:I|II|III|IV|V|VI|VII|VIII|IX|X))\s*$/gm,
  ];
  const matches = sectionPatterns
    .flatMap((pattern) =>
      Array.from(cleanText.matchAll(pattern)).map((match) => ({
        index: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
        label: match[1].trim(),
      }))
    )
    .sort((a, b) => a.index - b.index)
    .filter((match, index, allMatches) => index === 0 || match.index !== allMatches[index - 1].index);

  if (matches.length === 0) {
    return chunkLongSection(normalizeProseLineBreaks(cleanText), 2200).map((chunk, index) => ({
      id: `section_${Date.now()}_${index}`,
      label: `片段 ${index + 1}`,
      chapter: title,
      text: chunk,
    }));
  }

  const passages: LiteraryPassage[] = [];
  matches.forEach((match, index) => {
    const start = match.end;
    const end = matches[index + 1]?.index ?? cleanText.length;
    const chapterTitle = match.label;
    const chapterText = normalizeProseLineBreaks(cleanText.slice(start, end).trim());
    if (chapterText.length < 400) return;
    if (/Dramatis Person/i.test(chapterText.slice(0, 1200))) return;

    chunkLongSection(chapterText).forEach((chunk, chunkIndex) => {
      passages.push({
        id: `chapter_${index + 1}_${chunkIndex}_${Date.now()}`,
        label: chunkIndex === 0 ? chapterTitle : `${chapterTitle} / 第 ${chunkIndex + 1} 段`,
        chapter: chapterTitle,
        text: chunk,
      });
    });
  });

  return passages;
}

function EvidencePanel({
  evidence,
  reviewState,
  onReview,
}: {
  evidence: LiteraryEvidence[];
  reviewState: Record<string, EvidenceReviewStatus>;
  onReview: (evidenceId: string, status: EvidenceReviewStatus) => void;
}) {
  return (
    <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
      {evidence.map((item) => (
        <div key={item.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-950">{item.label}</div>
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {evidenceKindLabels[item.kind]}
              </span>
              {item.sourceRole ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {sourceRoleLabels[item.sourceRole]}
                </span>
              ) : null}
              {item.groundedness ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {groundednessLabels[item.groundedness]}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {evidenceReviewLabels[reviewState[item.id] || "unreviewed"]}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-800">{item.excerpt}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["accepted", "revised", "rejected"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onReview(item.id, status)}
                className={cx(
                  "border px-2 py-1.5 text-xs font-medium transition",
                  reviewState[item.id] === status
                    ? status === "accepted"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : status === "rejected"
                        ? "border-rose-600 bg-rose-50 text-rose-900"
                        : "border-amber-600 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                )}
              >
                {evidenceReviewLabels[status]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProactiveAlerts({
  mapping,
  onSelectRelation,
}: {
  mapping: LiteraryMapping;
  onSelectRelation: (relationId: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {mapping.mappingRelations.slice(0, 3).map((relation, index) => (
        <button
          key={relation.id}
          type="button"
          onClick={() => onSelectRelation(relation.id)}
          className="group border border-amber-200 bg-amber-50 px-3 py-2 text-left transition hover:border-amber-400 hover:bg-amber-100"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              提醒 {index + 1}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              {importanceLabels[relation.importance]}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium leading-5 text-slate-950">
            {relation.carrierRelation}
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-600">
            接受解释前，先看这条关系是否真的被原文支撑。
          </div>
        </button>
      ))}
    </div>
  );
}

function MeaningCanvas({
  mapping,
  replacement,
  activeRelationId,
  onSelectRelation,
}: {
  mapping: LiteraryMapping;
  replacement: ReplacementAnalysis;
  activeRelationId: string;
  onSelectRelation: (relationId: string) => void;
}) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Network className="h-4 w-4" />
        含义画布
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        当前分析提出的建议关系。每个节点都是可编辑证据，不是最终结论。
      </p>
      <div className="mt-3 min-h-64 border border-slate-200 bg-slate-50 p-3">
        <div className="grid gap-3">
          <div className="border border-amber-300 bg-amber-50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              建议的载体节点
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-950">{mapping.concreteCarrier.name}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {mapping.concreteCarrier.attributes.slice(0, 4).map((attribute, index) => (
                <span
                  key={`${attribute}_${index}`}
                  className="border border-amber-200 bg-white px-2 py-1 text-[11px] text-amber-900"
                >
                  {attribute}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            {mapping.mappingRelations.slice(0, 4).map((relation) => (
              <button
                key={relation.id}
                type="button"
                onClick={() => onSelectRelation(relation.id)}
                className={cx(
                  "border p-3 text-left transition",
                  activeRelationId === relation.id
                    ? "border-teal-600 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-slate-400"
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  自动推理关系
                </div>
                <div className="mt-1 text-sm leading-5 text-slate-900">{relation.meaningRelation}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["preserved", "weakened", "emergent", "broken"] as const).map((status) => {
              const style = statusStyles[status];
              const count = replacement.comparisons.filter((item) => item.status === status).length;
              return (
                <div key={status} className={cx("border p-2 text-center", style.className)}>
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-[11px] font-semibold uppercase">{style.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeaderModeBar({
  appMode,
  showResearchTools,
  displayAudience,
  onModeChange,
  onResearchToggle,
}: {
  appMode: AppExperienceMode;
  showResearchTools: boolean;
  displayAudience: DisplayAudience;
  onModeChange: (mode: AppExperienceMode) => void;
  onResearchToggle: (enabled: boolean) => void;
}) {
  const isResearcher = displayAudience === "researcher";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">角色入口</div>
        <div className="flex items-center gap-2">
          <span className="border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            {isResearcher ? "实验员后台" : "Reader Workspace"}
          </span>
          {isResearcher ? (
            <button
              type="button"
              onClick={() => {
                onResearchToggle(false);
                onModeChange("reader");
              }}
              className="border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-500"
            >
              预览参与者阅读
            </button>
          ) : null}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">阅读流程</div>
        <div className="inline-flex border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => onModeChange("reader")}
            className={cx(
              "px-3 py-1.5 text-sm font-medium",
              appMode === "reader" ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            读原文
          </button>
          <button
            type="button"
            onClick={() => onModeChange("polish")}
            className={cx(
              "px-3 py-1.5 text-sm font-medium",
              appMode === "polish" ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            整理解释
          </button>
        </div>
      </div>
      {isResearcher ? (
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">研究者层</div>
        <button
          type="button"
          onClick={() => onResearchToggle(!showResearchTools)}
          title="打开同一阅读流程的研究者检查层"
          className={cx(
            "border px-3 py-2 text-sm font-medium",
            showResearchTools
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-500 hover:text-slate-800"
          )}
        >
          {showResearchTools ? "隐藏检查层" : "检查层"}
        </button>
      </div>
      ) : null}
    </div>
  );
}

function MeaningLensPanel({
  mapping,
  replacement,
  relation,
  evidence,
  interpretationDecision = "pending",
  showResearchControls = true,
  onReplacementSelect,
  onInterpretationDecision,
  onReturnToReading,
  onPolish,
}: {
  mapping: LiteraryMapping;
  replacement: ReplacementAnalysis;
  relation?: MappingRelation;
  evidence: LiteraryEvidence[];
  interpretationDecision?: InterpretationDecision;
  showResearchControls?: boolean;
  onReplacementSelect: (replacementId: string) => void;
  onInterpretationDecision?: (decision: InterpretationDecision) => void;
  onReturnToReading?: () => void;
  onPolish: () => void;
}) {
  const grouped = {
    preserved: replacement.comparisons.filter((item) => item.status === "preserved"),
    weakened: replacement.comparisons.filter((item) => item.status === "weakened"),
    broken: replacement.comparisons.filter((item) => item.status === "broken"),
    emergent: replacement.comparisons.filter((item) => item.status === "emergent"),
  };
  const primaryEvidence = evidence[0] ?? mapping.evidence[0];
  const storyCandidates = mapping.candidateCarriers ?? [];
  const spotlightText = mapping.passage || mapping.selectedSpan;
  const lensSteps = [
    "点亮原文",
    "看见载体",
    "试换意象",
    "观察变化",
    "收束解释",
  ];
  const compactDraft = `“${mapping.selectedSpan}”可能指向“${
    mapping.broaderMeaningHypotheses[0] || "某种更抽象的意义"
  }”；把它换成“${replacement.replacementCarrier}”后，读者可以看见原意象具体支撑了哪些关系。`;
  const activeReplacementGate = evaluateReplacementGate(replacement);
  const provenanceLabel =
    mapping.analysisProvenance?.source === "demo"
      ? "研究者整理材料"
      : mapping.analysisProvenance?.source === "local_scaffold"
        ? "本地脚手架试探"
        : "模型辅助试探";
  const packetProtocol = mapping.analysisProvenance?.packetProtocol;
  const packetStatus = packetProtocol ? packetStatusLabels[packetProtocol.status] : "未标记";
  const packetMethod = packetProtocol ? packetMethodLabels[packetProtocol.constructionMethod] : "待补充";

  return (
    <section className="border border-teal-200 bg-white">
      <div className="border-b border-teal-100 bg-teal-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
              <Sparkles className="h-4 w-4" />
              临时 Meaning Lens
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {showResearchControls ? "先体验意义怎么变，再展开解释" : `聚焦“${mapping.selectedSpan}”`}
            </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-900">
            {showResearchControls
              ? "这不是漫画生成，也不是权威批注。系统只把一个可能的读法拆成可滚动、可替换、可挑战的推测步骤。"
              : "这是从连续阅读中临时展开的一层。你可以试着替换这个线索，看看原来的读法哪里还站得住。"}
          </p>
          {showResearchControls ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="border border-teal-200 bg-white px-2.5 py-1 font-medium text-teal-900">
              原文证据：片段引文
            </span>
            <span className="border border-teal-200 bg-white px-2.5 py-1 font-medium text-teal-900">
              整理材料：{mapping.analysisProvenance?.source === "demo" ? "已校准示例" : "未校准"}
            </span>
            <span className="border border-teal-200 bg-white px-2.5 py-1 font-medium text-teal-900">
              读者动作：替换载体
            </span>
            <span className="border border-teal-200 bg-white px-2.5 py-1 font-medium text-teal-900">
              模型/脚手架：{provenanceLabel}
            </span>
            <span className="border border-teal-200 bg-white px-2.5 py-1 font-medium text-teal-900">
              材料状态：{packetMethod} / {packetStatus}
            </span>
          </div>
          ) : null}
        </div>
          {showResearchControls ? (
          <button
            type="button"
            onClick={onPolish}
            className="border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            展开证据与草稿
          </button>
          ) : null}
        </div>
      </div>

      <div className={cx("grid gap-0", showResearchControls ? "lg:grid-cols-[170px_1fr]" : "")}>
        {showResearchControls ? (
        <aside className="hidden border-r border-slate-200 bg-slate-50 p-4 lg:block">
          <div className="sticky top-4 space-y-2">
            {lensSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="flex h-6 w-6 items-center justify-center border border-slate-300 bg-white font-semibold text-slate-800">
                  {index + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </aside>
        ) : null}

        <div>
          {!showResearchControls ? (
            <div className="border-b border-teal-100 bg-white p-4">
              <div className="grid gap-2 md:grid-cols-4">
                {[
                  ["1", "看原文依据"],
                  ["2", "确认这个线索"],
                  ["3", "试着替换"],
                  ["4", "留下判断"],
                ].map(([step, label]) => (
                  <div key={step} className="border border-teal-100 bg-teal-50 px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Lens {step}</div>
                    <div className="mt-0.5 text-sm font-semibold text-teal-950">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <article className="min-h-[360px] border-b border-slate-200 bg-[#fbfbf8] p-5 lg:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {showResearchControls ? "Step 1 / 点亮原文" : "原文中的线索"}
            </div>
            <div className="mt-4 max-w-3xl">
              <HighlightedPassage
                passage={spotlightText}
                span={mapping.selectedSpan}
                relatedSpans={candidateDisplayAnchors(storyCandidates)}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="border border-amber-200 bg-white px-3 py-2 font-semibold text-amber-900">
                当前聚焦：{mapping.selectedSpan}
              </span>
              {storyCandidates
                .filter((candidate) => candidate.span !== mapping.selectedSpan)
                .slice(0, 4)
                .map((candidate) => (
                  <span key={candidate.id} className="border border-teal-100 bg-white px-3 py-2 text-teal-900">
                    周边线索：{candidate.label}
                  </span>
                ))}
            </div>
          </article>

          <article className="min-h-[320px] border-b border-slate-200 bg-white p-5 lg:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {showResearchControls ? "Step 2 / 看见载体" : "它在文本里怎样起作用"}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
              <div className="border border-amber-200 bg-amber-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {showResearchControls ? "具体载体" : "当前线索"}
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{mapping.concreteCarrier.name}</div>
                {showResearchControls ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {mapping.concreteCarrier.attributes.slice(0, 5).map((attribute, index) => (
                    <span
                      key={`${attribute}_${index}`}
                      className="border border-amber-200 bg-white px-2 py-1 text-xs text-amber-900"
                    >
                      {attribute}
                    </span>
                  ))}
                </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-amber-950">
                    先把它当作一个可追踪的阅读线索，而不是一个已经确定含义的符号。
                  </p>
                )}
              </div>
              <div className="flex items-center border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-slate-800">
                {relation?.carrierRelation || mapping.concreteCarrier.relations[0]}
              </div>
            </div>
          </article>

          <article className="min-h-[320px] border-b border-slate-200 bg-indigo-50 p-5 lg:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
              {showResearchControls ? "Step 3 / 试换意象" : "试着换一下"}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-950">
              替换不是改写原文，而是一个小测试：如果这个线索换掉，原来的解释还能站住吗？
            </p>
            <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {mapping.replacements.slice(0, 4).map((item) => (
                (() => {
                  const gate = evaluateReplacementGate(item);
                  const gateStyle = replacementGateLabels[gate.level];
                  const strategy = item.replacementStrategy ?? "near_neighbor";
                  return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onReplacementSelect(item.id)}
                  className={cx(
                    "border px-4 py-3 text-left text-sm font-medium",
                    item.id === replacement.id
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-indigo-200 bg-white text-slate-800 hover:border-indigo-500"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold uppercase opacity-75">试着换成</div>
                    <span
                      className={cx(
                        "border px-1.5 py-0.5 text-[10px] font-semibold",
                        item.id === replacement.id
                          ? "border-white/40 bg-white/20 text-white"
                          : replacementStrategyLabels[item.replacementStrategy ?? "near_neighbor"].className
                      )}
                    >
                      {replacementStrategyLabels[item.replacementStrategy ?? "near_neighbor"].label}
                    </span>
                  </div>
                  <div className="mt-1 text-base">{item.replacementCarrier}</div>
                  <div className={cx("mt-2 text-[11px]", item.id === replacement.id ? "text-teal-50" : "text-slate-500")}>
                    {replacementStrategyPurposes[strategy]}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span
                      className={cx(
                        "border px-1.5 py-0.5 text-[10px] font-semibold",
                        item.id === replacement.id ? "border-white/40 bg-white/20 text-white" : gateStyle.className
                      )}
                    >
                      {gateStyle.label}
                    </span>
                    <span className={cx("text-[10px]", item.id === replacement.id ? "text-teal-50" : "text-slate-500")}>
                      {gate.passedCount}/5
                    </span>
                  </div>
                </button>
                  );
                })()
              ))}
            </div>
            <div className="mt-4 border border-indigo-200 bg-white p-3 text-sm leading-6 text-indigo-950">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">为什么选这个替换：</span>
                <span>{replacement.purpose}</span>
                <span className={cx("border px-2 py-0.5 text-xs font-semibold", replacementGateLabels[activeReplacementGate.level].className)}>
                  {replacementGateLabels[activeReplacementGate.level].label}
                </span>
              </div>
              <div className="mt-2 text-xs leading-5 text-indigo-800">
                好的替换不是找“更好词”，而是保留一个可比较锚点，同时改变一条关键关系。
              </div>
            </div>
          </article>

          <article className="min-h-[360px] border-b border-slate-200 bg-white p-5 lg:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {showResearchControls ? "Step 4 / 观察变化" : "观察意义变化"}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-4">
              {(["preserved", "weakened", "emergent", "broken"] as const).map((status) => {
                const style = statusStyles[status];
                const Icon = style.icon;
                const plainLabel =
                  status === "preserved" ? "还在" : status === "weakened" ? "变弱" : status === "emergent" ? "新出现" : "断裂";
                return (
                  <section key={status} className={cx("border p-4", style.className)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <h3 className="text-base font-semibold">{plainLabel}</h3>
                      </div>
                      <span className="border border-white/70 bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                        {grouped[status].length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {grouped[status].slice(0, 3).map((item) => (
                        <div key={item.id} className="border border-white/70 bg-white/80 p-3">
                          <div className="text-sm font-semibold">{item.title}</div>
                          <p className="mt-1 text-xs leading-5">{item.explanation}</p>
                        </div>
                      ))}
                      {grouped[status].length === 0 ? (
                        <div className="border border-white/70 bg-white/70 p-3 text-xs leading-5">
                          这次替换暂时没有这一类变化。
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <article className="min-h-[300px] bg-slate-950 p-5 text-white lg:p-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-200">
              {showResearchControls ? "Step 5 / 收束解释" : "留下你的判断"}
            </div>
            <p className="mt-5 max-w-3xl text-xl leading-8">{compactDraft}</p>
            {!showResearchControls && onInterpretationDecision ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {([
                  ["kept", "说得通"],
                  ["revise", "需要修改"],
                  ["pending", "还不确定"],
                ] as Array<[InterpretationDecision, string]>).map(([decision, label]) => (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => onInterpretationDecision(decision)}
                    className={cx(
                      "border px-3 py-2 text-sm font-medium",
                      interpretationDecision === decision
                        ? "border-white bg-white text-slate-950"
                        : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(compactDraft)}
              className="mt-5 inline-flex items-center gap-2 border border-white bg-white px-3 py-2 text-sm font-medium text-slate-950"
            >
              <Download className="h-4 w-4" />
              复制这一句
            </button>
            {!showResearchControls && onReturnToReading ? (
              <button
                type="button"
                onClick={onReturnToReading}
                className="ml-2 mt-5 inline-flex items-center gap-2 border border-white/40 bg-transparent px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                回到原文继续读
              </button>
            ) : null}
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="border border-white/20 bg-white/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">证据预览</div>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {primaryEvidence ? primaryEvidence.excerpt : "展开证据与草稿后可以查看文本证据。"}
                </p>
              </div>
              {showResearchControls ? (
              <div className="border border-white/20 bg-white/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">下一步</div>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  如果这条推测有启发，再整理证据与解释；如果不成立，回到线索或换一个替换意象。
                </p>
                <button
                  type="button"
                  onClick={onPolish}
                  className="mt-3 border border-white bg-white px-3 py-2 text-sm font-medium text-slate-950"
                >
                  查看推理过程
                </button>
              </div>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function StudyModeSwitch({
  condition,
  onChange,
}: {
  condition: StudyCondition;
  onChange: (condition: StudyCondition) => void;
}) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <ClipboardCheck className="h-4 w-4" />
        研究条件
      </div>
      <div className="mt-3 grid gap-2">
        {(Object.keys(conditionLabels) as StudyCondition[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cx(
              "border px-3 py-2 text-left transition",
              condition === item
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            )}
          >
            <div className="text-sm font-semibold">{conditionLabels[item].label}</div>
            <div className={cx("mt-1 text-xs", condition === item ? "text-slate-200" : "text-slate-500")}>
              {conditionLabels[item].description}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function StudyLogPanel({ events }: { events: StudyLogEvent[] }) {
  const exportText = events
    .map((event) => `${new Date(event.timestamp).toISOString()}\t${event.type}\t${event.detail}`)
    .join("\n");

  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <History className="h-4 w-4" />
          学习日志
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(exportText)}
          className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
        >
          <Download className="h-3 w-3" />
          复制
        </button>
      </div>
      <div className="mt-3 max-h-52 space-y-2 overflow-auto">
        {events.length === 0 ? (
          <div className="border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            交互事件会出现在这里，用于 formative study / user study 试运行。
          </div>
        ) : (
          events.slice(0, 10).map((event) => (
            <div key={event.id} className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-700">
              <div className="font-semibold text-slate-950">{event.type}</div>
              <div>{event.detail}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

type ChecklistStatus = "complete" | "weak" | "missing" | "not_applicable";
type CheckSeverity = "info" | "warning" | "blocking";

const checklistStatusLabels: Record<ChecklistStatus, string> = {
  complete: "完成",
  weak: "偏弱",
  missing: "缺失",
  not_applicable: "不适用",
};

const checklistStatusStyles: Record<ChecklistStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-900",
  weak: "border-amber-200 bg-amber-50 text-amber-900",
  missing: "border-rose-200 bg-rose-50 text-rose-900",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-600",
};

const checkSeverityStyles: Record<CheckSeverity, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  blocking: "border-rose-200 bg-rose-50 text-rose-900",
};

const typeChecklistTemplates: Record<CarrierType, Array<{ id: string; prompt: string; keywords: string[] }>> = {
  object: [
    { id: "object-attribute", prompt: "说明物件属性、材质、用途或可见特征", keywords: ["属性", "物件", "食物", "馒头", "血", "药", "颜色", "用途"] },
    { id: "object-body", prompt: "说明身体接触、食用、拿取或使用方式", keywords: ["身体", "吃", "吃下", "拿", "使用", "接触", "病"] },
    { id: "object-social", prompt: "说明交换、消费、遮蔽或社会关系", keywords: ["交换", "消费", "社会", "交易", "看客", "遮蔽", "暴力"] },
  ],
  action: [
    { id: "action-agent", prompt: "说明行动者或动作发出者", keywords: ["行动者", "横肉", "小栓", "谁", "说话者", "人物"] },
    { id: "action-sequence", prompt: "说明动作顺序、时间性或急迫性", keywords: ["顺序", "时间", "趁热", "急迫", "流程", "拿来"] },
    { id: "action-body", prompt: "说明身体参与或仪式化动作", keywords: ["身体", "吃下", "仪式", "治疗流程", "执行"] },
  ],
  discourse: [
    { id: "discourse-speaker", prompt: "说明说话者、听众和话语场景", keywords: ["说话者", "听众", "嚷", "横肉", "众人"] },
    { id: "discourse-repetition", prompt: "说明重复、语气或承诺形式", keywords: ["重复", "包好", "承诺", "语气", "确定"] },
    { id: "discourse-authority", prompt: "说明话语如何制造权威、命名或关系倒转", keywords: ["权威", "命名", "保证", "确信", "倒转"] },
  ],
  scene_ritual: [
    { id: "scene-participants", prompt: "说明参与者和公共场景", keywords: ["参与者", "公共", "茶馆", "看客", "众人", "场景"] },
    { id: "scene-rules", prompt: "说明规则、禁忌或仪式步骤", keywords: ["规则", "禁忌", "仪式", "步骤", "祝福"] },
    { id: "scene-exclusion", prompt: "说明谁被包含、排除或遮蔽", keywords: ["排除", "遮蔽", "包含", "拒绝", "资格"] },
  ],
  sensory_image: [
    { id: "sensory-feature", prompt: "说明颜色、声音、气味、光线等感官特征", keywords: ["颜色", "声音", "气味", "光", "月", "香", "蛙声", "圆月"] },
    { id: "sensory-affect", prompt: "说明情绪、记忆或空间方向", keywords: ["情绪", "记忆", "故乡", "空间", "方向", "童年"] },
    { id: "sensory-contrast", prompt: "说明感官图像与前后文的对照", keywords: ["对照", "现实", "落差", "后文", "反差"] },
  ],
};

const probeTemplateLibrary: Record<CarrierType, Array<{ type: string; label: string; purpose: string; risk: string }>> = {
  object: [
    { type: "near-object", label: "近邻物件", purpose: "保留物件类别，测试关键属性是否不可替代。", risk: "低" },
    { type: "same-function object", label: "同功能物件", purpose: "保留功能，测试文化/社会关系是否断裂。", risk: "中" },
    { type: "cultural-variant object", label: "文化变体", purpose: "保留文化功能，测试身体或物质关系是否消失。", risk: "中" },
  ],
  action: [
    { type: "changed-timing", label: "改变时序", purpose: "测试时间性、急迫性和动作流程。", risk: "低" },
    { type: "reduced-intensity", label: "降低强度", purpose: "测试动作力度是否支撑意义强度。", risk: "中" },
    { type: "removed-action", label: "移除动作", purpose: "测试没有身体执行时核心关系是否断裂。", risk: "高" },
  ],
  discourse: [
    { type: "paraphrase", label: "改写话语", purpose: "测试原话语的语气和承诺形式。", risk: "低" },
    { type: "remove-repetition", label: "去掉重复", purpose: "测试重复是否制造权威和确信。", risk: "低" },
    { type: "change-speaker", label: "更换说话者", purpose: "测试权力关系和话语来源。", risk: "中" },
  ],
  scene_ritual: [
    { type: "ordinary-scene", label: "普通场景", purpose: "测试去仪式化后公共规则是否还成立。", risk: "中" },
    { type: "changed-participant-rule", label: "改变参与规则", purpose: "测试包含/排除机制。", risk: "中" },
    { type: "de-ritualized-scene", label: "去仪式化", purpose: "测试仪式步骤如何组织意义。", risk: "高" },
  ],
  sensory_image: [
    { type: "changed-color-light", label: "改变颜色/光线", purpose: "测试感官方向和情绪氛围。", risk: "低" },
    { type: "changed-sound-smell", label: "改变声音/气味", purpose: "测试多感官场景是否仍支撑意义。", risk: "中" },
    { type: "changed-memory-frame", label: "改变记忆框架", purpose: "测试图像与记忆/现实落差的关系。", risk: "高" },
  ],
};

function textForPacket(mapping: LiteraryMapping) {
  return [
    mapping.selectedSpan,
    mapping.concreteCarrier?.name,
    ...(mapping.concreteCarrier?.attributes ?? []),
    ...(mapping.concreteCarrier?.relations ?? []),
    ...mapping.mappingRelations.flatMap((relation) => [relation.carrierRelation, relation.meaningRelation]),
    ...mapping.evidence.flatMap((item) => [item.excerpt, item.note]),
  ].join(" ");
}

function scoreChecklistItem(mapping: LiteraryMapping, keywords: string[]): ChecklistStatus {
  const packetText = textForPacket(mapping);
  const matchedKeywords = keywords.filter((keyword) => packetText.includes(keyword)).length;
  const directEvidenceCount = mapping.evidence.filter((item) => item.groundedness === "direct_quote").length;
  if (matchedKeywords >= 2 && directEvidenceCount > 0) return "complete";
  if (matchedKeywords >= 1) return "weak";
  return "missing";
}

function buildTypeChecklist(mapping: LiteraryMapping) {
  const activeTypes = normalizedCarrierTypeList(mapping.carrierTypes);
  const resolvedTypes = activeTypes.length > 0 ? activeTypes : inferCarrierTypes(mapping);
  return resolvedTypes.flatMap((type) =>
    typeChecklistTemplates[type].map((item) => ({
      id: item.id,
      type,
      prompt: item.prompt,
      status: scoreChecklistItem(mapping, item.keywords),
    }))
  );
}

function buildConsistencyChecks(mapping: LiteraryMapping) {
  const checks: Array<{ id: string; severity: CheckSeverity; title: string; message: string; action: string }> = [];
  const activeTypes = normalizedCarrierTypeList(mapping.carrierTypes);
  const importantRelations = mapping.mappingRelations.filter((relation) => relation.importance === "high");
  const evidenceById = Object.fromEntries(mapping.evidence.map((item) => [item.id, item]));
  const directEvidenceCount = mapping.evidence.filter((item) => item.groundedness === "direct_quote").length;
  const inferredEvidenceCount = mapping.evidence.filter((item) => item.groundedness === "inference").length;
  const comparisons = mapping.replacements.flatMap((replacement) => replacement.comparisons);
  const comparisonStatuses = new Set(comparisons.map((comparison) => comparison.status));

  if (!mapping.passage.includes(mapping.selectedSpan) && !mapping.passage.includes(mapping.concreteCarrier.name)) {
    checks.push({
      id: "carrier-observability",
      severity: "warning",
      title: "Carrier observability",
      message: "当前 carrier 不容易在 passage 中直接定位。",
      action: "确认 span 是否过宽，或补充 direct quote anchor。",
    });
  }

  if (activeTypes.length === 0) {
    checks.push({
      id: "type-coverage",
      severity: "blocking",
      title: "Type coverage",
      message: "当前 packet 缺少 carrierTypes。",
      action: "先标记物件/动作/话语/场景仪式/感官图像类型。",
    });
  }

  importantRelations.forEach((relation) => {
    const boundEvidence = relation.evidenceIds.map((id) => evidenceById[id]).filter(Boolean);
    if (boundEvidence.length === 0) {
      checks.push({
        id: `evidence-${relation.id}`,
        severity: "blocking",
        title: "Evidence binding",
        message: `高重要关系缺少证据：${relation.carrierRelation}`,
        action: "绑定 direct quote，或降低该关系重要性。",
      });
    } else if (!boundEvidence.some((item) => item.groundedness === "direct_quote")) {
      checks.push({
        id: `evidence-weak-${relation.id}`,
        severity: "warning",
        title: "Evidence strength",
        message: `高重要关系主要依赖转述/推断：${relation.carrierRelation}`,
        action: "补充原文短引或明确标记为 cultural/contextual inference。",
      });
    }
  });

  mapping.mappingRelations.forEach((relation) => {
    if (relation.meaningRelation.length < 12 || /主题|意义|象征$/.test(relation.meaningRelation.trim())) {
      checks.push({
        id: `specificity-${relation.id}`,
        severity: "warning",
        title: "Relation specificity",
        message: `关系可能过于泛化：${relation.meaningRelation}`,
        action: "说明 carrier 如何通过属性、动作、话语或场景关系支撑该意义。",
      });
    }
  });

  if (mapping.replacements.some((replacement) => !replacement.purpose.trim())) {
    checks.push({
      id: "replacement-purpose",
      severity: "blocking",
      title: "Replacement diagnosticity",
      message: "存在没有 diagnostic purpose 的 replacement。",
      action: "为每个 replacement 写明它测试哪条 relation。",
    });
  }

  const weakReplacement = mapping.replacements.find((replacement) => evaluateReplacementGate(replacement).level === "weak");
  if (weakReplacement) {
    checks.push({
      id: `replacement-gate-${weakReplacement.id}`,
      severity: "blocking",
      title: "Replacement selection gate",
      message: `替换“${weakReplacement.replacementCarrier}”诊断性不足，可能像任意改写。`,
      action: "补充可比较锚点、target relation、诊断问题和 P/W/E/B 后果，或删除该替换。",
    });
  }

  if (!comparisonStatuses.has("weakened") || !comparisonStatuses.has("broken")) {
    checks.push({
      id: "consequence-coverage",
      severity: "warning",
      title: "Consequence coverage",
      message: "当前 replacement consequences 对 meaning loss / broken boundary 覆盖不足。",
      action: "至少补充一条变弱或断裂后果，帮助读者看见不可替代性。",
    });
  }

  if (directEvidenceCount === 0 && inferredEvidenceCount > 0) {
    checks.push({
      id: "provenance-risk",
      severity: "warning",
      title: "Provenance risk",
      message: "当前 packet 主要依赖推断材料，原文证据偏少。",
      action: "在 reader-facing UI 中降低权威感，并补充 direct evidence peek。",
    });
  }

  if (mapping.analysisProvenance?.packetProtocol?.status === "llm_draft") {
    checks.push({
      id: "status-gating",
      severity: "info",
      title: "Status gating",
      message: "LLM draft 只能 exploration-only，不能直接进入正式 study。",
      action: "完成 researcher curation 和 expert quick check 后再升级状态。",
    });
  }

  return checks;
}

function buildProbeTemplateSuggestions(mapping: LiteraryMapping) {
  const activeTypes = normalizedCarrierTypeList(mapping.carrierTypes);
  const resolvedTypes = activeTypes.length > 0 ? activeTypes : inferCarrierTypes(mapping);
  const existingStrategies = new Set(mapping.replacements.map((replacement) => replacement.replacementStrategy));
  return resolvedTypes.flatMap((type) =>
    probeTemplateLibrary[type].map((template) => ({
      ...template,
      carrierType: type,
      covered:
        (template.type === "near-object" && existingStrategies.has("near_neighbor")) ||
        (template.type === "cultural-variant object" && existingStrategies.has("cultural_variant")) ||
        (template.type === "same-function object" && existingStrategies.has("oppositional")) ||
        (template.type === "changed-timing" && existingStrategies.has("oppositional")) ||
        existingStrategies.has("literalizing"),
    }))
  );
}

function computePacketReadiness(mapping: LiteraryMapping, checklist: ReturnType<typeof buildTypeChecklist>, checks: ReturnType<typeof buildConsistencyChecks>) {
  const blockingCount = checks.filter((check) => check.severity === "blocking").length;
  const warningCount = checks.filter((check) => check.severity === "warning").length;
  const missingChecklistCount = checklist.filter((item) => item.status === "missing").length;
  const weakChecklistCount = checklist.filter((item) => item.status === "weak").length;
  const protocolStatus = mapping.analysisProvenance?.packetProtocol?.status;

  if (blockingCount > 0 || missingChecklistCount >= 2) {
    return {
      status: "needs_researcher_revision",
      label: "需要研究者修订",
      className: "border-rose-200 bg-rose-50 text-rose-900",
      reasons: [`阻断项 ${blockingCount}`, `缺失检查项 ${missingChecklistCount}`],
    };
  }

  if (protocolStatus === "expert_checked" || protocolStatus === "pilot_ready" || protocolStatus === "study_ready") {
    return {
      status: "pilot_ready_candidate",
      label: "可作为 pilot 候选",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      reasons: ["已通过较高 packet status", `警告项 ${warningCount}`],
    };
  }

  if (warningCount <= 2 && weakChecklistCount <= 2 && mapping.replacements.length > 0) {
    return {
      status: "ready_for_expert_check",
      label: "可送专家快检",
      className: "border-teal-200 bg-teal-50 text-teal-900",
      reasons: [`警告项 ${warningCount}`, `偏弱检查项 ${weakChecklistCount}`],
    };
  }

  return {
    status: "exploration_only",
    label: "仅供探索",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    reasons: [`警告项 ${warningCount}`, `偏弱检查项 ${weakChecklistCount}`],
  };
}

function ResearchAuthoringV2Panel({ mapping }: { mapping: LiteraryMapping }) {
  const checklist = buildTypeChecklist(mapping);
  const checks = buildConsistencyChecks(mapping);
  const templates = buildProbeTemplateSuggestions(mapping);
  const readiness = computePacketReadiness(mapping, checklist, checks);
  const blockingCount = checks.filter((check) => check.severity === "blocking").length;
  const warningCount = checks.filter((check) => check.severity === "warning").length;

  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ClipboardCheck className="h-4 w-4" />
            Research Tools V2
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            把 carrier type 转成可执行的 authoring checks。此面板只给研究者使用。
          </p>
        </div>
        <span className={cx("shrink-0 border px-2 py-1 text-[11px] font-semibold", readiness.className)}>
          {readiness.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{checklist.length}</div>
          <div className="mt-1 text-slate-500">Checklist</div>
        </div>
        <div className="border border-amber-200 bg-amber-50 p-2 text-amber-900">
          <div className="font-semibold">{warningCount}</div>
          <div className="mt-1">Warnings</div>
        </div>
        <div className="border border-rose-200 bg-rose-50 p-2 text-rose-900">
          <div className="font-semibold">{blockingCount}</div>
          <div className="mt-1">Blocking</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Type-specific Checklist</div>
        <div className="mt-2 space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={cx("mr-1 border px-1.5 py-0.5 text-[10px]", carrierTypeLabels[item.type].className)}>
                    {carrierTypeLabels[item.type].label}
                  </span>
                  <span className="text-slate-700">{item.prompt}</span>
                </div>
                <span className={cx("shrink-0 border px-1.5 py-0.5 text-[10px]", checklistStatusStyles[item.status])}>
                  {checklistStatusLabels[item.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">2. Evidence Gap Check</div>
        <div className="mt-2 space-y-2">
          {checks.length === 0 ? (
            <div className="border border-emerald-200 bg-emerald-50 p-2 text-xs leading-5 text-emerald-900">
              暂未发现明显 packet gap。仍需研究者和文学训练者确认文学有效性。
            </div>
          ) : (
            checks.slice(0, 6).map((check) => (
              <div key={check.id} className={cx("border p-2 text-xs leading-5", checkSeverityStyles[check.severity])}>
                <div className="font-semibold">{check.title}</div>
                <div className="mt-1">{check.message}</div>
                <div className="mt-1 opacity-80">建议：{check.action}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">3. Probe Template Suggestions</div>
        <div className="mt-2 space-y-2">
          {templates.slice(0, 6).map((template) => (
            <div key={`${template.carrierType}_${template.type}`} className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-950">{template.label}</div>
                <span className={cx(
                  "border px-1.5 py-0.5 text-[10px]",
                  template.covered ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600"
                )}>
                  {template.covered ? "已有类似探针" : `风险 ${template.risk}`}
                </span>
              </div>
              <div className="mt-1 text-slate-600">{template.purpose}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={cx("mt-4 border p-3 text-xs leading-5", readiness.className)}>
        <div className="font-semibold">4. Packet Readiness</div>
        <div className="mt-1">{readiness.label}</div>
        <div className="mt-1">{readiness.reasons.join(" / ")}</div>
        <div className="mt-2 opacity-80">
          系统只能建议 readiness，不能自动升级为 study_ready。
        </div>
      </div>
    </section>
  );
}

function LiterarySubstratePanel({
  substrate,
  activePassageId,
}: {
  substrate: LiterarySubstrate | null;
  activePassageId: string;
}) {
  const activeNode = substrate?.nodesByPassageId[activePassageId];
  const statusLabel: Record<LiterarySubstrateCalibrationStatus, string> = {
    unscanned: "未扫描",
    uncalibrated_draft: "未校准草稿",
    researcher_curated: "研究者整理",
    expert_checked: "专家快检",
    study_ready: "正式 study",
  };

  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Network className="h-4 w-4" />
          结构化文学底座
        </div>
        {substrate ? (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(JSON.stringify(substrate, null, 2))}
            className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
          >
            <Download className="h-3 w-3" />
            导出 substrate
          </button>
        ) : null}
      </div>
      {substrate ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="border border-slate-200 bg-slate-50 p-2">
              <div className="font-semibold text-slate-950">
                {substrate.coverage.scannedPassages}/{substrate.coverage.totalPassages}
              </div>
              <div className="mt-1 text-slate-500">目录节点</div>
            </div>
            <div className="border border-teal-200 bg-teal-50 p-2 text-teal-900">
              <div className="font-semibold">{substrate.summary.candidateCount}</div>
              <div className="mt-1">线索索引</div>
            </div>
            <div className="border border-amber-200 bg-amber-50 p-2 text-amber-900">
              <div className="font-semibold">{substrate.summary.semanticAnomalyCount}</div>
              <div className="mt-1">异常信号</div>
            </div>
          </div>
          {activeNode ? (
            <div className="mt-3 border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-950">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">当前节点：{activeNode.label}</div>
                <span className="border border-indigo-200 bg-white px-2 py-0.5 text-[11px]">
                  {statusLabel[activeNode.calibrationStatus]}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>文本单元：{activeNode.unitKinds.join(" / ")}</div>
                <div>线索：{activeNode.candidateCount}</div>
                <div>实体：{activeNode.entities.slice(0, 3).join("、") || "待抽取"}</div>
                <div>动作：{activeNode.actions.slice(0, 3).join("、") || "待抽取"}</div>
              </div>
              {activeNode.semanticAnomalies.length > 0 ? (
                <div className="mt-2 border border-indigo-200 bg-white p-2">
                  语义异常：{activeNode.semanticAnomalies.join(" / ")}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3 border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <div className="font-semibold text-slate-950">Top carriers</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {substrate.carrierIndex.slice(0, 8).map((carrier) => (
                <span key={`${carrier.span}_${carrier.passageIds.join("_")}`} className="border border-slate-200 bg-white px-2 py-1">
                  {carrier.label} · {carrier.occurrenceCount}
                </span>
              ))}
              {substrate.carrierIndex.length === 0 ? <span>还没有线索索引。</span> : null}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          当前材料还没有建立全文结构化底座。载入全文或导入文本后，系统会先构建 reading index、线索索引、异常信号和校准状态。
        </div>
      )}
    </section>
  );
}

function MaterialBuilderPanel({
  work,
  passage,
  mapping,
  candidateScan,
  substrate,
  activeExcerptWordCount,
  candidateMarkedCount,
  selectedCandidateCount,
  onMarkPacketStatus,
}: {
  work: LiteraryWork;
  passage: LiteraryPassage;
  mapping: LiteraryMapping;
  candidateScan: CandidateScanResult | null;
  substrate: LiterarySubstrate | null;
  activeExcerptWordCount: number;
  candidateMarkedCount: number;
  selectedCandidateCount: number;
  onMarkPacketStatus: (status: PacketValidationStatus) => void;
}) {
  const protocol = mapping.analysisProvenance?.packetProtocol;
  const packetStatus = protocol ? packetStatusLabels[protocol.status] : "未标记";
  const packetMethod = protocol ? packetMethodLabels[protocol.constructionMethod] : "待补充";
  const directEvidenceCount = mapping.evidence.filter((item) => item.groundedness === "direct_quote").length;
  const comparisonCounts = mapping.replacements
    .flatMap((replacement) => replacement.comparisons)
    .reduce<Record<ComparisonStatus, number>>(
      (counts, comparison) => ({
        ...counts,
        [comparison.status]: counts[comparison.status] + 1,
      }),
      { preserved: 0, weakened: 0, emergent: 0, broken: 0 }
    );
  const readerFrame = {
    currentPassage: passage.label,
    currentCarrier: mapping.selectedSpan,
    viewedEvidenceCount: directEvidenceCount,
    relationCount: mapping.mappingRelations.length,
    replacementProbeCount: mapping.replacements.length,
    candidateMarkedCount,
    selectedCandidateCount,
    packetStatus: protocol?.status ?? "unmarked",
  };
  const exportPayload = {
    packetType: "MeaningForge UIRR packet",
    representation: "Unified Interpretive Relation Representation",
    work: {
      title: work.title,
      author: work.author,
      language: work.language,
      tradition: work.tradition,
      sourceNote: work.sourceNote,
    },
    passage: {
      id: passage.id,
      label: passage.label,
      chapter: passage.chapter,
      length: activeExcerptWordCount,
      text: passage.text,
    },
    candidateScan,
    substrateSummary: substrate
      ? {
          id: substrate.id,
          coverage: substrate.coverage,
          summary: substrate.summary,
          activeNode: substrate.nodesByPassageId[passage.id],
          topCarriers: substrate.carrierIndex.slice(0, 12),
        }
      : null,
    mapping,
    auditSummary: {
      selectedCandidateCount,
      candidateMarkedCount,
      relationCount: mapping.mappingRelations.length,
      evidenceCount: mapping.evidence.length,
      directEvidenceCount,
      replacementCount: mapping.replacements.length,
      comparisonCounts,
      packetProtocol: protocol,
    },
    readerInterpretiveFrame: readerFrame,
  };
  const stages = [
    {
      label: "1 清洗与分段",
      value: `${work.passages.length} 个片段`,
      note: substrate
        ? `已建立 structured literary substrate：扫描 ${substrate.coverage.scannedPassages}/${substrate.coverage.totalPassages} 个目录节点。`
        : work.tradition === "Imported" ? "导入文本已做基础分段，仍需版本和版权检查。" : "内置文本已由研究者整理为短片段。",
    },
    {
      label: "2 发现线索",
      value: candidateScan ? `${candidateScan.candidates.length} 条线索` : "未发现",
      note: candidateScan
        ? `已标记 ${candidateMarkedCount}，已选择 ${selectedCandidateCount}。这些只是入口，不是解释结论。`
        : "可由模型或本地脚手架提出待校验线索。",
    },
    {
      label: "3 关系草稿",
      value: `${mapping.mappingRelations.length} 条关系`,
      note: "每条关系应说明 concrete carrier 如何支撑 broader meaning。",
    },
    {
      label: "4 证据 grounding",
      value: `${directEvidenceCount}/${mapping.evidence.length} 直接证据`,
      note: "关键关系必须能回到原文片段或明确的文化/叙事语境。",
    },
    {
      label: "5 替换探针",
      value: `${mapping.replacements.length} 个探针`,
      note: `保留 ${comparisonCounts.preserved}，变弱 ${comparisonCounts.weakened}，涌现 ${comparisonCounts.emergent}，断裂 ${comparisonCounts.broken}。`,
    },
  ];

  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Network className="h-4 w-4" />
          UIRR 材料构建层
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(exportPayload, null, 2))}
          className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
        >
          <Download className="h-3 w-3" />
          导出 packet
        </button>
      </div>
      <div className="mt-2 text-xs leading-5 text-slate-600">
        这个面板对应 VeriForge 式的材料准备逻辑：模型可以帮助清洗、分段和草拟，但 UIRR packet 必须经过研究者校准后才进入 study。
      </div>
      <div className="mt-3 grid gap-2">
        {stages.map((stage) => (
          <div key={stage.label} className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-950">{stage.label}</div>
              <div className="text-slate-500">{stage.value}</div>
            </div>
            <div className="mt-1 text-slate-600">{stage.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-950">
        <div className="font-semibold">当前 packet 状态</div>
        <div className="mt-1">
          {packetMethod} / {packetStatus}
        </div>
        {protocol?.validationNote ? <div className="mt-2 text-teal-900">{protocol.validationNote}</div> : null}
      </div>
      <div className="mt-3 border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-950">
        <div className="font-semibold">Reader Interpretive Frame</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>当前载体：{readerFrame.currentCarrier}</div>
          <div>关系：{readerFrame.relationCount}</div>
          <div>已绑定证据：{readerFrame.viewedEvidenceCount}</div>
          <div>替换探针：{readerFrame.replacementProbeCount}</div>
        </div>
      </div>
      {protocol?.requiredChecks?.length ? (
        <div className="mt-3 border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-950">校准检查</div>
          <div className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
            {protocol.requiredChecks.map((check) => (
              <div key={check} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-slate-400" />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-1">
        {(["researcher_curated", "expert_checked", "pilot_ready", "study_ready"] as PacketValidationStatus[]).map(
          (nextStatus) => (
            <button
              key={nextStatus}
              type="button"
              onClick={() => onMarkPacketStatus(nextStatus)}
              className={cx(
                "border px-2 py-1.5 text-[11px] font-medium",
                protocol?.status === nextStatus
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              )}
            >
              标记：{packetStatusLabels[nextStatus]}
            </button>
          )
        )}
      </div>
    </section>
  );
}

function StudySessionPanel({
  condition,
  workspaceMode,
  selectedCandidateCount,
  candidateMarkedCount,
  evidenceDecisionCount,
  activeEvidenceCount,
  replacementDecisionCount,
  replacementComparisonCount,
  interpretationDecision,
  mapping,
  eventCount,
}: {
  condition: StudyCondition;
  workspaceMode: MappingWorkspaceMode;
  selectedCandidateCount: number;
  candidateMarkedCount: number;
  evidenceDecisionCount: number;
  activeEvidenceCount: number;
  replacementDecisionCount: number;
  replacementComparisonCount: number;
  interpretationDecision: InterpretationDecision;
  mapping: LiteraryMapping;
  eventCount: number;
}) {
  const exportPayload = {
    system: "MeaningForge",
    condition,
    workspaceMode,
    mappingId: mapping.id,
    selectedSpan: mapping.selectedSpan,
    workTitle: mapping.workTitle,
    passageLabel: mapping.passageLabel,
    dataStructure: {
      carrier: mapping.concreteCarrier.name,
      relationCount: mapping.mappingRelations.length,
      evidenceCount: mapping.evidence.length,
      replacementCount: mapping.replacements.length,
      candidateCount: mapping.candidateCarriers?.length ?? 0,
    },
    userStudyMeasures: {
      selectedCandidateCount,
      candidateMarkedCount,
      evidenceDecisionCount,
      activeEvidenceCount,
      replacementDecisionCount,
      replacementComparisonCount,
      interpretationDecision,
      eventCount,
    },
    provenance: mapping.analysisProvenance,
    studyHooks: mapping.studyHooks,
  };

  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <ClipboardCheck className="h-4 w-4" />
          用户研究记录
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(exportPayload, null, 2))}
          className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
        >
          <Download className="h-3 w-3" />
          导出
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{conditionLabels[condition].label}</div>
          <div className="mt-1 text-slate-500">研究条件</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{workspaceMode === "multi" ? "多线索" : "单线索"}</div>
          <div className="mt-1 text-slate-500">工作区</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{selectedCandidateCount}/{candidateMarkedCount}</div>
          <div className="mt-1 text-slate-500">已选择 / 已标记线索</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{evidenceDecisionCount}/{activeEvidenceCount}</div>
          <div className="mt-1 text-slate-500">当前关系证据</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{replacementDecisionCount}/{replacementComparisonCount}</div>
          <div className="mt-1 text-slate-500">替换判断</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{interpretationDecisionLabels[interpretationDecision]}</div>
          <div className="mt-1 text-slate-500">最终判断</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        这个面板用于把交互设计指标和模型质量问题分开记录，沿用 VeriForge 式的研究逻辑。
      </p>
    </section>
  );
}

function ReplacementPanel({
  replacement,
  relations,
  reviewState,
  onReview,
  showJudgmentControls = true,
}: {
  replacement: ReplacementAnalysis;
  relations: Record<string, MappingRelation>;
  reviewState: Record<string, ReplacementReviewStatus>;
  onReview: (comparisonId: string, status: ReplacementReviewStatus) => void;
  showJudgmentControls?: boolean;
}) {
  const grouped = useMemo(
    () => ({
      preserved: replacement.comparisons.filter((item) => item.status === "preserved"),
      weakened: replacement.comparisons.filter((item) => item.status === "weakened"),
      broken: replacement.comparisons.filter((item) => item.status === "broken"),
      emergent: replacement.comparisons.filter((item) => item.status === "emergent"),
    }),
    [replacement]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {(["preserved", "weakened", "emergent", "broken"] as const).map((status) => {
        const style = statusStyles[status];
        const Icon = style.icon;
        return (
          <section key={status} className={cx("border p-4", style.className)}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h3 className="text-sm font-semibold">{style.label}</h3>
            </div>
            <div className="mt-3 space-y-3">
              {grouped[status].length ? (
                grouped[status].map((item) => (
                  <article key={item.id} className="border border-white/70 bg-white/75 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{item.title}</div>
                      <span className="border border-white bg-white/80 px-2 py-0.5 text-[11px] font-medium">
                        {replacementReviewLabels[reviewState[item.id] || "unreviewed"]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5">{item.explanation}</p>
                    {showJudgmentControls && item.diagnosticQuestion ? (
                      <div className="mt-2 border border-white/80 bg-white/80 p-2 text-[11px] leading-4 text-slate-700">
                        <span className="font-semibold">诊断问题：</span>
                        {item.diagnosticQuestion}
                      </div>
                    ) : null}
                    {showJudgmentControls && item.relationIds.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {item.relationIds.map((relationId, index) => (
                          <div key={`${relationId}_${index}`} className="text-[11px] leading-4 text-slate-600">
                            {relations[relationId]?.carrierRelation || relationId}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {showJudgmentControls ? (
                      <>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">你怎么看这条变化</div>
                          <div className="text-[11px] text-slate-500">
                            当前：{replacementReviewLabels[reviewState[item.id] || "unreviewed"]}
                          </div>
                        </div>
                        <div className="mt-1 grid grid-cols-4 gap-1">
                          {(["confirmed", "revised", "uncertain", "rejected"] as ReplacementReviewStatus[]).map((review) => (
                            <button
                              key={review}
                              type="button"
                              onClick={() => onReview(item.id, review)}
                              className={cx(
                                "border px-2 py-1 text-[11px] font-medium",
                                reviewState[item.id] === review
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-white bg-white/80 text-slate-700 hover:border-slate-400"
                              )}
                            >
                              {replacementReviewLabels[review]}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 border border-white/70 bg-white/70 p-2 text-[11px] leading-4 text-slate-600">
                        先把它当作一种可检查的变化；需要写作或研究时再逐条判断。
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="border border-white/70 bg-white/60 p-3 text-xs leading-5 text-slate-600">
                  本次替换没有生成这一类预测。读者可以换一个替代意象，或在后续修订中补充这一类影响。
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ExplorationStepHeader({
  step,
  title,
  description,
  aside,
}: {
  step: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-300 bg-white text-sm font-semibold text-slate-900">
          {step}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
        </div>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

function HighlightedPassage({
  passage,
  span,
  relatedSpans = [],
}: {
  passage: string;
  span: string;
  relatedSpans?: string[];
}) {
  const spans = Array.from(new Set([span, ...relatedSpans].map((item) => item.trim()).filter(Boolean)))
    .filter((item) => passage.includes(item))
    .sort((a, b) => b.length - a.length);
  if (spans.length === 0) {
    return <p className="whitespace-pre-wrap text-lg leading-9 text-slate-900">{passage}</p>;
  }
  const pattern = new RegExp(`(${spans.map(escapeRegExp).join("|")})`, "g");
  const parts = passage.split(pattern);
  return (
    <p className="whitespace-pre-wrap text-lg leading-9 text-slate-900">
      {parts.map((part, index) => {
        if (!spans.includes(part)) return <span key={`${part}_${index}`}>{part}</span>;
        const isActive = part === span;
        return (
          <mark
            key={`${part}_${index}`}
            className={cx(
              "px-1 font-semibold",
              isActive ? "bg-amber-200 text-slate-950" : "bg-teal-100 text-teal-950"
            )}
          >
            {part}
          </mark>
        );
      })}
    </p>
  );
}

function PassageMeaningMap({
  mapping,
  candidates,
  passageMappings,
  selectedCandidateIds,
  candidateReview,
  onSelectCandidate,
  onActivateMapping,
}: {
  mapping: LiteraryMapping;
  candidates: CandidateCarrier[];
  passageMappings: LiteraryMapping[];
  selectedCandidateIds: string[];
  candidateReview: Record<string, CandidateReviewStatus>;
  onSelectCandidate: (candidate: CandidateCarrier) => void;
  onActivateMapping: (mapping: LiteraryMapping) => void;
}) {
  const visibleCandidates = candidates.slice(0, 6);
  const mappingBySpan = new Map(passageMappings.map((item) => [compactForMatch(item.selectedSpan), item]));
  const activeSpanKey = compactForMatch(mapping.selectedSpan);
  const activeCandidate =
    visibleCandidates.find((candidate) => compactForMatch(candidate.span) === activeSpanKey) ?? visibleCandidates[0];
  const relationHints = mapping.mappingRelations.slice(0, 5);
  const isCuratedPacket = mapping.analysisProvenance?.source === "demo";
  const isTemporaryLens = Boolean(mapping.analysisProvenance?.temporaryLens);
  const activeCarrierTypes = normalizedCarrierTypeList(mapping.carrierTypes);
  const activeTypeLabels = activeCarrierTypes.length > 0 ? activeCarrierTypes : inferCarrierTypes(mapping);

  return (
    <section className="border border-teal-200 bg-[#f2fbf8] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-teal-950">本段意义网络</div>
          <p className="mt-1 text-xs leading-5 text-teal-800">
            先看这一段里哪些物件、动作和话语互相牵连；再把 Meaning Lens 临时聚焦到其中一个。
          </p>
        </div>
        <div className="grid gap-2 text-xs leading-5 text-teal-900 sm:grid-cols-2 lg:min-w-[360px]">
          <div className="border border-teal-200 bg-white px-3 py-2">
            当前聚焦：<span className="font-semibold">{mapping.selectedSpan}</span>
          </div>
          <div className="border border-teal-200 bg-white px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {activeTypeLabels.map((type) => (
                <span key={type} className={cx("border px-2 py-0.5 text-[11px]", carrierTypeLabels[type].className)}>
                  {carrierTypeLabels[type].label}
                </span>
              ))}
            </div>
          </div>
          <div className={cx(
            "border px-3 py-2",
            isCuratedPacket ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
          )}>
            来源：{isTemporaryLens ? "UIRR packet 节点临时 Lens" : isCuratedPacket ? "已整理 UIRR packet" : "全文线索发现"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-teal-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-teal-900">可追踪线索</div>
            <div className="text-[11px] text-slate-500">点击任一线索临时聚焦</div>
          </div>
          <div className="grid gap-2">
          {visibleCandidates.map((candidate, index) => {
            const key = compactForMatch(candidate.span);
            const linkedMapping = mappingBySpan.get(key);
            const isActive = key === activeSpanKey;
            const isSelected = selectedCandidateIds.includes(candidate.id);
            const review = candidateReview[candidate.id] || "pending";
            const candidateCarrierTypes = normalizedCarrierTypeList(candidate.carrierTypes);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => {
                  if (linkedMapping) {
                    onActivateMapping(linkedMapping);
                  } else {
                    onSelectCandidate(candidate);
                  }
                }}
                className={cx(
                  "grid grid-cols-[30px_1fr_auto] items-start gap-2 border p-3 text-left transition",
                  isActive
                    ? "border-teal-700 bg-white shadow-sm"
                    : isSelected
                      ? "border-teal-300 bg-white"
                      : "border-teal-100 bg-white/75 hover:border-teal-500"
                )}
              >
                <div
                  className={cx(
                    "flex h-7 w-7 items-center justify-center border text-xs font-semibold",
                    isActive ? "border-teal-700 bg-teal-700 text-white" : "border-teal-200 bg-teal-50 text-teal-900"
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">{candidate.label}</span>
                    {candidateCarrierTypes.slice(0, 2).map((type) => (
                      <span key={type} className={cx("border px-2 py-0.5 text-[11px]", carrierTypeLabels[type].className)}>
                        {carrierTypeLabels[type].label}
                      </span>
                    ))}
                    <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {candidate.detectionMethod ? detectionMethodLabels[candidate.detectionMethod] : "读者标记"}
                    </span>
                    {review !== "pending" ? (
                      <span className="border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] text-teal-900">
                        {candidateReviewLabels[review]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{candidate.whyCandidate}</p>
                  {candidate.contextualMeaning ? (
                    <div className="mt-2 border-l-2 border-teal-300 pl-2 text-[11px] leading-5 text-teal-900">
                      {candidate.contextualMeaning}
                    </div>
                  ) : null}
                  {candidateCarrierTypes[0] ? (
                    <div className="mt-1 text-[11px] leading-5 text-slate-500">
                      解剖提示：{carrierTypeLabels[candidateCarrierTypes[0]].cue}
                    </div>
                  ) : null}
                </div>
                <span className={cx(
                  "border px-2 py-1 text-[11px] font-medium",
                  isActive ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-slate-50 text-slate-600"
                )}>
                  {isActive ? "Lens" : "试探"}
                </span>
              </button>
            );
          })}
          </div>
        </div>

        <div className="border border-teal-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-teal-900">意义关系链</div>
            <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
              {relationHints.length} 条关系
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {relationHints.map((relation, index) => (
              <div key={relation.id} className="grid grid-cols-[26px_1fr] gap-2 text-xs leading-5 text-slate-700">
                <div className="flex h-6 w-6 items-center justify-center border border-teal-200 bg-teal-50 text-[11px] font-semibold text-teal-900">
                  {index + 1}
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2">
                  <div className="font-semibold text-slate-950">{relation.carrierRelation}</div>
                  <div className="mt-1">{relation.meaningRelation}</div>
                </div>
              </div>
            ))}
          </div>
          {activeCandidate?.evidenceExcerpt ? (
            <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              <div className="font-semibold">当前焦点的原文锚点</div>
              <div className="mt-1">{activeCandidate.evidenceExcerpt}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ExplorationWorkspace({
  mapping,
  passageMappings,
  candidates,
  selectedCandidateIds,
  candidateReview,
  activeRelationId,
  activeRelation,
  activeEvidence,
  activeReplacement,
  relationById,
  evidenceReview,
  replacementReview,
  reflection,
  interpretationDecision,
  customReplacement,
  isComparing,
  workspaceMode,
  evidenceDecisionCount,
  activeEvidenceCount,
  replacementDecisionCount,
  replacementComparisonCount,
  onSelectRelation,
  onSelectCandidate,
  onActivateMapping,
  onActivateReplacement,
  onEvidenceReview,
  onReplacementReview,
  onCustomReplacementChange,
  onCustomReplacement,
  onReflectionChange,
  onInterpretationDecision,
  onGenerateInterpretation,
}: {
  mapping: LiteraryMapping;
  passageMappings: LiteraryMapping[];
  candidates: CandidateCarrier[];
  selectedCandidateIds: string[];
  candidateReview: Record<string, CandidateReviewStatus>;
  activeRelationId: string;
  activeRelation?: MappingRelation;
  activeEvidence: LiteraryEvidence[];
  activeReplacement: ReplacementAnalysis;
  relationById: Record<string, MappingRelation>;
  evidenceReview: Record<string, EvidenceReviewStatus>;
  replacementReview: Record<string, ReplacementReviewStatus>;
  reflection: string;
  interpretationDecision: InterpretationDecision;
  customReplacement: string;
  isComparing: boolean;
  workspaceMode: MappingWorkspaceMode;
  evidenceDecisionCount: number;
  activeEvidenceCount: number;
  replacementDecisionCount: number;
  replacementComparisonCount: number;
  onSelectRelation: (relationId: string) => void;
  onSelectCandidate: (candidate: CandidateCarrier) => void;
  onActivateMapping: (mapping: LiteraryMapping) => void;
  onActivateReplacement: (replacementId: string) => void;
  onEvidenceReview: (evidenceId: string, status: EvidenceReviewStatus) => void;
  onReplacementReview: (comparisonId: string, status: ReplacementReviewStatus) => void;
  onCustomReplacementChange: (value: string) => void;
  onCustomReplacement: () => void;
  onReflectionChange: (value: string) => void;
  onInterpretationDecision: (decision: InterpretationDecision) => void;
  onGenerateInterpretation: () => void;
}) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [areReplacementDetailsOpen, setAreReplacementDetailsOpen] = useState(false);
  const activeRelationEvidence = activeEvidence[0] ?? mapping.evidence[0];
  const selectedRelation = activeRelation ?? mapping.mappingRelations[0];
  const stepItems = [
    { label: "读法", value: mapping.selectedSpan },
    { label: "证据", value: `${evidenceDecisionCount}/${activeEvidenceCount}` },
    { label: "替换", value: activeReplacement.replacementCarrier },
    { label: "我的解释", value: interpretationDecisionLabels[interpretationDecision] },
  ];
  const activeReplacementGate = evaluateReplacementGate(activeReplacement);
  const activeGateStyle = replacementGateLabels[activeReplacementGate.level];

  return (
    <div ref={undefined} className="space-y-4">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-950 p-4 text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-wide text-teal-200">证据与草稿工作区</div>
              <h2 className="mt-1 text-xl font-semibold">从一个意象，形成自己的解释</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                这里不是按模块填表，而是沿着阅读动作推进：先看一种可能读法，再用证据和替换决定自己怎么写。
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-xs">
              {stepItems.map((item, index) => (
                <div key={item.label} className="border border-white/20 bg-white/10 px-3 py-2">
                  <div className="text-[10px] text-slate-300">{index + 1}. {item.label}</div>
                  <div className="mt-1 max-w-24 truncate font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <PassageMeaningMap
            mapping={mapping}
            candidates={candidates}
            passageMappings={passageMappings}
            selectedCandidateIds={selectedCandidateIds}
            candidateReview={candidateReview}
            onSelectCandidate={onSelectCandidate}
            onActivateMapping={onActivateMapping}
          />
        </div>

        <ExplorationStepHeader
          step="1"
          title="这条读法在说什么？"
          description="先看到一种可能读法，而不是直接接受系统给出的标准答案。"
          aside={
            <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              不确定性：{uncertaintyLabels[mapping.uncertainty]}
            </span>
          }
        />
        <div className="grid gap-4 p-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="border border-slate-200 bg-[#fffdf8] p-4">
              <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">原文片段</div>
              <HighlightedPassage
                passage={mapping.passage}
                span={mapping.selectedSpan}
                relatedSpans={candidateDisplayAnchors(candidates)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-[240px_1fr]">
              <div className="border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-semibold text-amber-900">具体载体</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{mapping.concreteCarrier.name}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mapping.concreteCarrier.attributes.slice(0, 5).map((attribute, index) => (
                    <span key={`${attribute}_${index}`} className="border border-amber-200 bg-white px-2 py-1 text-xs text-amber-900">
                      {attribute}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border border-indigo-200 bg-indigo-50 p-4">
                <div className="text-xs font-semibold text-indigo-900">一种可能意义</div>
                <div className="mt-3 grid gap-2">
                  {mapping.broaderMeaningHypotheses.slice(0, 4).map((meaning, index) => (
                    <div key={`${meaning}_${index}`} className="border border-indigo-100 bg-white/80 p-2 text-sm leading-5 text-slate-900">
                      {meaning}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {workspaceMode === "multi" && passageMappings.length > 1 ? (
              <div className="border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs font-semibold text-slate-600">同一片段的其他载体</div>
                <div className="grid gap-2">
                  {passageMappings.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onActivateMapping(item)}
                      className={cx(
                        "border px-3 py-2 text-left text-sm",
                        item.id === mapping.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700"
                      )}
                    >
                      {item.selectedSpan}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                这条读法由哪些关系支撑？
              </div>
              <div className="divide-y divide-slate-200">
                {mapping.mappingRelations.map((relation, index) => (
                  <button
                    key={relation.id}
                    type="button"
                    onClick={() => onSelectRelation(relation.id)}
                    className={cx(
                      "grid w-full grid-cols-[32px_1fr] gap-2 px-3 py-3 text-left",
                      activeRelationId === relation.id ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className={cx(
                      "flex h-7 w-7 items-center justify-center border text-xs font-semibold",
                      activeRelationId === relation.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-600"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-5 text-slate-950">{relation.carrierRelation}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{relation.meaningRelation}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <ExplorationStepHeader
          step="2"
          title="为什么可以这么说？"
          description="默认只看一句最关键的原文证据；如果你想深挖，再展开完整证据卡。"
          aside={
            <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {evidenceDecisionCount}/{activeEvidenceCount} 已查看
            </span>
          }
        />
        <div className="grid gap-4 p-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-600">当前要检查的读法关系</div>
            <div className="mt-2 text-sm font-semibold leading-6 text-slate-950">{selectedRelation?.carrierRelation}</div>
            <div className="mt-2 border-l-2 border-teal-500 pl-3 text-sm leading-6 text-slate-700">
              {selectedRelation?.meaningRelation}
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-600">最直接的原文证据</div>
            <div className="mt-2 border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800">
              {activeRelationEvidence?.excerpt || "暂无证据"}
            </div>
            {activeRelationEvidence ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onEvidenceReview(activeRelationEvidence.id, "accepted")}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium",
                    evidenceReview[activeRelationEvidence.id] === "accepted"
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  这句能支撑
                </button>
                <button
                  type="button"
                  onClick={() => onEvidenceReview(activeRelationEvidence.id, "revised")}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium",
                    evidenceReview[activeRelationEvidence.id] === "revised"
                      ? "border-amber-700 bg-amber-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  需要改说法
                </button>
                <button
                  type="button"
                  onClick={() => onEvidenceReview(activeRelationEvidence.id, "rejected")}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium",
                    evidenceReview[activeRelationEvidence.id] === "rejected"
                      ? "border-rose-700 bg-rose-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  支撑不住
                </button>
              </div>
            ) : null}
          </div>
          <div className="border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setIsEvidenceOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-slate-950">为什么这么说？</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  展开后查看完整证据卡和来源标签。
                </div>
              </div>
              <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {isEvidenceOpen ? "收起" : "展开"}
              </span>
            </button>
            {isEvidenceOpen ? (
              <div className="p-3">
                <EvidencePanel evidence={activeEvidence} reviewState={evidenceReview} onReview={onEvidenceReview} />
              </div>
            ) : (
              <div className="p-4 text-sm leading-6 text-slate-700">
                {activeRelationEvidence?.note || "需要时再展开证据细节。"}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <ExplorationStepHeader
          step="3"
          title="换一下看看：哪里还在，哪里变弱？"
          description="替换不是改写原文，而是用一个小探针看原意象到底支撑了哪些意义。"
          aside={
            <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {replacementDecisionCount}/{replacementComparisonCount} 已细看
            </span>
          }
        />
        <div className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-600">选择一个替换探针</div>
              <div className="flex flex-wrap gap-2">
                {mapping.replacements.map((replacement) => {
                  const gate = evaluateReplacementGate(replacement);
                  const gateStyle = replacementGateLabels[gate.level];
                  return (
                    <button
                      key={replacement.id}
                      type="button"
                      onClick={() => onActivateReplacement(replacement.id)}
                      className={cx(
                        "inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition",
                        replacement.id === activeReplacement.id
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      )}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>{mapping.selectedSpan} {"->"} {replacement.replacementCarrier}</span>
                      <span
                        className={cx(
                          "border px-1.5 py-0.5 text-[10px] font-semibold",
                          replacement.id === activeReplacement.id
                            ? "border-white/40 bg-white/20 text-white"
                            : replacementStrategyLabels[replacement.replacementStrategy ?? "near_neighbor"].className
                        )}
                      >
                        {replacementStrategyLabels[replacement.replacementStrategy ?? "near_neighbor"].label}
                      </span>
                      <span
                        className={cx(
                          "border px-1.5 py-0.5 text-[10px] font-semibold",
                          replacement.id === activeReplacement.id ? "border-white/40 bg-white/20 text-white" : gateStyle.className
                        )}
                      >
                        {gateStyle.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_auto] lg:grid-cols-1">
              <input
                value={customReplacement}
                onChange={(event) => onCustomReplacementChange(event.target.value)}
                placeholder="也可输入新的替换意象"
                className="border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onCustomReplacement}
                disabled={isComparing}
                className="inline-flex items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
                整理比较
              </button>
            </div>
          </div>
          <div className="mt-4 border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-950">这次替换在测试：</span>
              <span>{activeReplacement.purpose}</span>
              <span className={cx("border px-2 py-0.5 text-xs font-semibold", replacementStrategyLabels[activeReplacement.replacementStrategy ?? "near_neighbor"].className)}>
                {replacementStrategyLabels[activeReplacement.replacementStrategy ?? "near_neighbor"].label} / {replacementStrategyLabels[activeReplacement.replacementStrategy ?? "near_neighbor"].risk}
              </span>
              <span className={cx("border px-2 py-0.5 text-xs font-semibold", activeGateStyle.className)}>
                {activeGateStyle.label} · {activeReplacementGate.passedCount}/5
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-xs md:grid-cols-5">
              {activeReplacementGate.checks.map((check) => (
                <div
                  key={check.label}
                  className={cx(
                    "border px-2 py-1",
                    check.passed ? "border-emerald-200 bg-white text-emerald-800" : "border-rose-200 bg-white text-rose-800"
                  )}
                >
                  {check.passed ? "通过" : "待补"}：{check.label}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{activeReplacementGate.summary}</p>
            {activeReplacement.replacementStrategy === "oppositional" ? (
              <p className="mt-2 text-xs leading-5 text-amber-800">
                这是边界测试：它可能故意把意象推远，用来观察原文关系在哪里断裂，不代表替换后的文本更好。
              </p>
            ) : null}
          </div>
          <div className="mt-4">
            <div className="mb-3 flex flex-col gap-2 border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                先看保留、变弱和新出现的意义方向；需要写作或研究记录时，再展开逐条判断。
              </div>
              <button
                type="button"
                onClick={() => setAreReplacementDetailsOpen((value) => !value)}
                className="shrink-0 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-500"
              >
                {areReplacementDetailsOpen ? "收起逐条判断" : "展开逐条判断"}
              </button>
            </div>
            <ReplacementPanel
              replacement={activeReplacement}
              relations={relationById}
              reviewState={replacementReview}
              onReview={onReplacementReview}
              showJudgmentControls={areReplacementDetailsOpen}
            />
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <ExplorationStepHeader
          step="4"
          title="我怎么看？"
          description="把前面的发现改写成自己的解释，而不是只给系统结构打勾。"
          aside={
            <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              当前：{interpretationDecisionLabels[interpretationDecision]}
            </span>
          }
        />
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
          <textarea
            value={reflection}
            onChange={(event) => onReflectionChange(event.target.value)}
            className="min-h-36 w-full resize-none border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900"
          />
          <div className="space-y-2">
            {([
              ["kept", "这条说得通"],
              ["revise", "我要改一句"],
              ["recorded", "整理成可编辑草稿"],
            ] as Array<[InterpretationDecision, string]>).map(([decision, label]) => (
              <button
                key={decision}
                type="button"
                onClick={() => {
                  if (decision === "recorded") {
                    onGenerateInterpretation();
                  }
                  onInterpretationDecision(decision);
                }}
                className={cx(
                  "w-full border px-3 py-2 text-sm font-medium",
                  interpretationDecision === decision
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                )}
              >
                {label}
              </button>
            ))}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{mapping.mappingRelations.length}</div>
                <div className="mt-1 text-slate-500">关系</div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{mapping.evidence.length}</div>
                <div className="mt-1 text-slate-500">证据</div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{activeReplacement.comparisons.length}</div>
                <div className="mt-1 text-slate-500">影响</div>
              </div>
            </div>
            <div className="border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-900">
              草稿只整理你已查看的证据和替换结果。请改掉至少一句，让它成为你的读法。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const initialWork = builtInLiteraryWorks.find((work) => work.id === "luxun-medicine") ?? builtInLiteraryWorks[0];
const initialMapping =
  literaryMappingDemo.find((mapping) => mapping.workTitle === initialWork.title) ?? literaryMappingDemo[0];

function App() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [works, setWorks] = useState<LiteraryWork[]>(builtInLiteraryWorks);
  const [workId, setWorkId] = useState(initialWork.id);
  const activeWork = works.find((work) => work.id === workId) ?? works[0];
  const [passageId, setPassageId] = useState(activeWork.passages[0].id);
  const activePassage = activeWork.passages.find((passage) => passage.id === passageId) ?? activeWork.passages[0];
  const [passageDraft, setPassageDraft] = useState(activePassage.text);
  const [passageSearch, setPassageSearch] = useState("");
  const [selectedSpan, setSelectedSpan] = useState(initialMapping.selectedSpan);
  const [mappings, setMappings] = useState<LiteraryMapping[]>(literaryMappingDemo);
  const [mappingId, setMappingId] = useState(initialMapping.id);
  const activeMapping = mappings.find((item) => item.id === mappingId) ?? mappings[0];
  const [replacementIdByMapping, setReplacementIdByMapping] = useState<Record<string, string>>({
    [activeMapping.id]: activeMapping.replacements[0].id,
  });
  const [activeRelationId, setActiveRelationId] = useState(activeMapping.mappingRelations[0].id);
  const [reflection, setReflection] = useState("我觉得这条解释说得通，因为替换后可以看出：原意象中真正支撑意义的是...");
  const [customReplacement, setCustomReplacement] = useState("");
  const [status, setStatus] = useState("已准备好。可以直接打开内置阅读试探，也可以导入 .txt 文本。");
  const [candidateScan, setCandidateScan] = useState<CandidateScanResult | null>(null);
  const [passageCandidateIndex, setPassageCandidateIndex] = useState<PassageCandidateIndex>({});
  const [literarySubstrate, setLiterarySubstrate] = useState<LiterarySubstrate | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [appMode, setAppMode] = useState<AppExperienceMode>("reader");
  const [displayAudience] = useState<DisplayAudience>(() =>
    window.location.hash === "#researcher" ? "researcher" : "participant"
  );
  const [showResearchTools, setShowResearchTools] = useState(false);
  const [researchInspectorTab, setResearchInspectorTab] = useState<ResearchInspectorTab>("overview");
  const [studyCondition, setStudyCondition] = useState<StudyCondition>("interactive_reworking");
  const [workspaceMode, setWorkspaceMode] = useState<MappingWorkspaceMode>("focused");
  const [selectedTheoryLenses, setSelectedTheoryLenses] = useState<TheoryLens[]>(
    defaultTheoryLensesForWork(activeWork)
  );
  const [candidateReview, setCandidateReview] = useState<Record<string, CandidateReviewStatus>>({});
  const [candidateRevisions, setCandidateRevisions] = useState<Record<string, string>>({});
  const [evidenceReview, setEvidenceReview] = useState<Record<string, EvidenceReviewStatus>>({});
  const [replacementReview, setReplacementReview] = useState<Record<string, ReplacementReviewStatus>>({});
  const [workflowMappingGenerated, setWorkflowMappingGenerated] = useState(false);
  const [interpretationDecision, setInterpretationDecision] = useState<InterpretationDecision>("pending");
  const [studyLog, setStudyLog] = useState<StudyLogEvent[]>([]);

  const fallbackActiveReplacement = fallbackReplacement(
    activeMapping.id,
    activeMapping.concreteCarrier?.name || activeMapping.selectedSpan || "the carrier"
  );
  const activeReplacement =
    activeMapping.replacements.find((item) => item.id === replacementIdByMapping[activeMapping.id]) ??
    activeMapping.replacements[0] ??
    fallbackActiveReplacement;

  const relationById = useMemo(
    () => Object.fromEntries(activeMapping.mappingRelations.map((relation) => [relation.id, relation])),
    [activeMapping]
  );

  const activeRelation = activeMapping.mappingRelations.find((relation) => relation.id === activeRelationId);
  const activeEvidence =
    activeRelation?.evidenceIds
      .map((id) => activeMapping.evidence.find((item) => item.id === id))
      .filter((item): item is LiteraryEvidence => Boolean(item)) ?? activeMapping.evidence;
  const filteredPassages = activeWork.passages.filter((passage) => {
    const query = passageSearch.trim().toLowerCase();
    if (!query) return true;
    return `${passage.label} ${passage.chapter || ""} ${passage.text}`.toLowerCase().includes(query);
  });
  const showMappingScaffold = studyCondition !== "explanation" && workflowMappingGenerated;
  const showDeepControls = appMode === "polish";
  const activePassageIndex = activeWork.passages.findIndex((passage) => passage.id === activePassage.id);
  const passagePosition = activePassageIndex >= 0 ? activePassageIndex + 1 : 1;
  const passageCount = activeWork.passages.length;
  const activeExcerptWordCount =
    activeWork.language === "zh"
      ? passageDraft.replace(/\s/g, "").length
      : passageDraft.trim()
        ? passageDraft.trim().split(/\s+/).length
        : 0;
  const curatedMappingsForActivePassage = useMemo(
    () =>
      mappings.filter(
        (mapping) =>
          mapping.analysisProvenance?.source === "demo" &&
          isSameReadingPassage(mapping, activeWork.title, activePassage.label, passageDraft)
      ),
    [mappings, activeWork.title, activePassage.label, passageDraft]
  );
  const curatedCandidatesForActivePassage = useMemo(
    () => mergeCandidates(curatedMappingsForActivePassage),
    [curatedMappingsForActivePassage]
  );
  const activeSubstrateNode = literarySubstrate?.nodesByPassageId[activePassage.id] ?? null;
  const indexedCandidateScan = literarySubstrate?.passageScans[activePassage.id] ?? passageCandidateIndex[activePassage.id] ?? null;
  const activeCandidates =
    candidateScan?.candidates ??
    (workflowMappingGenerated
      ? activeMapping.candidateCarriers ?? curatedCandidatesForActivePassage
      : curatedCandidatesForActivePassage.length > 0
        ? curatedCandidatesForActivePassage
        : indexedCandidateScan?.candidates ?? []);
  const selectedCandidate = activeCandidates.find((candidate) => candidate.id === selectedCandidateId);
  const selectedCandidates = activeCandidates.filter((candidate) => selectedCandidateIds.includes(candidate.id));
  const selectedCandidateSummary =
    selectedCandidates.length > 0
      ? selectedCandidates
          .slice(0, 4)
          .map((candidate) => candidateRevisions[candidate.id]?.trim() || candidate.span)
          .join("、")
      : "";
  const candidateMarkedCount = activeCandidates.filter((candidate) => candidateReview[candidate.id]).length;
  const needsCandidateChoice = Boolean(candidateScan && activeCandidates.length > 0 && selectedCandidateIds.length === 0);
  const canGenerateMapping = !isAnalyzing && !needsCandidateChoice;
  const evidenceDecisionCount = activeEvidence.filter((item) => evidenceReview[item.id]).length;
  const activeEvidenceCount = activeEvidence.length;
  const replacementDecisionCount = activeReplacement.comparisons.filter((item) => replacementReview[item.id]).length;
  const replacementComparisonCount = activeReplacement.comparisons.length;
  const passageMappings = curatedMappingsForActivePassage;
  const passageIndexStats = useMemo(
    () =>
      Object.fromEntries(
        activeWork.passages.map((passage) => {
          const curatedCount = mergeCandidates(
            mappings.filter(
              (mapping) =>
                mapping.analysisProvenance?.source === "demo" &&
                isSameReadingPassage(mapping, activeWork.title, passage.label, passage.text)
            )
          ).length;
          const substrateNode = literarySubstrate?.nodesByPassageId[passage.id];
          const indexedCount = substrateNode?.candidateCount ?? passageCandidateIndex[passage.id]?.candidates.length ?? 0;
          return [
            passage.id,
            {
              count: curatedCount || indexedCount,
              status: curatedCount
                ? "已校准"
                : substrateNode?.calibrationStatus === "unscanned"
                  ? "未扫描"
                  : indexedCount
                    ? "未校准"
                    : "未扫描",
            },
          ];
        })
      ) as Record<string, { count: number; status: string }>,
    [activeWork.passages, activeWork.title, mappings, passageCandidateIndex, literarySubstrate]
  );
  const explanationSummary = `“${activeMapping.selectedSpan}”可以通向“${activeMapping.broaderMeaningHypotheses
    .slice(0, 2)
    .join("、")}”。这个基线只给出结论，不展示替换后哪些意义保留、变弱或涌现。`;
  const logEvent = (type: string, detail: string) => {
    setStudyLog((previous) => [createLogEvent(type, detail), ...previous].slice(0, 100));
  };

  const buildSubstrateForWork = (work: LiteraryWork, passages: LiteraryPassage[]) => {
    return buildLiterarySubstrate({
      work,
      passages,
      theoryLenses: defaultTheoryLensesForWork(work),
      curatedMappings: mappings,
      scanLimit: 80,
    });
  };

  const syncSubstrate = (substrate: LiterarySubstrate | null) => {
    setLiterarySubstrate(substrate);
    setPassageCandidateIndex(substrate?.passageScans ?? {});
  };

  const updateActiveSubstrateScan = (
    scan: CandidateScanResult,
    calibrationStatus: LiterarySubstrateCalibrationStatus = "uncalibrated_draft"
  ) => {
    setLiterarySubstrate((previous) => {
      if (!previous || previous.workId !== activeWork.id) return previous;
      const previousNode = previous.nodesByPassageId[activePassage.id];
      if (!previousNode) return previous;
      const nextNode = {
        ...previousNode,
        entities: scan.preprocess.entities,
        actions: scan.preprocess.actions,
        sensoryImages: scan.preprocess.images,
        repeatedTerms: scan.preprocess.repeatedTerms,
        candidateIds: scan.candidates.map((candidate) => `${activePassage.id}:${candidate.id}`),
        candidateCount: scan.candidates.length,
        calibrationStatus,
      };
      const nextNodes = previous.nodes.map((node) => (node.passageId === activePassage.id ? nextNode : node));
      const nextPassageScans = {
        ...previous.passageScans,
        [activePassage.id]: scan,
      };
      const retainedCarrierIndex = previous.carrierIndex
        .map((carrier) => {
          const passageIds = carrier.passageIds.filter((id) => id !== activePassage.id);
          return {
            ...carrier,
            passageIds,
            occurrenceCount: passageIds.length,
            distribution: carrier.distribution.filter((label) => label !== previousNode.label),
          };
        })
        .filter((carrier) => carrier.passageIds.length > 0);
      const nextCarrierIndex = [
        ...retainedCarrierIndex,
        ...scan.candidates.map((candidate) => ({
          span: candidate.span,
          label: candidate.label,
          carrierTypes: candidate.carrierTypes ?? [],
          occurrenceCount: 1,
          passageIds: [activePassage.id],
          distribution: [activePassage.label],
          calibrationStatus,
          salienceSignals: {
            recurrence: 0.33,
            distribution: Number((1 / Math.max(previous.coverage.scannedPassages, 1)).toFixed(2)),
            narrativeCentrality: candidate.scores?.narrativeImportance ?? 0.45,
            semanticAnomaly: nextNode.semanticAnomalies.length > 0 ? 0.82 : candidate.scores?.mipTension ?? 0.35,
            evidenceTrace: candidate.evidenceExcerpt ? 0.78 : 0.25,
          },
        })),
      ].sort((a, b) => {
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
      const curatedCandidateCount = nextCarrierIndex.filter((item) => item.calibrationStatus !== "uncalibrated_draft").length;
      return {
        ...previous,
        nodes: nextNodes,
        nodesByPassageId: {
          ...previous.nodesByPassageId,
          [activePassage.id]: nextNode,
        },
        passageScans: nextPassageScans,
        carrierIndex: nextCarrierIndex,
        summary: {
          ...previous.summary,
          candidateCount: nextCarrierIndex.length,
          curatedCandidateCount,
          uncalibratedCandidateCount: Math.max(0, nextCarrierIndex.length - curatedCandidateCount),
          semanticAnomalyCount: nextNodes.reduce((count, node) => count + node.semanticAnomalies.length, 0),
          topRecurringCarriers: nextCarrierIndex.slice(0, 8).map((item) => item.label),
        },
      };
    });
  };

  const handleMarkPacketStatus = (nextStatus: PacketValidationStatus) => {
    setMappings((previous) =>
      previous.map((mapping) => {
        if (mapping.id !== activeMapping.id) return mapping;
        const previousProtocol = mapping.analysisProvenance?.packetProtocol;
        return {
          ...mapping,
          analysisProvenance: {
            systemRole: mapping.analysisProvenance?.systemRole ?? "scaffold",
            theoryLenses: mapping.analysisProvenance?.theoryLenses ?? selectedTheoryLenses,
            source: mapping.analysisProvenance?.source ?? "local_scaffold",
            generatedAt: mapping.analysisProvenance?.generatedAt ?? new Date().toISOString(),
            packetProtocol: {
              status: nextStatus,
              constructionMethod:
                previousProtocol?.constructionMethod ??
                (mapping.analysisProvenance?.source === "demo" ? "theory_guided_packet" : "llm_assisted_draft"),
              validationNote:
                previousProtocol?.validationNote ??
                "该 packet 已进入研究者侧材料构建流程，仍需按 checklist 校准后再用于正式 study。",
              requiredChecks: previousProtocol?.requiredChecks ?? [
                "carrier 是否是文本中可观察的具体载体",
                "每条意义关系是否能回到原文证据",
                "replacement 是否有明确诊断目的",
                "保留、变弱、涌现或断裂判断是否过度解释",
              ],
            },
          },
        };
      })
    );
    setStatus(`当前 packet 已标记为：${packetStatusLabels[nextStatus]}。`);
    logEvent("packet_status_marked", `${activeMapping.selectedSpan}: ${nextStatus}`);
  };

  const handleAppModeChange = (mode: AppExperienceMode) => {
    setAppMode(mode);
    if (mode === "reader") {
      setWorkspaceMode("focused");
    }
    logEvent("experience_mode_changed", appExperienceLabels[mode].label);
  };

  const handleResearchToolsToggle = (enabled: boolean) => {
    if (displayAudience !== "researcher") {
      setStatus("研究工具只允许在“实验员后台”显示中打开，避免污染参与者任务。");
      logEvent("research_panels_blocked", "participant display");
      return;
    }
    setShowResearchTools(enabled);
    if (enabled) setResearchInspectorTab("overview");
    logEvent("research_panels_toggled", enabled ? "enabled" : "disabled");
  };

  const handleSelectWork = (nextWorkId: string) => {
    const nextWork = works.find((work) => work.id === nextWorkId);
    if (!nextWork) return;
    const nextPassage = nextWork.passages[0];
    const nextCuratedMapping = findCuratedMapping(mappings, nextWork.title, nextPassage.label, nextPassage.text, "");
    setWorkId(nextWork.id);
    setPassageId(nextPassage.id);
    setPassageDraft(nextPassage.text);
    setSelectedTheoryLenses(defaultTheoryLensesForWork(nextWork));
    setCandidateScan(null);
    syncSubstrate(nextWork.isFullTextLoaded ? buildSubstrateForWork(nextWork, nextWork.passages) : null);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    setSelectedSpan(nextCuratedMapping?.selectedSpan || "");
    if (nextCuratedMapping) {
      setMappingId(nextCuratedMapping.id);
      setActiveRelationId(nextCuratedMapping.mappingRelations[0]?.id || "");
      setReplacementIdByMapping((previous) => ({
        ...previous,
        [nextCuratedMapping.id]: previous[nextCuratedMapping.id] ?? nextCuratedMapping.replacements[0]?.id ?? "",
      }));
      setStatus(`已切换到整理好的阅读材料：${nextCuratedMapping.title}。可以先读原文，也可以临时打开当前线索。`);
    }
    logEvent("work_selected", nextWork.title);
  };

  const handleLoadFullText = async () => {
    if (!activeWork.fullTextUrl) return;
    setStatus(`正在载入 ${activeWork.title} 的全文...`);
    const response = await fetch(activeWork.fullTextUrl);
    if (!response.ok) {
      setStatus(`全文载入失败：${response.status}`);
      return;
    }
    const fullText = await response.text();
    const passages = splitFullTextIntoPassages(fullText, activeWork.title);
    const focusedPassage = findCuratedPassageForWork(mappings, activeWork.title, passages) ?? passages[0];
    const focusedCuratedMapping = findCuratedMapping(
      mappings,
      activeWork.title,
      focusedPassage.label,
      focusedPassage.text,
      ""
    );
    const nextWork: LiteraryWork = {
      ...activeWork,
      isFullTextLoaded: true,
      passages,
      sourceNote: `${activeWork.sourceNote} 已载入 ${passages.length} 个章节/片段。`,
    };
    const nextSubstrate = buildSubstrateForWork(nextWork, passages);
    setWorks((previous) => previous.map((work) => (work.id === activeWork.id ? nextWork : work)));
    setPassageId(focusedPassage.id);
    setPassageDraft(focusedPassage.text);
    setCandidateScan(null);
    syncSubstrate(nextSubstrate);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    setSelectedSpan(focusedCuratedMapping?.selectedSpan || "");
    if (focusedCuratedMapping) {
      setMappingId(focusedCuratedMapping.id);
      setActiveRelationId(focusedCuratedMapping.mappingRelations[0]?.id || "");
      setReplacementIdByMapping((previous) => ({
        ...previous,
        [focusedCuratedMapping.id]: previous[focusedCuratedMapping.id] ?? focusedCuratedMapping.replacements[0]?.id ?? "",
      }));
    }
    setPassageSearch("");
    setStatus(
      focusedCuratedMapping
        ? `已载入全文：${activeWork.title}，并建立结构化底座；已跳到包含「${focusedCuratedMapping.selectedSpan}」的阅读位置。`
        : `已载入全文：${activeWork.title}，共 ${passages.length} 个章节/片段；已为前 ${nextSubstrate.coverage.scannedPassages} 个目录节点建立结构化底座和线索索引。`
    );
    logEvent("full_text_loaded", `${activeWork.title}: ${passages.length} passages`);
  };

  const handleSelectPassage = (nextPassageId: string) => {
    const nextPassage = activeWork.passages.find((passage) => passage.id === nextPassageId);
    if (!nextPassage) return;
    const nextCuratedMapping = findCuratedMapping(mappings, activeWork.title, nextPassage.label, nextPassage.text, "");
    setPassageId(nextPassage.id);
    setPassageDraft(nextPassage.text);
    setCandidateScan(null);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    setSelectedSpan(nextCuratedMapping?.selectedSpan || "");
    if (nextCuratedMapping) {
      setMappingId(nextCuratedMapping.id);
      setActiveRelationId(nextCuratedMapping.mappingRelations[0]?.id || "");
      setReplacementIdByMapping((previous) => ({
        ...previous,
        [nextCuratedMapping.id]: previous[nextCuratedMapping.id] ?? nextCuratedMapping.replacements[0]?.id ?? "",
      }));
      setStatus(`已切换到整理好的阅读材料：${nextCuratedMapping.title}。可以先读原文，也可以临时打开当前线索。`);
    } else {
      const indexedCount =
        literarySubstrate?.nodesByPassageId[nextPassage.id]?.candidateCount ??
        passageCandidateIndex[nextPassage.id]?.candidates.length ??
        0;
      setStatus(
        indexedCount
          ? `已切换到「${nextPassage.label}」。本目录节点有 ${indexedCount} 条未校准线索，可临时打开或刷新。`
          : `已切换到「${nextPassage.label}」。这一段尚未扫描，可点击“发现本段线索”。`
      );
    }
    logEvent("passage_selected", `${activeWork.title}: ${nextPassage.label}`);
  };

  const handleMovePassage = (direction: -1 | 1) => {
    if (activePassageIndex < 0) return;
    const nextPassage = activeWork.passages[activePassageIndex + direction];
    if (!nextPassage) return;
    handleSelectPassage(nextPassage.id);
  };

  const handleUseVisibleSection = () => {
    setPassageDraft(activePassage.text);
    setCandidateScan(null);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    const nextCuratedMapping = findCuratedMapping(mappings, activeWork.title, activePassage.label, activePassage.text, "");
    setSelectedSpan(nextCuratedMapping?.selectedSpan || "");
    if (nextCuratedMapping) {
      setMappingId(nextCuratedMapping.id);
      setActiveRelationId(nextCuratedMapping.mappingRelations[0]?.id || "");
      setReplacementIdByMapping((previous) => ({
        ...previous,
        [nextCuratedMapping.id]: previous[nextCuratedMapping.id] ?? nextCuratedMapping.replacements[0]?.id ?? "",
      }));
    }
    setStatus(`已恢复为当前阅读片段：${activePassage.label}。`);
    logEvent("excerpt_reset_from_reader", activePassage.label);
  };

  const handleSelectCandidate = (candidate: CandidateCarrier) => {
    const nextSpan = candidateRevisions[candidate.id]?.trim() || candidate.span;
    const openImmediately = displayAudience === "participant" && appMode === "reader" && !showResearchTools;
    if (workspaceMode === "multi") {
      setSelectedCandidateIds((previous) => {
        const isSelected = previous.includes(candidate.id);
        const next = isSelected ? previous.filter((id) => id !== candidate.id) : [...previous, candidate.id];
        if (!isSelected && !selectedCandidateId) {
          setSelectedCandidateId(candidate.id);
          setSelectedSpan(nextSpan);
        }
        if (isSelected && selectedCandidateId === candidate.id) {
          const nextPrimary = activeCandidates.find((item) => next.includes(item.id));
          setSelectedCandidateId(nextPrimary?.id || "");
          setSelectedSpan(nextPrimary ? candidateRevisions[nextPrimary.id]?.trim() || nextPrimary.span : "");
        }
        return next;
      });
    } else {
      setSelectedCandidateIds([candidate.id]);
      setSelectedCandidateId(candidate.id);
      setSelectedSpan(nextSpan);
      const linkedMapping = passageMappings.find(
        (mapping) =>
          compactForMatch(mapping.selectedSpan) === compactForMatch(nextSpan) ||
          compactForMatch(mapping.concreteCarrier.name) === compactForMatch(nextSpan)
      );
      const nextMapping = linkedMapping ?? makeCandidateMapping(activeMapping, { ...candidate, span: nextSpan, label: nextSpan });
      activateMapping(nextMapping);
    }
    setReplacementReview({});
    setWorkflowMappingGenerated(openImmediately);
    setInterpretationDecision("pending");
    setStatus(
      openImmediately
        ? `已临时打开「${candidate.label}」的 Meaning Lens。完成替换判断后，可以回到原文继续读。`
        : `已在本段解释关系中聚焦：${candidate.label}。可以打开阅读试探，查看替换如何影响整段意义。`
    );
    logEvent("candidate_selected", `${candidate.detectionMethod || "candidate"}: ${candidate.span}`);
  };

  const handleCandidateRevision = (candidateId: string, value: string) => {
    setCandidateRevisions((previous) => ({
      ...previous,
      [candidateId]: value,
    }));
  };

  const handleCandidateReview = (candidate: CandidateCarrier, review: CandidateReviewStatus) => {
    const reviewedSpan = candidateRevisions[candidate.id]?.trim() || candidate.span;
    setCandidateReview((previous) => ({
      ...previous,
      [candidate.id]: review,
    }));
    if (review === "accepted" || review === "revised") {
      setSelectedCandidateIds((previous) =>
        workspaceMode === "multi" ? Array.from(new Set([...previous, candidate.id])) : [candidate.id]
      );
      setSelectedCandidateId(candidate.id);
      setSelectedSpan(reviewedSpan);
      setReplacementReview({});
      setWorkflowMappingGenerated(false);
      setInterpretationDecision("pending");
    } else if (review === "rejected") {
      setSelectedCandidateIds((previous) => previous.filter((id) => id !== candidate.id));
      if (selectedCandidateId === candidate.id) {
        const nextPrimary = activeCandidates.find((item) => item.id !== candidate.id && selectedCandidateIds.includes(item.id));
        setSelectedCandidateId(nextPrimary?.id || "");
        setSelectedSpan(nextPrimary ? candidateRevisions[nextPrimary.id]?.trim() || nextPrimary.span : "");
      }
    }
    setStatus(`线索「${candidate.label}」已标记为：${candidateReviewLabels[review]}。`);
    logEvent("candidate_reviewed", `${review}: ${reviewedSpan}`);
  };

  const handleReplacementReview = (comparisonId: string, review: ReplacementReviewStatus) => {
    setReplacementReview((previous) => ({
      ...previous,
      [comparisonId]: review,
    }));
    setInterpretationDecision("pending");
    setStatus(`替换影响已标记为：${replacementReviewLabels[review]}。`);
    logEvent("replacement_reviewed", `${comparisonId}: ${review}`);
  };

  const applyInterpretationTemplate = () => {
    const preserved = activeReplacement.comparisons.find((item) => item.status === "preserved");
    const weakened = activeReplacement.comparisons.find((item) => item.status === "weakened");
    const broken = activeReplacement.comparisons.find((item) => item.status === "broken");
    const emergent = activeReplacement.comparisons.find((item) => item.status === "emergent");
    const evidence = activeEvidence[0]?.excerpt || activeMapping.evidence[0]?.excerpt || activeMapping.passage;
    setReflection(
      `我认为“${activeMapping.selectedSpan}”在这里不只是一个装饰性意象。原文中的“${evidence}”让它和“${activeMapping.broaderMeaningHypotheses[0] || "更宽的意义"}”联系起来。把它换成“${activeReplacement.replacementCarrier}”后，${preserved ? preserved.title : "有些表层效果还在"}，但${weakened ? weakened.title : "原来的关键关系会变弱"}。${broken ? `更关键的是，${broken.title}，说明原意象并不能被简单替代。` : ""}${emergent ? `同时，新的意象还会带来“${emergent.title}”这样的方向。` : ""}`
    );
  };

  const handleScanCandidates = async () => {
    if (!passageDraft.trim()) return;
    if (curatedCandidatesForActivePassage.length > 0) {
      setCandidateScan({
        workTitle: activeWork.title,
        passageLabel: activePassage.label,
        preprocess: {
          segments: [passageDraft],
          entities: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.entities).slice(0, 12),
          images: curatedCandidatesForActivePassage.map((candidate) => candidate.span),
          actions: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.actions).slice(0, 12),
          repeatedTerms: [],
          allusions: [],
          narrativeFrames: ["研究者预设阅读材料"],
        },
        candidates: curatedCandidatesForActivePassage,
      });
      setPassageCandidateIndex((previous) => ({
        ...previous,
        [activePassage.id]: {
          workTitle: activeWork.title,
          passageLabel: activePassage.label,
          preprocess: {
            segments: [passageDraft],
            entities: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.entities).slice(0, 12),
            images: curatedCandidatesForActivePassage.map((candidate) => candidate.span),
            actions: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.actions).slice(0, 12),
            repeatedTerms: [],
            allusions: [],
            narrativeFrames: ["研究者预设阅读材料"],
          },
          candidates: curatedCandidatesForActivePassage,
        },
      }));
      updateActiveSubstrateScan(
        {
          workTitle: activeWork.title,
          passageLabel: activePassage.label,
          preprocess: {
            segments: [passageDraft],
            entities: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.entities).slice(0, 12),
            images: curatedCandidatesForActivePassage.map((candidate) => candidate.span),
            actions: curatedMappingsForActivePassage.flatMap((mapping) => mapping.literalScene.actions).slice(0, 12),
            repeatedTerms: [],
            allusions: [],
            narrativeFrames: ["研究者预设阅读材料"],
          },
          candidates: curatedCandidatesForActivePassage,
        },
        "researcher_curated"
      );
      setCandidateReview({});
      setCandidateRevisions({});
      setEvidenceReview({});
      setReplacementReview({});
      setSelectedCandidateId("");
      setSelectedCandidateIds([]);
      setWorkflowMappingGenerated(false);
      setInterpretationDecision("pending");
      setStatus(`已显示 ${curatedCandidatesForActivePassage.length} 个整理好的可试探线索。选一个，或直接打开默认阅读试探。`);
      logEvent("curated_candidates_loaded", `${activeWork.title}: ${curatedCandidatesForActivePassage.length} candidates`);
      return;
    }
    setIsScanning(true);
    setStatus("正在从文本细节和理论镜头中发现可试探线索...");
    try {
      const result = await scanCandidates({
        workTitle: activeWork.title,
        author: activeWork.author,
        language: activeWork.language,
        tradition: activeWork.tradition,
        passageLabel: activePassage.label,
        passage: passageDraft,
        theoryLenses: selectedTheoryLenses,
      });
      setCandidateScan(result.scan);
      setPassageCandidateIndex((previous) => ({
        ...previous,
        [activePassage.id]: result.scan,
      }));
      updateActiveSubstrateScan(result.scan);
      setCandidateReview({});
      setCandidateRevisions({});
      setEvidenceReview({});
      setReplacementReview({});
      setSelectedCandidateId("");
      setSelectedCandidateIds([]);
      setSelectedSpan("");
      setWorkflowMappingGenerated(false);
      setInterpretationDecision("pending");
      setStatus(`已整理出 ${result.scan.candidates.length} 条可试探线索。它们不是解释结论；请选一个进入 Meaning Lens。`);
      logEvent("candidate_scan_generated", `${result.source}: ${result.scan.candidates.length} candidates`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知线索发现错误。";
      setStatus(`发现线索失败：${message}`);
      logEvent("candidate_scan_failed", message);
    } finally {
      setIsScanning(false);
    }
  };

  const activateMapping = (mapping: LiteraryMapping) => {
    setMappings((previous) => (previous.some((item) => item.id === mapping.id) ? previous : [...previous, mapping]));
    setMappingId(mapping.id);
    setActiveRelationId(mapping.mappingRelations[0]?.id || "");
    setReplacementIdByMapping((previous) => ({
      ...previous,
      [mapping.id]: previous[mapping.id] ?? mapping.replacements[0]?.id ?? "",
    }));
    logEvent("mapping_activated", `${mapping.workTitle}: ${mapping.selectedSpan}`);
  };

  const handleAnalyze = async () => {
    if (!passageDraft.trim()) return;
    if (needsCandidateChoice) {
      setStatus("请先在“读者确认”中选中、接受或修订一条线索，再打开 Meaning Lens。");
      return;
    }
    const reviewedSpan = selectedCandidate
      ? candidateRevisions[selectedCandidate.id]?.trim() || selectedCandidate.span
      : selectedSpan;
    const reviewedCandidate = (candidate: CandidateCarrier): CandidateCarrier => {
      const revised = candidateRevisions[candidate.id]?.trim();
      return revised ? { ...candidate, span: revised, label: revised } : candidate;
    };
    const reviewedSelectedCandidates =
      workspaceMode === "multi"
        ? (selectedCandidates.length > 0 ? selectedCandidates : selectedCandidate ? [selectedCandidate] : []).map(reviewedCandidate)
        : selectedCandidate
          ? [reviewedCandidate(selectedCandidate)]
          : [];
    const curatedMapping = findCuratedMapping(mappings, activeWork.title, activePassage.label, passageDraft, reviewedSpan);
    if (curatedMapping) {
      setIsAnalyzing(true);
      setStatus(`正在打开研究者整理的阅读试探：${curatedMapping.title}...`);
      const normalizedMapping = normalizeMapping(curatedMapping);
      setMappings((previous) => [
        normalizedMapping,
        ...previous.filter((item) => item.id !== normalizedMapping.id),
      ]);
      activateMapping(normalizedMapping);
      setEvidenceReview({});
      setReplacementReview({});
      setWorkflowMappingGenerated(true);
      setInterpretationDecision("pending");
      setStatus(`已打开「${normalizedMapping.selectedSpan}」的阅读试探：先看意义结果，再检查证据和替换变化。`);
      logEvent("curated_mapping_opened", normalizedMapping.selectedSpan);
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setIsAnalyzing(false);
      return;
    }
    setIsAnalyzing(true);
    setStatus("正在把文本证据、读者选择和替换探针整理成一轮可挑战的阅读试探...");
    try {
      const result = await analyzePassage({
        workTitle: activeWork.title,
        author: activeWork.author,
        language: activeWork.language,
        tradition: activeWork.tradition,
        passageLabel: activePassage.label,
        passage: passageDraft,
        selectedSpan: reviewedSpan,
        theoryLenses: selectedTheoryLenses,
      });
      const normalizedMapping = normalizeMapping(result.mapping);
      const multiCandidates =
        workspaceMode === "multi" && reviewedSelectedCandidates.length > 0
          ? reviewedSelectedCandidates
          : candidateScan?.candidates ?? normalizedMapping.candidateCarriers ?? [];
      const generatedMappings =
        workspaceMode === "multi"
          ? [
              normalizedMapping,
              ...multiCandidates
                .filter((candidate) => candidate.span !== normalizedMapping.selectedSpan)
                .slice(0, 5)
                .map((candidate) => makeCandidateMapping(normalizedMapping, candidate)),
            ]
          : [normalizedMapping];
      setMappings((previous) => [
        ...generatedMappings,
        ...previous.filter((item) => !generatedMappings.some((generated) => generated.id === item.id)),
      ]);
      activateMapping(normalizedMapping);
      setEvidenceReview({});
      setReplacementReview({});
      setWorkflowMappingGenerated(true);
      setInterpretationDecision("pending");
      setStatus(
        workspaceMode === "multi"
          ? `已生成 ${generatedMappings.length} 个可比较的意义试探。`
          : `已整理「${normalizedMapping.selectedSpan}」的 Meaning Lens。`
      );
      logEvent(
        workspaceMode === "multi" ? "multi_mapping_generated" : "analysis_generated",
        `${result.source}: ${generatedMappings.map((mapping) => mapping.selectedSpan).join(", ")}`
      );
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知分析错误。";
      setStatus(`阅读试探生成失败：${message}`);
      logEvent("analysis_failed", message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomReplacement = async () => {
    const replacementCarrier = customReplacement.trim();
    if (!replacementCarrier) {
      setStatus("请先在输入框里写一个新的替换意象，再生成自定义比较；如果使用系统建议，直接点击上方“查看比较”。");
      return;
    }
    if (isLowInformationReplacement(replacementCarrier)) {
      setStatus("这个替换太泛了。请写一个具体、可比较的物件、动作、话语或场景，例如“普通药丸”“白馒头”“护身符”。");
      return;
    }
    setIsComparing(true);
    setStatus(`正在比较新的替换载体：${replacementCarrier}...`);
    try {
      const result = await compareReplacement({
        mapping: activeMapping,
        replacementCarrier,
      });
      const nextMapping = {
        ...activeMapping,
        replacements: [
          result.replacement,
          ...activeMapping.replacements.filter((item) => item.id !== result.replacement.id),
        ],
      };
      setMappings((previous) => previous.map((item) => (item.id === activeMapping.id ? nextMapping : item)));
      setReplacementIdByMapping((previous) => ({ ...previous, [activeMapping.id]: result.replacement.id }));
      setReplacementReview({});
      setInterpretationDecision("pending");
      setCustomReplacement("");
      setStatus(`新的替换试探已整理：${result.replacement.replacementCarrier}（${result.source}）。请把它当作待校验的比较。`);
      logEvent("replacement_compared", `${result.source}: ${result.replacement.replacementCarrier}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知替换比较错误。";
      setStatus(`替换比较失败：${message}`);
      logEvent("replacement_compare_failed", message);
    } finally {
      setIsComparing(false);
    }
  };

  const handleEvidenceReview = (evidenceId: string, nextStatus: EvidenceReviewStatus) => {
    setEvidenceReview((previous) => ({ ...previous, [evidenceId]: nextStatus }));
    setInterpretationDecision("pending");
    logEvent("evidence_reviewed", `${evidenceId}: ${nextStatus}`);
  };

  const handleInterpretationDecision = (decision: InterpretationDecision) => {
    setInterpretationDecision(decision);
    if (decision === "kept") {
      setStatus("你已标记：这条解释说得通。可以继续整理一版可编辑草稿，或换一个意象再试。");
    } else if (decision === "revise") {
      setStatus("你已标记：这条解释需要改。可以回到线索，或直接修改下方草稿。");
    } else if (decision === "recorded") {
      setStatus("已整理一版可编辑草稿。请至少改掉一句，让它成为你的读法。");
    }
    logEvent("interpretation_decision", `${decision}: ${activeMapping.selectedSpan}`);
  };

  const handleStudyConditionChange = (condition: StudyCondition) => {
    setStudyCondition(condition);
    logEvent("condition_changed", conditionLabels[condition].label);
  };

  const handleActivateReplacement = (replacementId: string) => {
    setReplacementIdByMapping((previous) => ({ ...previous, [activeMapping.id]: replacementId }));
    setReplacementReview({});
    setInterpretationDecision("pending");
    const replacement = activeMapping.replacements.find((item) => item.id === replacementId);
    setStatus(`已选择替换载体：${replacement?.replacementCarrier || replacementId}。下方已显示比较结果，请确认替换影响。`);
    logEvent("replacement_activated", replacementId);
  };

  const handleFileImport = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (!text.trim()) return;
      const imported = makeImportedWork(text, file.name);
      const importedSubstrate = buildSubstrateForWork(imported, imported.passages);
      setWorks((previous) => [imported, ...previous]);
      setWorkId(imported.id);
      setPassageId(imported.passages[0].id);
      setPassageDraft(imported.passages[0].text);
      setCandidateScan(null);
      syncSubstrate(importedSubstrate);
      setSelectedSpan("");
      setStatus(`已从 ${file.name} 导入 ${imported.passages.length} 个片段。`);
      logEvent("file_imported", file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!passageDraft.trim()) return;
    const imported = makeImportedWork(passageDraft, "粘贴文本");
    const importedSubstrate = buildSubstrateForWork(imported, imported.passages);
    setWorks((previous) => [imported, ...previous]);
    setWorkId(imported.id);
    setPassageId(imported.passages[0].id);
    setCandidateScan(null);
    syncSubstrate(importedSubstrate);
    setStatus("当前文本已保存为导入文本。");
    logEvent("paste_imported", imported.title);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <BookOpen className="h-4 w-4" />
              MeaningForge / CHI27 演示系统
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
              用替换探针看见文学意义如何被建构
            </h1>
          </div>
          <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
            这是一条连续阅读流程：先看意象如何变化，再展开证据、关系和自己的解释草稿。
          </div>
          <HeaderModeBar
            appMode={appMode}
            showResearchTools={showResearchTools}
            displayAudience={displayAudience}
            onModeChange={handleAppModeChange}
            onResearchToggle={handleResearchToolsToggle}
          />
        </div>
      </header>

      <div
        className={cx(
          "mx-auto grid max-w-[1560px] gap-5 px-5 py-5",
          showResearchTools ? "xl:grid-cols-[300px_1fr_360px]" : "xl:grid-cols-[300px_1fr]"
        )}
      >
        <aside className="space-y-4">
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Library className="h-4 w-4" />
              文学图书馆
            </div>
            <div className="mt-3 space-y-2">
              {works.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  onClick={() => handleSelectWork(work.id)}
                  className={cx(
                    "w-full border px-3 py-2 text-left text-sm transition",
                    work.id === activeWork.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  <div className="font-semibold">{work.title}</div>
                  <div className={cx("mt-1 text-xs", work.id === activeWork.id ? "text-slate-200" : "text-slate-500")}>
                    {work.tradition} / {work.author}
                  </div>
                </button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:border-slate-500">
              <Upload className="h-4 w-4" />
              导入 .txt
              <input
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(event) => handleFileImport(event.target.files?.[0])}
              />
            </label>
          </section>

          <section className="border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-950">{activeWork.title}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{activeWork.publicationNote}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{activeWork.sourceNote}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{activeWork.passages.length}</div>
                <div className="mt-1 text-slate-500">片段</div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{activeWork.isFullTextLoaded ? "已载入" : "未载入"}</div>
                <div className="mt-1 text-slate-500">全文</div>
              </div>
            </div>
            {activeWork.fullTextUrl && !activeWork.isFullTextLoaded ? (
              <button
                type="button"
                onClick={handleLoadFullText}
                className="mt-3 w-full border border-teal-700 bg-teal-700 px-3 py-2 text-sm font-medium text-white"
              >
                加载全文
              </button>
            ) : null}
            <label className="mt-3 flex items-center gap-2 border border-slate-300 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={passageSearch}
                onChange={(event) => setPassageSearch(event.target.value)}
                placeholder="搜索章节、场景或词句"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>目录</span>
              <span>{filteredPassages.length}</span>
            </div>
            <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredPassages.slice(0, 80).map((passage: LiteraryPassage) => {
                const stats = passageIndexStats[passage.id];
                return (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => handleSelectPassage(passage.id)}
                    className={cx(
                      "w-full border px-3 py-2 text-left text-sm transition",
                      passage.id === activePassage.id
                        ? "border-teal-700 bg-teal-50 text-teal-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    )}
                  >
                    <div className="font-medium">{passage.label}</div>
                    {passage.chapter ? <div className="mt-1 text-xs text-slate-500">{passage.chapter}</div> : null}
                    {stats ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {stats.count ? `${stats.count} 条线索 / ${stats.status}` : stats.status}
                      </div>
                    ) : null}
                  </button>
                );
              })}
              {filteredPassages.length > 80 ? (
                <div className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-500">
                  仅显示前 80 个匹配结果。可以继续输入关键词缩小范围。
                </div>
              ) : null}
            </div>
          </section>

          {showResearchTools && showMappingScaffold ? (
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FilePlus className="h-4 w-4" />
              当前读法
            </div>
            <div className="mt-3 space-y-2">
              {mappings.slice(0, 8).map((mapping) => (
                <button
                  key={mapping.id}
                  type="button"
                  onClick={() => activateMapping(mapping)}
                  className={cx(
                    "w-full border px-3 py-2 text-left text-sm transition",
                    mapping.id === activeMapping.id
                      ? "border-indigo-700 bg-indigo-50 text-indigo-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  <div className="font-semibold">{mapping.selectedSpan}</div>
                  <div className="mt-1 text-xs text-slate-500">{mapping.workTitle}</div>
                </button>
              ))}
            </div>
          </section>
          ) : null}

          {showResearchTools && showMappingScaffold ? (
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Sparkles className="h-4 w-4" />
              待检关系提醒
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              借鉴 VeriForge：系统给出可检查的线索，读者决定哪些关系成立。
            </p>
            <div className="mt-3">
              <ProactiveAlerts mapping={activeMapping} onSelectRelation={setActiveRelationId} />
            </div>
          </section>
          ) : null}
        </aside>

        <section className="space-y-5">
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  读者
                </div>
                <h2 className="mt-1 text-lg font-semibold">{activePassage.label}</h2>
                <div className="mt-1 text-xs text-slate-500">
                  {activeWork.title} / 第 {passagePosition} 段，共 {passageCount} 段
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleMovePassage(-1)}
                  disabled={passagePosition <= 1}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一段
                </button>
                <button
                  type="button"
                  onClick={() => handleMovePassage(1)}
                  disabled={passagePosition >= passageCount}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40"
                >
                  下一段
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 h-1 bg-slate-100">
              <div
                className="h-full bg-teal-700"
                style={{ width: `${Math.round((passagePosition / Math.max(passageCount, 1)) * 100)}%` }}
              />
            </div>
            <article className="mt-4 max-h-[560px] overflow-y-auto border border-slate-200 bg-[#fbfbf8] p-5 text-base leading-8 text-slate-900">
              <HighlightedPassage
                passage={activePassage.text}
                span={selectedSpan || activeMapping.selectedSpan}
                relatedSpans={candidateDisplayAnchors(activeCandidates)}
              />
            </article>
            {activeSubstrateNode?.semanticAnomalies.length ? (
              <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                <span className="font-semibold">慢读提醒：</span>
                {activeSubstrateNode.semanticAnomalies.map(readerFacingAnomalyLabel).join("；")}。这只是提示可能值得停一下，不是标准答案。
              </div>
            ) : null}
          </section>

          <section className="border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
	              <div>
	                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
	                  线索工作区
	                </div>
	                <h2 className="mt-1 text-lg font-semibold">
                    {appMode === "reader" ? "读完后，选择一个线索临时放大" : "证据、关系与解释草稿"}
                  </h2>
	                <div className="mt-1 text-xs text-slate-500">
	                  当前阅读位置已选取 {activeExcerptWordCount} {activeWork.language === "zh" ? "字" : "词"}。
	                </div>
	                <div className="mt-1 text-xs text-slate-500">
	                  {appMode === "reader"
                      ? "线索不是答案；它只是一个可以被替换、比较和判断的阅读入口。"
                      : "这里展开证据、关系和可修改草稿，用于把阅读试探整理成自己的解释。"}
	                </div>
	              </div>
	              <div className="flex flex-wrap gap-2">
                {showDeepControls ? (
                <div className="inline-flex border border-slate-200 bg-white p-1">
                  {(["focused", "multi"] as MappingWorkspaceMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setWorkspaceMode(mode);
                        if (mode === "focused" && selectedCandidateIds.length > 1) {
                          const focusedId = selectedCandidateId || selectedCandidateIds[0];
                          setSelectedCandidateIds(focusedId ? [focusedId] : []);
                        }
                        logEvent("workspace_mode_changed", mode);
                      }}
                      className={cx(
                        "px-3 py-1.5 text-sm font-medium",
                        workspaceMode === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {mode === "focused" ? "单线索" : "多线索"}
                    </button>
                  ))}
                </div>
                ) : null}
                {showDeepControls ? (
                <div className="flex flex-wrap gap-1 border border-slate-200 bg-white p-1">
                  {theoryLenses.map((lens) => {
                    const isSelected = selectedTheoryLenses.includes(lens);
                    return (
                      <button
                        key={lens}
                        type="button"
                        onClick={() => {
                          setSelectedTheoryLenses((previous) => {
                            const next = previous.includes(lens)
                              ? previous.filter((item) => item !== lens)
                              : [...previous, lens];
                            const resolved = next.length > 0 ? next : [lens];
                            logEvent("theory_lenses_changed", resolved.join(", "));
                            return resolved;
                          });
                        }}
                        className={cx(
                          "px-2.5 py-1.5 text-xs font-medium",
                          isSelected ? "bg-indigo-700 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {theoryLensLabels[lens]}
                      </button>
                    );
                  })}
                </div>
                ) : null}
	                {showDeepControls ? (
	                <button
	                  type="button"
	                  onClick={handleUseVisibleSection}
	                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
	                >
	                  <BookOpen className="h-4 w-4" />
	                  使用可见部分
	                </button>
	                ) : null}
	                <button
	                  type="button"
	                  onClick={handleScanCandidates}
	                  disabled={isScanning}
	                  className="inline-flex items-center gap-2 border border-indigo-700 bg-indigo-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
	                >
	                  {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
	                  {isScanning ? "发现中..." : appMode === "reader" ? "发现本段线索" : "发现线索"}
	                </button>
	                {showDeepControls ? (
	                <button
	                  type="button"
	                  onClick={handlePasteImport}
	                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
	                  <Plus className="h-4 w-4" />
	                  保存摘录
	                </button>
	                ) : null}
	                {showDeepControls ? (
	                <button
	                  type="button"
	                  onClick={handleAnalyze}
	                  disabled={!canGenerateMapping}
                  className="inline-flex items-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalyzing
                    ? "整理中..."
                    : needsCandidateChoice
                      ? "先选线索"
                      : workspaceMode === "multi"
                        ? `整理多条线索(${selectedCandidateIds.length})`
                        : selectedCandidate
                          ? "整理解释"
	                          : "打开当前线索"}
	                </button>
	                ) : null}
	              </div>
	            </div>
            {showResearchTools ? (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {[
                [
                  "发现线索",
                  candidateScan
                    ? selectedCandidateIds.length
                      ? `已选 ${selectedCandidateIds.length}，已标记 ${candidateMarkedCount}`
                      : `待选择，已标记 ${candidateMarkedCount}`
                    : "等待发现",
                  "系统只提出可检查线索；正式解释仍要回到 UIRR packet、证据和读者判断。",
                ],
                [
                  "意义图谱",
                  workflowMappingGenerated
                    ? evidenceDecisionCount
                      ? `读者校验 ${evidenceDecisionCount}/${activeEvidenceCount}`
                      : `待校验证据 0/${activeEvidenceCount}`
                    : selectedCandidateIds.length
                      ? "可整理解释"
                      : "等待线索",
                  "把线索展开成可检查的载体、关系、证据结构，并由读者校验。",
                ],
                [
                  "替换探针",
                  interpretationDecision !== "pending"
                    ? interpretationDecisionLabels[interpretationDecision]
                    : replacementDecisionCount
                      ? `已判断 ${replacementDecisionCount}/${replacementComparisonCount}`
                      : workflowMappingGenerated
                        ? "可替换测试"
                        : "等待解释关系",
                  "用替换方向测试解释关系，读者确认影响后收束或回到修订。",
                ],
              ].map(([label, state, description]) => (
                <div key={label} className="border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-0.5 text-sm font-semibold text-slate-950">{label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{state}</div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">{description}</div>
                </div>
              ))}
            </div>
            ) : null}
	            {showDeepControls ? (
	            <textarea
	              value={passageDraft}
	              onChange={(event) => setPassageDraft(event.target.value)}
	              className="mt-3 min-h-40 w-full resize-y border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900"
	            />
	            ) : null}
            {showResearchTools ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="border border-amber-200 bg-amber-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  {workflowMappingGenerated ? "当前载体" : "待构建对象"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-950">
                  {workflowMappingGenerated
                    ? activeMapping.concreteCarrier.name
                    : selectedCandidateIds.length
                      ? workspaceMode === "multi"
                        ? `已选 ${selectedCandidateIds.length} 条线索`
                        : selectedCandidateSummary || selectedSpan
                      : "还没有选中线索"}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-600">
                  {workflowMappingGenerated
                    ? activeMapping.concreteCarrier.relations[0]
                    : selectedCandidateSummary || "先发现线索，再由读者选择或修订分析对象。"}
                </div>
              </div>
              <div className="border border-indigo-200 bg-indigo-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">
                  {workflowMappingGenerated ? "暗示含义" : workspaceMode === "multi" ? "多线索选择" : "读者确认"}
                </div>
                <div className="mt-1 text-sm leading-5 text-slate-900">
                  {workflowMappingGenerated
                    ? activeMapping.broaderMeaningHypotheses[0]
                    : selectedCandidateIds.length
                      ? workspaceMode === "multi"
                        ? `将整理 ${selectedCandidateIds.length} 条线索：${selectedCandidateSummary}`
                        : `当前线索：${selectedCandidateSummary || (selectedCandidate ? candidateRevisions[selectedCandidate.id]?.trim() || selectedCandidate.span : selectedSpan)}`
                      : "还没有选中线索。"}
                </div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {workflowMappingGenerated ? "可探测方向" : "下一步"}
                </div>
                <div className="mt-1 text-sm leading-5 text-slate-900">
                  {workflowMappingGenerated
                    ? `替换为 ${activeMapping.replacements[0]?.replacementCarrier || "另一个具体意象"}。`
                    : selectedCandidateIds.length
                      ? workspaceMode === "multi"
                        ? `点击“整理多条线索(${selectedCandidateIds.length})”。`
                        : "点击“整理解释”。"
                      : "选定线索后，再整理解释。"}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-600">
                  重新分析后，系统会基于当前摘录更新这些建议。
                </div>
              </div>
            </div>
            ) : null}
            <div className="mt-3 border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    本段可追踪线索
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">
                    {showResearchTools
                    ? "系统按理论镜头发现线索；这些不是解释结论，需要读者用证据校验。"
                      : "先选一个你想追踪的具体物，再打开一轮可挑战的阅读试探。"}
                  </div>
                </div>
                <span className="border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                  {activeCandidates.length}
                </span>
              </div>
              {showResearchTools && candidateScan ? (
                <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                  <div className="border border-slate-200 bg-white p-2">
                    <div className="font-semibold text-slate-900">{candidateScan.preprocess.images.length}</div>
                    <div>意象 / 母题</div>
                  </div>
                  <div className="border border-slate-200 bg-white p-2">
                    <div className="font-semibold text-slate-900">{candidateScan.preprocess.entities.length}</div>
                    <div>实体</div>
                  </div>
                  <div className="border border-slate-200 bg-white p-2">
                    <div className="font-semibold text-slate-900">{candidateScan.preprocess.narrativeFrames.length}</div>
                    <div>叙事框架</div>
                  </div>
                </div>
              ) : null}
              {activeCandidates.length > 0 ? (
                <div className="mt-3 border border-teal-200 bg-teal-50 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-teal-950">读者确认</div>
                      <div className="mt-1 text-xs leading-5 text-teal-800">
                        {appMode === "reader"
                          ? "先选一个主线索开始阅读；要比较多个线索时，可以进入整理解释。"
                          : workspaceMode === "multi"
                          ? "多线索状态下，可以加入多个线索；接受或修订会把它们加入待整理集合。"
                          : "单线索状态下，选择一个线索作为当前焦点；接受或修订会更新当前焦点。"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-medium">
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{selectedCandidateIds.length}</div>
                        <div>{workspaceMode === "multi" ? "已加入" : "主载体"}</div>
                      </div>
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{candidateMarkedCount}</div>
                        <div>已标记</div>
                      </div>
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{activeCandidates.length}</div>
                        <div>线索总数</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {activeCandidates.slice(0, 6).map((candidate) => {
                  const review = candidateReview[candidate.id] || "pending";
                  const revisedSpan = candidateRevisions[candidate.id] ?? "";
                  const isCandidateSelected = selectedCandidateIds.includes(candidate.id);
                  return (
                  <article
                    key={candidate.id}
                    className={cx(
                      "border p-3 text-left transition hover:border-slate-400",
                      isCandidateSelected || candidate.id === selectedCandidateId || candidate.span === activeMapping.selectedSpan
                        ? "border-teal-600 bg-white"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-950">{candidate.label}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase text-slate-500">
                          {candidate.detectionMethod ? detectionMethodLabels[candidate.detectionMethod] : "读者标记"}
                        </span>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {candidateReviewLabels[review]}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">
                      {showResearchTools ? candidate.whyCandidate : readerFacingCandidateReason(candidate)}
                    </div>
                    {showResearchTools && candidate.semanticTension ? (
                      <div className="mt-2 border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-800">语义张力：</span> {candidate.semanticTension}
                      </div>
                    ) : null}
                    {showResearchTools ? (
                    <div className="mt-2 grid gap-2 text-[11px] text-slate-500 md:grid-cols-2">
                      {candidate.basicMeaning ? <div>基础义：{candidate.basicMeaning}</div> : null}
                      {candidate.contextualMeaning ? <div>语境义：{candidate.contextualMeaning}</div> : null}
                      {candidate.culturalResonance ? (
                        <div className="md:col-span-2">文化共鸣：{candidate.culturalResonance}</div>
                      ) : null}
                    </div>
                    ) : null}
                    {candidate.evidenceExcerpt ? (
                      <div className="mt-2 border-l-2 border-slate-200 pl-2 text-xs leading-5 text-slate-500">
                        {candidate.evidenceExcerpt}
                      </div>
                    ) : null}
                    {showResearchTools && candidate.theoryTrace &&
                    Object.values(candidate.theoryTrace).some((trace) => Boolean(trace?.trim())) ? (
                      <div className="mt-2 border border-indigo-100 bg-indigo-50 p-2 text-[11px] leading-5 text-indigo-950">
                        <div className="font-semibold">理论追踪</div>
                        <div className="mt-1 grid gap-1 md:grid-cols-2">
                          {candidate.theoryTrace.mipVu ? <div>MIP: {candidate.theoryTrace.mipVu}</div> : null}
                          {candidate.theoryTrace.chinesePoetics ? (
                            <div>中国诗学: {candidate.theoryTrace.chinesePoetics}</div>
                          ) : null}
                          {candidate.theoryTrace.symbolMotif ? (
                            <div>母题/象征: {candidate.theoryTrace.symbolMotif}</div>
                          ) : null}
                          {candidate.theoryTrace.narrativeStructure ? (
                            <div>叙事结构: {candidate.theoryTrace.narrativeStructure}</div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {showResearchTools ? (
                    <div className="mt-2 flex gap-2 text-[11px] font-medium uppercase text-slate-500">
                      <span>优先级：{importanceLabels[candidate.priority]}</span>
                      <span>显著性：{candidate.readerSalience ? importanceLabels[candidate.readerSalience] : "中"}</span>
                      <span>置信：{candidate.confidence ? importanceLabels[candidate.confidence] : "中"}</span>
                      <span>可替换性：{candidate.replaceability ? importanceLabels[candidate.replaceability] : "中"}</span>
                    </div>
                    ) : null}
                    {showResearchTools && candidate.scores ? (
                      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px] text-slate-500">
                        <div className="border border-slate-200 bg-white p-1">MIP {candidate.scores.mipTension}</div>
                        <div className="border border-slate-200 bg-white p-1">Poet {candidate.scores.poeticImagery}</div>
                        <div className="border border-slate-200 bg-white p-1">Motif {candidate.scores.motifRecurrence}</div>
                        <div className="border border-slate-200 bg-white p-1">Narr {candidate.scores.narrativeImportance}</div>
                        <div className="border border-slate-200 bg-white p-1">Evd {candidate.scores.evidenceDensity}</div>
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-2">
	                      {showDeepControls ? (
	                      <input
	                        value={revisedSpan}
	                        onChange={(event) => handleCandidateRevision(candidate.id, event.target.value)}
	                        placeholder={`修订线索表达，默认：${candidate.span}`}
	                        className="w-full border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
	                      />
	                      ) : null}
	                      {showResearchTools ? (
                      <div className="grid grid-cols-5 gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCandidate(candidate)}
                          className="border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-400"
                        >
                          {workspaceMode === "multi" ? (isCandidateSelected ? "移除" : "加入") : "选中"}
                        </button>
                        {(["accepted", "revised", "rejected", "saved"] as CandidateReviewStatus[]).map((nextReview) => (
                          <button
                            key={nextReview}
                            type="button"
                            onClick={() => handleCandidateReview(candidate, nextReview)}
                            className={cx(
                              "border px-2 py-1 text-[11px] font-medium",
                              review === nextReview
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            )}
                          >
                            {candidateReviewLabels[nextReview]}
                          </button>
                        ))}
                      </div>
                      ) : (
                      <div className="grid grid-cols-3 gap-1">
	                        <button
	                          type="button"
	                          onClick={() => handleSelectCandidate(candidate)}
	                          className="border border-teal-700 bg-teal-700 px-2 py-1.5 text-[11px] font-medium text-white"
	                        >
	                          打开 Lens
	                        </button>
                        <button
                          type="button"
                          onClick={() => handleCandidateReview(candidate, "accepted")}
                          className={cx(
                            "border px-2 py-1.5 text-[11px] font-medium",
                            review === "accepted"
                              ? "border-emerald-700 bg-emerald-700 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          )}
                        >
                          说得通
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCandidateReview(candidate, "rejected")}
                          className={cx(
                            "border px-2 py-1.5 text-[11px] font-medium",
                            review === "rejected"
                              ? "border-rose-700 bg-rose-700 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          )}
                        >
                          不成立
                        </button>
                      </div>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
	            <div className={cx("mt-3 grid gap-3", showDeepControls ? "md:grid-cols-[1fr_260px]" : "")}>
                {showDeepControls ? (
	              <input
	                value={selectedSpan}
	                onChange={(event) => setSelectedSpan(event.target.value)}
	                placeholder="可选载体 / 片段，例如：落花"
	                className="border border-slate-300 px-3 py-2 text-sm"
	              />
                ) : null}
	              <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
	                {status}
	              </div>
            </div>
          </section>

          {studyCondition === "explanation" ? (
            <section className="border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <MessageSquareText className="h-4 w-4" />
                解释基线
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-800">{explanationSummary}</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                这个基线只给出流畅解释结论，不暴露背后的可编辑关系结构。
              </p>
            </section>
          ) : null}

          {showMappingScaffold && !showDeepControls ? (
            <div ref={resultsRef}>
              <MeaningLensPanel
                mapping={activeMapping}
                replacement={activeReplacement}
                relation={activeRelation}
                evidence={activeEvidence}
                interpretationDecision={interpretationDecision}
                showResearchControls={displayAudience === "researcher" && showResearchTools}
                onReplacementSelect={handleActivateReplacement}
                onInterpretationDecision={handleInterpretationDecision}
                onReturnToReading={() => {
                  setWorkflowMappingGenerated(false);
                  setStatus("已回到原文。可以继续阅读，或临时点开另一个线索。");
                  logEvent("lens_closed_to_continue_reading", activeMapping.selectedSpan);
                  window.requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  });
                }}
                onPolish={() => {
                  setAppMode("polish");
                  logEvent("polish_opened_from_lens", activeMapping.selectedSpan);
                }}
              />
            </div>
          ) : null}

          {showMappingScaffold && showDeepControls ? (
          <div ref={resultsRef}>
            <ExplorationWorkspace
              mapping={activeMapping}
              passageMappings={passageMappings}
              candidates={activeCandidates}
              selectedCandidateIds={selectedCandidateIds}
              candidateReview={candidateReview}
              activeRelationId={activeRelationId}
              activeRelation={activeRelation}
              activeEvidence={activeEvidence}
              activeReplacement={activeReplacement}
              relationById={relationById}
              evidenceReview={evidenceReview}
              replacementReview={replacementReview}
              reflection={reflection}
              interpretationDecision={interpretationDecision}
              customReplacement={customReplacement}
              isComparing={isComparing}
              workspaceMode={workspaceMode}
              evidenceDecisionCount={evidenceDecisionCount}
              activeEvidenceCount={activeEvidenceCount}
              replacementDecisionCount={replacementDecisionCount}
              replacementComparisonCount={replacementComparisonCount}
              onSelectRelation={setActiveRelationId}
              onSelectCandidate={handleSelectCandidate}
              onActivateMapping={activateMapping}
              onActivateReplacement={handleActivateReplacement}
              onEvidenceReview={handleEvidenceReview}
              onReplacementReview={handleReplacementReview}
              onCustomReplacementChange={setCustomReplacement}
              onCustomReplacement={handleCustomReplacement}
              onReflectionChange={setReflection}
              onInterpretationDecision={handleInterpretationDecision}
              onGenerateInterpretation={applyInterpretationTemplate}
            />
          </div>
          ) : null}

        </section>

        {showResearchTools ? (
        <aside className="space-y-4">
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ClipboardCheck className="h-4 w-4" />
                  Research Inspector
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  同一阅读流程的研究者检查层。默认只显示当前状态，详细记录按需打开。
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleResearchToolsToggle(false)}
                className="border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
              >
                收起
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{activeCandidates.length}</div>
                <div className="mt-1 text-slate-500">当前线索</div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">
                  {activeSubstrateNode
                    ? activeSubstrateNode.calibrationStatus === "researcher_curated"
                      ? "已整理"
                      : activeSubstrateNode.calibrationStatus === "unscanned"
                        ? "未扫描"
                        : "草稿"
                    : "无底座"}
                </div>
                <div className="mt-1 text-slate-500">节点状态</div>
              </div>
            </div>
            <div className="mt-3 border border-rose-200 bg-rose-50 p-2 text-xs leading-5 text-rose-900">
              仅实验员后台可见。若把屏幕交给参与者，请切回“参与者显示”。
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1">
              {([
                ["overview", "概览"],
                ["substrate", "底座"],
                ["authoring", "校准"],
                ["packet", "材料"],
                ["logs", "记录"],
              ] as Array<[ResearchInspectorTab, string]>).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResearchInspectorTab(tab)}
                  className={cx(
                    "border px-2 py-1.5 text-xs font-medium",
                    researchInspectorTab === tab
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {researchInspectorTab === "overview" ? (
            <section className="border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Sparkles className="h-4 w-4" />
                当前阅读节点
              </div>
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <div className="border border-slate-200 bg-slate-50 p-2">
                  <div className="font-semibold text-slate-950">{activePassage.label}</div>
                  <div className="mt-1">{activeWork.title} / {activeWork.author}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-slate-200 bg-slate-50 p-2">
                    <div className="font-semibold text-slate-950">{activeExcerptWordCount}</div>
                    <div>{activeWork.language === "zh" ? "字" : "词"}</div>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-2">
                    <div className="font-semibold text-slate-950">{selectedCandidateIds.length || "待选"}</div>
                    <div>聚焦线索</div>
                  </div>
                </div>
                {activeSubstrateNode?.semanticAnomalies.length ? (
                  <div className="border border-amber-200 bg-amber-50 p-2 text-amber-900">
                    反常组合：{activeSubstrateNode.semanticAnomalies.join(" / ")}
                  </div>
                ) : (
                  <div className="border border-slate-200 bg-slate-50 p-2">
                    当前节点暂无明显 semantic anomaly；可从线索或原文证据继续检查。
                  </div>
                )}
                <div className="border border-amber-200 bg-amber-50 p-2 text-amber-900">
                  研究者默认只需接受 / 拒绝线索，或在材料 tab 标记 packet 状态；详细结构不必一直展开。
                </div>
              </div>
            </section>
          ) : null}

          {researchInspectorTab === "overview" && showMappingScaffold && showDeepControls ? (
            <MeaningCanvas
              mapping={activeMapping}
              replacement={activeReplacement}
              activeRelationId={activeRelationId}
              onSelectRelation={setActiveRelationId}
            />
          ) : null}

          {researchInspectorTab === "substrate" ? (
            <LiterarySubstratePanel substrate={literarySubstrate} activePassageId={activePassage.id} />
          ) : null}

          {researchInspectorTab === "authoring" ? (
            showMappingScaffold ? (
              <ResearchAuthoringV2Panel mapping={activeMapping} />
            ) : (
              <section className="border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
                先在中间阅读区选择一个线索并打开 Meaning Lens，再进行 type-specific 校准。
              </section>
            )
          ) : null}

          {researchInspectorTab === "packet" ? (
          <MaterialBuilderPanel
            work={activeWork}
            passage={activePassage}
            mapping={activeMapping}
            candidateScan={candidateScan}
            substrate={literarySubstrate}
            activeExcerptWordCount={activeExcerptWordCount}
            candidateMarkedCount={candidateMarkedCount}
            selectedCandidateCount={selectedCandidateIds.length}
            onMarkPacketStatus={handleMarkPacketStatus}
          />
          ) : null}

          {researchInspectorTab === "logs" ? (
            <>
              <StudyModeSwitch condition={studyCondition} onChange={handleStudyConditionChange} />
              <StudySessionPanel
                condition={studyCondition}
                workspaceMode={workspaceMode}
                selectedCandidateCount={selectedCandidateIds.length}
                candidateMarkedCount={candidateMarkedCount}
                evidenceDecisionCount={evidenceDecisionCount}
                activeEvidenceCount={activeEvidenceCount}
                replacementDecisionCount={replacementDecisionCount}
                replacementComparisonCount={replacementComparisonCount}
                interpretationDecision={interpretationDecision}
                mapping={activeMapping}
                eventCount={studyLog.length}
              />
              <StudyLogPanel events={studyLog} />
            </>
          ) : null}
        </aside>
        ) : null}
      </div>
    </main>
  );
}

export default App;

