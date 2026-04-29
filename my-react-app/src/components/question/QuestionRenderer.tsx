import { resolveQuestionType } from '../../utils/questionHelpers';
import { MCQRenderer } from './MCQRenderer';
import { TrueFalseRenderer } from './TrueFalseRenderer';
import { ShortAnswerRenderer } from './ShortAnswerRenderer';
import type { AssessmentQuestionItem } from '../../types/assessment.types';

interface QuestionRendererProps {
  question: AssessmentQuestionItem | {
    questionId: string;
    questionText: string;
    questionType?: string;
    options?: Record<string, unknown>;
  };
  studentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionRenderer(props: QuestionRendererProps) {
  const type = resolveQuestionType(props.question);

  switch (type) {
    case 'TRUE_FALSE':
      return <TrueFalseRenderer {...props} />;
    case 'SHORT_ANSWER':
      return <ShortAnswerRenderer {...props} />;
    case 'MULTIPLE_CHOICE':
    default:
      return <MCQRenderer {...props} />;
  }
}
