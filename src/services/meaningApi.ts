import type {
  AnalyzePassageRequest,
  CandidateCarrier,
  CandidateScanResult,
  CarrierType,
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
  const quoted = passage.match(/[“"']([^”"']{2,30})[”"']/);
  if (quoted?.[1]) return quoted[1];
  const chineseImages = passage.match(/[明月月光稻花蛙声清风落花流水霜雪灯镜玉石花鸟云雨]{2,6}/);
  if (chineseImages?.[0]) return chineseImages[0];
  const words = passage.split(/\s+/).filter(Boolean);
  return words.slice(0, 4).join(" ") || "当前意象";
}

function extractEvidence(text: string, span: string) {
  const index = text.indexOf(span);
  if (index < 0) return text.slice(0, 180);
  return text.slice(Math.max(0, index - 40), Math.min(text.length, index + span.length + 80));
}

function inferCarrierTypes(span: string): CarrierType[] {
  const inferred = new Set<CarrierType>();
  if (/馒头|药丸|护身符|荷叶|灯笼|银圈|钢叉|福礼|物件|食物|供品/.test(span)) inferred.add("object");
  if (/趁热|吃下|拿来|举头|低头|承认|胜利法|动作|行动/.test(span)) inferred.add("action");
  if (/包好|儿子|说|承诺|话语|命名/.test(span)) inferred.add("discourse");
  if (/祝福|茶馆|看客|仪式|宴会|场景/.test(span)) inferred.add("scene_ritual");
  if (/明月|月光|圆月|稻花香|蛙声|清风|鸣蝉|花|鸟|声|光|香/.test(span)) inferred.add("sensory_image");
  return Array.from(inferred).slice(0, 2);
}

const localCandidateProfiles: Record<
  string,
  {
    why: string;
    basic: string;
    contextual: string;
    tension: string;
    resonance?: string;
    method?: CandidateCarrier["detectionMethod"];
    priority?: CandidateCarrier["priority"];
    replaceability?: CandidateCarrier["replaceability"];
  }
