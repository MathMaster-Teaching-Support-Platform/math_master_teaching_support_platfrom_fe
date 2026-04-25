import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../config/api.config';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type {
  ChapterBySubject,
  LessonByChapter,
  LessonSlideGeneratedFile,
  PageResult,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './StudentPublicMindmaps.css';
import './StudentPublicSlides.css';

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

const getGeneratedDisplayName = (slide: LessonSlideGeneratedFile): string => {
  const preferredName = slide.name?.trim();
  if (preferredName) return preferredName;
  const fallbackName = (slide.fileName || '').trim();
  return fallbackName.replace(/\.[^/.]+$/, '') || 'generated-slide';
};

const resolveThumbnailUrl = (thumbnail?: string | null): string | null => {
  if (!thumbnail) return null;
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  if (thumbnail.startsWith('/api/')) return thumbnail;
  const normalizedThumbnail = thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`;
  return `${API_BASE_URL}${normalizedThumbnail}`;
};

const emptySlidePage = (): PageResult<LessonSlideGeneratedFile> => ({
  content: [],
  number: 0,
  size: DEFAULT_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
});

export default function StudentPublicSlides() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const [slideKeyword, setSlideKeyword] = useState(() => searchParams.get('slideQ') || '');
  const [slideKeywordDebounced, setSlideKeywordDebounced] = useState(() =>
    (searchParams.get('slideQ') || '').trim()
  );
  const [slidePage, setSlidePage] = useState(() =>
    getQueryNumber(searchParams.get('slidePage'), 0)
  );
  const [slideSize, setSlideSize] = useState(() =>
    getQueryNumber(searchParams.get('slideSize'), DEFAULT_PAGE_SIZE)
  );
  const [slideSortBy, setSlideSortBy] = useState(() =>
    getQuerySortBy(searchParams.get('slideSortBy'))
  );
  const [slideDirection, setSlideDirection] = useState<SortDirection>(() =>
    getQueryDirection(searchParams.get('slideDir'))
  );
  const [slidesResult, setSlidesResult] = useState<PageResult<LessonSlideGeneratedFile>>(emptySlidePage());
  const [downloadingSlideId, setDownloadingSlideId] = useState('');
  const [previewSlideId, setPreviewSlideId] = useState('');
  const [previewSlidePdfUrl, setPreviewSlidePdfUrl] = useState('');
  const [loadingPreviewSlideId, setLoadingPreviewSlideId] = useState('');
  const [previewIframeLoaded, setPreviewIframeLoaded] = useState(false);
  const previewPdfObjectUrlRef = useRef<string | null>(null);
  const [slidesError, setSlidesError] = useState('');

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
  const slidesQuery = useQuery({
    queryKey: [
      'public-slides',
      { lessonId, keyword: slideKeywordDebounced, page: slidePage, size: slideSize, sortBy: slideSortBy, direction: slideDirection },
    ],
    queryFn: () =>
      LessonSlideService.getAllPublicGeneratedFiles({
        lessonId: lessonId || undefined,
        keyword: slideKeywordDebounced || undefined,
        page: slidePage,
        size: slideSize,
        sortBy: slideSortBy,
        direction: slideDirection,
      }),
    staleTime: 30_000,
  });

  const schoolGrades: SchoolGrade[] = gradesQuery.data?.result ?? [];
  const subjects: SubjectByGrade[] = subjectsQuery.data?.result ?? [];
  const chapters: ChapterBySubject[] = chaptersQuery.data?.result ?? [];
  const lessons: LessonByChapter[] = lessonsQuery.data?.result ?? [];
  const loadingCatalog =
    gradesQuery.isFetching || subjectsQuery.isFetching || chaptersQuery.isFetching || lessonsQuery.isFetching;
  const loadingSlides = slidesQuery.isLoading || slidesQuery.isFetching;

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

  const formatFileSize = (sizeInBytes: number): string => {
    if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) return '--';
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const blobUrl = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'generated-slide.pptx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setSlideKeywordDebounced(slideKeyword.trim()), 400);
    return () => globalThis.clearTimeout(timer);
  }, [slideKeyword]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (slideKeyword) params.set('slideQ', slideKeyword);
    if (slidePage > 0) params.set('slidePage', String(slidePage));
    if (slideSize !== DEFAULT_PAGE_SIZE) params.set('slideSize', String(slideSize));
    if (slideSortBy !== 'createdAt') params.set('slideSortBy', slideSortBy);
    if (slideDirection !== 'DESC') params.set('slideDir', slideDirection);
    setSearchParams(params, { replace: true });
  }, [slideKeyword, slidePage, slideSize, slideSortBy, slideDirection, setSearchParams]);

  const resetResourceState = () => {
    setSlidePage(0);
    setSlideKeyword('');
    setSlidesResult(emptySlidePage());
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

  useEffect(() => {
    if (slidesQuery.data?.result) {
      const normalizedContent = (slidesQuery.data.result.content || []).filter((slide) => slide.isPublic);
      setSlidesResult({
        ...slidesQuery.data.result,
        content: normalizedContent,
        totalElements: Math.max(slidesQuery.data.result.totalElements ?? 0, normalizedContent.length),
      });
    }
  }, [slidesQuery.data]);

  useEffect(() => {
    const catalogError =
      gradesQuery.error || subjectsQuery.error || chaptersQuery.error || lessonsQuery.error;
    if (catalogError instanceof Error) {
      setSlidesError(catalogError.message);
      return;
    }
    if (slidesQuery.error instanceof Error) {
      setSlidesError(slidesQuery.error.message);
      return;
    }
    if (!loadingCatalog && !loadingSlides) {
      setSlidesError('');
    }
  }, [
    gradesQuery.error,
    subjectsQuery.error,
    chaptersQuery.error,
    lessonsQuery.error,
    slidesQuery.error,
    loadingCatalog,
    loadingSlides,
  ]);

  const handleDownloadSlide = async (generatedFileId: string) => {
    setDownloadingSlideId(generatedFileId);
    setSlidesError('');

    try {
      const response = await LessonSlideService.downloadPublicGeneratedFile(generatedFileId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể tải slide công khai');
    } finally {
      setDownloadingSlideId('');
    }
  };

  const handlePreviewSlide = async (generatedFileId: string) => {
    setPreviewSlideId(generatedFileId);
    setPreviewSlidePdfUrl('');
    setPreviewIframeLoaded(false);
    setLoadingPreviewSlideId(generatedFileId);
    setSlidesError('');

    try {
      const response = await LessonSlideService.getPublicGeneratedFilePreviewPdf(generatedFileId);
      const blobUrl = globalThis.URL.createObjectURL(response.blob);

      if (previewPdfObjectUrlRef.current) {
        globalThis.URL.revokeObjectURL(previewPdfObjectUrlRef.current);
      }
      previewPdfObjectUrlRef.current = blobUrl;
      setPreviewSlidePdfUrl(blobUrl);
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể xem thử slide');
      setPreviewSlideId('');
    } finally {
      setLoadingPreviewSlideId('');
    }
  };

  const closePreview = () => {
    setPreviewSlideId('');
    setPreviewSlidePdfUrl('');
    setPreviewIframeLoaded(false);
    if (previewPdfObjectUrlRef.current) {
      globalThis.URL.revokeObjectURL(previewPdfObjectUrlRef.current);
      previewPdfObjectUrlRef.current = null;
    }
  };

  return (
    <DashboardLayout user={{ name: 'Người dùng', avatar: 'ND', role: 'student' }} role="student">
      <div className="module-layout-container flex-1 bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[#141413]">
        <section className="module-page bg-[#F5F4ED] font-[Be_Vietnam_Pro]">
          {/* ── Header ── */}
          <header className="page-header">
            <div className="header-stack">
              <div className="header-kicker font-[Be_Vietnam_Pro] text-[#87867F]">Student Public Slides</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2
                  className="font-medium text-[#141413]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  Thư viện slide công khai
                </h2>
                {!loadingSlides && <span className="count-chip font-[Be_Vietnam_Pro]">{slidesResult.totalElements}</span>}
              </div>
              <p className="header-sub font-[Be_Vietnam_Pro] text-[#5E5D59]">Tìm kiếm và tải slide bài giảng công khai</p>
            </div>
          </header>

          {/* ── Filter panel ── */}
          <div className="sps-filter-panel bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5]">
            <div className="sps-filter-panel__head">
              <Filter size={13} />
              <span className="font-[Be_Vietnam_Pro]">Bộ lọc tìm kiếm</span>
            </div>
            <div className="sps-filter-bar">
              <div className="sps-filter-field">
                <span className="sps-filter-label font-[Be_Vietnam_Pro]">
                  <GraduationCap size={12} />
                  Khối lớp
                </span>
                <select
                  className="sps-select font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  value={gradeId}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  disabled={loadingCatalog}
                >
                  <option value="">Tất cả khối lớp</option>
                  {schoolGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sps-filter-field">
                <span className="sps-filter-label font-[Be_Vietnam_Pro]">
                  <BookOpen size={12} />
                  Môn học
                </span>
                <select
                  className="sps-select font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!gradeId || loadingCatalog}
                >
                  <option value="">{gradeId ? 'Tất cả môn học' : 'Chọn khối trước'}</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sps-filter-field">
                <span className="sps-filter-label font-[Be_Vietnam_Pro]">
                  <BookMarked size={12} />
                  Chương
                </span>
                <select
                  className="sps-select font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
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

              <div className="sps-filter-field">
                <span className="sps-filter-label font-[Be_Vietnam_Pro]">
                  <FileText size={12} />
                  Bài học
                </span>
                <select
                  className="sps-select font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
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
          <div className="toolbar font-[Be_Vietnam_Pro]">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                className="font-[Be_Vietnam_Pro] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                placeholder="Tìm theo tên file slide..."
                value={slideKeyword}
                onChange={(e) => {
                  setSlideKeyword(e.target.value);
                  setSlidePage(0);
                }}
              />
              {slideKeyword && (
                <button
                  type="button"
                  className="search-box__clear transition-all duration-150 hover:text-[#C96442] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setSlideKeyword('');
                    setSlidePage(0);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              <select
                className="sps-select sps-select--sm font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                value={slideSortBy}
                onChange={(e) => {
                  setSlideSortBy(e.target.value);
                  setSlidePage(0);
                }}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="updatedAt">Cập nhật</option>
              </select>
              <select
                className="sps-select sps-select--sm font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                value={slideDirection}
                onChange={(e) => {
                  setSlideDirection(e.target.value as SortDirection);
                  setSlidePage(0);
                }}
              >
                <option value="DESC">Mới nhất</option>
                <option value="ASC">Cũ nhất</option>
              </select>
              <select
                className="sps-select sps-select--sm font-[Be_Vietnam_Pro] bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                value={slideSize}
                onChange={(e) => {
                  setSlideSize(Number(e.target.value));
                  setSlidePage(0);
                }}
              >
                <option value={6}>6 / trang</option>
                <option value={9}>9 / trang</option>
                <option value={12}>12 / trang</option>
              </select>
            </div>
          </div>

          {/* ── Active filter chip ── */}
          {selectedLesson && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Bài học</span>
                <strong className="summary-value">{selectedLesson.title}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Kết quả</span>
                <strong className="summary-value">{slidesResult.totalElements} slide</strong>
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loadingSlides && (
            <div className="skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {slidesError && !loadingSlides && (
            <div className="empty">
              <p style={{ color: 'var(--mod-danger)' }}>{slidesError}</p>
            </div>
          )}

          {/* ── Empty ── */}
          {!loadingSlides && !slidesError && slidesResult.content.length === 0 && (
            <div className="empty">
              <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Không có slide công khai phù hợp bộ lọc hiện tại.</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loadingSlides && slidesResult.content.length > 0 && (
            <>
              <div className="sps-card-grid">
                {slidesResult.content.map((slide) => (
                  <div
                    key={slide.id}
                    className="sps-slide-card bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-200 hover:shadow-[0px_0px_0px_1px_#C2C0B6] hover:-translate-y-0.5"
                  >
                    <div className="sps-slide-card__thumb">
                      {resolveThumbnailUrl(slide.thumbnail) ? (
                        <img
                          src={resolveThumbnailUrl(slide.thumbnail) || ''}
                          alt={getGeneratedDisplayName(slide)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="sps-slide-card__thumb-placeholder">
                          {getGeneratedDisplayName(slide).slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="sps-slide-card__badge">PUBLISHED</span>
                    </div>

                    <div className="sps-slide-card__body">
                      <p className="sps-slide-card__title" title={getGeneratedDisplayName(slide)}>
                        {getGeneratedDisplayName(slide)}
                      </p>
                      <ul className="sps-slide-card__meta">
                        <li>
                          <span>DUNG LƯỢNG</span>
                          <span>{formatFileSize(slide.fileSizeBytes)}</span>
                        </li>
                        <li>
                          <span>NGÀY TẠO</span>
                          <span>{new Date(slide.createdAt).toLocaleDateString('vi-VN')}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="sps-slide-card__actions">
                      <button
                        type="button"
                        className="sps-slide-card__btn secondary font-[Be_Vietnam_Pro] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                        onClick={() => void handlePreviewSlide(slide.id)}
                        disabled={loadingPreviewSlideId === slide.id}
                      >
                        <Eye size={14} />
                        {loadingPreviewSlideId === slide.id ? 'Đang tải...' : 'Xem'}
                      </button>
                      <button
                        type="button"
                        className="sps-slide-card__btn primary font-[Be_Vietnam_Pro] bg-[#C96442] text-[#FAF9F5] shadow-[0px_0px_0px_1px_#C96442] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                        onClick={() => void handleDownloadSlide(slide.id)}
                        disabled={downloadingSlideId === slide.id || !slide.isPublic}
                      >
                        <Download size={14} />
                        {downloadingSlideId === slide.id ? 'Đang tải...' : 'Tải xuống'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Pagination ── */}
              <div className="sps-pagination">
                <button
                  type="button"
                  className="btn secondary font-[Be_Vietnam_Pro] bg-[#E8E6DC] text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  onClick={() => setSlidePage((prev) => Math.max(prev - 1, 0))}
                  disabled={slidesResult.first}
                >
                  <ChevronLeft size={15} /> Trước
                </button>
                <span className="sps-page-info">
                  Trang <strong>{slidesResult.number + 1}</strong> /{' '}
                  {Math.max(slidesResult.totalPages, 1)} ·{' '}
                  <span style={{ color: '#60748f' }}>{slidesResult.totalElements} slide</span>
                </span>
                <button
                  type="button"
                  className="btn secondary font-[Be_Vietnam_Pro] bg-[#E8E6DC] text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  onClick={() =>
                    setSlidePage((prev) =>
                      slidesResult.totalPages > 0
                        ? Math.min(prev + 1, slidesResult.totalPages - 1)
                        : prev
                    )
                  }
                  disabled={slidesResult.last || slidesResult.totalPages === 0}
                >
                  Sau <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {previewSlideId && (
        <div className="ai-slide-modal-overlay" onClick={closePreview}>
          <div
            className="ai-slide-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Xem thử slide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-slide-modal-header">
              <h3
                className="font-medium text-[#141413]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                Xem thử slide
              </h3>
              <button
                type="button"
                className="ai-slide-modal-close transition-all duration-150 hover:text-[#C96442] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                onClick={closePreview}
                aria-label="Đóng xem trước"
              >
                <X size={16} />
              </button>
            </div>
            <div className="ai-slide-modal-body">
              {loadingPreviewSlideId === previewSlideId && (
                <div className="ai-slide-math-loader" role="status" aria-live="polite">
                  <div className="ai-slide-math-loader-ring" aria-hidden="true" />
                  <div className="ai-slide-math-loader-symbols" aria-hidden="true">
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#C96442]" />
                  </div>
                  <p>Đang dựng slide toán học...</p>
                </div>
              )}
              {!loadingPreviewSlideId && previewSlidePdfUrl && (
                <div className="ai-slide-office-viewer-wrap">
                  {!previewIframeLoaded && (
                    <div className="ai-slide-iframe-skeleton" aria-hidden="true">
                      <div className="ai-slide-iframe-skeleton__bar ai-slide-iframe-skeleton__bar--title" />
                      <div className="ai-slide-iframe-skeleton__slides">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="ai-slide-iframe-skeleton__slide">
                            <div className="ai-slide-iframe-skeleton__slide-inner" />
                          </div>
                        ))}
                      </div>
                      <div className="ai-slide-iframe-skeleton__hint">
                        <span className="ai-slide-iframe-skeleton__ring" />
                        {' '}Đang tải slide...
                      </div>
                    </div>
                  )}
                  <iframe
                    className={`ai-slide-office-viewer-frame${previewIframeLoaded ? ' ai-slide-office-viewer-frame--loaded' : ''}`}
                    src={previewSlidePdfUrl}
                    title="Slide preview"
                    loading="eager"
                    onLoad={() => setPreviewIframeLoaded(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
