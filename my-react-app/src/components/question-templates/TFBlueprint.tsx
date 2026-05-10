import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { renderTemplateWithSamples } from '../../utils/templatePreview';
import { AIParameterPanel } from './AIParameterPanel';
import { DiagramTemplatePreview } from './DiagramTemplatePreview';

export type TFClauseInput = {
  key: string;
  text: string;
  truthValue: boolean;
};

export interface TFBlueprintData {
  stemText: string;
  clauses: TFClauseInput[];
  parameters: ParameterInput[];
  globalConstraints: string[];
  diagramTemplateRaw: string;
  solutionStepsTemplate: string;
}

interface TFBlueprintProps {
  templateId?: string;
  step?: 1 | 2 | 3 | 4;
  onFocusField?: (field: string, index?: number) => void;
  initialData?: {
    stemText?: string;
    clauses?: TFClauseInput[];
    parameters?: ParameterInput[];
    globalConstraints?: string[];
    diagramTemplateRaw?: string;
    solutionStepsTemplate?: string;
  };
}

export interface TFBlueprintRef {
  getData: () => TFBlueprintData;
  getFieldRef: (field: string, index?: number) => HTMLElement | null;
  setStemText: (text: string) => void;
}

export const TFBlueprint = forwardRef<TFBlueprintRef, TFBlueprintProps>(
  ({ onFocusField, initialData, templateId, step = 2 }, ref) => {
    const [stemText, setStemText] = useState(initialData?.stemText ?? '');
    const [clauses, setClauses] = useState<TFClauseInput[]>(
      initialData?.clauses ?? [
        { key: 'A', text: '', truthValue: true },
        { key: 'B', text: '', truthValue: true },
        { key: 'C', text: '', truthValue: true },
        { key: 'D', text: '', truthValue: true },
      ]
    );
    const [parameters, setParameters] = useState<ParameterInput[]>(
      initialData?.parameters ?? []
    );
    const [globalConstraints, setGlobalConstraints] = useState<string[]>(
      initialData?.globalConstraints ?? []
    );
    const [diagramTemplateRaw, setDiagramTemplateRaw] = useState(
      initialData?.diagramTemplateRaw ?? ''
    );
    const [solutionStepsTemplate, setSolutionStepsTemplate] = useState(
      initialData?.solutionStepsTemplate ?? ''
    );

    const stemTextRef = useRef<HTMLTextAreaElement | null>(null);
    const clauseTextRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const parameterSampleRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        stemText,
        clauses,
        parameters,
        globalConstraints,
        diagramTemplateRaw,
        solutionStepsTemplate,
      }),
      getFieldRef: (field: string, index?: number) => {
        switch (field) {
          case 'stemText':
            return stemTextRef.current;
          case 'clauseText':
            return index !== undefined ? clauseTextRefs.current[index] : null;
          case 'parameterName':
            return index !== undefined ? parameterNameRefs.current[index] : null;
          case 'parameterSample':
            return index !== undefined ? parameterSampleRefs.current[index] : null;
          case 'parameterConstraint':
            return index !== undefined ? parameterConstraintRefs.current[index] : null;
          case 'diagramTemplateRaw':
            return diagramTemplateRef.current;
          default:
            return null;
        }
      },
      setStemText: (text: string) => setStemText(text),
    }));

    const updateClause = (
      index: number,
      field: keyof TFClauseInput,
      value: string | boolean
    ) => {
      const updated = clauses.map((clause, i) =>
        i === index ? { ...clause, [field]: value } : clause
      );
      setClauses(updated);
    };

    const clausePlaceholders: Record<string, string> = {
      A: 'Ví dụ: Hàm số đạt cực tiểu tại $x = \\frac{-{{b}}}{2{{a}}}$',
      B: 'Ví dụ: Đồ thị hàm số đi qua điểm $(0; {{b}})$',
      C: 'Ví dụ: $f(0) = {{c}}$',
      D: 'Ví dụ: Hàm số đồng biến trên khoảng $(-\\infty; +\\infty)$',
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
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: -4 }}>
              Hệ số là <em>tùy chọn</em> với câu Đúng/Sai. Bỏ trống nếu mệnh đề không cần biến
              động.
            </p>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Mệnh đề chính (Stem)
              </p>
              <textarea
                ref={stemTextRef}
                className="textarea"
                rows={2}
                placeholder="Ví dụ: Cho hàm số f(x) = {{a}}x^2 + {{b}}x + {{c}}. Xét các mệnh đề sau:"
                value={stemText}
                onFocus={() => onFocusField?.('stemText')}
                onChange={(event) => setStemText(event.target.value)}
              />
              {stemText && (
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(stemText, parameters)} />
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
                placeholder="Ví dụ: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
              />
            </label>
            <DiagramTemplatePreview
              diagramTemplate={diagramTemplateRaw}
              parameters={parameters}
            />
          </>
        )}

        {step === 3 && (
          <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
            <h3 style={{ color: '#1e40af', marginTop: 0 }}>4 mệnh đề Đúng/Sai</h3>
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
              Phải có ít nhất 1 mệnh đề <strong>Đúng</strong> và 1 mệnh đề <strong>Sai</strong>.
            </p>
            {clauses.map((clause, index) => (
              <div
                key={clause.key}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: '#1e40af', fontSize: '1rem' }}>
                    Mệnh đề {clause.key}
                  </strong>
                </div>

                <label>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
                    Nội dung mệnh đề
                  </p>
                  <textarea
                    ref={(node) => {
                      clauseTextRefs.current[index] = node;
                    }}
                    className="textarea"
                    rows={2}
                    placeholder={
                      clausePlaceholders[clause.key] ?? `Nhập nội dung mệnh đề ${clause.key}...`
                    }
                    value={clause.text}
                    onFocus={() => onFocusField?.('clauseText', index)}
                    onChange={(event) => updateClause(index, 'text', event.target.value)}
                  />
                  {clause.text && (
                    <div className="preview-box">
                      <MathText text={renderTemplateWithSamples(clause.text, parameters)} />
                    </div>
                  )}
                </label>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginTop: 8 }}>
                  <label>
                    <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
                      Giá trị
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className={`btn ${clause.truthValue ? '' : 'secondary'}`}
                        style={{ flex: 1 }}
                        onClick={() => updateClause(index, 'truthValue', true)}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        className={`btn ${!clause.truthValue ? '' : 'secondary'}`}
                        style={{ flex: 1 }}
                        onClick={() => updateClause(index, 'truthValue', false)}
                      >
                        Sai
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 4 && (
          <>
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Hướng dẫn giải mẫu (cho AI tạo lời giải){' '}
                <strong style={{ color: '#b45309' }}>— bắt buộc trước khi dùng AI</strong>
              </p>
              <textarea
                className="textarea"
                rows={3}
                value={solutionStepsTemplate}
                onChange={(e) => setSolutionStepsTemplate(e.target.value)}
                placeholder="Ví dụ: Bước 1: Xét mệnh đề A... Bước 2: Xét mệnh đề B..."
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
                Stem và 4 mệnh đề dưới đây được render với <em>giá trị mẫu</em> của các hệ số.
              </p>

              <div style={{ marginBottom: 12 }}>
                <strong>Đề bài:</strong>
                <div className="preview-box">
                  <MathText text={renderTemplateWithSamples(stemText, parameters)} />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {clauses.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      borderRadius: 8,
                    }}
                  >
                    <strong style={{ color: '#1e40af' }}>{c.key}.</strong>
                    <MathText text={renderTemplateWithSamples(c.text, parameters)} />
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: c.truthValue ? '#ecfdf5' : '#fef2f2',
                        color: c.truthValue ? '#047857' : '#b91c1c',
                      }}
                    >
                      {c.truthValue ? 'Đúng' : 'Sai'}
                    </span>
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

            {/* AI Parameter Panel — refinement helper, edit mode + has params only. */}
            {templateId && parameters.length > 0 && (
              <AIParameterPanel
                templateId={templateId}
                templateText={stemText}
                clauses={Object.fromEntries(clauses.map((c) => [c.key, c.text]))}
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

TFBlueprint.displayName = 'TFBlueprint';
