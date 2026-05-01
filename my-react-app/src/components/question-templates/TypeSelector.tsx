import { QuestionType } from '../../types/questionTemplate';

interface TypeSelectorProps {
  selectedType: QuestionType;
  onChange: (type: QuestionType) => void;
  disabled?: boolean;
}

export function TypeSelector({ selectedType, onChange, disabled = false }: Readonly<TypeSelectorProps>) {
  const types = [
    {
      value: QuestionType.MULTIPLE_CHOICE,
      icon: '📝',
      label: 'MCQ',
      subtitle: 'Trắc nghiệm',
    },
    {
      value: QuestionType.TRUE_FALSE,
      icon: '✓✗',
      label: 'TF',
      subtitle: 'Đúng/Sai',
    },
    {
      value: QuestionType.SHORT_ANSWER,
      icon: '✏️',
      label: 'SA',
      subtitle: 'Trả lời ngắn',
    },
  ];

  return (
    <label>
      <p className="muted" style={{ marginBottom: 6 }}>
        Loại mẫu câu hỏi <span style={{ color: '#ef4444' }}>*</span>
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(type.value)}
            style={{
              flex: 1,
              padding: '12px',
              border: selectedType === type.value ? '2px solid #6366f1' : '1px solid #e5e7eb',
              borderRadius: 8,
              background: selectedType === type.value ? '#eef2ff' : '#ffffff',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!disabled && selectedType !== type.value) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (!disabled && selectedType !== type.value) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#ffffff';
              }
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: 4 }}>{type.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 2 }}>{type.label}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{type.subtitle}</div>
          </button>
        ))}
      </div>
      {disabled && (
        <p className="muted" style={{ marginTop: 6, fontSize: '0.75rem', color: '#ef4444' }}>
          ⚠ Không thể đổi loại sau khi tạo
        </p>
      )}
    </label>
  );
}
