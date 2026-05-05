import { useState } from 'react';

interface LatexToolbarProps {
  onInsert: (latex: string) => void;
  disabled?: boolean;
}

interface LatexSymbol {
  label: string;
  latex: string;
  category: string;
}

const latexSymbols: LatexSymbol[] = [
  // Fractions & Roots
  { label: 'Phân số', latex: '\\frac{a}{b}', category: 'Cơ bản' },
  { label: 'Căn bậc 2', latex: '\\sqrt{x}', category: 'Cơ bản' },
  { label: 'Căn bậc n', latex: '\\sqrt[n]{x}', category: 'Cơ bản' },

  // Superscript & Subscript
  { label: 'Mũ', latex: 'x^{2}', category: 'Cơ bản' },
  { label: 'Chỉ số dưới', latex: 'x_{i}', category: 'Cơ bản' },

  // Greek Letters
  { label: 'α (alpha)', latex: '\\alpha', category: 'Chữ Hy Lạp' },
  { label: 'β (beta)', latex: '\\beta', category: 'Chữ Hy Lạp' },
  { label: 'γ (gamma)', latex: '\\gamma', category: 'Chữ Hy Lạp' },
  { label: 'Δ (delta)', latex: '\\Delta', category: 'Chữ Hy Lạp' },
  { label: 'θ (theta)', latex: '\\theta', category: 'Chữ Hy Lạp' },
  { label: 'λ (lambda)', latex: '\\lambda', category: 'Chữ Hy Lạp' },
  { label: 'π (pi)', latex: '\\pi', category: 'Chữ Hy Lạp' },
  { label: 'Σ (sigma)', latex: '\\Sigma', category: 'Chữ Hy Lạp' },
  { label: 'ω (omega)', latex: '\\omega', category: 'Chữ Hy Lạp' },

  // Operators
  { label: '±', latex: '\\pm', category: 'Toán tử' },
  { label: '∓', latex: '\\mp', category: 'Toán tử' },
  { label: '×', latex: '\\times', category: 'Toán tử' },
  { label: '÷', latex: '\\div', category: 'Toán tử' },
  { label: '≠', latex: '\\neq', category: 'Toán tử' },
  { label: '≤', latex: '\\leq', category: 'Toán tử' },
  { label: '≥', latex: '\\geq', category: 'Toán tử' },
  { label: '≈', latex: '\\approx', category: 'Toán tử' },
  { label: '∞', latex: '\\infty', category: 'Toán tử' },

  // Calculus
  { label: 'Tích phân', latex: '\\int_{a}^{b}', category: 'Giải tích' },
  { label: 'Tổng', latex: '\\sum_{i=1}^{n}', category: 'Giải tích' },
  { label: 'Tích', latex: '\\prod_{i=1}^{n}', category: 'Giải tích' },
  { label: 'Giới hạn', latex: '\\lim_{x \\to a}', category: 'Giải tích' },
  { label: 'Đạo hàm', latex: '\\frac{d}{dx}', category: 'Giải tích' },
  { label: 'Đạo hàm riêng', latex: '\\frac{\\partial}{\\partial x}', category: 'Giải tích' },

  // Trigonometry
  { label: 'sin', latex: '\\sin', category: 'Lượng giác' },
  { label: 'cos', latex: '\\cos', category: 'Lượng giác' },
  { label: 'tan', latex: '\\tan', category: 'Lượng giác' },
  { label: 'cot', latex: '\\cot', category: 'Lượng giác' },
  { label: 'arcsin', latex: '\\arcsin', category: 'Lượng giác' },
  { label: 'arccos', latex: '\\arccos', category: 'Lượng giác' },

  // Sets & Logic
  { label: '∈', latex: '\\in', category: 'Tập hợp' },
  { label: '∉', latex: '\\notin', category: 'Tập hợp' },
  { label: '⊂', latex: '\\subset', category: 'Tập hợp' },
  { label: '⊆', latex: '\\subseteq', category: 'Tập hợp' },
  { label: '∪', latex: '\\cup', category: 'Tập hợp' },
  { label: '∩', latex: '\\cap', category: 'Tập hợp' },
  { label: '∅', latex: '\\emptyset', category: 'Tập hợp' },
  { label: '∀', latex: '\\forall', category: 'Tập hợp' },
  { label: '∃', latex: '\\exists', category: 'Tập hợp' },

  // Arrows
  { label: '→', latex: '\\rightarrow', category: 'Mũi tên' },
  { label: '←', latex: '\\leftarrow', category: 'Mũi tên' },
  { label: '↔', latex: '\\leftrightarrow', category: 'Mũi tên' },
  { label: '⇒', latex: '\\Rightarrow', category: 'Mũi tên' },
  { label: '⇐', latex: '\\Leftarrow', category: 'Mũi tên' },
  { label: '⇔', latex: '\\Leftrightarrow', category: 'Mũi tên' },

  // Brackets
  { label: '( )', latex: '\\left( \\right)', category: 'Ngoặc' },
  { label: '[ ]', latex: '\\left[ \\right]', category: 'Ngoặc' },
  { label: '{ }', latex: '\\left\\{ \\right\\}', category: 'Ngoặc' },
  { label: '| |', latex: '\\left| \\right|', category: 'Ngoặc' },

  // Matrices
  {
    label: 'Ma trận 2×2',
    latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    category: 'Ma trận',
  },
  {
    label: 'Ma trận 3×3',
    latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}',
    category: 'Ma trận',
  },
  {
    label: 'Định thức',
    latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
    category: 'Ma trận',
  },
];

export function LatexToolbar({ onInsert, disabled = false }: Readonly<LatexToolbarProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Cơ bản');

  const categories = Array.from(new Set(latexSymbols.map((s) => s.category)));
  const filteredSymbols = latexSymbols.filter((s) => s.category === selectedCategory);

  const handleInsert = (latex: string) => {
    onInsert(latex);
    // Don't close the toolbar so users can insert multiple symbols
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="btn secondary"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        style={{
          fontSize: '0.875rem',
          padding: '6px 12px',
        }}
      >
        Hỗ trợ LaTeX
      </button>
    );
  }

  return (
    <div
      style={{
        border: '2px solid #e5e7eb',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9fafb',
        marginTop: 6,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>Hỗ trợ LaTeX</p>
        <button
          type="button"
          className="btn secondary"
          onClick={() => setIsOpen(false)}
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
        >
          Đóng
        </button>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 12,
          flexWrap: 'wrap',
          alignItems: 'stretch',
        }}
      >
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              minHeight: 30,
              border: '1px solid',
              borderColor: selectedCategory === category ? '#3b82f6' : '#d1d5db',
              borderRadius: 6,
              backgroundColor: selectedCategory === category ? '#eff6ff' : 'white',
              color: selectedCategory === category ? '#1e40af' : '#6b7280',
              fontWeight: selectedCategory === category ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Symbol Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 6,
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {filteredSymbols.map((symbol, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleInsert(symbol.latex)}
            disabled={disabled}
            style={{
              padding: '8px',
              fontSize: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: 'white',
              color: '#374151',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 3,
              minHeight: 56,
            }}
            onMouseOver={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <span style={{ fontWeight: 600 }}>{symbol.label}</span>
            <code
              style={{
                fontSize: '0.7rem',
                color: '#6b7280',
                fontFamily: 'monospace',
                lineHeight: 1.2,
              }}
            >
              {symbol.latex}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}
