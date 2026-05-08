import { AlertCircle, ListTree, Loader2, Save, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  useBookList,
  useBookSeriesPageMapping,
  useSaveSeriesPageMapping,
} from '../../../../hooks/useBooks';
import { useChaptersBySubject } from '../../../../hooks/useChapters';
import { useLessonsByChapter } from '../../../../hooks/useLessons';
import type { BookResponse, SeriesPageMappingItem } from '../../../../types/book.types';
import {
  toSeriesRangeRows,
} from '../../../../utils/seriesMappingOverlap';
import SeriesMappingGrid from './SeriesMappingGrid';

interface Props {
  book: BookResponse;
}

interface DraftItem {
  lessonId: string;
  lessonTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrderIndex: number | null;
  lessonOrderIndex: number | null;
  bookId: string;
  pageStart: number | '';
  pageEnd: number | '';
}

const CURRICULUM_SORT_FALLBACK = 999999;

function sortDraftByCurriculum(a: DraftItem, b: DraftItem): number {
  const ca = a.chapterOrderIndex ?? CURRICULUM_SORT_FALLBACK;
  const cb = b.chapterOrderIndex ?? CURRICULUM_SORT_FALLBACK;
  if (ca !== cb) return ca - cb;
  const la = a.lessonOrderIndex ?? CURRICULUM_SORT_FALLBACK;
  const lb = b.lessonOrderIndex ?? CURRICULUM_SORT_FALLBACK;
  return la - lb;
}

function validateSeriesOrderingPerBook(
  draft: DraftItem[],
  seriesBookNameMap: Map<string, string>
): { ok: boolean; message?: string } {
  const byBook = new Map<string, DraftItem[]>();
  for (const d of draft) {
    if (
      !d.bookId ||
      d.pageStart === '' ||
      d.pageEnd === '' ||
      Number(d.pageEnd) < Number(d.pageStart)
    ) {
      continue;
    }
    const list = byBook.get(d.bookId) ?? [];
    list.push(d);
    byBook.set(d.bookId, list);
  }
  for (const [, rows] of byBook) {
    const sorted = [...rows].sort(sortDraftByCurriculum);
    for (let i = 1; i < sorted.length; i++) {
      const prevRow = sorted[i - 1];
      const curRow = sorted[i];
      const prevEnd = Number(prevRow.pageEnd);
      const curStart = Number(curRow.pageStart);
      if (curStart < prevEnd) {
        const bookTitle = seriesBookNameMap.get(curRow.bookId) ?? curRow.bookId;
        return {
          ok: false,
          message: `Trên "${bookTitle}", sau bài "${prevRow.lessonTitle}" (đến tr.${prevEnd}), bài "${curRow.lessonTitle}" không được bắt đầu trước tr.${prevEnd} (hiện tr.${curStart}).`,
        };
      }
    }
  }
  return { ok: true };
}

function validateDraftRowsShape(
  draft: DraftItem[],
  seriesBooks: BookResponse[],
  book: BookResponse
): { ok: boolean; message?: string } {
  const knownBookIds = new Set(seriesBooks.map((b) => b.id));
  const ocrFrom = book.ocrPageFrom ?? 1;
  const ocrTo = book.ocrPageTo ?? Number.MAX_SAFE_INTEGER;
  for (const d of draft) {
    if (!d.bookId || !knownBookIds.has(d.bookId)) {
      return { ok: false, message: `Lesson "${d.lessonTitle}" chưa chọn sách/tập.` };
    }
    if (d.pageStart === '' || d.pageEnd === '') {
      return { ok: false, message: `Lesson "${d.lessonTitle}" thiếu khoảng trang.` };
    }
    const ps = Number(d.pageStart);
    const pe = Number(d.pageEnd);
    if (ps < 1 || pe < 1) return { ok: false, message: 'Số trang phải >= 1.' };
    if (pe < ps) return { ok: false, message: `"${d.lessonTitle}": pageEnd < pageStart.` };
    const selectedBook = seriesBooks.find((b) => b.id === d.bookId);
    const selectedFrom = selectedBook?.ocrPageFrom ?? ocrFrom;
    const selectedTo = selectedBook?.ocrPageTo ?? ocrTo;
    if (ps < selectedFrom || pe > selectedTo) {
      return {
        ok: false,
        message: `"${d.lessonTitle}": ngoài khoảng OCR của sách đã chọn (${selectedFrom}–${selectedTo}).`,
      };
    }
  }
  return { ok: true };
}

