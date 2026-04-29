interface MCQEditorProps {
  value: {
    questionText?: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    [key: string]: unknown;
  };
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function MCQEditor({ value, onChange, disabled = false }: MCQEditorProps) {
  const options = value.options || { A: '', B: '', C: '', D: '' };
  const correctAnswer = value.correctAnswer || '';

  const updateField = (field: string, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateOption = (key: string, text: string) => {
    updateField('options', { ...options, [key]: text });
  };

  return (
    <div className="mcq-editor" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
          Câu hỏi:
        </label>
        <textarea
          value={value.questionText || ''}
          onChange={(e) => updateField('questionText', e.target.value)}
          disabled={disabled}
          placeholder="Nhập nội dung câu hỏi..."
          rows={4}
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
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
          Các lựa chọn:
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['A', 'B', 'C', 'D'].map(key => (
            <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, minWidth: 24 }}>{key}.</span>
              <input
                type="text"
                value={options[key] || ''}
                onChange={(e) => updateOption(key, e.target.value)}
                disabled={disabled}
                placeholder={`Lựa chọn ${key}`}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
          Đáp án đúng:
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          {['A', 'B', 'C', 'D'].map(key => (
            <label
              key={key}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                border: '2px solid',
                borderColor: correctAnswer === key ? '#16a34a' : '#d1d5db',
                borderRadius: 8,
                backgroundColor: correctAnswer === key ? '#dcfce7' : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="correctAnswer"
                value={key}
                checked={correctAnswer === key}
                onChange={(e) => updateField('correctAnswer', e.target.value)}
                disabled={disabled}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>{key}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
