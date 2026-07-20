import type {
  AnalyzePassageRequest,
  CandidateCarrier,
  CandidateScanResult,
  CompareReplacementRequest,
  LiteraryMapping,
  ReplacementAnalysis,
  ScanCandidatesRequest,
} from "@/types/literaryMapping";

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function inferCarrier(passage: string, selectedSpan?: string): string {
  if (selectedSpan?.trim()) return selectedSpan.trim();
  const quoted = passage.match(/"([^"]{2,80})"/);
  if (quoted?.[1]) return quoted[1];
  const words = passage.split(/\s+/).filter(Boolean);
  return words.slice(Math.max(0, Math.floor(words.length / 2) - 2), Math.floor(words.length / 2) + 2).join(" ");
}

function localScanCandidates(request: ScanCandidatesRequest): CandidateScanResult {
  const text = request.passage.trim();
  const roughSegments = text.split(/(?<=[。！？.!?])\s*/).filter(Boolean).slice(0, 10);
  const quoted = Array.from(text.matchAll(/[“"']([^”"']{2,30})[”"']/g)).map((match) => match[1]);
  const chineseImages = Array.from(text.matchAll(/[石玉夢幻紅塵花月水鏡風雨][^\s，。；：、]{0,6}/g)).map((match) => match[0]);
  const words = text.split(/\s+/).filter((word) => word.length > 3).slice(0, 10);
  const theoryImageSeeds = "石玉梦幻红花月水泪风雨雪灯镜香影云雾春秋金木舟桥门窗衣冠血火灰尘";
  const theoryImages = Array.from(
    text.matchAll(new RegExp(`[${theoryImageSeeds}][^\\s，。；：、！？]{0,8}`, "g"))
  ).map((match) => match[0]);
  const repeatedTerms = Array.from(text.matchAll(/([\u4e00-\u9fff]{1,4})(?=[\s\S]{0,80}\1)/g))
    .map((match) => match[1])
    .filter((term) => !/[的是了也在人我他她你]/.test(term))
    .slice(0, 12);
  const englishImages = Array.from(
    text.matchAll(/\b(?:rose|flower|stone|mirror|dream|shadow|light|dark|water|sea|river|road|house|door|window|garden|dust|ash|fire|ice|snow|moon|star|blood|ghost|crown|mask)\b(?:\s+\w+){0,2}/gi)
  ).map((match) => match[0]);
  const spans = Array.from(new Set([...quoted, ...theoryImages, ...chineseImages, ...repeatedTerms, ...englishImages, ...words])).slice(0, 10);
  const candidates: CandidateCarrier[] = spans.length > 0 ? spans.map((span, index) => ({
    id: `local_candidate_${index + 1}`,
    span,
    label: span,
    whyCandidate: "Local scan found a salient image, named object, quoted phrase, or repeated textual marker.",
    evidenceExcerpt: text.slice(Math.max(0, text.indexOf(span) - 40), Math.max(120, text.indexOf(span) + span.length + 80)),
    priority: index < 3 ? "high" : "medium",
    detectionMethod: request.theoryLenses?.includes("chinese_poetics") ? "Chinese poetics" : "LLM semantic scan",
    basicMeaning: "A visible textual image or named object.",
    contextualMeaning: "Potential carrier for interpretive meaning in this passage.",
    semanticTension: "Needs reader/LLM verification against the passage context.",
    culturalResonance: "Fallback scan only; live LLM scan can add stronger cultural grounding.",
    readerSalience: index < 3 ? "high" : "medium",
    confidence: "low",
    replaceability: index < 4 ? "medium" : "low",
    theoryTrace: {
      mipVu: "Fallback scan marks this as requiring a basic/contextual meaning check.",
      chinesePoetics: request.language === "zh" ? "Potential image, motif, or scene-based resonance." : "",
      symbolMotif: "Check whether the image recurs or carries conventional associations.",
      narrativeStructure: "Check whether the image changes character, fate, or scene framing.",
    },
    scores: {
      mipTension: /梦|幻|影|镜|mask|ghost|dream|shadow/i.test(span) ? 0.72 : 0.45,
      poeticImagery: request.language === "zh" && new RegExp(`[${theoryImageSeeds}]`).test(span) ? 0.78 : 0.45,
      motifRecurrence: repeatedTerms.includes(span) ? 0.75 : 0.4,
      narrativeImportance: /葬|哭|笑|去|来|梦|死|生|fall|die|return|leave|bury/i.test(span) ? 0.68 : 0.45,
      evidenceDensity: text.includes(span) ? 0.65 : 0.35,
    },
  })) : [
    {
      id: "local_candidate_scene",
      span: "surrounding scene",
      label: "surrounding scene",
      whyCandidate: "The scene itself may carry symbolic or narrative meaning.",
      evidenceExcerpt: text.slice(0, 160),
      priority: "medium",
      detectionMethod: "Narrative structure",
      readerSalience: "medium",
      confidence: "low",
    },
  ];

  return {
    workTitle: request.workTitle,
    passageLabel: request.passageLabel,
    preprocess: {
      segments: roughSegments,
      entities: quoted.slice(0, 8),
      images: chineseImages.slice(0, 12),
      actions: [],
      repeatedTerms,
      allusions: [],
      narrativeFrames: request.language === "zh" ? ["Chinese classic frame"] : ["literary passage frame"],
    },
    candidates,
  };
}

