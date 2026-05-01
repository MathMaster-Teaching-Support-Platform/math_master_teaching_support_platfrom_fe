import { AlertCircle, BookOpen, CheckCircle, FileQuestion } from 'lucide-react';
import type { ExamMatrixPartConfig, MatrixQuestionType } from '../../types/examMatrix';

interface PartConfigSectionProps {
  value: ExamMatrixPartConfig[];
  onChange: (parts: ExamMatrixPartConfig[]) => void;
  disabled?: boolean;
}

const QUESTION_TYPE_OPTIONS: Array<{
  value: MatrixQuestionType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'MULTIPLE_CHOICE',
    label: 'Trắc nghiệm (Multiple Choice)',
    shortLabel: 'Trắc nghiệm',
    icon: <CheckCircle size={16} />,
    color: '#3b82f6',
  },
  {
    value: 'TRUE_FALSE',
    label: 'Đúng/Sai (True/False)',
    shortLabel: 'Đúng/Sai',
    icon: <AlertCircle size={16} />,
    color: '#f59e0b',
  },
  {
    value: 'SHORT_ANSWER',
    label: 'Trả lời ngắn (Short Answer)',
    shortLabel: 'Trả lời ngắn',
    icon: <FileQuestion size={16} />,
    color: '#8b5cf6',
  },
];

const DEFAULT_PARTS: ExamMatrixPartConfig[][] = [
  // 1 part: MCQ only
  [{ partNumber: 1, questionType: 'MULTIPLE_CHOICE', name: 'Phần 1: Trắc nghiệm' }],
  // 2 parts: MCQ + TF
  [
    { partNumber: 1, questionType: 'MULTIPLE_CHOICE', name: 'Phần 1: Trắc nghiệm' },
    { partNumber: 2, questionType: 'TRUE_FALSE', name: 'Phần 2: Đúng/Sai' },
  ],
  // 3 parts: MCQ + TF + SA
  [
    { partNumber: 1, questionType: 'MULTIPLE_CHOICE', name: 'Phần 1: Trắc nghiệm' },
    { partNumber: 2, questionType: 'TRUE_FALSE', name: 'Phần 2: Đúng/Sai' },
    { partNumber: 3, questionType: 'SHORT_ANSWER', name: 'Phần 3: Trả lời ngắn' },
  ],
];

export function PartConfigSection({ value, onChange, disabled }: PartConfigSectionProps) {
  const numberOfParts = value.length;

  const handleNumberOfPartsChange = (newCount: number) => {
    if (disabled) return;
    
    // Use default configuration for the selected number of parts
    const newParts = DEFAULT_PARTS[newCount - 1];
    onChange(newParts);
  };

  const handlePartTypeChange = (partNumber: number, newType: MatrixQuestionType) => {
    if (disabled) return;
    
    const typeLabel = QUESTION_TYPE_OPTIONS.find(o => o.value === newType)?.shortLabel ?? newType;
    const autoName = `Phần ${partNumber}: ${typeLabel}`;
    
    const updatedParts = value.map((part) =>
      part.partNumber === partNumber
        ? { ...part, questionType: newType, name: autoName }
        : part
    );
    onChange(updatedParts);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Number of Parts Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--mod-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BookOpen size={15} />
          Số phần đề
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              disabled={disabled}
              onClick={() => handleNumberOfPartsChange(count)}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 8,
                border: `2px solid ${numberOfParts === count ? '#3b82f6' : '#cbd5e1'}`,
                background: numberOfParts === count ? '#eff6ff' : 'transparent',
                color: numberOfParts === count ? '#1e40af' : '#64748b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {count} phần
            </button>
          ))}
        </div>
      </div>

      {/* Part Configuration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--mod-ink)',
          }}
        >
          Cấu hình từng phần
        </label>

        {value.map((part) => {
          const selectedType = QUESTION_TYPE_OPTIONS.find(
            (opt) => opt.value === part.questionType
          );
          
          return (
            <div
              key={part.partNumber}
              style={{
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Part Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: selectedType?.color || '#64748b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {part.partNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  Phần {part.partNumber}
                </span>
              </div>

              {/* Question Type Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#475569',
                  }}
                >
                  Loại câu hỏi
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {QUESTION_TYPE_OPTIONS.map((option) => {
                    const isSelected = part.questionType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => handlePartTypeChange(part.partNumber, option.value)}
                        style={{
                          flex: '1 1 auto',
                          minWidth: 'fit-content',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 8,
                          border: `2px solid ${isSelected ? option.color : '#cbd5e1'}`,
                          background: isSelected ? `${option.color}15` : 'white',
                          color: isSelected ? option.color : '#64748b',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        {option.icon}
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: 8,
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          display: 'flex',
          gap: '0.6rem',
        }}
      >
        <AlertCircle size={16} style={{ color: '#0284c7', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.5 }}>
          <strong>Lưu ý:</strong> Mỗi phần có thể có loại câu hỏi khác nhau. Ví dụ: Phần 1 dùng
          Trắc nghiệm, Phần 2 dùng Đúng/Sai. Bạn có thể thay đổi cấu hình này sau khi tạo ma trận.
        </div>
      </div>
    </div>
  );
}
