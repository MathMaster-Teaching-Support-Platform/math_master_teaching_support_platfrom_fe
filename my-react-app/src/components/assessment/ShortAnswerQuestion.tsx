import type { AssessmentQuestionItem } from '../../types/assessment.types';
import MathText from '../common/MathText';
import QuestionDiagram from '../common/QuestionDiagram';

interface ShortAnswerQuestionProps {
  question: AssessmentQuestionItem;
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
}

export function ShortAnswerQuestion({
  question,
  studentAnswer,
  onAnswerChange,
}: ShortAnswerQuestionProps) {
  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <MathText text={question.questionText} />
      </p>
      <QuestionDiagram source={question as { diagramData?: unknown; diagramUrl?: string; diagramLatex?: string }} />
      <input
        type="text"
        value={studentAnswer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Nhập câu trả lời..."
        style={{
          width: '100%',
          padding: '0.6rem 0.8rem',
          borderRadius: 6,
          border: '1px solid #cbd5e1',
          fontSize: '1rem',
        }}
        inputMode="decimal"
      />
    </div>
  );
}