> = {
  人血馒头: {
    why: "它把食物、血、治疗、处决和迷信压缩到一个可见物件里。",
    basic: "沾了人血的馒头。",
    contextual: "被误认为能治痨病的暴力消费物。",
    tension: "从日常食物转向血腥治疗和社会病症。",
    resonance: "民间偏方、看客心理、革命牺牲被误读。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "high",
  },
  红的馒头: {
    why: "颜色让馒头不再只是食物，而和血、病、药效想象发生关系。",
    basic: "带有红色痕迹的馒头。",
    contextual: "治疗希望和血腥来源被包进同一个物件。",
    tension: "从食物颜色转向血的药效想象。",
    resonance: "民间疗法、身体恐惧、家庭求生。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "high",
  },
  老荷叶: {
    why: "它承担包裹和遮蔽作用，把血腥物件重新包装成可进入家庭的东西。",
    basic: "用来包馒头的荷叶。",
    contextual: "遮住血腥来源，使迷信治疗进入日常家庭流程。",
    tension: "从普通包裹物转向遮蔽暴力来源的媒介。",
    resonance: "饮食包装、遮蔽、家庭照护。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  碧绿的包: {
    why: "它把红色血馒头包成一个可递送、可保存的治疗对象。",
    basic: "荷叶包成的绿色包裹。",
    contextual: "血腥和治疗希望被一层日常包装暂时遮住。",
    tension: "从洁净绿色外壳转向被包裹的红色血物。",
    resonance: "颜色对照、遮蔽、家庭治疗仪式。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  红红白白的破灯笼: {
    why: "破灯笼保留了血馒头来路的痕迹，连接购买、夜路和暴力现场。",
    basic: "装过馒头的破灯笼。",
    contextual: "它像一个残留物，提示治疗物背后的交易和血腥来源。",
    tension: "从照明器物转向暴力交易的残痕。",
    resonance: "夜行、秘密交易、颜色残留。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "low",
  },
  包好: {
    why: "这个反复出现的承诺把偏方说成确定疗效，形成迷信权威感。",
    basic: "保证治好的话语。",
    contextual: "众人把传闻和权力口吻当成治疗根据。",
    tension: "从口头保证转向社会性的迷信确信。",
    resonance: "承诺、权威话语、群体相信。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "medium",
  },
  趁热吃下: {
    why: "这个动作指令把血腥来源包装成急迫的治疗流程。",
    basic: "趁热把东西吃下。",
    contextual: "血的热度被想象成药效的一部分。",
    tension: "从饮食动作转向迷信治疗仪式。",
    resonance: "身体、热血、药效想象。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "medium",
  },
  精神上的胜利法: {
    why: "它把身体失败、屈辱、自我安慰和社会嘲弄连成一套可观察机制。",
    basic: "一种心理上的自我安慰方式。",
    contextual: "把外在失败改写成内在胜利的叙事机制。",
    tension: "从失败转向胜利，从屈辱转向得意。",
    resonance: "国民性讽刺、自我欺骗、社会嘲弄。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "high",
  },
  黄辫子: {
    why: "它是身体被控制和公开羞辱的抓手，连接具体暴力和身份符号。",
    basic: "阿Q头上的辫子。",
    contextual: "身体被他人抓住和支配的具体位置。",
    tension: "从身体部位转向身份和屈辱的控制点。",
    resonance: "身体控制、身份符号、公共羞辱。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  祝福: {
    why: "它是贯穿文本的仪式框架，连接好运、禁忌、性别秩序和被排除者。",
    basic: "年终祈福仪式。",
    contextual: "社会秩序和排除机制的公共表演。",
    tension: "从幸福祈愿转向排除与冷漠。",
    resonance: "祭祀、年终仪式、礼教秩序。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "high",
  },
  爆竹: {
    why: "它把祝福变成响亮的公共气氛，也可能遮盖个体苦难。",
    basic: "节日爆竹声。",
    contextual: "公共幸福表演的声音媒介。",
    tension: "从喜庆声音转向遮蔽苦难的背景噪声。",
    resonance: "年节声音、公共气氛、苦难遮蔽。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  福礼: {
    why: "它把祈福仪式变成可陈列、可清洗、可参与的物质秩序。",
    basic: "祭祀用的食物供品。",
    contextual: "礼教秩序和劳动分工被压缩到可见物件中。",
    tension: "从供品转向社会秩序的物质化。",
    resonance: "祭祀、供品、家庭劳动。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  金黄的圆月: {
    why: "它是记忆图像的视觉中心，组织出明亮、完整、神异的故乡。",
    basic: "天空中的圆月。",
    contextual: "童年故乡记忆的视觉中心。",
    tension: "从自然景物转向记忆中的完整故乡。",
    resonance: "月、乡愁、童年记忆。",
    method: "Narrative structure",
    priority: "high",
    replaceability: "high",
  },
  银圈: {
    why: "它把少年闰土具体化，也带出保护、愿心和童年生命力。",
    basic: "少年颈上的银项圈。",
    contextual: "记忆中闰土被珍爱、被保护的身体标记。",
    tension: "从饰物转向童年生命力和愿心。",
    resonance: "童年身体、愿心、保护。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
  钢叉: {
    why: "它让少年闰土不是静态风景，而是能行动、能应对危险的人。",
    basic: "捕猹用的工具。",
    contextual: "行动力、经验世界和童年神异感的支点。",
    tension: "从工具转向行动力和经验差异。",
    resonance: "乡土经验、少年行动、童年神异感。",
    method: "Narrative structure",
    priority: "medium",
    replaceability: "medium",
  },
};

const weakChineseCandidatePattern =
  /^(?:一|二|三|四|五|六|七|八|九|十|栓|老栓|小栓|一排|桌|茶桌|溜|滑溜|坐|走|说|說|听|聽|看|拿|吃|这样|這樣|那里|那裡|这里|這裡)$/;
const functionalChinesePhrasePattern =
  /^(?:說|说|說著|说着|說道|说道|說罷|说罢|聽著|听着|看著|看着|走著|走着|拿著|拿着|叫著|叫着|嚷著|嚷着|哭著|哭着|笑著|笑着|走了|去了|來了|来了|看見|看见|聽見|听见|回去|出來|出来|進去|进去|起來|起来)$/;
const discourseFillerPattern =
  /^(?:自然|自然自然|自然，?自然|是的|不是|好好|好了|罢了|罷了|罢罢|罷罷|一定|当然|當然|大约|大約|也许|也許|不过|不過|所以|但是|然而|或者|而且|于是|於是|这样|這樣|那样|那樣|什么|甚么|怎么|怎麼|哪里|哪裡|这里|這裡|那里|那裡)$/;
const genericQuantityPattern =
  /^(?:很|许多|許多|好多|不少|几|幾|数|數|一|二|三|四|五|六|七|八|九|十|半)?(?:多)?(?:次|回|遍|番|会|會|下|些|点|點|个|個|种|種|样|樣|件|条|條|只|位|声|聲|句|年|月|日|天|时候|時候)$/;
const genericVerbPhrasePattern =
  /^[\u4e00-\u9fff]{0,3}(?:說|说|說著|说着|說道|说道|聽|听|聽著|听着|看|看著|看着|走|走著|走着|來|来|去|拿|拿著|拿着|坐|坐著|坐着|站|站著|站着|叫|叫著|叫着|嚷|嚷著|嚷着|問|问|問道|问道|答|答道|笑|笑著|笑着|哭|哭著|哭着)[\u4e00-\u9fff]{0,2}$/;
const badPhraseBoundaryPattern =
  /^(?:这是|這是|这样|這樣|那是|這個|这个|那個|那个|什么|甚么|只是|就是|便是|也是|都是|的人|的|了|著|着)|(?:的|了|著|着|都|也|便|都包|都包好|只是嚷|的人|的拿来|的拿來)$/;
const carrierSubstancePattern =
  /(?:月|光|聲|声|血|藥|药|門|门|窗|路|手|眼|臉|脸|辮|辫|墳|坟|燈|灯|香|花|鳥|鸟|酒|夢|梦|影|祝福|福禮|福礼|供品|儀式|仪式|規矩|规矩|看客|眾人|众人|閒人|闲人|少年|圓月|圆月|鋼叉|钢叉|銀圈|银圈|火|霜|雪|風|风|水|茶|飯|饭|病|骨|淚|泪|船|河|橋|桥|人|孩子|女人|男人|老人|先生|太太|客|房|屋|桌|椅|碗|刀|包|馒头|饅頭|礼|禮)/;

function simplifiedForHeuristic(value: string) {
  return value
    .replace(/饅/g, "馒")
    .replace(/藥/g, "药")
    .replace(/說/g, "说")
    .replace(/聽/g, "听")
    .replace(/聲/g, "声")
    .replace(/燈/g, "灯")
    .replace(/門/g, "门")
    .replace(/墳/g, "坟")
    .replace(/辮/g, "辫")
    .replace(/圓/g, "圆")
    .replace(/鋼/g, "钢")
    .replace(/銀/g, "银")
    .replace(/眾/g, "众")
    .replace(/閒/g, "闲")
    .replace(/儀/g, "仪")
    .replace(/規/g, "规")
    .replace(/禮/g, "礼")
    .replace(/來/g, "来")
    .replace(/這/g, "这")
    .replace(/裡/g, "里")
    .replace(/麼/g, "么")
    .replace(/淚/g, "泪")
    .replace(/風/g, "风")
    .replace(/夢/g, "梦")
    .replace(/橋/g, "桥")
    .replace(/飯/g, "饭");
}

function normalizeCandidateSpan(span: string) {
  return span
    .replace(/[“”"‘’']/g, "")
    .replace(/^第?[一二三四五六七八九十百零〇兩两]\s*/, "")
    .replace(/^[，。！？；：、,.!?;:\s]+|[，。！？；：、,.!?;:\s]+$/g, "")
    .trim();
}

function isWeakLocalCandidate(span: string) {
  const cleaned = normalizeCandidateSpan(span);
  const simplified = simplifiedForHeuristic(cleaned);
  if (cleaned.length <= 1) return true;
  if (cleaned.length > 12) return true;
  if (weakChineseCandidatePattern.test(cleaned)) return true;
  if (functionalChinesePhrasePattern.test(cleaned)) return true;
  if (badPhraseBoundaryPattern.test(cleaned) && !localCandidateProfiles[cleaned]) return true;
  if (genericQuantityPattern.test(simplified)) return true;
  if (genericVerbPhrasePattern.test(simplified) && !carrierSubstancePattern.test(cleaned)) return true;
  if (discourseFillerPattern.test(cleaned.replace(/[，,、\s]/g, ""))) return true;
  if (discourseFillerPattern.test(simplified.replace(/[，,、\s]/g, ""))) return true;
  if (/^(.{1,4})[，,、\s]+\1$/.test(cleaned) && !carrierSubstancePattern.test(cleaned)) return true;
  if (/^[一二三四五六七八九十百千万萬零〇兩两]+$/.test(cleaned)) return true;
  if (/^[的了是在有人我他她你不这這那又便都也而著着]$/.test(cleaned)) return true;
  return false;
}

function hasCarrierSubstance(span: string) {
  const simplified = simplifiedForHeuristic(span);
  if (localCandidateProfiles[span]) return true;
  if (discourseFillerPattern.test(span.replace(/[，,、\s]/g, ""))) return false;
  if (discourseFillerPattern.test(simplified.replace(/[，,、\s]/g, ""))) return false;
  if (genericQuantityPattern.test(simplified) || genericVerbPhrasePattern.test(simplified)) return false;
  if (carrierSubstancePattern.test(span)) return true;
  if (span.length >= 3 && /(?:勝利|胜利|承認|承认|祝福|規矩|规矩|精神|故鄉|故乡)/.test(span)) return true;
  return false;
}

function relationLoadScore(span: string, text: string) {
  const compactText = `${simplifiedForHeuristic(span)} ${simplifiedForHeuristic(text)}`;
  let score = 0;
  if (/血/.test(compactText) && /(馒头|食|吃|药|治|病)/.test(compactText)) score += 0.22;
  if (/(祝福|仪式|祭祀|规矩|福礼)/.test(compactText) && /(禁|排除|不配|不能|不要|赶)/.test(compactText)) score += 0.18;
  if (/(胜利|承认|辫子|屈辱|打|败|骂)/.test(compactText)) score += 0.16;
  if (/(圆月|月|光|银圈|钢叉|故乡|少年|童年|记忆)/.test(compactText)) score += 0.14;
  if (/(看客|众人|茶馆|刑场|坟地|处决|杀)/.test(compactText)) score += 0.16;
  return Math.min(0.28, score);
}

function scoreLocalCandidateSpan(
  span: string,
  text: string,
  sources: {
    quoted: string[];
    repeatedTerms: string[];
    actionCandidates: string[];
    sceneCandidates: string[];
    nounPhraseCandidates: string[];
    cueCandidates: string[];
  }
) {
  const profile = localCandidateProfiles[span];
  const types = localCandidateTypes(span);
  let score = profile ? 0.78 : 0.2;
  if (hasCarrierSubstance(span)) score += 0.18;
  if (sources.quoted.includes(span)) score += 0.08;
  if (sources.repeatedTerms.includes(span)) score += 0.08;
  if (sources.sceneCandidates.includes(span)) score += 0.08;
  if (sources.actionCandidates.includes(span) && !genericVerbPhrasePattern.test(simplifiedForHeuristic(span))) score += 0.06;
  if (sources.nounPhraseCandidates.includes(span)) score += 0.05;
  if (types.includes("object") || types.includes("scene_ritual")) score += 0.06;
  if (types.includes("sensory_image")) score += 0.05;
  score += relationLoadScore(span, text);
  if (span.length <= 2 && !profile && !sources.repeatedTerms.includes(span)) score -= 0.12;
  if (genericQuantityPattern.test(simplifiedForHeuristic(span))) score -= 0.35;
  if (genericVerbPhrasePattern.test(simplifiedForHeuristic(span)) && !profile) score -= 0.22;
  if (/^(?:很多次|多次|一次|一点|一點|一会|一會|这样|這樣|自然|当然|當然)$/.test(simplifiedForHeuristic(span))) score -= 0.4;
  return Number(Math.max(0, Math.min(1, score)).toFixed(2));
}

function uniqueCandidateSpans(...groups: string[][]) {
  const seen = new Set<string>();
  return groups
    .flat()
    .map(normalizeCandidateSpan)
    .map((span) => span.replace(/^一[个只条张把盏轮阵声颗片]/, ""))
    .filter((span) => !isWeakLocalCandidate(span))
    .filter((span) => {
      const key = span.replace(/\s/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function suppressOverlappingWeakSpans(items: Array<{ span: string; quality: number }>) {
  const profileSpans = items
    .map((item) => item.span)
    .filter((span) => Boolean(localCandidateProfiles[span]));
  return items.filter((item) => {
    if (localCandidateProfiles[item.span]) return true;
    const compactSpan = simplifiedForHeuristic(item.span);
    const strongerProfile = profileSpans.find((profileSpan) => {
      const compactProfile = simplifiedForHeuristic(profileSpan);
      return compactSpan.includes(compactProfile) || compactProfile.includes(compactSpan);
    });
    if (strongerProfile && item.quality < 0.76) return false;
    return true;
  });
}

function extractChineseCueCandidates(text: string) {
  const cuePattern =
    /[\u4e00-\u9fff]{0,4}(?:月|光|聲|声|血|藥|药|門|门|窗|路|手|眼|臉|脸|辮子|辫子|墳|坟|燈|灯|香|花|鳥|鸟|酒|夢|梦|影|笑|哭|拜|跪|打|吃|走|看|聽|听|說|说|叫|嚷|喊|承認|承认|勝利|胜利|祝福|福禮|福礼|供品|儀式|仪式|規矩|规矩|看客|眾人|众人|閒人|闲人|少年|圓月|圆月|鋼叉|钢叉|銀圈|银圈|火|霜|雪|風|风|水|茶|酒|飯|饭|病|骨|淚|泪|船|河|橋|桥)[\u4e00-\u9fff]{0,4}/g;
  return Array.from(text.matchAll(cuePattern))
    .map((match) => normalizeCandidateSpan(match[0]))
    .map((span) => span.replace(/^[，。！？；：、]+|[，。！？；：、]+$/g, ""));
}

function extractChineseActionCandidates(text: string) {
  const actionPattern =
    /[\u4e00-\u9fff]{0,3}(?:吃下|拿來|拿来|碰了|打了|說出口|说出口|拜完|殺雞|杀鸡|宰鵝|宰鹅|刺去|逃走|點上|点上|享用|承認|承认|改寫|改写|得勝|得胜|跪下|抬頭|抬头|低頭|低头|走出|走進|走进)[\u4e00-\u9fff]{0,3}/g;
  return Array.from(text.matchAll(actionPattern)).map((match) => normalizeCandidateSpan(match[0]));
}

function extractChineseSceneCandidates(text: string) {
  const scenePattern = /(?:茶館|茶馆|街上|墳地|坟地|魯鎮|鲁镇|年終|年终|祭祀|祝福|處決|处决|看客|眾人|众人|閒人|闲人|家中|海邊|海边|沙地|船上|河邊|河边|城中|院子|門口|门口|路上|廟裡|庙里)[\u4e00-\u9fff]{0,4}/g;
  return Array.from(text.matchAll(scenePattern)).map((match) => normalizeCandidateSpan(match[0]));
}

function extractChineseNounPhraseCandidates(text: string) {
  const phrasePattern =
    /(?:一|那|这|這|几|幾|满|滿|半|老|小|新|旧|舊|破|白|黑|红|紅|青|蓝|藍|黄|黃|金|深|冷|热|熱|亮|暗)?[\u4e00-\u9fff]{1,3}(?:的)?(?:人|孩子|女人|男人|少年|老人|先生|太太|客|看客|闲人|閒人|路|门|門|窗|灯|燈|船|桥|橋|房|屋|桌|椅|碗|茶|酒|饭|飯|药|藥|血|花|鸟|鳥|月|声|聲|梦|夢|影|坟|墳|辫子|辮子|圈|叉|刀|包|馒头|饅頭|礼|禮|火|水|泪|淚|笑|哭)/g;
  return Array.from(text.matchAll(phrasePattern)).map((match) => normalizeCandidateSpan(match[0]));
}

function localCandidateTypes(span: string): CarrierType[] {
  const inferred = inferCarrierTypes(span);
  if (inferred.length > 0) return inferred;
  if (/吃|拿|走|碰|打|看|聽|听|叫|嚷|拜|殺|杀|宰|洗|刺|逃|承認|承认|得勝|得胜|哭|笑|跪/.test(span)) return ["action"];
  if (/說|说|叫|嚷|承認|承认|規矩|规矩|勝利法|胜利法/.test(span)) return ["discourse"];
  if (/茶館|茶馆|街|墳|坟|魯鎮|鲁镇|年終|年终|祭祀|祝福|看客|眾人|众人|閒人|闲人|海邊|海边|沙地|門口|门口|路上/.test(span)) return ["scene_ritual"];
  if (/月|光|聲|声|香|花|鳥|鸟|夢|梦|影|雪|霜|圓月|圆月|風|风/.test(span)) return ["sensory_image"];
  return ["object"];
}

function localScanCandidates(request: ScanCandidatesRequest): CandidateScanResult {
  const text = request.passage.trim();
  const sentenceSegments = text.split(/(?<=[。！？!?])\s*/).filter(Boolean).slice(0, 10);
  const quoted = Array.from(text.matchAll(/[“"']([^”"']{2,30})[”"']/g))
    .map((match) => normalizeCandidateSpan(match[1]))
    .filter((span) => !isWeakLocalCandidate(span))
    .filter((span) => hasCarrierSubstance(span));
  const chineseImagePattern =
    /(?:精神上的勝利法|精神上的胜利法|黃辮子|黄辫子|祝福|爆竹|福禮|福礼|金黃的圓月|金黄的圆月|銀圈|银圈|鋼叉|钢叉|人血饅頭|人血馒头|紅的饅頭|红的馒头|老荷葉|老荷叶|碧綠的包|碧绿的包|紅紅白白的破燈籠|红红白白的破灯笼|趁熱(?:的拿來，)?趁熱(?:的)?吃下|趁热(?:的拿来，)?趁热(?:的)?吃下|包好|明月光|明月|月光|稻花香|蛙聲一片|蛙声一片|蛙聲|蛙声|清風|清风|鳴蟬|鸣蝉|落花|流水|霜|雪|鏡子|镜子|玉|花|鳥|鸟|雲|云|雨|酒香|桂花香)/g;
  const chineseImages = Array.from(text.matchAll(chineseImagePattern)).map((match) =>
    normalizeCandidateSpan(match[0]).replace("趁热的拿来，趁热的吃下", "趁热吃下").replace("趁热的拿来，趁热吃下", "趁热吃下")
  );
  const englishImages = Array.from(
    text.matchAll(/\b(?:rose|flower|stone|mirror|dream|shadow|light|dark|water|sea|river|road|house|door|window|garden|dust|ash|fire|ice|snow|moon|star|blood|ghost|crown|mask)\b(?:\s+\w+){0,2}/gi)
  ).map((match) => match[0]);
  const repeatedTerms = Array.from(text.matchAll(/([\u4e00-\u9fff]{2,6})(?=[\s\S]{0,120}\1)/g))
    .map((match) => normalizeCandidateSpan(match[1]))
    .filter((term) => !isWeakLocalCandidate(term))
    .filter((term) => localCandidateProfiles[term] || /(胜利|辫子|祝福|爆竹|福礼|馒头|荷叶|包好|趁热|月|花|声|血|灯笼|乌鸦|坟|圈|药|钢叉|看客|众人|闲人|规矩|门|路|梦|影)/.test(term))
    .slice(0, 12);
  const cueCandidates = extractChineseCueCandidates(text);
  const actionCandidates = extractChineseActionCandidates(text);
  const sceneCandidates = extractChineseSceneCandidates(text);
  const nounPhraseCandidates = extractChineseNounPhraseCandidates(text);
  const words = text.split(/\s+/).filter((word) => word.length > 3).slice(0, 10);
  const scoredSpans = uniqueCandidateSpans(
    chineseImages,
    quoted,
    repeatedTerms,
    cueCandidates,
    actionCandidates,
    sceneCandidates,
    nounPhraseCandidates,
    englishImages,
    words
  )
    .filter((span) => hasCarrierSubstance(span) || quoted.includes(span) || repeatedTerms.includes(span))
    .map((span) => ({
      span,
      quality: scoreLocalCandidateSpan(span, text, {
        quoted,
        repeatedTerms,
        actionCandidates,
        sceneCandidates,
        nounPhraseCandidates,
        cueCandidates,
      }),
    }))
    .filter((item) => localCandidateProfiles[item.span] || item.quality >= 0.5);
  const spans = suppressOverlappingWeakSpans(scoredSpans)
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.span)
    .slice(0, 12);
  const spanQuality = Object.fromEntries(
    spans.map((span) => [
      span,
      scoreLocalCandidateSpan(span, text, {
        quoted,
        repeatedTerms,
        actionCandidates,
        sceneCandidates,
        nounPhraseCandidates,
        cueCandidates,
      }),
    ])
  );

  const candidates: CandidateCarrier[] =
    spans.length > 0
      ? spans.map((span, index) => {
          const profile = localCandidateProfiles[span];
          const quality = spanQuality[span] ?? 0.5;
          return {
          id: `local_candidate_${index + 1}`,
	          span,
	          label: span,
	          carrierTypes: localCandidateTypes(span),
	          whyCandidate:
	            profile?.why || "本地脚手架把它列为可检查的意义载体候选；它可能是物件、动作、话语、场景或感官线索，但是否成立需要回到原文判断。",
	          evidenceExcerpt: extractEvidence(text, span),
	          priority: profile?.priority ?? (quality >= 0.72 ? "high" : quality >= 0.55 ? "medium" : "low"),
	          detectionMethod: profile?.method ?? (request.theoryLenses?.includes("narrative_structure") ? "Narrative structure" : "LLM semantic scan"),
          basicMeaning: profile?.basic ?? "文本中可见的具体对象、动作或反复话语。",
          contextualMeaning: profile?.contextual ?? "它可能在当前语境中参与人物行动、场景组织或主题判断。",
          semanticTension: profile?.tension ?? "需要检查它是否真的形成字面意义和语境意义之间的张力。",
          culturalResonance: profile?.resonance ?? "这是未校准提示，需要由读者用文本证据校验。",
          readerSalience: profile?.priority ?? (quality >= 0.72 ? "high" : quality >= 0.55 ? "medium" : "low"),
          confidence: profile ? "medium" : quality >= 0.7 ? "medium" : "low",
          replaceability: profile?.replaceability ?? (quality >= 0.62 ? "medium" : "low"),
          theoryTrace: {
            mipVu: "检查字面意义和语境意义是否存在张力。",
            chinesePoetics: request.language === "zh" ? "只在它能形成意象、母题或场景共鸣时保留。" : "",
            symbolMotif: "检查它是否重复出现、形成颜色/物件对照，或承载习惯联想。",
            narrativeStructure: "检查它是否连接人物行动、交易、治疗、暴力或场景转折。",
          },
	          scores: {
	            mipTension: profile ? 0.7 : Math.max(0.35, quality - 0.05),
	            poeticImagery: request.language === "zh" ? (profile ? 0.65 : Math.max(0.35, quality - 0.12)) : 0.35,
		            motifRecurrence: repeatedTerms.includes(span) ? Math.max(0.72, quality) : Math.max(0.3, quality - 0.18),
		            narrativeImportance: profile?.method === "Narrative structure" || actionCandidates.includes(span) || sceneCandidates.includes(span) ? Math.max(0.72, quality) : Math.max(0.35, quality),
	            evidenceDensity: text.includes(span) ? Math.max(0.58, quality) : 0.35,
	          },
        };
        })
      : [];

  return {
    workTitle: request.workTitle,
    passageLabel: request.passageLabel,
    preprocess: {
	      segments: sentenceSegments,
	      entities: candidates
          .filter((candidate) => candidate.carrierTypes?.some((type) => type === "object" || type === "scene_ritual"))
          .map((candidate) => candidate.span)
          .slice(0, 12),
	      images: candidates
          .filter((candidate) => candidate.carrierTypes?.some((type) => type === "sensory_image" || type === "object"))
          .map((candidate) => candidate.span)
          .slice(0, 12),
	      actions: candidates
          .filter((candidate) => candidate.carrierTypes?.includes("action"))
          .map((candidate) => candidate.span)
          .slice(0, 12),
      repeatedTerms: repeatedTerms.filter((term) => spans.includes(term)).slice(0, 12),
      allusions: [],
      narrativeFrames: [request.language === "zh" ? "中文经典文本框架" : "文学文本框架"],
    },
    candidates,
  };
}

function localAnalyzePassage(request: AnalyzePassageRequest): LiteraryMapping {
  const carrier = inferCarrier(request.passage, request.selectedSpan);
  const mappingId = makeId("mapping");
  return {
    id: mappingId,
    title: `${carrier} 作为可讨论的意义载体`,
    workTitle: request.workTitle,
    passageLabel: request.passageLabel,
    passage: request.passage,
    selectedSpan: carrier,
    carrierTypes: inferCarrierTypes(carrier),
    expressionTypes: ["metaphorically_structured_image"],
    literalScene: {
      entities: [carrier, "读者", "周围场景"],
      actions: ["注意", "比较", "解释"],
    },
    concreteCarrier: {
      name: carrier,
      attributes: ["具体", "嵌入场景", "可替换", "需校验"],
      relations: [
        `“${carrier}”出现在具体的局部场景中。`,
        `“${carrier}”可以和其他替换载体进行比较。`,
        `“${carrier}”的意义需要回到文本和文化语境中校验。`,
      ],
    },
    broaderMeaningHypotheses: [
      "这个意象可能组织出更宽的主题判断",
      "文本可能支持不止一种有依据的解释",
      "意义依赖关系，而不是孤立查找象征含义",
    ],
    mappingRelations: [
      {
        id: `${mappingId}_r1`,
        carrierRelation: `“${carrier}”是文本中可观察的具体对象`,
        meaningRelation: "抽象意义可以通过具体文本对象被观察和讨论",
        importance: "high",
        evidenceIds: [`${mappingId}_e1`],
        relationType: "attribute",
      },
      {
        id: `${mappingId}_r2`,
        carrierRelation: `“${carrier}”嵌入在动作或场景关系中`,
        meaningRelation: "解释依赖意象、动作和语境之间的关系",
        importance: "medium",
        evidenceIds: [`${mappingId}_e1`, `${mappingId}_e2`],
        relationType: "narrative",
      },
    ],
    evidence: [
      {
        id: `${mappingId}_e1`,
        kind: "textual",
        label: "选中文本",
        excerpt: request.passage,
        note: "本地兜底分析只使用当前选中文本作为证据基础。",
        sourceRole: "passage",
        groundedness: "direct_quote",
      },
      {
        id: `${mappingId}_e2`,
        kind: "critical",
        label: "解释提醒",
        excerpt: "在获得更多证据前，请把这看作可修改的阅读脚手架。",
        note: "Demo 会区分系统生成的假设和读者自己的判断。",
        sourceRole: "critical_context",
        groundedness: "inference",
      },
    ],
    candidateCarriers: [
      {
        id: `${mappingId}_candidate_1`,
        span: carrier,
        label: carrier,
        carrierTypes: inferCarrierTypes(carrier),
        whyCandidate: "这个被选择或推断出的短语可以组织一条从具体到抽象的读法。",
        evidenceExcerpt: request.passage.slice(0, 180),
        priority: "high",
        detectionMethod: request.theoryLenses?.includes("chinese_poetics") ? "Chinese poetics" : "LLM semantic scan",
        basicMeaning: "文本中的具体意象或短语。",
        contextualMeaning: "可能承载更宽的文学意义。",
        semanticTension: "这个短语可能被读出超出字面场景的意义。",
        culturalResonance: "本地脚手架提示，需要用文本和文化证据继续校验。",
        readerSalience: "medium",
        confidence: "medium",
        replaceability: "medium",
      },
      {
        id: `${mappingId}_candidate_2`,
        span: "周围场景",
        label: "周围场景",
        carrierTypes: ["scene_ritual"],
        whyCandidate: "局部动作和场景中可能还有其他可解释意象。",
        evidenceExcerpt: request.passage.slice(0, 180),
        priority: "medium",
        detectionMethod: "Narrative structure",
        basicMeaning: "可见的动作和场景。",
        contextualMeaning: "场景可能组织人物、命运或主题意义。",
        semanticTension: "叙事动作可能承载象征力量。",
        culturalResonance: "需要用文本和文化证据校验。",
        readerSalience: "medium",
        confidence: "low",
        replaceability: "medium",
      },
    ],
    alternativeInterpretations: ["主题意义", "人物处境", "文化母题"],
    replacements: [
      localCompareReplacementSkeleton(mappingId, carrier, "一盏灯"),
      localCompareReplacementSkeleton(mappingId, carrier, "落叶"),
    ],
    uncertainty: "high",
    analysisProvenance: {
      systemRole: "fallback",
      theoryLenses: request.theoryLenses ?? [],
      source: "local_scaffold",
      generatedAt: new Date().toISOString(),
      packetProtocol: {
        status: "llm_draft",
        constructionMethod: "local_scaffold",
        validationNote: "这是由本地脚手架整理的未校准试探，只能作为读者探索入口，不能作为正式 UIRR packet。",
        requiredChecks: [
          "确认候选是否真的是可观察的具体载体",
          "确认意义关系是否有原文证据",
          "确认替换探针是否有诊断目的",
          "删除像文字游戏或过度解释的比较",
        ],
      },
    },
    studyHooks: {
      designGoal: ["让文学意义建构过程可观察", "让读者负责接受、修改或拒绝系统结构"],
      expectedUserAction: ["选择或修改候选载体", "校验关系证据", "比较替换后果"],
      measurableOutcome: ["映射具体性", "证据 grounding", "对意义变弱和新增方向的意识"],
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
        status: "weakened",
        title: "原有联想变弱",
        explanation: "原载体承载的一部分文本、文化或叙事关联在替换后不再稳定。",
        relationIds: [`${mappingId}_r2`],
        diagnosticQuestion: "替换后，哪些原本依附于该意象的关联变弱或失效？",
      },
      {
        id: `${mappingId}_${replacementCarrier}_non_substitutable`,
        status: "broken",
        title: "可能存在不可替代核心",
        explanation: "如果替换后关键文本关系无法成立，原载体就不是普通可换词，而是当前读法的核心结构。",
        relationIds: [`${mappingId}_r1`, `${mappingId}_r2`],
        diagnosticQuestion: "哪一条关系一换就断裂，从而说明原意象不可替代？",
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

export function scaffoldScanCandidates(request: ScanCandidatesRequest): CandidateScanResult {
  return localScanCandidates(request);
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

