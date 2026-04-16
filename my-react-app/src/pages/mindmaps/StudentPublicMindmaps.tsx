import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Network,
  Search,
  User,
  Workflow,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import '../../styles/module-refactor.css';
import type { Mindmap, PaginatedResponse } from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './StudentPublicMindmaps.css';
import './StudentPublicMindmapsNew.css';

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

  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);

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

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingMindmaps, setLoadingMindmaps] = useState(false);
  const [previewingMindmapId, setPreviewingMindmapId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewMindmap, setSelectedPreviewMindmap] = useState<Mindmap | null>(null);
  const [previewFrameLoading, setPreviewFrameLoading] = useState(false);
  const [downloadingPreviewMindmapId, setDownloadingPreviewMindmapId] = useState('');
  const [mindmapsError, setMindmapsError] = useState('');

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

  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoadingCatalog(true);
        const response = await LessonSlideService.getSchoolGrades(true);
        setSchoolGrades(response.result || []);
      } catch (err) {
        setMindmapsError(err instanceof Error ? err.message : 'Không thể tải danh sách khối lớp');
      } finally {
        setLoadingCatalog(false);
      }
    };

    void loadGrades();
  }, []);

  const resetResourceState = () => {
    setMindmapPage(0);
    setMindmapKeyword('');
    setMindmapsResult(emptyMindmapPage());
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
      setMindmapsError('');
      const response = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(response.result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách môn học';
      setMindmapsError(message);
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
      setMindmapsError('');
      const response = await LessonSlideService.getChaptersBySubject(value);
      setChapters(response.result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách chương';
      setMindmapsError(message);
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
      setMindmapsError('');
      const response = await LessonSlideService.getLessonsByChapter(value);
      setLessons(response.result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách bài học';
      setMindmapsError(message);
    } finally {
      setLoadingCatalog(false);
    }
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

  const handleDownloadPreviewMindmap = async () => {
    if (!selectedPreviewMindmap) return;

    setDownloadingPreviewMindmapId(selectedPreviewMindmap.id);
    setMindmapsError('');

    try {
      const response = await MindmapService.exportPublicMindmap(selectedPreviewMindmap.id, 'png');
      triggerBlobDownload(
        response.blob,
        response.filename || `${selectedPreviewMindmap.title}.png`
      );
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
    let cancelled = false;
    const loadMindmaps = async () => {
      setLoadingMindmaps(true);
      setMindmapsError('');

      try {
        const response = await MindmapService.getPublicMindmaps({
          lessonId: lessonId || undefined,
          name: mindmapKeywordDebounced || undefined,
          page: mindmapPage,
          size: mindmapSize,
          sortBy: mindmapSortBy,
          direction: mindmapDirection,
        });

        if (!cancelled) {
          setMindmapsResult(response.result);
        }
      } catch (err) {
        if (!cancelled) {
          setMindmapsError(
            err instanceof Error ? err.message : 'Không thể tải danh sách mindmap công khai'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMindmaps(false);
        }
      }
    };

    void loadMindmaps();
    return () => {
      cancelled = true;
    };
  }, [
    lessonId,
    mindmapKeywordDebounced,
    mindmapPage,
    mindmapSize,
    mindmapSortBy,
    mindmapDirection,
  ]);

  return (
    <DashboardLayout user={mockStudent} role="student">
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header">
            <div className="header-stack">
              <div className="header-kicker">Student Public Mindmaps</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Thư viện mindmap công khai</h2>
                {!loadingMindmaps && (
                  <span className="count-chip">{mindmapsResult.totalElements}</span>
                )}
              </div>
              <p className="spm-header-sub">
                Khám phá sơ đồ tư duy từ giáo viên trên toàn hệ thống
              </p>
            </div>
          </header>

          {/* ── Filter panel ── */}
          <div className="spm-filter-panel">
            <div className="spm-filter-panel__head">
              <Filter size={13} />
              <span>Bộ lọc tìm kiếm</span>
            </div>
            <div className="spm-filter-bar">
              <div className="spm-filter-field">
                <span className="spm-filter-label">
                  <GraduationCap size={12} />
                  Khối lớp
                </span>
                <select
                  className="spm-select"
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

              <div className="spm-filter-field">
                <span className="spm-filter-label">
                  <BookOpen size={12} />
                  Môn học
                </span>
                <select
                  className="spm-select"
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

              <div className="spm-filter-field">
                <span className="spm-filter-label">
                  <BookMarked size={12} />
                  Chương
                </span>
                <select
                  className="spm-select"
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

              <div className="spm-filter-field">
                <span className="spm-filter-label">
                  <Network size={12} />
                  Bài học
                </span>
                <select
                  className="spm-select"
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
                  className="search-box__clear"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setMindmapKeyword('');
                    setMindmapPage(0);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              <select
                className="spm-select spm-select--sm"
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
                className="spm-select spm-select--sm"
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
                className="spm-select spm-select--sm"
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
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Bài học</span>
                <strong className="summary-value">{selectedLesson.title}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Kết quả</span>
                <strong className="summary-value">{mindmapsResult.totalElements} mindmap</strong>
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loadingMindmaps && (
            <div className="skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {mindmapsError && !loadingMindmaps && (
            <div className="empty">
              <p style={{ color: 'var(--mod-danger)' }}>{mindmapsError}</p>
            </div>
          )}

          {/* ── Empty ── */}
          {!loadingMindmaps && !mindmapsError && mindmapsResult.content.length === 0 && (
            <div className="empty">
              <Workflow size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Không có mindmap công khai phù hợp bộ lọc hiện tại.</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loadingMindmaps && mindmapsResult.content.length > 0 && (
            <>
              <div className="grid-cards">
                {mindmapsResult.content.map((mindmap) => (
                  <article key={mindmap.id} className="data-card spm-card">
                    <div className="spm-cover">
                      <div className="spm-cover__overlay" />
                      <span className="spm-cover__badge">Mindmap</span>
                      <div className="spm-cover__icon">
                        <Workflow size={42} strokeWidth={1.3} />
                      </div>
                    </div>
                    <div className="spm-card-body">
                      <h3 className="spm-card__title">{mindmap.title}</h3>
                      <p className="spm-card__desc">{mindmap.description || 'Không có mô tả.'}</p>
                      <div className="spm-card-metrics">
                        <span className="metric">
                          <Network size={11} />
                          {mindmap.nodeCount} nút
                        </span>
                        <span className="metric">
                          <User size={11} />
                          {mindmap.teacherName || 'Giáo viên'}
                        </span>
                      </div>
                      <div className="spm-card-actions">
                        <button
                          type="button"
                          className="spm-btn-view"
                          onClick={() => void handleOpenMindmapPreview(mindmap)}
                          disabled={previewingMindmapId === mindmap.id}
                        >
                          <Workflow size={14} />
                          {previewingMindmapId === mindmap.id ? 'Đang tải...' : 'Xem mindmap'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Pagination ── */}
              <div className="spm-pagination">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setMindmapPage((prev) => Math.max(prev - 1, 0))}
                  disabled={mindmapsResult.number <= 0}
                >
                  <ChevronLeft size={15} /> Trước
                </button>
                <span className="spm-page-info">
                  Trang <strong>{mindmapsResult.number + 1}</strong> /{' '}
                  {Math.max(mindmapsResult.totalPages, 1)} ·{' '}
                  <span style={{ color: '#60748f' }}>{mindmapsResult.totalElements} mindmap</span>
                </span>
                <button
                  type="button"
                  className="btn secondary"
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
                  Sau <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {isPreviewOpen && (
            <div className="spm-modal-overlay" onClick={handleCloseMindmapPreview}>
              <div
                className="spm-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Xem trước mindmap PNG"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="spm-modal-header">
                  <h3>{selectedPreviewMindmap?.title || 'Xem trước mindmap'}</h3>
                  <button
                    type="button"
                    className="spm-modal-close"
                    onClick={handleCloseMindmapPreview}
                  >
                    ×
                  </button>
                </div>

                <div className="spm-modal-body">
                  {previewFrameLoading && (
                    <div className="spm-math-loader" role="status" aria-live="polite">
                      <div className="spm-math-loader-ring" aria-hidden="true" />
                      <div className="spm-math-loader-symbols" aria-hidden="true">
                        <span>∑</span>
                        <span>π</span>
                        <span>√</span>
                        <span>∞</span>
                        <span>Δ</span>
                      </div>
                      <p>Đang dựng mindmap...</p>
                    </div>
                  )}

                  {selectedPreviewMindmap && (
                    <iframe
                      className="spm-modal-iframe"
                      src={`/mindmaps/public/${selectedPreviewMindmap.id}?embedPreview=1`}
                      title={selectedPreviewMindmap.title || 'Mindmap preview'}
                      onLoad={() => setPreviewFrameLoading(false)}
                    />
                  )}
                </div>

                <div className="spm-modal-footer">
                  <button
                    type="button"
                    className="btn"
                    disabled={
                      !selectedPreviewMindmap ||
                      downloadingPreviewMindmapId === selectedPreviewMindmap.id
                    }
                    onClick={() => void handleDownloadPreviewMindmap()}
                  >
                    {selectedPreviewMindmap &&
                    downloadingPreviewMindmapId === selectedPreviewMindmap.id
                      ? 'Đang tải...'
                      : 'Tải ảnh PNG'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleCloseMindmapPreview}
                  >
                    Đóng
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
