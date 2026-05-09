import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  ImageOff,
  ListTree,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MathText from '../../../components/common/MathText';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../../config/api.config';
import { mockAdmin } from '../../../data/mockData';
import {
  useBook,
  useBookContent,
  useBookList,
  useBookPageMapping,
  usePageHistory,
  useRefreshVerification,
  bookKeys,
  useReOcrSingleBookPage,
  useUpdatePage,
  useUploadBookPageImage,
} from '../../../hooks/useBooks';
import { AuthService } from '../../../services/api/auth.service';
import { BookService } from '../../../services/api/book.service';
import type {
  BookLessonPageResponse,
  BookStatus,
  ContentBlockDto,
  LessonContentResponse,
  LessonPageResponse,
} from '../../../types/book.types';

const CURRICULUM_SORT_FALLBACK = 999999;

/** Chuẩn hóa UUID để khớp mapping ↔ content (một số tầng serialize UUID viết hoa). */
function lessonLookupKey(lessonId: string | undefined | null): string {
  return String(lessonId ?? '')
    .trim()
    .toLowerCase();
}

const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  DRAFT: 'Bản nháp',
  MAPPING: 'Đang mapping',
  READY: 'Sẵn sàng OCR',
  OCR_RUNNING: 'Đang OCR',
  OCR_DONE: 'OCR hoàn tất',
  OCR_FAILED: 'OCR thất bại',
};

const BOOK_STATUS_TONE: Record<BookStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  MAPPING: 'bg-amber-50 text-amber-700 border-amber-200',
  READY: 'bg-blue-50 text-blue-700 border-blue-200',
  OCR_RUNNING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OCR_DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OCR_FAILED: 'bg-red-50 text-red-700 border-red-200',
};

const BLOCK_TYPES = [
  'text',
  'heading',
  'paragraph',
  'formula',
  'latex',
  'image',
  'figure',
  'exercise',
  'list',
  'table',
];

const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;

/**
 * When VITE_API_BASE_URL points at another origin than the SPA (e.g. sep.* vs apex),
 * rewriting `/api/...` to a same-origin path lets nginx on the SPA host proxy requests — avoids
 * CORS preflight rejecting `Authorization` on credentialed image fetches.
 */
function rewriteApiUrlForBrowserOrigin(
  pathname: string,
  search: string,
  hash: string
): string | null {
  if (typeof window === 'undefined') return null;
  if (!pathname.startsWith('/api')) return null;
  const base = API_BASE_URL?.trim();
  if (!base || !(base.startsWith('http://') || base.startsWith('https://'))) return null;
  try {
    const apiOrigin = new URL(base).origin;
    if (window.location.origin === apiOrigin) return null;
    return `${pathname}${search}${hash}`;
  } catch {
    return null;
  }
}

const resolveAssetUrl = (value?: string | null): string => {
  const raw = value?.trim();
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  if (ABSOLUTE_URL_REGEX.test(raw)) {
    try {
      const u = new URL(raw.startsWith('//') ? `https:${raw}` : raw, globalThis.location.origin);
      const rewritten = rewriteApiUrlForBrowserOrigin(u.pathname, u.search, u.hash);
      if (rewritten) return rewritten;
    } catch {
      /* ignore */
    }
    return raw;
  }

  if (raw.startsWith('/')) {
    if (!API_BASE_URL) return raw;
    const rewritten = rewriteApiUrlForBrowserOrigin(raw, '', '');
    if (rewritten) return rewritten;
    if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
      try {
        const apiUrl = new URL(API_BASE_URL);
        return `${apiUrl.origin}${raw}`;
      } catch {
        return raw;
      }
    }
    return raw;
  }
  return raw;
};

const shouldTryAuthImageFetch = (url: string): boolean => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
  if (url.startsWith('/')) return true;
  if (!ABSOLUTE_URL_REGEX.test(url)) return false;
  try {
    const target = new URL(url, globalThis.location.origin);
    const appOrigin = globalThis.location.origin;
    const apiOrigin = API_BASE_URL
      ? new URL(API_BASE_URL, globalThis.location.origin).origin
      : globalThis.location.origin;
    return target.origin === appOrigin || target.origin === apiOrigin;
  } catch {
    return false;
  }
};

const shouldSendAuthHeaderForImage = (url: string): boolean => {
  if (!url) return false;
  // Crawl-data static endpoints are publicly readable and can reject Authorization in CORS preflight.
  if (url.includes('/api/v1/crawl-data/static/')) return false;
  if (url.includes('/api/static/')) return false;
  return true;
};

const buildAssetCandidates = (url: string): string[] => {
  if (!url) return [];
  const candidates: string[] = [];
  const booksPathRegex = /\/api\/v1\/crawl-data\/static\/books\/([^/]+)\/pages\/([^/?#]+)$/i;
  const match = booksPathRegex.exec(url);
  if (match) {
    const bookId = match[1];
    const fileName = match[2];
    // Prefer normalized images path; many runs don't keep /static/books/.../pages files.
    candidates.push(
      `${globalThis.location.origin}/api/v1/crawl-data/static/images/${bookId}/${fileName}`
    );
  } else {
    candidates.push(url);
  }
  return Array.from(new Set(candidates));
};

/** Path + query for a resolved URL string (relative `/api/...` or absolute). */
function pathnameFromResolvedUrl(resolvedUrl: string): string {
  if (resolvedUrl.startsWith('/')) return resolvedUrl.split('#')[0];
  try {
    const u = new URL(resolvedUrl);
    return `${u.pathname}${u.search}`;
  } catch {
    return resolvedUrl.split('#')[0];
  }
}

/**
 * Book OCR block images are GET-protected like uploads are POST-protected. When the SPA host
 * (e.g. sep.*) rewrites `/api/...` to same-origin, some proxies forward Authorization on POST but
 * strip it on GET — preview breaks while MinIO upload still succeeds. Prefer the same absolute API
 * origin as `BookService.uploadPageImage` (`API_BASE_URL`) first.
 */
function withAbsoluteApiOrigin(pathFromRoot: string): string | null {
  const base = API_BASE_URL?.trim();
  if (!base || !(base.startsWith('http://') || base.startsWith('https://'))) return null;
  if (!pathFromRoot.startsWith('/')) return null;
  try {
    return `${new URL(base).origin}${pathFromRoot}`;
  } catch {
    return null;
  }
}

function buildProtectedImageFetchCandidates(resolvedUrl: string): string[] {
  const ordered: string[] = [];
  const path = pathnameFromResolvedUrl(resolvedUrl);
  if (path.includes('/api/v1/books/') && path.includes('/page-images/')) {
    const abs = withAbsoluteApiOrigin(path);
    if (abs) ordered.push(abs);
  }
  for (const c of buildAssetCandidates(resolvedUrl)) {
    if (!ordered.includes(c)) ordered.push(c);
  }
  return ordered;
}

const IMAGE_URL_EXT_REGEX = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

function looksLikeImageAssetUrl(url: string): boolean {
  try {
    const path = new URL(url, globalThis.location.origin).pathname;
    return IMAGE_URL_EXT_REGEX.test(path);
  } catch {
    return IMAGE_URL_EXT_REGEX.test(url.split('?')[0].split('#')[0]);
  }
}

async function blobLooksLikeImageBytes(blob: Blob): Promise<boolean> {
  if (blob.size < 3) return false;
  const buf = await blob.slice(0, 12).arrayBuffer();
  const u = new Uint8Array(buf);
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return true;
  if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return true;
  if (u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46) return true;
  if (
    u.length >= 12 &&
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  )
    return true;
  return false;
}

/** Proxies often strip or rewrite Content-Type to octet-stream; blob.type then breaks <img> via blob URL. */
async function isRenderableAuthenticatedImageBlob(blob: Blob, urlHint: string): Promise<boolean> {
  const ct = (blob.type ?? '').toLowerCase();
  if (ct.startsWith('image/')) return true;
  if (blob.size <= 0) return false;
  if (looksLikeImageAssetUrl(urlHint)) {
    if (!ct || ct === 'application/octet-stream') return true;
  }
  return blobLooksLikeImageBytes(blob);
}

const AuthenticatedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, onLoad, onError }) => {
  const [resolvedSrc, setResolvedSrc] = useState('');

  useEffect(() => {
    let revokedObjectUrl: string | null = null;
    const controller = new AbortController();
    const finalSrc = resolveAssetUrl(src);
    const candidateSrcs = buildProtectedImageFetchCandidates(finalSrc);
    setResolvedSrc('');

    const fetchProtectedImage = async () => {
      if (!finalSrc || candidateSrcs.length === 0) return;
      const token = AuthService.getToken();

      for (const candidateSrc of candidateSrcs) {
        if (!shouldTryAuthImageFetch(candidateSrc)) {
          setResolvedSrc(candidateSrc);
          return;
        }
        const shouldSendAuth = shouldSendAuthHeaderForImage(candidateSrc);
        if (shouldSendAuth && !token) {
          setResolvedSrc(candidateSrc);
          return;
        }
        try {
          const headers: Record<string, string> = {
            accept: 'image/*,*/*',
          };
          if (shouldSendAuth && token) {
            headers.Authorization = `Bearer ${token}`;
          }
          // Avoid 304: fetch() treats 304 as !ok and often returns an empty body, so blob() isn't a
          // valid image — we then fall back to <img src> without Authorization and admin assets break.
          const response = await fetch(candidateSrc, {
            method: 'GET',
            headers,
            // Bearer-only; avoid credentialed cross-origin mode (upload uses implicit omit too).
            credentials: 'omit',
            signal: controller.signal,
            cache: 'no-store',
          });
          if (!response.ok) {
            continue;
          }
          const blob = await response.blob();
          if (!(await isRenderableAuthenticatedImageBlob(blob, candidateSrc))) {
            continue;
          }
          revokedObjectUrl = URL.createObjectURL(blob);
          setResolvedSrc(revokedObjectUrl);
          return;
        } catch {
          // Try next candidate URL.
        }
      }

      setResolvedSrc(candidateSrcs[0] ?? finalSrc);
    };

    void fetchProtectedImage();
    return () => {
      controller.abort();
      if (revokedObjectUrl) URL.revokeObjectURL(revokedObjectUrl);
    };
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div className="flex min-h-[120px] items-center justify-center py-4">
        <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden />
        <span className="sr-only">Đang tải ảnh…</span>
      </div>
    );
  }

  return (
    <img src={resolvedSrc} alt={alt} className={className} onLoad={onLoad} onError={onError} />
  );
};

