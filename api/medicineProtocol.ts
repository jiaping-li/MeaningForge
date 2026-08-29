// Bounded, versioned material protocol for the controlled-study calibration
// text. These are not themes or final interpretations: each record is an
// exact-source lexical/observable candidate that the common pipeline must
// anchor, validate, score, project, or exclude like any other candidate.
export const MEDICINE_PROTOCOL_VERSION = "medicine-calibration-v3";

// This graph is a human-calibrated narrative index, not an interpretation.
// Every node and edge is tied to observable actors, actions, objects, places,
// or textual recurrence in the frozen full text. The UI may therefore encode
// story structure without treating figurative candidates as story entities.
export const medicineNarrativeGraphNodes = [
  { id: "scene-night-teahouse", label: "茶馆夜半", kind: "scene", chapter: "一", order: 1, quotes: ["茶馆的两间屋子里，便弥满了青白的光。"], description: "老栓从茶馆家中出发。" },
  { id: "event-depart", label: "老栓带钱出门", kind: "event", chapter: "一", order: 2, quotes: ["掏出一包洋钱，交给老栓"], description: "华大妈交钱，老栓离家。" },
  { id: "character-laoshuan", label: "华老栓", kind: "character", chapter: "一", order: 3, quotes: ["华老栓忽然坐起身。", "老栓走到家"], description: "为小栓寻找治病办法的茶馆主人。" },
  { id: "character-huadama", label: "华大妈", kind: "character", chapter: "一", order: 4, quotes: ["华大妈在枕头底下掏了半天", "华大妈已在右边的一坐新坟前面"], description: "小栓的母亲。" },
  { id: "object-money", label: "一包洋钱", kind: "object", chapter: "一", order: 5, quotes: ["掏出一包洋钱，交给老栓"], description: "刑场交易中交付的钱。" },

  { id: "scene-execution", label: "丁字街刑场", kind: "scene", chapter: "一", order: 6, quotes: ["远远里看见一条丁字街", "老栓也向那边看，却只见一堆人的后背"], description: "围观与交易发生的地点。" },
  { id: "event-crowd", label: "人群聚集围观", kind: "event", chapter: "一", order: 7, quotes: ["将到丁字街口，便突然立住，簇成一个半圆。"], description: "人群在丁字街口聚拢。" },
  { id: "event-transaction", label: "刑场交易", kind: "event", chapter: "一", order: 8, quotes: ["一手交钱，一手交货"], description: "黑衣人收钱并交出包裹。" },
  { id: "object-bloody-bun", label: "鲜红的馒头", kind: "object", chapter: "一", order: 9, quotes: ["一个鲜红的馒头，那红的还是一点一点的往下滴", "这样的人血馒头，什么痨病都包好"], description: "在刑场取得、随后被用作治病的馒头。" },
  { id: "cue-crowd-neck", label: "伸长的颈项", kind: "cue", chapter: "一", order: 10, quotes: ["颈项都伸得很长，仿佛许多鸭"], description: "刑场围观姿态的可检查描写。" },

  { id: "scene-medicine", label: "茶馆服药", kind: "scene", chapter: "二", order: 11, quotes: ["老栓走到家，店面早经收拾干净", "他的母亲端过一碟乌黑的圆东西"], description: "华家处理并让小栓吃下馒头。" },
  { id: "character-xiaoshuan", label: "小栓", kind: "character", chapter: "二", order: 12, quotes: ["只有小栓坐在里排的桌前吃饭", "小栓撮起这黑东西"], description: "患病并服下馒头的儿子。" },
  { id: "event-prepare-medicine", label: "烧烤并包裹馒头", kind: "event", chapter: "二", order: 13, quotes: ["用荷叶重新包了那红的馒头", "一阵红黑的火焰过去时"], description: "老栓夫妇处理带回的馒头。" },
  { id: "event-take-medicine", label: "小栓服下馒头", kind: "event", chapter: "二", order: 14, quotes: ["不多工夫，已经全在肚里了"], description: "小栓吃下处理后的馒头。" },
  { id: "object-black-round", label: "乌黑的圆东西", kind: "object", chapter: "二", order: 15, quotes: ["一碟乌黑的圆东西"], description: "处理后端给小栓的馒头。" },
  { id: "cue-life-in-hands", label: "拿着自己的性命", kind: "cue", chapter: "二", order: 16, quotes: ["似乎拿着自己的性命一般"], description: "小栓拿起食物时的可检查比较。" },

  { id: "scene-teahouse-talk", label: "茶馆议论", kind: "scene", chapter: "三", order: 17, quotes: ["店里坐着许多人，老栓也忙了"], description: "茶客围绕治病与夏瑜议论。" },
  { id: "character-kang", label: "康大叔", kind: "character", chapter: "三", order: 18, quotes: ["要没有康大叔照顾", "这康大叔却没有觉察"], description: "参与取得人血馒头并讲述刑场消息的人。" },
  { id: "character-xiayu", label: "夏瑜", kind: "character", chapter: "三", order: 19, quotes: ["不就是夏四奶奶的儿子么", "瑜儿，他们都冤枉了你"], description: "通过茶客叙述和坟地呼唤出现的人物。" },
  { id: "event-cure-claim", label: "反复宣称“包好”", kind: "event", chapter: "三", order: 20, quotes: ["包好，包好！这样的趁热吃下", "包好！小栓——你不要这么咳。包好"], description: "康大叔多次宣称馒头能治病。" },
  { id: "event-xiayu-talk", label: "茶客议论夏瑜", kind: "event", chapter: "三", order: 21, quotes: ["听说今天结果的一个犯人，便是夏家的孩子", "这大清的天下是我们大家的"], description: "茶客根据转述讨论夏瑜。" },
  { id: "cue-coughing", label: "小栓持续咳嗽", kind: "cue", chapter: "三", order: 22, quotes: ["小栓也合伙咳嗽起来", "小栓也趁着热闹，拼命咳嗽"], description: "与“包好”话语同时出现的身体状态。" },

  { id: "scene-cemetery", label: "清明坟地", kind: "scene", chapter: "四", order: 23, quotes: ["西关外靠着城根的地面，本是一块官地"], description: "两位母亲上坟并相遇的地点。" },
  { id: "character-xiusi", label: "夏四奶奶", kind: "character", chapter: "四", order: 24, quotes: ["小路上又来了一个女人，也是半白头发", "瑜儿，他们都冤枉了你"], description: "夏瑜的母亲。" },
  { id: "event-mothers-meet", label: "两位母亲在坟地相遇", kind: "event", chapter: "四", order: 25, quotes: ["那坟与小栓的坟，一字儿排着，中间只隔一条小路"], description: "华大妈与夏四奶奶隔着小路上坟。" },
  { id: "object-graves", label: "相邻的两座坟", kind: "object", chapter: "四", order: 26, quotes: ["那坟与小栓的坟，一字儿排着"], description: "小栓与夏瑜的坟相邻。" },
  { id: "object-flowers", label: "红白的花", kind: "object", chapter: "四", order: 27, quotes: ["分明有一圈红白的花，围着那尖圆的坟顶"], description: "夏瑜坟顶出现的一圈花。" },
  { id: "event-crow-call", label: "呼唤乌鸦作证", kind: "event", chapter: "四", order: 28, quotes: ["便教这乌鸦飞上你的坟顶，给我看罢"], description: "夏四奶奶向乌鸦提出请求。" },
  { id: "object-crow", label: "乌鸦", kind: "object", chapter: "四", order: 29, quotes: ["只见一只乌鸦，站在一株没有叶的树上", "那乌鸦张开两翅"], description: "坟地中被注视并最终飞走的乌鸦。" },
] as const;

