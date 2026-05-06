import { useQuery } from '@tanstack/react-query';
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  Network,
  Search,
  User,
  Workflow,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, PaginatedResponse } from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';

const DEFAULT_PAGE_SIZE = 9;
type SortDirection = 'ASC' | 'DESC';

const getQueryNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const getQueryDirection = (value: string | null): SortDirection =>
  value === 'ASC' ? 'ASC' : 'DESC';

const getQuerySortBy = (value: string | null): string =>
  value === 'updatedAt' ? 'updatedAt' : 'createdAt';

const emptyMindmapPage = (): PaginatedResponse<Mindmap> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: DEFAULT_PAGE_SIZE,
});

export default function StudentPublicMindmaps() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const [mindmapKeyword, setMindmapKeyword] = useState(() => searchParams.get('mindmapQ') || '');
  const [mindmapKeywordDebounced, setMindmapKeywordDebounced] = useState(() =>
    (searchParams.get('mindmapQ') || '').trim()
  );

  const [mindmapPage, setMindmapPage] = useState(() =>
    getQueryNumber(searchParams.get('mindmapPage'), 0)
  );
  const [mindmapSize, setMindmapSize] = useState(() =>
    getQueryNumber(searchParams.get('mindmapSize'), DEFAULT_PAGE_SIZE)
  );
  const [mindmapSortBy, setMindmapSortBy] = useState(() =>
    getQuerySortBy(searchParams.get('mindmapSortBy'))
  );
  const [mindmapDirection, setMindmapDirection] = useState<SortDirection>(() =>
    getQueryDirection(searchParams.get('mindmapDir'))
  );
  const [mindmapsResult, setMindmapsResult] =
    useState<PaginatedResponse<Mindmap>>(emptyMindmapPage());

  const [loadingMindmaps, setLoadingMindmaps] = useState(false);
  const [previewingMindmapId, setPreviewingMindmapId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewMindmap, setSelectedPreviewMindmap] = useState<Mindmap | null>(null);
  const [previewFrameLoading, setPreviewFrameLoading] = useState(false);
  const [downloadingPreviewMindmapId, setDownloadingPreviewMindmapId] = useState('');
  const [mindmapsError, setMindmapsError] = useState('');
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  const gradesQuery = useQuery({
    queryKey: ['school-grades', 'active'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60 * 1000,
  });
  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'by-school-grade', gradeId],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(gradeId),
    enabled: !!gradeId,
    staleTime: 5 * 60 * 1000,
  });
  const chaptersQuery = useQuery({
    queryKey: ['chapters', 'by-subject', subjectId],
    queryFn: () => LessonSlideService.getChaptersBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 5 * 60 * 1000,
  });
  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'by-chapter', chapterId],
    queryFn: () => LessonSlideService.getLessonsByChapter(chapterId),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  });
  const mindmapsQuery = useQuery({
    queryKey: [
      'public-mindmaps',
      {
        lessonId,
        name: mindmapKeywordDebounced,
        page: mindmapPage,
        size: mindmapSize,
        sortBy: mindmapSortBy,
        direction: mindmapDirection,
      },
    ],
    queryFn: () =>
      MindmapService.getPublicMindmaps({
        lessonId: lessonId || undefined,
        name: mindmapKeywordDebounced || undefined,
        page: mindmapPage,
        size: mindmapSize,
        sortBy: mindmapSortBy,
        direction: mindmapDirection,
      }),
    staleTime: 30_000,
  });
  const schoolGrades: SchoolGrade[] = gradesQuery.data?.result ?? [];
  const subjects: SubjectByGrade[] = subjectsQuery.data?.result ?? [];
  const chapters: ChapterBySubject[] = chaptersQuery.data?.result ?? [];
  const lessons: LessonByChapter[] = lessonsQuery.data?.result ?? [];
  const loadingCatalog =
    gradesQuery.isFetching ||
    subjectsQuery.isFetching ||
    chaptersQuery.isFetching ||
    lessonsQuery.isFetching;

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

  useEffect(() => {
    const timer = globalThis.setTimeout(
      () => setMindmapKeywordDebounced(mindmapKeyword.trim()),
      400
    );
    return () => globalThis.clearTimeout(timer);
  }, [mindmapKeyword]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (mindmapKeyword) params.set('mindmapQ', mindmapKeyword);
    if (mindmapPage > 0) params.set('mindmapPage', String(mindmapPage));
    if (mindmapSize !== DEFAULT_PAGE_SIZE) params.set('mindmapSize', String(mindmapSize));
    if (mindmapSortBy !== 'createdAt') params.set('mindmapSortBy', mindmapSortBy);
    if (mindmapDirection !== 'DESC') params.set('mindmapDir', mindmapDirection);
    setSearchParams(params, { replace: true });
  }, [mindmapKeyword, mindmapPage, mindmapSize, mindmapSortBy, mindmapDirection, setSearchParams]);

  const resetResourceState = () => {
    setMindmapPage(0);
    setMindmapKeyword('');
    setMindmapsResult(emptyMindmapPage());
  };

  const handleGradeChange = (value: string) => {
    setGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    resetResourceState();
  };

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    setChapterId('');
    setLessonId('');
    resetResourceState();
  };

  const handleChapterChange = (value: string) => {
    setChapterId(value);
    setLessonId('');
    resetResourceState();
  };

  const handleLessonChange = (value: string) => {
    setLessonId(value);
    resetResourceState();
  };

  const handleOpenMindmapPreview = async (mindmap: Mindmap) => {
    setSelectedPreviewMindmap(mindmap);
    setPreviewingMindmapId(mindmap.id);
    setPreviewFrameLoading(true);
    setMindmapsError('');
    setIsPreviewOpen(true);

    // Small delay only to ensure opening transition is smooth; actual render readiness is handled by iframe onLoad.
    globalThis.setTimeout(() => setPreviewingMindmapId(''), 180);
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const blobUrl = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'mindmap.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(blobUrl);
  };

  const requestIframeMindmapExport = async (mindmap: Mindmap): Promise<Blob> => {
    const iframeWindow = previewIframeRef.current?.contentWindow;
    if (!iframeWindow) {
      throw new Error('Khung xem trước chưa sẵn sàng để xuất ảnh.');
    }

    const requestId = `${mindmap.id}-${Date.now()}`;

    return new Promise<Blob>((resolve, reject) => {
      const timeoutId = globalThis.setTimeout(() => {
        globalThis.window.removeEventListener('message', handleExportResponse);
        reject(new Error('Xuất ảnh mindmap quá thời gian chờ.'));
      }, 15000);

      const handleExportResponse = async (event: MessageEvent) => {
        if (event.origin !== globalThis.window.location.origin) return;

        const payload = event.data as
          | {
              type?: string;
              requestId?: string;
              status?: 'success' | 'error';
              dataUrl?: string;
              message?: string;
            }
          | undefined;

        if (!payload || payload.type !== 'public-mindmap-export-response') return;
        if (payload.requestId !== requestId) return;

        globalThis.clearTimeout(timeoutId);
        globalThis.window.removeEventListener('message', handleExportResponse);

        if (payload.status !== 'success' || !payload.dataUrl) {
          reject(new Error(payload.message || 'Không thể xuất ảnh từ bản xem trước.'));
          return;
        }

        try {
          const blob = await (await fetch(payload.dataUrl)).blob();
          resolve(blob);
        } catch {
          reject(new Error('Không thể chuyển ảnh mindmap sang file tải xuống.'));
        }
      };

      globalThis.window.addEventListener('message', handleExportResponse);

      iframeWindow.postMessage(
        {
          type: 'public-mindmap-export-request',
          requestId,
          mindmapId: mindmap.id,
        },
        globalThis.window.location.origin
      );
    });
  };

  const handleDownloadPreviewMindmap = async () => {
    if (!selectedPreviewMindmap) return;
    if (previewFrameLoading) {
      setMindmapsError('Mindmap đang được dựng. Vui lòng chờ vài giây rồi tải lại.');
      return;
    }

    setDownloadingPreviewMindmapId(selectedPreviewMindmap.id);
    setMindmapsError('');

    try {
      const blob = await requestIframeMindmapExport(selectedPreviewMindmap);
      const safeName = (selectedPreviewMindmap.title || 'mindmap')
        .replace(/[\\/:*?"<>|]/g, '-')
        .trim();

      triggerBlobDownload(blob, `${safeName || 'mindmap'}.png`);
    } catch (err) {
      setMindmapsError(err instanceof Error ? err.message : 'Không thể tải ảnh mindmap');
    } finally {
      setDownloadingPreviewMindmapId('');
    }
  };

  const handleCloseMindmapPreview = () => {
    setIsPreviewOpen(false);
    setSelectedPreviewMindmap(null);
    setPreviewFrameLoading(false);
  };

  useEffect(() => {
    if (!isPreviewOpen || !selectedPreviewMindmap) return;

    const handleViewerMessage = (event: MessageEvent) => {
      if (event.origin !== globalThis.window.location.origin) return;

      const payload = event.data as
        | {
            type?: string;
            mindmapId?: string;
            status?: 'loading' | 'ready' | 'error';
            message?: string | null;
          }
        | undefined;

      if (!payload || payload.type !== 'public-mindmap-viewer-status') return;
      if (payload.mindmapId !== selectedPreviewMindmap.id) return;

      if (payload.status === 'ready') {
        setPreviewFrameLoading(false);
      }

      if (payload.status === 'error') {
        setPreviewFrameLoading(false);
        setMindmapsError(payload.message || 'Không thể hiển thị mindmap');
      }
    };

    globalThis.window.addEventListener('message', handleViewerMessage);
    return () => {
      globalThis.window.removeEventListener('message', handleViewerMessage);
    };
  }, [isPreviewOpen, selectedPreviewMindmap]);

  useEffect(() => {
    setLoadingMindmaps(mindmapsQuery.isLoading || mindmapsQuery.isFetching);
    if (mindmapsQuery.data?.result) {
      setMindmapsResult(mindmapsQuery.data.result);
    }
  }, [mindmapsQuery.isLoading, mindmapsQuery.isFetching, mindmapsQuery.data]);

  useEffect(() => {
    const catalogError =
      gradesQuery.error || subjectsQuery.error || chaptersQuery.error || lessonsQuery.error;
    if (catalogError instanceof Error) {
      setMindmapsError(catalogError.message);
      return;
    }
    if (mindmapsQuery.error instanceof Error) {
      setMindmapsError(mindmapsQuery.error.message);
      return;
    }
    if (!loadingCatalog && !loadingMindmaps) {
      setMindmapsError('');
    }
  }, [
    gradesQuery.error,
    subjectsQuery.error,
    chaptersQuery.error,
    lessonsQuery.error,
    mindmapsQuery.error,
    loadingCatalog,
    loadingMindmaps,
  ]);

  return (
    <DashboardLayout
      user={mockStudent}
      role="student"
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header ── */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                  Thư viện Mindmaps
                </h1>
                {!loadingMindmaps && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                    {mindmapsResult.totalElements}
                  </span>
                )}
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                Khám phá sơ đồ tư duy từ giáo viên trên toàn hệ thống
              </p>
            </div>
          </div>

          {/* ── Filter panel ── */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#87867F]" />
              <h2 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                Bộ lọc tìm kiếm
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Lớp
                </label>
                <select
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  value={gradeId}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  disabled={loadingCatalog}
                >
                  <option value="">Tất cả lớp</option>
                  {schoolGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Môn học
                </label>
                <select
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!gradeId || loadingCatalog}
                >
                  <option value="">{gradeId ? 'Tất cả môn học' : 'Chọn lớp trước'}</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  <BookMarked className="w-3.5 h-3.5" />
                  Chương
                </label>
                <select
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  value={chapterId}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  disabled={!subjectId || loadingCatalog}
                >
                  <option value="">{subjectId ? 'Tất cả chương' : 'Chọn môn trước'}</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  <Network className="w-3.5 h-3.5" />
                  Bài học
                </label>
                <select
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  value={lessonId}
                  onChange={(e) => handleLessonChange(e.target.value)}
                  disabled={!chapterId || loadingCatalog}
                >
                  <option value="">{chapterId ? 'Tất cả bài học' : 'Chọn chương trước'}</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl shadow-[0px_0px_0px_1px_#E8E6DC] px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                placeholder="Tìm theo tiêu đề hoặc mô tả mindmap..."
                value={mindmapKeyword}
                onChange={(e) => {
                  setMindmapKeyword(e.target.value);
                  setMindmapPage(0);
                }}
              />
              {mindmapKeyword && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setMindmapKeyword('');
                    setMindmapPage(0);
                  }}
                  className="text-[#87867F] hover:text-[#141413] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                className="border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors"
                value={mindmapSortBy}
                onChange={(e) => {
                  setMindmapSortBy(e.target.value);
                  setMindmapPage(0);
                }}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="updatedAt">Cập nhật</option>
              </select>
              <select
                className="border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors"
                value={mindmapDirection}
                onChange={(e) => {
                  setMindmapDirection(e.target.value as SortDirection);
                  setMindmapPage(0);
                }}
              >
                <option value="DESC">Mới nhất</option>
                <option value="ASC">Cũ nhất</option>
              </select>
              <select
                className="border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors"
                value={mindmapSize}
                onChange={(e) => {
                  setMindmapSize(Number(e.target.value));
                  setMindmapPage(0);
                }}
              >
                <option value={6}>6 / trang</option>
                <option value={9}>9 / trang</option>
                <option value={12}>12 / trang</option>
              </select>
            </div>
          </div>

          {/* ── Active lesson chip ── */}
          {selectedLesson && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <div className="flex items-center gap-2">
                <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                  Bài học
                </span>
                <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                  {selectedLesson.title}
                </strong>
              </div>
              <div className="w-px h-4 bg-[#E8E6DC]" />
              <div className="flex items-center gap-2">
                <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                  Kết quả
                </span>
                <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                  {mindmapsResult.totalElements} mindmap
                </strong>
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loadingMindmaps && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {mindmapsError && !loadingMindmaps && (
            <div className="flex items-center justify-center py-12">
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333]">{mindmapsError}</p>
            </div>
          )}

          {/* ── Empty ── */}
          {!loadingMindmaps && !mindmapsError && mindmapsResult.content.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Workflow className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                Không có mindmap công khai phù hợp bộ lọc hiện tại.
              </p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loadingMindmaps && mindmapsResult.content.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mindmapsResult.content.map((mindmap) => (
                  <article
                    key={mindmap.id}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group cursor-pointer hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="h-[140px] bg-gradient-to-br from-[#E8E6DC] to-[#D1CFC5] relative flex items-center justify-center overflow-hidden">
                      <span className="absolute top-3 right-3 bg-[#FAF9F5]/90 rounded-lg px-2 py-1 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#141413]">
                        Mindmap
                      </span>
                      <div className="text-[#87867F] group-hover:scale-110 transition-transform duration-300">
                        <Workflow size={42} strokeWidth={1.3} />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-2">
                      <h3 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] line-clamp-2 leading-[1.3]">
                        {mindmap.title}
                      </h3>
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2">
                        {mindmap.description || 'Không có mô tả.'}
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                          <Network className="w-3.5 h-3.5" />
                          {mindmap.nodeCount} nút
                        </span>
                        <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                          <User className="w-3.5 h-3.5" />
                          {mindmap.teacherName || 'Giáo viên'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="mt-2 w-full bg-[#141413] text-[#FAF9F5] rounded-xl py-2.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => void handleOpenMindmapPreview(mindmap)}
                        disabled={previewingMindmapId === mindmap.id}
                      >
                        <Workflow className="w-3.5 h-3.5" />
                        {previewingMindmapId === mindmap.id ? 'Đang tải...' : 'Xem mindmap'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Pagination ── */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setMindmapPage((prev) => Math.max(prev - 1, 0))}
                  disabled={mindmapsResult.number <= 0}
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>

                <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                  Trang <strong className="text-[#141413]">{mindmapsResult.number + 1}</strong> /{' '}
                  {Math.max(mindmapsResult.totalPages, 1)} ·{' '}
                  <span>{mindmapsResult.totalElements} mindmap</span>
                </span>

                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() =>
                    setMindmapPage((prev) =>
                      mindmapsResult.totalPages > 0
                        ? Math.min(prev + 1, mindmapsResult.totalPages - 1)
                        : prev
                    )
                  }
                  disabled={
                    mindmapsResult.totalPages === 0 ||
                    mindmapsResult.number >= mindmapsResult.totalPages - 1
                  }
                >
                  Sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Preview modal ── */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseMindmapPreview}
        >
          <div
            className="bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.25)_0px_24px_64px] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Xem trước mindmap"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE6] bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                  <Workflow className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413] line-clamp-1 leading-[1.2]">
                    {selectedPreviewMindmap?.title || 'Xem trước mindmap'}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {selectedPreviewMindmap?.nodeCount != null && (
                      <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                        <Network className="w-3 h-3" />
                        {selectedPreviewMindmap.nodeCount} nút
                      </span>
                    )}
                    {selectedPreviewMindmap?.teacherName && (
                      <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                        <User className="w-3 h-3" />
                        {selectedPreviewMindmap.teacherName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87867F] hover:bg-[#F0EEE6] hover:text-[#141413] transition-colors flex-shrink-0 ml-4"
                onClick={handleCloseMindmapPreview}
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-[#F5F4ED] min-h-[500px]">
              {previewFrameLoading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#F5F4ED] z-10"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin" />
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] animate-pulse">
                    Đang dựng mindmap...
                  </p>
                </div>
              )}
              {selectedPreviewMindmap && (
                <iframe
                  ref={previewIframeRef}
                  className="w-full h-full min-h-[500px] border-0"
                  src={`/mindmaps/public/${selectedPreviewMindmap.id}?embedPreview=1`}
                  title={selectedPreviewMindmap.title || 'Mindmap preview'}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F0EEE6] bg-white">
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5] hidden sm:block">
                Ảnh PNG sẽ được tải về thiết bị của bạn
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                  onClick={handleCloseMindmapPreview}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                  disabled={
                    !selectedPreviewMindmap ||
                    previewFrameLoading ||
                    downloadingPreviewMindmapId === selectedPreviewMindmap.id
                  }
                  onClick={() => void handleDownloadPreviewMindmap()}
                >
                  <Download className="w-3.5 h-3.5" />
                  {selectedPreviewMindmap &&
                  downloadingPreviewMindmapId === selectedPreviewMindmap.id
                    ? 'Đang tải...'
                    : 'Tải ảnh PNG'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
