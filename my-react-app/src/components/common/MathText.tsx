import type { ReactNode } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { prepareBookOcrMathContent } from '../../utils/bookOcrMathNormalize';

interface MathTextProps {
  text: string;
  block?: boolean;
  /** Chuẩn hóa LaTeX thiếu `$…$` từ OCR sách (xem trước verify). */
  bookOcr?: boolean;
}

type TexSeg =
  | { kind: 'plain'; value: string }
  | { kind: 'display'; value: string }
  | { kind: 'inline'; value: string };

function splitSegQueue(
  queue: TexSeg[],
  open: string,
  close: string,
  outKind: 'display' | 'inline'
): TexSeg[] {
  const next: TexSeg[] = [];
  for (const seg of queue) {
    if (seg.kind !== 'plain') {
      next.push(seg);
      continue;
    }
    let rest = seg.value;
    while (rest.length > 0) {
      const oi = rest.indexOf(open);
      if (oi === -1) {
        next.push({ kind: 'plain', value: rest });
        break;
      }
      if (oi > 0) next.push({ kind: 'plain', value: rest.slice(0, oi) });
      const afterOpen = rest.slice(oi + open.length);
      const ci = afterOpen.indexOf(close);
      if (ci === -1) {
        next.push({ kind: 'plain', value: rest });
        break;
      }
      const inner = afterOpen.slice(0, ci).trim();
      next.push({ kind: outKind, value: inner });
      rest = afterOpen.slice(ci + close.length);
    }
  }
  return next;
}

function splitExplicitTexSegments(input: string): TexSeg[] {
  let queue: TexSeg[] = [{ kind: 'plain', value: input }];
  queue = splitSegQueue(queue, '\\[', '\\]', 'display');
  queue = splitSegQueue(queue, '\\(', '\\)', 'inline');
  return queue;
}

type TextPart = string | { type: 'math'; content: string };
type RenderablePart = string | { type: 'image'; alt: string; src: string; title?: string };

