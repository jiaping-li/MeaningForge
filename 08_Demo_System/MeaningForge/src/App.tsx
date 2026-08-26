import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download, FileUp, Flag, FlaskConical, GitCompareArrows, HeartHandshake, LoaderCircle, Plus, ShieldQuestion, X } from "lucide-react";
import { downloadSession, loadDevelopmentPackage, loadSession, preparedWorks, prepareTextDraft, saveSession, sourceWorks, type PreparationDraft } from "@/services/workPackage";
import { emptySession, type ReaderSession, type Thread, type WorkPackage } from "@/types/workPackage";

type Tab = "trace" | "compare" | "challenge" | "counter" | "probe";
const find = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id);
const quote = (pkg: WorkPackage, id: string) => find(pkg.evidence, id)?.span_ids.map((s) => find(pkg.text_spans, s)?.text).filter(Boolean).join("\n") ?? "";
// Some frozen source packages retain a numeric front-matter span (for source
// metadata) before the edition's actual chapter markers.  It is not a reader
// chapter and must not be rendered beside “一 / 二 / 三 / 四”.
const chapters = (pkg: WorkPackage) => { const ids = [...new Set(pkg.text_spans.map((span) => span.chapter_id))]; return ids.some((id) => /[一二三四五六七八九十]/.test(id)) ? ids.filter((id) => !/^\d+$/.test(id)) : ids; };
const event = (session: ReaderSession, action: string, targetId?: string, targetType?: string, previousState?: unknown, nextState?: unknown) => ({ ...session, events: [...session.events, { at: new Date().toISOString(), action, target_id: targetId, target_type: targetType, previous_state: JSON.stringify(previousState ?? null), next_state: JSON.stringify(nextState ?? null) }] });
const changeTriggerLabels = { initial: "首次形成", new_evidence: "发现了新证据", reconsidered_evidence: "重新考虑已有证据", new_relation: "建立了新关系", contradictory_evidence: "遇到反证", context_change: "阅读到新的语境", reader_uncertainty: "意识到仍有不确定性" } as const;
function sourceSections(source: string) {
  const parts: Array<{ id: string; paragraphs: string[] }> = [];
  let active: string | undefined;
  const paragraphs = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  paragraphs.forEach((paragraph) => {
    const heading = paragraph.match(/^(?:第)?([一二三四五六七八九十]+|\d+)(?:[章节回])?(?:\s+.*)?$/)?.[1];
    // Keep the edition's actual chapter marker.  The frozen WorkPackage uses
    // “一 / 二 / 三 / 四” for 《药》, so renumbering the reader text as
    // “1 / 2 / 3 / 4” made evidence navigation and manual page changes use
    // two incompatible chapter IDs.
    if (heading) { active = heading; parts.push({ id: active, paragraphs: [] }); }
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
  const [readerWorkspaceOpen, setReaderWorkspaceOpen] = useState(false);
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
    setThreadId(""); setRelationId(""); setEvidenceId(""); setTab("trace"); setSkeletonExpanded(true); setReaderWorkspaceOpen(false);
  };
  useEffect(() => { loadDevelopmentPackage().then(async (next) => activate(next, next.work.source_uri ? await fetch(next.work.source_uri).then((r) => r.text()) : "")).catch(() => undefined); }, []);
  const persist = (fn: (old: ReaderSession) => ReaderSession) => setSession((old) => { if (!old) return old; const next = fn(old); saveSession(next); return next; });
  const openEvidence = (id: string) => { if (!pkg) return; const span = find(pkg.text_spans, find(pkg.evidence, id)?.span_ids[0] ?? ""); if (span) setChapter(chapters(pkg).includes(span.chapter_id) ? span.chapter_id : chapters(pkg)[0] ?? span.chapter_id); setEvidenceId(id); persist((s) => event(s, "evidence_open", id, "evidence")); };
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
  const researchView = new URLSearchParams(window.location.search).get("view") === "research";
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
  const createReaderNodeFromText = (label: string, readingIntent: "keep" | "question", note: string) => {
    if (!selectedTextSpan || !label.trim()) return;
    const evidence = pkg.evidence.find((item) => item.span_ids.includes(selectedTextSpan.id)); if (!evidence) return;
    const now = new Date().toISOString(); const id = `reader-node-${Date.now()}`;
    persist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, evidence.id])], meaning_map: { layout: "reader", positions: s.meaning_map?.positions ?? {} }, reader_nodes: [...s.reader_nodes, { id, session_id: s.package_id, label: label.trim(), type: "reader_evidence", interpretation_type: "reader_exploration", reading_intent: readingIntent, source_text_span_id: selectedTextSpan.id, evidence_id: evidence.id, evidence_ids: [evidence.id], note: note.trim() || undefined, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: label.trim(), type: "reader_evidence", note: note.trim() || undefined }] }] }, "reader_node_create_from_text", id, "reader_node", undefined, { evidence_id: evidence.id, reading_intent: readingIntent }));
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
<i /> {researchView ? "研究视图" : "可探索的参考线索"}</span>
{researchView && <button onClick={() => downloadSession(session)} title="导出本次阅读记录">
<Download size={16} />导出记录</button>
}
</div>
</header>
    <div className="study-note">
<ShieldQuestion size={16} />
<span>这里整理的是值得检查的文本细节，不是标准答案。请回到原文，保留不确定性与不同读法。</span>
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
        {researchView && <><CollapsibleSection title="草稿书库">
<label className="mip-option">
<input type="checkbox" checked={useMIPForDrafts} onChange={(event) => setUseMIPForDrafts(event.target.checked)} />使用本地模型 MIP 核查</label>{sourceWorks.map((work) => <button className="work-choice draft-work" key={work.bookUrl} disabled={Boolean(loadingSource)} onClick={() => loadSourceWork(work)}>{loadingSource === work.bookUrl ? <LoaderCircle className="spin" size={16} /> : <BookOpen size={16} />}<span>
<b>《{work.title}》</b>
<small>{work.author} · {useMIPForDrafts ? "MIP 草稿" : "草稿"}</small>
</span>
</button>)}{sourceError && <small className="source-error">{sourceError}</small>}</CollapsibleSection>
        <CollapsibleSection title="导入原文">
<button className="import-toggle" onClick={() => setShowImport((v) => !v)}>
<FileUp size={16} />选择 TXT <ChevronRight size={14} />
</button>{showImport && <ImportCard onReady={(draft) => activate(draft.work_package, draft.source_text)} />}</CollapsibleSection></>}
        <CollapsibleSection title={`《${pkg.work.title}》章节`} defaultOpen>
<div className="chapter-list">{readerChapterIds.map((id, n) => <button className={chapter === id ? "selected" : ""} onClick={() => { setChapter(id); setEvidenceId(""); }} key={id}>第 {n + 1} 节</button>)}</div>
</CollapsibleSection>
        {researchView && <CollapsibleSection title="材料状态">
<div className="method-card">
<b>全文 → UNR → 投影</b>
<small>{pkg.construction_run?.validation_summary ?? "固定协议、原文锚定与关系核查后形成的参考骨架。"}</small>
<button onClick={() => alert(JSON.stringify({ package: pkg.package_id, construction: pkg.construction_run ?? "legacy development package", provenance: pkg.provenance }, null, 2))}>查看可追溯元数据</button>
</div>
</CollapsibleSection>}
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
<div className="reading-hint">选中一句或一段文字，可把它保留为自己的原文线索；是否进一步解释由你决定。</div>
<article onMouseUp={captureTextSelection} className={readingLayout === "double" ? "two-columns" : "one-column"}>{readingParagraphs.length ? readingParagraphs.map((paragraph, index) => <p key={index} className={focusedQuote && paragraph.includes(focusedQuote) ? "focused" : ""}>{paragraph}</p>) : <p>{source || "该材料的全文尚未载入。"}</p>}</article>{selectedTextSpan && <TextSpanComposer text={selectedTextSpan.text} onCreate={createReaderNodeFromText} onCancel={() => setSelectedTextSpan(null)} />}</section>
      <aside className="right-pane" ref={rightPaneRef}>
        <section id="overview" ref={overviewRef} className={`overview ${skeletonExpanded ? "expanded" : "collapsed"} ${overviewFlash ? "spotlight" : ""}`}>
<div className="section-heading">
<div>
<p className="eyebrow">Meaning Space</p>
<h2>意义地图</h2>
</div>
<button className="skeleton-toggle" onClick={() => setSkeletonExpanded((value) => !value)}>{skeletonExpanded ? "收起本节线索" : "查看本节线索"}<ChevronRight size={14} />
</button>
</div>{skeletonExpanded && <>
<p className="quiet">系统只提供可回到原文的探索入口；紫色内容始终是你自己建立的解释。</p>
<MeaningSpace pkg={pkg} chapter={chapter} session={session} researchView={researchView} onEvidence={openEvidence} onPersist={persist} onOpenMyReading={() => { setReaderWorkspaceOpen(true); window.setTimeout(() => rightPaneRef.current?.scrollTo({ top: rightPaneRef.current.scrollHeight, behavior: "smooth" }), 0); }} onBeginInterpretation={(evidenceIds, relationId) => { persist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...evidenceIds])] }, "meaning_space_interpretation_begin", relationId, "meaning_anchor", undefined, { evidence_ids: evidenceIds })); setReaderWorkspaceOpen(true); window.setTimeout(() => rightPaneRef.current?.scrollTo({ top: rightPaneRef.current.scrollHeight, behavior: "smooth" }), 0); }} />
{researchView && <details className="research-graph"><summary>研究视图：查看完整参考图与图上编辑</summary><SkeletonTree pkg={pkg} chapter={chapter} session={session} activeThread={threadId} onThread={openThread} onRelation={openRelation} onEvidence={openEvidence} onPersist={persist} onBeginInterpretation={(evidenceIds, relationId) => { persist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...evidenceIds])] }, "relationship_interpretation_begin", relationId, "structural_relation", undefined, { evidence_ids: evidenceIds })); setReaderWorkspaceOpen(true); }} /></details>}
</>}</section>
        {currentThread && <ThreadWorkspace pkg={pkg} session={session} thread={currentThread} activeRelationId={relationId} tab={tab} setTab={setTab} evidenceId={evidenceId} onEvidence={openEvidence} onPersist={persist} onClose={() => { setThreadId(""); setRelationId(""); }} />}
        <details className="reader-workspace" open={readerWorkspaceOpen} onToggle={(event) => setReaderWorkspaceOpen(event.currentTarget.open)}><summary>我的阅读</summary><MyReading pkg={pkg} session={session} claim={claim} setClaim={setClaim} onEvidence={openEvidence} onPersist={persist} /></details>
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

