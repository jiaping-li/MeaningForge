import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download, FileUp, Flag, FlaskConical, GitCompareArrows, HeartHandshake, Lightbulb, LoaderCircle, Plus, ShieldQuestion, X } from "lucide-react";
import { downloadSession, loadDevelopmentPackage, loadSession, preparedWorks, prepareTextDraft, saveSession, sourceWorks, type PreparationDraft } from "@/services/workPackage";
import { emptySession, type ReaderSession, type Thread, type WorkPackage } from "@/types/workPackage";

type Tab = "trace" | "compare" | "challenge" | "counter" | "probe";
const find = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id);
const quote = (pkg: WorkPackage, id: string) => find(pkg.evidence, id)?.span_ids.map((s) => find(pkg.text_spans, s)?.text).filter(Boolean).join("\n") ?? "";
const chapters = (pkg: WorkPackage) => [...new Set(pkg.text_spans.map((span) => span.chapter_id))];
const event = (session: ReaderSession, action: string, targetId?: string, targetType?: string) => ({ ...session, events: [...session.events, { at: new Date().toISOString(), action, target_id: targetId, target_type: targetType }] });
function sourceSections(source: string) {
  const parts: Array<{ id: string; paragraphs: string[] }> = [];
  let active: string | undefined;
  const paragraphs = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  paragraphs.forEach((paragraph) => {
    const heading = paragraph.match(/^(?:第)?([一二三四五六七八九十]+|\d+)(?:[章节回])?(?:\s+.*)?$/)?.[1];
    if (heading) { active = String(parts.length + 1); parts.push({ id: active, paragraphs: [] }); }
    else if (active) parts[parts.length - 1].paragraphs.push(paragraph);
  });
  return parts.length ? parts : Array.from({ length: Math.ceil(paragraphs.length / 7) }, (_, index) => ({ id: String(index + 1), paragraphs: paragraphs.slice(index * 7, index * 7 + 7) }));
}

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return <section className={`collapsible-section ${open ? "open" : ""}`}>
<button className="section-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
<span>{title}</span>
<ChevronRight size={14} />
</button>{open && <div className="section-content">{children}</div>}</section>;
}

export default function App() {
  const [pkg, setPkg] = useState<WorkPackage | null>(null);
  const [source, setSource] = useState("");
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [chapter, setChapter] = useState("1");
  const [threadId, setThreadId] = useState("");
  const [relationId, setRelationId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [tab, setTab] = useState<Tab>("trace");
  const [claim, setClaim] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [useMIPForDrafts, setUseMIPForDrafts] = useState(false);
  const [loadingSource, setLoadingSource] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [skeletonExpanded, setSkeletonExpanded] = useState(true);
  const [overviewFlash, setOverviewFlash] = useState(false);
  const [readingLayout, setReadingLayout] = useState<"single" | "double">("single");
  const [selectedTextSpan, setSelectedTextSpan] = useState<{ id: string; text: string } | null>(null);
  const rightPaneRef = useRef<HTMLElement>(null);
  const overviewRef = useRef<HTMLElement>(null);

  const activate = (next: WorkPackage, text = "") => {
    const restored = loadSession(next.package_id, emptySession(next.package_id));
    const sourceChapterIds = sourceSections(text).map((section) => section.id);
    setPkg(next); setSource(text); setSession(restored); setClaim(restored.claim); setChapter(sourceChapterIds[0] ?? chapters(next)[0] ?? "1");
    setThreadId(""); setRelationId(""); setEvidenceId(""); setTab("trace"); setSkeletonExpanded(true);
  };
  useEffect(() => { loadDevelopmentPackage().then(async (next) => activate(next, next.work.source_uri ? await fetch(next.work.source_uri).then((r) => r.text()) : "")).catch(() => undefined); }, []);
  const persist = (fn: (old: ReaderSession) => ReaderSession) => setSession((old) => { if (!old) return old; const next = fn(old); saveSession(next); return next; });
  const openEvidence = (id: string) => { if (!pkg) return; const span = find(pkg.text_spans, find(pkg.evidence, id)?.span_ids[0] ?? ""); if (span) setChapter(span.chapter_id); setEvidenceId(id); persist((s) => event(s, "evidence_open", id, "evidence")); };
  const currentThread = pkg && find(pkg.threads, threadId);
  const openThread = (id: string) => { setThreadId(id); setRelationId(""); setTab("trace"); if (pkg) { const t = find(pkg.threads, id); if (t?.evidence_ids[0]) openEvidence(t.evidence_ids[0]); } persist((s) => event(s, "thread_open", id, "thread")); };
  const openRelation = (id: string) => { if (!pkg) return; const relation = find(pkg.structural_relations, id); if (!relation) return; const thread = pkg.threads.find((item) => item.structural_relation_ids.includes(id)); setRelationId(id); if (thread) setThreadId(thread.id); setTab("trace"); if (relation.evidence_ids[0]) openEvidence(relation.evidence_ids[0]); persist((s) => event(s, "relation_open", id, "structural_relation")); };
  const loadSourceWork = async (work: typeof sourceWorks[number]) => {
    setLoadingSource(work.bookUrl); setSourceError("");
    try { const response = await fetch(work.bookUrl); if (!response.ok) throw new Error("无法读取原文文件。"); const text = await response.text(); activate((await prepareTextDraft(work.title, text, { useLlm: useMIPForDrafts })).work_package, text); }
    catch (error) { setSourceError(error instanceof Error ? error.message : "无法为该文本建立草稿。请先启动 API 服务。"); }
    finally { setLoadingSource(""); }
  };
  const revealOverview = () => {
    setSkeletonExpanded(true); setOverviewFlash(true);
    window.setTimeout(() => { rightPaneRef.current?.scrollTo({ top: Math.max(0, (overviewRef.current?.offsetTop ?? 0) - 12), behavior: "smooth" }); }, 0);
    window.setTimeout(() => setOverviewFlash(false), 900);
  };
  if (!pkg || !session) return <main className="loading">正在准备 MeaningForge…</main>;
  const readerSections = sourceSections(source);
  const readerChapterIds = readerSections.length ? readerSections.map((section) => section.id) : chapters(pkg);
  const sectionSpans = pkg.text_spans.filter((s) => s.chapter_id === chapter).sort((a, b) => a.order - b.order);
  const sourceSection = readerSections.find((section) => section.id === chapter) ?? readerSections[readerChapterIds.indexOf(chapter)];
  const focusedQuote = evidenceId ? quote(pkg, evidenceId).split("\n")[0] : "";
  const readingParagraphs = sourceSection?.paragraphs.length ? sourceSection.paragraphs : sectionSpans.map((span) => span.text);
  const captureTextSelection = () => {
    const selected = window.getSelection()?.toString().trim(); if (!selected || selected.length < 2) return;
    const span = sectionSpans.find((item) => item.text.includes(selected)); if (span) setSelectedTextSpan({ id: span.id, text: selected });
  };
  const createReaderNodeFromText = (label: string, interpretationType: string, note: string) => {
    if (!selectedTextSpan || !label.trim()) return;
    const evidence = pkg.evidence.find((item) => item.span_ids.includes(selectedTextSpan.id)); const now = new Date().toISOString(); const id = `reader-node-${Date.now()}`;
    persist((s) => event({ ...s, reader_nodes: [...s.reader_nodes, { id, session_id: s.package_id, label: label.trim(), type: interpretationType, interpretation_type: interpretationType, source_text_span_id: selectedTextSpan.id, evidence_id: evidence?.id, note: note.trim() || undefined, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: label.trim(), type: interpretationType, note: note.trim() || undefined }] }] }, "reader_node_create_from_text", id, "reader_node"));
    setSelectedTextSpan(null); window.getSelection()?.removeAllRanges();
  };

  return <main className="app-shell">
    <header className="topbar">
