import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  RefreshCw,
  ListTree,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../../components/common/MathText';
import { mockAdmin } from '../../../data/mockData';
import { API_BASE_URL } from '../../../config/api.config';
import { AuthService } from '../../../services/api/auth.service';
import {
  useBook,
  useBookContent,
  useBookPageMapping,
  usePageHistory,
  useRefreshVerification,
  useUpdatePage,
} from '../../../hooks/useBooks';
import type {
  ContentBlockDto,
  LessonContentResponse,
  LessonPageResponse,
} from '../../../types/book.types';

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

const resolveAssetUrl = (value?: string | null): string => {
  const raw = value?.trim();
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:') || ABSOLUTE_URL_REGEX.test(raw)) return raw;
  if (raw.startsWith('/')) {
    if (!API_BASE_URL) return raw;
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
    setResolvedSrc('');

    const fetchProtectedImage = async () => {
      if (!finalSrc) return;
      if (!shouldTryAuthImageFetch(finalSrc)) {
        setResolvedSrc(finalSrc);
        return;
      }
      const token = AuthService.getToken();
      if (!token) {
        setResolvedSrc(finalSrc);
        return;
      }
      try {
        const response = await fetch(finalSrc, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'image/*,*/*',
          },
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) {
          setResolvedSrc(finalSrc);
          return;
        }
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
          setResolvedSrc(finalSrc);
          return;
        }
        revokedObjectUrl = URL.createObjectURL(blob);
        setResolvedSrc(revokedObjectUrl);
      } catch {
        setResolvedSrc(finalSrc);
      }
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

  return <img src={resolvedSrc} alt={alt} className={className} onLoad={onLoad} onError={onError} />;
};

interface BookVerifyContentProps {
  bookId: string;
  embedded?: boolean;
  onBack?: () => void;
}

