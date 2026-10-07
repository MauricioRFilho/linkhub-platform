/**
 * Minimal, safe Markdown subset for "text" blocks.
 *
 * Why: creators need light formatting (bold, italic, links, lists) but raw HTML
 * would open XSS on public pages. We parse into a tiny AST rendered as React
 * elements — no `dangerouslySetInnerHTML` anywhere.
 */
import { isSafeProfileLink } from "../utils/public-url.ts";

export type Inline =
  | { kind: "text"; value: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "link"; href: string; children: Inline[] };

export type MdBlock =
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; items: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    const match = INLINE.exec(rest);
    if (!match) { out.push({ kind: "text", value: rest }); break; }
    if (match.index > 0) out.push({ kind: "text", value: rest.slice(0, match.index) });
    if (match[1] !== undefined) out.push({ kind: "bold", children: parseInline(match[1]) });
    else if (match[2] !== undefined) out.push({ kind: "italic", children: parseInline(match[2]) });
    else if (isSafeProfileLink(match[4], true)) out.push({ kind: "link", href: match[4], children: parseInline(match[3]) });
    else out.push({ kind: "text", value: match[3] });
    rest = rest.slice(match.index + match[0].length);
  }
  return out;
}

export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  for (const chunk of source.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({ kind: "list", items: lines.map((line) => parseInline(line.replace(/^[-*]\s+/, ""))) });
    } else {
      blocks.push({ kind: "paragraph", children: parseInline(lines.join(" ")) });
    }
  }
  return blocks;
}
