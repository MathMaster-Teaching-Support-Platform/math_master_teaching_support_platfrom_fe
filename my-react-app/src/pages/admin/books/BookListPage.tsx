import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  ListTree,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  FolderOpen,
  Pencil,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../../data/mockData';
import { useBookList, useRenameBookSeries } from '../../../hooks/useBooks';
import { useChaptersBySubject } from '../../../hooks/useChapters';
import { useGrades } from '../../../hooks/useGrades';
import { useLessonsByChapter } from '../../../hooks/useLessons';
import { useSubjectsByGrade } from '../../../hooks/useSubjects';
import type { BookResponse, BookStatus } from '../../../types/book.types';

const STATUS_OPTIONS: Array<{ value: BookStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'MAPPING', label: 'Đang mapping' },
  { value: 'READY', label: 'Sẵn sàng OCR' },
  { value: 'OCR_RUNNING', label: 'Đang OCR' },
  { value: 'OCR_DONE', label: 'OCR hoàn tất' },
  { value: 'OCR_FAILED', label: 'OCR thất bại' },
];

const STATUS_TONE: Record<BookStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  MAPPING: 'bg-amber-50 text-amber-700 border-amber-200',
  READY: 'bg-blue-50 text-blue-700 border-blue-200',
  OCR_RUNNING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OCR_DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OCR_FAILED: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABEL: Record<BookStatus, string> = {
  DRAFT: 'Bản nháp',
  MAPPING: 'Đang mapping',
  READY: 'Sẵn sàng OCR',
  OCR_RUNNING: 'Đang OCR',
  OCR_DONE: 'OCR hoàn tất',
  OCR_FAILED: 'OCR thất bại',
};

const PAGE_SIZE = 20;