export const BookVerifyContent: React.FC<BookVerifyContentProps> = ({
  bookId,
  embedded = false,
  onBack,
}) => {
  const { data: bookData, isLoading: bookLoading } = useBook(bookId);
  const { data: contentData, isLoading: contentLoading, refetch } = useBookContent(bookId);
  const { data: mappingData } = useBookPageMapping(bookId);
  const refreshVerification = useRefreshVerification(bookId ?? '');

  const book = bookData?.result;
  const lessons: LessonContentResponse[] = useMemo(
    () => contentData?.result ?? [],
    [contentData]
  );

  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [collapsedLessons, setCollapsedLessons] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const lessonChapterMeta = useMemo(() => {
    const meta = new Map<string, { chapterId: string; chapterTitle: string }>();
    for (const item of mappingData?.result ?? []) {
      if (!meta.has(item.lessonId)) {
        meta.set(item.lessonId, {
          chapterId: item.chapterId,
          chapterTitle: item.chapterTitle,
        });
      }
    }
    return meta;
  }, [mappingData]);

  const lessonsByChapter = useMemo(() => {
    const map = new Map<
      string,
      { chapterId: string; chapterTitle: string; lessons: LessonContentResponse[] }
    >();
    for (const lesson of lessons) {
      const chapterMeta = lessonChapterMeta.get(lesson.lessonId);
      const chapterId = chapterMeta?.chapterId ?? `unknown-${lesson.lessonId}`;
      const chapterTitle = chapterMeta?.chapterTitle ?? 'Chương chưa xác định';
      const existing = map.get(chapterId);
      if (existing) {
        existing.lessons.push(lesson);
      } else {
        map.set(chapterId, { chapterId, chapterTitle, lessons: [lesson] });
      }
    }
    return Array.from(map.values());
  }, [lessons, lessonChapterMeta]);

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
              {bookLoading ? 'Đang tải…' : book?.title ?? 'Sách không tồn tại'}
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
                <StatusPill verified={book.verified} />
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  {book.mappedLessonCount} bài đã mapping
                </span>
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
                            {chapterCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
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
                                    {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{l.lessonTitle}</div>
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
                                            Trang {p.pageNumber}
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
                  chapterTitle={lessonChapterMeta.get(resolvedLessonId)?.chapterTitle ?? ''}
                  page={activePage}
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
      details.push(entry.afterVerified ? 'Đã đánh dấu trang là đã xác minh.' : 'Đã bỏ đánh dấu xác minh.');
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
      b.verified ? 'Trạng thái xác minh: Chưa xác minh -> Đã xác minh' : 'Trạng thái xác minh: Đã xác minh -> Chưa xác minh'
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
}) => {
  const updatePage = useUpdatePage(bookId, lessonId);
  const cloneBlocks = (items: ContentBlockDto[]) => items.map((b) => ({ ...b }));
  const [blocks, setBlocks] = useState<ContentBlockDto[]>(cloneBlocks(page.contentBlocks ?? []));
  const [verified, setVerified] = useState<boolean>(page.verified);
  const [lastSavedBlocks, setLastSavedBlocks] = useState<ContentBlockDto[]>(
    cloneBlocks(page.contentBlocks ?? [])
  );
  const [lastSavedVerified, setLastSavedVerified] = useState<boolean>(page.verified);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const {
    data: pageHistoryData,
    refetch: refetchPageHistory,
    isLoading: pageHistoryLoading,
  } = usePageHistory(bookId, lessonId, page.pageNumber);

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
    verified !== lastSavedVerified ||
    JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocks);
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
  const rawPreviewImageSrc =
    page.rawImageUrl ??
    blocks.find((b) => b.type === 'image' || b.type === 'figure')?.imageUrl ??
    blocks.find((b) => b.type === 'image' || b.type === 'figure')?.thumbnailUrl ??
    blocks.find((b) => b.type === 'image' || b.type === 'figure')?.imagePath ??
    '';
  const resolvedRawPreviewImageSrc = resolveAssetUrl(rawPreviewImageSrc);
  const [failedRawImageSrc, setFailedRawImageSrc] = useState<string | null>(null);
  const isLikelyObjectKey =
    Boolean(rawPreviewImageSrc) &&
    !rawPreviewImageSrc.startsWith('http://') &&
    !rawPreviewImageSrc.startsWith('https://') &&
    !rawPreviewImageSrc.startsWith('data:') &&
    !rawPreviewImageSrc.startsWith('blob:') &&
    !rawPreviewImageSrc.startsWith('/');
  const showRawPreviewImage =
    Boolean(resolvedRawPreviewImageSrc) && failedRawImageSrc !== resolvedRawPreviewImageSrc;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Trang {page.pageNumber}</div>
          <div className="text-[11px] text-slate-400">
            {blocks.length} block · OCR confidence:{' '}
            {page.ocrConfidence != null ? page.ocrConfidence.toFixed(2) : 'n/a'}
            {savedAt ? ` · Đã lưu lúc ${savedAt}` : ''}
          </div>
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
              <p className="text-xs text-slate-500">Trang {page.pageNumber}</p>
            </div>
          </div>
          {(showRawPreviewImage || rawPreviewImageSrc) && (
            <div className="border border-slate-200 rounded p-2">
              <div className="text-[11px] text-slate-400 mb-1">Ảnh gốc OCR</div>
              {showRawPreviewImage ? (
                <AuthenticatedImage
                  src={resolvedRawPreviewImageSrc}
                  alt={`Trang ${page.pageNumber}`}
                  onError={() => setFailedRawImageSrc(resolvedRawPreviewImageSrc)}
                  onLoad={() => setFailedRawImageSrc(null)}
                  className="w-full max-h-[300px] object-contain rounded"
                />
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Không tải được ảnh xem trước từ URL hiện tại.
                  {isLikelyObjectKey
                    ? ' Giá trị hiện tại trông giống object key private, cần backend trả presigned URL.'
                    : ' URL có thể hết hạn hoặc bị chặn CORS/quyền truy cập.'}
                </div>
              )}
            </div>
          )}
          <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/40 min-h-[200px]">
            {blocks.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Chưa có nội dung.</div>
            ) : (
              blocks.map((b, idx) => <BlockPreview key={idx} block={b} />)
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
                Lịch sử thay đổi · Trang {page.pageNumber}
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
              <div className="text-sm text-slate-500">
                Chưa có version nào cho trang này.
              </div>
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
                          Người sửa: Quản trị viên ·{' '}
                          {h.verified ? 'Đã xác minh' : 'Chưa xác minh'}
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
                    <div className="text-[11px] uppercase tracking-wide text-amber-700/80 mb-1">Tóm tắt thay đổi</div>
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
                      Version {comparisonPair.from.versionNo} · {new Date(comparisonPair.from.ts).toLocaleString()} (Quản trị viên)
                      {' -> '}
                      Version {comparisonPair.to.versionNo} · {new Date(comparisonPair.to.ts).toLocaleString()} (Quản trị viên)
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
        <>
          <input
            type="text"
            value={block.imageUrl ?? block.imagePath ?? ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="URL ảnh"
            className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
          />
          <input
            type="text"
            value={block.caption ?? ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Chú thích (caption)"
            className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
          />
        </>
      ) : (
        <>
          {isHeading && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={headingKind}
                onChange={(e) =>
                  onChange({ label: `${e.target.value}:${headingLevel}` })
                }
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
          {(type === 'exercise') && (
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

const BlockPreview: React.FC<{ block: ContentBlockDto }> = ({ block }) => {
  const type = block.type ?? 'text';

  if (type === 'image' || type === 'figure') {
    const src = resolveAssetUrl(block.imageUrl ?? block.thumbnailUrl ?? block.imagePath ?? '');
    return (
      <figure className="text-center">
        {src ? (
          <AuthenticatedImage
            src={src}
            alt={block.caption ?? 'figure'}
            className="max-h-[200px] inline-block rounded"
          />
        ) : (
          <div className="text-xs text-slate-400 italic">[Ảnh chưa có URL]</div>
        )}
        {block.caption && (
          <figcaption className="text-xs text-slate-500 mt-1">{block.caption}</figcaption>
        )}
      </figure>
    );
  }
  if (type === 'formula' || type === 'latex') {
    const tex = block.latex ?? block.content ?? '';
    return (
      <div className="overflow-x-auto py-1">
        {tex ? (
          <MathText text={`$$${tex}$$`} block />
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
      const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : defaultHeadingMeta.level;
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
        <MathText text={block.content ?? ''} />
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
          <MathText text={block.content ?? ''} />
        </div>
      </div>
    );
  }
  return (
    <div className="text-sm text-slate-700">
      <MathText text={block.content ?? ''} />
    </div>
  );
};

export default BookVerifyPage;
