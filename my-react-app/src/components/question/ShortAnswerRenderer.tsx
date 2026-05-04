import { normalizeNumericAnswer } from '../../utils/questionHelpers';
import type { AssessmentQuestionItem } from '../../types/assessment.types';
import MathText from '../common/MathText';

interface ShortAnswerRendererProps {
  question: AssessmentQuestionItem | {
    questionId: string;
    questionText: string;
  };
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
}

export function ShortAnswerRenderer({
  question,
  studentAnswer,
  onAnswerChange,
  disabled = false,
}: ShortAnswerRendererProps) {
  const handleChange = (value: string) => {
    // Auto-normalize numeric input (comma → dot)
    const normalized = normalizeNumericAnswer(value);
    onAnswerChange(normalized);
  };

  return (
    <div className="sa-question" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="question-text" style={{ marginBottom: 8, fontSize: '1rem', lineHeight: 1.6 }}>
        <MathText text={question.questionText} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          inputMode="decimal"
          value={studentAnswer ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Nhập đáp án..."
          disabled={disabled}
          className="sa-input"
          aria-label="Đáp án"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #d1d5db',
            borderRadius: 8,
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
          }}
        />
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          💡 Dùng dấu chấm (.) cho số thập phân. Ví dụ: 3.14
        </div>
      </div>
    </div>
  );
}