<div className="brand">
<span className="brand-mark">M</span>
<div>
<b>MeaningForge</b>
<small>从原文证据出发，形成自己的精读</small>
</div>
</div>
<div className="top-actions">
<span className="status">
<i /> {pkg.package_status === "development" ? "开发材料 · 非研究结论" : "已加载参考骨架"}</span>
<button onClick={() => downloadSession(session)} title="导出本次阅读记录">
<Download size={16} />导出记录</button>
</div>
</header>
    <div className="study-note">
<ShieldQuestion size={16} />
<span>这是一个可质疑的参考初稿，不是标准答案。请始终回到原文，保留不确定性与替代读法。</span>
</div>
    <div className="workspace">
      <aside className="left-rail">
        <CollapsibleSection title="参考书籍" defaultOpen>{preparedWorks.map((work) => <button className="work-choice" key={work.packageUrl} onClick={() => loadDevelopmentPackage(work.packageUrl).then(async (next) => activate(next, next.work.source_uri ? await fetch(next.work.source_uri).then((r) => r.text()) : ""))}>
<BookOpen size={16} />
<span>
<b>《{work.title}》</b>
<small>{work.author} · {work.kind}</small>
</span>
</button>)}</CollapsibleSection>
        <CollapsibleSection title="草稿书库">
<label className="mip-option">
<input type="checkbox" checked={useMIPForDrafts} onChange={(event) => setUseMIPForDrafts(event.target.checked)} />使用本地模型 MIP 核查</label>{sourceWorks.map((work) => <button className="work-choice draft-work" key={work.bookUrl} disabled={Boolean(loadingSource)} onClick={() => loadSourceWork(work)}>{loadingSource === work.bookUrl ? <LoaderCircle className="spin" size={16} /> : <BookOpen size={16} />}<span>
<b>《{work.title}》</b>
<small>{work.author} · {useMIPForDrafts ? "MIP 草稿" : "草稿"}</small>
</span>
</button>)}{sourceError && <small className="source-error">{sourceError}</small>}</CollapsibleSection>
        <CollapsibleSection title="导入原文">
<button className="import-toggle" onClick={() => setShowImport((v) => !v)}>
<FileUp size={16} />选择 TXT <ChevronRight size={14} />
</button>{showImport && <ImportCard onReady={(draft) => activate(draft.work_package, draft.source_text)} />}</CollapsibleSection>
        <CollapsibleSection title={`《${pkg.work.title}》章节`} defaultOpen>
<div className="chapter-list">{readerChapterIds.map((id, n) => <button className={chapter === id ? "selected" : ""} onClick={() => { setChapter(id); setEvidenceId(""); }} key={id}>第 {n + 1} 节</button>)}</div>
</CollapsibleSection>
        <CollapsibleSection title="材料状态">
<div className="method-card">
<b>全文 → UNR → 投影</b>
<small>{pkg.construction_run?.validation_summary ?? "固定协议、原文锚定与关系核查后形成的参考骨架。"}</small>
<button onClick={() => alert(JSON.stringify({ package: pkg.package_id, construction: pkg.construction_run ?? "legacy development package", provenance: pkg.provenance }, null, 2))}>查看可追溯元数据</button>
</div>
</CollapsibleSection>
      </aside>
      <section className="reading-pane">
