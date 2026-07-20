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
  Link2,
  Loader2,
  MessageSquareText,
  Network,
  PencilLine,
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
import type {
  CandidateCarrier,
  CandidateScanResult,
  CandidateReviewStatus,
  ComparisonStatus,
  DetectionMethod,
  EvidenceKind,
  EvidenceReviewStatus,
  ExpressionType,
  LiteraryEvidence,
  LiteraryMapping,
  LiteraryPassage,
  LiteraryWork,
  MappingWorkspaceMode,
  MappingRelation,
  ReplacementAnalysis,
  ReplacementReviewStatus,
  StudyCondition,
  StudyLogEvent,
  TheoryLens,
} from "@/types/literaryMapping";

type InterpretationDecision = "pending" | "kept" | "revise" | "recorded";

const expressionTypes: ExpressionType[] = [
  "lexical_metaphor",
  "metaphorically_structured_image",
  "recurring_metaphorical_motif",
  "metaphorically_structured_action",
];
const evidenceKinds: EvidenceKind[] = ["textual", "cultural", "critical"];
const comparisonStatuses: ComparisonStatus[] = ["preserved", "broken", "emergent"];
const relationImportances: Array<MappingRelation["importance"]> = ["high", "medium", "low"];
const uncertaintyLevels: Array<LiteraryMapping["uncertainty"]> = ["low", "medium", "high"];
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
const groundednessLevels: NonNullable<LiteraryEvidence["groundedness"]>[] = [
  "direct_quote",
  "paraphrase",
  "inference",
];
const replacementStrategies: NonNullable<ReplacementAnalysis["replacementStrategy"]>[] = [
  "near_neighbor",
  "cultural_variant",
  "oppositional",
  "literalizing",
  "reader_authored",
];
const theoryLenses: TheoryLens[] = ["mip_mipvu", "chinese_poetics", "symbol_motif", "narrative_structure"];
const theoryLensLabels: Record<TheoryLens, string> = {
  mip_mipvu: "MIP / MIPVU",
  chinese_poetics: "Chinese poetics",
  symbol_motif: "Symbol / motif",
  narrative_structure: "Narrative structure",
};
const detectionMethods: DetectionMethod[] = [
  "MIP/MIPVU",
  "Chinese poetics",
  "Symbol/motif",
  "Narrative structure",
  "LLM semantic scan",
];

