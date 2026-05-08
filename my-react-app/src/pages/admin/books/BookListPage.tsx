import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  PenSquare,
  Trash2,
  PlayCircle,
  ListTree,
  RefreshCw,
  BookOpenText,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../../data/mockData';
import { useBookList, useDeleteBook } from '../../../hooks/useBooks';
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
  const deleteBook = useDeleteBook();

  const allBooks: BookResponse[] = useMemo(
    () => data?.result?.content ?? [],
    [data]
  );
  const dedupedBooks = useMemo(() => {
    const normalize = (value: string | null | undefined) =>
      (value ?? '').trim().toLowerCase();

    const byIdentity = new Map<string, BookResponse>();
    for (const b of allBooks) {
      const identityKey = [
        b.schoolGradeId ?? '',
        b.subjectId ?? '',
        normalize(b.title),
        normalize(b.publisher),
        normalize(b.academicYear),
      ].join('|');

      const current = byIdentity.get(identityKey);
      if (!current) {
        byIdentity.set(identityKey, b);
        continue;
      }

      const currentTime = new Date(current.createdAt ?? 0).getTime();
      const nextTime = new Date(b.createdAt ?? 0).getTime();
      if (nextTime >= currentTime) {
        byIdentity.set(identityKey, b);
      }
    }
    return Array.from(byIdentity.values());
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return dedupedBooks;
    return dedupedBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(k) ||
        (b.publisher ?? '').toLowerCase().includes(k) ||
        (b.academicYear ?? '').toLowerCase().includes(k)
    );
  }, [dedupedBooks, keyword]);

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

  const handleDelete = async (book: BookResponse) => {
    if (!confirm(`Xoá sách "${book.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteBook.mutateAsync(book.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi khi xoá sách.');
    }
  };

  const goToWizard = (book: BookResponse) => {
    navigate(`/admin/books/${book.id}/wizard`);
  };

  return (
    <DashboardLayout role="admin" user={mockAdmin} contentClassName="dashboard-content--flush-bleed">
      <div className="px-6 py-8 lg:px-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
              <BookOpenText size={20} />
            </div>
            <div>
              <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                Sách giáo khoa
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                Quản lý sách: tạo mới, mapping bài học, chạy OCR và xác minh nội dung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/books/new')}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Thêm sách
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
              {totalElements > 0
                ? `${filteredBooks.length} sách hiển thị`
                : 'Chưa có sách phù hợp'}
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

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải…
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Không có sách phù hợp. Bấm "Thêm sách" để tạo mới.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Tên sách</th>
                  <th className="text-left px-4 py-2 font-semibold">Khối · Môn · CT</th>
                  <th className="text-left px-4 py-2 font-semibold">Trang</th>
                  <th className="text-left px-4 py-2 font-semibold">Mapping</th>
                  <th className="text-left px-4 py-2 font-semibold">Trạng thái</th>
                  <th className="text-left px-4 py-2 font-semibold">Verify</th>
                  <th className="text-right px-4 py-2 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => goToWizard(b)}
                        className="text-left"
                      >
                        <div className="font-medium text-slate-800 hover:text-blue-700">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.publisher ?? '—'} · {b.academicYear ?? '—'}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{b.schoolGradeName}</div>
                      <div className="text-slate-400">
                        {b.subjectName} · {b.curriculumName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{b.totalPages ?? '?'} trang</div>
                      <div className="text-slate-400">
                        OCR {b.ocrPageFrom ?? '?'}–{b.ocrPageTo ?? '?'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <ListTree size={12} className="text-slate-400" />
                        {b.mappedLessonCount} bài
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${STATUS_TONE[b.status]}`}
                      >
                        {b.status === 'OCR_RUNNING' && (
                          <Loader2 size={10} className="animate-spin" />
                        )}
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.verified ? (
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
                        {b.status === 'OCR_DONE' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/books/${b.id}/wizard`)}
                            title="Xác minh nội dung"
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {b.status !== 'OCR_DONE' && b.status !== 'OCR_RUNNING' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/books/${b.id}/wizard`)}
                            title="Tiếp tục thiết lập"
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <PlayCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/books/${b.id}/wizard`)}
                          title="Sửa metadata"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                        >
                          <PenSquare size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          title="Xoá"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500"
                          disabled={deleteBook.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
    </DashboardLayout>
  );
};

export default BookListPage;
