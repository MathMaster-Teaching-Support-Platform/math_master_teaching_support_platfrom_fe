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
 * Note: teacher-facing copy uses "Hệ số" (coefficient) instead of the more
 * literal "Biến số" (variable) — the latter caused confusion because it
 * overlapped with the unknown `x` in the math itself.
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
      { name: '', constraintText: 'số nguyên, 1 ≤ x ≤ 10', sampleValue: '' },
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
    <section
      className="data-card"
      style={{
        minHeight: 0,
        border: '1px solid #c7d2fe',
        background: '#f8fafc',
        padding: '1rem 1.1rem',
        borderRadius: 12,
      }}
    >
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              color: '#1e3a8a',
              fontSize: '0.98rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Hệ số &amp; ràng buộc
          </h3>
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4, marginBottom: 0 }}>
            Mô tả miền giá trị bằng tiếng Việt hoặc ký hiệu toán. Ví dụ:{' '}
            <em>"số nguyên, 1 ≤ a ≤ 9, a chẵn"</em>. AI sẽ chọn giá trị tuân thủ
            khi sinh câu hỏi.
          </p>
        </div>
        <button type="button" className="btn secondary btn-sm" onClick={addParameter}>
          <Plus size={13} />
          Thêm hệ số
        </button>
      </div>

      {parameters.length === 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '0.8rem 1rem',
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 8,
            fontSize: '0.82rem',
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          Chưa có hệ số nào. Thêm hệ số đầu tiên để mỗi câu hỏi sinh ra có giá
          trị khác nhau.
        </div>
      )}

      {parameters.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          style={{
            marginTop: 10,
            padding: '0.7rem 0.85rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'grid',
            gridTemplateColumns: '0.55fr 0.85fr 2fr 36px',
            gap: 10,
            alignItems: 'start',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Tên
            </label>
            <input
              ref={(node) => {
                nameRefs.current[index] = node;
              }}
              className="input"
              placeholder="a"
              value={item.name}
              onFocus={() => onFocusField?.('parameterName', index)}
              onChange={(event) => updateParameter(index, 'name', event.target.value)}
              style={{ marginTop: 4, fontFamily: 'monospace', fontWeight: 600 }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Giá trị mẫu
            </label>
            <input
              ref={(node) => {
                sampleRefs.current[index] = node;
              }}
              className="input"
              placeholder="vd: 4"
              value={item.sampleValue}
              onFocus={() => onFocusField?.('parameterSample', index)}
              onChange={(event) => updateParameter(index, 'sampleValue', event.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Ràng buộc
            </label>
            <textarea
              ref={(node) => {
                constraintRefs.current[index] = node;
              }}
              className="textarea"
              rows={2}
              placeholder="vd: số nguyên, 1 ≤ a ≤ 9, a ≠ 0"
              value={item.constraintText}
              onFocus={() => onFocusField?.('parameterConstraint', index)}
              onChange={(event) => updateParameter(index, 'constraintText', event.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <button
            type="button"
            className="btn danger"
            style={{
              marginTop: 22,
              padding: '0.4rem',
              height: '36px',
              width: '36px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={() => removeParameter(index)}
            title="Xóa hệ số"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <div
        className="row"
        style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}
      >
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: 0,
              color: '#1e3a8a',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Ràng buộc giữa các hệ số
          </h4>
          <p className="muted" style={{ fontSize: '0.74rem', marginTop: 2, marginBottom: 0 }}>
            Liên kết nhiều hệ số. Ví dụ <code>a &lt; b</code> hay{' '}
            <code>a + b chia hết cho 3</code>.
          </p>
        </div>
        <button type="button" className="btn secondary btn-sm" onClick={addGlobal}>
          <Plus size={13} />
          Thêm ràng buộc
        </button>
      </div>

      {globalConstraints.length === 0 && (
        <p
          className="muted"
          style={{
            fontSize: '0.78rem',
            margin: '8px 0 0',
            fontStyle: 'italic',
          }}
        >
          Không có ràng buộc giữa các hệ số.
        </p>
      )}

      {globalConstraints.map((g, i) => (
        <div
          key={`gc-${i}`}
          style={{
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: '1fr 36px',
            gap: 8,
            alignItems: 'center',
          }}
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
              height: '36px',
              width: '36px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={() => removeGlobal(i)}
            title="Xóa ràng buộc"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </section>
  );
}