const statusStyles: Record<ComparisonStatus, { label: string; className: string; icon: LucideIcon }> = {
  preserved: {
    label: "保留",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  broken: {
    label: "破碎",
    className: "border-rose-200 bg-rose-50 text-rose-900",
    icon: TriangleAlert,
  },
  emergent: {
    label: "涌现",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    icon: Sparkles,
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

function createLogEvent(type: string, detail: string): StudyLogEvent {
  return {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp: Date.now(),
    type,
    detail,
  };
}

function coerceOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
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
        status: "broken",
        title: "原有联想被削弱",
        explanation: "原载体承载的一部分文本、文化或叙事关联在替换后不再稳定。",
        relationIds: [],
        diagnosticQuestion: "替换后，哪些原本依附于该意象的关联变弱或失效？",
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
    "suggested carrier";
  const mappingId = uniqueId(mapping.id, `mapping_${Date.now()}_${Math.floor(Math.random() * 10000)}`, new Set());
  const evidenceIds = new Set<string>();
  const evidence = (mapping.evidence ?? []).map((item, index) => ({
    ...item,
    id: uniqueId(item.id, `${mappingId}_e${index + 1}`, evidenceIds),
    kind: coerceOneOf(item.kind, evidenceKinds, "textual"),
    label: item.label?.trim() || `Evidence ${index + 1}`,
    excerpt: item.excerpt ?? "",
    note: item.note ?? "",
    sourceRole: coerceOneOf(item.sourceRole, sourceRoles, item.kind === "textual" ? "passage" : "cultural_context"),
    groundedness: coerceOneOf(item.groundedness, groundednessLevels, item.kind === "textual" ? "direct_quote" : "inference"),
  }));
  const relationIds = new Set<string>();
  const mappingRelations = (mapping.mappingRelations ?? []).map((relation, index) => ({
    ...relation,
    id: uniqueId(relation.id, `${mappingId}_r${index + 1}`, relationIds),
    carrierRelation: relation.carrierRelation?.trim() || `${selectedSpan} appears in the passage.`,
    meaningRelation: relation.meaningRelation?.trim() || "The concrete image suggests a broader meaning.",
    importance: coerceOneOf(relation.importance, relationImportances, "medium"),
    evidenceIds: Array.isArray(relation.evidenceIds) ? relation.evidenceIds.filter(Boolean) : [],
    relationType: coerceOneOf(relation.relationType, relationTypes, "attribute"),
    readerStatus: coerceOneOf(relation.readerStatus, ["unreviewed", "accepted", "revised", "rejected"] as const, "unreviewed"),
  }));
  const replacementIds = new Set<string>();
  const replacements = (mapping.replacements ?? []).map((replacement, index) => ({
    ...replacement,
    id: uniqueId(replacement.id, `${mappingId}_replacement_${index + 1}`, replacementIds),
    label: replacement.label?.trim() || `Replacement ${index + 1}`,
    replacementCarrier: replacement.replacementCarrier?.trim() || "another concrete image",
    purpose: replacement.purpose?.trim() || "Compare what changes under a different carrier.",
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
        title: comparison.title?.trim() || `Comparison ${comparisonIndex + 1}`,
        explanation: comparison.explanation?.trim() || "The replacement changes part of the mapping.",
        relationIds: Array.isArray(comparison.relationIds) ? comparison.relationIds.filter(Boolean) : [],
        diagnosticQuestion:
          comparison.diagnosticQuestion?.trim() || "What does this replacement reveal about the original mapping?",
        readerStatus: coerceOneOf(
          comparison.readerStatus,
          ["unreviewed", "confirmed", "revised", "rejected", "uncertain"] as const,
          "unreviewed"
        ),
      }));
    })(),
  }));
  const candidateIds = new Set<string>();
  const candidateCarriers = (mapping.candidateCarriers ?? []).map((candidate, index) => ({
    ...candidate,
    id: uniqueId(candidate.id, `${mappingId}_candidate_${index + 1}`, candidateIds),
    span: candidate.span?.trim() || candidate.label?.trim() || selectedSpan,
    label: candidate.label?.trim() || candidate.span?.trim() || `Candidate ${index + 1}`,
    whyCandidate: candidate.whyCandidate?.trim() || "This image may support a metaphorical reading.",
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
              whyCandidate: "Current focused carrier for the detailed mapping.",
              evidenceExcerpt: mapping.passage?.slice(0, 160) || "",
              priority: "high",
              detectionMethod: "LLM semantic scan",
              basicMeaning: selectedSpan,
              contextualMeaning: "Current focused carrier for the detailed mapping.",
              semanticTension: "Inspect whether the phrase carries meaning beyond its literal context.",
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
    },
    studyHooks: {
      designGoal: mapping.studyHooks?.designGoal ?? [
        "Externalize metaphorical meaning as editable structure.",
        "Support reader agency through confirmation and revision.",
      ],
      expectedUserAction: mapping.studyHooks?.expectedUserAction ?? [
        "Select carriers",
        "Validate evidence",
        "Compare replacement consequences",
      ],
      measurableOutcome: mapping.studyHooks?.measurableOutcome ?? [
        "Mapping specificity",
        "Evidence grounding",
        "Replacement insight",
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
  return normalizeMapping({
    ...base,
    id: mappingId,
    title: `${candidate.label} as a meaning carrier`,
    selectedSpan: candidate.span,
    concreteCarrier: {
      name: candidate.label,
      attributes: [candidate.priority, candidate.detectionMethod || "candidate", "reader-selectable"],
      relations: [candidate.semanticTension || candidate.whyCandidate],
    },
    broaderMeaningHypotheses: [
      candidate.contextualMeaning || candidate.whyCandidate,
      candidate.culturalResonance || candidate.semanticTension || "Theory-guided candidate for close reading.",
    ],
    mappingRelations: [
      {
        id: relationId,
        carrierRelation: candidate.evidenceExcerpt || `${candidate.span} appears in the selected excerpt.`,
        meaningRelation: candidate.whyCandidate,
        importance: candidate.priority,
        evidenceIds: [evidenceId],
      },
    ],
    evidence: [
      {
        id: evidenceId,
        kind: "textual",
        label: "Candidate evidence",
        excerpt: candidate.evidenceExcerpt || candidate.span,
        note: "Candidate generated during multi-mapping scan.",
      },
    ],
    candidateCarriers: base.candidateCarriers,
    replacements: [fallbackReplacement(mappingId, candidate.label)],
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
    label: "C2 可见映射",
    description: "把意义拆成载体、关系和证据。",
  },
  interactive_reworking: {
    label: "C3 重制",
    description: "通过可编辑的替换比较来构建意义。",
  },
};

function makeImportedWork(text: string, fileName = "Imported classic"): LiteraryWork {
  const cleanText = text.trim();
  const passages = splitFullTextIntoPassages(cleanText, fileName).slice(0, 200);

  return {
    id: `imported_${Date.now()}`,
    title: fileName.replace(/\.[^.]+$/, "") || "Imported classic",
    author: "Imported by user",
    language: "other",
    tradition: "Imported",
    publicationNote: "User-provided text. Check copyright and edition permissions before research use.",
    sourceNote: "Imported locally into this demo session.",
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
    /^\s*((?:CHAPTER|ACT)\s+(?:[IVXLCDM]+|\d+)\.?.*)\s*$/gim,
    /^\s*((?:I|II|III|IV|V|VI|VII|VIII|IX|X))\s*$/gm,
  ];
  const matches = sectionPatterns
    .flatMap((pattern) =>
      Array.from(cleanText.matchAll(pattern)).map((match) => ({
        index: match.index ?? 0,
        label: match[1].trim(),
      }))
    )
    .sort((a, b) => a.index - b.index)
    .filter((match, index, allMatches) => index === 0 || match.index !== allMatches[index - 1].index);

  if (matches.length === 0) {
    return chunkLongSection(normalizeProseLineBreaks(cleanText), 2200).map((chunk, index) => ({
      id: `section_${Date.now()}_${index}`,
      label: `Section ${index + 1}`,
      chapter: title,
      text: chunk,
    }));
  }

  const passages: LiteraryPassage[] = [];
  matches.forEach((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? cleanText.length;
    const chapterTitle = match.label;
    const chapterText = normalizeProseLineBreaks(cleanText.slice(start, end).trim());
    if (chapterText.length < 400) return;
    if (/Dramatis Person/i.test(chapterText.slice(0, 1200))) return;

    chunkLongSection(chapterText).forEach((chunk, chunkIndex) => {
      passages.push({
        id: `chapter_${index + 1}_${chunkIndex}_${Date.now()}`,
        label: chunkIndex === 0 ? chapterTitle : `${chapterTitle} / Part ${chunkIndex + 1}`,
        chapter: chapterTitle,
        text: chunk,
      });
    });
  });

  return passages;
}

function EvidencePill({ evidence }: { evidence: LiteraryEvidence }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <Link2 className="h-3 w-3" />
      {evidence.label}
    </span>
  );
}

function RelationRow({
  relation,
  evidence,
  isActive,
  onSelect,
}: {
  relation: MappingRelation;
  evidence: LiteraryEvidence[];
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50",
        isActive && "bg-teal-50 hover:bg-teal-50"
      )}
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Carrier relation</div>
        <div className="mt-1 text-sm leading-5 text-slate-900">{relation.carrierRelation}</div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
        <GitCompareArrows className="h-4 w-4" />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">意义关系</div>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            {relation.importance}
          </span>
        </div>
        <div className="mt-1 text-sm leading-5 text-slate-900">{relation.meaningRelation}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {evidence.map((item) => (
            <EvidencePill key={item.id} evidence={item} />
          ))}
        </div>
      </div>
    </button>
  );
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
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                {item.kind}
              </span>
              {item.sourceRole ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {item.sourceRole}
                </span>
              ) : null}
              {item.groundedness ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {item.groundedness}
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
              {relation.importance}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium leading-5 text-slate-950">
            {relation.carrierRelation}
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-600">
            Inspect this relation before accepting the interpretation.
          </div>
        </button>
      ))}
    </div>
  );
}