export const medicineNarrativeGraphEdges = [
  { id: "edge-depart-scene", source: "event-depart", target: "scene-night-teahouse", type: "participates_in", label: "发生于", quotes: ["掏出一包洋钱，交给老栓"] },
  { id: "edge-laoshuan-depart", source: "character-laoshuan", target: "event-depart", type: "participates_in", label: "行动", quotes: ["交给老栓，老栓接了"] },
  { id: "edge-money-depart", source: "object-money", target: "event-depart", type: "involves", label: "涉及", quotes: ["掏出一包洋钱，交给老栓"] },
  { id: "edge-depart-crowd", source: "event-depart", target: "event-crowd", type: "precedes", label: "随后", quotes: ["便出了门，走到街上"] },
  { id: "edge-crowd-transaction", source: "event-crowd", target: "event-transaction", type: "precedes", label: "随后", quotes: ["轰的一声，都向后退"] },
  { id: "edge-transaction-scene", source: "event-transaction", target: "scene-execution", type: "participates_in", label: "发生于", quotes: ["一手交钱，一手交货"] },
  { id: "edge-laoshuan-transaction", source: "character-laoshuan", target: "event-transaction", type: "participates_in", label: "参与", quotes: ["老栓慌忙摸出洋钱"] },
  { id: "edge-bun-transaction", source: "object-bloody-bun", target: "event-transaction", type: "involves", label: "交易物", quotes: ["撮着一个鲜红的馒头"] },
  { id: "edge-crowd-cue", source: "cue-crowd-neck", target: "event-crowd", type: "co_present", label: "同时出现", quotes: ["颈项都伸得很长"] },

  { id: "edge-transaction-prepare", source: "event-transaction", target: "event-prepare-medicine", type: "precedes", label: "随后", quotes: ["用荷叶重新包了那红的馒头"] },
  { id: "edge-prepare-scene", source: "event-prepare-medicine", target: "scene-medicine", type: "participates_in", label: "发生于", quotes: ["一阵红黑的火焰过去时"] },
  { id: "edge-bun-prepare", source: "object-bloody-bun", target: "event-prepare-medicine", type: "involves", label: "被处理", quotes: ["用荷叶重新包了那红的馒头"] },
  { id: "edge-prepare-take", source: "event-prepare-medicine", target: "event-take-medicine", type: "precedes", label: "随后", quotes: ["小栓进来罢"] },
  { id: "edge-xiaoshuan-take", source: "character-xiaoshuan", target: "event-take-medicine", type: "participates_in", label: "服下", quotes: ["不多工夫，已经全在肚里了"] },
  { id: "edge-black-take", source: "object-black-round", target: "event-take-medicine", type: "involves", label: "呈现为", quotes: ["一碟乌黑的圆东西"] },
  { id: "edge-bun-black", source: "object-bloody-bun", target: "object-black-round", type: "recurs_as", label: "再次呈现", quotes: ["焦皮里面窜出一道白气"] },
  { id: "edge-life-take", source: "cue-life-in-hands", target: "event-take-medicine", type: "co_present", label: "同时出现", quotes: ["似乎拿着自己的性命一般"] },

  { id: "edge-take-talk", source: "event-take-medicine", target: "event-cure-claim", type: "precedes", label: "随后", quotes: ["店里坐着许多人，老栓也忙了"] },
  { id: "edge-claim-scene", source: "event-cure-claim", target: "scene-teahouse-talk", type: "participates_in", label: "发生于", quotes: ["包好，包好！这样的趁热吃下"] },
  { id: "edge-kang-claim", source: "character-kang", target: "event-cure-claim", type: "participates_in", label: "反复宣称", quotes: ["这康大叔却没有觉察"] },
  { id: "edge-bun-claim", source: "object-bloody-bun", target: "event-cure-claim", type: "involves", label: "谈及", quotes: ["这样的人血馒头"] },
  { id: "edge-claim-xiayu", source: "event-cure-claim", target: "event-xiayu-talk", type: "precedes", label: "话题转向", quotes: ["听说今天结果的一个犯人"] },
  { id: "edge-xiayu-talk-person", source: "character-xiayu", target: "event-xiayu-talk", type: "involves", label: "被议论", quotes: ["不就是夏四奶奶的儿子么"] },
  { id: "edge-cough-claim", source: "cue-coughing", target: "event-cure-claim", type: "co_present", label: "同时出现", quotes: ["小栓也合伙咳嗽起来"] },

  { id: "edge-talk-meet", source: "event-xiayu-talk", target: "event-mothers-meet", type: "precedes", label: "后来", quotes: ["这一年的清明"] },
  { id: "edge-meet-scene", source: "event-mothers-meet", target: "scene-cemetery", type: "participates_in", label: "发生于", quotes: ["中间只隔一条小路"] },
  { id: "edge-huadama-meet", source: "character-huadama", target: "event-mothers-meet", type: "participates_in", label: "参与", quotes: ["华大妈见这样子"] },
  { id: "edge-xiusi-meet", source: "character-xiusi", target: "event-mothers-meet", type: "participates_in", label: "参与", quotes: ["小路上又来了一个女人"] },
  { id: "edge-graves-meet", source: "object-graves", target: "event-mothers-meet", type: "involves", label: "相邻", quotes: ["一字儿排着，中间只隔一条小路"] },
  { id: "edge-flowers-graves", source: "object-flowers", target: "object-graves", type: "co_present", label: "出现于坟顶", quotes: ["一圈红白的花"] },
  { id: "edge-xiusi-call", source: "character-xiusi", target: "event-crow-call", type: "participates_in", label: "发出请求", quotes: ["便教这乌鸦飞上你的坟顶"] },
  { id: "edge-crow-call", source: "object-crow", target: "event-crow-call", type: "involves", label: "被呼唤", quotes: ["便教这乌鸦飞上你的坟顶"] },
  { id: "edge-xiayu-call", source: "character-xiayu", target: "event-crow-call", type: "involves", label: "被呼唤", quotes: ["瑜儿，他们都冤枉了你"] },
] as const;

