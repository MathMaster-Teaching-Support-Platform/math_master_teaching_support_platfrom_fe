import { useState, useRef } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from './ParametersEditor';

export type ValidationMode = 'EXACT' | 'NUMERIC' | 'REGEX';

export interface SABlueprintData {
  templateText: string;
  parameters: ParameterInput[];
  answerFormula: string;
  validationMode: ValidationMode;
  tolerance: string;
  diagramTemplateRaw: string;
}

interface SABlueprintProps {
  initialData?: Partial<SABlueprintData>;
  onFocusField?: (kind: string, index?: number) => void;
  onChange?: (data: SABlueprintData) => void;
}

export function SABlueprint({
  initialData,
  onFocusField,
  onChange,
}: Readonly<SABlueprintProps>) {
  const [templateText, setTemplateText] = useState(
    initialData?.templateText || 'Tính ∫₀¹ {{a}}x dx = ?'
  );
  const [parameters, setParameters] = useState<ParameterInput[]>(
    initialData?.parameters || [{ name: 'a', type: 'int', min: '1', max: '10', constraint: '' }]
  );
  const [answerFormula, setAnswerFormula] = useState(initialData?.answerFormula || '{{a}}/2');
  const [validationMode, setValidationMode] = useState<ValidationMode>(
    initialData?.validationMode || 'NUMERIC'
  );
  const [tolerance, setTolerance] = useState(initialData?.tolerance || '0.01');
  const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
    initialData?.diagramTemplateRaw || ''
  );

  const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
  const answerFormulaRef = useRef<HTMLInputElement | null>(null);
  const toleranceRef = useRef<HTMLInputElement | null>(null);
  const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);

  const notifyChange = (updates: Partial<SABlueprintData>) => {
    onChange?.({
      templateText,
      parameters,
      answerFormula,
      validationMode,
      tolerance,
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

  const updateValidationMode = (mode: ValidationMode) => {
    setValidationMode(mode);
    notifyChange({ validationMode: mode });
  };

  const updateTolerance = (value: string) => {
    setTolerance(value);
    notifyChange({ tolerance: value });
  };

  const updateDiagram = (value: string) => {
    setDiagramTemplateRaw(value);
    notifyChange({ diagramTemplateRaw: value });
  };

  const getData = (): SABlueprintData => ({
    templateText,
    parameters,
    answerFormula,
    validationMode,
    tolerance,
    diagramTemplateRaw,
  });

  // Attach getData to component instance
  if (typeof window !== 'undefined') {
    (SABlueprint as any).getData = getData;
  }

  return (
    <>
      <section className="data-card" style={{ minHeight: 0, border: '1px solid #dcfce7' }}>
        <div>
          <h3 style={{ color: '#166534' }}>Mẫu câu hỏi Trả lời ngắn</h3>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
            Câu hỏi SHORT_ANSWER yêu cầu học sinh nhập đáp án dạng text hoặc số.
          </p>
        </div>

        <label>
          <p className="muted" style={{ marginBottom: 6 }}>
            Nội dung câu hỏi <span style={{ color: '#ef4444' }}>*</span>
            <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
              (Dùng {'{{a}}'}, {'{{b}}'} để chèn biến số)
            </span>
          </p>
          <textarea
            ref={templateTextRef}
            className="textarea"
            rows={3}
            required
            placeholder="Ví dụ: Tính ∫₀¹ {{a}}x dx = ?"
            value={templateText}
            onFocus={() => onFocusField?.('templateText')}
            onChange={(event) => updateTemplateText(event.target.value)}
          />
          {templateText && (
            <div className="preview-box">
              <MathText text={templateText} />
            </div>
          )}
        </label>
      </section>

      <ParametersEditor
        parameters={parameters}
        onChange={updateParameters}
        onFocusField={onFocusField}
      />

      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Công thức đáp án đúng <span style={{ color: '#ef4444' }}>*</span>
        </p>
        <input
          ref={answerFormulaRef}
          className="input"
          required
          placeholder="Ví dụ: {{a}}/2"
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

      <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
        <div>
          <h3 style={{ color: '#1e40af' }}>Chế độ đánh giá</h3>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
            Chọn cách hệ thống so sánh đáp án của học sinh với đáp án đúng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`btn ${validationMode === 'EXACT' ? '' : 'secondary'}`}
            style={{ flex: 1 }}
            onClick={() => updateValidationMode('EXACT')}
          >
            EXACT
          </button>
          <button
            type="button"
            className={`btn ${validationMode === 'NUMERIC' ? '' : 'secondary'}`}
            style={{ flex: 1 }}
            onClick={() => updateValidationMode('NUMERIC')}
          >
            NUMERIC
          </button>
          <button
            type="button"
            className={`btn ${validationMode === 'REGEX' ? '' : 'secondary'}`}
            style={{ flex: 1 }}
            onClick={() => updateValidationMode('REGEX')}
          >
            REGEX
          </button>
        </div>

        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0f9ff',
            borderRadius: 8,
            marginBottom: 16,
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
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Sai số cho phép <span style={{ color: '#ef4444' }}>*</span>
            </p>
            <input
              ref={toleranceRef}
              className="input"
              type="number"
              step="0.001"
              required
              placeholder="0.01"
              value={tolerance}
              onFocus={() => onFocusField?.('tolerance')}
              onChange={(event) => updateTolerance(event.target.value)}
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
          onChange={(event) => updateDiagram(event.target.value)}
          placeholder="Ví dụ: \\int_0^1 x dx"
        />
      </label>
    </>
  );
}
