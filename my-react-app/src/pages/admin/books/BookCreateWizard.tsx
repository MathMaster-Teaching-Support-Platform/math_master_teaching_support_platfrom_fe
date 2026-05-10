import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListTree,
  Rocket,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../../data/mockData';
import { useBook, useBookList } from '../../../hooks/useBooks';
import { BookVerifyContent } from './BookVerifyPage';
import BookUploadStep from './steps/BookUploadStep';
import PageMappingStep from './steps/PageMappingStep';
import OcrTriggerStep from './steps/OcrTriggerStep';

type StepIdx = 0 | 1 | 2 | 3;

function parseWizardStepParam(raw: string | null): StepIdx | null {
  if (raw == null || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  return (n - 1) as StepIdx;
}

/** Giữ bước wizard sau F5 — key theo bộ + cuốn đang chọn. */
function wizardStepStorageKey(seriesRouteId: string, activeBookId: string): string {
  return `bookWizardStep:${seriesRouteId}:${activeBookId}`;
}

function readWizardStepFromLocationSearch(): StepIdx {
  try {
    const params = new URLSearchParams(globalThis.location.search);
    return parseWizardStepParam(params.get('wizardStep')) ?? 0;
  } catch {
    return 0;
  }
}

const STEPS: Array<{ key: StepIdx; title: string; icon: React.ReactNode }> = [
  { key: 0, title: 'Thông tin & Tải lên PDF', icon: <FileText size={16} /> },
  { key: 1, title: 'Liên kết bài học → trang', icon: <ListTree size={16} /> },
  { key: 2, title: 'Chạy OCR', icon: <Rocket size={16} /> },
  { key: 3, title: 'Xác minh nội dung', icon: <ClipboardCheck size={16} /> },
];

const BookCreateWizard: React.FC = () => {
  const { bookId: routeId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [seriesId, setSeriesId] = useState<string | undefined>(routeId);
  const [activeBookId, setActiveBookId] = useState<string | undefined>(undefined);
  const [stepIdx, setStepIdx] = useState<StepIdx>(() => readWizardStepFromLocationSearch());
  const wizardHydratedKeyRef = useRef<string>('');

  /** Đổi bộ trong URL → bỏ cuốn đang chọn để không GET /books/:id của bộ cũ trong lúc fetch danh sách mới. */
  useEffect(() => {
    setActiveBookId(undefined);
  }, [routeId]);

  /** URL là nguồn đúng cho `:bookId` (thực tế là bookSeriesId). `seriesId` state có thể còn bộ cũ sau khi đổi route → không được ưu tiên hơn routeId. */
  const seriesLookupId = routeId ?? seriesId;
  const seriesBooksQuery = useBookList(
    {
      bookSeriesId: seriesLookupId || undefined,
      page: 0,
      size: 100,
    },
    { enabled: Boolean(seriesLookupId) }
  );
  const seriesBooksRaw = useMemo(() => {
    const rows = seriesBooksQuery.data?.result?.content ?? [];
    return [...rows].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
  }, [seriesBooksQuery.data]);

  /** Tránh nháy danh sách rỗng khi refetch — không reset volume đang chọn / không làm sai điều kiện mapping. */
  const seriesSnapshotRef = useRef(seriesBooksRaw);
  useEffect(() => {
    if (seriesBooksRaw.length > 0) {
      seriesSnapshotRef.current = seriesBooksRaw;
    }
  }, [seriesBooksRaw]);
  const listBusy = seriesBooksQuery.isFetching;
  const seriesBooks =
    seriesBooksRaw.length > 0
      ? seriesBooksRaw
      : listBusy && seriesSnapshotRef.current.length > 0
        ? seriesSnapshotRef.current
        : seriesBooksRaw;

  /** URL /wizard/:id là bookSeriesId — không gọi GET /books/:id cho đến khi biết list theo bộ rỗng (fallback: id là bookId). */
  const fallbackBookFetchEnabled =
    Boolean(routeId) &&
    seriesBooksQuery.isSuccess &&
    seriesBooksRaw.length === 0 &&
    !(listBusy && seriesSnapshotRef.current.length > 0);
  const fallbackBookQuery = useBook(routeId, { enabled: fallbackBookFetchEnabled });
  const activeBookQuery = useBook(activeBookId);
  const book = activeBookQuery.data?.result;
  const seriesHasAnyMapping = useMemo(() => {
    if (seriesBooks.length > 0) {
      return seriesBooks.some((seriesBook) => (seriesBook.mappedLessonCount ?? 0) > 0);
    }
    return (book?.mappedLessonCount ?? 0) > 0;
  }, [seriesBooks, book?.mappedLessonCount]);

  useEffect(() => {
    if (!routeId) return;
    if (seriesBooks.length > 0) {
      setSeriesId(routeId);
      if (!activeBookId || !seriesBooks.some((b) => b.id === activeBookId)) {
        setActiveBookId(seriesBooks[0].id);
      }
      return;
    }
    const fallbackBook = fallbackBookQuery.data?.result;
    if (!fallbackBook) return;
    const resolvedSeriesId = fallbackBook.bookSeriesId ?? fallbackBook.id;
    setSeriesId(resolvedSeriesId);
    setActiveBookId(fallbackBook.id);
    if (routeId !== resolvedSeriesId) {
      const qs = searchParams.toString();
      navigate(`/admin/books/${resolvedSeriesId}/wizard${qs ? `?${qs}` : ''}`, {
        replace: true,
      });
    }
  }, [routeId, seriesBooks, activeBookId, fallbackBookQuery.data, navigate, searchParams]);

  const canGoNext = useMemo(() => {
    if (stepIdx === 0) return Boolean(book?.pdfPath);
    if (stepIdx === 1) return seriesHasAnyMapping;
    if (stepIdx === 2) return book?.status === 'OCR_DONE';
    return false;
  }, [stepIdx, book, seriesHasAnyMapping]);

  const canAccessStep = useCallback(
    (targetStep: StepIdx) => {
      if (targetStep === 0) return true;
      if (!activeBookId || !book) return false;
      if (targetStep >= 1 && !book.pdfPath) return false;
      if (targetStep >= 2 && !seriesHasAnyMapping) return false;
      if (targetStep >= 3 && book.status !== 'OCR_DONE') return false;
      return true;
    },
    [activeBookId, book, seriesHasAnyMapping]
  );

  const persistWizardStep = useCallback(
    (s: StepIdx) => {
      const param = String(s + 1);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('wizardStep', param);
          return next;
        },
        { replace: true }
      );
      if (routeId && activeBookId) {
        try {
          sessionStorage.setItem(wizardStepStorageKey(routeId, activeBookId), param);
        } catch {
          /* quota / private mode */
        }
      }
    },
    [setSearchParams, routeId, activeBookId]
  );

  const goToWizardStep = useCallback(
    (s: StepIdx) => {
      setStepIdx(s);
      persistWizardStep(s);
    },
    [persistWizardStep]
  );

  /** Sau F5 / đổi cuốn: khôi phục bước từ sessionStorage (đúng book) hoặc ?wizardStep= (nếu hợp lệ). */
  useEffect(() => {
    if (!routeId || !activeBookId) return;
    if (book?.id !== activeBookId) return;
    if (activeBookQuery.isFetching || activeBookQuery.isPending) return;

    const hydrateKey = `${routeId}:${activeBookId}`;
    if (wizardHydratedKeyRef.current === hydrateKey) return;
    wizardHydratedKeyRef.current = hydrateKey;

    let fromStorage: StepIdx | null = null;
    try {
      fromStorage = parseWizardStepParam(
        sessionStorage.getItem(wizardStepStorageKey(routeId, activeBookId))
      );
    } catch {
      fromStorage = null;
    }
    const fromUrl = parseWizardStepParam(searchParams.get('wizardStep'));

    let candidate: StepIdx | null = null;
    if (fromStorage !== null && canAccessStep(fromStorage)) candidate = fromStorage;
    else if (fromUrl !== null && canAccessStep(fromUrl)) candidate = fromUrl;

    if (candidate !== null) {
      setStepIdx(candidate);
      persistWizardStep(candidate);
    }
  }, [
    routeId,
    activeBookId,
    book?.id,
    searchParams,
    canAccessStep,
    persistWizardStep,
    activeBookQuery.isFetching,
    activeBookQuery.isPending,
  ]);

  useEffect(() => {
    // Khi đổi cuốn trong bộ, detail query của cuốn mới có khoảng trống book === undefined.
    // Không được coi là "chưa có PDF" — tránh nhảy oạt về bước 1 trong lúc đang fetch.
    if (!activeBookId) return;
    if (book?.id !== activeBookId) return;
    // Refetch có thể trả payload tạm thiếu pdfPath/status → không kẹp bước trong lúc đó.
    if (activeBookQuery.isFetching || activeBookQuery.isPending) return;

    if (stepIdx > 0 && !book.pdfPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStepIdx(0);
      persistWizardStep(0);
      return;
    }
    if (stepIdx > 1 && !seriesHasAnyMapping) {
      setStepIdx(1);
      persistWizardStep(1);
      return;
    }
    if (stepIdx > 2 && book.status !== 'OCR_DONE') {
      setStepIdx(2);
      persistWizardStep(2);
    }
  }, [
    book,
    activeBookId,
    stepIdx,
    seriesHasAnyMapping,
    activeBookQuery.isFetching,
    activeBookQuery.isPending,
    persistWizardStep,
  ]);

  const handleBookCreated = ({ bookId, seriesId }: { bookId: string; seriesId: string }) => {
    setSeriesId(seriesId);
    setActiveBookId(bookId);
    navigate(`/admin/books/${seriesId}/wizard`, { replace: true });
  };

  const handleSelectBook = (selectedId: string) => {
    setActiveBookId(selectedId);
  };

  const handleSwitchToNew = () => {
    setSeriesId(undefined);
    setActiveBookId(undefined);
    wizardHydratedKeyRef.current = '';
    setStepIdx(0);
    setSearchParams({}, { replace: true });
    navigate('/admin/books/new', { replace: true });
  };

  return (
    <DashboardLayout
      role="admin"
      user={mockAdmin}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/books')}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-[Playfair_Display] text-[22px] text-[#141413]">
              {routeId || seriesId ? 'Thiết lập bộ sách giáo khoa' : 'Thêm sách giáo khoa mới'}
            </h1>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
              Quy trình 4 bước theo bộ sách:
            </p>
          </div>
        </div>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const completed = i < stepIdx;
            const active = i === stepIdx;
            let stepBadgeClass = 'bg-slate-200 text-slate-700';
            if (active) {
              stepBadgeClass = 'bg-blue-500 text-white';
            } else if (completed) {
              stepBadgeClass = 'bg-emerald-500 text-white';
            }
            let stepButtonTone = 'border-slate-200 bg-white text-slate-500';
            if (active) {
              stepButtonTone = 'border-blue-500 bg-blue-50 text-blue-700';
            } else if (completed) {
              stepButtonTone = 'border-emerald-200 bg-emerald-50 text-emerald-700';
            }
            const stepIsAccessible = canAccessStep(s.key);
            return (
              <li key={s.key} className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!stepIsAccessible}
                  onClick={() => {
                    if (stepIsAccessible) {
                      goToWizardStep(s.key);
                    }
                  }}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border w-full transition',
                    stepButtonTone,
                    stepIsAccessible ? '' : 'opacity-50 cursor-not-allowed',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-6 h-6 rounded-full inline-flex items-center justify-center text-xs',
                      stepBadgeClass,
                    ].join(' ')}
                  >
                    {completed ? <Check size={12} /> : i + 1}
                  </span>
                  {s.icon}
                  {s.title}
                </button>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={14} className="text-slate-400 hidden md:block" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {stepIdx === 0 && (
            <BookUploadStep
              key={book?.id ?? 'new-book'}
              seriesId={seriesLookupId}
              book={book}
              onCreated={handleBookCreated}
              onSelectBook={handleSelectBook}
              onSwitchToNew={handleSwitchToNew}
              onUploaded={() => goToWizardStep(1)}
            />
          )}
          {stepIdx === 1 && activeBookId && book && <PageMappingStep book={book} />}
          {stepIdx === 2 && activeBookId && book && (
            <OcrTriggerStep
              book={book}
              onSelectSeriesBook={handleSelectBook}
              onComplete={() => goToWizardStep(3)}
            />
          )}
          {stepIdx === 3 && activeBookId && book && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Bước 4 · Xác minh nội dung
                </h2>
                <p className="text-sm text-slate-500">
                  Xác minh trực tiếp tại đây: kiểm tra/chỉnh sửa đoạn và đánh dấu theo từng trang.
                </p>
              </div>
              <BookVerifyContent
                bookId={activeBookId}
                embedded
                onSelectSeriesBook={handleSelectBook}
              />
            </div>
          )}
        </div>

        {stepIdx === 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => goToWizardStep(0)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => goToWizardStep(2)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Tiếp tục <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookCreateWizard;