function localAnalyzePassage(request: AnalyzePassageRequest): LiteraryMapping {
  const carrier = inferCarrier(request.passage, request.selectedSpan);
  const mappingId = makeId("mapping");
  return {
    id: mappingId,
    title: `${carrier} as a meaning carrier`,
    workTitle: request.workTitle,
    passageLabel: request.passageLabel,
    passage: request.passage,
    selectedSpan: carrier,
    expressionTypes: ["metaphorically_structured_image"],
    literalScene: {
      entities: [carrier, "reader", "surrounding scene"],
      actions: ["notice", "compare", "interpret"],
    },
    concreteCarrier: {
      name: carrier,
      attributes: ["concrete", "situated", "interpretable"],
      relations: [
        `${carrier} appears within a specific local scene.`,
        `${carrier} can be compared with alternative carriers.`,
        `${carrier} gains meaning through textual and cultural context.`,
      ],
    },
    broaderMeaningHypotheses: [
      "the concrete image organizes a broader thematic claim",
      "the passage invites more than one grounded interpretation",
      "meaning depends on relation rather than isolated symbol lookup",
    ],
    mappingRelations: [
      {
        id: `${mappingId}_r1`,
        carrierRelation: `${carrier} is concrete and visible in the passage`,
        meaningRelation: "abstract meaning becomes inspectable through a specific textual object",
        importance: "high",
        evidenceIds: [`${mappingId}_e1`],
        relationType: "attribute",
      },
      {
        id: `${mappingId}_r2`,
        carrierRelation: `${carrier} is embedded in an action or scene`,
        meaningRelation: "interpretation depends on relations among image, action, and context",
        importance: "medium",
        evidenceIds: [`${mappingId}_e1`, `${mappingId}_e2`],
        relationType: "narrative",
      },
    ],
    evidence: [
      {
        id: `${mappingId}_e1`,
        kind: "textual",
        label: "Selected passage",
        excerpt: request.passage,
        note: "Local fallback analysis uses the selected passage as its evidence base.",
        sourceRole: "passage",
        groundedness: "direct_quote",
      },
      {
        id: `${mappingId}_e2`,
        kind: "critical",
        label: "Interpretive caution",
        excerpt: "Treat this as a scaffold until LLM or expert evidence is available.",
        note: "The demo separates generated hypotheses from reader judgment.",
        sourceRole: "critical_context",
        groundedness: "inference",
      },
    ],
    candidateCarriers: [
      {
        id: `${mappingId}_candidate_1`,
        span: carrier,
        label: carrier,
        whyCandidate: "The selected or inferred phrase can organize a concrete-to-abstract reading.",
        evidenceExcerpt: request.passage.slice(0, 180),
        priority: "high",
        detectionMethod: request.theoryLenses?.includes("chinese_poetics") ? "Chinese poetics" : "LLM semantic scan",
        basicMeaning: "A concrete image or phrase in the passage.",
        contextualMeaning: "A possible carrier for broader literary meaning.",
        semanticTension: "The phrase can be read beyond its literal scene.",
        culturalResonance: "Fallback scaffold; live LLM analysis can add tradition-specific grounding.",
        readerSalience: "medium",
        confidence: "medium",
        replaceability: "medium",
        theoryTrace: {
          mipVu: "Compare literal phrase with contextual interpretation.",
          chinesePoetics: request.language === "zh" ? "Check image, 寄托, and scene resonance." : "",
          symbolMotif: "Check motif or symbolic associations.",
          narrativeStructure: "Check how the image participates in the scene.",
        },
      },
      {
        id: `${mappingId}_candidate_2`,
        span: "surrounding scene",
        label: "surrounding scene",
        whyCandidate: "The local action and setting may contain additional interpretive images.",
        evidenceExcerpt: request.passage.slice(0, 180),
        priority: "medium",
        detectionMethod: "Narrative structure",
        basicMeaning: "The visible action and setting.",
        contextualMeaning: "The scene may organize character, fate, or thematic meaning.",
        semanticTension: "Narrative action may carry symbolic force.",
        culturalResonance: "Fallback scaffold; verify with textual and cultural evidence.",
        readerSalience: "medium",
        confidence: "low",
        replaceability: "medium",
        theoryTrace: {
          mipVu: "Scene-level candidates may not be strict lexical metaphors.",
          chinesePoetics: request.language === "zh" ? "Scene may work through 意境 or narrative image." : "",
          symbolMotif: "Check recurrence or conventional resonance.",
          narrativeStructure: "Scene-level action may organize fate, relation, or conflict.",
        },
      },
    ],
    alternativeInterpretations: ["thematic image", "character situation", "cultural motif"],
    replacements: [
      localCompareReplacementSkeleton(mappingId, carrier, "a fading lamp"),
      localCompareReplacementSkeleton(mappingId, carrier, "falling leaves"),
    ],
    uncertainty: "high",
    analysisProvenance: {
      systemRole: "fallback",
      theoryLenses: request.theoryLenses ?? [],
      source: "local_scaffold",
      generatedAt: new Date().toISOString(),
    },
    studyHooks: {
      designGoal: [
        "Make metaphorical meaning construction inspectable.",
        "Keep the reader responsible for accepting, revising, or rejecting generated structure.",
      ],
      expectedUserAction: [
        "Select or revise a candidate carrier.",
        "Validate relation evidence.",
        "Compare replacement consequences.",
      ],
      measurableOutcome: [
        "Mapping specificity",
        "Evidence grounding",
        "Awareness of meaning loss and emergent meaning",
      ],
    },
  };
}

