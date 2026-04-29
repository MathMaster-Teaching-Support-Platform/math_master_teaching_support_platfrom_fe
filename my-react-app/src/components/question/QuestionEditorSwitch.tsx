import type { QuestionType } from '../../types/question';
import { MCQEditor } from './MCQEditor';
import { TrueFalseEditor } from './TrueFalseEditor';
import { ShortAnswerEditor } from './ShortAnswerEditor';

interface QuestionEditorSwitchProps {
  type: QuestionType;
  value: {
    questionText?: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    generationMetadata?: Record<string, unknown>;
    [key: string]: unknown;
  };
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function QuestionEditorSwitch({ type, value, onChange, disabled }: QuestionEditorSwitchProps) {
  switch (type) {
    case 'TRUE_FALSE':
      return <TrueFalseEditor value={value} onChange={onChange} disabled={disabled} />;
    case 'SHORT_ANSWER':
      return <ShortAnswerEditor value={value} onChange={onChange} disabled={disabled} />;
    case 'MULTIPLE_CHOICE':
    default:
      return <MCQEditor value={value} onChange={onChange} disabled={disabled} />;
  }
}
