import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  block?: boolean;
}

type TextPart = string | { type: 'math'; content: string };

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

/**
 * Component to render text with LaTeX math formulas
 * Supports inline math: $formula$
 * Supports block math: $$formula$$
 */
export default function MathText({ text, block = false }: Readonly<MathTextProps>) {
  if (!text) return null;

  const normalizedInput = normalizeInlineMathDelimiters(text);

  // If block mode, render as block math
  if (block) {
    const cleanText = sanitizeMathContent(normalizedInput.replaceAll(/^\$/, '').replaceAll(/\$$/, ''));
    return <BlockMath math={cleanText} renderError={() => <span>{text}</span>} />;
  }

  const parts = splitInlineMathParts(normalizedInput);

  // If no math found, return plain text
  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <span>{parts[0]}</span>;
  }

  // Render mixed text and math
  return (
    <>
      {parts.map((part) => {
        const key = typeof part === 'string' ? `text-${part}` : `math-${part.content}`;
        if (typeof part === 'string') {
          return <span key={key}>{part}</span>;
        } else {
          const safeMath = sanitizeMathContent(part.content);
          return <InlineMath key={key} math={safeMath} renderError={() => <span>{`$${part.content}$`}</span>} />;
        }
      })}
    </>
  );
}