function splitMarkdownImageParts(value: string): RenderablePart[] {
  const parts: RenderablePart[] = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = imagePattern.exec(value);

  while (match) {
    const [full, alt, src, title] = match;
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    parts.push({
      type: 'image',
      alt: alt ?? '',
      src: src ?? '',
      title: title || undefined,
    });
    lastIndex = match.index + full.length;
    match = imagePattern.exec(value);
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [value];
}

function renderInlineFormattedText(value: string) {
  // Supported lightweight inline tokens:
  // - **bold**
  // - *italic*
  // - __underline__
  // - ~~strike~~
  // - `code`
  // - [color=#RRGGBB]text[/color]
  const matchers = [
    { kind: 'code' as const, regex: /`([^`]+)`/ },
    { kind: 'color' as const, regex: /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/ },
    { kind: 'bold' as const, regex: /\*\*([^*]+)\*\*/ },
    { kind: 'underline' as const, regex: /__([^_]+)__/ },
    { kind: 'strike' as const, regex: /~~([^~]+)~~/ },
    { kind: 'italic' as const, regex: /\*(?!\*)([^*]+?)\*(?!\*)/ },
  ];

  let remaining = value;
  const nodes: ReactNode[] = [];
  let keySeq = 0;

  while (remaining.length > 0) {
    let best:
      | {
          index: number;
          kind: (typeof matchers)[number]['kind'];
          match: RegExpExecArray;
          matcherIndex: number;
        }
      | undefined;

    for (let mi = 0; mi < matchers.length; mi += 1) {
      const { kind, regex } = matchers[mi];
      const m = regex.exec(remaining);
      if (!m || m.index == null) continue;
      if (!best || m.index < best.index) {
        best = { index: m.index, kind, match: m, matcherIndex: mi };
      }
    }

    if (!best) {
      nodes.push(remaining);
      break;
    }

    if (best.index > 0) nodes.push(remaining.slice(0, best.index));

    const full = best.match[0];
    if (best.kind === 'code') {
      nodes.push(
        <code
          key={`fmt-${keySeq++}`}
          className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 font-mono text-[0.92em]"
        >
          {best.match[1]}
        </code>
      );
    } else if (best.kind === 'color') {
      const color = best.match[1];
      const inner = best.match[2] ?? '';
      nodes.push(
        <span key={`fmt-${keySeq++}`} style={{ color }}>
          {renderInlineFormattedText(inner)}
        </span>
      );
    } else if (best.kind === 'bold') {
      nodes.push(
        <strong key={`fmt-${keySeq++}`}>{renderInlineFormattedText(best.match[1])}</strong>
      );
    } else if (best.kind === 'underline') {
      nodes.push(
        <span key={`fmt-${keySeq++}`} className="underline">
          {renderInlineFormattedText(best.match[1])}
        </span>
      );
    } else if (best.kind === 'strike') {
      nodes.push(
        <span key={`fmt-${keySeq++}`} className="line-through opacity-90">
          {renderInlineFormattedText(best.match[1])}
        </span>
      );
    } else if (best.kind === 'italic') {
      nodes.push(
        <em key={`fmt-${keySeq++}`}>{renderInlineFormattedText(best.match[1])}</em>
      );
    } else {
      nodes.push(full);
    }

    remaining = remaining.slice(best.index + full.length);
  }

  return <>{nodes}</>;
}

function countUnescapedDollar(value: string): number {
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '$' && (i === 0 || value[i - 1] !== '\\')) {
      count += 1;
    }
  }
  return count;
}

function normalizeInlineMathDelimiters(value: string): string {
  // Keep inline-only behavior: convert any $$ into $.
  let normalized = value.replaceAll('$$', '$');
  if (countUnescapedDollar(normalized) % 2 !== 0) {
    normalized += '$';
  }
  return normalized;
}

function sanitizeMathContent(value: string): string {
  return value
    .replaceAll(/(^|[^\\])%/g, String.raw`$1\%`)
    .replaceAll(/(^|[^\\])\$/g, String.raw`$1\$`)
    // Escape underscore only when it likely is not a LaTeX subscript.
    .replaceAll(/(^|[^\\])_(?!\{)(?![A-Za-z0-9])/g, String.raw`$1\_`);
}

function splitInlineMathParts(value: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;
  let current = '';
  let inMath = false;

  while (cursor < value.length) {
    const ch = value[cursor];
    const isUnescapedDollar = ch === '$' && (cursor === 0 || value[cursor - 1] !== '\\');

    if (isUnescapedDollar) {
      if (inMath) {
        parts.push({ type: 'math', content: current });
      } else if (current) {
        parts.push(current);
      }
      current = '';
      inMath = !inMath;
      cursor += 1;
      continue;
    }

    current += ch;
    cursor += 1;
  }

  if (current) {
    if (inMath) {
      parts.push({ type: 'math', content: current });
    } else {
      parts.push(current);
    }
  }

  return parts;
}

function renderPlainWithMathDelimiters(plain: string): ReactNode {
  const normalizedInput = normalizeInlineMathDelimiters(plain);
  const parts = splitInlineMathParts(normalizedInput);

  if (parts.length === 1 && typeof parts[0] === 'string') {
    const renderableParts = splitMarkdownImageParts(parts[0]);
    return (
      <span>
        {renderableParts.map((item, ii) => {
          if (typeof item === 'string') {
            return (
              <span key={`plain-txt-${ii}`}>
                {renderInlineFormattedText(item)}
              </span>
            );
          }
          return (
            <img
              key={`plain-img-${item.src}-${item.alt}-${item.title ?? ''}-${ii}`}
              src={item.src}
              alt={item.alt || 'image'}
              title={item.title ?? item.alt}
              className="inline-block max-w-full max-h-[260px] object-contain rounded align-middle"
            />
          );
        })}
      </span>
    );
  }

  return (
    <>
      {parts.map((part, pi) => {
        const key = typeof part === 'string' ? `text-${pi}-${part.slice(0, 24)}` : `math-${pi}-${part.content.slice(0, 24)}`;
        if (typeof part === 'string') {
          const renderableParts = splitMarkdownImageParts(part);
          return (
            <span key={key}>
              {renderableParts.map((item, ii) => {
                if (typeof item === 'string') {
                  return (
                    <span key={`txt-${ii}`}>
                      {renderInlineFormattedText(item)}
                    </span>
                  );
                }
                return (
                  <img
                    key={`img-${item.src}-${item.alt}-${item.title ?? ''}-${ii}`}
                    src={item.src}
                    alt={item.alt || 'image'}
                    title={item.title ?? item.alt}
                    className="inline-block max-w-full max-h-[260px] object-contain rounded align-middle"
                  />
                );
              })}
            </span>
          );
        }
        const safeMath = sanitizeMathContent(part.content);
        return <InlineMath key={key} math={safeMath} renderError={() => <span>{`$${part.content}$`}</span>} />;
      })}
    </>
  );
}

function renderSingleLineTexAware(line: string): ReactNode {
  const segments = splitExplicitTexSegments(line);
  const onlyPlain = segments.length === 1 && segments[0].kind === 'plain';
  if (onlyPlain) return renderPlainWithMathDelimiters(segments[0].value);

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.kind === 'display') {
          const cleanText = sanitizeMathContent(seg.value);
          return (
            <span
              key={`tex-disp-${idx}`}
              className="block w-full overflow-x-auto my-1"
            >
              <BlockMath math={cleanText} renderError={() => <span>{seg.value}</span>} />
            </span>
          );
        }
        if (seg.kind === 'inline') {
          const cleanText = sanitizeMathContent(seg.value);
          return (
            <InlineMath
              key={`tex-inl-${idx}`}
              math={cleanText}
              renderError={() => <span>{`(${seg.value})`}</span>}
            />
          );
        }
        return <span key={`tex-plain-${idx}`}>{renderPlainWithMathDelimiters(seg.value)}</span>;
      })}
    </>
  );
}

/**
 * Component to render text with LaTeX math formulas
 * Supports inline math: $formula$
 * Supports block math: $$formula$$
 * Supports \\[ display \\] and \\( inline \\) (LaTeX chuẩn).
 *
 * Multi-line text (e.g. solution steps separated by \n) is rendered with each
 * line on its own row so the steps appear as a vertical list, not collapsed
 * onto a single line by HTML whitespace handling.
 */
export default function MathText({
  text,
  block = false,
  bookOcr = false,
}: Readonly<MathTextProps>) {
  if (!text) return null;

  const prepared = bookOcr ? prepareBookOcrMathContent(text) : text;

  // Multi-line: split on newline so each step / paragraph gets its own row.
  if (!block && prepared.includes('\n')) {
    const lines = prepared.split('\n');
    return (
      <span style={{ display: 'inline-block', width: '100%' }}>
        {lines.map((line, idx) => (
          <span
            key={`mt-line-${idx}`}
            style={{ display: 'block', minHeight: '1em' }}
          >
            {line.length > 0 ? (
              <MathText text={line} block={false} bookOcr={false} />
            ) : (
              ' '
            )}
          </span>
        ))}
      </span>
    );
  }

  const normalizedInput = normalizeInlineMathDelimiters(prepared);

  // If block mode, render as block math
  if (block) {
    const withoutLeading = normalizedInput.startsWith('$') ? normalizedInput.slice(1) : normalizedInput;
    const withoutTrailing = withoutLeading.endsWith('$')
      ? withoutLeading.slice(0, -1)
      : withoutLeading;
    const cleanText = sanitizeMathContent(withoutTrailing);
    return (
      <BlockMath math={cleanText} renderError={() => <span>{prepared}</span>} />
    );
  }

  return renderSingleLineTexAware(prepared);
}
