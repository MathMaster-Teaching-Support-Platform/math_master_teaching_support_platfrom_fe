import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { renderTemplateWithSamples } from '../../utils/templatePreview';
import { AIParameterPanel } from './AIParameterPanel';
import { DiagramTemplatePreview } from './DiagramTemplatePreview';

export type ValidationMode = 'EXACT' | 'NUMERIC' | 'REGEX';

const MODE_LABEL: Record<ValidationMode, string> = {
  EXACT: 'chính xác',
  NUMERIC: 'có sai số',
  REGEX: 'công thức toán học',
};

export interface SABlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  globalConstraints: string[];
  answerFormula: string;
  validationMode: ValidationMode;
  tolerance: string;
  diagramTemplateRaw: string;
  solutionStepsTemplate: string;
}

interface SABlueprintProps {
  defaultChapterId: string;
  templateId?: string;
  step?: 1 | 2 | 3 | 4;
  onFocusField?: (field: string, index?: number) => void;
  initialData?: {
    templateText?: string;
    parameters?: ParameterInput[];
    globalConstraints?: string[];
    answerFormula?: string;
    validationMode?: ValidationMode;
    tolerance?: string;
    diagramTemplateRaw?: string;
    solutionStepsTemplate?: string;
  };
}

export interface SABlueprintRef {
  getData: () => SABlueprintData;
  getFieldRef: (field: string, index?: number) => HTMLElement | null;
  setTemplateText: (text: string) => void;
}

