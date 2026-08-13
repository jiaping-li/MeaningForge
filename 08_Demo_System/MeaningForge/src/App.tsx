import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download, FileUp, Flag, FlaskConical, GitCompareArrows, HeartHandshake, Lightbulb, LoaderCircle, Plus, ShieldQuestion, X } from "lucide-react";
import { downloadSession, loadDevelopmentPackage, loadSession, preparedWorks, prepareTextDraft, saveSession, sourceWorks, type PreparationDraft } from "@/services/workPackage";
import { emptySession, type Carrier, type ReaderSession, type Thread, type WorkPackage } from "@/types/workPackage";

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

export default function App() {
  const [pkg, setPkg] = useState<WorkPackage | null>(null);
  const [source, setSource] = useState("");
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [chapter, setChapter] = useState("1");
  const [threadId, setThreadId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [tab, setTab] = useState<Tab>("trace");
  const [claim, setClaim] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [loadingSource, setLoadingSource] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [skeletonExpanded, setSkeletonExpanded] = useState(true);
  const [overviewFlash, setOverviewFlash] = useState(false);
  const [readingLayout, setReadingLayout] = useState<"single" | "double">("single");
  const rightPaneRef = useRef<HTMLElement>(null);
  const overviewRef = useRef<HTMLElement>(null);

  const activate = (next: WorkPackage, text = "") => {
    const restored = loadSession(next.package_id, emptySession(next.package_id));
    const sourceChapterIds = sourceSections(text).map((section) => section.id);
    setPkg(next); setSource(text); setSession(restored); setClaim(restored.claim); setChapter(sourceChapterIds[0] ?? chapters(next)[0] ?? "1");
    setThreadId(""); setEvidenceId(""); setTab("trace"); setSkeletonExpanded(true);
  };
  useEffect(() => { loadDevelopmentPackage().then(async (next) => activate(next, next.work.source_uri ? await fetch(next.work.source_uri).then((r) => r.text()) : "")).catch(() => undefined); }, []);
  const persist = (fn: (old: ReaderSession) => ReaderSession) => setSession((old) => { if (!old) return old; const next = fn(old); saveSession(next); return next; });
  const openEvidence = (id: string) => { if (!pkg) return; const span = find(pkg.text_spans, find(pkg.evidence, id)?.span_ids[0] ?? ""); if (span) setChapter(span.chapter_id); setEvidenceId(id); persist((s) => event(s, "evidence_open", id, "evidence")); };
  const currentThread = pkg && find(pkg.threads, threadId);
  const openThread = (id: string) => { setThreadId(id); setTab("trace"); if (pkg) { const t = find(pkg.threads, id); if (t?.evidence_ids[0]) openEvidence(t.evidence_ids[0]); } persist((s) => event(s, "thread_open", id, "thread")); };
  const loadSourceWork = async (work: typeof sourceWorks[number]) => {
    setLoadingSource(work.bookUrl); setSourceError("");
    try { const response = await fetch(work.bookUrl); if (!response.ok) throw new Error("无法读取原文文件。"); const text = await response.text(); activate((await prepareTextDraft(work.title, text)).work_package, text); }
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

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">M</span><div><b>MeaningForge</b><small>从原文证据出发，形成自己的精读</small></div></div><div className="top-actions"><span className="status"><i /> {pkg.package_status === "development" ? "开发材料 · 非研究结论" : "已加载参考骨架"}</span><button onClick={() => downloadSession(session)} title="导出本次阅读记录"><Download size={16} />导出记录</button></div></header>
    <div className="study-note"><ShieldQuestion size={16} /><span>这是一个可质疑的参考初稿，不是标准答案。请始终回到原文，保留不确定性与替代读法。</span></div>
    <div className="workspace">
      <aside className="left-rail">
        <section><p className="eyebrow">已冻结参考骨架</p>{preparedWorks.map((work) => <button className="work-choice" key={work.packageUrl} onClick={() => loadDevelopmentPackage(work.packageUrl).then(async (next) => activate(next, next.work.source_uri ? await fetch(next.work.source_uri).then((r) => r.text()) : ""))}><BookOpen size={16} /><span><b>《{work.title}》</b><small>{work.author} · {work.kind}</small></span></button>)}</section>
        <section><p className="eyebrow">可生成草稿的原文</p>{sourceWorks.map((work) => <button className="work-choice draft-work" key={work.bookUrl} disabled={Boolean(loadingSource)} onClick={() => loadSourceWork(work)}>{loadingSource === work.bookUrl ? <LoaderCircle className="spin" size={16} /> : <BookOpen size={16} />}<span><b>《{work.title}》</b><small>{work.author} · {work.kind} · 草稿</small></span></button>)}{sourceError && <small className="source-error">{sourceError}</small>}</section>
        <section><button className="import-toggle" onClick={() => setShowImport((v) => !v)}><FileUp size={16} />导入全文并生成草稿 <ChevronRight size={14} /></button>{showImport && <ImportCard onReady={(draft) => activate(draft.work_package, draft.source_text)} />}</section>
        <section><p className="eyebrow">当前原文</p><h2>《{pkg.work.title}》</h2><small>{pkg.work.author || "导入文本"}</small><div className="chapter-list">{readerChapterIds.map((id, n) => <button className={chapter === id ? "selected" : ""} onClick={() => { setChapter(id); setEvidenceId(""); }} key={id}>第 {n + 1} 节 <span>{pkg.threads.filter((t) => t.distribution.chapter_ids.includes(id)).length} 条线索</span></button>)}</div></section>
        <section className="method-card"><p className="eyebrow">构建状态</p><b>全文 → UNR → 投影</b><small>{pkg.construction_run?.validation_summary ?? "固定协议、原文锚定与关系核查后形成的参考骨架。"}</small><button onClick={() => alert(JSON.stringify({ package: pkg.package_id, construction: pkg.construction_run ?? "legacy development package", provenance: pkg.provenance }, null, 2))}>查看可追溯元数据</button></section>
      </aside>
      <section className="reading-pane"><header><div><p className="eyebrow">原文优先</p><h1>{pkg.work.title}</h1></div><div className="reading-actions"><button className="layout-toggle" onClick={() => setReadingLayout((layout) => layout === "single" ? "double" : "single")}>{readingLayout === "single" ? "切换双栏" : "切换单栏"}</button><button className="overview-button" onClick={revealOverview}>展开全文骨架 <ChevronRight size={15} /></button></div></header><ReadingNavigator chapter={chapter} chapterIds={readerChapterIds} onChange={(id) => { setChapter(id); setEvidenceId(""); }} /><div className="reading-hint">这是作品的完整章节文本；系统仅在你打开证据后标出对应段落，不会预先替你圈出重点。</div><article className={readingLayout === "double" ? "two-columns" : "one-column"}>{readingParagraphs.length ? readingParagraphs.map((paragraph, index) => <p key={index} className={focusedQuote && paragraph.includes(focusedQuote) ? "focused" : ""}>{paragraph}</p>) : <p>{source || "该材料的全文尚未载入。"}</p>}</article></section>
      <aside className="right-pane" ref={rightPaneRef}>
        <section id="overview" ref={overviewRef} className={`overview ${skeletonExpanded ? "expanded" : "collapsed"} ${overviewFlash ? "spotlight" : ""}`}><div className="section-heading"><div><p className="eyebrow">全文参考骨架</p><h2>从全文到可检查的关系</h2></div><button className="skeleton-toggle" onClick={() => setSkeletonExpanded((value) => !value)}>{skeletonExpanded ? "收起骨架" : `展开骨架（${pkg.threads.length}）`}<ChevronRight size={14} /></button></div>{skeletonExpanded && <><p className="quiet">按“全文 → 线索 → 载体/证据 → 关系提案”逐层展开；点击任一线索进入局部工作台。</p><SkeletonTree pkg={pkg} activeThread={threadId} onThread={openThread} onEvidence={openEvidence} /></>}</section>
        {currentThread ? <ThreadWorkspace pkg={pkg} session={session} thread={currentThread} tab={tab} setTab={setTab} evidenceId={evidenceId} onEvidence={openEvidence} onPersist={persist} onClose={() => setThreadId("")} /> : <section className="empty-thread"><Lightbulb size={20} /><b>从一条线索开始</b><p>你可以从全文分布进入，也可以先读原文再回来检查。</p></section>}
        <MyReading pkg={pkg} session={session} claim={claim} setClaim={setClaim} onEvidence={openEvidence} onPersist={persist} />
      </aside>
    </div>
  </main>;
}

function ImportCard({ onReady }: { onReady: (draft: PreparationDraft) => void }) {
  const [title, setTitle] = useState(""); const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const file = async (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setTitle(f.name.replace(/\.txt$/i, "")); setText(await f.text()); };
  const submit = async () => { if (text.trim().length < 120) return setMessage("请提供至少 120 字的 TXT 文本。"); setBusy(true); try { onReady(await prepareTextDraft(title, text)); } catch (e) { setMessage(e instanceof Error ? e.message : "无法生成草稿。"); } finally { setBusy(false); } };
  return <div className="import-card"><p>系统会建立可追溯的候选草稿；它不是可直接用于实验的材料。</p><input type="file" accept=".txt,text/plain" onChange={file} /><button onClick={submit} disabled={busy}>{busy ? "正在构建…" : "生成可检验草稿"}</button>{message && <small>{message}</small>}</div>;
}

function ReadingNavigator({ chapter, chapterIds, onChange }: { chapter: string; chapterIds: string[]; onChange: (id: string) => void }) {
  const index = Math.max(0, chapterIds.indexOf(chapter));
  return <nav className="reading-navigator" aria-label="章节导航"><button disabled={index === 0} onClick={() => onChange(chapterIds[index - 1])}><ChevronLeft size={15} />上一页</button><label><span>第 {index + 1} / {chapterIds.length} 节</span><input type="range" min="0" max={Math.max(0, chapterIds.length - 1)} value={index} onChange={(event) => onChange(chapterIds[Number(event.target.value)])} /></label><select value={chapter} onChange={(event) => onChange(event.target.value)} aria-label="选择章节">{chapterIds.map((id, n) => <option key={id} value={id}>第 {n + 1} 节</option>)}</select><button disabled={index === chapterIds.length - 1} onClick={() => onChange(chapterIds[index + 1])}>下一页<ChevronRight size={15} /></button></nav>;
}

function SkeletonTree({ pkg, activeThread, onThread, onEvidence }: { pkg: WorkPackage; activeThread: string; onThread: (id: string) => void; onEvidence: (id: string) => void }) {
  return <div className="skeleton-tree"><div className="tree-root"><BookOpen size={15} /><span>《{pkg.work.title}》</span><small>全文</small></div><div className="tree-trunk" />{pkg.threads.map((thread) => {
    const carriers = thread.carrier_ids.map((id) => find(pkg.carriers, id)).filter((item): item is Carrier => Boolean(item));
    const relations = pkg.structural_relations.filter((relation) => thread.structural_relation_ids.includes(relation.id));
    return <article key={thread.id} className={`tree-thread ${activeThread === thread.id ? "active" : ""}`}><button className="tree-thread-node" onClick={() => onThread(thread.id)}><span className="node-dot" /><b>{thread.neutral_label}</b><small>{thread.evidence_ids.length} 条证据 · {relations.length} 条关系</small><ChevronRight size={14} /></button><div className="tree-children"><div className="tree-level"><span className="tree-caption">可见载体</span>{carriers.map((carrier) => <button key={carrier.id} onClick={() => onThread(thread.id)}>{carrier.label}</button>)}</div><div className="tree-level"><span className="tree-caption">原文证据</span>{thread.evidence_ids.slice(0, 3).map((id, index) => <button key={id} onClick={() => onEvidence(id)}>证据 {index + 1}</button>)}{thread.evidence_ids.length > 3 && <small>+{thread.evidence_ids.length - 3}</small>}</div><div className="tree-level relation-level"><span className="tree-caption">可检查关系</span>{relations.map((relation) => <button key={relation.id} onClick={() => onThread(thread.id)}>{relation.type}</button>)}</div></div></article>;
  })}</div>;
}

function ThreadWorkspace({ pkg, session, thread, tab, setTab, evidenceId, onEvidence, onPersist, onClose }: { pkg: WorkPackage; session: ReaderSession; thread: Thread; tab: Tab; setTab: (t: Tab) => void; evidenceId: string; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void; onClose: () => void }) {
  const relations = pkg.structural_relations.filter((r) => thread.structural_relation_ids.includes(r.id));
  const interpretations = pkg.interpretive_relations.filter((r) => thread.interpretive_relation_ids.includes(r.id));
  const tabs: Array<[Tab, string, typeof Flag]> = [["trace", "追踪", ChevronRight], ["compare", "比较", GitCompareArrows], ["challenge", "质疑", ShieldQuestion], ["counter", "反证", HeartHandshake], ["probe", "测试", FlaskConical]];
  return <section className="thread-workspace"><div className="section-heading"><div><p className="eyebrow">局部推理工作台</p><h2>{thread.neutral_label}</h2></div><button className="close" onClick={onClose} title="返回线索概览"><X size={15} /></button></div><div className="tabs">{tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); onPersist((s) => event(s, `${id}_open`, thread.id, "thread")); }}><Icon size={14} />{label}</button>)}</div>
    {tab === "trace" && <Trace pkg={pkg} thread={thread} relations={relations} interpretations={interpretations} activeEvidence={evidenceId} onEvidence={onEvidence} onPersist={onPersist} />}
    {tab === "compare" && <Compare pkg={pkg} thread={thread} onEvidence={onEvidence} />}
    {tab === "challenge" && <Challenge relations={[...relations, ...interpretations]} session={session} onPersist={onPersist} />}
    {tab === "counter" && <Counter pkg={pkg} thread={thread} onEvidence={onEvidence} onPersist={onPersist} />}
    {tab === "probe" && <Probe pkg={pkg} thread={thread} session={session} onPersist={onPersist} />}
  </section>;
}

