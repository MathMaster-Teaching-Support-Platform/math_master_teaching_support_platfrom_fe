import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { AnswerGradeResponse, ManualGradeRequest } from '../../types/grading.types';
import MathText from '../common/MathText';

interface AnswerGradingCardProps {
  answer: AnswerGradeResponse;
  index: number;
  grade?: ManualGradeRequest;
  onGradeChange: (grade: ManualGradeRequest) => void;
  onTriggerAiReview: () => void;
  isAiReviewLoading: boolean;
}

export default function AnswerGradingCard({
  answer,
  index,
  grade,
  onGradeChange,
  onTriggerAiReview,
  isAiReviewLoading,
}: AnswerGradingCardProps) {
  const [points, setPoints] = useState(grade?.pointsEarned ?? answer.pointsEarned ?? 0);
  const [feedback, setFeedback] = useState(grade?.feedback ?? answer.feedback ?? '');
  const [isCorrect, _setIsCorrect] = useState(grade?.isCorrect ?? answer.isCorrect ?? false);

  const handlePointsChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(answer.maxPoints, value));
    setPoints(clampedValue);
    onGradeChange({
      answerId: answer.answerId,
      pointsEarned: clampedValue,
      feedback,
      isCorrect: clampedValue === answer.maxPoints,
    });
  };

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    onGradeChange({
      answerId: answer.answerId,
      pointsEarned: points,
      feedback: value,
      isCorrect,
    });
  };

  const isAlreadyGraded = answer.pointsEarned !== undefined && !grade;

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h4>Câu {index + 1}</h4>
        <div className="row" style={{ gap: 8 }}>
          {answer.needsManualGrading && !isAlreadyGraded && (
            <span className="badge" style={{ backgroundColor: 'var(--warning-color)' }}>
              Cần chấm thủ công
            </span>
          )}
          {isAlreadyGraded && (
            <span className="badge" style={{ backgroundColor: 'var(--success-color)' }}>
              Đã chấm
            </span>
          )}
          <span className="badge">{answer.questionType}</span>
        </div>
      </div>

      <p style={{ marginBottom: 16 }}>
        <MathText text={answer.questionText} />
      </p>

      {/* Student answer */}
      <div style={{ marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
          Câu trả lời của học sinh:
        </p>
        <div
          style={{
            padding: 12,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {typeof answer.studentAnswer === 'string'
            ? answer.studentAnswer || '(Không có câu trả lời)'
            : JSON.stringify(answer.studentAnswer, null, 2)}
        </div>
      </div>

      {/* Correct answer */}
      {answer.correctAnswer && (
        <div style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
            Đáp án đúng:
          </p>
          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--success-color-light)',
              borderRadius: 6,
            }}
          >
            {answer.correctAnswer}
          </div>
        </div>
      )}

      {/* AI Reviews */}
      {answer.aiReviews && answer.aiReviews.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
            Đánh giá AI:
          </p>
          {answer.aiReviews.map((review, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                backgroundColor: 'var(--primary-color-light)',
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: '0.875rem', marginBottom: 8 }}>{review.reviewContent}</p>
              {review.suggestions && review.suggestions.length > 0 && (
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                    Gợi ý:
                  </p>
                  <ul style={{ paddingLeft: 20, fontSize: '0.875rem' }}>
                    {review.suggestions.map((suggestion, sIdx) => (
                      <li key={sIdx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>
                Độ tin cậy: {(review.confidenceScore * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Grading section */}
      {!isAlreadyGraded && (
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 6,
            marginTop: 16,
          }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 12 }}
          >
            <div>
              <label>
                <p className="muted" style={{ marginBottom: 6, fontSize: '0.875rem' }}>
                  Điểm (tối đa {answer.maxPoints})
                </p>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max={answer.maxPoints}
                  step="0.5"
                  value={points}
                  onChange={(e) => handlePointsChange(parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>
            <div>
              <label>
                <p className="muted" style={{ marginBottom: 6, fontSize: '0.875rem' }}>
                  Nhận xét
                </p>
                <textarea
                  className="input"
                  value={feedback}
                  onChange={(e) => handleFeedbackChange(e.target.value)}
                  placeholder="Nhập nhận xét cho học sinh..."
                  rows={3}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>

          {answer.needsManualGrading && (
            <button
              className="btn secondary"
              onClick={onTriggerAiReview}
              disabled={isAiReviewLoading}
              style={{ marginTop: 8 }}
            >
              <Sparkles size={14} />
              {isAiReviewLoading ? 'Đang phân tích...' : 'Yêu cầu AI đánh giá'}
            </button>
          )}
        </div>
      )}

      {/* Already graded display */}
      {isAlreadyGraded && (
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--success-color-light)',
            borderRadius: 6,
            marginTop: 16,
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600 }}>
                Điểm: {answer.pointsEarned} / {answer.maxPoints}
              </p>
              {answer.feedback && (
                <p style={{ marginTop: 8, fontSize: '0.875rem' }}>Nhận xét: {answer.feedback}</p>
              )}
            </div>
            <span
              className="badge"
              style={{
                backgroundColor: answer.isCorrect ? 'var(--success-color)' : 'var(--danger-color)',
              }}
            >
              {answer.isCorrect ? 'Đúng' : 'Sai'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