export const medicineProtocolCandidates = [
  {
    label: "眼光 / 刀", type: "lexical_metaphor_candidate",
    exact_quote: "眼光正像两把刀。刺得老栓缩小了一半。",
    reasons: ["observability", "figurative_signal", "narrative_salience", "reader_actionability"],
    mip_record: { lexical_unit: "刀", contextual_meaning: "形容眼光带来的锐利、逼迫与伤害感。", basic_meaning: "可用于切割或刺伤物体的锋利器具。", comparison: "眼光不是器具；文本借刀的锋利与伤害潜能描述被注视者的感受。", decision: "metaphor_candidate", review_status: "researcher_checked" },
  },
  {
    label: "坟冢 / 馒头", type: "lexical_metaphor_candidate",
    exact_quote: "两面都已埋到层层叠叠，宛然阔人家里祝寿时候的馒头。",
    reasons: ["observability", "figurative_signal", "contrast", "reader_actionability"],
    mip_record: { lexical_unit: "馒头", contextual_meaning: "用祝寿馒头的层叠形状描写坟冢密集堆叠的视觉效果。", basic_meaning: "日常食用的蒸制面食。", comparison: "坟冢不是食物；文本将死亡场景的形状与庆寿食物并置，形成可检查的语境张力。", decision: "metaphor_candidate", review_status: "researcher_checked" },
  },
  {
    label: "乌鸦 / 铁铸", type: "lexical_metaphor_candidate",
    exact_quote: "那乌鸦也在笔直的树枝间，缩着头，铁铸一般站着。",
    reasons: ["observability", "figurative_signal", "narrative_salience", "reader_actionability"],
    mip_record: { lexical_unit: "铁铸", contextual_meaning: "形容乌鸦僵直、沉重且几乎不动的姿态。", basic_meaning: "用熔化的铁浇铸成固定形状。", comparison: "乌鸦不是铁制物；文本借铸铁的硬、冷与固定状态描写其姿态。", decision: "metaphor_candidate", review_status: "researcher_checked" },
  },
  {
    label: "无形的手 / 鸭", type: "lexical_metaphor_candidate",
    exact_quote: "颈项都伸得很长，仿佛许多鸭，被无形的手捏住了的，向上提着。",
    reasons: ["observability", "figurative_signal", "narrative_salience", "reader_actionability"],
    mip_record: { lexical_unit: "无形的手", contextual_meaning: "描述围观者仿佛同时被不可见力量攫住、提起的姿态与受制感。", basic_meaning: "人或动物可见的肢体，用以抓取、捏住或提起物体。", comparison: "现场并没有一只实际可见的手；文本以手的抓取动作组织群体姿态，形成可回查的语境张力。", decision: "metaphor_candidate", review_status: "researcher_checked" },
  },
  {
    label: "枯草 / 铜丝", type: "lexical_metaphor_candidate",
    exact_quote: "微风早经停息了；枯草支支直立，有如铜丝。",
    reasons: ["observability", "figurative_signal", "contrast", "narrative_salience", "reader_actionability"],
    mip_record: { lexical_unit: "铜丝", contextual_meaning: "形容枯草细、直、硬且在静止场景中显得冷峭的形态。", basic_meaning: "由铜拉制的细金属线。", comparison: "枯草不是金属线；文本借铜丝的细直和硬冷质感描写可见景象。", decision: "metaphor_candidate", review_status: "researcher_checked" },
  },
  {
    label: "人血馒头", type: "object", exact_quote: "这样的人血馒头，什么痨病都包好！", reasons: ["observability", "narrative_salience", "relational_load", "reader_actionability", "probe_potential"],
    calibration: { review_status: "researcher_checked", rationale: "作为跨段反复出现的叙事物件被人工校准；其象征或主题意义不在此节点中预先断言。" },
  },
  {
    label: "红白的花", type: "sensory_image", exact_quote: "分明有一圈红白的花，围着那尖圆的坟顶。", reasons: ["observability", "contrast", "narrative_salience", "reader_actionability"],
    calibration: { review_status: "researcher_checked", rationale: "作为坟地场景中可观察、可比较的视觉意象被人工校准；不把其意义预设为固定象征。" },
  },
  {
    label: "给人生命的本领", type: "discourse_image", exact_quote: "老栓倒觉爽快，仿佛一旦变了少年，得了神通，有给人生命的本领似的，跨步格外高远。", reasons: ["observability", "contrast", "narrative_salience", "reader_actionability"],
    calibration: { review_status: "researcher_checked", rationale: "作为人物信念与行动状态的可回查话语意象被人工校准；它不是自动判定的 MIP 隐喻节点。" },
  },
] as const;

