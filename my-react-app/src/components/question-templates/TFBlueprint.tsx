import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from '../common/ParametersEditor';
import { CognitiveLevel } from '../../types/questionTemplate';

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
}

interface TFBlueprintProps {
  defaultChapterId: string;
  chapters: Array<{ id: string; title?: string; name?: string }>;
  onFocusField?: (field: string, index?: number) => void;
}

export interface TFBlueprintRef {
  getData: () => TFBlueprintData;
  getFieldRef: (field: string, index?: number) => HTMLElement | null;
}

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

export const TFBlueprint = forwardRef<TFBlueprintRef, TFBlueprintProps>(
  ({ defaultChapterId, chapters, onFocusField }, ref) => {
    const [stemText, setStemText] = useState('Cho hàm số $f(x) = {{a}}x^2 + {{b}}x + {{c}}$. Xét các mệnh đề sau:');
    const [clauses, setClauses] = useState<TFClauseInput[]>([
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
    ]);
    const [parameters, setParameters] = useState<ParameterInput[]>([
      { name: 'a', type: 'int', min: '1', max: '5', constraint: '' },
      { name: 'b', type: 'int', min: '-6', max: '6', constraint: '' },
      { name: 'c', type: 'int', min: '-10', max: '10', constraint: '' },
    ]);

    const stemTextRef = useRef<HTMLTextAreaElement | null>(null);
    const clauseTextRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMinRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterMaxRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const parameterConstraintRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      getData: () => ({
        stemText,
        clauses,
        parameters,
      }),
      getFieldRef: (field: string, index?: number) => {
        switch (field) {
          case 'stemText':
            return stemTextRef.current;
          case 'clauseText':
            return index !== undefined ? clauseTextRefs.current[index] : null;
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
              <MathText text={stemText} />
            </div>
          )}
        </label>

        <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
          <div>
            <h3 style={{ color: '#1e40af' }}>Mệnh đề Đúng/Sai (4 mệnh đề)</h3>
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
              Mỗi mệnh đề là một phát biểu toán học mà học sinh đánh giá Đúng hoặc Sai.
              Dùng biến số <code>{'{{a}}'}</code>, <code>{'{{b}}'}</code> trong mệnh đề
              để tạo câu hỏi tự động. Mỗi mệnh đề có thể thuộc chương và mức độ khác nhau.
            </p>
          </div>

          {/* Example Banner */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid #bfdbfe',
            fontSize: '0.85rem',
          }}>
            <strong style={{ color: '#1e40af' }}>📝 Ví dụ câu Đúng/Sai hoàn chỉnh:</strong>
            <div style={{ marginTop: 8, paddingLeft: 12 }}>
              <p style={{ fontStyle: 'italic', marginBottom: 4 }}>
                Đề bài: "Cho hàm số f(x) = 2x² + 4x - 3. Xét các mệnh đề sau:"
              </p>
              <ul style={{ paddingLeft: 20, margin: '4px 0', lineHeight: 1.6 }}>
                <li><strong>A)</strong> Hàm số đạt cực tiểu tại x = -1 → <span style={{ color: '#16a34a' }}>Đúng</span></li>
                <li><strong>B)</strong> Đồ thị có trục đối xứng x = 4 → <span style={{ color: '#dc2626' }}>Sai</span></li>
                <li><strong>C)</strong> f(0) = -3 → <span style={{ color: '#16a34a' }}>Đúng</span></li>
                <li><strong>D)</strong> Hàm số đồng biến trên (-∞; +∞) → <span style={{ color: '#dc2626' }}>Sai</span></li>
              </ul>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: 4 }}>
                Đáp án: A,C (mệnh đề đúng) → Điểm: 4/4 đúng = 1đ, 3/4 = 0.25đ
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: '0.875rem',
            }}
          >
            <strong>⚠ Điểm THPT:</strong> 4/4 đúng = 1 điểm, 3/4 đúng = 0.25 điểm, dưới 3/4 = 0 điểm
          </div>

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
                    <MathText text={clause.text} />
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
            onFocusField={(kind, index) => onFocusField?.(kind, index)}
            mathFieldRefs={{
              nameRefs: parameterNameRefs,
              minRefs: parameterMinRefs,
              maxRefs: parameterMaxRefs,
              constraintRefs: parameterConstraintRefs,
            }}
          />
        )}

        {parameters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setParameters([{ name: '', type: 'int', min: '1', max: '10', constraint: '' }])
              }
            >
              + Thêm biến số (tùy chọn)
            </button>
            <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
              Biến số cho phép tạo mệnh đề động với giá trị ngẫu nhiên
            </p>
          </div>
        )}
      </>
    );
  }
);

TFBlueprint.displayName = 'TFBlueprint';