<header>
<div>
<p className="eyebrow">原文优先</p>
<h1>{pkg.work.title}</h1>
</div>
<div className="reading-actions">
<button className="layout-toggle" onClick={() => setReadingLayout((layout) => layout === "single" ? "double" : "single")}>{readingLayout === "single" ? "切换双栏" : "切换单栏"}</button>
<button className="overview-button" onClick={revealOverview}>展开全文骨架 <ChevronRight size={15} />
</button>
</div>
</header>
<ReadingNavigator chapter={chapter} chapterIds={readerChapterIds} onChange={(id) => { setChapter(id); setEvidenceId(""); setSelectedTextSpan(null); }} />
<div className="reading-hint">选中一句或一段文字，可把它变成你的解释节点；系统不会替你预先圈重点。</div>
<article onMouseUp={captureTextSelection} className={readingLayout === "double" ? "two-columns" : "one-column"}>{readingParagraphs.length ? readingParagraphs.map((paragraph, index) => <p key={index} className={focusedQuote && paragraph.includes(focusedQuote) ? "focused" : ""}>{paragraph}</p>) : <p>{source || "该材料的全文尚未载入。"}</p>}</article>{selectedTextSpan && <TextSpanComposer text={selectedTextSpan.text} onCreate={createReaderNodeFromText} onCancel={() => setSelectedTextSpan(null)} />}</section>
      <aside className="right-pane" ref={rightPaneRef}>
        <section id="overview" ref={overviewRef} className={`overview ${skeletonExpanded ? "expanded" : "collapsed"} ${overviewFlash ? "spotlight" : ""}`}>
<div className="section-heading">
<div>
<p className="eyebrow">全文参考骨架</p>
<h2>从全文到可检查的关系</h2>
</div>
<button className="skeleton-toggle" onClick={() => setSkeletonExpanded((value) => !value)}>{skeletonExpanded ? "收起骨架" : `展开骨架（${pkg.threads.length}）`}<ChevronRight size={14} />
</button>
</div>{skeletonExpanded && <>
<p className="quiet">参考层提供可检查起点；紫色的“我的层”可直接在图谱中创建和编辑。</p>
<SkeletonTree pkg={pkg} session={session} activeThread={threadId} onThread={openThread} onRelation={openRelation} onEvidence={openEvidence} onPersist={persist} />
</>}</section>
        {currentThread ? <ThreadWorkspace pkg={pkg} session={session} thread={currentThread} activeRelationId={relationId} tab={tab} setTab={setTab} evidenceId={evidenceId} onEvidence={openEvidence} onPersist={persist} onClose={() => { setThreadId(""); setRelationId(""); }} /> : <section className="empty-thread">
<Lightbulb size={20} />
<b>从图谱开始</b>
<p>点击节点或连线，回到原文并开始比较、质疑或补充自己的关系。</p>
</section>}
        <MyReading pkg={pkg} session={session} claim={claim} setClaim={setClaim} onEvidence={openEvidence} onPersist={persist} />
      </aside>
    </div>
  </main>;
}

function ImportCard({ onReady }: { onReady: (draft: PreparationDraft) => void }) {
  const [title, setTitle] = useState(""); const [text, setText] = useState(""); const [useMIP, setUseMIP] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const file = async (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setTitle(f.name.replace(/\.txt$/i, "")); setText(await f.text()); };
  const submit = async () => { if (text.trim().length < 120) return setMessage("请提供至少 120 字的 TXT 文本。"); setBusy(true); try { onReady(await prepareTextDraft(title, text, { useLlm: useMIP })); } catch (e) { setMessage(e instanceof Error ? e.message : "无法生成草稿。"); } finally { setBusy(false); } };
  return <div className="import-card">
<p>系统会建立可追溯的候选草稿；它不是可直接用于实验的材料。</p>
<input type="file" accept=".txt,text/plain" onChange={file} />
<label className="mip-option">
<input type="checkbox" checked={useMIP} onChange={(event) => setUseMIP(event.target.checked)} />使用已配置的本地模型完成 MIP/MIPVU 辅助记录</label>
<small>仅生成可审查的词汇—语境义—基本义比较；未配置本地模型时会自动回退至规则草稿。</small>
<button onClick={submit} disabled={busy}>{busy ? "正在构建…" : useMIP ? "生成含 MIP 候选的草稿" : "生成可检验草稿"}</button>{message && <small>{message}</small>}</div>;
}

