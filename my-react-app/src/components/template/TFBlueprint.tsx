import { useState, useRef } from 'react';
import MathText from '../common/MathText';
import { ParametersEditor, type ParameterInput } from './ParametersEditor';
import { CognitiveLevel } from '../../types/questionTemplate';

export interface TFClauseInput {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  chapterId: string;
  cognitiveLevel: CognitiveLevel;
  truthValue: boolean;
}

export interface TFBlueprintData {
  stemText: string;
  clauses: TFClauseInput[];
  parameters: ParameterInput[];
}

interface TFBlueprintProps {
  defaultChapterId: string;
  chapters: Array<{ id: string; title?: string; name?: string }>;
  initialData?: Partial<TFBlueprintData>;
  onFocusField?: (kind: string, index?: number) => void;
  onChange?: (data: TFBlueprintData) => void;
}

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

export function TFBlueprint({
  defaultChapterId,
  chapters,
  initialData,
  onFocusField,
  onChange,
}: Readonly<TFBlueprintProps>) {
  const [stemText, setStemText] = useState(
    initialData?.stemText || 'Cho hàm số f(x) = {{a}}x^2 + {{b}}x + {{c}}. Xét các mệnh đề sau:'
  );
  const [clauses, setClauses] = useState<TFClauseInput[]>(
    initialData?.clauses || [
      {
        key: 'A',
        text: 'f(x) đồng biến trên (0, +∞)',
        chapterId: defaultChapterId,
        cognitiveLevel: CognitiveLevel.NHAN_BIET,
        truthValue: true,
      },
      {
        key: 'B',
        text: 'f(x) có cực đại tại x = -{{b}}/(2{{a}})',
        chapterId: defaultChapterId,
        cognitiveLevel: CognitiveLevel.THONG_HIEU,
        truthValue: false,
      },
      {
        key: 'C',
        text: 'f(0) = {{c}}',
        chapterId: defaultChapterId,
        cognitiveLevel: CognitiveLevel.VAN_DUNG,
        truthValue: true,
      },
      {
        key: 'D',
        text: 'f(x) nghịch biến trên (-∞, -{{b}}/(2{{a}}))',
        chapterId: defaultChapterId,
        cognitiveLevel: CognitiveLevel.VAN_DUNG_CAO,
        truthValue: false,
      },
    ]
  );
  const [parameters, setParameters] = useState<ParameterInput[]>(
    initialData?.parameters || [
      { name: 'a', type: 'int', min: '1', max: '5', constraint: '' },
      { name: 'b', type: 'int', min: '-10', max: '10', constraint: '' },
      { name: 'c', type: 'int', min: '-5', max: '5', constraint: '' },
    ]
  );

  const stemTextRef = useRef<HTMLTextAreaElement | null>(null);
  const clauseTextRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const notifyChange = (updates: Partial<TFBlueprintData>) => {
    onChange?.({
      stemText,
      clauses,
      parameters,
      ...updates,
    });
  };

  const updateStemText = (value: string) => {
    setStemText(value);
    notifyChange({ stemText: value });
  };

  const updateClause = (index: number, field: keyof TFClauseInput, value: any) => {
    const updated = clauses.map((clause, i) => (i === index ? { ...clause, [field]: value } : clause));
    setClauses(updated);
    notifyChange({ clauses: updated });
  };

  const updateParameters = (params: ParameterInput[]) => {
    setParameters(params);
    notifyChange({ parameters: params });
  };

  const getData = (): TFBlueprintData => ({
    stemText,
    clauses,
    parameters,
  });

  // Attach getData to component instance
  if (typeof window !== 'undefined') {
    (TFBlueprint as any).getData = getData;
  }

  return (
    <>
      <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
        <div>
          <h3 style={{ color: '#1e40af' }}>Mẫu câu hỏi Đúng/Sai</h3>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
            Câu hỏi TRUE_FALSE có 4 mệnh đề (A, B, C, D). Mỗi mệnh đề có thể thuộc chương và mức độ khác nhau.
          </p>
        </div>

        <label>
          <p className="muted" style={{ marginBottom: 6 }}>
            Mệnh đề chính (Stem) <span style={{ color: '#ef4444' }}>*</span>
          </p>
          <textarea
            ref={stemTextRef}
            className="textarea"
            rows={2}
            required
            placeholder="Ví dụ: Cho hàm số f(x) = {{a}}x^2 + {{b}}x + {{c}}. Xét các mệnh đề sau:"
            value={stemText}
            onFocus={() => onFocusField?.('stemText')}
            onChange={(event) => updateStemText(event.target.value)}
          />
          {stemText && (
            <div className="preview-box">
              <MathText text={stemText} />
            </div>
          )}
        </label>

        <div style={{ marginTop: 16 }}>
          <p className="muted" style={{ marginBottom: 12, fontWeight: 600 }}>
            4 Mệnh đề (A, B, C, D)
          </p>

          {clauses.map((clause, index) => (
            <div
              key={clause.key}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                background: '#f9fafb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#1e40af',
                    minWidth: 24,
                  }}
                >
                  {clause.key}
                </span>
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={(node) => {
                      clauseTextRefs.current[index] = node;
                    }}
                    className="textarea"
                    rows={2}
                    required
                    placeholder={`Nội dung mệnh đề ${clause.key}`}
                    value={clause.text}
                    onFocus={() => onFocusField?.('clauseText', index)}
                    onChange={(event) => updateClause(index, 'text', event.target.value)}
                    style={{ marginBottom: 4 }}
                  />
                  {clause.text && (
                    <div className="preview-box" style={{ fontSize: '0.85rem' }}>
                      <MathText text={clause.text} />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <label>
                  <p className="muted" style={{ marginBottom: 4, fontSize: '0.8rem' }}>
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
                  <p className="muted" style={{ marginBottom: 4, fontSize: '0.8rem' }}>
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
                  <p className="muted" style={{ marginBottom: 4, fontSize: '0.8rem' }}>
                    Giá trị
                  </p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className={`btn ${clause.truthValue ? '' : 'secondary'}`}
                      style={{ flex: 1, padding: '0.5rem' }}
                      onClick={() => updateClause(index, 'truthValue', true)}
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      className={`btn ${!clause.truthValue ? '' : 'secondary'}`}
                      style={{ flex: 1, padding: '0.5rem' }}
                      onClick={() => updateClause(index, 'truthValue', false)}
                    >
                      Sai
                    </button>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            borderRadius: 8,
            marginTop: 16,
            fontSize: '0.875rem',
          }}
        >
          <strong>Cách tính điểm:</strong> Mỗi mệnh đề đúng = tổng điểm câu ÷ số mệnh đề.
        </div>
      </section>

      <ParametersEditor
        parameters={parameters}
        onChange={updateParameters}
        onFocusField={onFocusField}
      />
    </>
  );
}
