import { Check, X } from 'lucide-react';

/** Compact icon-only verdict (e.g. table cells). */
export function ResultVerdictIcon({ correct }: { readonly correct: boolean }) {
  return correct ? (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
      title="Đúng"
    >
      <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden />
    </span>
  ) : (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm shadow-red-600/20"
      title="Sai"
    >
      <X className="h-4 w-4" strokeWidth={2.75} aria-hidden />
    </span>
  );
}

/** Label + icon row for MCQ / short answer blocks. */
export function ResultVerdictLabeled({ correct }: { readonly correct: boolean }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      {correct ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
          <Check className="h-[22px] w-[22px]" strokeWidth={2.75} aria-hidden />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-600/25">
          <X className="h-[22px] w-[22px]" strokeWidth={2.75} aria-hidden />
        </span>
      )}
      <span
        className={`font-[Be_Vietnam_Pro] text-[14px] font-semibold ${correct ? 'text-emerald-800' : 'text-red-800'}`}
      >
        {correct ? 'Đúng' : 'Sai'}
      </span>
    </div>
  );
}