function TextSpanComposer({ text, onCreate, onCancel }: { text: string; onCreate: (label: string, interpretationType: string, note: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState(""); const [type, setType] = useState("interpretive_candidate"); const [note, setNote] = useState("");
  return <aside className="text-span-composer">
<p>
<b>已选原文</b>：{text.length > 54 ? `${text.slice(0, 54)}…` : text}</p>
<div>
<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="给这个解释节点命名" />
<select value={type} onChange={(event) => setType(event.target.value)}>
<option value="interpretive_candidate">解释候选</option>
<option value="image_relation">意象关系</option>
<option value="question">待追问</option>
<option value="counterevidence">反证线索</option>
</select>
</div>
<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="为什么这段文字值得保留？（可选）" />
<footer>
<button onClick={onCancel}>取消</button>
<button className="primary" disabled={!label.trim()} onClick={() => onCreate(label, type, note)}>加入我的图层</button>
</footer>
</aside>;
}

function ReadingNavigator({ chapter, chapterIds, onChange }: { chapter: string; chapterIds: string[]; onChange: (id: string) => void }) {
  const index = Math.max(0, chapterIds.indexOf(chapter));
  return <nav className="reading-navigator" aria-label="章节导航">
<button disabled={index === 0} onClick={() => onChange(chapterIds[index - 1])}>
<ChevronLeft size={15} />上一页</button>
<label>
<span>第 {index + 1} / {chapterIds.length} 节</span>
<input type="range" min="0" max={Math.max(0, chapterIds.length - 1)} value={index} onChange={(event) => onChange(chapterIds[Number(event.target.value)])} />
</label>
<select value={chapter} onChange={(event) => onChange(event.target.value)} aria-label="选择章节">{chapterIds.map((id, n) => <option key={id} value={id}>第 {n + 1} 节</option>)}</select>
<button disabled={index === chapterIds.length - 1} onClick={() => onChange(chapterIds[index + 1])}>下一页<ChevronRight size={15} />
</button>
</nav>;
}

function SkeletonTree({ pkg, session, activeThread, onThread, onRelation, onEvidence, onPersist }: { pkg: WorkPackage; session: ReaderSession; activeThread: string; onThread: (id: string) => void; onRelation: (id: string) => void; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  // Prefer the node's own reader-facing thread. Falling back to the first
  // relation-containing thread caused a shared edge to open its other end.
  const threadForNode = (nodeId: string) => pkg.threads.find((thread) => thread.carrier_ids.includes(nodeId)) ?? pkg.threads.find((thread) => thread.structural_relation_ids.some((relationId) => { const relation = find(pkg.structural_relations, relationId); return relation?.source_id === nodeId || relation?.target_id === nodeId; }));
  const labelForNode = (nodeId: string) => find(pkg.carriers, nodeId)?.label ?? find(pkg.narrative_entities, nodeId)?.label ?? find(pkg.narrative_events ?? [], nodeId)?.label ?? find(pkg.figurative_features, nodeId)?.surface_form ?? "未解析节点";
  const openNode = (nodeId: string) => { const thread = threadForNode(nodeId); if (thread) onThread(thread.id); };
  const coreRelations = pkg.structural_relations.filter((relation) => relation.review_status === "researcher_checked");
  const visibleRelations = coreRelations.length ? coreRelations : pkg.structural_relations;
  const clusters: Array<typeof visibleRelations> = [];
  const remaining = new Set(visibleRelations.map((relation) => relation.id));
  while (remaining.size) {
    const first = visibleRelations.find((relation) => remaining.has(relation.id)); if (!first) break;
    const cluster = [first]; const nodeIds = new Set([first.source_id, first.target_id]); remaining.delete(first.id);
    let expanded = true;
    while (expanded) { expanded = false; visibleRelations.forEach((relation) => { if (!remaining.has(relation.id) || (!nodeIds.has(relation.source_id) && !nodeIds.has(relation.target_id))) return; cluster.push(relation); nodeIds.add(relation.source_id); nodeIds.add(relation.target_id); remaining.delete(relation.id); expanded = true; }); }
    clusters.push(cluster);
  }
  const readerPaths = pkg.scaffold_paths?.length ? pkg.scaffold_paths.map((path) => ({ id: path.id, label: path.label, prompt: path.prompt, node_ids: path.node_ids, relations: path.structural_relation_ids.map((id) => find(pkg.structural_relations, id)).filter((relation): relation is WorkPackage["structural_relations"][number] => Boolean(relation)) })) : clusters.map((relations, index) => ({ id: `derived-path-${index + 1}`, label: pkg.threads[index]?.neutral_label ?? `路径 ${index + 1}`, prompt: "沿着这条路径打开原文，比较各节点所在的语境与位置。", node_ids: [...new Set(relations.flatMap((relation) => [relation.source_id, relation.target_id]))], relations }));
  const [focusedCluster, setFocusedCluster] = useState(0);
  const [graphMode, setGraphMode] = useState<"inspect" | "connect">("inspect"); const [showReference, setShowReference] = useState(true); const [showReader, setShowReader] = useState(true); const [linkStart, setLinkStart] = useState(""); const [linkEnd, setLinkEnd] = useState(""); const [linkLabel, setLinkLabel] = useState(""); const [linkType, setLinkType] = useState("meaning_relation"); const [linkConfidence, setLinkConfidence] = useState<"tentative" | "developing" | "confident">("tentative"); const [editingNodeId, setEditingNodeId] = useState(""); const [editLabel, setEditLabel] = useState(""); const [editType, setEditType] = useState(""); const [editNote, setEditNote] = useState(""); const [editingRelationId, setEditingRelationId] = useState(""); const [editRelationLabel, setEditRelationLabel] = useState(""); const [editRelationExplanation, setEditRelationExplanation] = useState(""); const [editRelationType, setEditRelationType] = useState("meaning_relation"); const [editRelationConfidence, setEditRelationConfidence] = useState<"tentative" | "developing" | "confident">("tentative"); const [challengeReason, setChallengeReason] = useState("");
  const clusterIndex = Math.min(focusedCluster, Math.max(0, readerPaths.length - 1));
  const activePath = readerPaths[clusterIndex] ?? { id: "empty", label: "路径", prompt: "", node_ids: [], relations: [] };
  const cluster = activePath.relations;
  const nodeIds = activePath.node_ids;
  const positions = nodeIds.map((id, index) => {
    const presets = nodeIds.length === 2 ? [[22, 50], [78, 50]] : nodeIds.length === 3 ? [[22, 53], [52, 20], [78, 64]] : [[18, 24], [51, 14], [82, 28], [25, 74], [72, 76]];
    const [x, y] = presets[index] ?? [50, 50]; return { id, x, y };
  });
  const readerPositions = session.reader_nodes.map((node, index) => ({ id: node.id, x: [18, 50, 82][index % 3], y: 86 + Math.floor(index / 3) * 9 }));
  const positionFor = (id: string) => [...positions, ...readerPositions].find((position) => position.id === id);
  const visibleReaderRelations = session.reader_relations.filter((relation) => positionFor(relation.source_id) && positionFor(relation.target_id));
  const chooseNode = (id: string, reader = false) => { if (graphMode === "connect") { if (!linkStart || linkEnd) { setLinkStart(id); setLinkEnd(""); } else if (id !== linkStart) setLinkEnd(id); return; } if (reader) { const node = session.reader_nodes.find((item) => item.id === id); if (node) { setEditingNodeId(id); setEditLabel(node.label); setEditType(node.interpretation_type ?? node.type); setEditNote(node.note ?? ""); } } else openNode(id); };
  const evidenceForNode = (id: string) => session.reader_nodes.find((node) => node.id === id)?.evidence_id ?? find(pkg.carriers, id)?.evidence_ids[0] ?? find(pkg.narrative_entities, id)?.evidence_ids[0] ?? find(pkg.narrative_events ?? [], id)?.evidence_ids[0] ?? find(pkg.figurative_features, id)?.evidence_id;
  const createGraphRelation = () => { if (!linkStart || !linkEnd || !linkLabel.trim()) return; const now = new Date().toISOString(); const id = `reader-relation-${Date.now()}`; const evidenceIds = [...new Set([...session.selected_evidence_ids, evidenceForNode(linkStart), evidenceForNode(linkEnd)].filter((value): value is string => Boolean(value)))]; onPersist((s) => event({ ...s, reader_relations: [...s.reader_relations, { id, session_id: s.package_id, source_id: linkStart, target_id: linkEnd, label: linkLabel.trim(), relation_type: linkType, explanation: linkLabel.trim(), confidence: linkConfidence, evidence_ids: evidenceIds, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: linkLabel.trim(), relation_type: linkType, explanation: linkLabel.trim(), confidence: linkConfidence }] }] }, "reader_relation_create_on_graph", id, "reader_relation")); setLinkStart(""); setLinkEnd(""); setLinkLabel(""); setGraphMode("inspect"); };
  const editingNode = session.reader_nodes.find((node) => node.id === editingNodeId); const editingRelation = session.reader_relations.find((relation) => relation.id === editingRelationId);
  return <div className={`skeleton-tree focus-graph ${showReference ? "" : "hide-reference"} ${showReader ? "" : "hide-reader"}`}>
<div className="tree-root">
<BookOpen size={15} />
<span>《{pkg.work.title}》</span>
</div>
<div className="tree-trunk" />
<section className="focus-graph-panel">
<div className="graph-level">
<span>全文</span>
<ChevronRight size={11} />
<span>{activePath.label}</span>
</div>
<div className="cluster-switcher" aria-label="切换阅读路径">{readerPaths.map((path, index) => <button key={path.id} className={index === clusterIndex ? "active" : ""} onClick={() => setFocusedCluster(index)} title={path.label} aria-label={`查看：${path.label}`}>{index + 1}</button>)}</div>
<p className="path-prompt">{activePath.prompt}</p>
<div className="graph-legend">
<button className={showReference ? "layer-active" : ""} onClick={() => setShowReference((value) => !value)}>
<i className="legend-reference" />参考层</button>
<button className={showReader ? "layer-active" : ""} onClick={() => setShowReader((value) => !value)}>
<i className="legend-reader" />我的层</button>
<button className={graphMode === "connect" ? "mode-active" : ""} onClick={() => { setGraphMode(graphMode === "connect" ? "inspect" : "connect"); setLinkStart(""); setLinkEnd(""); }}>连线模式</button>
</div>
<div className="network-canvas layered-canvas">{cluster.map((relation) => { const source = positionFor(relation.source_id); const target = positionFor(relation.target_id); if (!source || !target) return null; return <div className="network-edge reference-edge" key={relation.id}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
<line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
</svg>
<button className="edge-label" style={{ left: `${(source.x + target.x) / 2}%`, top: `${(source.y + target.y) / 2}%` }} title="打开这条关系的证据、比较与质疑工具" onClick={() => onRelation(relation.id)}>
<BookOpen size={10} />
</button>
</div>; })}{visibleReaderRelations.map((relation) => { const source = positionFor(relation.source_id)!; const target = positionFor(relation.target_id)!; return <div className="network-edge reader-edge" key={relation.id}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
<line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
</svg>
<button className="reader-edge-label" style={{ left: `${(source.x + target.x) / 2}%`, top: `${(source.y + target.y) / 2}%` }} onClick={() => { setEditingRelationId(relation.id); setEditRelationLabel(relation.label); setEditRelationExplanation(relation.explanation ?? ""); setEditRelationType(relation.relation_type ?? "meaning_relation"); setEditRelationConfidence(relation.confidence ?? "tentative"); setChallengeReason(""); }}>{relation.label}</button>
</div>; })}{positions.map((position) => <button key={position.id} className={`network-node reference-node ${threadForNode(position.id)?.id === activeThread ? "active" : ""} ${linkStart === position.id || linkEnd === position.id ? "selected-link" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` } as CSSProperties} title={graphMode === "connect" ? "选择关系端点" : `打开“${labelForNode(position.id)}”的证据与工作台`} onClick={() => chooseNode(position.id)}>{labelForNode(position.id)}</button>)}{session.reader_nodes.map((node) => { const position = positionFor(node.id); if (!position) return null; return <button key={node.id} className={`network-node reader-node ${linkStart === node.id || linkEnd === node.id ? "selected-link" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` } as CSSProperties} title={graphMode === "connect" ? "选择关系端点" : "编辑我的节点"} onClick={() => chooseNode(node.id, true)}>{node.label}</button>; })}</div>{graphMode === "connect" && <div className="graph-editor">
<b>创建我的关系</b>
<small>{linkStart ? `起点：${labelForNode(linkStart) || session.reader_nodes.find((node) => node.id === linkStart)?.label}` : "在图上选择起点"}{linkEnd ? `　终点：${labelForNode(linkEnd) || session.reader_nodes.find((node) => node.id === linkEnd)?.label}` : ""}</small>
<input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="这两个节点之间有什么意义关系？" />
<div>
<select value={linkType} onChange={(event) => setLinkType(event.target.value)}>
<option value="meaning_relation">意义关系</option>
<option value="supports">支持</option>
<option value="complicates">复杂化</option>
<option value="contrasts">对照</option>
</select>
<select value={linkConfidence} onChange={(event) => setLinkConfidence(event.target.value as "tentative" | "developing" | "confident")}>
<option value="tentative">暂定</option>
<option value="developing">形成中</option>
<option value="confident">较有把握</option>
</select>
<button disabled={!linkStart || !linkEnd || !linkLabel.trim()} onClick={createGraphRelation}>保存连线</button>
</div>
</div>}{editingNode && <div className="graph-editor">
<b>编辑我的节点</b>
<input value={editLabel} onChange={(event) => setEditLabel(event.target.value)} />
<div>
<select value={editType} onChange={(event) => setEditType(event.target.value)}>
<option value="interpretive_candidate">解释候选</option>
<option value="image_relation">意象关系</option>
<option value="question">待追问</option>
<option value="counterevidence">反证线索</option>
</select>
<button onClick={() => editingNode.evidence_id && onEvidence(editingNode.evidence_id)}>查看原文</button>
</div>
<input value={editNote} onChange={(event) => setEditNote(event.target.value)} placeholder="说明或修订理由" />
<small>追踪：{editingNode.source_text_span_id ? "此节点已绑定一处原文 TextSpan。" : "此节点来自旧版本记录；建议回到原文补充锚点。"} {session.reader_relations.filter((relation) => relation.source_id === editingNode.id || relation.target_id === editingNode.id).length ? `它还连接了 ${session.reader_relations.filter((relation) => relation.source_id === editingNode.id || relation.target_id === editingNode.id).length} 条我的关系。` : "尚未与其他节点建立个人关系。"}</small>
<div>
<button onClick={() => { const now = new Date().toISOString(); onPersist((s) => event({ ...s, reader_nodes: s.reader_nodes.map((node) => node.id === editingNode.id ? { ...node, label: editLabel.trim() || node.label, type: editType, interpretation_type: editType, note: editNote || undefined, history: [...node.history, { at: now, action: "revise", label: editLabel.trim() || node.label, type: editType, note: editNote || undefined }] } : node) }, "reader_node_revise_on_graph", editingNode.id, "reader_node")); setEditingNodeId(""); }}>保存修订</button>
<button className="danger" onClick={() => { onPersist((s) => event({ ...s, reader_nodes: s.reader_nodes.filter((node) => node.id !== editingNode.id), reader_relations: s.reader_relations.filter((relation) => relation.source_id !== editingNode.id && relation.target_id !== editingNode.id) }, "reader_node_delete_on_graph", editingNode.id, "reader_node")); setEditingNodeId(""); }}>删除</button>
</div>
</div>}{editingRelation && <div className="graph-editor">
<b>编辑我的关系</b>
<input value={editRelationLabel} onChange={(event) => setEditRelationLabel(event.target.value)} placeholder="关系名称" />
<input value={editRelationExplanation} onChange={(event) => setEditRelationExplanation(event.target.value)} placeholder="为什么这样连接？" />
<div>
<select value={editRelationType} onChange={(event) => setEditRelationType(event.target.value)}>
<option value="meaning_relation">意义关系</option>
<option value="supports">支持</option>
<option value="complicates">复杂化</option>
<option value="contrasts">对照</option>
</select>
<select value={editRelationConfidence} onChange={(event) => setEditRelationConfidence(event.target.value as "tentative" | "developing" | "confident")}>
<option value="tentative">暂定</option>
<option value="developing">形成中</option>
<option value="confident">较有把握</option>
</select>
</div>
<input value={challengeReason} onChange={(event) => setChallengeReason(event.target.value)} placeholder="质疑这条关系的理由（可选）" />
<div>
<button onClick={() => { const now = new Date().toISOString(); onPersist((s) => event({ ...s, reader_relations: s.reader_relations.map((relation) => relation.id === editingRelation.id ? { ...relation, label: editRelationLabel.trim() || relation.label, relation_type: editRelationType, explanation: editRelationExplanation || undefined, confidence: editRelationConfidence, history: [...relation.history, { at: now, action: "revise", label: editRelationLabel.trim() || relation.label, relation_type: editRelationType, explanation: editRelationExplanation || undefined, confidence: editRelationConfidence }] } : relation) }, "reader_relation_revise_on_graph", editingRelation.id, "reader_relation")); setEditingRelationId(""); }}>保存修订</button>
<button onClick={() => { if (!challengeReason.trim()) return; const now = new Date().toISOString(); onPersist((s) => event({ ...s, judgments: { ...s.judgments, [editingRelation.id]: { judgment: "challenge", reason: challengeReason.trim(), created_at: now, provenance: "reader-authored" } } }, "reader_relation_challenge_on_graph", editingRelation.id, "reader_relation")); setChallengeReason(""); }}>质疑这条关系</button>
<button className="danger" onClick={() => { onPersist((s) => event({ ...s, reader_relations: s.reader_relations.filter((relation) => relation.id !== editingRelation.id) }, "reader_relation_delete_on_graph", editingRelation.id, "reader_relation")); setEditingRelationId(""); }}>删除</button>
</div>
</div>}<div className="focus-graph-hint">
<span>点击节点打开原文</span>
<span>连线模式：依次点两个节点</span>
</div>
</section>
</div>;
}

