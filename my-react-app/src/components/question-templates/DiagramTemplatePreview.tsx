import { useState } from 'react';
import LatexRenderer from '../common/LatexRenderer';
import { renderTemplateWithSamples, type ParameterInput } from '../../utils/templatePreview';

type Props = {
  diagramTemplate: string;
  /** Optional. Omit when the field contains literal LaTeX (no {{var}} placeholders). */
  parameters?: ParameterInput[];
};

function tokensIn(text: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\p{L}\p{N}_]+)\s*\}\}/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) set.add(match[1]);
  return [...set];
}

export function DiagramTemplatePreview({ diagramTemplate, parameters }: Readonly<Props>) {
  const [renderedLatex, setRenderedLatex] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const trimmed = diagramTemplate.trim();
  const params = parameters ?? [];

  const handleRender = () => {
    if (!trimmed) {
      setMissing([]);
      setRenderedLatex(null);
      return;
    }
    const tokens = tokensIn(trimmed);
    const sampleByName = new Map(
      params.map((p) => [p.name.trim(), (p.sampleValue ?? '').trim()] as const),
    );
    const missingNames = tokens.filter((t) => !sampleByName.get(t));
    if (missingNames.length > 0) {
      setMissing(missingNames);
      setRenderedLatex(null);
      return;
    }
    setMissing([]);
    setRenderedLatex(params.length > 0 ? renderTemplateWithSamples(trimmed, params) : trimmed);
  };

  const handleClear = () => {
    setRenderedLatex(null);
    setMissing([]);
  };

  const showClear = renderedLatex !== null || missing.length > 0;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn secondary"
          onClick={handleRender}
          disabled={!trimmed}
        >
          Render thử
        </button>
        {showClear && (
          <button type="button" className="btn secondary" onClick={handleClear}>
            Ẩn xem thử
          </button>
        )}
      </div>

      {missing.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '0.5rem 0.75rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#78350f',
            borderRadius: 6,
            fontSize: '0.85rem',
          }}
        >
          Mã LaTeX còn biến chưa có giá trị:{' '}
          <strong>{missing.map((n) => `{{${n}}}`).join(', ')}</strong>. Hãy điền <em>giá trị mẫu</em>{' '}
          cho biến hoặc thay bằng số cụ thể trước khi render.
        </div>
      )}

      {renderedLatex !== null && (
        <div
          style={{
            marginTop: 8,
            padding: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            background: '#fff',
          }}
        >
          <p className="muted" style={{ marginTop: 0, marginBottom: 6, fontSize: '0.8rem' }}>
            Xem thử Sơ đồ / Hình LaTeX
          </p>
          <LatexRenderer latex={renderedLatex} />
        </div>
      )}
    </div>
  );
}
