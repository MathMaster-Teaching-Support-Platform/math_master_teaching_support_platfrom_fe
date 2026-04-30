import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from './ParametersEditor';

export interface MCQBlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  answerFormula: string;
  options: { key: string; formula: string }[];
  diagramTemplateRaw: string;
}

interface MCQBlueprintProps {
  initialData?: Partial<MCQBlueprintData>;
  onFocusField?: (kind: string, index?: number) => void;
  onChange?: (data: MCQBlueprintData) => void;
}

export function MCQBlueprint({
  initialData,
  onFocusField,
  onChange,
}: Readonly<MCQBlueprintProps>) {
  const [templateText, setTemplateText] = useState(
    initialData?.templateText || 'Giải phương trình: {{a}}x + {{b}} = 0'
  );
  const [parameters, setParameters] = useState<ParameterInput[]>(
    initialData?.parameters || [
      { name: 'a', type: 'int', min: '1', max: '10', constraint: '' },
      { name: 'b', type: 'int', min: '-10', max: '10', constraint: '' },
    ]
  );
  const [answerFormula, setAnswerFormula] = useState(
    initialData?.answerFormula || '(-{{b}})/{{a}}'
  );
  const [options, setOptions] = useState(
    initialData?.options || [
      { key: 'A', formula: '$(-{{b}})/{{a}}$' },
      { key: 'B', formula: '${{b}}/{{a}}$' },
      { key: 'C', formula: '$-{{a}}/{{b}}$' },
      { key: 'D', formula: '${{a}}+{{b}}$' },
    ]
  );
  const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
    initialData?.diagramTemplateRaw || ''
  );

  const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
  const answerFormulaRef = useRef<HTMLInputElement | null>(null);
  const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
  const optionKeyRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const optionFormulaRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Notify parent of changes
  const notifyChange = (updates: Partial<MCQBlueprintData>) => {
    onChange?.({
      templateText,
      parameters,
      answerFormula,
      options,
      diagramTemplateRaw,
      ...updates,
    });
  };

  const updateTemplateText = (value: string) => {
    setTemplateText(value);
    notifyChange({ templateText: value });
  };

  const updateParameters = (params: ParameterInput[]) => {
    setParameters(params);
    notifyChange({ parameters: params });
  };

  const updateAnswerFormula = (value: string) => {
    setAnswerFormula(value);
    notifyChange({ answerFormula: value });
  };

  const updateDiagram = (value: string) => {
    setDiagramTemplateRaw(value);
    notifyChange({ diagramTemplateRaw: value });
  };

  const addOption = () => {
    const updated = [...options, { key: '', formula: '' }];
    setOptions(updated);
    notifyChange({ options: updated });
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    notifyChange({ options: updated });
  };

  const updateOption = (index: number, field: 'key' | 'formula', value: string) => {
    const updated = options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt));
    setOptions(updated);
    notifyChange({ options: updated });
  };

  // Expose data via ref for parent to access
  const getData = (): MCQBlueprintData => ({
    templateText,
    parameters,
    answerFormula,
    options,
    diagramTemplateRaw,
  });

  // Attach getData to component instance (for parent access)
  if (typeof window !== 'undefined') {
    (MCQBlueprint as any).getData = getData;
  }

  return (
    <>
      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Nội dung câu hỏi{' '}
          <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
            (Dùng {'{{a}}'}, {'{{b}}'} để chèn biến số)
          </span>
        </p>
        <textarea
          ref={templateTextRef}
          className="textarea"
          rows={3}
          required
          placeholder="Ví dụ: Tính giá trị của biểu thức {{a}} + {{b}}?"
          value={templateText}
          onFocus={() => onFocusField?.('templateText')}
          onChange={(event) => updateTemplateText(event.target.value)}
        />
        <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
          Dùng {'{{a}}'} để tạo biến động. Bôi đen nội dung cần công thức rồi bấm Insert Math.
        </p>
        {templateText && (
          <div className="preview-box">
            <MathText text={templateText} />
          </div>
        )}
      </label>

      <ParametersEditor
        parameters={parameters}
        onChange={updateParameters}
        onFocusField={onFocusField}
      />

      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Công thức tính đáp án đúng
        </p>
        <input
          ref={answerFormulaRef}
          className="input"
          placeholder="Ví dụ: (-{{b}})/{{a}}) — dùng {{tên_biến}} cho tham số"
          value={answerFormula}
          onFocus={() => onFocusField?.('answerFormula')}
          onChange={(event) => updateAnswerFormula(event.target.value)}
        />
        <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
          Dùng <code>{'{{tên_biến}}'}</code> cho tham số. Biến phải khớp với tên đã khai báo.
        </p>
        {answerFormula && (
          <div className="preview-box">
            <MathText text={answerFormula} />
          </div>
        )}
      </label>

      <section className="data-card" style={{ minHeight: 0, border: '1px solid #fef3c7' }}>
        <div className="row">
          <div>
            <h3 style={{ color: '#92400e' }}>Phương án trắc nghiệm</h3>
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Viết công thức để máy tính tự tính ra kết quả cho các lựa chọn A, B, C, D.
            </p>
          </div>
          <button type="button" className="btn secondary" onClick={addOption}>
            <Plus size={14} />
            Thêm lựa chọn
          </button>
        </div>

        {options.map((item, index) => (
          <div key={`${item.key}-${index}`} className="form-grid">
            <input
              ref={(node) => {
                optionKeyRefs.current[index] = node;
              }}
              className="input"
              placeholder="Mã (A, B...)"
              value={item.key}
              onFocus={() => onFocusField?.('optionKey', index)}
              onChange={(event) => updateOption(index, 'key', event.target.value)}
            />
            <div className="row" style={{ gridColumn: 'span 3' }}>
              <div style={{ width: '100%' }}>
                <input
                  ref={(node) => {
                    optionFormulaRefs.current[index] = node;
                  }}
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Công thức"
                  value={item.formula}
                  onFocus={() => onFocusField?.('optionFormula', index)}
                  onChange={(event) => updateOption(index, 'formula', event.target.value)}
                />
                {item.formula && (
                  <div className="preview-box">
                    <MathText text={item.formula} />
                  </div>
                )}
              </div>
              <button type="button" className="btn danger" onClick={() => removeOption(index)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Sơ đồ / Hình vẽ đính kèm (LaTeX, tùy chọn)
        </p>
        <textarea
          ref={diagramTemplateRef}
          className="textarea"
          rows={4}
          value={diagramTemplateRaw}
          onFocus={() => onFocusField?.('diagramTemplateRaw')}
          onChange={(event) => updateDiagram(event.target.value)}
          placeholder="Ví dụ: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
        />
      </label>
    </>
  );
}
