import type { AnswerGradeResponse } from '../../types/grading.types';
import MathText from '../common/MathText';
import { ResultVerdictLabeled } from './ResultVerdict';

interface ShortAnswerResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
}

export function ShortAnswerResult({ answer, questionText }: ShortAnswerResultProps) {
  const isCorrect = answer.pointsEarned === answer.maxPoints;

  return (
    <div className="flex flex-col gap-3">
      {questionText ? (
        <div className="mb-1 text-base leading-relaxed text-neutral-800">
          <MathText text={questionText} />
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-neutral-500">Đáp án của bạn:</span>
          <span
            className={`rounded-lg border-2 bg-white px-3 py-2 text-lg font-bold ${
              isCorrect ? 'border-emerald-600 text-emerald-800' : 'border-red-600 text-red-800'
            }`}
          >
            {answer.answerText || '(Chưa trả lời)'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-neutral-500">Đáp án đúng:</span>
          <span className="rounded-lg border-2 border-emerald-600 bg-white px-3 py-2 text-lg font-bold text-emerald-800">
            {answer.correctAnswer}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-2">
          <ResultVerdictLabeled correct={isCorrect} />
        </div>
      </div>

      <div
        className={`flex w-fit items-center gap-2 rounded-lg border px-4 py-3 ${
          isCorrect ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white'
        }`}
      >
        <span className="font-semibold text-neutral-600">Điểm:</span>
        <span className={`text-xl font-bold tabular-nums ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
          {answer.pointsEarned}/{answer.maxPoints}
        </span>
      </div>
    </div>
  );
}
