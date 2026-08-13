// Bounded, versioned material protocol for the controlled-study calibration
// text. These are not themes or final interpretations: each record is an
// exact-source lexical/observable candidate that the common pipeline must
// anchor, validate, score, project, or exclude like any other candidate.
export const MEDICINE_PROTOCOL_VERSION = "medicine-calibration-v2";

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