export const SABlueprint = forwardRef<SABlueprintRef, SABlueprintProps>(
  ({ onFocusField, initialData, templateId, step = 2 }, ref) => {
    const [templateText, setTemplateText] = useState(initialData?.templateText ?? '');
    const [answerFormula, setAnswerFormula] = useState(initialData?.answerFormula ?? '');
    const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
      initialData?.diagramTemplateRaw ?? ''
    );
    const [solutionStepsTemplate, setSolutionStepsTemplate] = useState(
      initialData?.solutionStepsTemplate ?? ''
    );
    const [validationMode, setValidationMode] = useState<ValidationMode>(
      initialData?.validationMode ?? 'NUMERIC'
    );
    const [tolerance, setTolerance] = useState(initialData?.tolerance ?? '');
    const [parameters, setParameters] = useState<ParameterInput[]>(
      initialData?.parameters ?? []
    );
    const [globalConstraints, setGlobalConstraints] = useState<string[]>(
      initialData?.globalConstraints ?? []
    );

    const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
    const answerFormulaRef = useRef<HTMLInputElement | null>(null);
    const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
    const toleranceRef = useRef<HTMLInputElement | null>(null);
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const parameterSampleRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      getData: () => ({
        templateText,
        parameters,
        globalConstraints,
        answerFormula,
        validationMode,
        tolerance,
        diagramTemplateRaw,
        solutionStepsTemplate,
      }),
      getFieldRef: (field: string, index?: number) => {
        switch (field) {
          case 'templateText':
            return templateTextRef.current;
          case 'answerFormula':
            return answerFormulaRef.current;
          case 'diagramTemplateRaw':
            return diagramTemplateRef.current;
          case 'tolerance':
            return toleranceRef.current;
          case 'parameterName':
            return index !== undefined ? parameterNameRefs.current[index] : null;
          case 'parameterSample':
            return index !== undefined ? parameterSampleRefs.current[index] : null;
          case 'parameterConstraint':
            return index !== undefined ? parameterConstraintRefs.current[index] : null;
          default:
            return null;
        }
      },
      setTemplateText: (text: string) => setTemplateText(text),
    }));

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
                  (Dùng {'{{a}}'}, {'{{b}}'} để chèn hệ số)
                </span>
              </p>
              <textarea
                ref={templateTextRef}
                className="textarea"
                rows={3}
                placeholder="Ví dụ: Tính giá trị của biểu thức {{a}} + {{b}} = ?"
                value={templateText}
                onFocus={() => onFocusField?.('templateText')}
                onChange={(event) => setTemplateText(event.target.value)}
              />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Học sinh sẽ nhập đáp án dạng text hoặc số. Dùng {'{{a}}'} để tạo biến động.
              </p>
              {templateText && (
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(templateText, parameters)} />
                </div>
              )}
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
            <DiagramTemplatePreview
              diagramTemplate={diagramTemplateRaw}
              parameters={parameters}
            />
          </>
        )}

        {step === 3 && (
          <>
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Công thức tính đáp án đúng
              </p>
              <input
                ref={answerFormulaRef}
                className="input"
                placeholder="Ví dụ: {{a}}/2 — dùng {{tên_biến}} cho tham số"
                value={answerFormula}
                onFocus={() => onFocusField?.('answerFormula')}
                onChange={(event) => setAnswerFormula(event.target.value)}
              />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Dùng <code>{'{{tên_biến}}'}</code> cho tham số. Biến phải khớp với tên đã khai báo
                ở bước trước.
              </p>
              {answerFormula && (
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(answerFormula, parameters)} />
                </div>
              )}
            </label>

            <section className="data-card" style={{ minHeight: 0, border: '1px solid #dcfce7' }}>
              <div>
                <h3 style={{ color: '#166534' }}>Kiểu đánh giá</h3>
                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
                  Chọn cách hệ thống so sánh đáp án của học sinh với đáp án đúng.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn ${validationMode === 'EXACT' ? '' : 'secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setValidationMode('EXACT')}
                >
                  chính xác
                </button>
                <button
                  type="button"
                  className={`btn ${validationMode === 'NUMERIC' ? '' : 'secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setValidationMode('NUMERIC')}
                >
                  có sai số
                </button>
                <button
                  type="button"
                  className={`btn ${validationMode === 'REGEX' ? '' : 'secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setValidationMode('REGEX')}
                >
                  công thức toán học
                </button>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dbeafe',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                }}
              >
                <strong>Kiểu đánh giá hiện tại: {MODE_LABEL[validationMode]}</strong>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  {validationMode === 'EXACT' && (
                    <li>So sánh chuỗi chính xác (phân biệt hoa/thường)</li>
                  )}
                  {validationMode === 'NUMERIC' && (
                    <li>So sánh số với sai số cho phép (ví dụ: ±0.01)</li>
                  )}
                  {validationMode === 'REGEX' && <li>Kiểm tra theo biểu thức chính quy</li>}
                </ul>
              </div>

              {validationMode === 'NUMERIC' && (
                <label style={{ marginTop: 16 }}>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Sai số cho phép
                  </p>
                  <input
                    ref={toleranceRef}
                    className="input"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.01"
                    value={tolerance}
                    onFocus={() => onFocusField?.('tolerance')}
                    onChange={(event) => setTolerance(event.target.value)}
                  />
                  <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                    Đáp án được chấp nhận nếu sai lệch không quá giá trị này (ví dụ: 0.01 = ±1%)
                  </p>
                </label>
              )}
            </section>
          </>
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
                placeholder="Ví dụ: Bước 1: Tính nguyên hàm. Bước 2: Thay cận. Bước 3: Tính kết quả = {{a}}/2"
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
                Đề bài và đáp án dưới đây được render với <em>giá trị mẫu</em> của các hệ số.
              </p>

              <div style={{ marginBottom: 12 }}>
                <strong>Đề bài:</strong>
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(templateText, parameters)} />
                </div>
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #10b981',
                  background: '#ecfdf5',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <strong style={{ color: '#047857' }}>Đáp án đúng:</strong>
                <div style={{ marginTop: 4 }}>
                  <MathText text={renderTemplateWithSamples(answerFormula, parameters)} />
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                <strong>Kiểu đánh giá:</strong> {MODE_LABEL[validationMode]}
                {validationMode === 'NUMERIC' && tolerance && (
                  <> &middot; sai số cho phép: ±{tolerance}</>
                )}
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

SABlueprint.displayName = 'SABlueprint';