function DualStreamPanel({
  mapping,
  activeRelationId,
  onSelectRelation,
}: {
  mapping: LiteraryMapping;
  activeRelationId: string;
  onSelectRelation: (relationId: string) => void;
}) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <MessageSquareText className="h-4 w-4" />
        双流意义脚手架
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            对话流
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            当前载体 <span className="font-semibold text-teal-800">{mapping.selectedSpan}</span>
            是进入解释的具体抓手。它的意义来自局部场景、总体假设和右侧证据之间的关系。
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            系统不会直接给出最终答案，而是暴露可保存、拒绝、修订或通过替换继续测试的关系。
          </p>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            结构化关系卡片
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapping.mappingRelations.map((relation, index) => (
              <button
                key={relation.id}
                type="button"
                onClick={() => onSelectRelation(relation.id)}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  activeRelationId === relation.id
                    ? "border-teal-700 bg-teal-700 text-white"
                    : index % 3 === 0
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : index % 3 === 1
                        ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                        : "border-indigo-200 bg-indigo-50 text-indigo-900"
                )}
              >
                {relation.meaningRelation.slice(0, 54)}
                {relation.meaningRelation.length > 54 ? "..." : ""}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
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
          <div className="grid grid-cols-3 gap-2">
            {(["preserved", "broken", "emergent"] as const).map((status) => {
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
          User study session
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(exportPayload, null, 2))}
          className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
        >
          <Download className="h-3 w-3" />
          Export
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{conditionLabels[condition].label}</div>
          <div className="mt-1 text-slate-500">study condition</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{workspaceMode === "multi" ? "Multi-mapping" : "Focused"}</div>
          <div className="mt-1 text-slate-500">workspace</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{selectedCandidateCount}/{candidateMarkedCount}</div>
          <div className="mt-1 text-slate-500">selected / marked candidates</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{evidenceDecisionCount}/{activeEvidenceCount}</div>
          <div className="mt-1 text-slate-500">current relation evidence</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{replacementDecisionCount}/{replacementComparisonCount}</div>
          <div className="mt-1 text-slate-500">replacement judgments</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2">
          <div className="font-semibold text-slate-950">{interpretationDecision}</div>
          <div className="mt-1 text-slate-500">final decision</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        This panel separates interaction-design measures from LLM quality, following the VeriForge-style study logic.
      </p>
    </section>
  );
}

