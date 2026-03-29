import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';
import MathText from '../common/MathText';

interface QuestionDisplayProps {
  question: AttemptQuestionResponse;
  answer: any;
  onAnswerChange: (value: any) => void;
}

export default function QuestionDisplay({ question, answer, onAnswerChange }: QuestionDisplayProps) {
  return (
    <div style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, border: '1px solid var(--border-color)' }}>
      <div style={{ marginBottom: 8 }}>
        <span className="badge">{question.points} điểm</span>
      </div>

      <h3 style={{ marginBottom: 16 }}>
        <MathText text={question.questionText} />
      </h3>

      {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(question.options).map(([key, value]) => (
            <label
              key={key}
              className="row"
              style={{
                padding: 12,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                cursor: 'pointer',
                backgroundColor: answer === key ? 'var(--primary-color-light)' : 'white',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="radio"
                name={`question-${question.questionId}`}
                value={key}
                checked={answer === key}
                onChange={(e) => onAnswerChange(e.target.value)}
                style={{ marginRight: 12 }}
              />
              <span>
                <MathText text={value} />
              </span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === 'TRUE_FALSE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label
            className="row"
            style={{
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: answer === 'true' ? 'var(--primary-color-light)' : 'white',
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              value="true"
              checked={answer === 'true'}
              onChange={(e) => onAnswerChange(e.target.value)}
              style={{ marginRight: 12 }}
            />
            <span>Đúng</span>
          </label>
          <label
            className="row"
            style={{
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: answer === 'false' ? 'var(--primary-color-light)' : 'white',
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              value="false"
              checked={answer === 'false'}
              onChange={(e) => onAnswerChange(e.target.value)}
              style={{ marginRight: 12 }}
            />
            <span>Sai</span>
          </label>
        </div>
      )}

      {question.questionType === 'SHORT_ANSWER' && (
        <input
          className="input"
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Nhập câu trả lời của bạn"
          style={{ width: '100%' }}
        />
      )}

      {(question.questionType === 'ESSAY' || question.questionType === 'CODING') && (
        <textarea
          className="input"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={
            question.questionType === 'ESSAY'
              ? 'Nhập câu trả lời của bạn'
              : 'Nhập code của bạn'
          }
          rows={10}
          style={{ width: '100%', fontFamily: question.questionType === 'CODING' ? 'monospace' : 'inherit' }}
        />
      )}
    </div>
  );
}
