import { Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';

/**
 * The unified parameter shape (Method 1 + Method 2).
 *
 *  - `name`           — placeholder name without braces (e.g. "a").
 *  - `constraintText` — plain-text constraint, e.g. "integer, 1 ≤ a ≤ 9, a is even".
 *                        The generator passes this verbatim to the AI value selector.
 *  - `sampleValue`    — concrete example. Method 1 fills it from the teacher's real
 *                        question; Method 2 lets the teacher type one. Used to seed
 *                        the AI on first generation.
 *
 *  `min` / `max` / `type` are gone. The AI reads natural-language constraints and
 *  programmatic guardrails on the BE catch the obvious off-by-ones.
 */
export type ParameterInput = {
  name: string;
  constraintText: string;
  sampleValue: string;
};

interface ParametersEditorProps {
  parameters: ParameterInput[];
  onChange: (params: ParameterInput[]) => void;
  globalConstraints: string[];
  onGlobalConstraintsChange: (xs: string[]) => void;
  onFocusField?: (kind: string, index: number) => void;
  mathFieldRefs?: {
    nameRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
    constraintRefs: React.MutableRefObject<Record<number, HTMLTextAreaElement | null>>;
    sampleRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  };
}

export function ParametersEditor({
  parameters,
  onChange,
  globalConstraints,
  onGlobalConstraintsChange,
  onFocusField,
  mathFieldRefs,
}: Readonly<ParametersEditorProps>) {
  const defaultNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const defaultConstraintRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const defaultSampleRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const nameRefs = mathFieldRefs?.nameRefs ?? defaultNameRefs;
  const constraintRefs = mathFieldRefs?.constraintRefs ?? defaultConstraintRefs;
  const sampleRefs = mathFieldRefs?.sampleRefs ?? defaultSampleRefs;

  const addParameter = () =>
    onChange([
      ...parameters,
      { name: '', constraintText: 'integer, 1 ≤ x ≤ 10', sampleValue: '' },
    ]);

  const removeParameter = (index: number) =>
    onChange(parameters.filter((_, i) => i !== index));

  const updateParameter = (
    index: number,
    field: keyof ParameterInput,
    value: string
  ) => onChange(parameters.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const updateGlobal = (i: number, value: string) =>
    onGlobalConstraintsChange(globalConstraints.map((g, idx) => (idx === i ? value : g)));

  const addGlobal = () => onGlobalConstraintsChange([...globalConstraints, '']);

  const removeGlobal = (i: number) =>
    onGlobalConstraintsChange(globalConstraints.filter((_, idx) => idx !== i));

  return (
    <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
      <div className="row">
        <div>
          <h3 style={{ color: '#1e40af' }}>Biến số &amp; ràng buộc</h3>
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            Mô tả ràng buộc bằng tiếng Việt hoặc ký hiệu toán. Ví dụ:
            <em> "số nguyên, 1 ≤ a ≤ 9, a chẵn"</em>. AI sẽ chọn giá trị tuân thủ
            khi sinh câu hỏi.
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={addParameter}>
          <Plus size={14} />
          Thêm biến
        </button>
      </div>

      {parameters.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="form-grid"
          style={{
            gridTemplateColumns: '0.6fr 1fr 2fr 40px',
            alignItems: 'start',
          }}
        >
          <input
            ref={(node) => {
              nameRefs.current[index] = node;
            }}
            className="input"
            placeholder="Tên (a, b)"
            value={item.name}
            onFocus={() => onFocusField?.('parameterName', index)}
            onChange={(event) => updateParameter(index, 'name', event.target.value)}
          />
          <input
            ref={(node) => {
              sampleRefs.current[index] = node;
            }}
            className="input"
            placeholder="Giá trị mẫu (vd: 4)"
            value={item.sampleValue}
            onFocus={() => onFocusField?.('parameterSample', index)}
            onChange={(event) => updateParameter(index, 'sampleValue', event.target.value)}
          />
          <textarea
            ref={(node) => {
              constraintRefs.current[index] = node;
            }}
            className="textarea"
            rows={2}
            placeholder="Ràng buộc dạng văn bản (vd: số nguyên, 1 ≤ a ≤ 9, a ≠ 0)"
            value={item.constraintText}
            onFocus={() => onFocusField?.('parameterConstraint', index)}
            onChange={(event) => updateParameter(index, 'constraintText', event.target.value)}
          />
          <button
            type="button"
            className="btn danger"
            style={{
              padding: '0.4rem',
              height: '38px',
              width: '38px',
              display: 'flex',
              justifyContent: 'center',
            }}
            onClick={() => removeParameter(index)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="row" style={{ marginTop: 12 }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e3a8a' }}>Ràng buộc giữa các biến</h4>
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
            Liên kết nhiều biến. Ví dụ: <code>a &lt; b</code>,{' '}
            <code>a + b chia hết cho 3</code>.
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={addGlobal}>
          <Plus size={14} />
          Thêm ràng buộc
        </button>
      </div>

      {globalConstraints.map((g, i) => (
        <div
          key={`gc-${i}`}
          className="form-grid"
          style={{ gridTemplateColumns: '1fr 40px', alignItems: 'center' }}
        >
          <input
            className="input"
            placeholder="vd: a < b"
            value={g}
            onChange={(event) => updateGlobal(i, event.target.value)}
          />
          <button
            type="button"
            className="btn danger"
            style={{
              padding: '0.4rem',
              height: '38px',
              width: '38px',
              display: 'flex',
              justifyContent: 'center',
            }}
            onClick={() => removeGlobal(i)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </section>
  );
}
