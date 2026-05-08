import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  OctagonAlert,
  PlayCircle,
  RefreshCw,
  Rocket,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  bookKeys,
  useBookList,
  useBookProgress,
  useCancelOcr,
  useRefreshVerification,
  useTriggerOcr,
} from '../../../../hooks/useBooks';
import type {
  BookProgressResponse,
  BookResponse,
  LessonProgress,
} from '../../../../types/book.types';
import BookPdfPreview from '../BookPdfPreview';

interface Props {
  book: BookResponse;
  /** Khi có nhiều cuốn trong bộ: chọn cuốn để OCR / xem tiến độ (đồng bộ `activeBookId` ở wizard). */
  onSelectSeriesBook?: (bookId: string) => void;
  onComplete: () => void;
}

const STATUS_LABEL: Record<BookResponse['status'], string> = {
  DRAFT: 'Bản nháp',
  MAPPING: 'Đang mapping',
  READY: 'Sẵn sàng OCR',
  OCR_RUNNING: 'Đang OCR',
  OCR_DONE: 'OCR hoàn tất',
  OCR_FAILED: 'OCR thất bại',
};

const STATUS_TONE: Record<BookResponse['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  MAPPING: 'bg-amber-50 text-amber-700 border-amber-200',
  READY: 'bg-blue-50 text-blue-700 border-blue-200',
  OCR_RUNNING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OCR_DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OCR_FAILED: 'bg-red-50 text-red-700 border-red-200',
};

function formatViDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

