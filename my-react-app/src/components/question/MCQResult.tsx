import type { AnswerGradeResponse } from '../../types/grading.types';

interface MCQResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
  options?: Record<string, string>;
}

import MathText from '../common/MathText';

export function MCQResult({ answer, questionText, options }: MCQResultProps) {
  const isCorrect = answer.pointsEarned === answer.maxPoints;

  return (
    <div className="mcq-result" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {questionText && (
        <div className="question-text" style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 8 }}>
          <MathText text={questionText} />
        </div>
      )}
      
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#6b7280' }}>Đáp án của bạn:</span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
              color: isCorrect ? '#166534' : '#991b1b',
              fontWeight: 600,
            }}
          >
            {answer.answerText || '(Chưa trả lời)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#6b7280' }}>Đáp án đúng:</span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontWeight: 600,
            }}
          >
            {answer.correctAnswer}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.5rem' }}>
            {isCorrect ? '✅' : '❌'}
          </span>
          <span style={{ fontWeight: 600, color: isCorrect ? '#16a34a' : '#dc2626' }}>
            {isCorrect ? 'Đúng' : 'Sai'}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: '#f3f4f6',
          borderRadius: 6,
          width: 'fit-content',
        }}
      >
        <span style={{ fontWeight: 600, color: '#374151' }}>Điểm:</span>
        <span style={{ fontWeight: 700, fontSize: '1.125rem', color: isCorrect ? '#16a34a' : '#dc2626' }}>
          {answer.pointsEarned}/{answer.maxPoints}
        </span>
      </div>

      {options && (
        <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f9fafb', borderRadius: 6 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>Các lựa chọn:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(options).map(([key, text]) => (
              <div key={key} style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <strong>{key}.</strong> <MathText text={String(text)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
