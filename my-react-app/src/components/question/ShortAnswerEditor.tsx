interface ShortAnswerEditorProps {
  value: {
    questionText?: string;
    correctAnswer?: string;
    generationMetadata?: {
      answerValidation?: {
        mode?: 'EXACT' | 'NUMERIC' | 'REGEX';
        tolerance?: number;
      };
    };
    [key: string]: unknown;
  };
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function ShortAnswerEditor({ value, onChange, disabled = false }: ShortAnswerEditorProps) {
  const validationMode = value.generationMetadata?.answerValidation?.mode || 'EXACT';
  const tolerance = value.generationMetadata?.answerValidation?.tolerance || 0.01;

  const updateField = (field: string, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateValidation = (mode: string, newTolerance?: number) => {
    const metadata = {
      ...value.generationMetadata,
      answerValidation: {
        mode,
        ...(mode === 'NUMERIC' && { tolerance: newTolerance ?? tolerance }),
      },
    };
    updateField('generationMetadata', metadata);
  };

  return (
    <div className="sa-editor" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          Đáp án:
        </label>
        <input
          type="text"
          value={value.correctAnswer || ''}
          onChange={(e) => updateField('correctAnswer', e.target.value)}
          disabled={disabled}
          placeholder="Nhập đáp án đúng..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #d1d5db',
            borderRadius: 8,
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
          Kiểu đánh giá:
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { value: 'EXACT', label: 'Chính xác' },
            { value: 'NUMERIC', label: 'Số' },
            { value: 'REGEX', label: 'Regex' },
          ].map(option => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: '2px solid',
                borderColor: validationMode === option.value ? '#3b82f6' : '#d1d5db',
                borderRadius: 8,
                backgroundColor: validationMode === option.value ? '#eff6ff' : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="validationMode"
                value={option.value}
                checked={validationMode === option.value}
                onChange={(e) => updateValidation(e.target.value)}
                disabled={disabled}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {validationMode === 'NUMERIC' && (
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            Sai số cho phép:
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={tolerance}
            onChange={(e) => updateValidation('NUMERIC', parseFloat(e.target.value))}
            disabled={disabled}
            placeholder="0.01"
            style={{
              width: '200px',
              padding: '10px 12px',
              border: '2px solid #d1d5db',
              borderRadius: 8,
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <div style={{ marginTop: 4, fontSize: '0.875rem', color: '#6b7280' }}>
            Ví dụ: 0.01 cho phép đáp án sai lệch ±0.01
          </div>
        </div>
      )}

      <div
        style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: 8,
          fontSize: '0.875rem',
          color: '#1e40af',
        }}
      >
        💡 <strong>Chính xác:</strong> So sánh chuỗi chính xác. <strong>Số:</strong> So sánh số với sai số.{' '}
        <strong>Regex:</strong> Kiểm tra theo biểu thức chính quy.
      </div>
    </div>
  );
}