const OcrTriggerStep: React.FC<Props> = ({ book, onSelectSeriesBook, onComplete }) => {
  const qc = useQueryClient();
  const triggerOcr = useTriggerOcr(book.id);
  const cancelOcrMutation = useCancelOcr(book.id);
  const refreshVerification = useRefreshVerification(book.id);

  const progressQuery = useBookProgress(book.id, {
    refetchInterval: (query) => {
      const polled = query.state.data?.result?.status;
      const effective = polled ?? book.status;
      return effective === 'OCR_RUNNING' ? 3000 : false;
    },
  });
  const seriesBooksQuery = useBookList({
    bookSeriesId: book.bookSeriesId ?? undefined,
    page: 0,
    size: 100,
  });

  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const progress = progressQuery.data?.result;
  const uiStatus = (progress?.status ?? book.status) as BookResponse['status'];

  useEffect(() => {
    if (!progress?.status || progress.status === book.status) return;
    void qc.invalidateQueries({ queryKey: bookKeys.detail(book.id) });
  }, [progress?.status, book.status, book.id, qc]);

  useEffect(() => {
    setShowPdfPreview(false);
  }, [book.id]);

  const ocrConnectionIssue =
    uiStatus === 'OCR_RUNNING' &&
    (progress?.ocrCrawlerReachable === false || progressQuery.isError);
  const showingCachedOcrProgress = Boolean(progress?.ocrProgressFromCache);

  useEffect(() => {
    if (!showCancelConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !cancelOcrMutation.isPending) setShowCancelConfirm(false);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [showCancelConfirm, cancelOcrMutation.isPending]);

  const canTrigger = useMemo(() => {
    if (!book.pdfPath) return false;
    if (!book.mappedLessonCount || book.mappedLessonCount <= 0) return false;
    const st = book.status;
    return st === 'READY' || st === 'MAPPING' || st === 'OCR_FAILED';
  }, [book]);

  const handleTrigger = async () => {
    setError(null);
    try {
      await triggerOcr.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể kích hoạt OCR.');
    }
  };

  const handleRefresh = async () => {
    setError(null);
    try {
      await refreshVerification.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể đồng bộ trạng thái xác minh.');
    }
  };

  const handleConfirmCancelOcr = async () => {
    setError(null);
    try {
      await cancelOcrMutation.mutateAsync();
      setShowCancelConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hủy OCR.');
    }
  };

  const totalPages = progress?.totalPages ?? 0;
  const verifiedPages = progress?.verifiedPages ?? 0;
  const totalLessons = progress?.totalLessons ?? book.mappedLessonCount ?? 0;
  const verifiedLessons = progress?.verifiedLessons ?? 0;

  const pagePct = totalPages > 0 ? Math.round((verifiedPages / totalPages) * 100) : 0;
  const lessonPct = totalLessons > 0 ? Math.round((verifiedLessons / totalLessons) * 100) : 0;
  const seriesBooks = seriesBooksQuery.data?.result?.content ?? [];
  const showSeriesPanel = Boolean(book.bookSeriesId) && seriesBooks.length > 1;
  const activeBookIndex =
    seriesBooks.length > 0 ? seriesBooks.findIndex((seriesBook) => seriesBook.id === book.id) : -1;
  const activeBookOrderLabel =
    activeBookIndex >= 0 && seriesBooks.length > 0
      ? `Cuốn ${activeBookIndex + 1}/${seriesBooks.length}`
      : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Rocket size={18} /> Bước 3 · Chạy OCR theo cuốn
        </h2>
        <p className="text-sm text-slate-500">
          Bạn đang chạy OCR cho <strong>cuốn đang chọn</strong>. Quá trình có thể vài phút và chỉ
          quét các <strong>bài đã gán trang</strong> ở Bước 2 của cuốn này.
        </p>
        {activeBookOrderLabel && (
          <div className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {activeBookOrderLabel}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5" /> {error}
        </div>
      )}

      {uiStatus === 'OCR_FAILED' && book.ocrError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5" />
          <div>
            <div className="font-medium">OCR thất bại</div>
            <div className="text-xs mt-0.5">{book.ocrError}</div>
          </div>
        </div>
      )}

      {showSeriesPanel && onSelectSeriesBook && (
        <div className="border border-slate-200 rounded-lg">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b space-y-1">
            <div>Trạng thái các cuốn trong bộ (OCR vẫn chạy theo từng cuốn)</div>
            <p className="font-normal text-[11px] text-slate-500">
              Bấm vào một cuốn để chọn — OCR, tiến độ và chi tiết theo bài bên dưới áp dụng cho cuốn
              đó.
            </p>
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100">
            {seriesBooks.map((seriesBook) => {
              const isActive = seriesBook.id === book.id;
              return (
                <button
                  key={seriesBook.id}
                  type="button"
                  onClick={() => onSelectSeriesBook(seriesBook.id)}
                  className={[
                    'w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm transition',
                    isActive ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="truncate text-slate-800 font-medium">{seriesBook.title}</div>
                    <div className="text-[11px] text-slate-500">
                      OCR range: {seriesBook.ocrPageFrom ?? '?'}–{seriesBook.ocrPageTo ?? '?'} ·
                      mapped: {seriesBook.mappedLessonCount ?? 0}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${STATUS_TONE[seriesBook.status]}`}
                  >
                    {seriesBook.status === 'OCR_RUNNING' && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {STATUS_LABEL[seriesBook.status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {book.pdfPath ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPdfPreview((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
          >
            {showPdfPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPdfPreview ? 'Ẩn preview PDF' : 'Xem preview PDF'}
          </button>

          {showPdfPreview ? <BookPdfPreview bookId={book.id} hasServerPdf /> : null}
        </div>
      ) : null}

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Thông tin sách
          </div>
          <Row label="Tên sách" value={book.title} />
          <Row label="Khối lớp" value={book.schoolGradeName} />
          <Row label="Môn học" value={book.subjectName} />
          <Row label="Chương trình" value={book.curriculumName} />
          {book.publisher && <Row label="NXB" value={book.publisher} />}
          {book.academicYear && <Row label="Năm học" value={book.academicYear} />}
        </div>

        <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Thiết lập OCR
          </div>
          <Row label="Tổng số trang PDF" value={String(book.totalPages ?? '?')} />
          <Row label="Khoảng OCR" value={`${book.ocrPageFrom ?? '?'} – ${book.ocrPageTo ?? '?'}`} />
          <Row label="Số bài đã mapping" value={String(book.mappedLessonCount ?? 0)} />
          <Row
            label="Trạng thái"
            value={
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${STATUS_TONE[uiStatus]}`}
              >
                {uiStatus === 'OCR_RUNNING' && <Loader2 size={12} className="animate-spin" />}
                {STATUS_LABEL[uiStatus]}
              </span>
            }
          />
        </div>
      </div>

      {!book.pdfPath && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <Info size={16} className="mt-0.5" /> Chưa có file PDF. Hãy quay lại Bước 1 để upload
          trước.
        </div>
      )}

      {(book.mappedLessonCount ?? 0) === 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <Info size={16} className="mt-0.5" /> Cuốn này chưa có mapping nên chưa thể OCR. Bạn vẫn
          có thể ở Bước 3 để chuyển sang cuốn khác đã mapping và chạy OCR.
        </div>
      )}

      {/* Progress */}
      {(uiStatus === 'OCR_RUNNING' ||
        uiStatus === 'OCR_DONE' ||
        (progress && progress.totalPages > 0)) && (
        <div className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Tiến độ quét sách</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Trên: máy đang đọc PDF · Dưới: sau khi xong bạn kiểm duyệt từng trang.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshVerification.isPending}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
              title="Làm mới dữ liệu từ máy chủ"
            >
              {refreshVerification.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Làm mới
            </button>
          </div>

          {ocrConnectionIssue && (
            <div
              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm leading-relaxed ${
                showingCachedOcrProgress
                  ? 'border-sky-200 bg-sky-50 text-sky-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}
            >
              <OctagonAlert size={16} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">
                  {showingCachedOcrProgress
                    ? 'Đang mất kết nối tạm thời — hiển thị tiến độ đã lưu'
                    : 'Không liên hệ được máy chủ đang quét sách'}
                </div>
                <p className="text-xs mt-1 opacity-95">
                  {showingCachedOcrProgress ? (
                    <>
                      Thanh tiến độ bên dưới là <strong>bản ghi lần trước</strong>
                      {progress?.ocrProgressCachedAt
                        ? ` (${formatViDateTime(progress.ocrProgressCachedAt)})`
                        : ''}
                      . Khi đường truyền ổn định, số liệu sẽ tự cập nhật.
                    </>
                  ) : (
                    <>
                      Bạn có thể đợi vài giây và dùng nút «Làm mới», hoặc nhờ quản trị bật lại dịch
                      vụ quét sách. Nếu muốn dừng hẳn, dùng «Hủy tác vụ» — trạng thái sách vẫn được
                      đặt lại trên hệ thống kể cả khi máy chủ quét chưa chạy lại.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {uiStatus === 'OCR_RUNNING' && (
            <OcrPipelineLivePanel
              progress={progress}
              queryLoading={progressQuery.isLoading}
              hideDisconnectedEmptyHint={ocrConnectionIssue}
            />
          )}

          <ProgressBar
            label="Trang đã kiểm duyệt"
            current={verifiedPages}
            total={totalPages}
            percent={pagePct}
          />
          <ProgressBar
            label="Bài học đã kiểm duyệt xong"
            current={verifiedLessons}
            total={totalLessons}
            percent={lessonPct}
            tone="emerald"
          />

          {progress?.lessons && progress.lessons.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Chi tiết theo bài
              </div>
              <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                {progress.lessons.map((l: LessonProgress) => {
                  const lp =
                    l.totalPages > 0 ? Math.round((l.verifiedPages / l.totalPages) * 100) : 0;
                  return (
                    <div
                      key={l.lessonId}
                      className="py-2 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-700">{l.lessonTitle}</div>
                        <div className="text-[11px] text-slate-400">
                          p{l.pageStart ?? '?'}–p{l.pageEnd ?? '?'}
                        </div>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={`h-full ${l.lessonVerified ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${lp}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-xs text-slate-500 font-mono">
                        {l.verifiedPages}/{l.totalPages}
                      </div>
                      {l.lessonVerified && (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {uiStatus === 'OCR_RUNNING' && (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelOcrMutation.isPending}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-red-300 bg-white text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
          >
            <OctagonAlert size={14} /> Hủy tác vụ
          </button>
        )}
        {uiStatus === 'OCR_DONE' ? (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            <CheckCircle2 size={14} /> Sang bước Verify <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleTrigger}
            disabled={!canTrigger || triggerOcr.isPending || uiStatus === 'OCR_RUNNING'}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {triggerOcr.isPending || uiStatus === 'OCR_RUNNING' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {uiStatus === 'OCR_RUNNING' ? 'Đang OCR…' : 'Đang gửi…'}
              </>
            ) : (
              <>
                <PlayCircle size={14} />
                {uiStatus === 'OCR_FAILED' ? 'Thử lại OCR' : 'Kích hoạt OCR'}
              </>
            )}
          </button>
        )}
      </div>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelOcrMutation.isPending) {
              setShowCancelConfirm(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-ocr-title"
          >
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <OctagonAlert size={22} />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 id="cancel-ocr-title" className="text-base font-semibold text-slate-900">
                  Hủy tác vụ OCR?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  OCR đang chạy trên máy chủ. Hủy sẽ gửi lệnh dừng và đặt lại trạng thái sách về
                  «Sẵn sàng OCR». Một số trang có thể đã được xử lý — bạn có thể chạy lại OCR sau.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={cancelOcrMutation.isPending}
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Tiếp tục OCR
              </button>
              <button
                type="button"
                disabled={cancelOcrMutation.isPending}
                onClick={handleConfirmCancelOcr}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {cancelOcrMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang hủy…
                  </>
                ) : (
                  <>Xác nhận hủy</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-sm text-slate-800 text-right truncate max-w-[60%]">{value}</span>
  </div>
);

const ProgressBar: React.FC<{
  label: string;
  current: number;
  total: number;
  percent: number;
  tone?: 'blue' | 'emerald';
}> = ({ label, current, total, percent, tone = 'blue' }) => {
  const fillClass = tone === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-mono">
          {current}/{total} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded overflow-hidden">
        <div
          className={`h-full transition-all ${fillClass}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
};

const OCR_PIPELINE_STEPS: ReadonlyArray<{ phaseKey: string; title: string; hint: string }> = [
  {
    phaseKey: 'ingesting',
    title: 'Chuẩn bị file & ảnh trang',
    hint: 'Tải PDF và tạo ảnh cho đúng khoảng trang đã chọn.',
  },
  {
    phaseKey: 'analyzing',
    title: 'Đọc nội dung trang',
    hint: 'Nhận dạng chữ và công thức trên từng ảnh trang.',
  },
  {
    phaseKey: 'saving',
    title: 'Lưu kết quả',
    hint: 'Ghi nội dung đã quét vào kho dữ liệu của khóa học.',
  },
  {
    phaseKey: 'done',
    title: 'Hoàn tất bước quét',
    hint: 'Có thể sang bước kiểm duyệt từng trang.',
  },
];

function activeOcrStepIndex(phase: string | null | undefined): number {
  const p = (phase ?? '').toLowerCase();
  if (p === 'done') return 3;
  if (p === 'saving') return 2;
  if (p === 'analyzing') return 1;
  return 0;
}

function phaseHumanLabel(phase: string | null | undefined): string {
  const p = (phase ?? '').toLowerCase();
  const hit = OCR_PIPELINE_STEPS.find((s) => s.phaseKey === p);
  if (hit) return hit.title;
  if (!p) return 'Đang bắt đầu';
  return phase ?? '';
}

const OcrPipelineLivePanel: React.FC<{
  progress: BookProgressResponse | undefined;
  queryLoading: boolean;
  /** Hide redundant «no detail» hint when parent already shows connection banner */
  hideDisconnectedEmptyHint?: boolean;
}> = ({ progress, queryLoading, hideDisconnectedEmptyHint = false }) => {
  const pct = progress?.ocrJobProgressPercent;
  const safePct =
    typeof pct === 'number' && !Number.isNaN(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  const phase = progress?.ocrJobPhase ?? '';
  const proc = progress?.ocrJobProcessedPages ?? null;
  const tot = progress?.ocrJobTotalPages ?? null;
  const runner = progress?.ocrRunnerStatus ?? '';
  const activeIdx = activeOcrStepIndex(phase);

  const hasSignal =
    typeof pct === 'number' ||
    (typeof proc === 'number' && proc > 0) ||
    (typeof tot === 'number' && tot > 0) ||
    Boolean(phase) ||
    Boolean(runner);

  const cachedHint =
    Boolean(progress?.ocrProgressFromCache) && progress?.ocrProgressCachedAt
      ? ` · đã lưu ${formatViDateTime(progress.ocrProgressCachedAt)}`
      : '';

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-indigo-900 tracking-wide">
            Máy đang quét nội dung{cachedHint}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Khác với phần «Trang đã hoàn thành kiểm duyệt» bên dưới — chỉ bật sau khi bạn xác nhận
            từng trang.
          </div>
        </div>
        {runner ? (
          <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-indigo-100 text-indigo-800">
            {runner}
          </span>
        ) : null}
      </div>

      {queryLoading && !hasSignal ? (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Loader2 size={14} className="animate-spin text-indigo-600" />
          Đang tải thông tin tiến độ…
        </div>
      ) : null}

      {!hideDisconnectedEmptyHint && !queryLoading && !hasSignal ? (
        <div className="text-xs text-slate-600 bg-white/70 border border-slate-200 rounded px-2 py-1.5">
          Chưa có con số tiến độ. Nếu vừa mới bấm chạy, đợi vài giây hoặc bấm «Làm mới» ở trên.
        </div>
      ) : null}

      <ProgressBar
        label="Tiến độ quét (ước lượng)"
        current={safePct}
        total={100}
        percent={safePct}
        tone="blue"
      />

      <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
        <span>
          Hiện tại: <strong className="text-slate-800">{phaseHumanLabel(phase)}</strong>
        </span>
        {typeof proc === 'number' && typeof tot === 'number' && tot > 0 ? (
          <span className="font-mono">
            Trang đã phân tích: {proc}/{tot}
          </span>
        ) : typeof proc === 'number' && proc >= 0 ? (
          <span className="font-mono">Trang đã phân tích: {proc}</span>
        ) : null}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {OCR_PIPELINE_STEPS.map((step, i) => {
          const done = i < activeIdx || (i === 3 && phase.toLowerCase() === 'done');
          const active = i === activeIdx && !done;
          return (
            <div
              key={step.phaseKey}
              className={`flex gap-2 rounded-md border px-2 py-1.5 text-xs ${
                done
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                  : active
                    ? 'border-indigo-300 bg-white text-indigo-950 shadow-sm'
                    : 'border-slate-100 bg-white/60 text-slate-500'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {done ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : active ? (
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white" />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {i + 1}. {step.title}
                </div>
                <div className="text-[10px] opacity-90">{step.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      {progress?.ocrJobErrorMessage ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
          {progress.ocrJobErrorMessage}
        </div>
      ) : null}
    </div>
  );
};

export default OcrTriggerStep;
