import type { AnswerGradeResponse } from '../../types/grading.types';
import MathText from '../common/MathText';
import { extractOptionText } from '../../utils/optionText';
import { ResultVerdictLabeled } from './ResultVerdict';

interface MCQResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
  options?: Record<string, unknown>;
}

export function MCQResult({ answer, questionText, options }: MCQResultProps) {
  const isCorrect = answer.pointsEarned === answer.maxPoints;

  return (
    <div className="flex flex-col gap-3">
      {questionText ? (
        <div className="mb-1 text-base leading-relaxed text-neutral-800">
          <MathText text={questionText} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-neutral-500">Đáp án của bạn:</span>
          <span
            className={`rounded-lg border px-3 py-1 text-sm font-semibold bg-white ${
              isCorrect ? 'border-emerald-300 text-emerald-800' : 'border-red-300 text-red-800'
            }`}
          >
            {answer.answerText || '(Chưa trả lời)'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-neutral-500">Đáp án đúng:</span>
          <span className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-800">
            {answer.correctAnswer}
          </span>
        </div>

        <ResultVerdictLabeled correct={isCorrect} />
      </div>

      <div className="flex w-fit items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <span className="text-sm font-semibold text-neutral-600">Điểm:</span>
        <span
          className={`text-lg font-bold tabular-nums ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}
        >
          {answer.pointsEarned}/{answer.maxPoints}
        </span>
      </div>

      {options ? (
        <div className="mt-1 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-neutral-700">Các lựa chọn:</div>
          <div className="flex flex-col gap-1.5">
            {Object.entries(options).map(([key, text]) => (
              <div key={key} className="text-sm text-neutral-600">
                <strong className="text-neutral-800">{key}.</strong>{' '}
                <MathText text={extractOptionText(text)} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
