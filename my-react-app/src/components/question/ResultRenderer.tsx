import { resolveQuestionType } from '../../utils/questionHelpers';
import { MCQResult } from './MCQResult';
import { TrueFalseResult } from './TrueFalseResult';
import { ShortAnswerResult } from './ShortAnswerResult';
import type { AnswerGradeResponse } from '../../types/grading.types';

interface ResultRendererProps {
  answer: AnswerGradeResponse;
  questionText?: string;
  options?: Record<string, string>;
}

export function ResultRenderer(props: ResultRendererProps) {
  const type = resolveQuestionType(props.answer);

  switch (type) {
    case 'TRUE_FALSE':
      return <TrueFalseResult {...props} />;
    case 'SHORT_ANSWER':
      return <ShortAnswerResult {...props} />;
    case 'MULTIPLE_CHOICE':
    default:
      return <MCQResult {...props} />;
  }
}