// These are structural, not thematic, relations. Each relation says only what
// a reader can return to and inspect in the frozen edition: recurrence of a
// lexical form, or co-presence in a bounded cemetery scene.
export const medicineProtocolRelations = [
  { source_label: "人血馒头", target_label: "坟冢 / 馒头", type: "recurs_with", source_quote: "这样的人血馒头，什么痨病都包好！", target_quote: "两面都已埋到层层叠叠，宛然阔人家里祝寿时候的馒头。", rationale: "“馒头”在不同的精确文本位置再次出现；系统只提示其词语回返，读者需自行比较两处语境。", review_status: "researcher_checked" },
  { source_label: "乌鸦 / 铁铸", target_label: "红白的花", type: "co_occurs_with", source_quote: "那乌鸦也在笔直的树枝间，缩着头，铁铸一般站着。", target_quote: "分明有一圈红白的花，围着那尖圆的坟顶。", rationale: "两个候选均锚定在坟地场景的精确文本位置；此处仅记录可比较的场景共现。", review_status: "researcher_checked" },
  { source_label: "无形的手 / 鸭", target_label: "眼光 / 刀", type: "shares_scene", source_quote: "颈项都伸得很长，仿佛许多鸭，被无形的手捏住了的，向上提着。", target_quote: "眼光正像两把刀。刺得老栓缩小了一半。", rationale: "两处描写都锚定在刑场围观场景；该边仅标记可回查的场景连接。", review_status: "researcher_checked" },
  { source_label: "枯草 / 铜丝", target_label: "乌鸦 / 铁铸", type: "co_occurs_with", source_quote: "微风早经停息了；枯草支支直立，有如铜丝。", target_quote: "那乌鸦也在笔直的树枝间，缩着头，铁铸一般站着。", rationale: "两处描写均处于坟地静止场景；该边只保留可观察的场景共现。", review_status: "researcher_checked" },
  { source_label: "给人生命的本领", target_label: "人血馒头", type: "precedes", source_quote: "老栓倒觉爽快，仿佛一旦变了少年，得了神通，有给人生命的本领似的，跨步格外高远。", target_quote: "这样的人血馒头，什么痨病都包好！", rationale: "前者呈现老栓取得“药”前的期待，后者呈现该物被宣称的疗效；该边仅记录文本中的先后与可比较位置。", review_status: "researcher_checked" },
  { source_label: "红白的花", target_label: "枯草 / 铜丝", type: "co_occurs_with", source_quote: "分明有一圈红白的花，围着那尖圆的坟顶。", target_quote: "微风早经停息了；枯草支支直立，有如铜丝。", rationale: "两个可见意象均锚定在坟地段落；该边不预设花或枯草的象征意义。", review_status: "researcher_checked" },
] as const;