function Trace({ pkg, thread, relations, interpretations, activeEvidence, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; relations: WorkPackage["structural_relations"]; interpretations: WorkPackage["interpretive_relations"]; activeEvidence: string; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  return <div className="panel"><p>先打开原文证据，再检查系统为何把它们连在一起。高层读法始终标为提案。</p><h3>证据路径</h3>{thread.evidence_ids.map((id, n) => <button key={id} className={`evidence-card ${activeEvidence === id ? "active" : ""}`} onClick={() => onEvidence(id)}><b>{n + 1}</b><span>{quote(pkg, id)}</span><small>{find(pkg.evidence, id)?.note}</small></button>)}<h3>可观察关系</h3>{relations.map((r) => <article className="relation" key={r.id}><b>{r.type}</b><p>{r.rationale}</p><small>依据：{r.evidence_ids.map((id) => find(pkg.evidence, id)?.note).join("；")}</small><Provenance pkg={pkg} id={(r as { provenance_id?: string }).provenance_id} /></article>)}{interpretations.map((r) => <article className="proposal" key={r.id}><span>可质疑的解释提案</span><p>{r.relation_text}</p><small>{r.qualification}</small><Provenance pkg={pkg} id={(r as { provenance_id?: string }).provenance_id} /><button onClick={() => onPersist((s) => ({ ...event(s, "selection_save", r.id, "interpretive_relation"), selected_evidence_ids: [...new Set([...s.selected_evidence_ids, ...r.evidence_ids])]}))}><Plus size={13} />保存到我的阅读</button></article>)}</div>;
}

function Compare({ pkg, thread, onEvidence }: { pkg: WorkPackage; thread: Thread; onEvidence: (id: string) => void }) {
  const [a, setA] = useState(thread.evidence_ids[0] ?? ""); const [b, setB] = useState(thread.evidence_ids[1] ?? thread.evidence_ids[0] ?? "");
  return <div className="panel"><p>比较不是寻找唯一答案，而是让语境中的变化变得可见。</p><div className="compare-selects"><select value={a} onChange={(e) => setA(e.target.value)}>{thread.evidence_ids.map((id) => <option value={id} key={id}>{find(pkg.evidence, id)?.note}</option>)}</select><select value={b} onChange={(e) => setB(e.target.value)}>{thread.evidence_ids.map((id) => <option value={id} key={id}>{find(pkg.evidence, id)?.note}</option>)}</select></div><div className="comparison"><EvidenceBlock pkg={pkg} id={a} onOpen={onEvidence} /><EvidenceBlock pkg={pkg} id={b} onOpen={onEvidence} /></div><div className="question">比较它们的场景、谁在说/做什么、前后果，以及该细节在此处是否承担不同作用。</div></div>;
}

function Challenge({ relations, session, onPersist }: { relations: Array<WorkPackage["structural_relations"][number] | WorkPackage["interpretive_relations"][number]>; session: ReaderSession; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const [note, setNote] = useState(""); return <div className="panel"><p>判断记录在你的个人层，不会修改参考骨架。</p>{relations.map((r) => <article className="challenge" key={r.id}><p>{"relation_text" in r ? r.relation_text : r.rationale}</p><div>{(["keep", "unsure", "reject"] as const).map((j) => <button className={session.judgments[r.id]?.judgment === j ? "chosen" : ""} onClick={() => onPersist((s) => event({ ...s, judgments: { ...s.judgments, [r.id]: { judgment: j, revision: note || undefined } } }, "judgment_create", r.id, "relation"))} key={j}>{j === "keep" ? "保留" : j === "unsure" ? "尚不确定" : "拒绝"}</button>)}</div></article>)}<label className="input-label">为下一项判断写下理由（可选）<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：这两处的语境仍需要更多说明" /></label></div>;
}

function Counter({ pkg, thread, onEvidence, onPersist }: { pkg: WorkPackage; thread: Thread; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const candidates = pkg.evidence.filter((e) => !thread.evidence_ids.includes(e.id)).slice(0, 5); return <div className="panel"><p>反证不会自动推翻一条关系；它可以使读法复杂化、变弱，或导向另一种解释。</p>{candidates.map((e) => <article className="counter-card" key={e.id}><b>{e.note}</b><p>{quote(pkg, e.id)}</p><button onClick={() => { onEvidence(e.id); onPersist((s) => ({ ...event(s, "counterevidence_open", e.id, "evidence"), selected_evidence_ids: [...new Set([...s.selected_evidence_ids, e.id])]})); }}>打开并保存为复杂化证据</button></article>)}</div>;
}

function Probe({ pkg, thread, session, onPersist }: { pkg: WorkPackage; thread: Thread; session: ReaderSession; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const probes = pkg.probes.filter((p) => p.thread_id === thread.id); if (!probes.length) return <div className="panel"><p>此线索没有适合的诊断测试。系统不会为了互动而强行制造替换游戏。</p></div>; return <div className="panel">{probes.map((p) => <article className="probe" key={p.id}><span>测试目标：{p.target_relation_ids.join(" · ")}</span><p>{p.prompt}</p><div>{(["preserved", "weakened", "broken", "emergent", "mixed", "unsure"] as const).map((effect) => <button className={session.probes.find((x) => x.probe_id === p.id)?.effect === effect ? "chosen" : ""} key={effect} onClick={() => onPersist((s) => event({ ...s, probes: [...s.probes.filter((x) => x.probe_id !== p.id), { probe_id: p.id, replacement: p.config?.suggested_replacement, effect, note: "" }] }, "probe_submit", p.id, "probe"))}>{({ preserved: "保留", weakened: "变弱", broken: "断裂", emergent: "新出现", mixed: "混合", unsure: "不确定" } as Record<string, string>)[effect]}</button>)}</div></article>)}</div>;
}

function MyReading({ pkg, session, claim, setClaim, onEvidence, onPersist }: { pkg: WorkPackage; session: ReaderSession; claim: string; setClaim: (v: string) => void; onEvidence: (id: string) => void; onPersist: (fn: (s: ReaderSession) => ReaderSession) => void }) {
  const saved = [...new Set(session.selected_evidence_ids)]; return <section className="my-reading"><div className="section-heading"><div><p className="eyebrow">我的阅读</p><h2>我的论证草稿</h2></div><span>{saved.length} 条证据</span></div>{saved.length ? <div className="saved-evidence">{saved.map((id) => <button key={id} onClick={() => onEvidence(id)}>{find(pkg.evidence, id)?.note}</button>)}</div> : <p className="quiet">在“追踪”或“反证”中保存证据和关系，它们会留在这里。</p>}<textarea value={claim} onChange={(e) => setClaim(e.target.value)} onBlur={() => onPersist((s) => event({ ...s, claim }, "claim_update", "reader-claim", "claim"))} placeholder="用自己的话写下暂时的解释；说明它由哪些证据与关系支撑，也可以保留条件和疑问。" /><small>读者作者性：系统不会替你生成或定稿这段解释。</small></section>;
}

function EvidenceBlock({ pkg, id, onOpen }: { pkg: WorkPackage; id: string; onOpen: (id: string) => void }) { return <article className="evidence-block"><b>{find(pkg.evidence, id)?.note}</b><p>{quote(pkg, id)}</p><button onClick={() => onOpen(id)}>回到原文</button></article>; }
function Provenance({ pkg, id }: { pkg: WorkPackage; id?: string }) { const p = id && find(pkg.provenance ?? [], id); return p ? <small className="provenance">依据：{p.method_basis} · {p.executor_type}</small> : null; }
