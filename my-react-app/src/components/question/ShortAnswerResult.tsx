import type { AnswerGradeResponse } from '../../types/grading.types';

interface ShortAnswerResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
}

export function ShortAnswerResult({ answer, questionText }: ShortAnswerResultProps) {
  const isCorrect = answer.pointsEarned === answer.maxPoints;

  return (
    <div className="sa-result" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {questionText && (
        <div className="question-text" style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 8 }}>
          {questionText}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          padding: 16,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          border: '2px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
            Đáp án của bạn:
          </span>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: isCorrect ? '#16a34a' : '#dc2626',
              padding: '8px 12px',
              backgroundColor: 'white',
              borderRadius: 6,
              border: '2px solid',
              borderColor: isCorrect ? '#16a34a' : '#dc2626',
            }}
          >
            {answer.answerText || '(Chưa trả lời)'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
            Đáp án đúng:
          </span>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#16a34a',
              padding: '8px 12px',
              backgroundColor: 'white',
              borderRadius: 6,
              border: '2px solid #16a34a',
            }}
          >
            {answer.correctAnswer}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '2rem' }}>
              {isCorrect ? '✅' : '❌'}
            </span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: isCorrect ? '#16a34a' : '#dc2626' }}>
              {isCorrect ? 'Đúng' : 'Sai'}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
          borderRadius: 8,
          width: 'fit-content',
        }}
      >
        <span style={{ fontWeight: 600, color: '#374151' }}>Điểm:</span>
        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: isCorrect ? '#16a34a' : '#dc2626' }}>
          {answer.pointsEarned}/{answer.maxPoints}
        </span>
      </div>
    </div>
  );
}
