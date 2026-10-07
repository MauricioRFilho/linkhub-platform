import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Inline } from "@/lib/blocks/markdown";

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.kind) {
      case "text": return <Fragment key={i}>{node.value}</Fragment>;
      case "bold": return <strong key={i} className="font-semibold text-text">{renderInline(node.children)}</strong>;
      case "italic": return <em key={i}>{renderInline(node.children)}</em>;
      case "link": return <a key={i} href={node.href} target="_blank" rel="noopener noreferrer nofollow" className="text-accent underline underline-offset-2">{renderInline(node.children)}</a>;
    }
  });
}

/** Rich text block rendered from a safe Markdown AST (no raw HTML). */
export default function TextBlock({ title, markdown }: { title: string; markdown: string }) {
  return (
    <article className="w-full rounded-2xl border border-border bg-bg-card px-5 py-4 text-sm leading-relaxed text-text-muted">
      <h3 className="mb-2 text-sm font-semibold text-text">{title}</h3>
      <div className="space-y-2">
        {parseMarkdown(markdown).map((block, i) => block.kind === "list"
          ? <ul key={i} className="list-disc space-y-1 pl-5">{block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</ul>
          : <p key={i}>{renderInline(block.children)}</p>)}
      </div>
    </article>
  );
}
