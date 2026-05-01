import { Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';

export type ParameterInput = {
  name: string;
  type: string;
  min: string;
  max: string;
  constraint: string;
};

interface ParametersEditorProps {
  parameters: ParameterInput[];
  onChange: (params: ParameterInput[]) => void;
  onFocusField?: (kind: string, index: number) => void;
}

export function ParametersEditor({
  parameters,
  onChange,
  onFocusField,
}: Readonly<ParametersEditorProps>) {
  const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterMinRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterMaxRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterConstraintRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const addParameter = () => {
    onChange([...parameters, { name: '', type: 'int', min: '1', max: '10', constraint: '' }]);
  };

  const removeParameter = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof ParameterInput, value: string) => {
    const updated = parameters.map((param, i) =>
      i === index ? { ...param, [field]: value } : param
    );
    onChange(updated);
  };

  return (
    <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
      <div className="row">
        <div>
          <h3 style={{ color: '#1e40af' }}>Biến số ngẫu nhiên</h3>
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            Khai báo các chữ cái sẽ được thay bằng số ngẫu nhiên trong từng câu hỏi.
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
            gridTemplateColumns: '1fr 0.8fr 1fr 1fr 1.6fr 40px',
            alignItems: 'center',
          }}
        >
          <input
            ref={(node) => {
              parameterNameRefs.current[index] = node;
            }}
            className="input"
            placeholder="Tên (a, b...)"
            value={item.name}
            onFocus={() => onFocusField?.('parameterName', index)}
            onChange={(event) => updateParameter(index, 'name', event.target.value)}
          />
          <select
            className="select"
            value={item.type}
            onChange={(event) => updateParameter(index, 'type', event.target.value)}
          >
            <option value="int">Số nguyên</option>
            <option value="float">Số thập phân</option>
          </select>
          <div className="row">
            <span className="muted">Từ:</span>
            <input
              ref={(node) => {
                parameterMinRefs.current[index] = node;
              }}
              className="input"
              type="number"
              value={item.min}
              onFocus={() => onFocusField?.('parameterMin', index)}
              onChange={(event) => updateParameter(index, 'min', event.target.value)}
            />
          </div>
          <div className="row">
            <span className="muted">Đến:</span>
            <input
              ref={(node) => {
                parameterMaxRefs.current[index] = node;
              }}
              className="input"
              type="number"
              value={item.max}
              onFocus={() => onFocusField?.('parameterMax', index)}
              onChange={(event) => updateParameter(index, 'max', event.target.value)}
            />
          </div>
          <input
            ref={(node) => {
              parameterConstraintRefs.current[index] = node;
            }}
            className="input"
            placeholder="Constraint (vd: a != 0)"
            value={item.constraint}
            onFocus={() => onFocusField?.('parameterConstraint', index)}
            onChange={(event) => updateParameter(index, 'constraint', event.target.value)}
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
    </section>
  );
}