function localCompareReplacementSkeleton(
  mappingId: string,
  originalCarrier: string,
  replacementCarrier: string
): ReplacementAnalysis {
  return {
    id: makeId("replacement"),
    label: `替换为${replacementCarrier}`,
    replacementCarrier,
    replacementStrategy: "reader_authored",
    purpose: `测试当“${originalCarrier}”被替换为“${replacementCarrier}”时，原来的意义关系会如何变化。`,
    comparisons: [
      {
        id: `${mappingId}_${replacementCarrier}_preserved`,
        status: "preserved",
        title: "具体载体仍然保留",
        explanation: "替换后文本里仍有一个可被观察、比较和解释的具体对象。",
        relationIds: [`${mappingId}_r1`],
        diagnosticQuestion: "替换后，哪一条由具体意象通向抽象意义的关系仍然成立？",
      },
      {
        id: `${mappingId}_${replacementCarrier}_broken`,
        status: "broken",
        title: "原有联想被削弱",
        explanation: "原载体承载的一部分文本、文化或叙事关联在替换后不再稳定。",
        relationIds: [`${mappingId}_r2`],
        diagnosticQuestion: "替换后，哪些原本依附于该意象的关联变弱或失效？",
      },
      {
        id: `${mappingId}_${replacementCarrier}_emergent`,
        status: "emergent",
        title: "新的意义方向出现",
        explanation: "新载体可能引入不同的感官、情感或文化方向。",
        relationIds: [],
        diagnosticQuestion: "替换后，出现了哪些原文本中不明显的新意义方向？",
      },
    ],
  };
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function analyzePassage(request: AnalyzePassageRequest): Promise<{ mapping: LiteraryMapping; source: string }> {
  try {
    const result = await postJson<{ mapping: LiteraryMapping }>("/api/meaning/analyze", request);
    return { mapping: result.mapping, source: "llm" };
  } catch {
    return { mapping: localAnalyzePassage(request), source: "local scaffold" };
  }
}

export async function scanCandidates(
  request: ScanCandidatesRequest
): Promise<{ scan: CandidateScanResult; source: string }> {
  try {
    const result = await postJson<{ scan: CandidateScanResult }>("/api/meaning/scan", request);
    return { scan: result.scan, source: "llm" };
  } catch {
    return { scan: localScanCandidates(request), source: "local scaffold" };
  }
}

export async function compareReplacement(
  request: CompareReplacementRequest
): Promise<{ replacement: ReplacementAnalysis; source: string }> {
  try {
    const result = await postJson<{ replacement: ReplacementAnalysis }>("/api/meaning/compare", request);
    return { replacement: result.replacement, source: "llm" };
  } catch {
    return {
      replacement: localCompareReplacementSkeleton(
        request.mapping.id,
        request.mapping.concreteCarrier.name,
        request.replacementCarrier
      ),
      source: "local scaffold",
    };
  }
}
