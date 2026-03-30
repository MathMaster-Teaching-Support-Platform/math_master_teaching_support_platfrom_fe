import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  block?: boolean;
}

/**
 * Component to render text with LaTeX math formulas
 * Supports inline math: $formula$
 * Supports block math: $$formula$$
 */
export default function MathText({ text, block = false }: MathTextProps) {
  if (!text) return null;

  // If block mode, render as block math
  if (block) {
    const cleanText = text.replace(/^\$\$/, '').replace(/\$\$$/, '');
    return <BlockMath math={cleanText} />;
  }

  // Parse inline math: $...$
  const parts: (string | { type: 'math'; content: string })[] = [];
  const mathRegex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = mathRegex.exec(text)) !== null) {
    // Add text before math
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add math content
    const mathContent = match[1];
    if (mathContent) {
      parts.push({ type: 'math', content: mathContent });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no math found, return plain text
  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  // Render mixed text and math
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else {
          return <InlineMath key={index} math={part.content} />;
        }
      })}
    </>
  );
}
