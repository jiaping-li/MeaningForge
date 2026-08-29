import type { ReactNode } from "react";
import type { ReaderSession } from "@/types/workPackage";

interface AnchoredParagraphProps {
  text: string;
  spanId?: string;
  nodes: ReaderSession["reader_nodes"];
  focused: boolean;
  linked: boolean;
  onSelect: () => void;
  onToggleInk: () => void;
  onLink: (spanId: string) => void;
}

export function AnchoredParagraph({ text, spanId, nodes, focused, linked, onSelect, onToggleInk, onLink }: AnchoredParagraphProps) {
  const ranges = nodes.filter((node) => node.source_text_span_id === spanId).map((node) => {
    const fallbackStart = node.source_quote ? text.indexOf(node.source_quote) : -1;
    const start = typeof node.source_start_char === "number" ? node.source_start_char : fallbackStart;
    const end = typeof node.source_end_char === "number" ? node.source_end_char : start + (node.source_quote?.length ?? 0);
    return { node, start: Math.max(0, start), end: Math.min(text.length, end) };
  }).filter((range) => range.start >= 0 && range.end > range.start).sort((a, b) => a.start - b.start);

  const fragments: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range) => {
    if (range.start < cursor) return;
    if (range.start > cursor) fragments.push(text.slice(cursor, range.start));
    fragments.push(<mark key={range.node.id} className={`reader-ink ${range.node.reading_intent === "question" ? "question" : "keep"}`} title={`${range.node.reading_intent === "question" ? "我的疑问" : "我的墨点"}：${range.node.label}`}>{text.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  });
  if (cursor < text.length) fragments.push(text.slice(cursor));

  return <p data-span-id={spanId} className={`${focused ? "focused" : ""} ${linked ? "linked" : ""} ${ranges.length ? "has-reader-ink" : ""}`} onMouseUp={onSelect} onDoubleClick={onToggleInk} onMouseEnter={() => spanId && onLink(spanId)}>{fragments.length ? fragments : text}</p>;
}