function ThreadWorkspace({ pkg, session, thread, activeRelationId, tab, setTab, evidenceId, onEvidence, onPersist, onClose }: { pkg: WorkPackage; session: ReaderSession; thread: Thread; activeRelationId: string; tab: Tab; setTab: (t: Tab) => void; evidenceId: string; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void; onClose: () => void }) {
  const allRelations = pkg.structural_relations.filter((r) => thread.structural_relation_ids.includes(r.id));
  const relations = activeRelationId ? allRelations.filter((relation) => relation.id === activeRelationId) : allRelations.filter((relation, _index, list) => relation.review_status === "researcher_checked" || !list.some((other) => other.review_status === "researcher_checked" && ((other.source_id === relation.source_id && other.target_id === relation.target_id) || (other.source_id === relation.target_id && other.target_id === relation.source_id))));
  const activeRelation = activeRelationId ? find(pkg.structural_relations, activeRelationId) : undefined;
  const nodeLabel = (id: string) => find(pkg.carriers, id)?.label ?? find(pkg.narrative_entities, id)?.label ?? find(pkg.figurative_features, id)?.surface_form ?? "节点";
  const focusNodeIds = activeRelation ? [activeRelation.source_id, activeRelation.target_id] : undefined;
  const focusEvidenceIds = activeRelation ? activeRelation.evidence_ids : undefined;
  const interpretations = pkg.interpretive_relations.filter((r) => thread.interpretive_relation_ids.includes(r.id));
  const tabs: Array<[Tab, string, typeof Flag]> = [["trace", "追踪", ChevronRight], ["compare", "比较", GitCompareArrows], ["challenge", "质疑", ShieldQuestion], ["counter", "反证", HeartHandshake], ["probe", "测试", FlaskConical]];
  return <section className="thread-workspace">
<div className="section-heading">
<div>
<p className="eyebrow">局部推理工作台</p>
<h2>{activeRelation ? `${nodeLabel(activeRelation.source_id)} ↔ ${nodeLabel(activeRelation.target_id)}` : thread.neutral_label}</h2>
</div>
<button className="close" onClick={onClose} title="返回图谱">
<X size={15} />
</button>
</div>
<div className="tabs">{tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); onPersist((s) => event(s, `${id}_open`, activeRelationId || thread.id, activeRelationId ? "structural_relation" : "thread")); }}>
<Icon size={14} />{label}</button>)}</div>
    {tab === "trace" && <Trace pkg={pkg} thread={thread} focusNodeIds={focusNodeIds} focusEvidenceIds={focusEvidenceIds} relations={relations} interpretations={interpretations} activeEvidence={evidenceId} onEvidence={onEvidence} onPersist={onPersist} />}
    {tab === "compare" && <Compare pkg={pkg} thread={thread} evidenceIds={focusEvidenceIds} onEvidence={onEvidence} />}
    {tab === "challenge" && <Challenge relations={[...relations, ...interpretations]} session={session} onPersist={onPersist} />}
    {tab === "counter" && <Counter pkg={pkg} thread={thread} onEvidence={onEvidence} onPersist={onPersist} />}
    {tab === "probe" && <Probe pkg={pkg} thread={thread} session={session} onPersist={onPersist} />}
  </section>;
}