/** File segment under books/{bookId}/page-images/ — matches canonical API imageUrl / MinIO key. */
function parseBookAdminPageImageFileName(
  bookId: string,
  imageUrl?: string | null,
  imagePath?: string | null
): string | null {
  const bid = bookId.trim().toLowerCase();
  const url = imageUrl?.trim();
  if (url) {
    try {
      const pathOnly = ABSOLUTE_URL_REGEX.test(url)
        ? new URL(url.startsWith('//') ? `https:${url}` : url, globalThis.location.origin).pathname
        : url.split('?')[0].split('#')[0];
      const m = pathOnly.match(/\/api\/v1\/books\/([^/]+)\/page-images\/([^/]+)$/i);
      if (m && m[1].toLowerCase() === bid) return decodeURIComponent(m[2]);
    } catch {
      /* ignore */
    }
  }
  const p = imagePath?.trim();
  if (p) {
    const prefix = `books/${bookId}/page-images/`;
    const prefixNorm = `books/${bid}/page-images/`;
    if (p.startsWith(prefix)) return p.slice(prefix.length);
    const lower = p.toLowerCase();
    if (lower.startsWith(prefixNorm)) return p.slice(prefixNorm.length);
  }
  return null;
}

/**
 * Admin-uploaded OCR block images: presigned MinIO URL (like course thumbnails). Crawler/static
 * URLs keep using AuthenticatedImage + JWT fetch/blob.
 */