function ReplacementPanel({
  replacement,
  relations,
  reviewState,
  onReview,
}: {
  replacement: ReplacementAnalysis;
  relations: Record<string, MappingRelation>;
  reviewState: Record<string, ReplacementReviewStatus>;
  onReview: (comparisonId: string, status: ReplacementReviewStatus) => void;
}) {
  const grouped = useMemo(
    () => ({
      preserved: replacement.comparisons.filter((item) => item.status === "preserved"),
      broken: replacement.comparisons.filter((item) => item.status === "broken"),
      emergent: replacement.comparisons.filter((item) => item.status === "emergent"),
    }),
    [replacement]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(["preserved", "broken", "emergent"] as const).map((status) => {
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
                    {item.diagnosticQuestion ? (
                      <div className="mt-2 border border-white/80 bg-white/80 p-2 text-[11px] leading-4 text-slate-700">
                        <span className="font-semibold">诊断问题：</span>
                        {item.diagnosticQuestion}
                      </div>
                    ) : null}
                    {item.relationIds.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {item.relationIds.map((relationId, index) => (
                          <div key={`${relationId}_${index}`} className="text-[11px] leading-4 text-slate-600">
                            {relations[relationId]?.carrierRelation || relationId}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">判断这条预测</div>
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

function MappingGraph({
  mapping,
  activeRelationId,
  onRelationSelect,
}: {
  mapping: LiteraryMapping;
  activeRelationId: string;
  onRelationSelect: (relationId: string) => void;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="border border-teal-200 bg-teal-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-800">Concrete carrier</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">{mapping.concreteCarrier.name}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapping.concreteCarrier.attributes.map((attribute, index) => (
              <span key={`${attribute}_${index}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-teal-900">
                {attribute}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            <GitCompareArrows className="h-5 w-5" />
          </div>
        </div>
        <div className="border border-indigo-200 bg-indigo-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Broader meanings</div>
          <div className="mt-3 space-y-2">
            {mapping.broaderMeaningHypotheses.map((meaning, index) => (
              <div key={`${meaning}_${index}`} className="text-sm leading-5 text-slate-900">
                {meaning}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 border border-slate-200">
        {mapping.mappingRelations.map((relation) => {
          const evidence = relation.evidenceIds
            .map((id) => mapping.evidence.find((item) => item.id === id))
            .filter((item): item is LiteraryEvidence => Boolean(item));
          return (
            <RelationRow
              key={relation.id}
              relation={relation}
              evidence={evidence}
              isActive={activeRelationId === relation.id}
              onSelect={() => onRelationSelect(relation.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [works, setWorks] = useState<LiteraryWork[]>(builtInLiteraryWorks);
  const [workId, setWorkId] = useState(builtInLiteraryWorks[0].id);
  const activeWork = works.find((work) => work.id === workId) ?? works[0];
  const [passageId, setPassageId] = useState(activeWork.passages[0].id);
  const activePassage = activeWork.passages.find((passage) => passage.id === passageId) ?? activeWork.passages[0];
  const [passageDraft, setPassageDraft] = useState(activePassage.text);
  const [passageSearch, setPassageSearch] = useState("");
  const [selectedSpan, setSelectedSpan] = useState("");
  const [mappings, setMappings] = useState<LiteraryMapping[]>(literaryMappingDemo);
  const [mappingId, setMappingId] = useState(literaryMappingDemo[0].id);
  const activeMapping = mappings.find((item) => item.id === mappingId) ?? mappings[0];
  const [replacementIdByMapping, setReplacementIdByMapping] = useState<Record<string, string>>({
    [activeMapping.id]: activeMapping.replacements[0].id,
  });
  const [activeRelationId, setActiveRelationId] = useState(activeMapping.mappingRelations[0].id);
  const [reflection, setReflection] = useState(
    "The replacement shows which parts of the original carrier are structurally necessary for the interpretation."
  );
  const [customReplacement, setCustomReplacement] = useState("");
  const [status, setStatus] = useState("Ready. Built-in passages can be analyzed, or you can import a .txt classic.");
  const [candidateScan, setCandidateScan] = useState<CandidateScanResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
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
  const showReworking = studyCondition === "interactive_reworking" && workflowMappingGenerated;
  const activePassageIndex = activeWork.passages.findIndex((passage) => passage.id === activePassage.id);
  const passagePosition = activePassageIndex >= 0 ? activePassageIndex + 1 : 1;
  const passageCount = activeWork.passages.length;
  const activeExcerptWordCount = passageDraft.trim() ? passageDraft.trim().split(/\s+/).length : 0;
  const activeCandidates = candidateScan?.candidates ?? (workflowMappingGenerated ? activeMapping.candidateCarriers ?? [] : []);
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
  const interpretationDecisionLabels: Record<InterpretationDecision, string> = {
    pending: "等待",
    kept: "保留映射",
    revise: "回到修订",
    recorded: "已记录",
  };
  const passageMappings = mappings.filter(
    (mapping) => mapping.workTitle === activeWork.title && mapping.passageLabel === activePassage.label
  );
  const explanationSummary = `${activeMapping.selectedSpan} suggests ${activeMapping.broaderMeaningHypotheses
    .slice(0, 2)
    .join(" and ")}.`;

  const logEvent = (type: string, detail: string) => {
    setStudyLog((previous) => [createLogEvent(type, detail), ...previous].slice(0, 100));
  };

  const handleSelectWork = (nextWorkId: string) => {
    const nextWork = works.find((work) => work.id === nextWorkId);
    if (!nextWork) return;
    setWorkId(nextWork.id);
    setPassageId(nextWork.passages[0].id);
    setPassageDraft(nextWork.passages[0].text);
    setSelectedTheoryLenses(defaultTheoryLensesForWork(nextWork));
    setCandidateScan(null);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    setSelectedSpan("");
    logEvent("work_selected", nextWork.title);
  };

  const handleLoadFullText = async () => {
    if (!activeWork.fullTextUrl) return;
    setStatus(`Loading full text for ${activeWork.title}...`);
    const response = await fetch(activeWork.fullTextUrl);
    if (!response.ok) {
      setStatus(`Failed to load full text: ${response.status}`);
      return;
    }
    const fullText = await response.text();
    const passages = splitFullTextIntoPassages(fullText, activeWork.title);
    const nextWork: LiteraryWork = {
      ...activeWork,
      isFullTextLoaded: true,
      passages,
      sourceNote: `${activeWork.sourceNote} Loaded ${passages.length} chapter/section passages.`,
    };
    setWorks((previous) => previous.map((work) => (work.id === activeWork.id ? nextWork : work)));
    setPassageId(passages[0].id);
    setPassageDraft(passages[0].text);
    setCandidateScan(null);
    setCandidateReview({});
    setCandidateRevisions({});
    setEvidenceReview({});
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setSelectedCandidateId("");
    setSelectedCandidateIds([]);
    setPassageSearch("");
    setStatus(`Loaded full text: ${activeWork.title}, ${passages.length} chapter/section passages.`);
    logEvent("full_text_loaded", `${activeWork.title}: ${passages.length} passages`);
  };

  const handleSelectPassage = (nextPassageId: string) => {
    const nextPassage = activeWork.passages.find((passage) => passage.id === nextPassageId);
    if (!nextPassage) return;
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
    setSelectedSpan("");
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
    setSelectedSpan("");
    setStatus(`Analysis excerpt reset from ${activePassage.label}.`);
    logEvent("excerpt_reset_from_reader", activePassage.label);
  };

  const handleSelectCandidate = (candidate: CandidateCarrier) => {
    const nextSpan = candidateRevisions[candidate.id]?.trim() || candidate.span;
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
    }
    setReplacementReview({});
    setWorkflowMappingGenerated(false);
    setInterpretationDecision("pending");
    setStatus(`已选择候选：${candidate.label}。可以先确认或修订，再生成细致映射。`);
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
    setStatus(`候选「${candidate.label}」已标记为：${candidateReviewLabels[review]}。`);
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

  const handleScanCandidates = async () => {
    if (!passageDraft.trim()) return;
    setIsScanning(true);
    setStatus("Scanning candidates with theory-guided preprocessing...");
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
      setCandidateReview({});
      setCandidateRevisions({});
      setEvidenceReview({});
      setReplacementReview({});
      setSelectedCandidateId("");
      setSelectedCandidateIds([]);
      setSelectedSpan("");
      setWorkflowMappingGenerated(false);
      setInterpretationDecision("pending");
      setStatus(`扫描完成：来自 ${result.source} 的 ${result.scan.candidates.length} 个候选。请先在“读者确认”中选中、接受或修订一个候选。`);
      logEvent("candidate_scan_generated", `${result.source}: ${result.scan.candidates.length} candidates`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scan error.";
      setStatus(`Scan failed: ${message}`);
      logEvent("candidate_scan_failed", message);
    } finally {
      setIsScanning(false);
    }
  };

  const activateMapping = (mapping: LiteraryMapping) => {
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
      setStatus("请先在“读者确认”中选中、接受或修订一个候选，再生成映射。");
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
    setIsAnalyzing(true);
    setStatus("Analyzing with the local model. Qwen 235B may take 30-90 seconds for one passage...");
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
          ? `Multi-mapping scan added ${generatedMappings.length} mappings from ${result.source}.`
          : `Analysis added from ${result.source}: ${normalizedMapping.selectedSpan}.`
      );
      logEvent(
        workspaceMode === "multi" ? "multi_mapping_generated" : "analysis_generated",
        `${result.source}: ${generatedMappings.map((mapping) => mapping.selectedSpan).join(", ")}`
      );
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis error.";
      setStatus(`Analysis failed: ${message}`);
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
      setStatus(`新的替换比较已生成：${result.replacement.replacementCarrier}（${result.source}）。请继续确认影响。`);
      logEvent("replacement_compared", `${result.source}: ${result.replacement.replacementCarrier}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown replacement comparison error.";
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
      setStatus("综合判断：保留当前映射。可以继续记录解释，或回到候选进行另一轮修订。");
    } else if (decision === "revise") {
      setStatus("综合判断：回到候选修订。请在读者确认区重新选择、修订或拒绝候选。");
      setWorkflowMappingGenerated(false);
    } else if (decision === "recorded") {
      setStatus("综合判断已记录到学习日志。");
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
      setWorks((previous) => [imported, ...previous]);
      setWorkId(imported.id);
      setPassageId(imported.passages[0].id);
      setPassageDraft(imported.passages[0].text);
      setSelectedSpan("");
      setStatus(`Imported ${imported.passages.length} passage(s) from ${file.name}.`);
      logEvent("file_imported", file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!passageDraft.trim()) return;
    const imported = makeImportedWork(passageDraft, "Pasted classic passage");
    setWorks((previous) => [imported, ...previous]);
    setWorkId(imported.id);
    setPassageId(imported.passages[0].id);
    setStatus("Current text saved as an imported work.");
    logEvent("paste_imported", imported.title);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <BookOpen className="h-4 w-4" />
              Mapping Meaning / CHI27 demo
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
              Dynamic literary meaning construction through metaphor reworking
            </h1>
          </div>
          <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
            Plotscape-inspired substrate: structured document objects, relation nodes, evidence links, and traceable
            comparison states. CHI27-specific layer: literary mapping and reworking.
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1560px] gap-5 px-5 py-5 xl:grid-cols-[340px_1fr_380px]">
        <aside className="space-y-4">
          <StudyModeSwitch condition={studyCondition} onChange={handleStudyConditionChange} />

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
              Import .txt classic
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
                <div className="mt-1 text-slate-500">chapters/sections</div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-2">
                <div className="font-semibold text-slate-950">{activeWork.isFullTextLoaded ? "Yes" : "No"}</div>
                <div className="mt-1 text-slate-500">full text</div>
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
                placeholder="Find chapter, scene, phrase..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>目录</span>
              <span>{filteredPassages.length}</span>
            </div>
            <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredPassages.slice(0, 80).map((passage: LiteraryPassage) => (
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
                </button>
              ))}
              {filteredPassages.length > 80 ? (
                <div className="border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-500">
                  Showing first 80 matches. Refine search to narrow the whole book.
                </div>
              ) : null}
            </div>
          </section>

          {showMappingScaffold ? (
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FilePlus className="h-4 w-4" />
              Current mappings
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

          {showMappingScaffold ? (
          <section className="border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Sparkles className="h-4 w-4" />
              Proactive mapping alerts
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              VeriForge-inspired: the system surfaces inspectable candidates, but the reader decides what matters.
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
                  {activeWork.title} / section {passagePosition} of {passageCount}
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
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleMovePassage(1)}
                  disabled={passagePosition >= passageCount}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40"
                >
                  Next
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
              <div className="whitespace-pre-wrap">{activePassage.text}</div>
            </article>
          </section>

          <section className="border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  分析摘录
                </div>
                <h2 className="mt-1 text-lg font-semibold">意义构建工作区</h2>
                <div className="mt-1 text-xs text-slate-500">
                  当前阅读位置已选取 {activeExcerptWordCount} 个词。
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  本地 LM Studio 大模型分析通常需要约一分钟。
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
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
                      {mode === "focused" ? "聚焦" : "多映射"}
                    </button>
                  ))}
                </div>
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
                <button
                  type="button"
                  onClick={handleUseVisibleSection}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  <BookOpen className="h-4 w-4" />
                  使用可见部分
                </button>
                <button
                  type="button"
                  onClick={handleScanCandidates}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 border border-indigo-700 bg-indigo-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isScanning ? "扫描中..." : "扫描候选"}
                </button>
                <button
                  type="button"
                  onClick={handlePasteImport}
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  <Plus className="h-4 w-4" />
                  保存摘录
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canGenerateMapping}
                  className="inline-flex items-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalyzing
                    ? "生成中..."
                    : needsCandidateChoice
                      ? "先确认候选"
                      : workspaceMode === "multi"
                        ? `生成多映射(${selectedCandidateIds.length})`
                        : selectedCandidate
                          ? "生成映射"
                          : "生成焦点映射"}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {[
                [
                  "线索扫描",
                  candidateScan
                    ? selectedCandidateIds.length
                      ? `已选 ${selectedCandidateIds.length}，已标记 ${candidateMarkedCount}`
                      : `待选择，已标记 ${candidateMarkedCount}`
                    : "等待扫描",
                  "模型先筛出潜在意象/隐喻线索，读者选择、接受或修订分析对象。",
                ],
                [
                  "意义图谱",
                  workflowMappingGenerated
                    ? evidenceDecisionCount
                      ? `读者校验 ${evidenceDecisionCount}/${activeEvidenceCount}`
                      : `待校验证据 0/${activeEvidenceCount}`
                    : selectedCandidateIds.length
                      ? "可生成映射"
                      : "等待候选",
                  "把候选展开成 Plotscape 式的载体、关系、证据结构，并由读者校验。",
                ],
                [
                  "替换探针",
                  interpretationDecision !== "pending"
                    ? interpretationDecisionLabels[interpretationDecision]
                    : replacementDecisionCount
                      ? `已判断 ${replacementDecisionCount}/${replacementComparisonCount}`
                      : workflowMappingGenerated
                        ? "可替换测试"
                        : "等待映射",
                  "用替换方向测试意义图谱，读者确认影响后收束或回到修订。",
                ],
              ].map(([label, state, description]) => (
                <div key={label} className="border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-0.5 text-sm font-semibold text-slate-950">{label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{state}</div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">{description}</div>
                </div>
              ))}
            </div>
            <textarea
              value={passageDraft}
              onChange={(event) => setPassageDraft(event.target.value)}
              className="mt-3 min-h-40 w-full resize-y border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900"
            />
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
                        ? `已选 ${selectedCandidateIds.length} 个候选`
                        : selectedCandidateSummary || selectedSpan
                      : "还没有选中候选"}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-600">
                  {workflowMappingGenerated
                    ? activeMapping.concreteCarrier.relations[0]
                    : selectedCandidateSummary || "先扫描候选，再由读者选择或修订分析对象。"}
                </div>
              </div>
              <div className="border border-indigo-200 bg-indigo-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">
                  {workflowMappingGenerated ? "暗示含义" : workspaceMode === "multi" ? "多映射选择" : "读者确认"}
                </div>
                <div className="mt-1 text-sm leading-5 text-slate-900">
                  {workflowMappingGenerated
                    ? activeMapping.broaderMeaningHypotheses[0]
                    : selectedCandidateIds.length
                      ? workspaceMode === "multi"
                        ? `将生成 ${selectedCandidateIds.length} 个候选映射：${selectedCandidateSummary}`
                        : `当前候选：${selectedCandidateSummary || (selectedCandidate ? candidateRevisions[selectedCandidate.id]?.trim() || selectedCandidate.span : selectedSpan)}`
                      : "还没有选中候选。"}
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
                        ? `点击“生成多映射(${selectedCandidateIds.length})”。`
                        : "点击“生成映射”。"
                      : "确认候选后，再生成映射。"}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-600">
                  重新分析后，系统会基于当前摘录更新这些建议。
                </div>
              </div>
            </div>
            <div className="mt-3 border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    当前摘录中的候选意象 / 隐喻
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">
                    先按语言、文学传统和理论镜头扫描，再进入细致映射。
                  </div>
                </div>
                <span className="border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                  {activeCandidates.length}
                </span>
              </div>
              {candidateScan ? (
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
                        {workspaceMode === "multi"
                          ? "多映射模式下，可以加入多个候选；接受或修订会把候选加入待生成映射集合。"
                          : "聚焦模式下，选择一个候选作为主分析对象；接受或修订会更新当前候选。"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-medium">
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{selectedCandidateIds.length}</div>
                        <div>{workspaceMode === "multi" ? "已加入" : "已选中"}</div>
                      </div>
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{candidateMarkedCount}</div>
                        <div>已标记</div>
                      </div>
                      <div className="border border-teal-200 bg-white px-2 py-1 text-teal-900">
                        <div className="font-semibold">{activeCandidates.length}</div>
                        <div>候选总数</div>
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
                          {candidate.detectionMethod}
                        </span>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {candidateReviewLabels[review]}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">{candidate.whyCandidate}</div>
                    {candidate.semanticTension ? (
                      <div className="mt-2 border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-800">语义张力：</span> {candidate.semanticTension}
                      </div>
                    ) : null}
                    <div className="mt-2 grid gap-2 text-[11px] text-slate-500 md:grid-cols-2">
                      {candidate.basicMeaning ? <div>基础义：{candidate.basicMeaning}</div> : null}
                      {candidate.contextualMeaning ? <div>语境义：{candidate.contextualMeaning}</div> : null}
                      {candidate.culturalResonance ? (
                        <div className="md:col-span-2">文化共鸣：{candidate.culturalResonance}</div>
                      ) : null}
                    </div>
                    {candidate.evidenceExcerpt ? (
                      <div className="mt-2 border-l-2 border-slate-200 pl-2 text-xs leading-5 text-slate-500">
                        {candidate.evidenceExcerpt}
                      </div>
                    ) : null}
                    {candidate.theoryTrace &&
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
                    <div className="mt-2 flex gap-2 text-[11px] font-medium uppercase text-slate-500">
                      <span>优先级：{candidate.priority}</span>
                      <span>显著性：{candidate.readerSalience}</span>
                      <span>置信：{candidate.confidence}</span>
                      <span>可替换性：{candidate.replaceability}</span>
                    </div>
                    {candidate.scores ? (
                      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px] text-slate-500">
                        <div className="border border-slate-200 bg-white p-1">MIP {candidate.scores.mipTension}</div>
                        <div className="border border-slate-200 bg-white p-1">Poet {candidate.scores.poeticImagery}</div>
                        <div className="border border-slate-200 bg-white p-1">Motif {candidate.scores.motifRecurrence}</div>
                        <div className="border border-slate-200 bg-white p-1">Narr {candidate.scores.narrativeImportance}</div>
                        <div className="border border-slate-200 bg-white p-1">Evd {candidate.scores.evidenceDensity}</div>
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-2">
                      <input
                        value={revisedSpan}
                        onChange={(event) => handleCandidateRevision(candidate.id, event.target.value)}
                        placeholder={`修订候选表达，默认：${candidate.span}`}
                        className="w-full border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                      />
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
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_260px]">
              <input
                value={selectedSpan}
                onChange={(event) => setSelectedSpan(event.target.value)}
                placeholder="可选载体 / 片段，例如：落花"
                className="border border-slate-300 px-3 py-2 text-sm"
              />
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

          {showMappingScaffold ? (
            <DualStreamPanel
              mapping={activeMapping}
              activeRelationId={activeRelationId}
              onSelectRelation={setActiveRelationId}
            />
          ) : null}

          {showMappingScaffold ? (
          <div ref={resultsRef}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">意义映射结构</h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                不确定性：{activeMapping.uncertainty}
              </span>
            </div>
            {workspaceMode === "multi" ? (
              <div className="mb-3 border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      多映射工作区
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">
                      在当前摘录的多个候选映射之间切换。
                    </div>
                  </div>
                  <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                    {passageMappings.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {passageMappings.slice(0, 8).map((mapping) => (
                    <button
                      key={mapping.id}
                      type="button"
                      onClick={() => activateMapping(mapping)}
                      className={cx(
                        "border p-3 text-left transition hover:border-slate-400",
                        mapping.id === activeMapping.id ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="text-sm font-semibold text-slate-950">{mapping.selectedSpan}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">
                        {mapping.broaderMeaningHypotheses[0] || mapping.concreteCarrier.relations[0]}
                      </div>
                      <div className="mt-2 flex gap-2 text-[11px] text-slate-500">
                        <span>{mapping.mappingRelations.length} relations</span>
                        <span>{mapping.evidence.length} evidence</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <MappingGraph
              mapping={activeMapping}
              activeRelationId={activeRelationId}
              onRelationSelect={setActiveRelationId}
            />
          </div>
          ) : null}

          {showMappingScaffold ? (
            <section className="border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Link2 className="h-4 w-4" />
                    证据校验
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    从文本证据回看当前意义图谱。系统给出证据卡，读者只校验当前关系下的证据是否成立。
                  </div>
                </div>
                <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                  <div className="font-semibold text-slate-950">{evidenceDecisionCount}/{activeEvidenceCount}</div>
                  <div>{evidenceDecisionCount === activeEvidenceCount && activeEvidenceCount > 0 ? "当前关系已校验" : "当前关系校验"}</div>
                </div>
              </div>
              <div className="mt-3 border border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-800">
                {activeRelation?.carrierRelation} {"->"} {activeRelation?.meaningRelation}
              </div>
              <div className="mt-3">
                <EvidencePanel
                  evidence={activeEvidence}
                  reviewState={evidenceReview}
                  onReview={handleEvidenceReview}
                />
              </div>
            </section>
          ) : null}

          {showReworking ? (
          <section>
            <div className="mb-3 border border-teal-200 bg-teal-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-teal-950">替换测试与影响确认</div>
                  <div className="mt-1 text-xs leading-5 text-teal-800">
                    用多个反事实替换方向压力测试当前意义图谱。系统建议提供快速比较，
                    读者也可以输入新的替换意象；每个方向都需要再次确认影响。
                  </div>
                </div>
                <div className="grid gap-1 text-center text-[11px] font-medium">
                  <div className="border border-teal-200 bg-white px-2 py-1 text-teal-950">
                    <div className="font-semibold">{replacementDecisionCount}/{replacementComparisonCount}</div>
                    <div>读者确认</div>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-teal-800">系统预测分布</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["preserved", "broken", "emergent"] as const).map((status) => (
                      <div key={status} className={cx("border px-2 py-1", statusStyles[status].className)}>
                        <div className="font-semibold">
                          {activeReplacement.comparisons.filter((item) => item.status === status).length}
                        </div>
                        <div>系统{statusStyles[status].label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold">替换与比较</h2>
              <div className="flex flex-wrap gap-2">
                {activeMapping.replacements.map((replacement) => (
                  <button
                    key={replacement.id}
                    type="button"
                    onClick={() => {
                      handleActivateReplacement(replacement.id);
                    }}
                    className={cx(
                      "inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition",
                      replacement.id === activeReplacement.id
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    )}
                  >
                    <RefreshCw className="h-4 w-4" />
                    查看比较：{replacement.replacementCarrier}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={customReplacement}
                onChange={(event) => setCustomReplacement(event.target.value)}
                placeholder="输入新的替换意象，例如：镜子、落花、冰雪"
                className="border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCustomReplacement}
                disabled={isComparing}
                className="inline-flex items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
                生成自定义比较
              </button>
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-500">
              使用系统建议时，点击上方“查看比较”即可；只有输入新的替换意象时，才需要点击“生成自定义比较”。
            </div>
            <div className="mt-3 border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">替换目的</div>
              <p className="mt-1 text-sm leading-6 text-slate-700">{activeReplacement.purpose}</p>
            </div>
            <div className="mt-3 border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-950">替换后的关系判断</div>
                  <div className="mt-1 text-xs leading-5 text-amber-900">
                    系统先预测替换后哪些意义关系会保留、破碎或涌现；
                    读者逐条判断这些预测是否成立。这里记录的是读者判断，不是最终答案。
                  </div>
                </div>
                <div className="border border-amber-300 bg-white px-3 py-2 text-center text-xs text-amber-950">
                  <div className="text-base font-semibold">{replacementDecisionCount}/{replacementComparisonCount}</div>
                  <div>已判断的预测</div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <ReplacementPanel
                replacement={activeReplacement}
                relations={relationById}
                reviewState={replacementReview}
                onReview={handleReplacementReview}
              />
            </div>
            <div className="mt-3 border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <PencilLine className="h-4 w-4" />
                    综合判断
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    把证据校验和替换测试汇总成一个解释决策：保留当前映射、回到候选修订，或记录一版解释。
                  </div>
                </div>
                <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                  <div className="font-semibold text-slate-950">{interpretationDecisionLabels[interpretationDecision]}</div>
                  <div>状态</div>
                </div>
              </div>
              <textarea
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                className="mt-3 min-h-32 w-full resize-none border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900"
              />
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleInterpretationDecision("kept")}
                  disabled={!workflowMappingGenerated}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium disabled:opacity-50",
                    interpretationDecision === "kept"
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  保留当前映射
                </button>
                <button
                  type="button"
                  onClick={() => handleInterpretationDecision("revise")}
                  disabled={!candidateScan}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium disabled:opacity-50",
                    interpretationDecision === "revise"
                      ? "border-amber-700 bg-amber-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  回到候选修订
                </button>
                <button
                  type="button"
                  onClick={() => handleInterpretationDecision("recorded")}
                  disabled={!workflowMappingGenerated}
                  className={cx(
                    "border px-3 py-2 text-xs font-medium disabled:opacity-50",
                    interpretationDecision === "recorded"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  记录解释
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="border border-slate-200 bg-slate-50 p-2">
                  <div className="font-semibold text-slate-950">{activeMapping.mappingRelations.length}</div>
                  <div className="mt-1 text-slate-500">关系</div>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2">
                  <div className="font-semibold text-slate-950">{activeMapping.evidence.length}</div>
                  <div className="mt-1 text-slate-500">证据</div>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2">
                  <div className="font-semibold text-slate-950">{activeReplacement.comparisons.length}</div>
                  <div className="mt-1 text-slate-500">影响</div>
                </div>
              </div>
            </div>
          </section>
          ) : null}

        </section>

        <aside className="space-y-4">
          {showMappingScaffold ? (
            <MeaningCanvas
              mapping={activeMapping}
              replacement={activeReplacement}
              activeRelationId={activeRelationId}
              onSelectRelation={setActiveRelationId}
            />
          ) : null}

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
        </aside>
      </div>
    </main>
  );
}

export default App;