function TextSpanComposer({ text, onCreate, onCancel }: { text: string; onCreate: (label: string, readingIntent: "keep" | "question", note: string) => void; onCancel: () => void }) {
  const initialLabel = text.replace(/[‘’“”"'，。！？；：]/g, "").trim().slice(0, 10);
  const [label, setLabel] = useState(initialLabel); const [intent, setIntent] = useState<"keep" | "question">("keep"); const [note, setNote] = useState("");
  return <aside className="text-span-composer">
<header className="composer-header"><b>添加紫色圆圈</b><small>与系统圆圈一样，可回到原文</small></header>
<blockquote>{text.length > 72 ? `${text.slice(0, 72)}…` : text}</blockquote>
<div className="composer-intents" role="group" aria-label="是否给这个圆圈附加阅读问题">
<button type="button" aria-pressed={intent === "keep"} className={intent === "keep" ? "active" : ""} onClick={() => setIntent("keep")}><b>直接添加</b><small>稍后比较或建立关联</small></button>
<button type="button" aria-pressed={intent === "question"} className={intent === "question" ? "active" : ""} onClick={() => setIntent("question")}><b>附带一个问题</b><small>圆圈不变，只记录疑问</small></button>
</div>
<div className="composer-fields">
<label><span>地图上的短名称</span><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="用原文中的短语标记" /></label>
<label><span>{intent === "question" ? "我想追问" : "为什么想继续留意？（可选）"}</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder={intent === "question" ? "例如：这里的‘动摇’只是动作，还是也改变了群体状态？" : "例如：这个动作在后文可能再次出现"} /></label>
</div>
<footer>
<button onClick={onCancel}>取消</button>
<button className="primary" disabled={!label.trim() || intent === "question" && !note.trim()} onClick={() => onCreate(label, intent, note)}>添加到我的探索</button>
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

function MapReadingPreview({ pkg, chapter, evidenceIds, onEvidence }: { pkg: WorkPackage; chapter: string; evidenceIds: string[]; onEvidence: (id: string) => void }) {
  const spans = pkg.text_spans.filter((span) => span.chapter_id === chapter).slice(0, 7);
  const selectedSpanIds = new Set(evidenceIds.flatMap((id) => find(pkg.evidence, id)?.span_ids ?? []));
  return <aside className="map-reading-preview"><header><b>原文</b><small>第 {chapter} 节</small></header>{spans.map((span) => <button key={span.id} className={selectedSpanIds.has(span.id) ? "marked" : ""} onClick={() => { const evidence = pkg.evidence.find((item) => item.span_ids.includes(span.id)); if (evidence) onEvidence(evidence.id); }}>{span.text}</button>)}</aside>;
}

function MeaningSpace({ pkg, chapter, session: rawSession, researchView, onEvidence, onPersist, onOpenMyReading, onBeginInterpretation }: { pkg: WorkPackage; chapter: string; session: ReaderSession; researchView: boolean; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void; onOpenMyReading: () => void; onBeginInterpretation: (evidenceIds: string[], relationId: string) => void }) {
  const session = { ...rawSession, reader_nodes: rawSession.reader_nodes.filter((node): node is typeof node & { evidence_id: string } => Boolean(node.evidence_id)) };
  const scaffold = pkg.chapter_scaffolds?.find((item) => item.chapter_id === chapter);
  const chapterReferenceRelationIds = new Set(scaffold?.reference_relation_ids ?? []);
  // An existing chapter scaffold with an empty relation list means exactly
  // that: this chapter has no projected strict reference relation. Falling
  // back to every researcher-checked relation in the book makes an empty
  // chapter look like a dense whole-text graph and erases that distinction.
  const referenceRelations = scaffold
    ? pkg.structural_relations.filter((relation) => chapterReferenceRelationIds.has(relation.id))
    : pkg.structural_relations.filter((relation) => relation.review_status === "researcher_checked");
  const referenceCarrierIds = new Set(referenceRelations.flatMap((relation) => [relation.source_id, relation.target_id]));
  const [selectedId, setSelectedId] = useState("");
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [pickedElementIds, setPickedElementIds] = useState<string[]>([]);
  const [relationEndpoints, setRelationEndpoints] = useState<Array<{ id: string; label: string; evidenceIds: string[] }>>([]);
  const [relationComposerOpen, setRelationComposerOpen] = useState(false);
  const [relationType, setRelationType] = useState("co_occurs_with");
  const [relationLabel, setRelationLabel] = useState("");
  const [relationExplanation, setRelationExplanation] = useState("");
  const [canvasLimit, setCanvasLimit] = useState(24);
  const [hoveredId, setHoveredId] = useState("");
  const [clusterBy, setClusterBy] = useState<"source" | "type" | "routes">("source");
  const [colorBy, setColorBy] = useState<"type" | "uniform" | "routes" | "views">("type");
  const [sizeBy, setSizeBy] = useState<"routes" | "views" | "uniform">("uniform");
  const [layout, setLayout] = useState<"reference" | "reader" | "compare">(rawSession.meaning_map?.layout ?? "reference");
  const [readerPositions, setReaderPositions] = useState<Record<string, [number, number]>>(rawSession.meaning_map?.positions ?? {});
  const [showMap, setShowMap] = useState(true);
  const [mapFocus, setMapFocus] = useState(false);
  const [wholeFocus, setWholeFocus] = useState<{ label: string; evidenceIds: string[]; carrierIds: string[]; relationIds?: string[]; why: string } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const draggedIdRef = useRef("");
  const positionsRef = useRef(readerPositions);
  positionsRef.current = readerPositions;
  useEffect(() => { if (rawSession.meaning_map?.layout) setLayout(rawSession.meaning_map.layout); }, [rawSession.meaning_map?.layout]);
  // The canvas is not a dump of every clause-level Evidence Unit.  It starts
  // from the neutral chapter anchors, then exposes only the MIP/UNR carriers
  // and candidates that are actually grounded in this chapter.  All remaining
  // units stay available in the evidence/provenance layer after selection.
  const carrierIdsForEvidence = (evidenceIds: string[]) => pkg.carriers.filter((carrier) => carrier.evidence_ids.some((id) => evidenceIds.includes(id))).map((carrier) => carrier.id);
  const relationIdsForEvidence = (evidenceIds: string[], carrierIds: string[]) => referenceRelations.filter((relation) => relation.evidence_ids.some((id) => evidenceIds.includes(id)) || carrierIds.includes(relation.source_id) || carrierIds.includes(relation.target_id)).map((relation) => relation.id);
  const anchorItems = (scaffold?.context_anchors ?? []).map((anchor) => {
    const carrierIds = carrierIdsForEvidence(anchor.evidence_ids);
    return { id: `anchor:${anchor.id}`, label: anchor.label, kind: anchor.type, sourceLayer: "context_anchor" as const, evidenceIds: anchor.evidence_ids, note: "这是研究者校准的叙事语境锚点；它说明文本中有什么，不预设它意味着什么。", carrierIds, relationIds: relationIdsForEvidence(anchor.evidence_ids, carrierIds), isCrossChapter: false };
  });
  const carrierItems = pkg.carriers.filter((carrier) => referenceCarrierIds.has(carrier.id) || carrier.evidence_ids.some((id) => find(pkg.evidence, id)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter))).map((carrier) => {
    const parts = carrier.label.split(/\s*\/\s*/).map((label) => label.trim()).filter(Boolean);
    const features = carrier.feature_ids.map((id) => find(pkg.figurative_features, id)).filter(Boolean);
    const hasMipComparison = features.some((feature) => feature?.mip_status === "applicable" && feature.mip_record?.decision === "metaphor_candidate");
    const localEvidenceIds = carrier.evidence_ids.filter((id) => find(pkg.evidence, id)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter));
    const isCrossChapter = localEvidenceIds.length === 0;
    return {
      id: `carrier:${carrier.id}`,
      label: carrier.label,
      kind: carrier.type === "object" ? "object" : carrier.type === "scene" ? "scene" : "image",
      sourceLayer: isCrossChapter ? "cross_chapter_carrier" as const : hasMipComparison ? "mip_carrier" as const : "structural_carrier" as const,
      evidenceIds: localEvidenceIds.length ? localEvidenceIds : carrier.evidence_ids,
      note: isCrossChapter ? "这是系统严格参考关系在其他章节的端点；保留它是为了让当前线索能够进入全文关系路径。" : hasMipComparison && parts.length > 1 ? `“${parts[0]}”与“${parts.slice(1).join("、")}”来自同一条词义比较记录；它是可检查的修辞候选，不是两个独立的意义结论。` : "这是由全文结构信号保留的修辞或叙事载体；是否值得进入解释由你判断。",
      carrierIds: [carrier.id],
      relationIds: referenceRelations.filter((relation) => relation.source_id === carrier.id || relation.target_id === carrier.id).map((relation) => relation.id),
      isCrossChapter,
    };
  });
  const candidateItems = (scaffold?.candidate_explorations ?? []).map((candidate) => ({ id: `candidate:${candidate.id}`, label: candidate.label, kind: "candidate", sourceLayer: "candidate" as const, evidenceIds: candidate.evidence_ids, note: candidate.prompt, carrierIds: [] as string[], relationIds: [] as string[], isCrossChapter: false }));
  const projectedItems = [...anchorItems, ...carrierItems, ...candidateItems].filter((item, index, all) => item.evidenceIds.length > 0 && all.findIndex((other) => other.label === item.label && other.evidenceIds[0] === item.evidenceIds[0]) === index);
  // Frozen reference packages created before Evidence Unit Projection remain
  // usable: derive the same neutral clause-level units on the reader side.
  const classifyCue = (text: string) => {
    if (/^[‘“"']|说|道|问|答|喊|叫/.test(text)) return "dialogue";
    if (/华老栓|华大妈|小栓|夏瑜|康大叔|先生|太太|姑娘|老爷/.test(text)) return "character";
    if (/馒头|鲜血|血|钱|灯|茶|药|衣|门|路|花|乌鸦|锁|碗|酒/.test(text)) return "object";
    if (/夜|天|街|屋|茶馆|刑场|坟|路上|院/.test(text)) return "scene";
    if (/走|坐|拿|看|听|叫|吃|喝|哭|笑|伸手|点上|吹熄|掏出|交给/.test(text)) return "action";
    return "passage";
  };
  const cuesFrom = (text: string) => text.split(/[。！？；!?;，、：:]+/).map((cue) => cue.replace(/^[‘“"'（）()]+|[’”"'（）()]+$/g, "").trim()).filter((cue) => cue.length >= 2).filter((cue, index, cues) => cues.indexOf(cue) === index).slice(0, 5);
  const frozenEvidenceItems = pkg.text_spans.filter((span) => span.chapter_id === chapter).flatMap((span) => {
    const evidenceId = pkg.evidence.find((item) => item.span_ids.includes(span.id))?.id;
    const carrierIds = evidenceId ? pkg.carriers.filter((carrier) => carrier.evidence_ids.includes(evidenceId)).map((carrier) => carrier.id) : [];
    const relationIds = evidenceId ? pkg.structural_relations.filter((relation) => relation.evidence_ids.includes(evidenceId) || carrierIds.includes(relation.source_id) || carrierIds.includes(relation.target_id)).map((relation) => relation.id) : [];
    return cuesFrom(span.text).map((text, index) => ({ id: `frozen-evidence-unit-${span.id}-${index + 1}`, label: text.length > 11 ? `${text.slice(0, 11)}…` : text, kind: classifyCue(text), sourceLayer: "compatibility_fallback" as const, evidenceIds: evidenceId ? [evidenceId] : [], note: "这是旧数据包缺少投影记录时使用的兼容性文本线索，不应视为 MIP/UNR 载体。", carrierIds, relationIds, isCrossChapter: false }));
  });
  const items = (projectedItems.length ? projectedItems : frozenEvidenceItems).filter((item, index, list) => item.evidenceIds.length && list.findIndex((other) => other.label === item.label && other.evidenceIds[0] === item.evidenceIds[0]) === index);
  const sourceOrderForEvidence = (evidenceId: string) => Math.min(...(find(pkg.evidence, evidenceId)?.span_ids.map((spanId) => find(pkg.text_spans, spanId)?.order ?? Number.MAX_SAFE_INTEGER) ?? [Number.MAX_SAFE_INTEGER]));
  const elements = items.flatMap((item) => {
    const localEvidenceIds = item.evidenceIds.filter((id) => find(pkg.evidence, id)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter));
    const evidenceIds = (localEvidenceIds.length ? localEvidenceIds : item.evidenceIds).slice(0, item.isCrossChapter ? 1 : 2);
    return evidenceIds.map((evidenceId, occurrence) => ({ ...item, id: `element:${item.id}:${evidenceId}`, evidenceIds: [evidenceId], occurrence, sourceOrder: sourceOrderForEvidence(evidenceId) }));
  }).sort((a, b) => a.sourceOrder - b.sourceOrder || a.label.localeCompare(b.label, "zh-CN")).slice(0, 30);
  const routeCountFor = (item: typeof elements[number]) => new Set([...item.relationIds, ...item.carrierIds]).size;
  const routeRankFor = (item: typeof elements[number]) => {
    const routes = routeCountFor(item);
    return routes >= 3 ? 3 : routes >= 1 ? 2 : 1;
  };
  const clusterFor = (item: typeof elements[number]) => {
    if (clusterBy === "type") {
      if (item.kind === "character") return "people";
      if (["action", "event", "dialogue"].includes(item.kind)) return "actions";
      if (["object", "image", "recurrence"].includes(item.kind)) return "objects";
      return "context";
    }
    if (clusterBy === "routes") return `routes-${routeRankFor(item)}`;
    return "source";
  };
  // These are deliberately loose point clouds, rather than labelled boxes: the
  // grouping changes how evidence can be noticed, not what the text "means".
  const clusterSlots: Record<string, Array<[number, number]>> = { objects: [[12, 16], [25, 11], [39, 19], [10, 32], [26, 36], [42, 31], [17, 45], [35, 48]], context: [[61, 15], [76, 10], [90, 20], [58, 31], [74, 35], [90, 38], [66, 47], [83, 50]], people: [[13, 67], [27, 61], [41, 70], [11, 82], [27, 87], [43, 83]], actions: [[58, 67], [73, 61], [89, 70], [57, 83], [73, 88], [90, 83]], "routes-3": [[48, 40], [62, 52], [44, 61]], "routes-2": [[20, 20], [76, 18], [23, 53], [79, 57], [49, 78], [16, 82]], "routes-1": [[8, 12], [91, 11], [8, 40], [93, 41], [31, 92], [70, 91]] };
  const sourceSlots: Array<[number, number]> = [[11, 16], [24, 11], [38, 18], [53, 10], [67, 21], [82, 13], [92, 28], [17, 32], [32, 38], [47, 29], [61, 40], [76, 32], [88, 46], [9, 51], [24, 57], [40, 50], [54, 59], [69, 51], [83, 62], [94, 69], [15, 73], [31, 82], [49, 75], [65, 86], [80, 78], [91, 88], [7, 89], [39, 93], [57, 94], [73, 95]];
  const compactSlots: Array<[number, number]> = [[15, 23], [38, 17], [62, 24], [85, 18], [18, 52], [43, 46], [68, 54], [88, 47], [32, 79], [67, 77]];
  const compactTypeSlots: Record<string, Array<[number, number]>> = { people: [[18, 24], [31, 37], [18, 48]], actions: [[18, 69], [34, 81], [42, 63]], objects: [[62, 23], [82, 37], [64, 45]], context: [[61, 68], [83, 80], [88, 58]] };
  const compactRouteSlots: Record<string, Array<[number, number]>> = { "routes-3": [[50, 42], [63, 63]], "routes-2": [[24, 24], [76, 25], [25, 67], [76, 71], [49, 77]], "routes-1": [[13, 48], [89, 49], [45, 17], [53, 90]] };
  const clusterUse = new Map<string, number>();
  const positionedElements = elements.slice(0, canvasLimit).map((item, sourceIndex) => { const cluster = clusterFor(item); const index = clusterUse.get(cluster) ?? 0; clusterUse.set(cluster, index + 1); const sparsePosition = clusterBy === "source" ? compactSlots[sourceIndex % compactSlots.length] : clusterBy === "type" ? compactTypeSlots[cluster][index % compactTypeSlots[cluster].length] : compactRouteSlots[cluster][index % compactRouteSlots[cluster].length]; return { ...item, cluster, position: elements.length <= 10 ? sparsePosition : clusterBy === "source" ? sourceSlots[sourceIndex % sourceSlots.length] : clusterSlots[cluster][index % clusterSlots[cluster].length] }; });
  const attentionFor = (item: typeof elements[number]) => session.events.filter((entry) => entry.action === "meaning_space_bubble_open" && entry.target_id === item.id).length;
  const colorClassFor = (item: typeof elements[number]) => colorBy === "type" ? `color-type-${item.kind}` : colorBy === "uniform" ? "color-uniform" : colorBy === "routes" ? `color-frequency-${routeRankFor(item)}` : `color-attention-${Math.min(3, attentionFor(item) + 1)}`;
  const sizeClassFor = (item: typeof elements[number]) => sizeBy === "uniform" ? "size-uniform" : sizeBy === "routes" ? `size-${routeRankFor(item)}` : `size-${Math.min(3, attentionFor(item) + 1)}`;
  const normalizeReferenceNodeId = (id: string) => id.replace(/:part-\d+(?=:)/, "");
  const referencedNodeIds = new Set(session.reader_evidence_references.flatMap((reference) => [reference.reference_node_id, normalizeReferenceNodeId(reference.reference_node_id)]));
  const visiblePositionedElements = layout === "reader" ? positionedElements.filter((item) => referencedNodeIds.has(item.id)) : positionedElements;
  const exactCarrierEndpoint = (carrierId: string) => visiblePositionedElements.find((item) => item.carrierIds.length === 1 && item.carrierIds[0] === carrierId && ["mip_carrier", "structural_carrier", "cross_chapter_carrier"].includes(item.sourceLayer))
    ?? visiblePositionedElements.find((item) => item.carrierIds.includes(carrierId));
  const weakRelationCandidates = referenceRelations.flatMap((relation) => {
    // The relation must terminate at its actual projected carriers. A context
    // anchor can share the same paragraph/evidence, but it is not therefore an
    // endpoint of the carrier-to-carrier relation.
    const source = exactCarrierEndpoint(relation.source_id);
    const target = exactCarrierEndpoint(relation.target_id);
    return source && target && source.id !== target.id ? [{ id: relation.id, source, target }] : [];
  });
  const weakRelations = weakRelationCandidates.filter((relation, index, relations) => {
    const key = [relation.source.carrierIds[0], relation.target.carrierIds[0]].sort().join("::");
    return relations.findIndex((candidate) => [candidate.source.carrierIds[0], candidate.target.carrierIds[0]].sort().join("::") === key) === index;
  }).slice(0, 8);
  // Candidate paths are not ReferenceRelations. They only show which neutral
  // chapter anchors a still-undecided figurative cue is grounded beside.
  // Keeping them visually separate prevents an empty strict layer from
  // becoming either a blank canvas or a fabricated validated network.
  const candidatePaths = (scaffold?.candidate_explorations ?? []).flatMap((candidate) => {
    const source = visiblePositionedElements.find((item) => item.id.includes(`candidate:${candidate.id}:`));
    return (candidate.context_anchor_ids ?? []).flatMap((anchorId) => {
      const target = visiblePositionedElements.find((item) => item.id.includes(`anchor:${anchorId}:`));
      return source && target ? [{ id: `${candidate.id}:${anchorId}`, source, target, basis: candidate.relation_basis ?? "可回查语境" }] : [];
    });
  }).slice(0, 4);
  const selected = elements.find((item) => item.id === selectedId);
  const pickedElements = elements.filter((item) => pickedElementIds.includes(item.id));
  const readerNodesInChapter = session.reader_nodes.filter((node) => node.evidence_ids.some((id) => find(pkg.evidence, id)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter)));
  const selectedReader = readerNodesInChapter.find((node) => node.id === selectedReaderId);
  const selectedPosition = positionedElements.find((item) => item.id === selectedId);
  const relatedRelationCandidates = selected ? referenceRelations.filter((relation) => selected.carrierIds.includes(relation.source_id) || selected.carrierIds.includes(relation.target_id) || relation.evidence_ids.some((id) => selected.evidenceIds.includes(id))) : [];
  const relatedRelations = relatedRelationCandidates.filter((relation, index, relations) => {
    const key = `${[relation.source_id, relation.target_id].sort().join("::")}::${relation.type}`;
    return relations.findIndex((candidate) => `${[candidate.source_id, candidate.target_id].sort().join("::")}::${candidate.type}` === key) === index;
  }).slice(0, 3);
  const relatedEvidenceIds = new Set(relatedRelations.flatMap((relation) => relation.evidence_ids));
  const nearbyElements = selectedPosition ? positionedElements.filter((item) => item.id !== selectedPosition.id && (item.relationIds.some((id) => relatedRelations.some((relation) => relation.id === id)) || item.evidenceIds.some((id) => relatedEvidenceIds.has(id)))).slice(0, 4) : [];
  const relationText = (relation: WorkPackage["structural_relations"][number]) => ({ shares_scene: "在同一场景出现", co_occurs_with: "在相近语境出现", recurs_with: "在不同位置再次出现", contrasts_with: "可与另一处形成对照", parallels: "可与另一处平行比较", precedes: "处于可比较的前后位置" } as Record<string, string>)[relation.type] ?? "存在可回查的连接";
  const carrierParts = (id: string) => (find(pkg.carriers, id)?.label ?? "").split(/\s*\/\s*/).map((label) => label.trim()).filter(Boolean);
  const relationEndpointLabel = (id: string) => find(pkg.carriers, id)?.label ?? find(pkg.narrative_entities, id)?.label ?? find(pkg.narrative_events ?? [], id)?.label ?? "原文线索";
  const relationSignalText = (relation: WorkPackage["structural_relations"][number]) => [relation.source_id, relation.target_id].flatMap((id) => { const parts = carrierParts(id); return parts.length > 1 ? [`${parts[0]}与${parts.slice(1).join("、")}`] : []; }).join("；");
  const typeLabel = (type: string) => ({ passage: "原文片段", dialogue: "对话片段", character: "人物", object: "物件／意象", event: "事件", action: "行动", scene: "场景", image: "修辞线索", recurrence: "重复线索", pattern: "结构线索", candidate: "待探索线索" } as Record<string, string>)[type] ?? "文本线索";
  const sourceLayerLabel = (sourceLayer: string) => ({ context_anchor: "叙事语境锚点", mip_carrier: researchView ? "MIP 词汇比较载体" : "修辞比较线索", structural_carrier: "全文结构线索", cross_chapter_carrier: "跨章关系端点", candidate: "待检查候选", compatibility_fallback: researchView ? "旧数据兼容线索" : "文本线索" } as Record<string, string>)[sourceLayer] ?? "可追溯线索";
  const readerTypeLabel = (type: string) => ({ reader_evidence: "我添加的原文线索", evidence_cue: "我添加的原文线索", question: "我的阅读问题", counterevidence: "针对关系的反证", interpretive_candidate: "暂定概念", image_relation: "意象关系", reader_exploration: "我添加的原文线索" } as Record<string, string>)[type] ?? "我的线索";
  const canvasLabel = (label: string) => {
    const cue = label.split(/[，。；：:、]/)[0].trim();
    return cue.length > 6 ? `${cue.slice(0, 6)}…` : cue;
  };
  const positions = [[14, 18], [28, 14], [43, 20], [58, 14], [74, 20], [87, 16], [19, 42], [34, 38], [49, 45], [65, 37], [81, 44], [91, 39], [14, 68], [29, 75], [45, 67], [61, 76], [77, 68], [90, 77]];
  const readerSlots: Array<[number, number]> = [[14, 86], [29, 80], [45, 89], [61, 81], [78, 88], [24, 66], [48, 70], [74, 66]];
  const openItem = (item: typeof items[number]) => { const endpoint = { id: item.carrierIds[0] ?? item.id, label: item.label, evidenceIds: item.evidenceIds }; if (relationEndpoints.length === 1 && relationEndpoints[0].id !== endpoint.id) { const alreadyReferenced = session.reader_evidence_references.some((reference) => normalizeReferenceNodeId(reference.reference_node_id) === item.id); if (!alreadyReferenced) toggleReferenceUse(item); toggleRelationEndpoint(endpoint); return; } setSelectedReaderId(""); setSelectedId(item.id); setWholeFocus(null); onPersist((s) => event(s, "meaning_space_bubble_open", item.id, "meaning_anchor", undefined, { label: item.label, chapter })); };
  const openReaderNode = (node: typeof readerNodesInChapter[number]) => { const endpoint = { id: node.id, label: node.label, evidenceIds: node.evidence_ids }; if (relationEndpoints.length === 1 && relationEndpoints[0].id !== endpoint.id) { toggleRelationEndpoint(endpoint); return; } setSelectedId(""); setSelectedReaderId(node.id); setWholeFocus(null); onPersist((s) => event(s, "meaning_space_reader_node_open", node.id, "reader_node", undefined, { label: node.label, chapter })); };
  // The reference field must stay stable.  Only purple reader-authored nodes
  // can carry saved positions; otherwise a prior drag turns the evidence map
  // into an ungrounded blank whiteboard.
  const referencePosition = (id: string, fallback: [number, number]) => layout !== "reference" && id.startsWith("reader:") ? readerPositions[id] ?? fallback : fallback;
  const readerCanvasPosition = (nodeId: string): [number, number] | undefined => {
    const readerIndex = readerNodesInChapter.findIndex((node) => node.id === nodeId);
    if (readerIndex >= 0) return referencePosition(`reader:${nodeId}`, readerSlots[readerIndex % readerSlots.length]);
    const referenceItem = positionedElements.find((item) => item.id === nodeId || item.carrierIds.includes(nodeId));
    return referenceItem ? referencePosition(referenceItem.id, referenceItem.position) : undefined;
  };
  const readerMapRelations = layout !== "reference" ? session.reader_relations.flatMap((relation) => {
    const source = readerCanvasPosition(relation.source_id); const target = readerCanvasPosition(relation.target_id);
    return source && target ? [{ ...relation, source, target }] : [];
  }) : [];
  const saveLayout = (id: string) => {
    const position = positionsRef.current[id]; if (!position) return;
    onPersist((s) => event({ ...s, meaning_map: { layout: "reader", positions: { ...(s.meaning_map?.positions ?? {}), [id]: position } } }, "meaning_canvas_element_move", id, "meaning_element", undefined, { chapter, x: position[0], y: position[1] }));
  };
  const updateDrag = (pointer: { clientX: number; clientY: number }) => {
    if (layout !== "reader" || !dragRef.current || !mapRef.current) return;
    const bounds = mapRef.current.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, ((pointer.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(10, Math.min(91, ((pointer.clientY - bounds.top) / bounds.height) * 100));
    dragRef.current.moved = true; draggedIdRef.current = dragRef.current.id; setReaderPositions((positions) => { const next = { ...positions, [dragRef.current!.id]: [x, y] as [number, number] }; positionsRef.current = next; return next; });
  };
  const setLayoutMode = (next: "reference" | "reader" | "compare") => { setLayout(next); onPersist((s) => event({ ...s, meaning_map: { layout: next, positions: s.meaning_map?.positions ?? readerPositions } }, "meaning_canvas_layout_change", chapter, "chapter", undefined, { layout: next })); };
  const endpointForItem = (item: typeof elements[number]) => ({ id: item.carrierIds[0] ?? item.id, label: item.label, evidenceIds: item.evidenceIds });
  const toggleRelationEndpoint = (endpoint: { id: string; label: string; evidenceIds: string[] }) => setRelationEndpoints((endpoints) => {
    if (endpoints.some((item) => item.id === endpoint.id)) return endpoints.filter((item) => item.id !== endpoint.id);
    const next = [...endpoints, endpoint].slice(-2); if (next.length === 2) setRelationComposerOpen(true); return next;
  });
  const togglePicked = (item: typeof elements[number]) => setPickedElementIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]);
  const beginRelationRevision = (relation: WorkPackage["structural_relations"][number]) => {
    const endpoints = [{ id: relation.source_id, label: relationEndpointLabel(relation.source_id), evidenceIds: relation.evidence_ids }, { id: relation.target_id, label: relationEndpointLabel(relation.target_id), evidenceIds: relation.evidence_ids }];
    setRelationEndpoints(endpoints); setRelationType("other"); setRelationLabel(""); setRelationExplanation(""); setRelationComposerOpen(true);
  };
  const createReaderRelationOnCanvas = () => {
    if (relationEndpoints.length !== 2 || !relationLabel.trim()) return;
    const now = new Date().toISOString(); const [source, target] = relationEndpoints;
    const evidenceIds = [...new Set([...source.evidenceIds, ...target.evidenceIds, ...session.selected_evidence_ids])];
    const id = `reader-relation-${Date.now()}`;
    onPersist((s) => event({ ...s, reader_relations: [...s.reader_relations, { id, session_id: s.package_id, source_id: source.id, target_id: target.id, label: relationLabel.trim(), relation_type: relationType, explanation: relationExplanation.trim() || undefined, confidence: "tentative", evidence_ids: evidenceIds, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: relationLabel.trim(), relation_type: relationType, explanation: relationExplanation.trim() || undefined, confidence: "tentative" }] }] }, "reader_relation_create_on_canvas", id, "reader_relation", undefined, { source: source.id, target: target.id, evidence_ids: evidenceIds }));
    setLayout("reader"); setRelationEndpoints([]); setRelationComposerOpen(false); setRelationLabel(""); setRelationExplanation("");
  };
  const toggleReferenceUse = (item: typeof items[number] | typeof elements[number]) => {
    const existing = session.reader_evidence_references.find((reference) => normalizeReferenceNodeId(reference.reference_node_id) === item.id);
    const now = new Date().toISOString();
    onPersist((s) => existing
      ? event({ ...s, reader_evidence_references: s.reader_evidence_references.filter((reference) => reference.id !== existing.id) }, "reader_reference_remove", existing.id, "reader_evidence_reference", existing)
      : event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...item.evidenceIds])], reader_evidence_references: [...s.reader_evidence_references, { id: `reader-reference-${Date.now()}`, session_id: s.package_id, reference_node_id: item.id, label: item.label, evidence_ids: item.evidenceIds, created_at: now, provenance: "reader-selected-reference" }] }, "reader_reference_add", item.id, "meaning_anchor", undefined, { evidence_ids: item.evidenceIds }));
    if (!existing) setLayout("reader");
  };
  const startRelationFromReference = (item: typeof elements[number]) => {
    const existing = session.reader_evidence_references.find((reference) => normalizeReferenceNodeId(reference.reference_node_id) === item.id);
    if (!existing) toggleReferenceUse(item);
    toggleRelationEndpoint(endpointForItem(item));
    setLayout("compare");
  };
  const reviewReference = (relation: WorkPackage["structural_relations"][number], action: "accept" | "challenge") => { const now = new Date().toISOString(); onPersist((s) => action === "accept" ? event({ ...s, reference_reviews: { ...s.reference_reviews, [relation.id]: { action: "accept", created_at: now, provenance: "reader-authored" } } }, "reference_relation_accept", relation.id, "reference_relation") : event({ ...s, judgments: { ...s.judgments, [relation.id]: { judgment: "challenge", created_at: now, provenance: "reader-authored" } } }, "reference_relation_challenge", relation.id, "reference_relation")); };
  if (!scaffold) return <section className="meaning-space-empty"><b>本节尚没有整理好的探索入口。</b><p>你仍可直接从原文选取句子，创建自己的解释节点。</p></section>;
  const localContext = scaffold.context_anchors.find((anchor) => anchor.type === "scene")?.label ?? "本节可比较的细节";
  return <section className="meaning-space">
    <header className="meaning-space-heading"><div><p className="eyebrow">Meaning Space</p><h3>{layout === "reference" ? "从哪些细节开始想？" : layout === "reader" ? "我正在追踪什么？" : "系统起点和我的探索有何不同？"}</h3></div><small>{layout === "reference" ? "气泡是可检查的文本细节，不是意义答案。" : layout === "reader" ? "这里只保留你主动选择的证据、问题与紫色关系。" : "两层并置，但不会互相覆盖。"}</small></header>
    <p className="meaning-space-intro">{layout === "reference" ? "先选择一个让你停下来的细节。需要时，再查看全文变化或相关证据。" : layout === "reader" ? "从原文选句或引用系统线索；比较之后再建立自己的关系。反证需要针对具体关系添加。" : "检查哪些系统线索被你采用、质疑或改成了自己的关系。"}</p>
    <div className="meaning-canvas-layout">
      <div className="canvas-settings" aria-label="证据地图设置">
        <span className="layout-choice"><button className={layout === "reference" ? "active" : ""} onClick={() => setLayoutMode("reference")}>系统参考</button><button title="这里保留你引用的系统证据，以及你自己创建的紫色节点和关系。" className={layout === "reader" ? "active" : ""} onClick={() => setLayoutMode("reader")}>我的探索</button><button title="同时显示系统参考与我的探索，便于检查两者的差异。" className={layout === "compare" ? "active" : ""} onClick={() => setLayoutMode("compare")}>两层对照</button></span>
        <details className="canvas-display-settings">
          <summary>{researchView ? "研究显示" : "调整显示"}</summary>
          <div>
            <label title={researchView ? "原文顺序使用 TextSpan.order；证据类型使用叙事/修辞类型；可检查连接数使用实际 carrier 与 relation 数量。" : "按原文 TextSpan 的先后顺序排列，或按人物、物件、行动、场景、修辞线索等证据类型聚合。"}>排列
              <select value={clusterBy} onChange={(e) => { const value = e.target.value as typeof clusterBy; setClusterBy(value); onPersist((s) => event(s, "meaning_canvas_cluster_change", chapter, "chapter", undefined, { value })); }}>
                <option value="source">原文顺序</option>
                <option value="type">证据类型</option>
                {researchView && <option value="routes">可检查连接数</option>}
              </select>
            </label>
            <label title={researchView ? "颜色依据证据类型、实际可检查连接数或本次会话查看次数；均不表示文学意义强度。" : "按证据类型着色，或使用统一颜色；颜色不表示文学意义或重要性。"}>颜色
              <select value={colorBy} onChange={(e) => { const value = e.target.value as typeof colorBy; setColorBy(value); onPersist((s) => event(s, "meaning_canvas_color_change", chapter, "chapter", undefined, { value })); }}>
                <option value="type">证据类型</option>
                <option value="uniform">统一颜色</option>
                {researchView && <option value="routes">可检查连接数</option>}
                {researchView && <option value="views">本次查看次数</option>}
              </select>
            </label>
            <label title={researchView ? "大小可显示实际可检查连接数或本次查看次数；均不表示文学意义强度。" : "保持同等大小，或按该线索实际连接到的载体与关系记录数分级；不表示文学意义强度。"}>大小
              <select value={sizeBy} onChange={(e) => { const value = e.target.value as typeof sizeBy; setSizeBy(value); onPersist((s) => event(s, "meaning_canvas_size_change", chapter, "chapter", undefined, { value })); }}>
                <option value="uniform">相同大小</option>
                <option value="routes">可检查连接数</option>
                {researchView && <option value="views">本次查看次数</option>}
              </select>
            </label>
          </div>
          {!researchView && <small className="encoding-boundary">“可检查连接数”只表示可打开的证据/关系入口数量，不表示线索更重要。</small>}
        </details>
      </div>
      <div ref={mapRef} className={`meaning-map ${visiblePositionedElements.length <= 10 ? "sparse-map" : ""} ${showMap ? "map-open" : ""} ${layout === "reader" ? "reader-arranging" : "reference-arrangement"}`} aria-label="本节意义探索图" onPointerMove={updateDrag} onPointerUp={() => { const drag = dragRef.current; dragRef.current = null; if (drag?.moved) saveLayout(drag.id); }} onPointerCancel={() => { dragRef.current = null; }}>
      <div className="map-arrangement-note"><b>{layout === "reference" ? "系统参考" : layout === "reader" ? "我的探索" : "两层对照"}</b><span>{layout === "reference" ? (clusterBy === "source" ? "按原文先后位置排列" : "按所选证据属性排列") : layout === "reader" ? "引用证据与紫色结构属于你的阅读过程" : "同时查看系统起点与自己的构建"}</span></div>
      {layout !== "reader" && <div className={`reference-relation-status ${referenceRelations.length ? "has-relations" : "no-relations"}`}>{referenceRelations.length ? `${referenceRelations.length} 条严格参考关系` : `暂无严格参考关系${candidatePaths.length ? ` · ${candidateItems.length} 个候选路径` : ""}`}</div>}
      {layout !== "reader" && weakRelations.length > 0 && <svg className="meaning-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="系统严格参考关系">{weakRelations.map((relation) => { const highlighted = [selectedId, hoveredId].filter(Boolean).some((id) => id === relation.source.id || id === relation.target.id); return <line className={highlighted ? "active" : ""} key={relation.id} x1={relation.source.position[0]} y1={relation.source.position[1]} x2={relation.target.position[0]} y2={relation.target.position[1]} />; })}</svg>}
      {layout !== "reader" && candidatePaths.length > 0 && <svg className="meaning-map-candidate-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="待检查候选路径">{candidatePaths.map((path) => { const highlighted = [selectedId, hoveredId].filter(Boolean).some((id) => id === path.source.id || id === path.target.id); return <line className={highlighted ? "active" : ""} key={path.id} x1={path.source.position[0]} y1={path.source.position[1]} x2={path.target.position[0]} y2={path.target.position[1]}><title>{path.basis} · 尚未验证</title></line>; })}</svg>}
      {readerMapRelations.length > 0 && <svg className="meaning-map-reader-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="我的关系">{readerMapRelations.map((relation) => <line key={relation.id} x1={relation.source[0]} y1={relation.source[1]} x2={relation.target[0]} y2={relation.target[1]} />)}</svg>}
      {visiblePositionedElements.map((item, index) => { const hovered = visiblePositionedElements.find((entry) => entry.id === hoveredId); const position = referencePosition(item.id, item.position); const spanOrder = (entry: typeof item) => find(pkg.text_spans, find(pkg.evidence, entry.evidenceIds[0])?.span_ids[0] ?? "")?.order ?? -99; const itemChapter = find(pkg.text_spans, find(pkg.evidence, item.evidenceIds[0])?.span_ids[0] ?? "")?.chapter_id ?? chapter; const comparable = !hovered || item.id === hovered.id || Math.abs(spanOrder(item) - spanOrder(hovered)) <= 1 || item.relationIds.some((id) => hovered.relationIds.includes(id)); return <button key={item.id} title={`${item.label}${item.occurrence ? ` · 出现 ${item.occurrence + 1}` : ""}`} data-bubble-info={`${item.label} · ${typeLabel(item.kind)} · 第 ${itemChapter} 节 · ${sourceLayerLabel(item.sourceLayer)}`} aria-label={`查看：${item.label}`} className={`meaning-bubble system-evidence-bubble ${colorClassFor(item)} ${sizeClassFor(item)} ${item.isCrossChapter ? "cross-chapter-endpoint" : ""} ${item.relationIds.length ? "relation-bearing" : ""} ${selected?.id === item.id ? "selected" : ""} ${pickedElementIds.includes(item.id) ? "picked" : ""} ${referencedNodeIds.has(item.id) ? "reader-referenced" : ""} ${hovered && !comparable ? "muted" : ""} ${hovered && comparable && item.id !== hovered.id ? "hover-related" : ""} bubble-${(index % 6) + 1}`} style={{ left: `${showMap ? position[0] : 18 + index * 6}%`, top: `${showMap ? position[1] : 50}%` } as CSSProperties} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId("")} onClick={() => openItem(item)}><span>{canvasLabel(item.label)}</span><i aria-hidden="true" /></button>; })}
      {layout !== "reference" && readerNodesInChapter.slice(0, readerSlots.length).map((node, index) => { const id = `reader:${node.id}`; const position = referencePosition(id, readerSlots[index]); return <button key={node.id} className={`meaning-bubble reader-meaning-bubble ${selectedReader?.id === node.id ? "selected" : ""}`} style={{ left: `${position[0]}%`, top: `${position[1]}%` } as CSSProperties} aria-label={`查看我的解释：${node.label}`} onPointerDown={(event) => { if (layout === "reader") { draggedIdRef.current = ""; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { id, moved: false }; } }} onClick={() => { if (draggedIdRef.current === id) { draggedIdRef.current = ""; return; } openReaderNode(node); }}><span>{node.label}</span><i aria-hidden="true" /></button>; })}
      {layout === "reader" && visiblePositionedElements.length === 0 && readerNodesInChapter.length === 0 && <div className="reader-map-empty"><b>我的探索还没有内容</b><span>先从系统线索选择“用于我的探索”，或在原文中选一句建立自己的紫色线索。</span></div>}
      </div>
    </div>
    {elements.length > 24 && <div className="canvas-density"><span>显示 {Math.min(canvasLimit, elements.length)} / {elements.length} 条证据</span><button onClick={() => setCanvasLimit((limit) => limit >= elements.length ? 24 : Math.min(elements.length, limit + 6))}>{canvasLimit >= elements.length ? "显示较少" : "显示更多"}</button></div>}
    {pickedElements.length > 0 && <div className="evidence-selection-bar"><span>{pickedElements.length === 1 ? `已选“${pickedElements[0].label}”，再选一处进行比较` : `正在比较：${pickedElements.slice(0, 2).map((item) => item.label).join(" ↔ ")}`}</span>{pickedElements.length > 1 && <button onClick={() => { const evidenceIds = [...new Set(pickedElements.flatMap((item) => item.evidenceIds))]; setWholeFocus({ label: pickedElements.slice(0, 2).map((item) => item.label).join(" ↔ "), evidenceIds, carrierIds: [...new Set(pickedElements.flatMap((item) => item.carrierIds))], relationIds: [...new Set(pickedElements.flatMap((item) => item.relationIds))], why: "对照两处原文，观察它们的相似、差异或语境变化；系统不替你判定关系。" }); onPersist((s) => event(s, "meaning_canvas_comparison_open", chapter, "evidence_set", undefined, { evidence_count: evidenceIds.length })); }}>查看对照原文</button>}{pickedElements.length > 1 && <button onClick={() => { const evidenceIds = [...new Set(pickedElements.flatMap((item) => item.evidenceIds))]; onPersist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...evidenceIds])] }, "meaning_canvas_evidence_set_create", chapter, "evidence_set", undefined, { evidence_count: evidenceIds.length })); onBeginInterpretation(evidenceIds, `evidence-set:${chapter}`); }}>形成当前理解</button>}<button onClick={() => { setPickedElementIds([]); setRelationEndpoints([]); setRelationComposerOpen(false); }}>清除</button></div>}
    {relationEndpoints.length > 0 && <div className="relation-selection-bar"><span>{relationEndpoints.length === 1 ? `已选：${relationEndpoints[0].label}` : `${relationEndpoints[0].label}　↔　${relationEndpoints[1].label}`}</span>{relationEndpoints.length === 2 && <button onClick={() => setRelationComposerOpen(true)}>建立我的关联</button>}<button onClick={() => { setRelationEndpoints([]); setRelationComposerOpen(false); }}>清除</button></div>}
    {relationComposerOpen && relationEndpoints.length === 2 && <section className="reader-relation-composer"><b>建立我的关联</b><small>这是你的暂定关系，不会修改系统参考层。</small><p>{relationEndpoints[0].label}　↔　{relationEndpoints[1].label}</p><div><select value={relationType} onChange={(event) => setRelationType(event.target.value)}><option value="co_occurs_with">共同出现</option><option value="contrasts_with">形成对照</option><option value="recurs_with">反复出现</option><option value="changes_context">发生变化</option><option value="other">我的关联</option></select><input value={relationLabel} onChange={(event) => setRelationLabel(event.target.value)} placeholder="用自己的话命名这条关联" /></div><input value={relationExplanation} onChange={(event) => setRelationExplanation(event.target.value)} placeholder="可选：为什么这样连接？" /><div><button className="meaning-primary" disabled={!relationLabel.trim()} onClick={createReaderRelationOnCanvas}>保存紫色关系</button><button onClick={() => setRelationComposerOpen(false)}>稍后再说</button></div></section>}
    <div className="map-controls"><button className="map-toggle" onClick={() => { setShowMap((value) => !value); onPersist((s) => event(s, showMap ? "meaning_map_collapse" : "meaning_map_expand", chapter, "chapter")); }}>{showMap ? "收起探索地图" : "展开细节地图"}</button><button className="map-focus-button" onClick={() => { setMapFocus(true); onPersist((s) => event(s, "meaning_map_focus_open", chapter, "chapter")); }}>放大意义地图</button></div>
    {selected && <article className="meaning-detail">
      <div><p className="eyebrow">原文线索</p><h3>{selected.label}</h3></div>
      <div className="element-meta"><span>{typeLabel(selected.kind)}</span><span>{sourceLayerLabel(selected.sourceLayer)}</span><span>{elements.filter((item) => item.label === selected.label).length} 处出现</span><span>第 {[...new Set(elements.filter((item) => item.label === selected.label).flatMap((item) => item.evidenceIds.map((id) => find(pkg.evidence, id)?.span_ids.map((spanId) => find(pkg.text_spans, spanId)?.chapter_id)).flat().filter(Boolean)))].join("、")} 节</span></div>
      <blockquote className="element-quote">{quote(pkg, selected.evidenceIds[0]).slice(0, 96)}{quote(pkg, selected.evidenceIds[0]).length > 96 ? "…" : ""}</blockquote>
      <details className="why-check-card"><summary>为什么值得检查？</summary><p>{selected.note}</p><small>系统只指出可回查的文本现象；是否形成更深联系由你判断。</small></details>
      <div className="meaning-actions"><button onClick={() => { onEvidence(selected.evidenceIds[0]); onPersist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...selected.evidenceIds])] }, "meaning_space_evidence_open", selected.id, "meaning_anchor")); }}>回到原文</button><button onClick={() => togglePicked(selected)}>{pickedElementIds.includes(selected.id) ? "移出比较" : "选择比较"}</button><button onClick={() => { setWholeFocus({ label: selected.label, evidenceIds: selected.evidenceIds, carrierIds: selected.carrierIds, relationIds: relatedRelations.map((relation) => relation.id), why: "沿着这条线索比较它在全文不同位置的语境；系统不会替你判断其意义。" }); onPersist((s) => event(s, "meaning_space_trajectory_open", selected.id, "meaning_anchor")); }}>追踪全文</button></div>
      {relatedRelations.length > 0 && <details className="system-reference-card"><summary>系统联系（{relatedRelations.length}）</summary><span>展开后检查两个端点和原文依据，再决定是否采用。</span>{relatedRelations.slice(0, 2).map((relation) => { const accepted = session.reference_reviews[relation.id]?.action === "accept"; const challenged = session.judgments[relation.id]?.judgment === "challenge"; return <details className="reference-review-actions" key={relation.id}><summary><strong>{relationEndpointLabel(relation.source_id)} <i>↔</i> {relationEndpointLabel(relation.target_id)}</strong>{(accepted || challenged) && <em className="relation-decision">{accepted ? "已保留" : "已质疑"}</em>}</summary>{relationSignalText(relation) && <small>原文中的修辞比较：{relationSignalText(relation)}</small>}<small>{relationText(relation)}；这只是值得比较的结构依据。</small><div><button onClick={() => { setWholeFocus({ label: `${relationEndpointLabel(relation.source_id)} ↔ ${relationEndpointLabel(relation.target_id)}`, evidenceIds: relation.evidence_ids, carrierIds: [relation.source_id, relation.target_id], relationIds: [relation.id], why: "查看这条系统参考联系的双方原文与出现语境。" }); onPersist((s) => event(s, "meaning_space_reference_inspect", relation.id, "reference_relation")); }}>查看双方原文</button><button className={accepted ? "active" : ""} onClick={() => reviewReference(relation, "accept")}>{accepted ? "已作为参考" : "作为参考"}</button><button className={challenged ? "active" : ""} onClick={() => reviewReference(relation, "challenge")}>{challenged ? "已质疑" : "质疑"}</button><button onClick={() => beginRelationRevision(relation)}>建立我的替代关系</button></div></details>; })}</details>}
      {showMap && nearbyElements.length > 0 && <details className="meaning-connections"><summary>可一起比较的文本（{nearbyElements.length}）</summary>{nearbyElements.map((item) => <button key={item.id} onClick={() => openItem(item)}><span>{item.label}</span><small>位于同一局部文本区域；是否构成联系由你判断。</small></button>)}</details>}
      <div className="reader-adoption-actions"><button className="meaning-primary" onClick={() => toggleReferenceUse(selected)}>{referencedNodeIds.has(selected.id) ? "移出我的探索" : "用于我的探索"}</button><button onClick={() => startRelationFromReference(selected)}>建立我的关联</button><button onClick={() => onBeginInterpretation(selected.evidenceIds, relatedRelations[0]?.id ?? selected.id)}>形成暂时理解</button></div>
      <details className="meaning-provenance"><summary>查看来源说明</summary><p>它来自可逐字回到原文的证据，并由文本语境、修辞现象或可检查关系组织为探索入口。</p><small>这是来源说明，不是文学解释。</small></details>
    </article>}
    {selectedReader && <article className="meaning-detail reader-meaning-detail">
      <div><p className="eyebrow">我的线索</p><h3>{selectedReader.label}</h3></div>
      <div className="element-meta"><span>读者添加</span><span>{readerTypeLabel(selectedReader.interpretation_type ?? selectedReader.type)}</span>{selectedReader.reading_intent === "question" && <span>附带阅读问题</span>}</div>
      {selectedReader.note && <blockquote className="element-quote">{selectedReader.note}</blockquote>}
      <p>它与系统参考圆圈使用同一种原文证据锚点；紫色只表示由你添加，系统参考层不会因此改变。</p>
      <div className="meaning-actions"><button onClick={() => { if (selectedReader.evidence_id) onEvidence(selectedReader.evidence_id); onPersist((s) => event(s, "meaning_space_reader_node_evidence_open", selectedReader.id, "reader_node")); }}>查看原文</button><button onClick={() => { toggleRelationEndpoint({ id: selectedReader.id, label: selectedReader.label, evidenceIds: selectedReader.evidence_ids }); setLayout("compare"); }}>建立关系</button><button className="meaning-primary" onClick={onOpenMyReading}>整理当前理解</button></div>
    </article>}
    {wholeFocus && <WholeTextAssociations pkg={pkg} session={session} focus={wholeFocus} onEvidence={onEvidence} onClose={() => setWholeFocus(null)} onPersist={onPersist} />}
    {session.reader_nodes.length > 0 && <div className="personal-map-strip"><b>我的探索</b><span>{session.reader_nodes.slice(0, 3).map((node) => node.label).join(" · ")}{session.reader_nodes.length > 3 ? ` · 还有 ${session.reader_nodes.length - 3} 个` : ""}</span></div>}
    {mapFocus && <div className="meaning-map-overlay" role="dialog" aria-modal="true" aria-label="意义地图工作台">
      <section className="meaning-map-workspace">
        <header><h2>意义地图</h2><button onClick={() => setMapFocus(false)}>×</button></header>
        <div className="map-workspace-body">
          <MapReadingPreview pkg={pkg} chapter={chapter} evidenceIds={selected?.evidenceIds ?? []} onEvidence={onEvidence} />
          <div className="large-map-canvas">
            <div className="map-layer-legend"><span className="reference">参考线索</span><span className="candidate">探索候选</span><span className="reader">我的解释</span></div>
            <div className="large-cluster"><b>{localContext}</b></div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{items.slice(1).map((item, index) => <line key={item.id} x1={positions[0][0]} y1={positions[0][1]} x2={positions[index + 1][0]} y2={positions[index + 1][1]} />)}</svg>
            {items.map((item, index) => <button key={item.id} className={`large-map-bubble ${item.kind} ${selected?.id === item.id ? "selected" : ""} bubble-${index + 1}`} style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%` } as CSSProperties} onClick={() => openItem(item)}><span>{item.kind === "candidate" ? "值得看看" : "原文细节"}</span>{item.label}</button>)}
            {session.reader_nodes.slice(0, 3).map((node, index) => <button key={node.id} className="large-map-bubble reader-node" style={{ left: `${[82, 73, 87][index]}%`, top: `${[22, 72, 48][index]}%` } as CSSProperties} onClick={() => onEvidence(node.evidence_id)}><span>我的解释</span>{node.label}</button>)}
          </div>
          <aside className="map-inspector">{selected && <><h3>{selected.label}</h3><button onClick={() => onEvidence(selected.evidenceIds[0])}>原文</button><button onClick={() => { setMapFocus(false); setWholeFocus({ label: selected.label, evidenceIds: selected.evidenceIds, carrierIds: selected.carrierIds, relationIds: relatedRelations.map((relation) => relation.id), why: "查看同一细节在全文中的语境轨迹。" }); }}>轨迹</button><button className="map-inspector-primary" onClick={() => { setMapFocus(false); onBeginInterpretation(selected.evidenceIds, relatedRelations[0]?.id ?? selected.id); }}>写下看法</button><details><summary>依据</summary><p>{relatedRelations.length ? relatedRelations.map(relationText).join("；") : "本节语境锚点"}</p></details></>}</aside>
        </div>
      </section>
    </div>}
  </section>;
}

function SkeletonTree({ pkg, chapter, session, activeThread, onThread, onRelation, onEvidence, onPersist, onBeginInterpretation }: { pkg: WorkPackage; chapter: string; session: ReaderSession; activeThread: string; onThread: (id: string) => void; onRelation: (id: string) => void; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void; onBeginInterpretation: (evidenceIds: string[], relationId: string) => void }) {
  // Prefer the node's own reader-facing thread. Falling back to the first
  // relation-containing thread caused a shared edge to open its other end.
  const threadForNode = (nodeId: string) => pkg.threads.find((thread) => thread.carrier_ids.includes(nodeId)) ?? pkg.threads.find((thread) => thread.structural_relation_ids.some((relationId) => { const relation = find(pkg.structural_relations, relationId); return relation?.source_id === nodeId || relation?.target_id === nodeId; }));
  const labelForNode = (nodeId: string) => find(pkg.carriers, nodeId)?.label ?? find(pkg.narrative_entities, nodeId)?.label ?? find(pkg.narrative_events ?? [], nodeId)?.label ?? find(pkg.figurative_features, nodeId)?.surface_form ?? "未解析节点";
  const relationLabel = (type: string) => ({ shares_scene: "同场景", co_occurs_with: "并看", recurs_with: "回返", precedes: "前后位置", contrasts_with: "对照", parallels: "平行" } as Record<string, string>)[type] ?? "关系";
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
  const [wholeFocus, setWholeFocus] = useState<{ label: string; evidenceIds: string[]; carrierIds: string[]; relationIds?: string[]; why: string } | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [explorationOpen, setExplorationOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [connectionNote, setConnectionNote] = useState("");
  const [alternativeConnection, setAlternativeConnection] = useState("");
  const [selectedAnchorId, setSelectedAnchorId] = useState("");
  const [graphMode, setGraphMode] = useState<"inspect" | "connect">("inspect"); const [showReference, setShowReference] = useState(true); const [showReader, setShowReader] = useState(true); const [linkStart, setLinkStart] = useState(""); const [linkEnd, setLinkEnd] = useState(""); const [linkLabel, setLinkLabel] = useState(""); const [linkType, setLinkType] = useState("meaning_relation"); const [linkConfidence, setLinkConfidence] = useState<"tentative" | "developing" | "confident">("tentative"); const [editingNodeId, setEditingNodeId] = useState(""); const [editLabel, setEditLabel] = useState(""); const [editType, setEditType] = useState(""); const [editNote, setEditNote] = useState(""); const [editingRelationId, setEditingRelationId] = useState(""); const [editRelationLabel, setEditRelationLabel] = useState(""); const [editRelationExplanation, setEditRelationExplanation] = useState(""); const [editRelationType, setEditRelationType] = useState("meaning_relation"); const [editRelationConfidence, setEditRelationConfidence] = useState<"tentative" | "developing" | "confident">("tentative"); const [challengeReason, setChallengeReason] = useState("");
  useEffect(() => {
    const chapterPath = readerPaths.findIndex((path) => path.relations.some((relation) => relation.evidence_ids.some((evidenceId) => find(pkg.evidence, evidenceId)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter))));
    if (chapterPath >= 0) setFocusedCluster(chapterPath);
  }, [chapter, pkg.package_id]);
  const clusterIndex = Math.min(focusedCluster, Math.max(0, readerPaths.length - 1));
  const activePath = readerPaths[clusterIndex] ?? { id: "empty", label: "路径", prompt: "", node_ids: [], relations: [] };
  const cluster = activePath.relations;
  const chapterRelationCount = visibleRelations.filter((relation) => relation.evidence_ids.some((evidenceId) => find(pkg.evidence, evidenceId)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapter))).length;
  const chapterScaffold = pkg.chapter_scaffolds?.find((item) => item.chapter_id === chapter);
  const nodeIds = activePath.node_ids;
  const isContextRelation = (type: string) => ["occurs_in", "shared_scene", "shares_scene", "shares_actor", "spoken_by", "directed_to", "participates_in", "co_occurs_with"].includes(type);
  const contextRelations = cluster.filter((relation) => isContextRelation(relation.type));
  const meaningRelations = cluster.filter((relation) => !isContextRelation(relation.type));
  const contextNode = contextRelations.length ? { id: `context-${activePath.id}`, label: activePath.label, x: 50, y: 23 } : undefined;
  const positions = nodeIds.map((id, index) => {
    const presets = contextNode && nodeIds.length === 2 ? [[25, 72], [75, 72]] : contextNode && nodeIds.length === 3 ? [[18, 70], [50, 78], [82, 70]] : nodeIds.length === 2 ? [[22, 50], [78, 50]] : nodeIds.length === 3 ? [[22, 53], [52, 20], [78, 64]] : [[18, 24], [51, 14], [82, 28], [25, 74], [72, 76]];
    const [x, y] = presets[index] ?? [50, 50]; return { id, x, y };
  });
  const readerPositions = session.reader_nodes.map((node, index) => ({ id: node.id, x: [18, 50, 82][index % 3], y: 86 + Math.floor(index / 3) * 9 }));
  const positionFor = (id: string) => [...positions, ...readerPositions].find((position) => position.id === id);
  const visibleReaderRelations = session.reader_relations.filter((relation) => positionFor(relation.source_id) && positionFor(relation.target_id));
  const chooseNode = (id: string, reader = false) => { if (graphMode === "connect") { if (!linkStart || linkEnd) { setLinkStart(id); setLinkEnd(""); } else if (id !== linkStart) setLinkEnd(id); return; } if (reader) { const node = session.reader_nodes.find((item) => item.id === id); if (node) { setEditingNodeId(id); setEditLabel(node.label); setEditType(node.interpretation_type ?? node.type); setEditNote(node.note ?? ""); } } else { setSelectedCarrierId(id); openNode(id); } };
  const renderCarrierLabel = (nodeId: string) => { const label = labelForNode(nodeId); const parts = label.split(/\s*\/\s*/).filter(Boolean); return <>{parts.length > 1 ? <><small>原文片段</small>{parts.map((part) => <span key={part}>{part}</span>)}</> : label}{threadForNode(nodeId) && <em>全文线索</em>}</>; };
  const selectedCarrier = find(pkg.carriers, selectedCarrierId);
  const selectedConnection = find(pkg.structural_relations, selectedConnectionId);
  const selectedAnchor = chapterScaffold?.context_anchors.find((anchor) => anchor.id === selectedAnchorId);
  const relatedConnections = selectedCarrier ? pkg.structural_relations.filter((relation) => relation.source_id === selectedCarrier.id || relation.target_id === selectedCarrier.id) : [];
  const connectionLabel = (relation: WorkPackage["structural_relations"][number], side: "source" | "target") => labelForNode(relation[`${side}_id`]);
  const decideConnection = (action: "accept" | "question" | "ignore") => { if (!selectedConnection) return; const now = new Date().toISOString(); onPersist((s) => { if (action === "accept") return event({ ...s, reference_reviews: { ...s.reference_reviews, [selectedConnection.id]: { action: "accept", reason: connectionNote.trim() || undefined, created_at: now, provenance: "reader-authored" } } }, "relationship_accept", selectedConnection.id, "structural_relation", undefined, { reason: connectionNote }); return event({ ...s, judgments: { ...s.judgments, [selectedConnection.id]: { judgment: action === "question" ? "challenge" : "unsure", reason: connectionNote.trim() || undefined, created_at: now, provenance: "reader-authored" } } }, action === "question" ? "relationship_question" : "relationship_ignore", selectedConnection.id, "structural_relation", undefined, { reason: connectionNote }); }); };
  const modifyConnection = () => { if (!selectedConnection || !alternativeConnection.trim()) return; const now = new Date().toISOString(); const id = `reader-relation-${Date.now()}`; onPersist((s) => event({ ...s, reference_reviews: { ...s.reference_reviews, [selectedConnection.id]: { action: "modify", reason: connectionNote.trim() || undefined, created_at: now, provenance: "reader-authored", reader_relation_id: id } }, reader_relations: [...s.reader_relations, { id, session_id: s.package_id, source_id: selectedConnection.source_id, target_id: selectedConnection.target_id, label: alternativeConnection.trim(), relation_type: "other", explanation: connectionNote.trim() || undefined, confidence: "tentative", evidence_ids: selectedConnection.evidence_ids, based_on_relation_id: selectedConnection.id, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: alternativeConnection.trim(), relation_type: "other", explanation: connectionNote.trim() || undefined, confidence: "tentative" }] }] }, "relationship_modify", selectedConnection.id, "structural_relation", undefined, { reader_relation_id: id, alternative: alternativeConnection.trim() })); setAlternativeConnection(""); };
  const evidenceForNode = (id: string) => session.reader_nodes.find((node) => node.id === id)?.evidence_id ?? find(pkg.carriers, id)?.evidence_ids[0] ?? find(pkg.narrative_entities, id)?.evidence_ids[0] ?? find(pkg.narrative_events ?? [], id)?.evidence_ids[0] ?? find(pkg.figurative_features, id)?.evidence_id;
  const openWholeText = (focus: { label: string; evidenceIds: string[]; carrierIds?: string[]; relationIds?: string[]; why: string }) => { setWholeFocus({ ...focus, carrierIds: focus.carrierIds ?? [] }); onPersist((s) => event(s, "whole_text_association_open", focus.label, "whole_text_scaffold", undefined, { evidence_count: focus.evidenceIds.length, why: focus.why })); };
  const carrierIdsForEvidence = (evidenceIds: string[]) => pkg.carriers.filter((carrier) => carrier.evidence_ids.some((id) => evidenceIds.includes(id))).map((carrier) => carrier.id);
  const openContextAnchor = (anchor: NonNullable<WorkPackage["chapter_scaffolds"]>[number]["context_anchors"][number]) => { setSelectedAnchorId(anchor.id); onEvidence(anchor.evidence_ids[0]); onPersist((s) => event(s, "context_anchor_view", anchor.id, "context_anchor", undefined, anchor)); };
  const openCandidate = (candidate: NonNullable<WorkPackage["chapter_scaffolds"]>[number]["candidate_explorations"][number]) => { onEvidence(candidate.evidence_ids[0]); onPersist((s) => event(s, "candidate_view", candidate.id, "candidate_exploration", undefined, candidate)); };
  const decideCandidate = (candidate: NonNullable<WorkPackage["chapter_scaffolds"]>[number]["candidate_explorations"][number], action: "explore" | "accept" | "reject" | "ignore") => { const now = new Date().toISOString(); const readerNodeId = action === "accept" ? `reader-node-${Date.now()}` : undefined; onPersist((s) => { const decision = { action, created_at: now, provenance: "reader-authored" as const, ...(readerNodeId ? { reader_node_id: readerNodeId } : {}) }; const reader_nodes = readerNodeId ? [...s.reader_nodes, { id: readerNodeId, session_id: s.package_id, label: candidate.label, type: "candidate_exploration", interpretation_type: "interpretive_candidate", source_candidate_id: candidate.id, evidence_id: candidate.evidence_ids[0], evidence_ids: candidate.evidence_ids, note: candidate.prompt, created_at: now, provenance: "reader-authored" as const, history: [{ at: now, action: "create" as const, label: candidate.label, type: "candidate_exploration", note: candidate.prompt }] }] : s.reader_nodes; return event({ ...s, candidate_decisions: { ...s.candidate_decisions, [candidate.id]: decision }, reader_nodes, selected_evidence_ids: action === "explore" || action === "accept" ? [...new Set([...s.selected_evidence_ids, ...candidate.evidence_ids])] : s.selected_evidence_ids }, `candidate_${action}`, candidate.id, "candidate_exploration", s.candidate_decisions[candidate.id], decision); }); onEvidence(candidate.evidence_ids[0]); };
  const createGraphRelation = () => { if (!linkStart || !linkEnd || !linkLabel.trim()) return; const now = new Date().toISOString(); const id = `reader-relation-${Date.now()}`; const evidenceIds = [...new Set([...session.selected_evidence_ids, evidenceForNode(linkStart), evidenceForNode(linkEnd)].filter((value): value is string => Boolean(value)))]; onPersist((s) => event({ ...s, reader_relations: [...s.reader_relations, { id, session_id: s.package_id, source_id: linkStart, target_id: linkEnd, label: linkLabel.trim(), relation_type: linkType, explanation: linkLabel.trim(), confidence: linkConfidence, evidence_ids: evidenceIds, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: linkLabel.trim(), relation_type: linkType, explanation: linkLabel.trim(), confidence: linkConfidence }] }] }, "reader_relation_create_on_graph", id, "reader_relation")); setLinkStart(""); setLinkEnd(""); setLinkLabel(""); setGraphMode("inspect"); };
  const editingNode = session.reader_nodes.find((node) => node.id === editingNodeId); const editingRelation = session.reader_relations.find((relation) => relation.id === editingRelationId);
  return <div className={`skeleton-tree focus-graph ${explorationOpen ? "exploration-open" : "entry-only"} ${showReference ? "" : "hide-reference"} ${showReader ? "" : "hide-reader"}`}>
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
<p className="chapter-graph-status">当前第 {chapter} 节：{meaningRelations.length ? `有 ${meaningRelations.length} 条可检查的结构关系；语境连接单独呈现。` : contextRelations.length ? "当前只确认局部语境连接；尚未形成更强的全文参考关系。你仍可检查证据并建立自己的关系。" : chapterRelationCount ? `自动聚焦 ${chapterRelationCount} 条可检查关系。` : "本节没有直接进入参考层的关系；保留全文路径供你跨章比较。"}</p>
<div className="cluster-switcher" aria-label="切换阅读路径">{readerPaths.map((path, index) => <button key={path.id} className={index === clusterIndex ? "active" : ""} onClick={() => setFocusedCluster(index)} title={path.label} aria-label={`查看：${path.label}`}>{index + 1}</button>)}</div>
<p className="path-prompt">{activePath.prompt}</p>
<button className="whole-path-link" onClick={() => openWholeText({ label: activePath.label, evidenceIds: [...new Set(activePath.relations.flatMap((relation) => relation.evidence_ids))], carrierIds: activePath.node_ids.filter((id) => Boolean(find(pkg.carriers, id))), relationIds: activePath.relations.map((relation) => relation.id), why: "这条全文线索把可回查的分散证据与结构关系组织在一起；它不是主题结论。" })}>查看“{activePath.label}”的全文关联</button>
{chapterScaffold && <section className="chapter-scaffold"><div><b>本节有哪些值得看的细节？</b><small>这是探索入口，不是解释结论。</small></div><p className="entry-guidance">先点一个细节查看原文与出现原因；需要时再展开探索地图或全文线索。</p><div className="context-anchor-list">{chapterScaffold.context_anchors.slice(0, 5).map((anchor) => <span className="anchor-with-whole" key={anchor.id}><button className={`context-anchor ${anchor.type}`} onClick={() => openContextAnchor(anchor)}><span>{({ character: "人物", object: "物件", event: "事件", action: "行动", scene: "场景" } as Record<string, string>)[anchor.type]}</span>{anchor.label}</button><button className="whole-link" onClick={() => openWholeText({ label: anchor.label, evidenceIds: anchor.evidence_ids, carrierIds: carrierIdsForEvidence(anchor.evidence_ids), why: "该语境锚点可与全文中共享证据、物件或结构连接的材料一并检查。" })}>线索</button></span>)}</div>{chapterScaffold.candidate_explorations.length > 0 && <div className="candidate-exploration"><b>可探索候选</b>{chapterScaffold.candidate_explorations.map((candidate) => <article key={candidate.id}><button onClick={() => openCandidate(candidate)}><span>{candidate.uncertainty === "undecidable" ? "尚不确定" : "候选"}</span>{candidate.label}</button><small>出现原因：{candidate.uncertainty === "undecidable" ? "语言信号仍待判断；可回到语境核查。" : "候选信号与叙事位置值得进一步检查。"}</small>{explorationOpen && <><small>{candidate.prompt}</small>{session.candidate_decisions[candidate.id] && <small>你的决定：{({ explore: "已探索", accept: "已作为我的节点", reject: "已拒绝", ignore: "已忽略" } as Record<string, string>)[session.candidate_decisions[candidate.id].action]}</small>}<div><button onClick={() => decideCandidate(candidate, "explore")}>查看证据</button><button onClick={() => openWholeText({ label: candidate.label, evidenceIds: candidate.evidence_ids, carrierIds: carrierIdsForEvidence(candidate.evidence_ids), why: "候选并非结论；这里显示它能追踪到的全文证据与结构基础。" })}>全文线索</button>{explorationOpen && <><button onClick={() => decideCandidate(candidate, "accept")}>作为我的节点</button><button onClick={() => decideCandidate(candidate, "reject")}>拒绝</button><button onClick={() => decideCandidate(candidate, "ignore")}>忽略</button></>}</div></>}</article>)}</div>}<button className="exploration-start" onClick={() => setExplorationOpen((value) => !value)}>{explorationOpen ? "收起探索地图" : "展开探索地图"}</button>{explorationOpen && <p>{chapterScaffold.reader_prompt}</p>}</section>}
{selectedAnchor && <section className="reasoning-path"><p className="eyebrow">从“{selectedAnchor.label}”开始</p><h3>你接下来想做什么？</h3><p>系统提供可检查路径；你决定它是否重要、如何关联，以及最终如何解释。</p><div><button onClick={() => openWholeText({ label: selectedAnchor.label, evidenceIds: selectedAnchor.evidence_ids, carrierIds: carrierIdsForEvidence(selectedAnchor.evidence_ids), why: "追踪这个细节在全文中的语境是否保持或发生变化。" })}>看看它后来有没有变化<small>沿着全文比较它出现的语境</small></button><button onClick={() => { const carrierId = carrierIdsForEvidence(selectedAnchor.evidence_ids)[0]; const relation = pkg.structural_relations.find((item) => carrierId && (item.source_id === carrierId || item.target_id === carrierId)); setExplorationOpen(true); setSelectedCarrierId(carrierId ?? ""); setSelectedConnectionId(relation?.id ?? ""); onPersist((s) => event(s, "reasoning_path_compare", selectedAnchor.id, "context_anchor", undefined, { carrier_id: carrierId, relation_id: relation?.id })); }}>比较其他类似描写<small>判断两个细节是否值得放在一起看</small></button><button onClick={() => { onEvidence(selectedAnchor.evidence_ids[0]); onPersist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...selectedAnchor.evidence_ids])] }, "reasoning_path_evidence", selectedAnchor.id, "context_anchor")); }}>回到原文看看<small>先检查这处描写本身</small></button><button className="reasoning-primary" onClick={() => onBeginInterpretation(selectedAnchor.evidence_ids, selectedAnchor.id)}>把它写进我的解释<small>将这处证据带入我的层</small></button></div></section>}
{wholeFocus && <WholeTextAssociations pkg={pkg} session={session} focus={wholeFocus} onEvidence={onEvidence} onClose={() => setWholeFocus(null)} onPersist={onPersist} />}
<div className="graph-legend">
<button className={showReference ? "layer-active" : ""} onClick={() => setShowReference((value) => !value)}>
<i className="legend-reference" />系统线索</button>
<button className={showReader ? "layer-active" : ""} onClick={() => setShowReader((value) => !value)}>
<i className="legend-reader" />我的解释</button>
<button className={graphMode === "connect" ? "mode-active" : ""} onClick={() => { setGraphMode(graphMode === "connect" ? "inspect" : "connect"); setLinkStart(""); setLinkEnd(""); }}>连线模式</button>
</div>
<div className="network-canvas layered-canvas">{contextNode && contextRelations.map((relation) => { const source = positionFor(relation.source_id); const target = positionFor(relation.target_id); if (!source || !target) return null; return <div className="network-edge context-edge" key={relation.id}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1={contextNode.x} y1={contextNode.y} x2={source.x} y2={source.y} /><line x1={contextNode.x} y1={contextNode.y} x2={target.x} y2={target.y} /></svg>
</div>; })}{meaningRelations.map((relation) => { const source = positionFor(relation.source_id); const target = positionFor(relation.target_id); if (!source || !target) return null; return <div className="network-edge reference-edge structural-edge" key={relation.id}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
<line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
</svg>
<button className="edge-label" style={{ left: `${(source.x + target.x) / 2}%`, top: `${(source.y + target.y) / 2}%` }} title="打开这条关系的证据、比较与质疑工具" onClick={() => onRelation(relation.id)}>
{relationLabel(relation.type)}
</button>
</div>; })}{contextNode && <button className="network-node context-node" style={{ left: `${contextNode.x}%`, top: `${contextNode.y}%` } as CSSProperties} title="这是叙事语境节点，不是系统给出的意义结论" onClick={() => openWholeText({ label: contextNode.label, evidenceIds: activePath.relations.flatMap((relation) => relation.evidence_ids), carrierIds: activePath.node_ids.filter((id) => Boolean(find(pkg.carriers, id))), relationIds: contextRelations.map((relation) => relation.id), why: "该节点只说明这些原文片段处于同一可回查语境；可展开查看全文分布。" })}><small>语境</small>{contextNode.label}</button>}{visibleReaderRelations.map((relation) => { const source = positionFor(relation.source_id)!; const target = positionFor(relation.target_id)!; return <div className="network-edge reader-edge" key={relation.id}>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
<line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
</svg>
<button className="reader-edge-label" style={{ left: `${(source.x + target.x) / 2}%`, top: `${(source.y + target.y) / 2}%` }} onClick={() => { setEditingRelationId(relation.id); setEditRelationLabel(relation.label); setEditRelationExplanation(relation.explanation ?? ""); setEditRelationType(relation.relation_type ?? "meaning_relation"); setEditRelationConfidence(relation.confidence ?? "tentative"); setChallengeReason(""); }}>{relation.label}</button>
</div>; })}{positions.map((position) => <button key={position.id} className={`network-node reference-node ${threadForNode(position.id)?.id === activeThread ? "active" : ""} ${linkStart === position.id || linkEnd === position.id ? "selected-link" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` } as CSSProperties} title={graphMode === "connect" ? "选择关系端点" : `打开“${labelForNode(position.id)}”的证据与工作台`} onClick={() => chooseNode(position.id)}>{renderCarrierLabel(position.id)}</button>)}{session.reader_nodes.map((node) => { const position = positionFor(node.id); if (!position) return null; return <button key={node.id} className={`network-node reader-node ${linkStart === node.id || linkEnd === node.id ? "selected-link" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` } as CSSProperties} title={graphMode === "connect" ? "选择关系端点" : "编辑我的节点"} onClick={() => chooseNode(node.id, true)}>{node.label}</button>; })}</div>{selectedCarrier && <section className="carrier-expansion"><div><b>{selectedCarrier.label}</b><small>局部原文载体</small></div><p>为什么显示：{selectedCarrier.selection_reasons.map((reason) => ({ observability: "可回查原文", figurative_signal: "修辞/语言信号", narrative_salience: "叙事显著性", reader_actionability: "可供读者操作", relational_load: "可连接结构", contrast: "可比较对照", probe_potential: "可进行替换测试" } as Record<string, string>)[reason] ?? reason).join(" · ")}</p><div>{selectedCarrier.evidence_ids.map((id) => <button key={id} onClick={() => onEvidence(id)}>查看当前证据</button>)}<button onClick={() => { setSelectedConnectionId(relatedConnections[0]?.id ?? ""); onPersist((s) => event(s, "relationship_explore", selectedCarrier.id, "carrier", undefined, { relation_count: relatedConnections.length })); }} disabled={!relatedConnections.length}>探索连接（{relatedConnections.length}）</button><button className="thread-entry" onClick={() => openWholeText({ label: selectedCarrier.label, evidenceIds: selectedCarrier.evidence_ids, carrierIds: [selectedCarrier.id], relationIds: relatedConnections.map((relation) => relation.id), why: "这是由原文证据、修辞/叙事信号与可检查结构组织的中性全文线索，不是意义结论。" })}>查看全文线索</button></div></section>}{selectedConnection && <section className="relationship-inspector"><p className="eyebrow">正在检查连接</p><h3>{connectionLabel(selectedConnection, "source")} ↔ {connectionLabel(selectedConnection, "target")}</h3><p>连接基础：{({ shares_scene: "同一可回查场景", co_occurs_with: "同一语境中的并看", recurs_with: "跨位置回返", contrasts_with: "对照", parallels: "平行", precedes: "前后位置" } as Record<string, string>)[selectedConnection.type] ?? "可回查结构"}</p><small>{selectedConnection.reader_metadata?.contestability ?? "系统只呈现值得检查的连接，不替你决定其意义。"}</small><div className="connection-evidence">{selectedConnection.evidence_ids.map((id) => <button key={id} onClick={() => onEvidence(id)}>查看证据：{find(pkg.evidence, id)?.note}</button>)}</div><label>你怎么看这条连接？<input value={connectionNote} onChange={(event) => setConnectionNote(event.target.value)} placeholder="可选：写下保留、质疑或忽略的理由" /></label><div><button onClick={() => decideConnection("accept")}>保留</button><button onClick={() => decideConnection("question")}>质疑</button><button onClick={() => decideConnection("ignore")}>忽略</button><button className="thread-entry" onClick={() => onBeginInterpretation(selectedConnection.evidence_ids, selectedConnection.id)}>基于这条连接创建我的解释</button></div><label>改为我的关系<input value={alternativeConnection} onChange={(event) => setAlternativeConnection(event.target.value)} placeholder="用自己的话说明两者如何关联" /></label><button onClick={modifyConnection} disabled={!alternativeConnection.trim()}>建立我的替代关系</button></section>}{graphMode === "connect" && <div className="graph-editor">
<b>创建我的关系</b>
<small>{linkStart ? `起点：${labelForNode(linkStart) || session.reader_nodes.find((node) => node.id === linkStart)?.label}` : "在图上选择起点"}{linkEnd ? `　终点：${labelForNode(linkEnd) || session.reader_nodes.find((node) => node.id === linkEnd)?.label}` : ""}</small>
<input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="这两个节点之间有什么意义关系？" />
<div>
<select value={linkType} onChange={(event) => setLinkType(event.target.value)}>
<option value="symbolic">象征</option>
<option value="contrast">对照</option>
<option value="causal">因果</option>
<option value="parallel">平行</option>
<option value="thematic">主题关联</option>
<option value="other">其他</option>
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
<option value="symbolic">象征</option>
<option value="contrast">对照</option>
<option value="causal">因果</option>
<option value="parallel">平行</option>
<option value="thematic">主题关联</option>
<option value="other">其他</option>
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
    {tab === "compare" && <Compare pkg={pkg} thread={thread} session={session} relations={relations} evidenceIds={focusEvidenceIds} onEvidence={onEvidence} />}
    {tab === "challenge" && <Challenge pkg={pkg} relations={[...relations, ...interpretations]} session={session} onPersist={onPersist} />}
    {tab === "counter" && <Counter pkg={pkg} thread={thread} activeRelationId={activeRelationId} onEvidence={onEvidence} onPersist={onPersist} />}
    {tab === "probe" && <Probe pkg={pkg} thread={thread} session={session} onEvidence={onEvidence} onPersist={onPersist} />}
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
<h3>词语比较</h3>{mipFeatures.map((feature) => <article className="mip-record" key={feature.id}>
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
</article>)}{relations.map((r) => r.reader_metadata && <article className="reasoning-trigger" key={`${r.id}-trigger`}><b>为什么这条关系出现在参考层</b><ul>{r.reader_metadata.selection_reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><p><span>与阅读有什么关系：</span>{r.reader_metadata.relevance}</p><p><span>仍需你判断：</span>{r.reader_metadata.contestability}</p><small>{r.reader_metadata.reader_trigger}</small></article>)}{interpretations.map((r) => <article className="proposal" key={r.id}>
<span>可质疑的解释提案</span>
<p>{r.relation_text}</p>
<small>{r.qualification}</small>
<button onClick={() => onPersist((s) => ({ ...event(s, "selection_save", r.id, "interpretive_relation"), selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...r.evidence_ids])]}))}>
<Plus size={13} />保存到我的阅读</button>
</article>)}</div>;
}

function Compare({ pkg, thread, session, relations, evidenceIds, onEvidence }: { pkg: WorkPackage; thread: Thread; session: ReaderSession; relations: WorkPackage["structural_relations"]; evidenceIds?: string[]; onEvidence: (id: string) => void }) {
  const available = evidenceIds?.length ? evidenceIds : thread.evidence_ids; const [a, setA] = useState(available[0] ?? ""); const [b, setB] = useState(available[1] ?? available[0] ?? "");
  const reference = relations[0];
  const alternatives = reference ? session.reader_relations.filter((relation) => relation.based_on_relation_id === reference.id || (relation.source_id === reference.source_id && relation.target_id === reference.target_id)) : [];
  return <div className="panel">
<p>比较不是寻找唯一答案，而是让语境中的变化变得可见。</p>
{reference && <article className="relation"><b>参考层的可检查关系</b><p>{reference.rationale}</p><small>{alternatives.length ? `你的层已有 ${alternatives.length} 个并行读法。` : "尚未建立个人替代读法；可在“质疑”中修改。"}</small></article>}
{alternatives.map((relation) => <article className="proposal" key={relation.id}><span>我的层的关系</span><p>{relation.label}</p><small>{relation.explanation || "尚未说明理由"} · {relation.confidence === "confident" ? "较有把握" : relation.confidence === "developing" ? "形成中" : "暂定"}</small></article>)}
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

function Challenge({ pkg, relations, session, onPersist }: { pkg: WorkPackage; relations: Array<WorkPackage["structural_relations"][number] | WorkPackage["interpretive_relations"][number]>; session: ReaderSession; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const [note, setNote] = useState(""); const [alternative, setAlternative] = useState("");
  const structural = relations.filter((relation): relation is WorkPackage["structural_relations"][number] => "rationale" in relation);
  const label = (id: string) => find(pkg.carriers, id)?.label ?? find(pkg.narrative_entities, id)?.label ?? "节点";
  const review = (relationId: string, action: "accept" | "reject", reason?: string) => { const now = new Date().toISOString(); onPersist((s) => event({ ...s, reference_reviews: { ...s.reference_reviews, [relationId]: { action, reason: reason || undefined, created_at: now, provenance: "reader-authored" } } }, `reference_relation_${action}`, relationId, "reference_relation", s.reference_reviews[relationId], { action, reason })); };
  const revise = (relation: WorkPackage["structural_relations"][number]) => { if (!alternative.trim()) return; const now = new Date().toISOString(); const id = `reader-relation-${Date.now()}`; onPersist((s) => event({ ...s, reference_reviews: { ...s.reference_reviews, [relation.id]: { action: "modify", reason: note || undefined, created_at: now, provenance: "reader-authored", reader_relation_id: id } }, reader_relations: [...s.reader_relations, { id, session_id: s.package_id, source_id: relation.source_id, target_id: relation.target_id, label: alternative.trim(), relation_type: "other", explanation: note || undefined, confidence: "tentative", evidence_ids: relation.evidence_ids, based_on_relation_id: relation.id, created_at: now, provenance: "reader-authored", history: [{ at: now, action: "create", label: alternative.trim(), relation_type: "other", explanation: note || undefined, confidence: "tentative" }] }] }, "reference_relation_modify", relation.id, "reference_relation", s.reference_reviews[relation.id], { alternative: alternative.trim(), reason: note })); setAlternative(""); };
  return <div className="panel">
<p>判断记录在你的个人层，不会修改参考骨架。修改会保留参考关系，并另建一条紫色替代关系。</p>{structural.map((r) => <article className="challenge" key={r.id}>
<b>{label(r.source_id)} → {label(r.target_id)}</b><p>{r.rationale}</p>
<div><button className={session.reference_reviews[r.id]?.action === "accept" ? "chosen" : ""} onClick={() => review(r.id, "accept", note)}>保留</button><button className={session.reference_reviews[r.id]?.action === "reject" ? "chosen" : ""} onClick={() => review(r.id, "reject", note)}>拒绝</button></div>
<input value={alternative} onChange={(event) => setAlternative(event.target.value)} placeholder="改为怎样的关系？例如：群体盲从" />
<button onClick={() => revise(r)}>建立我的替代关系</button>
</article>)}<label className="input-label">记录理由（可选）<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：这两处的语境仍需要更多说明" />
</label>
</div>;
}

function Counter({ pkg, thread, activeRelationId, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; activeRelationId: string; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const candidates = pkg.evidence.filter((e) => !thread.evidence_ids.includes(e.id)).slice(0, 5); const [stance, setStance] = useState<"supporting" | "conflicting">("conflicting"); return <div className="panel">
<p>反证不会自动推翻一条关系；它可以使读法复杂化、变弱，或导向另一种解释。</p><div className="compare-selects"><select value={stance} onChange={(event) => setStance(event.target.value as "supporting" | "conflicting")}><option value="conflicting">作为反证/复杂化</option><option value="supporting">作为支持证据</option></select></div>{candidates.map((e) => <article className="counter-card" key={e.id}>
<b>{e.note}</b>
<p>{quote(pkg, e.id)}</p>
<button onClick={() => { const now = new Date().toISOString(); const item = { id: `counter-${Date.now()}`, relation_id: activeRelationId || undefined, evidence_id: e.id, stance, created_at: now, provenance: "reader-authored" as const }; onEvidence(e.id); onPersist((s) => event({ ...s, counterevidence: [...s.counterevidence, item], selected_evidence_ids: [...new Set([...s.selected_evidence_ids, e.id])]}, "counterevidence_attach", e.id, "evidence", undefined, item)); }}>打开并附加为{stance === "conflicting" ? "反证" : "支持"}</button>
</article>)}</div>;
}

function Probe({ pkg, thread, session, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; session: ReaderSession; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const probes = pkg.probes.filter((p) => p.thread_id === thread.id); if (!probes.length) return <div className="panel">
<p>此线索没有适合的诊断测试。系统不会为了互动而强行制造替换游戏。</p>
</div>; return <div className="panel"><p>测试用于检查你的读法能否与同一参考路径中的其他证据共存，而不是寻找唯一答案。</p><h3>同一路径的其他证据</h3>{pkg.evidence.filter((evidence) => !thread.evidence_ids.includes(evidence.id)).slice(0, 3).map((evidence) => <button className="evidence-card" key={evidence.id} onClick={() => onEvidence(evidence.id)}><span>{quote(pkg, evidence.id)}</span><small>{evidence.note}</small></button>)}{probes.map((p) => <article className="probe" key={p.id}>
<span>测试目标：{p.target_relation_ids.join(" · ")}</span>
<p>{p.prompt}</p>
<div>{(["preserved", "weakened", "broken", "emergent", "mixed", "unsure"] as const).map((effect) => <button className={session.probes.find((x) => x.probe_id === p.id)?.effect === effect ? "chosen" : ""} key={effect} onClick={() => onPersist((s) => event({ ...s, probes: [...s.probes.filter((x) => x.probe_id !== p.id), { probe_id: p.id, replacement: p.config?.suggested_replacement, effect, note: "" }] }, "probe_submit", p.id, "probe"))}>{({ preserved: "保留", weakened: "变弱", broken: "断裂", emergent: "新出现", mixed: "混合", unsure: "不确定" } as Record<string, string>)[effect]}</button>)}</div>
</article>)}</div>;
}

function MyReading({ pkg, session, claim, setClaim, onEvidence, onPersist }: { pkg: WorkPackage; session: ReaderSession; claim: string; setClaim: (v: string) => void; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const [changeTrigger, setChangeTrigger] = useState<Exclude<keyof typeof changeTriggerLabels, "initial">>("new_evidence");
  const [changeNote, setChangeNote] = useState("");
  const saved = [...new Set(session.selected_evidence_ids)];
  const readerClaim = session.reader_claims.find((item) => item.id === "reader-claim-current");
  const [draftOpen, setDraftOpen] = useState(Boolean(claim || readerClaim?.text));
  type ReaderClaim = ReaderSession["reader_claims"][number];
  // Compose is entered through an explicit reader action from a detail or a
  // comparison. Those intentionally selected evidence spans become the
  // initial support set; readers can still remove or add support later.
  const freshClaim = (sessionId: string, now: string, text = claim): ReaderClaim => ({ id: "reader-claim-current", session_id: sessionId, text, evidence_ids: [...saved], node_ids: [], relation_ids: [], confidence: "tentative", created_at: now, updated_at: now, provenance: "reader-authored", history: [] });
  const snapshot = (current: ReaderClaim, now: string, overrides: Partial<ReaderClaim> = {}, trigger: keyof typeof changeTriggerLabels = current.history.length ? changeTrigger : "initial") => ({ at: now, text: overrides.text ?? current.text, evidence_ids: overrides.evidence_ids ?? current.evidence_ids, node_ids: overrides.node_ids ?? current.node_ids, relation_ids: overrides.relation_ids ?? current.relation_ids, confidence: overrides.confidence ?? current.confidence, trigger, ...(trigger === "initial" || !changeNote.trim() ? {} : { trigger_note: changeNote.trim() }) });
  const updateClaimLinks = (field: "evidence_ids" | "node_ids" | "relation_ids", id: string) => { const now = new Date().toISOString(); onPersist((s) => { const current = s.reader_claims.find((item) => item.id === "reader-claim-current") ?? freshClaim(s.package_id, now); const ids = current[field].includes(id) ? current[field].filter((item) => item !== id) : [...current[field], id]; const next = { ...current, [field]: ids, text: claim, updated_at: now, history: [...current.history, snapshot(current, now, { [field]: ids, text: claim }, field === "relation_ids" ? "new_relation" : field === "evidence_ids" ? "new_evidence" : changeTrigger)] }; return event({ ...s, reader_claims: [...s.reader_claims.filter((item) => item.id !== current.id), next] }, "reader_claim_link_update", id, field, current, next); }); };
  const saveClaimText = () => { const now = new Date().toISOString(); onPersist((s) => { const current = s.reader_claims.find((item) => item.id === "reader-claim-current") ?? freshClaim(s.package_id, now, ""); const next = { ...current, text: claim, updated_at: now, history: [...current.history, snapshot(current, now, { text: claim })] }; return event({ ...s, claim, reader_claims: [...s.reader_claims.filter((item) => item.id !== current.id), next] }, "reader_claim_update", current.id, "reader_argument", current, next); }); };
  const setClaimConfidence = (confidence: "tentative" | "developing" | "confident") => { const now = new Date().toISOString(); onPersist((s) => { const current = s.reader_claims.find((item) => item.id === "reader-claim-current") ?? freshClaim(s.package_id, now); const next = { ...current, confidence, updated_at: now, history: [...current.history, snapshot(current, now, { confidence })] }; return event({ ...s, reader_claims: [...s.reader_claims.filter((item) => item.id !== current.id), next] }, "reader_argument_confidence", current.id, "reader_argument", current, next); }); };
  const pendingEvidence = saved.filter((id) => !readerClaim?.evidence_ids.includes(id));
  return <section className="my-reading">
    <div className="section-heading"><div><p className="eyebrow">Interpretation Journal</p><h2>我的阅读</h2></div><span>{saved.length ? `${saved.length} 条支撑证据` : "尚未选证据"}</span></div>
    <details className="interpretation-draft" open={draftOpen} onToggle={(event) => setDraftOpen(event.currentTarget.open)}>
      <summary>{readerClaim?.text ? "继续整理当前理解" : "写下当前理解"}</summary>
      <label className="input-label">当前理解<textarea value={claim} onChange={(e) => setClaim(e.target.value)} onBlur={saveClaimText} placeholder="经过这些证据和关系，我目前认为……" /></label>
      {saved.length ? <div className="saved-evidence">{saved.map((id) => <span key={id}><button onClick={() => onEvidence(id)}>{find(pkg.evidence, id)?.note}</button><button aria-label="移除这条证据" className="remove-chip" onClick={() => onPersist((s) => event({ ...s, selected_evidence_ids: s.selected_evidence_ids.filter((item) => item !== id) }, "selection_remove", id, "evidence"))}>×</button></span>)}</div> : <p className="quiet">先检查或引用一处原文证据，再记录当前理解。</p>}
      <details className="interpretation-options"><summary>查看支撑与变化记录</summary>
        <div className="claim-links"><b>当前理解由什么支撑？</b><details><summary>原文证据（{readerClaim?.evidence_ids.length ?? 0}）</summary>{saved.map((id) => <label key={id}><input type="checkbox" checked={readerClaim?.evidence_ids.includes(id) ?? false} onChange={() => updateClaimLinks("evidence_ids", id)} />{find(pkg.evidence, id)?.note}</label>)}</details><details><summary>我的线索（{readerClaim?.node_ids.length ?? 0}）</summary>{session.reader_nodes.map((node) => <label key={node.id}><input type="checkbox" checked={readerClaim?.node_ids.includes(node.id) ?? false} onChange={() => updateClaimLinks("node_ids", node.id)} />{node.label}</label>)}</details><details><summary>我的关系（{readerClaim?.relation_ids.length ?? 0}）</summary>{session.reader_relations.map((relation) => <label key={relation.id}><input type="checkbox" checked={readerClaim?.relation_ids.includes(relation.id) ?? false} onChange={() => updateClaimLinks("relation_ids", relation.id)} />{relation.label}</label>)}</details></div>
        <details className="revision-options"><summary>修订与把握程度</summary><div className="revision-trigger"><b>这次改变由什么触发？</b><select value={changeTrigger} onChange={(e) => setChangeTrigger(e.target.value as Exclude<keyof typeof changeTriggerLabels, "initial">)}>{(Object.keys(changeTriggerLabels).filter((key) => key !== "initial") as Exclude<keyof typeof changeTriggerLabels, "initial">[]).map((key) => <option key={key} value={key}>{changeTriggerLabels[key]}</option>)}</select><input value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="可选：哪条证据或疑问促成改变？" /></div><label className="input-label">目前把握<select value={readerClaim?.confidence ?? "tentative"} onChange={(event) => setClaimConfidence(event.target.value as "tentative" | "developing" | "confident")}><option value="tentative">暂定</option><option value="developing">形成中</option><option value="confident">较有把握</option></select></label></details>
        {readerClaim?.text && pendingEvidence.length > 0 && <aside className="reflection-prompt"><b>有 {pendingEvidence.length} 条新证据尚未进入这条看法。</b><p>它们可能支持、限制或动摇你的看法；系统不会自动修改它。</p><button onClick={() => { onEvidence(pendingEvidence[0]); onPersist((s) => event(s, "argument_reconsider_prompt_open", readerClaim.id, "reader_argument", undefined, { evidence_id: pendingEvidence[0] })); }}>查看并重新检查</button><button onClick={() => onPersist((s) => event(s, "argument_reconsider_prompt_dismiss", readerClaim.id, "reader_argument", undefined, { evidence_ids: pendingEvidence }))}>暂不处理</button></aside>}
      </details>
    </details>
    <details className="interpretation-history"><summary>理解如何变化（{readerClaim?.history.length ?? 0} 次记录）</summary>{readerClaim?.history.length ? readerClaim.history.slice().reverse().map((entry, index, entries) => { const before = entries[index + 1]; const addedEvidence = before ? entry.evidence_ids.filter((id) => !before.evidence_ids.includes(id)).length : entry.evidence_ids.length; return <article key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleString()}</time>{before ? <><small>之前：{before.text || "尚未写下文字解释"}</small><p>现在：{entry.text || "尚未写下文字解释"}</p></> : <p>起点：{entry.text || "尚未写下文字解释"}</p>}<small>触发：{changeTriggerLabels[entry.trigger ?? "initial"]}{entry.trigger_note ? ` · ${entry.trigger_note}` : ""}</small><small>{entry.evidence_ids.length} 条证据{before && addedEvidence ? `（新增 ${addedEvidence} 条）` : ""} · {entry.node_ids.length} 个节点 · {entry.relation_ids.length} 条关系 · {entry.confidence === "confident" ? "较有把握" : entry.confidence === "developing" ? "形成中" : "暂定"}</small></article>; }) : <p>在首次保存或修订后，这里会保留理解变化。</p>}</details>
  </section>;
}

function WholeTextAssociations({ pkg, session, focus, onEvidence, onClose, onPersist }: { pkg: WorkPackage; session: ReaderSession; focus: { label: string; evidenceIds: string[]; carrierIds: string[]; relationIds?: string[]; why: string }; onEvidence: (id: string) => void; onClose: () => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const [trajectoryOpen, setTrajectoryOpen] = useState(false);
  const [inspectedChapter, setInspectedChapter] = useState("");
  const [inspectedRelation, setInspectedRelation] = useState("");
  const directMatches = focus.label.length > 1 ? pkg.evidence.filter((evidence) => quote(pkg, evidence.id).includes(focus.label)).map((evidence) => evidence.id) : [];
  const seedEvidence = [...new Set([...focus.evidenceIds, ...directMatches])];
  const carrierIds = [...new Set([...focus.carrierIds, ...pkg.carriers.filter((carrier) => carrier.evidence_ids.some((id) => seedEvidence.includes(id))).map((carrier) => carrier.id)])];
  const relations = pkg.structural_relations.filter((relation) => focus.relationIds?.includes(relation.id) || carrierIds.includes(relation.source_id) || carrierIds.includes(relation.target_id) || relation.evidence_ids.some((id) => seedEvidence.includes(id)));
  const evidenceIds = [...new Set([...seedEvidence, ...relations.flatMap((relation) => relation.evidence_ids)])];
  const threads = pkg.threads.filter((thread) => thread.carrier_ids.some((id) => carrierIds.includes(id)) || thread.evidence_ids.some((id) => evidenceIds.includes(id)) || thread.structural_relation_ids.some((id) => relations.some((relation) => relation.id === id)));
  const chaptersWithEvidence = chapters(pkg).map((chapterId) => ({ chapterId, ids: evidenceIds.filter((id) => find(pkg.evidence, id)?.span_ids.some((spanId) => find(pkg.text_spans, spanId)?.chapter_id === chapterId)) })).filter((item) => item.ids.length);
  const relationBasis = (type: string) => ({ recurs_with: "跨位置回返", shares_scene: "共享场景", co_occurs_with: "同场景并看", contrasts_with: "对照", parallels: "平行", precedes: "前后位置" } as Record<string, string>)[type] ?? "可回查结构连接";
  const contextFor = (entry: typeof chaptersWithEvidence[number]) => { const anchor = pkg.chapter_scaffolds?.find((scaffold) => scaffold.chapter_id === entry.chapterId)?.context_anchors.find((item) => item.type === "scene" && item.evidence_ids.some((id) => entry.ids.includes(id))); const relationContext = relations.flatMap((relation) => relation.reader_metadata?.narrative_context ?? []).find((item) => item.includes(`第 ${entry.chapterId} 节`)); return anchor?.label ?? relationContext ?? `第 ${entry.chapterId} 节的可回查语境`; };
  const trajectory = chaptersWithEvidence.map((entry, index) => { const context = contextFor(entry); const previous = index ? contextFor(chaptersWithEvidence[index - 1]) : undefined; return { ...entry, context, transition: index === 0 ? "当前／起始位置" : context === previous ? "语境保持" : "语境变化" }; });
  const nodeLabel = (id: string) => find(pkg.carriers, id)?.label ?? find(pkg.narrative_entities, id)?.label ?? "原文细节";
  const involvedContexts = [...new Set(trajectory.map((entry) => entry.context))];
  return <section className="whole-text-associations"><header><div><p className="eyebrow">全文线索</p><h3>{focus.label}</h3></div><button onClick={onClose}>关闭</button></header><p className="quiet">{focus.why}</p><section className="thread-discovery"><b>值得追踪什么？</b><span>全文可回查位置 {evidenceIds.length} 处</span><p>涉及：{involvedContexts.length ? involvedContexts.join(" · ") : "当前可回查的原文位置"}</p><div className="whole-distribution">{chapters(pkg).map((chapterId) => { const item = chaptersWithEvidence.find((entry) => entry.chapterId === chapterId); return <span key={chapterId} className={item ? "has-occurrence" : ""}>第 {chapterId} 节 <i>{item ? "●".repeat(Math.min(4, item.ids.length)) : "○"}</i></span>; })}</div><button className="trajectory-open" onClick={() => { setTrajectoryOpen((value) => !value); onPersist((s) => event(s, trajectoryOpen ? "thread_trajectory_collapse" : "thread_trajectory_open", focus.label, "whole_text_thread")); }}>{trajectoryOpen ? "收起语境轨迹" : "查看语境轨迹"}</button><small>{trajectoryOpen ? "你正在比较这个细节在不同位置的语境。" : "看看这个细节是否在后文发生变化。"}</small></section>{trajectoryOpen && <><section className="context-trajectory"><b>它如何出现在文本中？</b>{trajectory.length ? trajectory.map((entry, index) => <article key={entry.chapterId}><div><strong>{index + 1}. 第 {entry.chapterId} 节</strong><span>{entry.transition}</span></div><p>语境：{entry.context}</p><button onClick={() => { setInspectedChapter(inspectedChapter === entry.chapterId ? "" : entry.chapterId); onPersist((s) => event(s, "thread_occurrence_inspect", entry.chapterId, "chapter", undefined, { focus: focus.label })); }}>{inspectedChapter === entry.chapterId ? "收起证据" : "查看证据"}</button>{inspectedChapter === entry.chapterId && entry.ids.map((id) => <button className="trajectory-evidence" key={id} onClick={() => { onEvidence(id); onPersist((s) => event({ ...s, selected_evidence_ids: [...new Set([...s.selected_evidence_ids, id])] }, "whole_text_evidence_open", id, "evidence", undefined, { focus: focus.label, saved_for_reader: true })); }}>{quote(pkg, id)}<small>保存为个人证据并回到原文</small></button>)}</article>) : <p>当前没有可跨章追踪的精确证据；这并不表示它没有意义，只表示参考 scaffold 尚未把它投影为跨章结构。</p>}</section>{relations.length > 0 && <section className="relationship-landscape"><b>查看关联</b>{relations.map((relation) => <article key={relation.id}><button className="relation-open" onClick={() => { setInspectedRelation(inspectedRelation === relation.id ? "" : relation.id); onPersist((s) => event(s, "thread_relation_inspect", relation.id, "structural_relation")); }}>{nodeLabel(relation.source_id)} 与 {nodeLabel(relation.target_id)}</button>{inspectedRelation === relation.id && <><details><summary>为什么关联？</summary><p>连接基础：{relationBasis(relation.type)}</p><p>{relation.reader_metadata?.relevance ?? relation.rationale}</p><small>{relation.reader_metadata?.contestability ?? "这是可检查的结构信息，不是文学结论。"}</small></details><button onClick={() => relation.evidence_ids[0] && onEvidence(relation.evidence_ids[0])}>查看证据</button><small>可问：这条连接在后文是否发生变化？是否有支持或反驳它的证据？</small></>}</article>)}</section>}</>}{threads.length > 0 && trajectoryOpen && <section className="whole-threads"><b>中性全文线索</b>{threads.map((thread) => <span key={thread.id}>{thread.neutral_label}</span>)}</section>}{session.reader_relations.filter((relation) => relation.evidence_ids.some((id) => evidenceIds.includes(id))).length > 0 && trajectoryOpen && <section className="whole-reader-links"><b>我的跨段连接</b>{session.reader_relations.filter((relation) => relation.evidence_ids.some((id) => evidenceIds.includes(id))).map((relation) => <span key={relation.id}>{relation.label}</span>)}</section>}<small>系统只组织证据、语境与结构基础；你可从不同章节保存证据，再回到原文创建紫色节点、关系和自己的解释。</small></section>;
}

function EvidenceBlock({ pkg, id, onOpen }: { pkg: WorkPackage; id: string; onOpen: (id: string) => void }) { return <article className="evidence-block">
<b>{find(pkg.evidence, id)?.note}</b>
<p>{quote(pkg, id)}</p>
<button onClick={() => onOpen(id)}>回到原文</button>
</article>; }
