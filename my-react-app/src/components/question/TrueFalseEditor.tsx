import { useState, useEffect } from 'react';

interface TFClause {
  key: string;
  text: string;
  isTrue: boolean;
}

interface TrueFalseEditorProps {
  value: {
    questionText?: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    [key: string]: unknown;
  };
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function TrueFalseEditor({ value, onChange, disabled = false }: TrueFalseEditorProps) {
  const [clauses, setClauses] = useState<TFClause[]>(() => {
    const options = value.options || {};
    const correctKeys = (value.correctAnswer || '').split(',').filter(Boolean);

    return ['A', 'B', 'C', 'D'].map(key => ({
      key,
      text: options[key] || '',
      isTrue: correctKeys.includes(key),
    }));
  });

  useEffect(() => {
    const options: Record<string, string> = {};
    const trueKeys: string[] = [];

    clauses.forEach(clause => {
      options[clause.key] = clause.text;
      if (clause.isTrue) {
        trueKeys.push(clause.key);
      }
    });

    onChange({
      ...value,
      options,
      correctAnswer: trueKeys.join(','),
    });
  }, [clauses]);

  const updateClause = (index: number, updates: Partial<TFClause>) => {
    setClauses(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const updateField = (field: string, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="tf-editor" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
          Đề bài (stem):
        </label>
        <textarea
          value={value.questionText || ''}
          onChange={(e) => updateField('questionText', e.target.value)}
          disabled={disabled}
          placeholder="Nhập đề bài chung cho các mệnh đề..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #d1d5db',
            borderRadius: 8,
            fontSize: '1rem',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div style={{ marginTop: 4, fontSize: '0.875rem', color: '#6b7280' }}>
          Ví dụ: "Cho hàm số f(x) = x³ - 3x + 1. Xét các mệnh đề sau:"
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {clauses.map((clause, index) => (
          <div
            key={clause.key}
            style={{
              padding: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  color: '#374151',
                  minWidth: 32,
                }}
              >
                {clause.key}
              </span>
              <div style={{ flex: 1, height: 2, backgroundColor: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: '#6b7280' }}>
                  Nội dung mệnh đề:
                </label>
                <textarea
                  value={clause.text}
                  onChange={(e) => updateClause(index, { text: e.target.value })}
                  disabled={disabled}
                  placeholder={`Nhập nội dung mệnh đề ${clause.key}...`}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: '#6b7280' }}>
                  Đáp án:
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px',
                      border: '2px solid',
                      borderColor: clause.isTrue ? '#16a34a' : '#d1d5db',
                      borderRadius: 6,
                      backgroundColor: clause.isTrue ? '#dcfce7' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name={`clause-${clause.key}`}
                      checked={clause.isTrue}
                      onChange={() => updateClause(index, { isTrue: true })}
                      disabled={disabled}
                      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ fontWeight: 600 }}>Đúng</span>
                  </label>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px',
                      border: '2px solid',
                      borderColor: !clause.isTrue ? '#dc2626' : '#d1d5db',
                      borderRadius: 6,
                      backgroundColor: !clause.isTrue ? '#fee2e2' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name={`clause-${clause.key}`}
                      checked={!clause.isTrue}
                      onChange={() => updateClause(index, { isTrue: false })}
                      disabled={disabled}
                      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ fontWeight: 600 }}>Sai</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: 8,
          fontSize: '0.875rem',
          color: '#1e40af',
        }}
      >
        💡 Mức độ và chương được thiết lập ở cấp câu hỏi. Học sinh chọn Đúng/Sai cho từng mệnh đề.
      </div>
    </div>
  );
}
