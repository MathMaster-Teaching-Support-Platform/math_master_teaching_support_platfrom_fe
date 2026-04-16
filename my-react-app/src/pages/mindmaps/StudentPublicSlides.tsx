import {
  BookMarked,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  HardDrive,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
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

  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);

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
  const [slidesResult, setSlidesResult] =
    useState<PageResult<LessonSlideGeneratedFile>>(emptySlidePage());

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [downloadingSlideId, setDownloadingSlideId] = useState('');
  const [previewingSlideId, setPreviewingSlideId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewSlide, setSelectedPreviewSlide] = useState<LessonSlideGeneratedFile | null>(
    null
  );
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [slidesError, setSlidesError] = useState('');

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

  const revokePreviewPdfUrl = () => {
    if (previewPdfUrl) {
      globalThis.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl('');
    }
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

  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoadingCatalog(true);
        const response = await LessonSlideService.getSchoolGrades(true);
        setSchoolGrades(response.result || []);
      } catch (err) {
        setSlidesError(err instanceof Error ? err.message : 'Không thể tải danh sách khối lớp');
      } finally {
        setLoadingCatalog(false);
      }
    };

    void loadGrades();
  }, []);

  const resetResourceState = () => {
    setSlidePage(0);
    setSlideKeyword('');
    setSlidesResult(emptySlidePage());
  };

  const handleGradeChange = async (value: string) => {
    setGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    resetResourceState();

    if (!value) return;

    try {
      setLoadingCatalog(true);
      setSlidesError('');
      const response = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(response.result || []);
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleSubjectChange = async (value: string) => {
    setSubjectId(value);
    setChapterId('');
    setLessonId('');
    setChapters([]);
    setLessons([]);
    resetResourceState();

    if (!value) return;

    try {
      setLoadingCatalog(true);
      setSlidesError('');
      const response = await LessonSlideService.getChaptersBySubject(value);
      setChapters(response.result || []);
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể tải danh sách chương');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleChapterChange = async (value: string) => {
    setChapterId(value);
    setLessonId('');
    setLessons([]);
    resetResourceState();

    if (!value) return;

    try {
      setLoadingCatalog(true);
      setSlidesError('');
      const response = await LessonSlideService.getLessonsByChapter(value);
      setLessons(response.result || []);
    } catch (err) {
      setSlidesError(err instanceof Error ? err.message : 'Không thể tải danh sách bài học');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleLessonChange = (value: string) => {
    setLessonId(value);
    resetResourceState();
  };

  useEffect(() => {
    let cancelled = false;
    const loadSlides = async () => {
      setLoadingSlides(true);
      setSlidesError('');

      try {
        const response = await LessonSlideService.getAllPublicGeneratedFiles({
          lessonId: lessonId || undefined,
          keyword: slideKeywordDebounced || undefined,
          page: slidePage,
          size: slideSize,
          sortBy: slideSortBy,
          direction: slideDirection,
        });

        if (!cancelled) {
          const normalizedContent = (response.result.content || []).filter(
            (slide) => slide.isPublic
          );
          setSlidesResult({
            ...response.result,
            content: normalizedContent,
            totalElements: Math.max(response.result.totalElements ?? 0, normalizedContent.length),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setSlidesError(
            err instanceof Error ? err.message : 'Không thể tải danh sách slide công khai'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSlides(false);
        }
      }
    };

    void loadSlides();
    return () => {
      cancelled = true;
    };
  }, [lessonId, slideKeywordDebounced, slidePage, slideSize, slideSortBy, slideDirection]);

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

  const handleOpenPreview = async (slide: LessonSlideGeneratedFile) => {
    if (!slide.isPublic) {
      setSlidesError(
        'Slide này hiện không ở trạng thái public nên không thể preview từ tài khoản student.'
      );
      return;
    }

    setSelectedPreviewSlide(slide);
    setPreviewingSlideId(slide.id);
    setSlidesError('');
    revokePreviewPdfUrl();
    setIsPreviewOpen(true);

    try {
      const response = await LessonSlideService.getPublicGeneratedFilePreviewPdf(slide.id);
      const pdfObjectUrl = globalThis.URL.createObjectURL(response.blob);
      setPreviewPdfUrl(pdfObjectUrl);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1168) {
        setSlidesError(
          'Slide này không còn public ở phía server. Danh sách đã được làm mới, vui lòng thử lại slide khác.'
        );
        setIsPreviewOpen(false);
        setSelectedPreviewSlide(null);
        void (async () => {
          try {
            const refreshed = await LessonSlideService.getAllPublicGeneratedFiles({
              lessonId: lessonId || undefined,
              keyword: slideKeywordDebounced || undefined,
              page: slidePage,
              size: slideSize,
              sortBy: slideSortBy,
              direction: slideDirection,
            });
            setSlidesResult({
              ...refreshed.result,
              content: (refreshed.result.content || []).filter((item) => item.isPublic),
            });
          } catch {
            // Keep current list when refresh fails.
          }
        })();
      } else {
        setSlidesError(err instanceof Error ? err.message : 'Không thể tạo preview PDF');
      }
    } finally {
      setPreviewingSlideId('');
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedPreviewSlide(null);
    revokePreviewPdfUrl();
  };

  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        globalThis.URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  return (
    <DashboardLayout user={mockStudent} role="student">
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header">
            <div className="header-stack">
              <div className="header-kicker">Student Public Slides</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Thư viện slide công khai</h2>
                {!loadingSlides && <span className="count-chip">{slidesResult.totalElements}</span>}
              </div>
              <p className="header-sub">Tìm kiếm và tải slide bài giảng công khai</p>
            </div>
          </header>

          {/* ── Filter panel ── */}
          <div className="sps-filter-panel">
            <div className="sps-filter-panel__head">
              <Filter size={13} />
              <span>Bộ lọc tìm kiếm</span>
            </div>
            <div className="sps-filter-bar">
              <div className="sps-filter-field">
                <span className="sps-filter-label">
                  <GraduationCap size={12} />
                  Khối lớp
                </span>
                <select
                  className="sps-select"
                  value={gradeId}
                  onChange={(e) => void handleGradeChange(e.target.value)}
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
                <span className="sps-filter-label">
                  <BookOpen size={12} />
                  Môn học
                </span>
                <select
                  className="sps-select"
                  value={subjectId}
                  onChange={(e) => void handleSubjectChange(e.target.value)}
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
                <span className="sps-filter-label">
                  <BookMarked size={12} />
                  Chương
                </span>
                <select
                  className="sps-select"
                  value={chapterId}
                  onChange={(e) => void handleChapterChange(e.target.value)}
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
                <span className="sps-filter-label">
                  <FileText size={12} />
                  Bài học
                </span>
                <select
                  className="sps-select"
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
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
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
                  className="search-box__clear"
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
                className="sps-select sps-select--sm"
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
                className="sps-select sps-select--sm"
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
                className="sps-select sps-select--sm"
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
              <div className="grid-cards">
                {slidesResult.content.map((slide) => (
                  <article key={slide.id} className="data-card sps-card">
                    <div className="sps-cover">
                      <div className="sps-cover__overlay" />
                      <span className="sps-cover__ext">.pptx</span>
                      <div className="sps-cover__icon">
                        <FileText size={42} strokeWidth={1.3} />
                      </div>
                    </div>
                    <div className="sps-card-body">
                      <h3 className="sps-card__title">
                        {(slide.fileName ?? 'generated-slide.pptx').replace(/\.[^/.]+$/, '') ||
                          'generated-slide'}
                      </h3>
                      <div className="sps-card-metrics">
                        <span className="metric">
                          <HardDrive size={11} />
                          {formatFileSize(slide.fileSizeBytes)}
                        </span>
                        <span className="metric">
                          <Calendar size={11} />
                          {new Date(slide.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="metric">{slide.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                      <div className="sps-card-actions">
                        <button
                          type="button"
                          className="sps-btn-preview"
                          onClick={() => void handleOpenPreview(slide)}
                          disabled={previewingSlideId === slide.id || !slide.isPublic}
                        >
                          <Eye size={14} />
                          {previewingSlideId === slide.id ? 'Đang preview...' : 'Xem PDF'}
                        </button>
                        <button
                          type="button"
                          className="sps-btn-download"
                          onClick={() => void handleDownloadSlide(slide.id)}
                          disabled={downloadingSlideId === slide.id || !slide.isPublic}
                        >
                          <Download size={14} />
                          {downloadingSlideId === slide.id ? 'Đang tải...' : 'Tải xuống'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Pagination ── */}
              <div className="sps-pagination">
                <button
                  type="button"
                  className="btn secondary"
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
                  className="btn secondary"
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

          {isPreviewOpen && (
            <div className="sps-modal-overlay" onClick={handleClosePreview}>
              <div
                className="sps-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Xem trước slide PDF"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="sps-modal-header">
                  <h3>{selectedPreviewSlide?.fileName || 'Xem trước slide'}</h3>
                  <button type="button" className="sps-modal-close" onClick={handleClosePreview}>
                    ×
                  </button>
                </div>

                <div className="sps-modal-body">
                  {!previewPdfUrl && previewingSlideId && (
                    <div className="sps-math-loader" role="status" aria-live="polite">
                      <div className="sps-math-loader-ring" aria-hidden="true" />
                      <div className="sps-math-loader-symbols" aria-hidden="true">
                        <span>x²</span>
                        <span>∫</span>
                        <span>π</span>
                        <span>√</span>
                        <span>Δ</span>
                      </div>
                      <p>Đang dựng preview PDF...</p>
                    </div>
                  )}

                  {previewPdfUrl && (
                    <iframe
                      className="sps-modal-iframe"
                      src={previewPdfUrl}
                      title="Public slide preview PDF"
                    />
                  )}
                </div>

                <div className="sps-modal-footer">
                  <button type="button" className="btn secondary" onClick={handleClosePreview}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={
                      !selectedPreviewSlide || downloadingSlideId === selectedPreviewSlide.id
                    }
                    onClick={() =>
                      selectedPreviewSlide && void handleDownloadSlide(selectedPreviewSlide.id)
                    }
                  >
                    {selectedPreviewSlide && downloadingSlideId === selectedPreviewSlide.id
                      ? 'Đang tải...'
                      : 'Tải xuống'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
