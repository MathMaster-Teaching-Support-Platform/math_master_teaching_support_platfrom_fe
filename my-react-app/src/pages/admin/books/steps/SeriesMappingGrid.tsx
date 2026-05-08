import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import React from 'react';

interface BookRangeRow {
  bookId: string;
  bookTitle: string;
  from: number | null;
  to: number | null;
  mappedLessonCount: number;
}

interface BookRangeConflictView {
  from: number;
  to: number;
  otherBookTitle: string;
}

interface Props {
  rows: BookRangeRow[];
  conflictsByBookId: Map<string, BookRangeConflictView[]>;
}

const SeriesMappingGrid: React.FC<Props> = ({ rows, conflictsByBookId }) => {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b">
        Mapping toàn series theo khoảng trang OCR
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
            <tr className="text-slate-500 text-xs">
              <th className="text-left px-3 py-2 font-semibold">Book</th>
              <th className="text-left px-3 py-2 font-semibold">OCR page from</th>
              <th className="text-left px-3 py-2 font-semibold">OCR page to</th>
              <th className="text-left px-3 py-2 font-semibold">Số bài map</th>
              <th className="text-left px-3 py-2 font-semibold">Trạng thái overlap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const conflicts = conflictsByBookId.get(row.bookId) ?? [];
              const hasConflict = conflicts.length > 0;
              return (
                <tr key={row.bookId} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-800">{row.bookTitle}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.from ?? '-'}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.to ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{row.mappedLessonCount}</td>
                  <td className="px-3 py-2">
                    {hasConflict ? (
                      <div className="text-xs text-red-700 space-y-1">
                        {conflicts.map((c, idx) => (
                          <div key={`${row.bookId}-${idx}`} className="flex items-start gap-1">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <span>
                              Trang {c.from}-{c.to} trùng với <strong>{c.otherBookTitle}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                        <CheckCircle2 size={12} /> Không trùng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SeriesMappingGrid;
