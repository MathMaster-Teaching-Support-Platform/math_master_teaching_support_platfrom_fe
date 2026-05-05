import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileJson,
  FileText,
  Loader2,
  Pencil,
  ScanText,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { OcrService } from '../../services/api/ocr.service';
import type { OcrBook, OcrBookStatus, OcrBookStatusPoll } from '../../types/ocr.types';
import './AdminOCRBooks.css';

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusLabel: Record<OcrBookStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang OCR',
  done: 'Hoàn thành',
  error: 'Lỗi',
};

const StatusBadge: React.FC<{ status: OcrBookStatus }> = ({ status }) => {
  const icon = {
    pending: <Clock size={11} />,
    processing: <Loader2 size={11} className="spin-icon" />,
    done: <CheckCircle2 size={11} />,
    error: <AlertCircle size={11} />,
  }[status];

  return (
    <span className={`ocr-status-badge ocr-status-badge--${status}`}>
      {icon}
      {statusLabel[status]}
    </span>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditBookModal: React.FC<{
  book: OcrBook;
  onClose: () => void;
  onSaved: () => void;
}> = ({ book, onClose, onSaved }) => {
  const [title, setTitle] = useState(book.title);
  const [grade, setGrade] = useState(book.grade);
  const [publisher, setPublisher] = useState(book.publisher ?? '');
  const [academicYear, setAcademicYear] = useState(book.academic_year ?? '');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      OcrService.updateBook(book.id, {
        title: title.trim() || undefined,
        grade,
        publisher: publisher.trim() || undefined,
        academic_year: academicYear.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-books'] });
      onSaved();
      onClose();
    },
  });

  return (
    <div
      className="ocr-modal-backdrop"
      aria-hidden="true"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <motion.div
        className="ocr-modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ocr-modal-header">
          <h3 className="ocr-modal-title">Chỉnh sửa thông tin sách</h3>
          <button className="ocr-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ocr-modal-body">
          <div className="ocr-field-group">
            <label className="ocr-field-label" htmlFor="edit-title">Tên sách *</label>
            <input
              id="edit-title"
              className="ocr-field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên sách giáo khoa"
            />
          </div>
          <div className="ocr-field-row">
            <div className="ocr-field-group">
              <label className="ocr-field-label" htmlFor="edit-grade">Khối lớp *</label>
              <select
                id="edit-grade"
                className="ocr-field-select"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
            <div className="ocr-field-group">
              <label className="ocr-field-label" htmlFor="edit-year">Năm học</label>
              <input
                id="edit-year"
                className="ocr-field-input"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: 2024-2025"
              />
            </div>
          </div>
          <div className="ocr-field-group">
            <label className="ocr-field-label" htmlFor="edit-publisher">NXB / Bộ sách</label>
            <input
              id="edit-publisher"
              className="ocr-field-input"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="VD: NXB Giáo dục Việt Nam"
            />
          </div>

          {mutation.isError && (
            <p className="ocr-field-error">
              {mutation.error instanceof Error ? mutation.error.message : String(mutation.error)}
            </p>
          )}
        </div>
        <div className="ocr-modal-footer">
          <button className="ocr-btn ocr-btn-ghost" onClick={onClose} disabled={mutation.isPending}>
            Hủy
          </button>
          <button
            className="ocr-btn ocr-btn-primary"
            disabled={!title.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 size={14} /> : null}
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── OCR static base URL helper ──────────────────────────────────────────────
// Thumbnails are served from the Python FastAPI static mount (/static/...).
// The Vite proxy only covers /api/..., so we need the direct Python URL in dev.
const OCR_STATIC_BASE =
  (import.meta.env.VITE_OCR_PROXY_TARGET as string | undefined) ?? 'http://localhost:8001';

function buildOcrStaticUrl(path: string): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${OCR_STATIC_BASE}${path}`;
}

// ─── Book Card ────────────────────────────────────────────────────────────────

const BookCard: React.FC<{ book: OcrBook; onDeleted: () => void }> = ({ book, onDeleted }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const thumbMutation = useMutation({
    mutationFn: (file: File) => OcrService.uploadBookThumbnail(book.id, file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ocr-books'] }),
  });

  // Polling for books in processing/pending state
  useQuery({
    queryKey: ['ocr-book-status', book.id],
    queryFn: () => OcrService.getBookStatus(book.id),
    enabled: book.status === 'processing' || book.status === 'pending',
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
    onSuccess: (data: OcrBookStatusPoll) => {
      if (data.status !== book.status || data.progress !== book.progress) {
        void queryClient.invalidateQueries({ queryKey: ['ocr-books'] });
      }
    },
  } as Parameters<typeof useQuery>[0]);

  const deleteMutation = useMutation({
    mutationFn: () => OcrService.deleteBook(book.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-books'] });
      onDeleted();
    },
  });

  const isProcessing = book.status === 'processing' || book.status === 'pending';
  const isDone = book.status === 'done';

  return (
    <>
      <AnimatePresence>
        {showEdit && (
          <EditBookModal book={book} onClose={() => setShowEdit(false)} onSaved={() => setShowEdit(false)} />
        )}
      </AnimatePresence>

      <motion.div
        className="ocr-book-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        layout
      >
        {/* Thumbnail */}
        <div
          className="ocr-book-thumb"
          title="Click để đổi ảnh bìa"
          onClick={() => thumbInputRef.current?.click()}
        >
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) thumbMutation.mutate(f);
              e.target.value = '';
            }}
          />
          {book.thumbnail_url ? (
            <>
              <img
                src={buildOcrStaticUrl(book.thumbnail_url)}
                aria-hidden="true"
                className="ocr-book-thumb-bg"
              />
              <img
                src={buildOcrStaticUrl(book.thumbnail_url)}
                alt={book.title}
                className="ocr-book-thumb-img"
              />
            </>
          ) : (
            <div className="ocr-book-thumb-placeholder">
              <BookOpen size={28} />
              <span>Lớp {book.grade}</span>
            </div>
          )}
          <div className="ocr-book-thumb-overlay">
            {thumbMutation.isPending ? (
              <Loader2 size={20} className="spin-icon" />
            ) : (
              <><Camera size={16} /><span>Đổi ảnh bìa</span></>
            )}
          </div>
        </div>

        {/* Header row: grade badge + status + actions */}
        <div className="ocr-book-card-header">
          <div className="ocr-book-card-badges">
            <span className="ocr-grade-badge">Lớp {book.grade}</span>
            <StatusBadge status={book.status} />
          </div>
          <div className="ocr-book-card-header-actions">
            <button
              className="ocr-icon-btn ocr-icon-btn--edit"
              title="Chỉnh sửa thông tin"
              onClick={() => setShowEdit(true)}
            >
              <Pencil size={13} />
            </button>
            <button
              className="ocr-icon-btn ocr-icon-btn--danger"
              title="Xóa sách"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Title + meta */}
        <h2 className="ocr-book-card-title">{book.title}</h2>
        <div className="ocr-book-card-meta">
          {book.publisher && <span className="ocr-book-publisher">{book.publisher}</span>}
          {book.academic_year && <span className="ocr-book-year">{book.academic_year}</span>}
        </div>

        {/* Progress bar (processing) */}
        {isProcessing && (
          <div className="ocr-card-progress">
            <div className="ocr-card-progress-bar">
              <div
                className="ocr-card-progress-fill"
                style={{ transform: `scaleX(${book.progress / 100})` }}
              />
            </div>
            <div className="ocr-card-progress-text">
              <span>{book.current_phase || 'Đang xử lý...'}</span>
              <span>{book.progress}%</span>
            </div>
          </div>
        )}

        {/* Error */}
        {book.status === 'error' && book.error_message && (
          <p className="ocr-card-error">{book.error_message}</p>
        )}

        {/* Stats (done only) */}
        {isDone && (
          <div className="ocr-card-stats">
            <div className="ocr-card-stat">
              <span className="ocr-card-stat-value">{book.chapter_count ?? 0}</span>
              <span className="ocr-card-stat-label">Chương</span>
            </div>
            <div className="ocr-card-stat">
              <span className="ocr-card-stat-value">{book.lesson_count ?? 0}</span>
              <span className="ocr-card-stat-label">Bài học</span>
            </div>
            <div className="ocr-card-stat">
              <span className="ocr-card-stat-value">{book.total_pages ?? 0}</span>
              <span className="ocr-card-stat-label">Trang</span>
            </div>
          </div>
        )}

        {/* Divider + action buttons */}
        <div className="ocr-card-divider" />
        <div className="ocr-card-actions">
          {isDone ? (
            <>
              <button
                className="ocr-btn ocr-btn-primary ocr-btn-sm"
                onClick={() => navigate(`/admin/ocr/books/${book.id}`)}
              >
                <Eye size={13} />
                Xem nội dung
              </button>
              <div className="ocr-export-row">
                <button
                  className="ocr-btn ocr-btn-ghost ocr-btn-sm"
                  title="Export JSON"
                  onClick={() => OcrService.exportJson(book.id)}
                >
                  <FileJson size={13} />
                  JSON
                </button>
                <button
                  className="ocr-btn ocr-btn-ghost ocr-btn-sm"
                  title="Export Markdown"
                  onClick={() => OcrService.exportMarkdown(book.id)}
                >
                  <FileText size={13} />
                  MD
                </button>
                <button
                  className="ocr-btn ocr-btn-ghost ocr-btn-sm"
                  title="Export RAG Chunks"
                  onClick={() => OcrService.exportChunks(book.id)}
                >
                  <Download size={13} />
                  Chunks
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </div>

        {/* Delete confirm overlay */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              className="ocr-delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="ocr-delete-overlay-msg">Xóa sách "<strong>{book.title}</strong>"?</p>
              <p className="ocr-delete-overlay-sub">Hành động này không thể hoàn tác.</p>
              <div className="ocr-delete-overlay-btns">
                <button
                  className="ocr-btn ocr-btn-ghost ocr-btn-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Hủy
                </button>
                <button
                  className="ocr-btn ocr-btn-danger ocr-btn-sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                  Xóa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// ─── Upload Section ───────────────────────────────────────────────────────────

const UploadSection: React.FC<{ onUploaded: () => void }> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState<number>(10);
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Chưa chọn file');
      if (!title.trim()) throw new Error('Vui lòng nhập tên sách');
      setUploadProgress(10);
      return OcrService.uploadBook(file, grade, title.trim(), publisher.trim());
    },
    onSuccess: () => {
      setFile(null);
      setTitle('');
      setPublisher('');
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = '';
      onUploaded();
    },
    onError: () => setUploadProgress(null),
  });

  // Fake incremental progress while uploading
  useEffect(() => {
    if (!mutation.isPending) return;
    const id = setInterval(() => {
      setUploadProgress((p) => (p !== null && p < 85 ? p + 5 : p));
    }, 600);
    return () => clearInterval(id);
  }, [mutation.isPending]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') setFile(dropped);
  }, []);

  return (
    <div className="ocr-upload-section">
      <h2 className="ocr-upload-heading">
        <UploadCloud size={18} />
        Upload sách giáo khoa PDF
      </h2>

      <div className="ocr-upload-body">
        {/* Drop zone */}
        <div
          className={`ocr-dropzone${isDragging ? ' ocr-dropzone--over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          <UploadCloud size={36} className="ocr-dropzone-icon" />
          <p className="ocr-dropzone-title">
            {file ? file.name : 'Kéo file PDF vào đây'}
          </p>
          <p className="ocr-dropzone-hint">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
              : 'hoặc click để chọn file · PDF · tối đa 50 MB'}
          </p>
          {file && (
            <div className="ocr-dropzone-file">
              <BookOpen size={14} />
              {file.name}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="ocr-upload-fields">
          <div>
            <label className="ocr-field-label">Tên sách *</label>
            <input
              className="ocr-field-input"
              placeholder="VD: Toán 10 — Chân trời sáng tạo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="ocr-field-label">Khối lớp *</label>
            <select
              className="ocr-field-select"
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ocr-field-label">NXB / Bộ sách</label>
            <input
              className="ocr-field-input"
              placeholder="VD: NXB Giáo dục Việt Nam"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>

          {/* Error */}
          {mutation.isError && (
            <p style={{ color: '#b53333', fontSize: '0.875rem', margin: 0 }}>
              {(mutation.error as Error).message}
            </p>
          )}

          <button
            className="ocr-btn ocr-btn-primary ocr-upload-submit"
            disabled={!file || !title.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <><Loader2 size={15} /> Đang upload…</>
            ) : (
              <><ScanText size={15} /> Bắt đầu OCR</>
            )}
          </button>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="ocr-upload-progress">
          <div className="ocr-progress-label">
            <span>Đang gửi file đến server OCR…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="ocr-progress-track">
            <div
              className={`ocr-progress-fill${mutation.isPending ? ' ocr-progress-fill--pulse' : ''}`}
              style={{ transform: `scaleX(${uploadProgress / 100})` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminOCRBooks: React.FC = () => {
  const [gradeFilter, setGradeFilter] = useState(0); // 0 = all
  const [showUpload, setShowUpload] = useState(true);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ocr-books', gradeFilter],
    queryFn: () => OcrService.getBooks(gradeFilter || undefined),
    refetchInterval: 15_000,
  });

  const books: OcrBook[] = data?.books ?? (Array.isArray(data) ? (data as OcrBook[]) : []);

  const stats = {
    total: books.length,
    done: books.filter((b) => b.status === 'done').length,
    processing: books.filter((b) => b.status === 'processing' || b.status === 'pending').length,
  };

  const refreshBooks = () => {
    void queryClient.invalidateQueries({ queryKey: ['ocr-books'] });
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
    >
      <div className="ocr-books-page">
        {/* Header */}
        <header className="ocr-page-header">
          <div className="ocr-header-stack">
            <h1 className="ocr-page-title">Thư viện Sách OCR</h1>
            <p className="ocr-page-subtitle">
              Upload PDF sách giáo khoa — Gemini Vision OCR tự động trích xuất nội dung, LaTeX, hình vẽ
            </p>
          </div>
          <div className="ocr-header-actions">
            <button
              className="ocr-btn ocr-btn-ghost"
              onClick={() => setShowUpload((v) => !v)}
            >
              {showUpload ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showUpload ? 'Ẩn upload' : 'Upload sách mới'}
            </button>
          </div>
        </header>

        {/* Stats bar */}
        <div className="ocr-stats-bar">
          <div className="ocr-stat-chip">
            <span className="ocr-stat-chip-value">{stats.total}</span>
            <span>sách</span>
          </div>
          <div className="ocr-stat-chip">
            <CheckCircle2 size={14} color="#3d6b4f" />
            <span className="ocr-stat-chip-value">{stats.done}</span>
            <span>đã xong</span>
          </div>
          {stats.processing > 0 && (
            <div className="ocr-stat-chip">
              <Loader2 size={14} color="#c96442" />
              <span className="ocr-stat-chip-value">{stats.processing}</span>
              <span>đang xử lý</span>
            </div>
          )}
        </div>

        {/* Upload */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <UploadSection onUploaded={refreshBooks} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grade filter */}
        <div className="ocr-filters">
          <span className="ocr-filter-label">Lọc theo lớp:</span>
          <button
            className={`ocr-filter-chip${gradeFilter === 0 ? ' ocr-filter-chip--active' : ''}`}
            onClick={() => setGradeFilter(0)}
          >
            Tất cả
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
            <button
              key={g}
              className={`ocr-filter-chip${gradeFilter === g ? ' ocr-filter-chip--active' : ''}`}
              onClick={() => setGradeFilter(g)}
            >
              Lớp {g}
            </button>
          ))}
        </div>

        {/* Book list */}
        {isLoading ? (
          <div className="ocr-loading">
            <div className="ocr-spinner" />
            Đang tải danh sách sách…
          </div>
        ) : books.length === 0 ? (
          <div className="ocr-empty">
            <BookOpen size={48} className="ocr-empty-icon" />
            <p className="ocr-empty-text">
              {gradeFilter
                ? `Chưa có sách nào cho lớp ${gradeFilter}`
                : 'Chưa có sách nào. Hãy upload PDF để bắt đầu OCR.'}
            </p>
          </div>
        ) : (
          <div className="ocr-books-grid">
            <AnimatePresence mode="popLayout">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onDeleted={refreshBooks} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Inline spin style for icon */}
      <style>{`.spin-icon { animation: ocrSpin 0.7s linear infinite; }`}</style>
    </DashboardLayout>
  );
};

export default AdminOCRBooks;
