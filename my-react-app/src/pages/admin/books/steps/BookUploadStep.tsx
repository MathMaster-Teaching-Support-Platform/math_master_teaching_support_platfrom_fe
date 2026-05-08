import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  useBookList,
  useCreateBook,
  useDeleteBook,
  useUpdateBook,
  useUploadBookPdf,
} from '../../../../hooks/useBooks';
import { useGrades } from '../../../../hooks/useGrades';
import { useSubjectsByGrade } from '../../../../hooks/useSubjects';
import { QbConfirmDialog } from '../../../../components/question-banks/qb-ui';
import type { BookResponse, CreateBookRequest } from '../../../../types/book.types';
import BookPdfPreview from '../BookPdfPreview';

interface Props {
  book?: BookResponse;
  onCreated: (bookId: string) => void;
  onSelectBook: (bookId: string) => void;
  onSwitchToNew: () => void;
  onUploaded: () => void;
}

const BookUploadStep: React.FC<Props> = ({
  book,
  onCreated,
  onSelectBook,
  onSwitchToNew,
  onUploaded,
}) => {
  const [schoolGradeId, setSchoolGradeId] = useState(book?.schoolGradeId ?? '');
  const [subjectId, setSubjectId] = useState(book?.subjectId ?? '');
  const [title, setTitle] = useState(book?.title ?? '');
  const [publisher, setPublisher] = useState(book?.publisher ?? '');
  const [academicYear, setAcademicYear] = useState(book?.academicYear ?? '');
  const [totalPages, setTotalPages] = useState<number | ''>(book?.totalPages ?? '');
  const [ocrPageFrom, setOcrPageFrom] = useState<number | ''>(book?.ocrPageFrom ?? '');
  const [ocrPageTo, setOcrPageTo] = useState<number | ''>(book?.ocrPageTo ?? '');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isAddingAnother, setIsAddingAnother] = useState(false);
  const [pendingDeleteBook, setPendingDeleteBook] = useState<BookResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const localPdfObjectUrl = useMemo(() => {
    if (!pdfFile) return null;
    return URL.createObjectURL(pdfFile);
  }, [pdfFile]);

  useEffect(() => {
    return () => {
      if (localPdfObjectUrl) URL.revokeObjectURL(localPdfObjectUrl);
    };
  }, [localPdfObjectUrl]);

  const grades = useGrades();
  const gradeLevel = useMemo(() => {
    const g = grades.data?.result.find((row) => row.id === schoolGradeId);
    return g ? String(g.gradeLevel ?? g.level ?? '') : '';
  }, [grades.data, schoolGradeId]);
  const subjects = useSubjectsByGrade(gradeLevel, Boolean(gradeLevel));

  const createBook = useCreateBook();
  const updateBook = useUpdateBook(book?.id ?? '');
  const deleteBook = useDeleteBook();
  const uploadPdf = useUploadBookPdf(isAddingAnother ? '' : (book?.id ?? ''));
  const relatedBooksQuery = useBookList({
    schoolGradeId: schoolGradeId || undefined,
    subjectId: subjectId || undefined,
    page: 0,
    size: 50,
  });

  const relatedBooks = useMemo(
    () =>
      (relatedBooksQuery.data?.result?.content ?? []).filter(
        (item) => item.schoolGradeId === schoolGradeId && item.subjectId === subjectId
      ),
    [relatedBooksQuery.data, schoolGradeId, subjectId]
  );

  const validate = (): string | null => {
    if (!schoolGradeId) return 'Vui lòng chọn khối lớp.';
    if (!subjectId) return 'Vui lòng chọn môn học.';
    if (!title.trim()) return 'Vui lòng nhập tên sách.';
    if (!totalPages) return 'Vui lòng nhập tổng số trang PDF.';
    if (!ocrPageFrom || !ocrPageTo) return 'Vui lòng nhập khoảng trang cần OCR.';
    if (Number(ocrPageFrom) < 1 || Number(ocrPageTo) < 1) return 'Số trang phải >= 1.';
    if (Number(ocrPageTo) < Number(ocrPageFrom)) return 'Trang kết thúc phải >= trang bắt đầu.';
    if (Number(ocrPageTo) > Number(totalPages)) return 'Trang kết thúc vượt quá tổng số trang.';
    return null;
  };

  const handleSaveMetadata = async () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const payload: CreateBookRequest = {
      schoolGradeId,
      subjectId,
      title: title.trim(),
      publisher: publisher.trim() || null,
      academicYear: academicYear.trim() || null,
      totalPages: Number(totalPages),
      ocrPageFrom: Number(ocrPageFrom),
      ocrPageTo: Number(ocrPageTo),
    };

    try {
      if (book?.id && !isAddingAnother) {
        await updateBook.mutateAsync({
          title: payload.title,
          publisher: payload.publisher ?? undefined,
          academicYear: payload.academicYear ?? undefined,
          totalPages: payload.totalPages ?? undefined,
          ocrPageFrom: payload.ocrPageFrom ?? undefined,
          ocrPageTo: payload.ocrPageTo ?? undefined,
        });
      } else {
        const res = await createBook.mutateAsync(payload);
        if (res.result?.id) {
          setIsAddingAnother(false);
          onCreated(res.result.id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi lưu thông tin sách.');
    }
  };

  const handleUpload = async () => {
    setError(null);
    if (!book?.id || isAddingAnother) {
      setError('Vui lòng lưu thông tin sách trước khi upload PDF.');
      return;
    }
    if (!pdfFile) {
      setError('Vui lòng chọn file PDF.');
      return;
    }
    try {
      await uploadPdf.mutateAsync(pdfFile);
      setPdfFile(null);
      setShowPreview(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi upload PDF.');
    }
  };

  const isSavingMetadata = createBook.isPending || updateBook.isPending;
  const isUploading = uploadPdf.isPending;
  const isDeletingBook = deleteBook.isPending;

  const startAddAnotherBook = () => {
    setError(null);
    setShowPreview(false);
    setPdfFile(null);
    setIsAddingAnother(true);
    setTitle('');
    setPublisher('');
    setTotalPages('');
    setOcrPageFrom('');
    setOcrPageTo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelAddAnotherBook = () => {
    if (!book) return;
    setIsAddingAnother(false);
    setSchoolGradeId(book.schoolGradeId);
    setSubjectId(book.subjectId);
    setTitle(book.title);
    setPublisher(book.publisher ?? '');
    setAcademicYear(book.academicYear ?? '');
    setTotalPages(book.totalPages ?? '');
    setOcrPageFrom(book.ocrPageFrom ?? '');
    setOcrPageTo(book.ocrPageTo ?? '');
    setPdfFile(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmDeleteBook = async () => {
    if (!pendingDeleteBook) return;
    const deletingBook = pendingDeleteBook;
    const fallback = relatedBooks.find((candidate) => candidate.id !== deletingBook.id);
    try {
      await deleteBook.mutateAsync(deletingBook.id);
      setPendingDeleteBook(null);
      if (book?.id === deletingBook.id) {
        if (fallback) {
          onSelectBook(fallback.id);
        } else {
          onSwitchToNew();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi xóa sách.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Bước 1 · Thông tin & Upload PDF</h2>
        <p className="text-sm text-slate-500">Nhập metadata sách, sau đó upload file PDF nguồn.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {schoolGradeId && subjectId && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-slate-700">
              Sách cùng khối/môn ({relatedBooks.length})
            </div>
            {!isAddingAnother && (
              <button
                type="button"
                onClick={startAddAnotherBook}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
              >
                <Plus size={14} /> Thêm sách
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedBooks.map((item) => {
              const isActive = !isAddingAnother && item.id === book?.id;
              const hasPdf = Boolean(item.pdfPath);
              return (
                <div
                  key={item.id}
                  className={[
                    'inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition',
                    isActive
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBook(item.id)}
                    className="inline-flex items-center gap-2"
                  >
                    <span className="max-w-[260px] truncate">{item.title}</span>
                    {hasPdf ? (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                        PDF
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                        Chưa có PDF
                      </span>
                    )}
                  </button>
                  {hasPdf ? null : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteBook(item)}
                      title="Xóa sách chưa upload PDF"
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={12} />
                      Xóa
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {isAddingAnother && (
            <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs text-blue-700">
                Đang tạo sách mới trong cùng khối/môn. Lưu metadata để tạo bản ghi mới, rồi upload
                PDF cho sách này.
              </p>
              <button
                type="button"
                onClick={cancelAddAnotherBook}
                className="ml-3 inline-flex items-center rounded-md border border-blue-300 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
              >
                Huỷ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metadata form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Khối lớp *">
          <select
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={schoolGradeId}
            onChange={(e) => {
              setSchoolGradeId(e.target.value);
              setSubjectId('');
            }}
          >
            <option value="">— Chọn khối —</option>
            {grades.data?.result.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Môn học *">
          <select
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!schoolGradeId}
          >
            <option value="">— Chọn môn —</option>
            {subjects.data?.result?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tên sách *">
          <input
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Toán 10 — Tập 1"
          />
        </Field>
        <Field label="Nhà xuất bản">
          <input
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </Field>
        <Field label="Năm học">
          <input
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="VD: 2024-2025"
          />
        </Field>
        <Field label="Tổng số trang PDF *">
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trang OCR từ *">
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
              value={ocrPageFrom}
              onChange={(e) =>
                setOcrPageFrom(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Trang OCR đến *">
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
              value={ocrPageTo}
              onChange={(e) => setOcrPageTo(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveMetadata}
          disabled={isSavingMetadata}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {isSavingMetadata && <Loader2 size={14} className="animate-spin" />}
          {book?.id && !isAddingAnother ? 'Cập nhật metadata' : 'Lưu metadata sách mới'}
        </button>
      </div>

      {/* PDF upload */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <FileText size={16} /> File PDF nguồn
        </h3>
        {!isAddingAnother && book?.pdfPath ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            Đã upload PDF thành công.
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-2">
            Chỉ chấp nhận file .pdf. Lưu metadata trước rồi mới upload được.
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            disabled={!book?.id || isAddingAnother}
            className="text-sm"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!pdfFile || !book?.id || isUploading || isAddingAnother}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Upload PDF
          </button>
          {!isAddingAnother && (
            <button
              type="button"
              onClick={onUploaded}
              disabled={!book?.pdfPath}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Sang bước 2
            </button>
          )}
        </div>

        {!isAddingAnother && book?.id && (book.pdfPath || pdfFile) ? (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? 'Ẩn preview PDF' : 'Xem preview PDF'}
            </button>

            {showPreview ? (
              <BookPdfPreview
                bookId={book.id}
                localObjectUrl={localPdfObjectUrl}
                hasServerPdf={Boolean(book.pdfPath)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <QbConfirmDialog
        isOpen={pendingDeleteBook !== null}
        tone="danger"
        title="Xóa sách khỏi danh sách?"
        message={
          pendingDeleteBook && (
            <>
              Bạn sắp xóa <strong>&quot;{pendingDeleteBook.title}&quot;</strong>. Chỉ sách chưa upload
              PDF mới được xóa.
            </>
          )
        }
        confirmLabel="Xóa sách"
        busy={isDeletingBook}
        onConfirm={handleConfirmDeleteBook}
        onCancel={() => setPendingDeleteBook(null)}
      />
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
    {children}
  </label>
);

export default BookUploadStep;
