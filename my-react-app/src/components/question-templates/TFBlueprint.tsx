import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { renderTemplateWithSamples } from '../../utils/templatePreview';
import { CognitiveLevel } from '../../types/questionTemplate';
import { AIParameterPanel } from './AIParameterPanel';

export type TFClauseInput = {
  key: string;
  text: string;
  chapterId: string;
  cognitiveLevel: CognitiveLevel;
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
  defaultChapterId: string;
  chapters: Array<{ id: string; title?: string; name?: string }>;
  templateId?: string;
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

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

export const TFBlueprint = forwardRef<TFBlueprintRef, TFBlueprintProps>(
  ({ defaultChapterId, chapters, onFocusField, initialData, templateId }, ref) => {
    const [stemText, setStemText] = useState(
      initialData?.stemText ?? 'Cho hàm số $f(x) = {{a}}x^2 + {{b}}x + {{c}}$. Xét các mệnh đề sau:'
    );
    const [clauses, setClauses] = useState<TFClauseInput[]>(
      initialData?.clauses ?? [
        {
          key: 'A',
          text: 'Hàm số đạt cực tiểu tại $x = \\frac{-{{b}}}{2 \\cdot {{a}}}$',
          chapterId: defaultChapterId,
          cognitiveLevel: CognitiveLevel.NHAN_BIET,
          truthValue: true,
        },
        {
          key: 'B',
          text: 'Đồ thị hàm số có trục đối xứng là đường thẳng $x = {{b}}$',
          chapterId: defaultChapterId,
          cognitiveLevel: CognitiveLevel.THONG_HIEU,
          truthValue: false,
        },
        {
          key: 'C',
          text: '$f(0) = {{c}}$',
          chapterId: defaultChapterId,
          cognitiveLevel: CognitiveLevel.VAN_DUNG,
          truthValue: true,
        },
        {
          key: 'D',
          text: 'Hàm số đồng biến trên khoảng $(-\\infty; +\\infty)$',
          chapterId: defaultChapterId,
          cognitiveLevel: CognitiveLevel.VAN_DUNG_CAO,
          truthValue: false,
        },
      ]
    );
    const [parameters, setParameters] = useState<ParameterInput[]>(
      initialData?.parameters ?? [
        { name: 'a', constraintText: 'số nguyên, 1 ≤ a ≤ 5, a ≠ 0', sampleValue: '2' },
        { name: 'b', constraintText: 'số nguyên, -6 ≤ b ≤ 6', sampleValue: '4' },
        { name: 'c', constraintText: 'số nguyên, -10 ≤ c ≤ 10', sampleValue: '-3' },
      ]
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

    return (
      <>
        <label>
          <p className="muted" style={{ marginBottom: 6 }}>
            Mệnh đề chính (Stem)
          </p>
          <textarea
            ref={stemTextRef}
            className="textarea"
            rows={2}
            required
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

        <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
  

        

          {clauses.map((clause, index) => {
            const clausePlaceholders: Record<string, string> = {
              A: 'Ví dụ: Hàm số đạt cực tiểu tại $x = \\frac{-{{b}}}{2{{a}}}$',
              B: 'Ví dụ: Đồ thị hàm số đi qua điểm $(0; {{b}})$',
              C: 'Ví dụ: $f(0) = {{c}}$',
              D: 'Ví dụ: Hàm số đồng biến trên khoảng $(-\\infty; +\\infty)$',
            };
            
            return (
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
                <strong style={{ color: '#1e40af', fontSize: '1rem' }}>Mệnh đề {clause.key}</strong>
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
                  required
                  placeholder={clausePlaceholders[clause.key] ?? `Nhập nội dung mệnh đề ${clause.key}...`}
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

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 8 }}>
                <label>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
                    Chương
                  </p>
                  <select
                    className="select"
                    value={clause.chapterId}
                    onChange={(event) => updateClause(index, 'chapterId', event.target.value)}
                  >
                    {chapters.length === 0 ? (
                      <option value="">Không có chương</option>
                    ) : (
                      chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title || chapter.name || chapter.id}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
                    Mức độ
                  </p>
                  <select
                    className="select"
                    value={clause.cognitiveLevel}
                    onChange={(event) =>
                      updateClause(index, 'cognitiveLevel', event.target.value as CognitiveLevel)
                    }
                  >
                    {Object.entries(cognitiveLevelLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

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
            );
          })}
        </section>

        {parameters.length > 0 && (
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
        )}

        {/* AI Parameter Panel — Feature 2 (legacy refinement helper) */}
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

        {parameters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setParameters([
                  { name: '', constraintText: 'số nguyên, 1 ≤ x ≤ 10', sampleValue: '' },
                ])
              }
            >
              + Thêm hệ số (tùy chọn)
            </button>
            <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
              Hệ số cho phép tạo mệnh đề động với giá trị ngẫu nhiên
            </p>
          </div>
        )}

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

        <label>
          <p className="muted" style={{ marginBottom: 6 }}>
            Hướng dẫn giải mẫu (cho AI tạo lời giải)
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
              <MathText text={solutionStepsTemplate} />
            </div>
          )}
        </label>
      </>
    );
  }
);

TFBlueprint.displayName = 'TFBlueprint';