// Reader paths are a projection-layer object: they guide inspection without
// claiming a thematic interpretation. They are deliberately separate from
// the lower-level relation taxonomy above.
export const medicineProtocolReaderPaths = [
  { id: "medicine-path-execution", label: "刑场中的围观", prompt: "先看围观者的姿态，再看黑衣人的眼光；两处都在同一场景，但它们是否形成同一种压力，需要你回到原文判断。", node_labels: ["无形的手 / 鸭", "眼光 / 刀"], relation_pairs: [["无形的手 / 鸭", "眼光 / 刀"]] },
  { id: "medicine-path-medicine", label: "治病期待与“馒头”", prompt: "比较老栓对“给人生命”的期待、治病承诺，以及坟地中的“馒头”描写；不要预先把它们归结为一个主题。", node_labels: ["给人生命的本领", "人血馒头", "坟冢 / 馒头"], relation_pairs: [["给人生命的本领", "人血馒头"], ["人血馒头", "坟冢 / 馒头"]] },
  { id: "medicine-path-cemetery", label: "坟地里的可见细节", prompt: "并看花、枯草和乌鸦在坟地段落中的位置、形态与前后语境；它们的意义仍由你检验。", node_labels: ["红白的花", "枯草 / 铜丝", "乌鸦 / 铁铸"], relation_pairs: [["乌鸦 / 铁铸", "红白的花"], ["枯草 / 铜丝", "乌鸦 / 铁铸"], ["红白的花", "枯草 / 铜丝"]] },
] as const;

