import { Plus, Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';

type OptionInput = {
  key: string;
  formula: string;
};

export interface MCQBlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  answerFormula: string;
  options: OptionInput[];
  diagramTemplateRaw: string;
}

interface MCQBlueprintProps {
  defaultChapterId: string;
  onFocusField?: (field: string, index?: number) => void;
}

export interface MCQBlueprintRef {
  getData: () => MCQBlueprintData;
  getFieldRef: (field: string, index?: number) => HTMLElement | null;
}

export const MCQBlueprint = forwardRef<MCQBlueprintRef, MCQBlueprintProps>(
  ({ onFocusField }, ref) => {
    const [templateText, setTemplateText] = useState('Giải phương trình: {{a}}x + {{b}} = 0');
    const [answerFormula, setAnswerFormula] = useState('(-{{b}})/{{a}}');
    const [diagramTemplateRaw, setDiagramTemplateRaw] = useState('');
    const [parameters, setParameters] = useState<ParameterInput[]>([
      { name: 'a', type: 'int', min: '1', max: '10', constraint: '' },
      { name: 'b', type: 'int', min: '-10', max: '10', constraint: '' },
    ]);
    const [options, setOptions] = useState<OptionInput[]>([
      { key: 'A', formula: '$(-{{b}})/{{a}}$' },
      { key: 'B', formula: '${{b}}/{{a}}$' },
      { key: 'C', formula: '$-{{a}}/{{b}}$' },
      { key: 'D', formula: '${{a}}+{{b}}$' },
    ]);

    const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
    const answerFormulaRef = useRef<HTMLInputElement | null>(null);
    const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMinRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMaxRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const optionKeyRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const optionFormulaRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      getData: () => ({
        templateText,
        parameters,
        answerFormula,
        options,
        diagramTemplateRaw,
      }),
      getFieldRef: (field: string, index?: number) => {
        switch (field) {
          case 'templateText':
            return templateTextRef.current;
          case 'answerFormula':
            return answerFormulaRef.current;
          case 'diagramTemplateRaw':
            return diagramTemplateRef.current;
          case 'parameterName':
            return index !== undefined ? parameterNameRefs.current[index] : null;
          case 'parameterMin':
            return index !== undefined ? parameterMinRefs.current[index] : null;
          case 'parameterMax':
            return index !== undefined ? parameterMaxRefs.current[index] : null;
          case 'parameterConstraint':
            return index !== undefined ? parameterConstraintRefs.current[index] : null;
          case 'optionKey':
            return index !== undefined ? optionKeyRefs.current[index] : null;
          case 'optionFormula':
            return index !== undefined ? optionFormulaRefs.current[index] : null;
          default:
            return null;
        }
      },
    }));

    const addOption = () => {
      setOptions([...options, { key: '', formula: '' }]);
    };

    const removeOption = (index: number) => {
      setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: 'key' | 'formula', value: string) => {
      const updated = options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt));
      setOptions(updated);
    };

    return (
      <>
        <label>
          <p className="muted" style={{ marginBottom: 6 }}>
            Nội dung câu hỏi{' '}
            <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
              (Dùng {'{{a}}'}, {'{{b}}'} để chèn biến số. Ví dụ: "Giải: x + {'{{a}}'} = {'{{b}}'}")
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
            onChange={(event) => setTemplateText(event.target.value)}
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
          onChange={setParameters}
          onFocusField={(kind, index) => onFocusField?.(kind, index)}
          mathFieldRefs={{
            nameRefs: parameterNameRefs,
            minRefs: parameterMinRefs,
            maxRefs: parameterMaxRefs,
            constraintRefs: parameterConstraintRefs,
          }}
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
            onChange={(event) => setAnswerFormula(event.target.value)}
          />
          <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Dùng <code>{'{{tên_biến}}'}</code> cho tham số (ví dụ: <code>{'(-{{b}})/{{a}})'}</code>
            ). Biến phải khớp với tên đã khai báo ở trước.
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
              <h3 style={{ color: '#92400e' }}>Phương án trắc nghiệm (tùy chọn)</h3>
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
            onChange={(event) => setDiagramTemplateRaw(event.target.value)}
            placeholder="Vi du: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
          />
        </label>
      </>
    );
  }
);

MCQBlueprint.displayName = 'MCQBlueprint';