const BookListPage: React.FC = () => {
  const navigate = useNavigate();

  const [schoolGradeId, setSchoolGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [status, setStatus] = useState<BookStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [renameTarget, setRenameTarget] = useState<{ seriesId: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');

  const grades = useGrades();
  const gradeLevel = useMemo(() => {
    const g = grades.data?.result.find((row) => row.id === schoolGradeId);
    return g ? String(g.gradeLevel ?? g.level ?? '') : '';
  }, [grades.data, schoolGradeId]);
  const subjects = useSubjectsByGrade(gradeLevel, Boolean(gradeLevel));
  const chapters = useChaptersBySubject(subjectId, Boolean(subjectId));
  const lessons = useLessonsByChapter(chapterId, '', Boolean(chapterId));

  const params = useMemo(
    () => ({
      schoolGradeId: schoolGradeId || undefined,
      subjectId: subjectId || undefined,
      chapterId: chapterId || undefined,
      lessonId: lessonId || undefined,
      status: status || undefined,
      page: pageIndex,
      size: PAGE_SIZE,
    }),
    [schoolGradeId, subjectId, chapterId, lessonId, status, pageIndex]
  );

  const { data, isLoading, isFetching, refetch } = useBookList(params);
  const renameSeriesMutation = useRenameBookSeries();

  const allBooks: BookResponse[] = useMemo(() => data?.result?.content ?? [], [data]);
  const seriesRows = useMemo(() => {
    const bySeries = new Map<string, BookResponse[]>();
    for (const b of allBooks) {
      const key = b.bookSeriesId ?? b.id;
      const existing = bySeries.get(key) ?? [];
      existing.push(b);
      bySeries.set(key, existing);
    }
    return Array.from(bySeries.entries()).map(([seriesId, books]) => {
      const sortedBooks = [...books].sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
      const head = sortedBooks[0];
      const mappedLessonCount = sortedBooks.reduce((sum, item) => sum + (item.mappedLessonCount ?? 0), 0);
      const allVerified = sortedBooks.length > 0 && sortedBooks.every((item) => item.verified);
      const hasRunning = sortedBooks.some((item) => item.status === 'OCR_RUNNING');
      const hasFailed = sortedBooks.some((item) => item.status === 'OCR_FAILED');
      const allDone = sortedBooks.length > 0 && sortedBooks.every((item) => item.status === 'OCR_DONE');
      let status: BookStatus = head.status;
      if (hasRunning) {
        status = 'OCR_RUNNING';
      } else if (hasFailed) {
        status = 'OCR_FAILED';
      } else if (allDone) {
        status = 'OCR_DONE';
      }
      return {
        seriesId,
        books: sortedBooks,
        title: head.bookSeriesName || head.title,
        schoolGradeName: head.schoolGradeName,
        subjectName: head.subjectName,
        curriculumName: head.curriculumName,
        publisher: head.publisher,
        academicYear: head.academicYear,
        mappedLessonCount,
        verified: allVerified,
        status,
      };
    });
  }, [allBooks]);

  const filteredSeries = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return seriesRows;
    return seriesRows.filter(
      (s) =>
        s.title.toLowerCase().includes(k) ||
        (s.publisher ?? '').toLowerCase().includes(k) ||
        (s.academicYear ?? '').toLowerCase().includes(k)
    );
  }, [seriesRows, keyword]);

  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const handleResetFilters = () => {
    setSchoolGradeId('');
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setStatus('');
    setKeyword('');
    setPageIndex(0);
  };

  const goToWizard = (seriesId: string) => {
    navigate(`/admin/books/${seriesId}/wizard`);
  };

  const openRenameModal = (seriesId: string, currentTitle: string) => {
    setRenameTarget({ seriesId, title: currentTitle });
    setRenameValue(currentTitle);
    setRenameError('');
  };

  const closeRenameModal = () => {
    setRenameTarget(null);
    setRenameValue('');
    setRenameError('');
  };

  const handleSubmitRename = async () => {
    if (!renameTarget) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError('Tên bộ sách không được để trống.');
      return;
    }
    if (nextName === renameTarget.title.trim()) {
      closeRenameModal();
      return;
    }
    try {
      await renameSeriesMutation.mutateAsync({
        seriesId: renameTarget.seriesId,
        name: nextName,
      });
      closeRenameModal();
    } catch (error) {
      setRenameError(
        error instanceof Error ? error.message : 'Không thể đổi tên bộ sách. Vui lòng thử lại.'
      );
    }
  };

  return (
    <DashboardLayout
      role="admin"
      user={mockAdmin}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
              <BookOpenText size={20} />
            </div>
            <div>
              <h1 className="font-[Playfair_Display] text-[22px] text-[#141413]">
                Bộ sách giáo khoa
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                Quản lý theo bộ sách: thêm cuốn, mapping bài học, chạy OCR và xác minh nội dung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/books/new')}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Thêm bộ sách
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={schoolGradeId}
              onChange={(e) => {
                setSchoolGradeId(e.target.value);
                setSubjectId('');
                setChapterId('');
                setLessonId('');
                setPageIndex(0);
              }}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
            >
              <option value="">— Khối lớp —</option>
              {grades.data?.result.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setChapterId('');
                setLessonId('');
                setPageIndex(0);
              }}
              disabled={!schoolGradeId}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm disabled:bg-slate-50"
            >
              <option value="">— Môn học —</option>
              {subjects.data?.result?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={chapterId}
              onChange={(e) => {
                setChapterId(e.target.value);
                setLessonId('');
                setPageIndex(0);
              }}
              disabled={!subjectId}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm disabled:bg-slate-50"
            >
              <option value="">— Chương —</option>
              {chapters.data?.result?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={lessonId}
              onChange={(e) => {
                setLessonId(e.target.value);
                setPageIndex(0);
              }}
              disabled={!chapterId}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm disabled:bg-slate-50"
            >
              <option value="">— Bài học —</option>
              {lessons.data?.result?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as BookStatus | '');
                setPageIndex(0);
              }}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên, NXB, năm…"
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>
              {totalElements > 0 ? `${filteredSeries.length} bộ sách hiển thị` : 'Chưa có bộ sách phù hợp'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                {isFetching ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Làm mới
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-slate-600 hover:text-slate-900"
              >
                Xoá bộ lọc
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải…
          </div>
        )}
        {!isLoading && filteredSeries.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            Không có bộ sách phù hợp. Bấm "Thêm bộ sách" để tạo mới.
          </div>
        )}
        {!isLoading && filteredSeries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Bộ sách</th>
                  <th className="text-left px-4 py-2 font-semibold">Khối · Môn · CT</th>
                  <th className="text-left px-4 py-2 font-semibold">Số cuốn</th>
                  <th className="text-left px-4 py-2 font-semibold">Mapping</th>
                  <th className="text-left px-4 py-2 font-semibold">Trạng thái</th>
                  <th className="text-left px-4 py-2 font-semibold">Verify</th>
                  <th className="text-right px-4 py-2 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSeries.map((s) => (
                  <tr key={s.seriesId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => goToWizard(s.seriesId)} className="text-left">
                        <div className="font-medium text-slate-800 hover:text-blue-700">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {[s.publisher, s.academicYear]
                            .map((x) => (x == null ? '' : String(x).trim()))
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{s.schoolGradeName}</div>
                      <div className="text-slate-400">
                        {s.subjectName} · {s.curriculumName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{s.books.length} cuốn</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <ListTree size={12} className="text-slate-400" />
                        {s.mappedLessonCount} bài
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${STATUS_TONE[s.status]}`}
                      >
                        {s.status === 'OCR_RUNNING' && (
                          <Loader2 size={10} className="animate-spin" />
                        )}
                        {STATUS_LABEL[s.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 size={12} /> Đã xác minh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                          <AlertCircle size={12} /> Chưa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openRenameModal(s.seriesId, s.title)}
                          title="Đổi tên bộ sách"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/books/${s.seriesId}/wizard`)}
                          title="Mở wizard bộ sách"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                        >
                          <FolderOpen size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">
              Trang {pageIndex + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
                className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
                className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl p-5">
            <h2 className="text-lg font-semibold text-slate-900">Đổi tên bộ sách</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cập nhật tên hiển thị ở danh sách `/admin/books`.
            </p>
            <div className="mt-4">
              <label htmlFor="book-series-name" className="block text-sm text-slate-700 mb-1">
                Tên bộ sách
              </label>
              <input
                id="book-series-name"
                type="text"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError('');
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
                placeholder="Nhập tên bộ sách..."
                autoFocus
              />
              {renameError && <p className="mt-2 text-xs text-red-600">{renameError}</p>}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeRenameModal}
                className="px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitRename()}
                disabled={renameSeriesMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {renameSeriesMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang lưu...
                  </>
                ) : (
                  'Lưu tên bộ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BookListPage;
