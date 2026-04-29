import { useMemo } from 'react';
import { parseTFAnswer, formatTFAnswer } from '../../utils/questionHelpers';
import type { AssessmentQuestionItem } from '../../types/assessment.types';

interface TrueFalseRendererProps {
  question: AssessmentQuestionItem | {
    questionId: string;
    questionText: string;
    options?: Record<string, unknown>;
  };
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
}

export function TrueFalseRenderer({
  question,
  studentAnswer,
  onAnswerChange,
  disabled = false,
}: TrueFalseRendererProps) {
  // Parse current answer: "A,C" → Set{"A","C"}
  const selected = useMemo(() => parseTFAnswer(studentAnswer), [studentAnswer]);
  const touched = useMemo(() => new Set<string>(), []);

  const toggleClause = (key: string, isTrue: boolean) => {
    const next = new Set(selected);
    if (isTrue) {
      next.add(key);
    } else {
      next.delete(key);
    }
    touched.add(key);
    const formatted = formatTFAnswer(next);
    onAnswerChange(formatted);
  };

  // Convert options to string record
  const clauses: Record<string, string> = {};
  if (question.options) {
    Object.entries(question.options).forEach(([key, value]) => {
      clauses[key] = String(value);
    });
  }

  return (
    <div className="tf-question" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="question-text" style={{ marginBottom: 8, fontSize: '1rem', lineHeight: 1.6 }}>
        {question.questionText}
      </div>
      {['A', 'B', 'C', 'D'].map(key => (
        <div
          key={key}
          className="tf-clause-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            backgroundColor: 'white',
          }}
        >
          <span
            className="clause-label"
            style={{
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 24,
            }}
          >
            {key})
          </span>
          <span
            className="clause-text"
            style={{
              flex: 1,
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            {clauses[key] || ''}
          </span>
          <div
            className="tf-toggle-pair"
            role="radiogroup"
            aria-label={`Mệnh đề ${key}`}
            style={{
              display: 'flex',
              gap: 8,
              minWidth: 160,
            }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected.has(key)}
              className={`tf-btn tf-true ${selected.has(key) ? 'active' : ''}`}
              onClick={() => toggleClause(key, true)}
              disabled={disabled}
              style={{
                flex: 1,
                minHeight: 44,
                padding: '8px 16px',
                border: '2px solid',
                borderColor: selected.has(key) ? '#16a34a' : '#d1d5db',
                borderRadius: 6,
                backgroundColor: selected.has(key) ? '#16a34a' : 'white',
                color: selected.has(key) ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Đúng
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!selected.has(key) && touched.has(key)}
              className={`tf-btn tf-false ${!selected.has(key) && touched.has(key) ? 'active' : ''}`}
              onClick={() => toggleClause(key, false)}
              disabled={disabled}
              style={{
                flex: 1,
                minHeight: 44,
                padding: '8px 16px',
                border: '2px solid',
                borderColor: !selected.has(key) && touched.has(key) ? '#dc2626' : '#d1d5db',
                borderRadius: 6,
                backgroundColor: !selected.has(key) && touched.has(key) ? '#dc2626' : 'white',
                color: !selected.has(key) && touched.has(key) ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Sai
            </button>
          </div>
        </div>
      ))}
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 8 }}>
        💡 Chọn "Đúng" cho các mệnh đề đúng, "Sai" cho các mệnh đề sai
      </div>
    </div>
  );
}