// Chapter anchors provide coverage without claiming that the chapter already
// contains a literary relation. Labels are bounded, observable references to
// the frozen edition and are separately retained from Reference Relations.
export const medicineProtocolChapterAnchors = [
  { chapter: "一", anchors: [
    { type: "character", label: "老栓", quote: "华老栓忽然坐起身。" },
    { type: "scene", label: "刑场围观", quote: "老栓也向那边看，却只见一堆人的后背；" },
    { type: "action", label: "一手交钱，一手交货", quote: "‘喂！一手交钱，一手交货！’" },
    { type: "object", label: "鲜红的馒头", quote: "一只手却撮着一个鲜红的馒头，那红的还是一点一点的往下滴。" },
  ], candidates: [
    { label: "乌蓝的天与青白的光", quote: "只剩下一片乌蓝的天；除了夜游的东西，什么都睡着。", uncertainty: "candidate", context_anchor_labels: ["老栓"], relation_basis: "同一出门场景的光线描写", prompt: "开篇连续记录天色与室内灯光；你可以留意这些颜色和光线是否在阅读中形成可比较的变化。" },
    { label: "攫取的光", quote: "眼里闪出一种攫取的光。", uncertainty: "candidate", context_anchor_labels: ["刑场围观"], relation_basis: "刑场围观者的可见姿态", prompt: "这里用一个动作性词语描写眼光；是否值得和同场景的其他注视比较，由你判断。" },
    { label: "新的生命", quote: "他现在要将这包里的新的生命，移植到他家里，收获许多幸福。", uncertainty: "candidate", context_anchor_labels: ["鲜红的馒头"], relation_basis: "老栓取得包裹后的想法", prompt: "老栓把包裹与“新的生命”放在一起；你可以在后文检查这种期待如何被继续、改变或打断。" },
  ] },
  { chapter: "二", anchors: [
    { type: "character", label: "老栓", quote: "老栓走到家，店面早经收拾干净，一排一排的茶桌" },
    { type: "character", label: "华大妈", quote: "华大妈便出去了，不多时，拿着一片老荷叶回来，摊在桌上。" },
    { type: "character", label: "小栓", quote: "小栓撮起这黑东西，看了一会，似乎" },
    { type: "action", label: "服药", quote: "‘吃下去罢，——病便好了。’" },
    { type: "object", label: "乌黑的圆东西", quote: "他的母亲端过一碟乌黑的圆东西，轻轻说：——" },
  ], candidates: [
    { label: "“自己的性命一般”", quote: "小栓撮起这黑东西，看了一会，似乎拿着自己的性命一般，心里说不出的奇怪。", uncertainty: "undecidable", context_anchor_labels: ["服药", "乌黑的圆东西"], relation_basis: "同一服药场景", prompt: "这处比较尚未被系统作为确定隐喻；你可以检查它是否改变了你对“服药”场景的理解。" },
    { label: "奇怪的香味", quote: "店屋里散满了一种奇怪的香味。", uncertainty: "candidate", context_anchor_labels: ["服药"], relation_basis: "处理馒头的感官细节", prompt: "处理馒头时出现了味觉线索；你可以决定它是否值得与物件外观或人物反应一起比较。" },
    { label: "注进与取出", quote: "两人的眼光，都仿佛要在他身里注进什么又要取出什么似的", uncertainty: "undecidable", context_anchor_labels: ["小栓", "服药"], relation_basis: "服药后的家庭注视", prompt: "这处同时出现“注进”和“取出”两个动作；它们如何组织父母的注视，仍需回到原文判断。" },
  ] },
  { chapter: "三", anchors: [
    { type: "scene", label: "茶馆议论", quote: "店里坐着许多人，老栓也忙了，提着大铜壶，一趟" },
    { type: "character", label: "康大叔", quote: "这康大叔却没有觉察，仍然提高了喉咙只是嚷，嚷得" },
    { type: "object", label: "人血馒头", quote: "这样的趁热吃下。这样的人血馒头，什么痨病都包好！" },
    { type: "action", label: "重复宣称“包好”", quote: "‘包好，包好！这样的趁热吃下。’" },
  ], candidates: [
    { label: "“包好”的反复", quote: "‘包好！小栓——你不要这么咳。包好！’", uncertainty: "candidate", context_anchor_labels: ["人血馒头", "康大叔"], relation_basis: "同一话语在本节反复出现", prompt: "“包好”在茶馆议论中多次出现；你可以比较每次出现时说话对象和同时发生的事情。" },
    { label: "合伙咳嗽", quote: "嚷得里面睡着的小栓也合伙咳嗽起来。", uncertainty: "candidate", context_anchor_labels: ["茶馆议论", "康大叔"], relation_basis: "宣称疗效与身体反应同时出现", prompt: "康大叔的嚷声和小栓的咳嗽被写在同一句中；这种并置是否重要，由你检查。" },
    { label: "眼光板滞与话语停顿", quote: "听着的人的眼光，忽然有些板滞；话也停顿了", uncertainty: "candidate", context_anchor_labels: ["茶馆议论"], relation_basis: "听众对话过程中的可见变化", prompt: "听众的眼光和谈话节奏同时变化；你可以留意话题前后发生了什么。" },
  ] },
  { chapter: "四", anchors: [
    { type: "scene", label: "坟地", quote: "西关外靠着城根的地面，本是一块官地；" },
    { type: "character", label: "华大妈", quote: "天明未久，华大妈已在右边的一坐新坟前面，排出" },
    { type: "object", label: "红白的花", quote: "分明有一圈红白的花，围着那尖圆的坟顶。" },
    { type: "object", label: "乌鸦", quote: "一只乌鸦，站在一株没有叶的树上" },
  ], candidates: [
    { label: "坟冢与祝寿馒头", quote: "两面都已埋到层层叠叠，宛然阔人家里祝寿时候的馒头。", uncertainty: "candidate", context_anchor_labels: ["坟地"], relation_basis: "坟地形状的明确比较", prompt: "坟冢的形状被拿来和祝寿馒头比较；你可以回看前文“馒头”的不同语境。" },
    { label: "中间只隔一条小路", quote: "那坟与小栓的坟，一字儿排着，中间只隔一条小路。", uncertainty: "candidate", context_anchor_labels: ["坟地", "华大妈"], relation_basis: "两座坟的空间位置", prompt: "文本明确交代两座坟的相邻位置；这条空间关系是否影响你的比较，由你决定。" },
    { label: "乌鸦的站立与飞走", quote: "只见那乌鸦张开两翅，一挫身，直向着远处的天空，箭也似的飞去了。", uncertainty: "candidate", context_anchor_labels: ["乌鸦"], relation_basis: "同一物件在场景中的状态变化", prompt: "乌鸦先被注视，后来飞走；你可以比较这两个精确位置，而不必预先确定它的象征意义。" },
  ] },
] as const;
