import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type {
  ChapterBySubject,
  LessonByChapter,
  LessonSlideGeneratedFile,
  PageResult,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './StudentPublicMindmaps.css';

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
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'generated-slide.pptx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setSlideKeywordDebounced(slideKeyword.trim()), 400);
    return () => window.clearTimeout(timer);
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
          setSlidesResult(response.result);
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

  return (
    <DashboardLayout user={mockStudent} role="student">
      <div className="student-public-mindmaps-page">
        <header className="student-public-mindmaps-header">
          <p className="header-kicker">Kho học liệu học sinh</p>
          <h1>Thư viện slide công khai</h1>
        </header>

        <section className="student-public-mindmaps-filters">
          <select value={gradeId} onChange={(e) => void handleGradeChange(e.target.value)}>
            <option value="">Chọn khối lớp</option>
            {schoolGrades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>

          <select
            value={subjectId}
            onChange={(e) => void handleSubjectChange(e.target.value)}
            disabled={!gradeId}
          >
            <option value="">Chọn môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={chapterId}
            onChange={(e) => void handleChapterChange(e.target.value)}
            disabled={!subjectId}
          >
            <option value="">Chọn chương</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.title}
              </option>
            ))}
          </select>

          <select
            value={lessonId}
            onChange={(e) => handleLessonChange(e.target.value)}
            disabled={!chapterId}
          >
            <option value="">Tất cả bài học</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </section>

        {loadingCatalog && <p className="state-text">Đang tải danh mục...</p>}
        {selectedLesson && (
          <p className="state-text">Đang lọc theo bài học: {selectedLesson.title}</p>
        )}

        <section className="student-public-slides-section">
          <div className="student-public-section-header">
            <h2>Slide công khai</h2>
          </div>

          <div className="resource-toolbar">
            <label className="resource-search-box">
              <Search size={16} />
              <input
                type="text"
                value={slideKeyword}
                onChange={(e) => {
                  setSlideKeyword(e.target.value);
                  setSlidePage(0);
                }}
                placeholder="Tìm theo tên file slide..."
              />
            </label>

            <div className="resource-toolbar-right">
              <select
                value={slideSortBy}
                onChange={(e) => {
                  setSlideSortBy(e.target.value);
                  setSlidePage(0);
                }}
              >
                <option value="createdAt">Sắp xếp: Ngày tạo</option>
                <option value="updatedAt">Sắp xếp: Cập nhật</option>
              </select>

              <select
                value={slideDirection}
                onChange={(e) => {
                  setSlideDirection(e.target.value as SortDirection);
                  setSlidePage(0);
                }}
              >
                <option value="DESC">Mới nhất trước</option>
                <option value="ASC">Cũ nhất trước</option>
              </select>

              <select
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

          {loadingSlides && <p className="state-text">Đang tải slide công khai...</p>}
          {slidesError && <p className="state-text state-text--error">{slidesError}</p>}

          {!loadingSlides && !slidesError && slidesResult.content.length === 0 && (
            <p className="state-text">Không có slide công khai phù hợp bộ lọc hiện tại.</p>
          )}

          {!loadingSlides && slidesResult.content.length > 0 && (
            <>
              <p className="resource-summary">
                Hiển thị {slidesResult.content.length}/{slidesResult.totalElements} slide công khai.
              </p>

              <div className="student-public-slides-grid">
                {slidesResult.content.map((slide) => (
                  <article key={slide.id} className="slide-card-public">
                    <h3>{slide.fileName || 'generated-slide.pptx'}</h3>
                    <div className="slide-card-public-meta">
                      <span>Dung lượng: {formatFileSize(slide.fileSizeBytes)}</span>
                      <span>Ngày tạo: {new Date(slide.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <button
                      type="button"
                      className="mindmap-card-public-btn"
                      onClick={() => void handleDownloadSlide(slide.id)}
                      disabled={downloadingSlideId === slide.id}
                    >
                      <Download size={16} />
                      {downloadingSlideId === slide.id ? 'Đang tải...' : 'Tải slide'}
                    </button>
                  </article>
                ))}
              </div>

              <div className="resource-pagination">
                <button
                  type="button"
                  onClick={() => setSlidePage((prev) => Math.max(prev - 1, 0))}
                  disabled={slidesResult.first}
                >
                  Trang trước
                </button>
                <span>
                  Trang {slidesResult.number + 1}/{Math.max(slidesResult.totalPages, 1)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSlidePage((prev) =>
                      slidesResult.totalPages > 0
                        ? Math.min(prev + 1, slidesResult.totalPages - 1)
                        : prev
                    )
                  }
                  disabled={slidesResult.last || slidesResult.totalPages === 0}
                >
                  Trang sau
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
