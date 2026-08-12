# MeaningForge Formative v6 — Moderator Guide

## 这份 HTML 可以直接做什么
- 单文件、离线运行，不依赖 LLM/API。
- Participant ID 自动在 A/B/C 三个真实文学材料间分配；也可用 `?case=A` / `?case=B` / `?case=C` 强制指定。
- 若研究者自己检查材料，可在 URL 后加 `?researcher=1`；结束页会显示 researcher-only material note。
- 自动保存 localStorage，结束时导出 JSON。
- A/B/C/D 四种 low-fi representation 会按 Participant ID 自动改变顺序，减少固定顺序偏差。

## 三个材料
A. 萧红《初冬》（1936）——意象/感官环境 × 重复话语 × 情感关系  
B. 萧红《生死场》第三章“老马走进屠场”（1934）——物件/动物 × 行动路径 × 身体意象 × 经济关系  
C. 鲁迅《在酒楼上》（1924，顺序节选）——自我描述/比喻 × 后续行动 × 环境意象 × 解释张力

参与者阅读时只看到“材料 A/B/C”，结束后才显示来源。

## 为什么没有要求你先自己找 6–8 篇
“6–8 → 3”是降低 cherry-picking / 选材失误风险的研究流程，不是必须由你亲自执行的仪式。
这版由我先做了研究者侧 candidate screening，再选 3 种 relation family 放入 HTML。
但我不能替代真人目标用户判断：
- 是否真的太难；
- 是否太熟；
- relation 是否太明显；
- probe 是否像标准答案。

## 最省事的实际运行法
### P01–P03
在页面里选择 `Pilot / 材料与协议试跑`。
这三位就是你的 target-user material/protocol pilots，不需要另外找一批“非目标用户”。

重点看：
1. literal questions 是否能正常回答；
2. 自然解释是否存在；
3. retrospective Q1–Q7 是否太像口试；
4. A/B/C/D 是否能理解；
5. D 全文骨架是否明显过载；
6. replacement 是否像文字游戏；
7. 总时长。

### P04 以后
只有在 P01–P03 没有导致“材料/协议重大改变”时，再切到 `Main formative`。

如果 P01–P03 后你修改了：
- 文本内容；
- 核心问题；
- probe information；
- A/B/C/D representation；
- interaction task；
则建议不要把 P01–P03 合入 main formative。

如果只改：
- typo；
- UI 间距；
- 按钮文字；
- 不改变任务含义的小措辞；
则是否保留要按你的最终分析规范/伦理方案一致处理。

## 主持人不要做的事
自然阅读阶段不要说：
- “请找隐喻”
- “注意这些前后呼应”
- “这段其实是在说……”
- “这里和后面有关系”

不要替 participant 纠正解释。

中性追问：
- “你刚才是怎么想到这个的？”
- “哪段文字让你这么想？”
- “这里有什么你不确定的吗？”
- “另一个读者可能怎么看？”

## HTML 不是完整 IRB/伦理流程
知情同意、录音/屏幕录像许可、数据保存与匿名化仍需你的正式研究流程覆盖。


## 原文完整性说明
A/B/C 均来自既有文学作品。参与者页面使用按原作顺序的节选；B/C 已调整为**只删节、不用研究者自己的叙述改写代替原句**。这样可以降低“研究者通过重写材料人为制造关系结构”的方法风险。
