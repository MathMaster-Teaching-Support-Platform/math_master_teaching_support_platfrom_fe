import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { renderTemplateWithSamples } from '../../utils/templatePreview';

export type ValidationMode = 'EXACT' | 'NUMERIC' | 'REGEX';

export interface SABlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  answerFormula: string;
  validationMode: ValidationMode;
  tolerance: string;
  diagramTemplateRaw: string;
  solutionStepsTemplate: string;
}

interface SABlueprintProps {
  defaultChapterId: string;
  onFocusField?: (field: string, index?: number) => void;
  initialData?: {
    templateText?: string;
    parameters?: ParameterInput[];
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
}

export const SABlueprint = forwardRef<SABlueprintRef, SABlueprintProps>(
  ({ onFocusField, initialData }, ref) => {
    const [templateText, setTemplateText] = useState(
      initialData?.templateText ?? 'Tính ∫₀¹ {{a}}x dx = ?'
    );
    const [answerFormula, setAnswerFormula] = useState(
      initialData?.answerFormula ?? '{{a}}/2'
    );
    const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
      initialData?.diagramTemplateRaw ?? ''
    );
    const [solutionStepsTemplate, setSolutionStepsTemplate] = useState(
      initialData?.solutionStepsTemplate ?? ''
    );
    const [validationMode, setValidationMode] = useState<ValidationMode>(
      initialData?.validationMode ?? 'NUMERIC'
    );
    const [tolerance, setTolerance] = useState(
      initialData?.tolerance ?? '0.01'
    );
    const [parameters, setParameters] = useState<ParameterInput[]>(
      initialData?.parameters ?? [
        { name: 'a', type: 'int', min: '1', max: '10', constraint: '' },
      ]
    );

    const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
    const answerFormulaRef = useRef<HTMLInputElement | null>(null);
    const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
    const toleranceRef = useRef<HTMLInputElement | null>(null);
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMinRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMaxRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      getData: () => ({
        templateText,
        parameters,
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
          case 'parameterMin':
            return index !== undefined ? parameterMinRefs.current[index] : null;
          case 'parameterMax':
            return index !== undefined ? parameterMaxRefs.current[index] : null;
          case 'parameterConstraint':
            return index !== undefined ? parameterConstraintRefs.current[index] : null;
          default:
            return null;
        }
      },
    }));

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
            placeholder="Ví dụ: {{a}}/2 — dùng {{tên_biến}} cho tham số"
            value={answerFormula}
            onFocus={() => onFocusField?.('answerFormula')}
            onChange={(event) => setAnswerFormula(event.target.value)}
          />
          <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Dùng <code>{'{{tên_biến}}'}</code> cho tham số. Biến phải khớp với tên đã khai báo ở
            trước.
          </p>
          {answerFormula && (
            <div className="preview-box">
              <MathText text={renderTemplateWithSamples(answerFormula, parameters)} />
            </div>
          )}
        </label>

        <section className="data-card" style={{ minHeight: 0, border: '1px solid #dcfce7' }}>
          <div>
            <h3 style={{ color: '#166534' }}>Chế độ đánh giá đáp án</h3>
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
              EXACT
            </button>
            <button
              type="button"
              className={`btn ${validationMode === 'NUMERIC' ? '' : 'secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setValidationMode('NUMERIC')}
            >
              NUMERIC
            </button>
            <button
              type="button"
              className={`btn ${validationMode === 'REGEX' ? '' : 'secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setValidationMode('REGEX')}
            >
              REGEX
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
            <strong>Chế độ hiện tại: {validationMode}</strong>
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
                Sai số cho phép (tolerance)
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
              <MathText text={solutionStepsTemplate} />
            </div>
          )}
        </label>
      </>
    );
  }
);

SABlueprint.displayName = 'SABlueprint';
