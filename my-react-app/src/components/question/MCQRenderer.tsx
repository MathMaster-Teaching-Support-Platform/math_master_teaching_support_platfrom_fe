import type { AssessmentQuestionItem } from '../../types/assessment.types';
import MathText from '../common/MathText';

interface MCQRendererProps {
  question: AssessmentQuestionItem | {
    questionId: string;
    questionText: string;
    options?: Record<string, unknown>;
  };
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
}

export function MCQRenderer({
  question,
  studentAnswer,
  onAnswerChange,
  disabled = false,
}: MCQRendererProps) {
  const optionsAsString: Record<string, string> = {};
  if (question.options) {
    Object.entries(question.options).forEach(([key, value]) => {
      optionsAsString[key] = String(value);
    });
  }

  return (
    <div className="mcq-question">
      <div className="question-text" style={{ marginBottom: 16 }}>
        <MathText text={question.questionText} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(optionsAsString).map(([key, text]) => (
          <label
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              border: '2px solid',
              borderColor: studentAnswer === key ? '#1d4ed8' : '#e5e7eb',
              borderRadius: 8,
              cursor: disabled ? 'not-allowed' : 'pointer',
              backgroundColor: studentAnswer === key ? '#eff6ff' : 'white',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              value={key}
              checked={studentAnswer === key}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={disabled}
              style={{ width: 20, height: 20, cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
            <span style={{ flex: 1, fontSize: '1rem' }}>
              <strong>{key}.</strong> <MathText text={text} />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
