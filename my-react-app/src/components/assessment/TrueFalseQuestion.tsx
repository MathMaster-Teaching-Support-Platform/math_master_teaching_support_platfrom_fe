import type { AssessmentQuestionItem } from '../../types/assessment.types';

interface TrueFalseQuestionProps {
  question: AssessmentQuestionItem;
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
}

export function TrueFalseQuestion({
  question,
  studentAnswer,
  onAnswerChange,
}: TrueFalseQuestionProps) {
  const selectedKeys = new Set(studentAnswer?.split(',') || []);

  const toggleClause = (key: string) => {
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onAnswerChange(Array.from(newKeys).join(','));
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>{question.questionText}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(question.options || {}).map(([key, text]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.8rem',
              background: '#f8f9fa',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
            }}
          >
            <span>{key}) {text}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => toggleClause(key)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 4,
                  border: '1px solid',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedKeys.has(key) ? '#10b981' : 'transparent',
                  borderColor: selectedKeys.has(key) ? '#059669' : '#cbd5e1',
                  color: selectedKeys.has(key) ? '#fff' : '#64748b',
                }}
              >
                Đúng
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedKeys.has(key)) {
                    toggleClause(key);
                  }
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 4,
                  border: '1px solid',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: !selectedKeys.has(key) ? '#ef4444' : 'transparent',
                  borderColor: !selectedKeys.has(key) ? '#dc2626' : '#cbd5e1',
                  color: !selectedKeys.has(key) ? '#fff' : '#64748b',
                }}
              >
                Sai
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
