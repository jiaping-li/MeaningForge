// Bounded, versioned material protocol for the controlled-study calibration
// text. These are not themes or final interpretations: each record is an
// exact-source lexical/observable candidate that the common pipeline must
// anchor, validate, score, project, or exclude like any other candidate.
export const MEDICINE_PROTOCOL_VERSION = "medicine-calibration-v1";

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
  { label: "人血馒头", type: "object", exact_quote: "这样的人血馒头，什么痨病都包好！", reasons: ["observability", "narrative_salience", "relational_load", "reader_actionability", "probe_potential"] },
  { label: "红白的花", type: "sensory_image", exact_quote: "分明有一圈红白的花，围着那尖圆的坟顶。", reasons: ["observability", "contrast", "narrative_salience", "reader_actionability"] },
] as const;

// These are structural, not thematic, relations. Each relation says only what
// a reader can return to and inspect in the frozen edition: recurrence of a
// lexical form, or co-presence in a bounded cemetery scene.
export const medicineProtocolRelations = [
  { source_label: "人血馒头", target_label: "坟冢 / 馒头", type: "recurs_with", source_quote: "这样的人血馒头，什么痨病都包好！", target_quote: "两面都已埋到层层叠叠，宛然阔人家里祝寿时候的馒头。", rationale: "“馒头”在不同的精确文本位置再次出现；系统只提示其词语回返，读者需自行比较两处语境。" },
  { source_label: "乌鸦 / 铁铸", target_label: "红白的花", type: "co_occurs_with", source_quote: "那乌鸦也在笔直的树枝间，缩着头，铁铸一般站着。", target_quote: "分明有一圈红白的花，围着那尖圆的坟顶。", rationale: "两个候选均锚定在坟地场景的精确文本位置；此处仅记录可比较的场景共现。" },
] as const;