function Trace({ pkg, thread, focusNodeIds, focusEvidenceIds, relations, interpretations, activeEvidence, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; focusNodeIds?: string[]; focusEvidenceIds?: string[]; relations: WorkPackage["structural_relations"]; interpretations: WorkPackage["interpretive_relations"]; activeEvidence: string; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const threadFeatures = focusNodeIds ? focusNodeIds.flatMap((nodeId) => find(pkg.carriers, nodeId)?.feature_ids ?? [nodeId]).map((id) => find(pkg.figurative_features, id)).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)) : (thread.feature_ids ?? []).map((id) => find(pkg.figurative_features, id)).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature));
  const mipFeatures = threadFeatures.filter((feature) => Boolean(feature.mip_record));
  const reviewLabel = (status?: string) => status === "researcher_checked" ? "研究者复核" : status === "machine_reviewed" ? "LLM 复核，读者仍可质疑" : "机器草稿，需复核";
  const evidenceIds = focusEvidenceIds ?? thread.evidence_ids;
  return <div className="panel">
<p>先看原文证据，再判断这条连接是否值得保留、修改或拒绝。</p>
<h3>原文证据</h3>{evidenceIds.map((id, n) => <button key={id} className={`evidence-card ${activeEvidence === id ? "active" : ""}`} onClick={() => onEvidence(id)}>
<b>{n + 1}</b>
<span>{quote(pkg, id)}</span>
<small>{find(pkg.evidence, id)?.note}</small>
</button>)}{mipFeatures.length > 0 && <>
<h3>MIP 词汇核查</h3>{mipFeatures.map((feature) => <article className="mip-record" key={feature.id}>
<b>词汇单元：{feature.mip_record?.lexical_unit}</b>
<p>
<span>语境义：</span>{feature.mip_record?.contextual_meaning}</p>
<p>
<span>基本义：</span>{feature.mip_record?.basic_meaning}</p>
<p>
<span>比较：</span>{feature.mip_record?.comparison}</p>
<small>隐喻候选 · {reviewLabel(feature.mip_record?.review_status)}</small>
</article>)}</>}<h3>正在检查的连接</h3>{relations.map((r) => <article className="relation" key={r.id}>
<p>{r.rationale}</p>
<small>点击上方证据回到原文；你可以在“质疑”中保留、修改或拒绝它。</small>
</article>)}{interpretations.map((r) => <article className="proposal" key={r.id}>
<span>可质疑的解释提案</span>
<p>{r.relation_text}</p>
<small>{r.qualification}</small>
<button onClick={() => onPersist((s) => ({ ...event(s, "selection_save", r.id, "interpretive_relation"), selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...r.evidence_ids])]}))}>
<Plus size={13} />保存到我的阅读</button>
</article>)}</div>;
}

