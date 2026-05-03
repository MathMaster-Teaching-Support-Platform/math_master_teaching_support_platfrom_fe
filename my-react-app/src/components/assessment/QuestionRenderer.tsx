import type { AssessmentQuestionItem } from '../../types/assessment.types';
import MathText from '../common/MathText';
import { ShortAnswerQuestion } from './ShortAnswerQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';

interface QuestionRendererProps {
  question: AssessmentQuestionItem | {
    questionId: string;
    questionText: string;
    questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
    options?: Record<string, unknown>;
  };
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
}

export function QuestionRenderer({
  question,
  studentAnswer,
  onAnswerChange,
}: QuestionRendererProps) {
  const questionType = question.questionType || 'MULTIPLE_CHOICE';
  
  // Convert options to string format
  const optionsAsString: Record<string, string> = {};
  if (question.options) {
    Object.entries(question.options).forEach(([key, value]) => {
      optionsAsString[key] = String(value);
    });
  }

  switch (questionType) {
    case 'MULTIPLE_CHOICE':
      return (
        <div>
          <p style={{ marginBottom: 12 }}>
            <MathText text={question.questionText} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(optionsAsString).map(([key, text]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name={`question-${question.questionId}`}
                  value={key}
                  checked={studentAnswer === key}
                  onChange={(e) => onAnswerChange(e.target.value)}
                />
                <MathText text={text} />
              </label>
            ))}
          </div>
        </div>
      );

    case 'SHORT_ANSWER':
      return (
        <ShortAnswerQuestion
          question={{ ...question, options: optionsAsString } as AssessmentQuestionItem}
          studentAnswer={studentAnswer}
          onAnswerChange={onAnswerChange}
        />
      );

    case 'TRUE_FALSE':
      return (
        <TrueFalseQuestion
          question={{ ...question, options: optionsAsString } as AssessmentQuestionItem}
          studentAnswer={studentAnswer}
          onAnswerChange={onAnswerChange}
        />
      );

    default:
      return <p>Unsupported question type: {questionType}</p>;
  }
}
