import { Flag } from 'lucide-react';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';

interface QuestionNavigatorProps {
  questions: AttemptQuestionResponse[];
  currentIndex: number;
  answers: Record<string, any>;
  flags: Record<string, boolean>;
  onNavigate: (index: number) => void;
}

export default function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  flags,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
      <h4 style={{ marginBottom: 12 }}>Danh sách câu hỏi</h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
        }}
      >
        {questions.map((question, index) => {
          const isAnswered = answers[question.questionId] !== undefined && answers[question.questionId] !== '';
          const isFlagged = flags[question.questionId];
          const isCurrent = index === currentIndex;

          return (
            <button
              key={question.questionId}
              onClick={() => onNavigate(index)}
              style={{
                position: 'relative',
                padding: '8px',
                border: isCurrent ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                borderRadius: 6,
                backgroundColor: isAnswered ? 'var(--success-color)' : 'white',
                color: isAnswered ? 'white' : 'inherit',
                fontWeight: isCurrent ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {index + 1}
              {isFlagged && (
                <Flag
                  size={10}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    color: 'var(--warning-color)',
                  }}
                  fill="var(--warning-color)"
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: '0.875rem' }}>
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: 'var(--success-color)',
              borderRadius: 4,
            }}
          />
          <span className="muted">Đã trả lời</span>
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
            }}
          />
          <span className="muted">Chưa trả lời</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Flag size={14} style={{ color: 'var(--warning-color)' }} fill="var(--warning-color)" />
          <span className="muted">Đã đánh dấu</span>
        </div>
      </div>
    </div>
  );
}
