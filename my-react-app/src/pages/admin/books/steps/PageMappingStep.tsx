import { AlertCircle, ListTree, Loader2, Save, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useBookPageMapping, useSavePageMapping } from '../../../../hooks/useBooks';
import { useChaptersBySubject } from '../../../../hooks/useChapters';
import { useLessonsByChapter } from '../../../../hooks/useLessons';
import type { BookResponse, PageMappingItem } from '../../../../types/book.types';

interface Props {
  book: BookResponse;
  onNext: () => void;
  onBack: () => void;
}

interface DraftItem {
  lessonId: string;
  lessonTitle: string;
  chapterId: string;
  chapterTitle: string;
  pageStart: number | '';
  pageEnd: number | '';
}

const PageMappingStep: React.FC<Props> = ({ book }) => {
  const mappingQuery = useBookPageMapping(book.id);
  const chapters = useChaptersBySubject(book.subjectId);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const lessons = useLessonsByChapter(activeChapterId, '', Boolean(activeChapterId));
  const saveMapping = useSavePageMapping(book.id);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Hydrate draft from server-side mapping
  useEffect(() => {
    if (!mappingQuery.data?.result) return;
    setDraft(
      mappingQuery.data.result.map((m) => ({
        lessonId: m.lessonId,
        lessonTitle: m.lessonTitle,
        chapterId: m.chapterId,
        chapterTitle: m.chapterTitle,
        pageStart: m.pageStart,
        pageEnd: m.pageEnd,
      }))
    );
  }, [mappingQuery.data]);

  // Default activeChapter to the first chapter once loaded
  useEffect(() => {
    if (!activeChapterId && chapters.data?.result?.length) {
      setActiveChapterId(chapters.data.result[0].id);
    }
  }, [chapters.data, activeChapterId]);

  const draftByLesson = useMemo(() => {
    const m = new Map<string, DraftItem>();
    draft.forEach((d) => m.set(d.lessonId, d));
    return m;
  }, [draft]);

  const mappedCountByChapter = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of draft) {
      m.set(d.chapterId, (m.get(d.chapterId) ?? 0) + 1);
    }
    return m;
  }, [draft]);

  const upsertDraft = (item: DraftItem) => {
    setDraft((prev) => {
      const existing = prev.findIndex((p) => p.lessonId === item.lessonId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = item;
        return next;
      }
      return [...prev, item];
    });
  };

  const removeDraft = (lessonId: string) => {
    setDraft((prev) => prev.filter((p) => p.lessonId !== lessonId));
  };

  const validate = (): { ok: boolean; message?: string } => {
    if (draft.length === 0) return { ok: false, message: 'Cần ít nhất 1 bài học được mapping.' };
    const ocrFrom = book.ocrPageFrom ?? 1;
    const ocrTo = book.ocrPageTo ?? Number.MAX_SAFE_INTEGER;
    for (const d of draft) {
      if (d.pageStart === '' || d.pageEnd === '') {
        return { ok: false, message: `Lesson "${d.lessonTitle}" thiếu khoảng trang.` };
      }
      const ps = Number(d.pageStart);
      const pe = Number(d.pageEnd);
      if (ps < 1 || pe < 1) return { ok: false, message: 'Số trang phải >= 1.' };
      if (pe < ps) return { ok: false, message: `"${d.lessonTitle}": pageEnd < pageStart.` };
      if (ps < ocrFrom || pe > ocrTo) {
        return {
          ok: false,
          message: `"${d.lessonTitle}": ngoài khoảng OCR (${ocrFrom}–${ocrTo}).`,
        };
      }
    }
    return { ok: true };
  };

  const handleSave = async () => {
    setError(null);
    const v = validate();
    if (!v.ok) {
      setError(v.message ?? 'Mapping không hợp lệ.');
      return;
    }
    const mappings: PageMappingItem[] = draft.map((d) => ({
      lessonId: d.lessonId,
      pageStart: Number(d.pageStart),
      pageEnd: Number(d.pageEnd),
    }));
    try {
      await saveMapping.mutateAsync({ mappings });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi lưu mapping.');
    }
  };

  const isSaving = saveMapping.isPending;
  const lessonsList = lessons.data?.result ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ListTree size={18} /> Bước 2 · Mapping bài học
        </h2>
        <p className="text-sm text-slate-500">
          Chọn chương → nhập khoảng trang cho từng bài. Khoảng OCR đã thiết lập:{' '}
          <strong>
            {book.ocrPageFrom ?? '?'}–{book.ocrPageTo ?? '?'}
          </strong>
          . Chỉ những bài bạn nhập trang mới thuộc sách này và được OCR.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5" /> {error}
        </div>
      )}

      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        {/* Chapter list */}
        <aside className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b">
            Chương
          </div>
          <div className="px-3 py-2 text-[11px] text-slate-500 border-b bg-white">
            Môn có thể có nhiều chương, bạn chỉ cần mapping các chương có trong sách hiện tại.
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {chapters.isLoading && (
              <li className="px-3 py-2 text-xs text-slate-400">
                <Loader2 size={12} className="inline animate-spin mr-1" /> Đang tải…
              </li>
            )}
            {(chapters.data?.result ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveChapterId(c.id)}
                  className={[
                    'w-full text-left px-3 py-2 text-sm border-l-4 transition',
                    activeChapterId === c.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-transparent hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.title}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                        (mappedCountByChapter.get(c.id) ?? 0) > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {mappedCountByChapter.get(c.id) ?? 0}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Lesson editor */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b flex justify-between">
            <span>Bài học trong chương</span>
            <span>{draft.length} bài đã mapping</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {lessons.isLoading && (
              <div className="px-3 py-3 text-xs text-slate-400">
                <Loader2 size={12} className="inline animate-spin mr-1" /> Đang tải…
              </div>
            )}
            {!lessons.isLoading && lessonsList.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-400">Chương này chưa có bài học.</div>
            )}
            {lessonsList.map((l) => {
              const current = draftByLesson.get(l.id);
              return (
                <div key={l.id} className="px-3 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{l.title}</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="Từ"
                    value={current?.pageStart ?? ''}
                    onChange={(e) =>
                      upsertDraft({
                        lessonId: l.id,
                        lessonTitle: l.title ?? '',
                        chapterId: activeChapterId,
                        chapterTitle:
                          chapters.data?.result.find((c) => c.id === activeChapterId)?.title ?? '',
                        pageStart: e.target.value === '' ? '' : Number(e.target.value),
                        pageEnd: current?.pageEnd ?? '',
                      })
                    }
                    className="w-20 px-2 py-1 text-sm rounded border border-slate-300"
                  />
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Đến"
                    value={current?.pageEnd ?? ''}
                    onChange={(e) =>
                      upsertDraft({
                        lessonId: l.id,
                        lessonTitle: l.title ?? '',
                        chapterId: activeChapterId,
                        chapterTitle:
                          chapters.data?.result.find((c) => c.id === activeChapterId)?.title ?? '',
                        pageStart: current?.pageStart ?? '',
                        pageEnd: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-20 px-2 py-1 text-sm rounded border border-slate-300"
                  />
                  {current && (
                    <button
                      type="button"
                      onClick={() => removeDraft(l.id)}
                      title="Xoá mapping"
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mapped summary */}
      <div className="border border-slate-200 rounded-lg">
        <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b">
          Tổng kết mapping ({draft.length})
        </div>
        <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
          {draft.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-400">Chưa có bài nào được mapping.</div>
          )}
          {draft.map((d) => (
            <div key={d.lessonId} className="px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-slate-700">
                <span className="text-slate-400 mr-2">{d.chapterTitle}</span> {d.lessonTitle}
              </span>
              <span className="font-mono text-xs text-slate-500">
                p{d.pageStart}–p{d.pageEnd}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || draft.length === 0}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Lưu mapping
        </button>
      </div>
    </div>
  );
};

export default PageMappingStep;