function Compare({ pkg, thread, evidenceIds, onEvidence }: { pkg: WorkPackage; thread: Thread; evidenceIds?: string[]; onEvidence: (id: string) => void }) {
  const available = evidenceIds?.length ? evidenceIds : thread.evidence_ids; const [a, setA] = useState(available[0] ?? ""); const [b, setB] = useState(available[1] ?? available[0] ?? "");
  return <div className="panel">
<p>比较不是寻找唯一答案，而是让语境中的变化变得可见。</p>
<div className="compare-selects">
<select value={a} onChange={(e) => setA(e.target.value)}>{available.map((id) => <option value={id} key={id}>{find(pkg.evidence, id)?.note}</option>)}</select>
<select value={b} onChange={(e) => setB(e.target.value)}>{available.map((id) => <option value={id} key={id}>{find(pkg.evidence, id)?.note}</option>)}</select>
</div>
<div className="comparison">
<EvidenceBlock pkg={pkg} id={a} onOpen={onEvidence} />
<EvidenceBlock pkg={pkg} id={b} onOpen={onEvidence} />
</div>
<div className="question">比较它们的场景、谁在说/做什么、前后果，以及该细节在此处是否承担不同作用。</div>
</div>;
}

function Challenge({ relations, session, onPersist }: { relations: Array<WorkPackage["structural_relations"][number] | WorkPackage["interpretive_relations"][number]>; session: ReaderSession; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const [note, setNote] = useState(""); return <div className="panel">
<p>判断记录在你的个人层，不会修改参考骨架。</p>{relations.map((r) => <article className="challenge" key={r.id}>
<p>{"relation_text" in r ? r.relation_text : r.rationale}</p>
<div>{(["keep", "unsure", "reject"] as const).map((j) => <button className={session.judgments[r.id]?.judgment === j ? "chosen" : ""} onClick={() => onPersist((s) => event({ ...s, judgments: { ...s.judgments, [r.id]: { judgment: j, revision: note || undefined } } }, "judgment_create", r.id, "relation"))} key={j}>{j === "keep" ? "保留" : j === "unsure" ? "尚不确定" : "拒绝"}</button>)}</div>
</article>)}<label className="input-label">为下一项判断写下理由（可选）<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：这两处的语境仍需要更多说明" />
</label>
</div>;
}

function Counter({ pkg, thread, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const candidates = pkg.evidence.filter((e) => !thread.evidence_ids.includes(e.id)).slice(0, 5); return <div className="panel">
<p>反证不会自动推翻一条关系；它可以使读法复杂化、变弱，或导向另一种解释。</p>{candidates.map((e) => <article className="counter-card" key={e.id}>
<b>{e.note}</b>
<p>{quote(pkg, e.id)}</p>
<button onClick={() => { onEvidence(e.id); onPersist((s) => ({ ...event(s, "counterevidence_open", e.id, "evidence"), selected_evidence_ids: [...new Set([...s.selected_evidence_ids, e.id])]})); }}>打开并保存为复杂化证据</button>
</article>)}</div>;
}

function Probe({ pkg, thread, session, onPersist }: { pkg: WorkPackage; thread: Thread; session: ReaderSession; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const probes = pkg.probes.filter((p) => p.thread_id === thread.id); if (!probes.length) return <div className="panel">
<p>此线索没有适合的诊断测试。系统不会为了互动而强行制造替换游戏。</p>
</div>; return <div className="panel">{probes.map((p) => <article className="probe" key={p.id}>
<span>测试目标：{p.target_relation_ids.join(" · ")}</span>
<p>{p.prompt}</p>
<div>{(["preserved", "weakened", "broken", "emergent", "mixed", "unsure"] as const).map((effect) => <button className={session.probes.find((x) => x.probe_id === p.id)?.effect === effect ? "chosen" : ""} key={effect} onClick={() => onPersist((s) => event({ ...s, probes: [...s.probes.filter((x) => x.probe_id !== p.id), { probe_id: p.id, replacement: p.config?.suggested_replacement, effect, note: "" }] }, "probe_submit", p.id, "probe"))}>{({ preserved: "保留", weakened: "变弱", broken: "断裂", emergent: "新出现", mixed: "混合", unsure: "不确定" } as Record<string, string>)[effect]}</button>)}</div>
</article>)}</div>;
}

function MyReading({ pkg, session, claim, setClaim, onEvidence, onPersist }: { pkg: WorkPackage; session: ReaderSession; claim: string; setClaim: (v: string) => void; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const saved = [...new Set(session.selected_evidence_ids)];
  return <section className="my-reading">
<div className="section-heading">
<div>
<p className="eyebrow">我的阅读</p>
<h2>我的论证草稿</h2>
</div>
<span>{saved.length} 条证据</span>
</div>
    {saved.length ? <div className="saved-evidence">{saved.map((id) => <span key={id}>
<button onClick={() => onEvidence(id)}>{find(pkg.evidence, id)?.note}</button>
<button aria-label="移除这条证据" className="remove-chip" onClick={() => onPersist((s) => event({ ...s, selected_evidence_ids: s.selected_evidence_ids.filter((item) => item !== id) }, "selection_remove", id, "evidence"))}>×</button>
</span>)}</div> : <p className="quiet">在“追踪”或“反证”中保存证据；它们会留在这里，也可以随时移除。</p>}
    <div className="reader-layer-note">
<b>图谱中建构</b>
<p>从原文选句创建紫色节点；在“连线模式”中依次选择两个节点创建关系。点击紫色节点或紫色连线，可追踪、修订、质疑或删除。</p>
<small>当前：{session.reader_nodes.length} 个个人节点 · {session.reader_relations.length} 条个人关系；所有修改都只保存在本次 ReaderSession。</small>
</div>
    <textarea value={claim} onChange={(e) => setClaim(e.target.value)} onBlur={() => onPersist((s) => event({ ...s, claim }, "claim_update", "reader-claim"))} placeholder="用自己的话写下暂时的解释；说明它由哪些证据与关系支撑，也可以保留条件和疑问。" />
<small>读者作者性：系统不会替你生成或定稿这段解释。</small>
</section>;
}

function EvidenceBlock({ pkg, id, onOpen }: { pkg: WorkPackage; id: string; onOpen: (id: string) => void }) { return <article className="evidence-block">
<b>{find(pkg.evidence, id)?.note}</b>
<p>{quote(pkg, id)}</p>
<button onClick={() => onOpen(id)}>回到原文</button>
</article>; }
