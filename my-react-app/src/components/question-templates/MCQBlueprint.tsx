import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { renderTemplateWithSamples } from '../../utils/templatePreview';
import { AIParameterPanel } from './AIParameterPanel';

type OptionInput = {
  key: string;
  formula: string;
  isCorrect: boolean;
};

export interface MCQBlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  globalConstraints: string[];
  answerFormula: string;
  options: OptionInput[];
  diagramTemplateRaw: string;
  solutionStepsTemplate: string;
}

interface MCQBlueprintProps {
  defaultChapterId: string;
  templateId?: string;
  step?: 1 | 2 | 3 | 4;
  onFocusField?: (field: string, index?: number) => void;
  initialData?: {
    templateText?: string;
    parameters?: ParameterInput[];
    globalConstraints?: string[];
    answerFormula?: string;
    options?: { key: string; formula: string }[];
    diagramTemplateRaw?: string;
    solutionStepsTemplate?: string;
  };
}

export interface MCQBlueprintRef {
  getData: () => MCQBlueprintData;
  getFieldRef: (field: string, index?: number) => HTMLElement | null;
  setTemplateText: (text: string) => void;
}

export const MCQBlueprint = forwardRef<MCQBlueprintRef, MCQBlueprintProps>(
  ({ onFocusField, initialData, templateId, step = 2 }, ref) => {
    const [templateText, setTemplateText] = useState(initialData?.templateText ?? '');
    const initialAnswerFormula = initialData?.answerFormula ?? '';
    const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
      initialData?.diagramTemplateRaw ?? ''
    );
    const [solutionStepsTemplate, setSolutionStepsTemplate] = useState(
      initialData?.solutionStepsTemplate ?? ''
    );
    const [parameters, setParameters] = useState<ParameterInput[]>(
      initialData?.parameters ?? []
    );
    const [globalConstraints, setGlobalConstraints] = useState<string[]>(
      initialData?.globalConstraints ?? []
    );
    const [options, setOptions] = useState<OptionInput[]>(() => {
      const seed = initialData?.options ?? [
        { key: 'A', formula: '' },
        { key: 'B', formula: '' },
        { key: 'C', formula: '' },
        { key: 'D', formula: '' },
      ];
      const matchIdx = initialAnswerFormula
        ? seed.findIndex((o) => o.formula.trim() === initialAnswerFormula.trim())
        : -1;
      const correctIdx = matchIdx >= 0 ? matchIdx : 0;
      return seed.map((o, i) => ({
        key: o.key,
        formula: o.formula,
        isCorrect: i === correctIdx,
      }));
    });
    const answerFormula = options.find((o) => o.isCorrect)?.formula ?? '';

    const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
    const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const parameterSampleRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const optionKeyRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const optionFormulaRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      getData: () => ({
        templateText,
        parameters,
        globalConstraints,
        answerFormula,
        options,
        diagramTemplateRaw,
        solutionStepsTemplate,
      }),
      getFieldRef: (field: string, index?: number) => {
        switch (field) {
          case 'templateText':
            return templateTextRef.current;
          case 'answerFormula':
            return null;
          case 'diagramTemplateRaw':
            return diagramTemplateRef.current;
          case 'parameterName':
            return index !== undefined ? parameterNameRefs.current[index] : null;
          case 'parameterSample':
            return index !== undefined ? parameterSampleRefs.current[index] : null;
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
      // Allows AIExtractPanel to push updated template text into this blueprint
      setTemplateText: (text: string) => setTemplateText(text),
    }));

    const updateOption = (index: number, field: 'key' | 'formula', value: string) => {
      const updated = options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt));
      setOptions(updated);
    };

    const markOptionCorrect = (index: number) => {
      setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
    };

    return (
      <>
        {step === 2 && (
          <>
            <ParametersEditor
              parameters={parameters}
              onChange={setParameters}
              globalConstraints={globalConstraints}
              onGlobalConstraintsChange={setGlobalConstraints}
              onFocusField={(kind, index) => onFocusField?.(kind, index)}
              mathFieldRefs={{
                nameRefs: parameterNameRefs,
                constraintRefs: parameterConstraintRefs,
                sampleRefs: parameterSampleRefs,
              }}
            />

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Nội dung câu hỏi{' '}
                <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
                  (Dùng {'{{a}}'}, {'{{b}}'} để chèn hệ số. Ví dụ: "Giải: x + {'{{a}}'} ={' '}
                  {'{{b}}'}")
                </span>
              </p>
              <textarea
                ref={templateTextRef}
                className="textarea"
                rows={3}
                placeholder="Ví dụ: Tính giá trị của biểu thức {{a}} + {{b}}?"
                value={templateText}
                onFocus={() => onFocusField?.('templateText')}
                onChange={(event) => setTemplateText(event.target.value)}
              />
              {templateText && (
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(templateText, parameters)} />
                </div>
              )}
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Dùng {'{{a}}'} để tạo biến động. Bôi đen nội dung cần công thức rồi bấm Insert Math.
              </p>
            </label>

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
        )}

        {step === 3 && (
          <section className="data-card" style={{ minHeight: 0, border: '1px solid #fef3c7' }}>
            <div>
              <h3 style={{ color: '#92400e' }}>Phương án trắc nghiệm A, B, C, D</h3>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Viết công thức cho từng phương án, rồi chọn nút bên trái để đánh dấu
                <strong> đáp án đúng</strong>. Công thức tính đáp án đúng sẽ tự lấy theo lựa chọn
                này.
              </p>
            </div>

            {options.map((item, index) => (
              <div
                key={item.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 10px',
                  border: item.isCorrect ? '1px solid #10b981' : '1px solid #e5e7eb',
                  background: item.isCorrect ? '#ecfdf5' : '#fff',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  type="radio"
                  name="mcq-blueprint-correct"
                  checked={item.isCorrect}
                  onChange={() => markOptionCorrect(index)}
                  title="Đánh dấu là đáp án đúng"
                />
                <input
                  ref={(node) => {
                    optionKeyRefs.current[index] = node;
                  }}
                  className="input"
                  style={{ width: 56 }}
                  value={item.key}
                  readOnly
                  disabled
                  onFocus={() => onFocusField?.('optionKey', index)}
                />
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
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <p className="muted" style={{ marginBottom: 4, fontSize: '0.78rem' }}>
                Công thức đáp án đúng (tự lấy từ phương án đã chọn)
              </p>
              {answerFormula ? (
                <div className="preview-box">
                  <MathText text={answerFormula} />
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '0.78rem', color: '#b91c1c' }}>
                  Chưa nhập công thức cho phương án được đánh dấu là đáp án đúng.
                </p>
              )}
            </div>
          </section>
        )}

        {step === 4 && (
          <>
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Hướng dẫn giải mẫu (cho AI tạo lời giải)
              </p>
              <textarea
                className="textarea"
                rows={3}
                value={solutionStepsTemplate}
                onChange={(e) => setSolutionStepsTemplate(e.target.value)}
                placeholder="Ví dụ: Bước 1: Chuyển {{b}} sang vế phải. Bước 2: Chia hai vế cho {{a}}. Bước 3: x = (-{{b}})/{{a}}"
              />
              {solutionStepsTemplate && (
                <div className="preview-box">
                  <MathText
                    text={renderTemplateWithSamples(solutionStepsTemplate, parameters)}
                  />
                </div>
              )}
            </label>

            <section
              className="data-card"
              style={{ minHeight: 0, border: '1px solid #c7d2fe', background: '#eef2ff' }}
            >
              <h3 style={{ color: '#3730a3', marginTop: 0 }}>Xem trước câu hỏi (giá trị mẫu)</h3>
              <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                Đề bài và phương án dưới đây được render với{' '}
                <em>giá trị mẫu</em> của các hệ số. Đây là cách học sinh sẽ thấy.
              </p>

              <div style={{ marginBottom: 12 }}>
                <strong>Đề bài:</strong>
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(templateText, parameters)} />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {options
                  .filter((o) => o.formula.trim())
                  .map((o) => (
                    <div
                      key={o.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: 8,
                        alignItems: 'center',
                        padding: '6px 10px',
                        border: o.isCorrect ? '1px solid #10b981' : '1px solid #e5e7eb',
                        background: o.isCorrect ? '#ecfdf5' : '#fff',
                        borderRadius: 8,
                      }}
                    >
                      <strong style={{ color: o.isCorrect ? '#047857' : '#475569' }}>
                        {o.key}.
                      </strong>
                      <MathText text={renderTemplateWithSamples(o.formula, parameters)} />
                    </div>
                  ))}
              </div>

              {diagramTemplateRaw.trim() && (
                <div style={{ marginTop: 12 }}>
                  <strong>Sơ đồ:</strong>
                  <div className="preview-box">
                    <MathText text={renderTemplateWithSamples(diagramTemplateRaw, parameters)} />
                  </div>
                </div>
              )}
            </section>

            {/* AI Parameter Panel — refinement helper, edit mode only. */}
            {templateId && (
              <AIParameterPanel
                templateId={templateId}
                templateText={templateText}
                answerFormula={answerFormula}
                solutionSteps={solutionStepsTemplate}
                options={Object.fromEntries(options.map((o) => [o.key, o.formula]))}
                parameters={parameters.map((p) => p.name).filter(Boolean)}
                onAccept={(accepted) => {
                  setParameters((prev) =>
                    prev.map((p) => {
                      const val = accepted[p.name];
                      if (val === undefined) return p;
                      return { ...p, sampleValue: String(val) };
                    })
                  );
                }}
              />
            )}
          </>
        )}
      </>
    );
  }
);

MCQBlueprint.displayName = 'MCQBlueprint';
