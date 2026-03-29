import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  block?: boolean;
}

/**
 * Component to render text with LaTeX math formulas
 * Supports inline math: $formula$ or \(formula\)
 * Supports block math: $$formula$$ or \[formula\]
 */
export default function MathText({ text, block = false }: MathTextProps) {
  if (!text) return null;

  // If block mode, render as block math
  if (block) {
    // Remove $$ or \[ \] delimiters if present
    const cleanText = text
      .replace(/^\$\$/, '')
      .replace(/\$\$$/, '')
      .replace(/^\\\[/, '')
      .replace(/\\\]$/, '');
    return <BlockMath math={cleanText} />;
  }

  // Parse inline math: $...$ or \(...\)
  const parts: (string | { type: 'math'; content: string })[] = [];
  let currentText = text;
  let lastIndex = 0;

  // Regex to match $...$ or \(...\)
  const mathRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;
  let match;

  while ((match = mathRegex.exec(currentText)) !== null) {
    // Add text before math
    if (match.index > lastIndex) {
      parts.push(currentText.substring(lastIndex, match.index));
    }

    // Add math content
    const mathContent = match[1] || match[2];
    parts.push({ type: 'math', content: mathContent });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < currentText.length) {
    parts.push(currentText.substring(lastIndex));
  }

  // If no math found, return plain text
  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  // Render mixed text and math
  return (
    <span>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else {
          return <InlineMath key={index} math={part.content} />;
        }
      })}
    </span>
  );
}

