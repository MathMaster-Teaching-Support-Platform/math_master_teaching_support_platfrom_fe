import { ExternalLink, Loader2 } from 'lucide-react';
import React from 'react';
import { useBookPdfPreviewUrl } from '../../../hooks/useBooks';

export type BookPdfPreviewProps = {
  bookId: string;
  /** Object URL from `URL.createObjectURL(file)` — takes precedence over server PDF */
  localObjectUrl?: string | null;
  /** Book has `pdfPath` on server — will fetch presigned URL when no local preview */
  hasServerPdf: boolean;
};

/**
 * Embedded PDF preview for the admin book wizard (MinIO presigned URL or local file blob).
 */
const BookPdfPreview: React.FC<BookPdfPreviewProps> = ({
  bookId,
  localObjectUrl,
  hasServerPdf,
}) => {
  const fetchServer = Boolean(hasServerPdf && !localObjectUrl);
  const previewQuery = useBookPdfPreviewUrl(bookId, fetchServer);

  const src = localObjectUrl ?? previewQuery.data?.result?.url ?? null;
  const loadingServer = fetchServer && previewQuery.isLoading;
  const errorServer = fetchServer && previewQuery.isError;

  if (!localObjectUrl && !hasServerPdf) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">Xem trước PDF</p>
          {localObjectUrl ? (
            <p className="text-xs text-slate-500">Bản xem trước từ file vừa chọn (chưa upload)</p>
          ) : (
            <p className="text-xs text-slate-500">
              Kiểm tra lại sách để chuẩn bị OCR. Khung trống hoặc lỗi MinIO → quay lại bước 1 và{' '}
              <strong>Thay thế PDF trên server</strong>.
            </p>
          )}
        </div>
        {src ? (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={14} />
            Mở tab mới
          </a>
        ) : null}
      </div>

      <div className="relative bg-slate-100">
        {loadingServer ? (
          <div className="flex min-h-[280px] items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-slate-400" aria-hidden />
            <span className="sr-only">Đang tải PDF…</span>
          </div>
        ) : null}

        {errorServer ? (
          <div className="px-4 py-6 text-sm text-red-600">
            Không lấy được liên kết xem PDF. Kiểm tra MinIO hoặc thử &quot;Mở tab mới&quot; sau khi
            tải xong.
          </div>
        ) : null}

        {src && !loadingServer ? (
          <iframe
            key={src}
            title="Xem trước sách PDF"
            src={src}
            className="h-[min(70vh,640px)] w-full border-0"
          />
        ) : null}
      </div>
    </div>
  );
};

export default BookPdfPreview;
