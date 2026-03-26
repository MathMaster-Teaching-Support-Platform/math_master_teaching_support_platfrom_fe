import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
}

/**
 * A component that renders text containing LaTeX formulas delimited by $ for inline math 
 * and $$ for block math.
 */
export const MathText: React.FC<MathTextProps> = ({ text }) => {
  if (!text) return null;

  // Regex to match $...$ or $$...$$
  const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math: $$ ... $$
          const formula = part.slice(2, -2).trim();
          if (!formula) return null;
          return <BlockMath key={i} math={formula} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math: $ ... $
          const formula = part.slice(1, -1).trim();
          if (!formula) return null;
          return <InlineMath key={i} math={formula} />;
        }
        
        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};