const VerifyBlockImage: React.FC<{
  bookId: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ bookId, imageUrl, imagePath, alt, className, onLoad, onError }) => {
  const fileName = useMemo(
    () => parseBookAdminPageImageFileName(bookId, imageUrl, imagePath),
    [bookId, imageUrl, imagePath]
  );
  const fallbackSrc = resolveAssetUrl(imageUrl ?? imagePath ?? '');
  const [presignedSrc, setPresignedSrc] = useState<string | null>(null);
  const [presignPhase, setPresignPhase] = useState<'idle' | 'loading' | 'failed'>('idle');

  useEffect(() => {
    if (!fileName) {
      setPresignedSrc(null);
      setPresignPhase('idle');
      return;
    }
    let cancelled = false;
    setPresignedSrc(null);
    setPresignPhase('loading');
    void BookService.getPageImagePresignedUrl(bookId, fileName)
      .then((res) => {
        const u = res.result?.url?.trim();
        if (cancelled) return;
        if (!u) {
          setPresignPhase('failed');
          return;
        }
        setPresignedSrc(u);
        setPresignPhase('idle');
      })
      .catch(() => {
        if (!cancelled) setPresignPhase('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, fileName]);

  if (fileName) {
    if (presignPhase === 'loading') {
      return (
        <div className={`flex min-h-[120px] items-center justify-center py-4 ${className ?? ''}`}>
          <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden />
          <span className="sr-only">Đang tải ảnh…</span>
        </div>
      );
    }
    if (presignedSrc) {
      return (
        <img src={presignedSrc} alt={alt} className={className} onLoad={onLoad} onError={onError} />
      );
    }
    return (
      <AuthenticatedImage
        src={fallbackSrc}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <AuthenticatedImage
      src={fallbackSrc}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

interface BookVerifyContentProps {
  bookId: string;
  embedded?: boolean;
  onBack?: () => void;
  /** Giống Bước 3: khi có nhiều cuốn trong bộ, đổi cuốn đang xác minh (wizard truyền để sync `activeBookId`). */
  onSelectSeriesBook?: (bookId: string) => void;
}

export const BookVerifyContent: React.FC<BookVerifyContentProps> = ({
  bookId,
  embedded = false,
  onBack,
  onSelectSeriesBook,
}) => {
  const navigate = useNavigate();
  const { data: bookData, isLoading: bookLoading } = useBook(bookId);
  const { data: contentData, isLoading: contentLoading, refetch } = useBookContent(bookId);
  const refetchBookContent = useCallback(() => refetch(), [refetch]);
  const { data: mappingData } = useBookPageMapping(bookId);
  const seriesBooksQuery = useBookList({
    bookSeriesId: bookData?.result?.bookSeriesId ?? undefined,
    page: 0,
    size: 100,
  });
  const refreshVerification = useRefreshVerification(bookId ?? '');

  const book = bookData?.result;
  const seriesBooks = seriesBooksQuery.data?.result?.content ?? [];
  const seriesBooksSorted = useMemo(
    () => [...seriesBooks].sort((a, b) => a.title.localeCompare(b.title, 'vi')),
    [seriesBooks]
  );
  const activeBookIndex = seriesBooksSorted.findIndex((seriesBook) => seriesBook.id === bookId);
  const activeBookOrderLabel =
    seriesBooksSorted.length > 1 && activeBookIndex >= 0
      ? `Cuốn ${activeBookIndex + 1}/${seriesBooksSorted.length} trong bộ`
      : null;
  const lessons: LessonContentResponse[] = useMemo(() => contentData?.result ?? [], [contentData]);

  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [collapsedLessons, setCollapsedLessons] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setActiveLessonId('');
    setActivePageNumber(null);
    setCollapsedLessons({});
    setCollapsedChapters({});
  }, [bookId]);

  const lessonMappingByLessonId = useMemo(() => {
    const meta = new Map<string, BookLessonPageResponse>();
    for (const item of mappingData?.result ?? []) {
      const key = lessonLookupKey(item.lessonId);
      if (!key || meta.has(key)) continue;
      meta.set(key, item);
    }
    return meta;
  }, [mappingData]);

  const lessonsByChapter = useMemo(() => {
    const map = new Map<
      string,
      {
        chapterId: string;
        chapterTitle: string;
        chapterOrderIndex: number;
        lessons: LessonContentResponse[];
      }
    >();
    for (const lesson of lessons) {
      const row = lessonMappingByLessonId.get(lessonLookupKey(lesson.lessonId));
      const chapterId = row?.chapterId ?? `unknown-${lesson.lessonId}`;
      const chapterTitle = row?.chapterTitle ?? 'Chương chưa xác định';
      const chapterOrderIndex = row?.chapterOrderIndex ?? CURRICULUM_SORT_FALLBACK;
      const lessonWithSortedPages: LessonContentResponse = {
        ...lesson,
        pages: [...lesson.pages].sort((a, b) => a.pageNumber - b.pageNumber),
      };
      const existing = map.get(chapterId);
      if (existing) {
        existing.lessons.push(lessonWithSortedPages);
      } else {
        map.set(chapterId, {
          chapterId,
          chapterTitle,
          chapterOrderIndex,
          lessons: [lessonWithSortedPages],
        });
      }
    }
    const chapters = Array.from(map.values()).sort(
      (a, b) => a.chapterOrderIndex - b.chapterOrderIndex
    );
    for (const ch of chapters) {
      ch.lessons.sort((a, b) => {
        const ra = lessonMappingByLessonId.get(lessonLookupKey(a.lessonId));
        const rb = lessonMappingByLessonId.get(lessonLookupKey(b.lessonId));
        const la = ra?.lessonOrderIndex ?? CURRICULUM_SORT_FALLBACK;
        const lb = rb?.lessonOrderIndex ?? CURRICULUM_SORT_FALLBACK;
        if (la !== lb) return la - lb;
        return (a.lessonTitle ?? '').localeCompare(b.lessonTitle ?? '', 'vi');
      });
    }
    return chapters;
  }, [lessons, lessonMappingByLessonId]);

  const showSeriesPanel =
    Boolean(book?.bookSeriesId) &&
    seriesBooksSorted.length > 1 &&
    (typeof onSelectSeriesBook === 'function' || !embedded);

  const handleSeriesVolumeClick = (selectedId: string) => {
    if (onSelectSeriesBook) {
      onSelectSeriesBook(selectedId);
      return;
    }
    if (!embedded) {
      navigate(`/admin/books/${selectedId}/verify`);
    }
  };

  const resolvedLessonId = activeLessonId || lessons[0]?.lessonId || '';

  const activeLesson = useMemo(
    () => lessons.find((l) => l.lessonId === resolvedLessonId) ?? null,
    [lessons, resolvedLessonId]
  );

  const resolvedPageNumber = activePageNumber ?? activeLesson?.pages[0]?.pageNumber ?? null;

  const activePage = useMemo(() => {
    if (!activeLesson || resolvedPageNumber == null) return null;
    return activeLesson.pages.find((p) => p.pageNumber === resolvedPageNumber) ?? null;
  }, [activeLesson, resolvedPageNumber]);

  const handleRefresh = async () => {
    if (!bookId) return;
    try {
      await refreshVerification.mutateAsync();
    } finally {
      void refetch();
    }
  };

  return (
    <div className={embedded ? '' : 'p-6 max-w-7xl mx-auto'}>
      {!embedded && onBack && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Danh sách sách
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {bookLoading ? 'Đang tải…' : (book?.title ?? 'Sách không tồn tại')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {book ? (
              <>
                {book.schoolGradeName} · {book.subjectName} · {book.curriculumName}
              </>
            ) : null}
          </p>
          {book && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {activeBookOrderLabel && (
                <>
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                    {activeBookOrderLabel}
                  </span>
                  <span className="text-slate-400">·</span>
                </>
              )}
              <StatusPill verified={book.verified} />
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{book.mappedLessonCount} bài đã mapping</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshVerification.isPending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshVerification.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Đồng bộ trạng thái
        </button>
      </div>

      {showSeriesPanel && (
        <div className="border border-slate-200 rounded-lg mb-6">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b space-y-1">
            <div>Các cuốn trong bộ — chọn cuốn để xác minh OCR</div>
            <p className="font-normal text-[11px] text-slate-500">
              Danh sách chương / bài / trang sách bên dưới áp dụng cho cuốn đang chọn (theo mapping
              Bước 2).
            </p>
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100">
            {seriesBooksSorted.map((seriesBook) => {
              const isActive = seriesBook.id === bookId;
              return (
                <button
                  key={seriesBook.id}
                  type="button"
                  onClick={() => handleSeriesVolumeClick(seriesBook.id)}
                  className={[
                    'w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm transition',
                    isActive ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="truncate text-slate-800 font-medium">{seriesBook.title}</div>
                    <div className="text-[11px] text-slate-500">
                      Trang OCR: {seriesBook.ocrPageFrom ?? '?'}–{seriesBook.ocrPageTo ?? '?'} · Đã
                      map {seriesBook.mappedLessonCount ?? 0} bài
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${BOOK_STATUS_TONE[seriesBook.status]}`}
                  >
                    {seriesBook.status === 'OCR_RUNNING' && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {BOOK_STATUS_LABEL[seriesBook.status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {contentLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải nội dung…
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Chưa có nội dung OCR nào. Hãy chạy OCR trước.
        </div>
      ) : (
        <div
          className={[
            'grid gap-4',
            sidebarCollapsed ? 'lg:grid-cols-[54px_1fr]' : 'lg:grid-cols-[340px_1fr]',
          ].join(' ')}
        >
          {/* Lesson + page sidebar */}
          <aside className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b flex items-center gap-1 justify-between">
              <span className="inline-flex items-center gap-1">
                <ListTree size={14} />
                {!sidebarCollapsed && 'Danh sách bài học'}
              </span>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((s) => !s)}
                className="inline-flex items-center justify-center h-7 px-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-0.5"
                title={sidebarCollapsed ? 'Mở danh sách bài học' : 'Thu danh sách bài học'}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen size={13} />
                    <ChevronsRight size={12} />
                  </>
                ) : (
                  <>
                    <PanelLeftClose size={13} />
                    <ChevronsLeft size={12} />
                  </>
                )}
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
                {lessonsByChapter.map((chapter) => {
                  const chapterCollapsed = collapsedChapters[chapter.chapterId] ?? false;
                  const chapterTotal = chapter.lessons.reduce((acc, l) => acc + l.pages.length, 0);
                  const chapterVerified = chapter.lessons.reduce(
                    (acc, l) => acc + l.pages.filter((p) => p.verified).length,
                    0
                  );

                  return (
                    <div key={chapter.chapterId}>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedChapters((s) => ({
                            ...s,
                            [chapter.chapterId]: !chapterCollapsed,
                          }))
                        }
                        className="w-full text-left px-3 py-2 flex items-center gap-2 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <span className="text-slate-400">
                          {chapterCollapsed ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-700 truncate">
                            {chapter.chapterTitle}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {chapterVerified}/{chapterTotal} trang đã verify
                          </div>
                        </div>
                      </button>

                      {!chapterCollapsed &&
                        chapter.lessons.map((l) => {
                          const total = l.pages.length;
                          const verified = l.pages.filter((p) => p.verified).length;
                          const collapsed =
                            collapsedLessons[l.lessonId] ?? l.lessonId !== resolvedLessonId;
                          return (
                            <div key={l.lessonId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLessonId(l.lessonId);
                                  setActivePageNumber(l.pages[0]?.pageNumber ?? null);
                                  setCollapsedLessons((s) => ({ ...s, [l.lessonId]: false }));
                                }}
                                className={[
                                  'w-full text-left pl-8 pr-3 py-2 flex items-center gap-2 transition',
                                  resolvedLessonId === l.lessonId
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'hover:bg-slate-50 text-slate-700',
                                ].join(' ')}
                              >
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedLessons((s) => ({
                                      ...s,
                                      [l.lessonId]: !collapsed,
                                    }));
                                  }}
                                  className="text-slate-400 hover:text-slate-700"
                                >
                                  {collapsed ? (
                                    <ChevronRight size={14} />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">
                                    {l.lessonTitle}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {verified}/{total} trang đã verify
                                  </div>
                                </div>
                                {l.lessonVerified && (
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                )}
                              </button>
                              {!collapsed && (
                                <ul className="bg-slate-50/50">
                                  {l.pages.map((p) => (
                                    <li key={p.pageNumber}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveLessonId(l.lessonId);
                                          setActivePageNumber(p.pageNumber);
                                        }}
                                        className={[
                                          'w-full text-left pl-14 pr-3 py-1.5 text-xs flex items-center justify-between gap-2',
                                          resolvedLessonId === l.lessonId &&
                                          resolvedPageNumber === p.pageNumber
                                            ? 'bg-blue-100 text-blue-800 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100',
                                        ].join(' ')}
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          <FileText size={12} />
                                          Trang sách {p.pageNumber}
                                        </span>
                                        {p.verified ? (
                                          <CheckCircle2 size={12} className="text-emerald-500" />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                                        )}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Page editor */}
          <div className="bg-white border border-slate-200 rounded-xl">
            {activePage && bookId && resolvedLessonId ? (
              <PageEditor
                key={`${resolvedLessonId}-${resolvedPageNumber ?? 'none'}`}
                bookId={bookId}
                lessonId={resolvedLessonId}
                lessonTitle={activeLesson?.lessonTitle ?? ''}
                chapterTitle={
                  lessonMappingByLessonId.get(lessonLookupKey(resolvedLessonId))?.chapterTitle ?? ''
                }
                page={activePage}
                bookStatus={book?.status}
                refetchBookContent={refetchBookContent}
              />
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Chọn một trang ở thanh bên để bắt đầu xác minh.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BookVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  if (!bookId) {
    return (
      <DashboardLayout role="admin" user={mockAdmin}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            Không tìm thấy mã sách để xác minh.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" user={mockAdmin}>
      <BookVerifyContent bookId={bookId} onBack={() => navigate('/admin/books')} />
    </DashboardLayout>
  );
};

const StatusPill: React.FC<{ verified: boolean }> = ({ verified }) => (
  <span
    className={[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
      verified
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-amber-50 text-amber-700 border-amber-200',
    ].join(' ')}
  >
    {verified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
    {verified ? 'Đã xác minh toàn bộ' : 'Chưa xác minh đầy đủ'}
  </span>
);

interface PageEditorProps {
  bookId: string;
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
  page: LessonPageResponse;
  /** Trạng thái sách Postgres — chặn OCR 1 trang khi đang OCR full sách. */
  bookStatus?: BookStatus | null;
  /** Refetch lesson tree sau khi crawler ghi Mongo (polling trong PageEditor). */
  refetchBookContent: () => Promise<unknown>;
}

/** So sánh snapshot server để biết OCR xong (Mongo đã đổi). */
function fingerprintLessonPageForOcrPoll(p: LessonPageResponse): string {
  return JSON.stringify({
    id: p.id,
    updatedAt: p.updatedAt ?? null,
    ocrConfidence: p.ocrConfidence ?? null,
    ocrSource: p.ocrSource ?? null,
    blocks: p.contentBlocks ?? [],
  });
}

interface PageVersionEntry {
  id: string;
  versionNo: number;
  ts: string;
  actor: string;
  action: string;
  verified: boolean;
  snapshot: ContentBlockDto[];
  summary: string[];
  rawSummary?: string;
  beforeBlocks?: ContentBlockDto[];
  afterBlocks?: ContentBlockDto[];
  beforeVerified?: boolean;
  afterVerified?: boolean;
}

function getBlockMainText(block: ContentBlockDto): string {
  if (typeof block.content === 'string' && block.content.trim()) return block.content.trim();
  if (typeof block.latex === 'string' && block.latex.trim()) return block.latex.trim();
  if (typeof block.caption === 'string' && block.caption.trim()) return block.caption.trim();
  return '';
}

function truncateText(value: string, max = 70): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function getDiffExcerpt(value: string, start: number, end: number, context = 24): string {
  const safeStart = Math.max(0, start - context);
  const safeEnd = Math.min(value.length, end + context);
  const prefix = safeStart > 0 ? '...' : '';
  const suffix = safeEnd < value.length ? '...' : '';
  return `${prefix}${value.slice(safeStart, safeEnd)}${suffix}`;
}

function buildTextDiffPreview(beforeText: string, afterText: string): string {
  const minLen = Math.min(beforeText.length, afterText.length);
  let left = 0;
  while (left < minLen && beforeText[left] === afterText[left]) left += 1;

  let right = 0;
  while (
    right < minLen - left &&
    beforeText[beforeText.length - 1 - right] === afterText[afterText.length - 1 - right]
  ) {
    right += 1;
  }

  const beforeChangeEnd = Math.max(left, beforeText.length - right);
  const afterChangeEnd = Math.max(left, afterText.length - right);
  const beforeSnippet = getDiffExcerpt(beforeText, left, beforeChangeEnd);
  const afterSnippet = getDiffExcerpt(afterText, left, afterChangeEnd);
  return `"${beforeSnippet}" -> "${afterSnippet}"`;
}

function describeBlockForUser(block: ContentBlockDto): string {
  const kind = block.type || 'text';
  const text = getBlockMainText(block);
  return text ? `[${kind}] "${truncateText(text)}"` : `[${kind}]`;
}

function describeBlockChangeForUser(before: ContentBlockDto, after: ContentBlockDto): string {
  const beforeType = before.type || 'text';
  const afterType = after.type || 'text';
  const beforeText = getBlockMainText(before);
  const afterText = getBlockMainText(after);

  if (beforeType !== afterType) {
    return `Loại block: [${beforeType}] -> [${afterType}]`;
  }

  if (beforeText !== afterText) {
    if (!beforeText || !afterText) {
      const oldValue = beforeText ? `"${truncateText(beforeText)}"` : '[trống]';
      const newValue = afterText ? `"${truncateText(afterText)}"` : '[trống]';
      return `${oldValue} -> ${newValue}`;
    }
    return buildTextDiffPreview(beforeText, afterText);
  }

  if ((before.latex ?? '') !== (after.latex ?? '')) {
    const oldLatex = before.latex?.trim() ? `"${truncateText(before.latex.trim())}"` : '[trống]';
    const newLatex = after.latex?.trim() ? `"${truncateText(after.latex.trim())}"` : '[trống]';
    return `LaTeX: ${oldLatex} -> ${newLatex}`;
  }

  if ((before.caption ?? '') !== (after.caption ?? '')) {
    const oldCaption = before.caption?.trim()
      ? `"${truncateText(before.caption.trim())}"`
      : '[trống]';
    const newCaption = after.caption?.trim()
      ? `"${truncateText(after.caption.trim())}"`
      : '[trống]';
    return `Caption: ${oldCaption} -> ${newCaption}`;
  }

  return `${describeBlockForUser(before)} -> ${describeBlockForUser(after)}`;
}

function buildUserFriendlyHistoryDetails(entry: PageVersionEntry): string[] {
  const details: string[] = [];
  const beforeBlocks = entry.beforeBlocks ?? [];
  const afterBlocks = entry.afterBlocks ?? [];

  if (entry.beforeVerified !== undefined && entry.afterVerified !== undefined) {
    if (entry.beforeVerified !== entry.afterVerified) {
      details.push(
        entry.afterVerified ? 'Đã đánh dấu trang là đã xác minh.' : 'Đã bỏ đánh dấu xác minh.'
      );
    }
  }

  if (beforeBlocks.length !== afterBlocks.length) {
    if (afterBlocks.length > beforeBlocks.length) {
      details.push(`Đã thêm ${afterBlocks.length - beforeBlocks.length} block.`);
    } else {
      details.push(`Đã xóa ${beforeBlocks.length - afterBlocks.length} block.`);
    }
  }

  const changedBlocks: string[] = [];
  const minLen = Math.min(beforeBlocks.length, afterBlocks.length);
  for (let i = 0; i < minLen; i += 1) {
    const before = beforeBlocks[i];
    const after = afterBlocks[i];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changedBlocks.push(`Block ${i + 1}: ${describeBlockChangeForUser(before, after)}`);
    }
  }

  if (changedBlocks.length > 0) {
    details.push(`Đã cập nhật ${changedBlocks.length} block nội dung.`);
    details.push(...changedBlocks.slice(0, 3));
    if (changedBlocks.length > 3) {
      details.push(`... và ${changedBlocks.length - 3} block khác.`);
    }
  }

  if (details.length === 0) {
    details.push(entry.rawSummary || 'Đã cập nhật nội dung trang.');
  }

  return details;
}

function formatHistoryAction(action: string): string {
  if (action === 'update') return 'Cập nhật';
  if (action === 'create') return 'Tạo mới';
  if (action === 'delete') return 'Xóa';
  return 'Cập nhật';
}

function compareTwoVersions(a: PageVersionEntry, b: PageVersionEntry): string[] {
  const details: string[] = [];
  const beforeBlocks = a.snapshot ?? [];
  const afterBlocks = b.snapshot ?? [];

  if (a.verified !== b.verified) {
    details.push(
      b.verified
        ? 'Trạng thái xác minh: Chưa xác minh -> Đã xác minh'
        : 'Trạng thái xác minh: Đã xác minh -> Chưa xác minh'
    );
  }

  if (beforeBlocks.length !== afterBlocks.length) {
    details.push(`Số block: ${beforeBlocks.length} -> ${afterBlocks.length}`);
  }

  const minLen = Math.min(beforeBlocks.length, afterBlocks.length);
  let changedCount = 0;
  const changedBlockLines: string[] = [];
  for (let i = 0; i < minLen; i += 1) {
    const before = beforeBlocks[i];
    const after = afterBlocks[i];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changedCount += 1;
      changedBlockLines.push(`Block ${i + 1}: ${describeBlockChangeForUser(before, after)}`);
    }
  }

  if (changedCount > 0) {
    details.push(`Khác ${changedCount} block nội dung:`);
    details.push(...changedBlockLines);
  }

  if (afterBlocks.length > beforeBlocks.length) {
    for (let i = beforeBlocks.length; i < afterBlocks.length; i += 1) {
      details.push(`Block ${i + 1} thêm mới: ${describeBlockForUser(afterBlocks[i])}`);
    }
  } else if (beforeBlocks.length > afterBlocks.length) {
    for (let i = afterBlocks.length; i < beforeBlocks.length; i += 1) {
      details.push(`Block ${i + 1} đã bị xóa: ${describeBlockForUser(beforeBlocks[i])}`);
    }
  }

  return details.length > 0 ? details : ['Hai version không có khác biệt nội dung.'];
}

const PageEditor: React.FC<PageEditorProps> = ({
  bookId,
  lessonId,
  lessonTitle,
  chapterTitle,
  page,
  bookStatus,
  refetchBookContent,
}) => {
  const queryClient = useQueryClient();
  const updatePage = useUpdatePage(bookId, lessonId);
  const reOcrSinglePage = useReOcrSingleBookPage(bookId);
  const cloneBlocks = (items: ContentBlockDto[]) => items.map((b) => ({ ...b }));
  const [blocks, setBlocks] = useState<ContentBlockDto[]>(cloneBlocks(page.contentBlocks ?? []));
  const [verified, setVerified] = useState<boolean>(page.verified);
  const [lastSavedBlocks, setLastSavedBlocks] = useState<ContentBlockDto[]>(
    cloneBlocks(page.contentBlocks ?? [])
  );
  const [lastSavedVerified, setLastSavedVerified] = useState<boolean>(page.verified);
  const [error, setError] = useState<string | null>(null);
  const [reOcrNotice, setReOcrNotice] = useState<string | null>(null);
  const [awaitingBackendOcr, setAwaitingBackendOcr] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const snapshotBeforeOcrRef = useRef<string | null>(null);
  const {
    data: pageHistoryData,
    refetch: refetchPageHistory,
    isLoading: pageHistoryLoading,
  } = usePageHistory(bookId, lessonId, page.pageNumber);

  useEffect(() => {
    setReOcrNotice(null);
    setAwaitingBackendOcr(false);
    snapshotBeforeOcrRef.current = null;
  }, [lessonId, page.pageNumber]);

  useEffect(() => {
    if (!awaitingBackendOcr || snapshotBeforeOcrRef.current === null) return;
    const snap = snapshotBeforeOcrRef.current;
    const now = fingerprintLessonPageForOcrPoll(page);
    if (now !== snap) {
      snapshotBeforeOcrRef.current = null;
      setAwaitingBackendOcr(false);
      const nextBlocks = cloneBlocks(page.contentBlocks ?? []);
      setBlocks(nextBlocks);
      setLastSavedBlocks(nextBlocks);
      setVerified(page.verified);
      setLastSavedVerified(page.verified);
      setReOcrNotice('Đã cập nhật nội dung sau OCR.');
      void queryClient.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
      void queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: bookKeys.pageMapping(bookId) });
    }
  }, [page, awaitingBackendOcr, bookId, queryClient]);

  useEffect(() => {
    if (!awaitingBackendOcr) return;
    const intervalMs = 2500;
    const maxTicks = 72;
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      void refetchBookContent();
      if (ticks >= maxTicks) {
        window.clearInterval(id);
        setAwaitingBackendOcr(false);
        snapshotBeforeOcrRef.current = null;
        setReOcrNotice(
          'Đã chờ tối đa ~3 phút — nếu nội dung chưa đổi, kiểm tra log crawler hoặc thử OCR lại.'
        );
      }
    }, intervalMs);
    void refetchBookContent();
    return () => window.clearInterval(id);
  }, [awaitingBackendOcr, refetchBookContent]);

  const historyEntries: PageVersionEntry[] = useMemo(() => {
    const rows = pageHistoryData?.result ?? [];
    const rowsInTimeOrder = [...rows].sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );
    const versionedRows = rowsInTimeOrder.map((row, index) => {
      const snapshot = row.after?.contentBlocks ?? [];
      const normalizedSummaryItems =
        Array.isArray(row.summaryItems) && row.summaryItems.length > 0
          ? row.summaryItems.filter((item) => Boolean(item))
          : row.summary
            ? row.summary
                .split(';')
                .map((item) => item.trim())
                .filter(Boolean)
            : [];
      const stableId =
        row.id?.trim() ||
        `${row.changedAt || 'unknown-time'}:${row.changedBy || 'unknown-user'}:${index}`;
      return {
        id: stableId,
        versionNo: index + 1,
        ts: row.changedAt,
        actor: row.changedBy || 'unknown',
        action: row.action || 'Cập nhật',
        verified: Boolean(row.after?.verified),
        snapshot,
        summary: normalizedSummaryItems.length > 0 ? normalizedSummaryItems : ['Đã cập nhật'],
        rawSummary: row.summary || '',
        beforeBlocks: row.before?.contentBlocks ?? [],
        afterBlocks: row.after?.contentBlocks ?? [],
        beforeVerified: row.before?.verified ?? undefined,
        afterVerified: row.after?.verified ?? undefined,
      };
    });
    return versionedRows.reverse();
  }, [pageHistoryData]);

  const isDirty =
    verified !== lastSavedVerified || JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocks);

  const handleReOcrThisPage = () => {
    if (bookStatus === 'OCR_RUNNING') return;
    if (
      isDirty &&
      !window.confirm(
        'Trang có chỉnh sửa chưa lưu. Sau khi OCR xong, làm mới sẽ lấy nội dung từ máy chủ và có thể ghi đè những gì bạn đang sửa. Tiếp tục?'
      )
    ) {
      return;
    }
    setError(null);
    setReOcrNotice(null);
    snapshotBeforeOcrRef.current = fingerprintLessonPageForOcrPoll(page);
    reOcrSinglePage.mutate(
      { lessonId, pageNumber: page.pageNumber },
      {
        onSuccess: () => {
          setAwaitingBackendOcr(true);
        },
        onError: (err) => {
          snapshotBeforeOcrRef.current = null;
          setAwaitingBackendOcr(false);
          setError(err instanceof Error ? err.message : 'Không thể xếp hàng OCR lại.');
        },
      }
    );
  };

  const singlePageOcrBusy =
    bookStatus === 'OCR_RUNNING' || reOcrSinglePage.isPending || awaitingBackendOcr;

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const selectedVersions = historyEntries.filter((h) => selectedHistoryIds.includes(h.id));
  const comparisonPair = useMemo(() => {
    if (selectedVersions.length !== 2) return null;
    const [a, b] = [...selectedVersions].sort((x, y) => x.versionNo - y.versionNo);
    return { from: a, to: b };
  }, [selectedVersions]);
  const selectedVersion = selectedVersions.length === 1 ? selectedVersions[0] : null;

  useEffect(() => {
    setSelectedHistoryIds([]);
    setShowComparison(false);
  }, [page.id]);

  const updateBlock = (idx: number, patch: Partial<ContentBlockDto>) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBlockAt = (index: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 0, { order: index + 1, type: 'text', content: '' });
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      // Re-number `order` for clarity.
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  };

  const moveBlockTo = (fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;

      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  };

  const handleSave = async (markVerified?: boolean) => {
    setError(null);
    const finalVerified = markVerified ?? verified;
    try {
      await updatePage.mutateAsync({
        pageNumber: page.pageNumber,
        payload: {
          contentBlocks: blocks,
          verified: finalVerified,
        },
      });
      setVerified(finalVerified);
      setSavedAt(new Date().toLocaleTimeString());
      const nextSnapshot = cloneBlocks(blocks);
      setLastSavedBlocks(nextSnapshot);
      setLastSavedVerified(finalVerified);
      void refetchPageHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi lưu trang.');
    }
  };

  const handleCancelChanges = () => {
    setBlocks(cloneBlocks(lastSavedBlocks));
    setVerified(lastSavedVerified);
    setError(null);
  };

  const isSaving = updatePage.isPending;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Trang sách {page.pageNumber}</div>
          <div className="text-[11px] text-slate-400">
            {blocks.length} block · OCR confidence:{' '}
            {page.ocrConfidence != null ? page.ocrConfidence.toFixed(2) : 'n/a'}
            {savedAt ? ` · Đã lưu lúc ${savedAt}` : ''}
          </div>
          <button
            type="button"
            onClick={handleReOcrThisPage}
            disabled={singlePageOcrBusy}
            title="Chạy lại pipeline Gemini + Mathpix cho đúng trang/bài này (giữ trạng thái đã verify nếu đã lưu trong Mongo)."
            className={[
              'mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition',
              singlePageOcrBusy
                ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100',
            ].join(' ')}
          >
            {reOcrSinglePage.isPending || awaitingBackendOcr ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            OCR lại trang (Gemini + Mathpix)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Đã xác minh
          </label>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> Lưu & xác minh
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50"
          >
            History
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5" /> {error}
        </div>
      )}
      {(reOcrSinglePage.isPending || awaitingBackendOcr) && !error && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-sm text-indigo-900">
          <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-indigo-600" />
          <span>
            {reOcrSinglePage.isPending
              ? 'Đang gửi yêu cầu OCR lại trang…'
              : `Đang OCR trang sách ${page.pageNumber} trên máy chủ (Gemini + Mathpix). Thường 30–120 giây — có thể đổi tab; nội dung sẽ tự cập nhật khi xong.`}
          </span>
        </div>
      )}
      {reOcrNotice && !error && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {reOcrNotice}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
        {/* Editor column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Soạn thảo
            </h3>
            <button
              type="button"
              onClick={() => addBlockAt(blocks.length)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Plus size={12} /> Thêm block
            </button>
          </div>
          {blocks.length === 0 && (
            <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded">
              Trang chưa có nội dung OCR. Bấm "Thêm block" để tạo thủ công.
            </div>
          )}
          <button
            type="button"
            onClick={() => addBlockAt(0)}
            className="w-full border border-dashed border-slate-300 rounded-lg py-1.5 text-xs text-slate-500 hover:text-blue-700 hover:border-blue-300"
          >
            + Chèn block đầu trang
          </button>
          {blocks.map((b, idx) => (
            <div
              key={`${page.id}-${idx}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingIndex == null) return;
                moveBlockTo(draggingIndex, idx);
                setDraggingIndex(null);
              }}
            >
              <BlockEditor
                bookId={bookId}
                block={b}
                index={idx}
                total={blocks.length}
                isDragging={draggingIndex === idx}
                onChange={(patch) => updateBlock(idx, patch)}
                onRemove={() => removeBlock(idx)}
                onMove={(dir) => moveBlock(idx, dir)}
                onDragStart={() => setDraggingIndex(idx)}
                onDragEnd={() => setDraggingIndex(null)}
              />
              <button
                type="button"
                onClick={() => addBlockAt(idx + 1)}
                className="mt-2 w-full border border-dashed border-slate-300 rounded-lg py-1.5 text-xs text-slate-500 hover:text-blue-700 hover:border-blue-300"
              >
                + Chèn block phía dưới
              </button>
            </div>
          ))}
        </div>

        {/* Preview column */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Xem trước
          </h3>
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-xs font-medium text-slate-500 mb-1">Chương / Bài / Trang</div>
            <div className="space-y-1">
              <p className="text-base font-bold tracking-wide text-slate-800 uppercase">
                {chapterTitle || 'Chương chưa xác định'}
              </p>
              <p className="text-sm font-semibold text-slate-700">{lessonTitle}</p>
              <p className="text-xs text-slate-500">Trang sách {page.pageNumber}</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/40 min-h-[200px]">
            {blocks.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Chưa có nội dung.</div>
            ) : (
              blocks.map((b, idx) => <BlockPreview key={idx} bookId={bookId} block={b} />)
            )}
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHistoryModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Lịch sử thay đổi · Trang sách {page.pageNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-2 py-1 text-sm rounded border border-slate-200 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            {pageHistoryLoading ? (
              <div className="text-sm text-slate-500">Đang tải lịch sử thay đổi...</div>
            ) : historyEntries.length === 0 ? (
              <div className="text-sm text-slate-500">Chưa có version nào cho trang này.</div>
            ) : (
              <>
                <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {historyEntries.map((h) => {
                    const checked = selectedHistoryIds.includes(h.id);
                    const disabled = !checked && selectedHistoryIds.length >= 2;
                    return (
                      <div key={h.id} className="p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              setSelectedHistoryIds((prev) => {
                                setShowComparison(false);
                                if (prev.includes(h.id)) return prev.filter((x) => x !== h.id);
                                if (prev.length >= 2) return prev;
                                return [...prev, h.id];
                              })
                            }
                          />
                          <div className="font-medium text-slate-800">
                            Version {h.versionNo} · {formatHistoryAction(h.action)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(h.ts).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Người sửa: Quản trị viên · {h.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Chọn tối đa 2 version để so sánh, hoặc chọn 1 version để xem chi tiết thay đổi.
                  </div>
                  <button
                    type="button"
                    disabled={selectedVersions.length !== 2}
                    onClick={() => setShowComparison(true)}
                    className="px-3 py-1.5 text-xs rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    So sánh 2 version
                  </button>
                </div>

                {selectedVersion && (
                  <div className="border border-amber-200 bg-gradient-to-b from-amber-50 to-white rounded-xl p-4 text-sm shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="font-semibold text-amber-900">
                        Chi tiết thay đổi · Version {selectedVersion.versionNo}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 border border-amber-200">
                        {formatHistoryAction(selectedVersion.action)}
                      </span>
                    </div>
                    <div className="text-xs text-amber-800 mb-2">
                      {new Date(selectedVersion.ts).toLocaleString()} · Quản trị viên
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-amber-700/80 mb-1">
                      Tóm tắt thay đổi
                    </div>
                    <ul className="text-xs text-amber-900 list-disc pl-5 space-y-1">
                      {buildUserFriendlyHistoryDetails(selectedVersion).map((c, i) => (
                        <li key={`${c}-${i}`}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {showComparison && comparisonPair && (
                  <div className="border border-blue-200 bg-gradient-to-b from-blue-50 to-white rounded-xl p-4 text-sm shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">So sánh 2 version</div>
                    <div className="text-xs text-blue-800 mb-1">
                      Version {comparisonPair.from.versionNo} ·{' '}
                      {new Date(comparisonPair.from.ts).toLocaleString()} (Quản trị viên)
                      {' -> '}
                      Version {comparisonPair.to.versionNo} ·{' '}
                      {new Date(comparisonPair.to.ts).toLocaleString()} (Quản trị viên)
                    </div>
                    <ul className="text-xs text-blue-900 list-disc pl-4">
                      {compareTwoVersions(comparisonPair.from, comparisonPair.to).map((c, i) => (
                        <li key={`${c}-${i}`}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface BlockEditorProps {
  bookId: string;
  block: ContentBlockDto;
  index: number;
  total: number;
  isDragging: boolean;
  onChange: (patch: Partial<ContentBlockDto>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  bookId,
  block,
  index,
  total,
  isDragging,
  onChange,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
}) => {
  const type = block.type ?? 'text';
  const isImage = type === 'image' || type === 'figure';
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const uploadImage = useUploadBookPageImage(bookId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const currentImageRef = block.imageUrl ?? block.imagePath ?? block.thumbnailUrl ?? '';
  const hasImage = Boolean(currentImageRef);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [currentImageRef]);

  const handleImageFileSelected = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('File phải là ảnh (PNG, JPG, WEBP, …).');
      return;
    }
    setUploadError(null);
    try {
      const res = await uploadImage.mutateAsync(file);
      const result = res.result;
      if (!result || !result.imageUrl) {
        setUploadError('Tải ảnh thất bại — phản hồi không hợp lệ.');
        return;
      }
      onChange({ imageUrl: result.imageUrl, imagePath: result.imagePath, thumbnailUrl: '' });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Tải ảnh thất bại.');
    }
  };

  const handleClearImage = () => {
    onChange({ imageUrl: '', imagePath: '', thumbnailUrl: '' });
    setUploadError(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  let uploadButtonLabel: string;
  if (uploadImage.isPending) uploadButtonLabel = 'Đang tải...';
  else if (hasImage) uploadButtonLabel = 'Thay ảnh khác';
  else uploadButtonLabel = 'Tải ảnh lên';

  let imagePlaceholderText: string;
  if (hasImage) {
    imagePlaceholderText = 'Không tải được ảnh hiện tại — bạn có thể tải lên ảnh mới để thay thế.';
  } else {
    imagePlaceholderText = 'Chưa có ảnh — bấm "Tải ảnh lên" để thêm minh hoạ.';
  }

  const headingLabel = (block.label ?? '').trim();
  const headingMeta = (() => {
    const fallback = { kind: 'section' as const, level: 3 };
    if (!headingLabel) return fallback;
    const parts = headingLabel.split(':');
    if (parts.length !== 2) return fallback;
    const kind = parts[0]?.toLowerCase();
    const levelRaw = Number(parts[1]);
    const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : fallback.level;
    const allowedKinds = new Set(['chapter', 'lesson', 'section', 'other']);
    if (!kind || !allowedKinds.has(kind)) return { ...fallback, level };
    return { kind: kind as 'chapter' | 'lesson' | 'section' | 'other', level };
  })();

  const headingKind = headingMeta.kind;
  const headingLevel = headingMeta.level;
  const isHeading = type === 'heading';
  const typeSelectValue = isHeading ? `heading:${headingLevel}` : type;

  const contentValue = block.content ?? '';
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastNonEmptySelectionRef = useRef<{ start: number; end: number } | null>(null);

  const getEffectiveSelection = () => {
    const el = contentTextareaRef.current;
    if (!el) return null;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    if (start !== end) return { start, end };
    return lastNonEmptySelectionRef.current;
  };

  const replaceContentAndSelection = (nextContent: string, nextStart: number, nextEnd: number) => {
    onChange({ content: nextContent });
    // Keep user selection stable across re-render.
    requestAnimationFrame(() => {
      const el = contentTextareaRef.current;
      if (!el) return;
      try {
        el.focus();
        el.setSelectionRange(nextStart, nextEnd);
      } catch {
        // Ignore selection errors for safety (e.g. element not mounted yet).
      }
    });
  };

  const toggleTokenWrap = (wrapLeft: string, wrapRight: string) => {
    const el = contentTextareaRef.current;
    if (!el) {
      onChange({ content: `${wrapLeft}${contentValue}${wrapRight}` });
      return;
    }

    const effective = getEffectiveSelection();
    if (!effective) {
      onChange({ content: `${wrapLeft}${contentValue}${wrapRight}` });
      return;
    }
    const { start, end } = effective;
    const selected = contentValue.slice(start, end);
    const leftLen = wrapLeft.length;
    const rightLen = wrapRight.length;

    // Case 1: selection already includes wrappers -> remove them from inside selection.
    if (
      selected.length >= leftLen + rightLen &&
      selected.startsWith(wrapLeft) &&
      selected.endsWith(wrapRight)
    ) {
      const inner = selected.slice(leftLen, selected.length - rightLen);
      const nextContent = contentValue.slice(0, start) + inner + contentValue.slice(end);
      replaceContentAndSelection(nextContent, start, start + inner.length);
      return;
    }

    // Case 2: wrappers are immediately before/after the selection -> remove them.
    const before = start >= leftLen ? contentValue.slice(start - leftLen, start) : '';
    const after =
      end + rightLen <= contentValue.length ? contentValue.slice(end, end + rightLen) : '';
    if (before === wrapLeft && after === wrapRight) {
      const nextContent =
        contentValue.slice(0, start - leftLen) + selected + contentValue.slice(end + rightLen);
      const nextStart = start - leftLen;
      replaceContentAndSelection(nextContent, nextStart, nextStart + selected.length);
      return;
    }

    // Case 3: wrap selection (or caret when selection is empty).
    const nextContent =
      contentValue.slice(0, start) + wrapLeft + selected + wrapRight + contentValue.slice(end);
    const nextStart = start + leftLen;
    replaceContentAndSelection(nextContent, nextStart, nextStart + selected.length);
  };

  const PRESET_COLORS = [
    '#2563eb', // blue
    '#16a34a', // green
    '#dc2626', // red
    '#f59e0b', // amber
    '#7c3aed', // violet
    '#db2777', // pink
  ];

  const toggleColorWrapFor = (nextColorHex: string) => {
    const el = contentTextareaRef.current;
    if (!el) return;

    const left = `[color=${nextColorHex}]`;
    const right = '[/color]';
    const leftLen = left.length;
    const rightLen = right.length;

    const effective = getEffectiveSelection();
    if (!effective) return;
    const { start, end } = effective;
    const selected = contentValue.slice(start, end);

    if (
      selected.length >= leftLen + rightLen &&
      selected.startsWith(left) &&
      selected.endsWith(right)
    ) {
      const inner = selected.slice(leftLen, selected.length - rightLen);
      const nextContent = contentValue.slice(0, start) + inner + contentValue.slice(end);
      replaceContentAndSelection(nextContent, start, start + inner.length);
      return;
    }

    const before = start >= leftLen ? contentValue.slice(start - leftLen, start) : '';
    const after =
      end + rightLen <= contentValue.length ? contentValue.slice(end, end + rightLen) : '';
    if (before === left && after === right) {
      const nextContent =
        contentValue.slice(0, start - leftLen) + selected + contentValue.slice(end + rightLen);
      const nextStart = start - leftLen;
      replaceContentAndSelection(nextContent, nextStart, nextStart + selected.length);
      return;
    }

    const nextContent =
      contentValue.slice(0, start) + left + selected + right + contentValue.slice(end);
    const nextStart = start + leftLen;
    replaceContentAndSelection(nextContent, nextStart, nextStart + selected.length);
  };

  const supportsInlineFormatting = !isImage && type !== 'formula' && type !== 'latex';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        'border border-slate-200 rounded-lg p-3 bg-white space-y-2',
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-400 w-6">#{index + 1}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 cursor-grab">
          Keo tha
        </span>
        <select
          value={typeSelectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith('heading:')) {
              const lvl = Number(v.split(':')[1]);
              const level = Number.isFinite(lvl) ? Math.min(6, Math.max(1, lvl)) : headingLevel;
              onChange({ type: 'heading', label: `${headingKind}:${level}` });
              return;
            }
            onChange({ type: v });
          }}
          className="text-xs px-2 py-1 border border-slate-200 rounded bg-white"
        >
          {BLOCK_TYPES.filter((t) => t !== 'heading').map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {Array.from({ length: 6 }).map((_, i) => {
            const lvl = i + 1;
            return (
              <option key={`heading-${lvl}`} value={`heading:${lvl}`}>
                Heading {lvl}
              </option>
            );
          })}
        </select>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-slate-400 hover:text-red-500"
          title="Xoá block"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isImage ? (
        <div className="space-y-2">
          {hasImage && !imageLoadFailed ? (
            <div className="rounded border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              <VerifyBlockImage
                bookId={bookId}
                imageUrl={block.imageUrl ?? block.thumbnailUrl}
                imagePath={block.imagePath}
                alt={block.caption ?? 'Ảnh minh hoạ'}
                className="max-h-[180px] w-auto object-contain rounded"
                onError={() => setImageLoadFailed(true)}
                onLoad={() => setImageLoadFailed(false)}
              />
            </div>
          ) : (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-6 flex flex-col items-center justify-center gap-1 text-slate-500">
              <ImageOff size={20} className="text-slate-400" />
              <span className="text-xs">{imagePlaceholderText}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label
              className={[
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition cursor-pointer',
                uploadImage.isPending
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
              ].join(' ')}
              title="Chọn ảnh từ máy của bạn"
            >
              {uploadImage.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Upload size={12} />
              )}
              {uploadButtonLabel}
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadImage.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleImageFileSelected(file);
                  if (e.target) e.target.value = '';
                }}
              />
            </label>
            {hasImage && (
              <button
                type="button"
                onClick={handleClearImage}
                disabled={uploadImage.isPending}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                title="Bỏ ảnh hiện tại khỏi block"
              >
                <Trash2 size={12} /> Xoá ảnh
              </button>
            )}
            {hasImage && (
              <span className="text-[11px] text-slate-400">
                Đã đính kèm ảnh — URL được ẩn để tránh lộ đường dẫn nội bộ.
              </span>
            )}
          </div>

          {uploadError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {uploadError}
            </div>
          )}

          <input
            type="text"
            value={block.caption ?? ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Chú thích (caption)"
            className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
          />
        </div>
      ) : (
        <>
          {isHeading && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={headingKind}
                onChange={(e) => onChange({ label: `${e.target.value}:${headingLevel}` })}
                className="text-xs px-2 py-1 border border-slate-200 rounded bg-white"
              >
                <option value="chapter">Chương</option>
                <option value="lesson">Bài</option>
                <option value="section">Mục</option>
                <option value="other">Khác</option>
              </select>
            </div>
          )}

          {supportsInlineFormatting && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleTokenWrap('*', '*')}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="In nghiêng (ghi nhớ: *text*)"
              >
                In nghiêng
              </button>
              <button
                type="button"
                onClick={() => toggleTokenWrap('**', '**')}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="In đậm (ghi nhớ: **text**)"
              >
                In đậm
              </button>
              <button
                type="button"
                onClick={() => toggleTokenWrap('__', '__')}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Gạch chân (ghi nhớ: __text__)"
              >
                Gạch chân
              </button>
              <button
                type="button"
                onClick={() => toggleTokenWrap('~~', '~~')}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Gạch ngang (ghi nhớ: ~~text~~)"
              >
                Gạch ngang
              </button>
              <button
                type="button"
                onClick={() => toggleTokenWrap('`', '`')}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Code (ghi nhớ: `code`)"
              >
                Code
              </button>
              <div className="relative flex items-center ml-auto" aria-label="Chọn màu">
                <button
                  type="button"
                  onClick={() => setShowColorPalette((s) => !s)}
                  className="h-7 w-7 rounded border border-slate-200 hover:bg-white flex-shrink-0"
                  style={{ background: selectedColor }}
                  title="Màu chữ"
                />
                {showColorPalette && (
                  <div className="absolute right-0 top-9 z-20 p-2 rounded-lg border border-slate-200 bg-white shadow-md">
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c);
                            toggleColorWrapFor(c);
                            setShowColorPalette(false);
                          }}
                          className="h-6 w-6 rounded border border-slate-200 hover:scale-105 transition-transform"
                          style={{ background: c }}
                          title={`Tô màu ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <textarea
            ref={contentTextareaRef}
            value={block.content ?? ''}
            onChange={(e) => onChange({ content: e.target.value })}
            onSelect={() => {
              const el = contentTextareaRef.current;
              if (!el) return;
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? start;
              if (start !== end) lastNonEmptySelectionRef.current = { start, end };
            }}
            onMouseUp={() => {
              const el = contentTextareaRef.current;
              if (!el) return;
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? start;
              if (start !== end) lastNonEmptySelectionRef.current = { start, end };
            }}
            onKeyUp={() => {
              const el = contentTextareaRef.current;
              if (!el) return;
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? start;
              if (start !== end) lastNonEmptySelectionRef.current = { start, end };
            }}
            rows={3}
            placeholder="Nội dung văn bản (hỗ trợ $latex$)"
            className="w-full text-sm px-2 py-1 border border-slate-200 rounded font-mono"
          />
          {(type === 'formula' || type === 'latex') && (
            <textarea
              value={block.latex ?? ''}
              onChange={(e) => onChange({ latex: e.target.value })}
              rows={2}
              placeholder="LaTeX thuần (không bọc $)"
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded font-mono"
            />
          )}
          {type === 'exercise' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={block.exerciseNum ?? ''}
                onChange={(e) => onChange({ exerciseNum: e.target.value })}
                placeholder="Số bài tập"
                className="text-sm px-2 py-1 border border-slate-200 rounded"
              />
              <input
                type="text"
                value={block.exerciseType ?? ''}
                onChange={(e) => onChange({ exerciseType: e.target.value })}
                placeholder="Loại bài tập"
                className="text-sm px-2 py-1 border border-slate-200 rounded"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const BlockPreview: React.FC<{ bookId: string; block: ContentBlockDto }> = ({ bookId, block }) => {
  const type = block.type ?? 'text';

  if (type === 'image' || type === 'figure') {
    const src = resolveAssetUrl(block.imageUrl ?? block.thumbnailUrl ?? block.imagePath ?? '');
    return (
      <figure className="text-center">
        {src ? (
          <VerifyBlockImage
            bookId={bookId}
            imageUrl={block.imageUrl ?? block.thumbnailUrl}
            imagePath={block.imagePath}
            alt={block.caption ?? 'figure'}
            className="max-h-[200px] inline-block rounded"
          />
        ) : (
          <div className="text-xs text-slate-400 italic">[Ảnh chưa có URL]</div>
        )}
        {block.caption && (
          <figcaption className="text-xs text-slate-500 mt-1">
            <MathText text={block.caption} bookOcr />
          </figcaption>
        )}
      </figure>
    );
  }
  if (type === 'formula' || type === 'latex') {
    const tex = block.latex ?? block.content ?? '';
    return (
      <div className="overflow-x-auto py-1">
        {tex ? (
          <MathText text={tex} block bookOcr />
        ) : (
          <span className="text-xs text-slate-400 italic">[Công thức trống]</span>
        )}
      </div>
    );
  }
  if (type === 'heading') {
    const defaultHeadingMeta = { kind: 'section' as const, level: 3 };

    const label = (block.label ?? '').trim();
    const parsed = (() => {
      if (!label) return defaultHeadingMeta;
      const parts = label.split(':');
      if (parts.length !== 2) return defaultHeadingMeta;
      const kindRaw = parts[0]?.toLowerCase();
      const levelRaw = Number(parts[1]);
      const level = Number.isFinite(levelRaw)
        ? Math.min(6, Math.max(1, levelRaw))
        : defaultHeadingMeta.level;
      const allowedKinds = new Set(['chapter', 'lesson', 'section', 'other']);
      const kind = allowedKinds.has(kindRaw)
        ? (kindRaw as 'chapter' | 'lesson' | 'section' | 'other')
        : defaultHeadingMeta.kind;
      return { kind, level };
    })();

    const level = parsed.level;
    const headingClassByLevel: Record<number, string> = {
      1: 'text-2xl font-extrabold tracking-wide uppercase text-slate-800',
      2: 'text-xl font-bold text-slate-800',
      3: 'text-lg font-semibold uppercase tracking-wide text-slate-700',
      4: 'text-base font-semibold text-slate-700',
      5: 'text-sm font-semibold uppercase tracking-wide text-slate-600',
      6: 'text-xs font-semibold uppercase tracking-wide text-slate-600',
    };

    const kindAccent =
      parsed.kind === 'chapter'
        ? 'border-l border-slate-300 pl-2'
        : parsed.kind === 'lesson'
          ? 'border-l border-blue-200 pl-2'
          : parsed.kind === 'section'
            ? 'border-l border-amber-200 pl-2'
            : '';

    const headingClass = `${headingClassByLevel[level] ?? headingClassByLevel[4]} ${kindAccent}`;
    return (
      <div className={headingClass}>
        <MathText text={block.content ?? ''} bookOcr />
      </div>
    );
  }
  if (type === 'exercise') {
    return (
      <div className="border-l-2 border-blue-300 pl-2">
        <div className="text-[11px] text-blue-600 font-semibold">
          {block.exerciseType ?? 'Bài tập'} {block.exerciseNum ?? ''}
        </div>
        <div className="text-sm text-slate-700">
          <MathText text={block.content ?? ''} bookOcr />
        </div>
      </div>
    );
  }
  return (
    <div className="text-sm text-slate-700">
      <MathText text={block.content ?? ''} bookOcr />
    </div>
  );
};

export default BookVerifyPage;