const PageMappingStep: React.FC<Props> = ({ book }) => {
  const mappingQuery = useBookSeriesPageMapping(book.id);
  const seriesBooksQuery = useBookList({
    bookSeriesId: book.bookSeriesId ?? undefined,
    page: 0,
    size: 100,
  });
  const chapters = useChaptersBySubject(book.subjectId);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const lessons = useLessonsByChapter(activeChapterId, '', Boolean(activeChapterId));
  const saveMapping = useSaveSeriesPageMapping(book.id);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seriesBooks = useMemo(
    () => seriesBooksQuery.data?.result?.content ?? [],
    [seriesBooksQuery.data]
  );
  const seriesBookNameMap = useMemo(
    () => new Map(seriesBooks.map((b) => [b.id, b.title])),
    [seriesBooks]
  );

  // Hydrate draft from server-side mapping
  useEffect(() => {
    if (!mappingQuery.data?.result) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(
      mappingQuery.data.result.map((m) => ({
        lessonId: m.lessonId,
        lessonTitle: m.lessonTitle,
        chapterId: m.chapterId,
        chapterTitle: m.chapterTitle,
        chapterOrderIndex: m.chapterOrderIndex ?? null,
        lessonOrderIndex: m.lessonOrderIndex ?? null,
        bookId: m.bookId,
        pageStart: m.pageStart,
        pageEnd: m.pageEnd,
      }))
    );
  }, [mappingQuery.data]);

  // Default activeChapter to the first chapter once loaded
  useEffect(() => {
    if (!activeChapterId && chapters.data?.result?.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChapterId(chapters.data.result[0].id);
    }
  }, [chapters.data, activeChapterId]);

  const draftByLesson = useMemo(() => {
    const m = new Map<string, DraftItem>();
    draft.forEach((d) => m.set(d.lessonId, d));
    return m;
  }, [draft]);

  const savedDraft = useMemo(() => {
    return (mappingQuery.data?.result ?? []).map((m) => ({
      lessonId: m.lessonId,
      lessonTitle: m.lessonTitle,
      chapterId: m.chapterId,
      chapterTitle: m.chapterTitle,
      chapterOrderIndex: m.chapterOrderIndex ?? null,
      lessonOrderIndex: m.lessonOrderIndex ?? null,
      bookId: m.bookId,
      pageStart: m.pageStart,
      pageEnd: m.pageEnd,
    }));
  }, [mappingQuery.data]);
  const savedByLesson = useMemo(() => {
    const m = new Map<string, DraftItem>();
    savedDraft.forEach((item) => m.set(item.lessonId, item));
    return m;
  }, [savedDraft]);

  const mappedCountByChapter = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of draft) {
      const isMapped =
        Boolean(d.bookId) &&
        d.pageStart !== '' &&
        d.pageEnd !== '' &&
        Number(d.pageStart) >= 1 &&
        Number(d.pageEnd) >= Number(d.pageStart);
      if (!isMapped) continue;
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

  const rotateLessonBook = (
    lessonId: string,
    lessonTitle: string,
    chapterId: string,
    chapterTitle: string,
    chapterOrderIndex: number | null,
    lessonOrderIndex: number | null
  ) => {
    if (seriesBooks.length === 0) return;
    setDraft((prev) => {
      const existing = prev.find((item) => item.lessonId === lessonId);
      const currentBookId = existing?.bookId ?? savedByLesson.get(lessonId)?.bookId ?? book.id;
      const currentIdx = seriesBooks.findIndex((seriesBook) => seriesBook.id === currentBookId);
      const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % seriesBooks.length : 0;
      const nextBookId = seriesBooks[nextIdx]?.id ?? book.id;
      if (!existing) {
        return [
          ...prev,
          {
            lessonId,
            lessonTitle,
            chapterId,
            chapterTitle,
            chapterOrderIndex,
            lessonOrderIndex,
            bookId: nextBookId,
            pageStart: '',
            pageEnd: '',
          },
        ];
      }
      return prev.map((item) =>
        item.lessonId === lessonId
          ? {
              ...item,
              bookId: nextBookId,
              chapterOrderIndex: chapterOrderIndex ?? item.chapterOrderIndex,
              lessonOrderIndex: lessonOrderIndex ?? item.lessonOrderIndex,
            }
          : item
      );
    });
  };

  const editableDraft = draft;

  const seriesRangeRows = useMemo(() => {
    return toSeriesRangeRows(
      seriesBooks,
      savedDraft
        .filter(
          (d) =>
            typeof d.pageStart === 'number' &&
            typeof d.pageEnd === 'number' &&
            Number.isFinite(d.pageStart) &&
            Number.isFinite(d.pageEnd) &&
            d.pageEnd >= d.pageStart
        )
        .map((d) => ({
          bookId: d.bookId,
          pageStart: d.pageStart,
          pageEnd: d.pageEnd,
        }))
    );
  }, [seriesBooks, savedDraft]);

  const conflictMessageByBookId = useMemo(
    () => new Map<string, Array<{ from: number; to: number; otherBookTitle: string }>>(),
    []
  );

  const validate = (): { ok: boolean; message?: string } => {
    if (draft.length === 0) return { ok: false, message: 'Cần ít nhất 1 bài học được mapping.' };
    const shape = validateDraftRowsShape(draft, seriesBooks, book);
    if (!shape.ok) return shape;
    return validateSeriesOrderingPerBook(draft, seriesBookNameMap);
  };

  const handleSave = async () => {
    setError(null);
    const v = validate();
    if (!v.ok) {
      setError(v.message ?? 'Mapping không hợp lệ.');
      return;
    }
    // Always submit full series mapping so switching books never wipes previous assignments.
    const mappings: SeriesPageMappingItem[] = draft.map((d) => ({
      lessonId: d.lessonId,
      bookId: d.bookId,
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
  const hasBlockingConflicts = false;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ListTree size={18} /> Bước 2 · Mapping bài học
        </h2>
        <p className="text-sm text-slate-500">
          Chọn chương → chọn tập sách + nhập khoảng trang cho từng bài. Khoảng OCR của sách hiện
          tại:{' '}
          <strong>
            {book.ocrPageFrom ?? '?'}–{book.ocrPageTo ?? '?'}
          </strong>{' '}
          Mỗi bài chỉ gán cho 1 tập trong cùng bộ sách.
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
                    'w-full text-left px-3 py-2 text-sm border-l transition',
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
              const activeChapter = chapters.data?.result.find((c) => c.id === activeChapterId);
              const chapterOrderIdx = activeChapter?.orderIndex ?? null;
              const lessonOrderIdx = l.orderIndex ?? null;
              const current = draftByLesson.get(l.id);
              const savedCurrent = savedByLesson.get(l.id);
              const mappedBookTitle = savedCurrent?.bookId
                ? seriesBookNameMap.get(savedCurrent.bookId)
                : undefined;
              const draftBookTitle = current?.bookId ? seriesBookNameMap.get(current.bookId) : undefined;
              const isPendingBookChange = Boolean(
                current?.bookId && savedCurrent?.bookId && current.bookId !== savedCurrent.bookId
              );
              return (
                <div key={l.id} className="px-3 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{l.title}</div>
                    {savedCurrent?.bookId && (
                      <div className="mt-1 text-[11px] text-emerald-700">
                        Đã map:{' '}
                        <span className="font-medium">{mappedBookTitle ?? savedCurrent.bookId}</span>
                      </div>
                    )}
                    {isPendingBookChange && (
                      <div className="mt-1 text-[11px] text-blue-700">
                        Sẽ lưu thành:{' '}
                        <span className="font-medium">{draftBookTitle ?? current?.bookId}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-44 px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50 text-slate-700">
                    {draftBookTitle ?? mappedBookTitle ?? 'Chưa map'}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      rotateLessonBook(
                        l.id,
                        l.title ?? '',
                        activeChapterId,
                        activeChapter?.title ?? '',
                        chapterOrderIdx,
                        lessonOrderIdx
                      )
                    }
                    className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    title="Đổi bài này sang cuốn kế tiếp"
                  >
                    Đổi cuốn
                  </button>
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
                        chapterTitle: activeChapter?.title ?? '',
                        chapterOrderIndex:
                          current?.chapterOrderIndex ??
                          savedCurrent?.chapterOrderIndex ??
                          chapterOrderIdx,
                        lessonOrderIndex:
                          current?.lessonOrderIndex ?? savedCurrent?.lessonOrderIndex ?? lessonOrderIdx,
                        bookId: current?.bookId ?? savedCurrent?.bookId ?? book.id,
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
                        chapterTitle: activeChapter?.title ?? '',
                        chapterOrderIndex:
                          current?.chapterOrderIndex ??
                          savedCurrent?.chapterOrderIndex ??
                          chapterOrderIdx,
                        lessonOrderIndex:
                          current?.lessonOrderIndex ?? savedCurrent?.lessonOrderIndex ?? lessonOrderIdx,
                        bookId: current?.bookId ?? savedCurrent?.bookId ?? book.id,
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

      <SeriesMappingGrid rows={seriesRangeRows} conflictsByBookId={conflictMessageByBookId} />

      {/* Mapped summary */}
      <div className="border border-slate-200 rounded-lg">
        <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b">
          Tổng kết mapping ({savedDraft.length})
        </div>
        <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
          {savedDraft.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-400">Chưa có bài nào được mapping.</div>
          )}
          {savedDraft.map((d) => (
            <div key={d.lessonId} className="px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-slate-700">
                <span className="text-slate-400 mr-2">{d.chapterTitle}</span> {d.lessonTitle}
              </span>
              <span className="font-mono text-xs text-slate-500 text-right">
                <span className="block text-[10px] text-slate-400">
                  {seriesBookNameMap.get(d.bookId) ?? 'Chưa chọn tập'}
                </span>
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
          disabled={isSaving || editableDraft.length === 0 || hasBlockingConflicts}
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
