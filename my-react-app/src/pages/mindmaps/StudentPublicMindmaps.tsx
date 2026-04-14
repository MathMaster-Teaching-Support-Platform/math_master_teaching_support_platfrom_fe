import { Search, Workflow } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import type { Mindmap, PaginatedResponse } from '../../types';
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

const emptyMindmapPage = (): PaginatedResponse<Mindmap> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: DEFAULT_PAGE_SIZE,
});

export default function StudentPublicMindmaps() {
  const navigate = useNavigate();
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
  const [mindmapsError, setMindmapsError] = useState('');

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMindmapKeywordDebounced(mindmapKeyword.trim()), 400);
    return () => window.clearTimeout(timer);
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
      <div className="student-public-mindmaps-page">
        <header className="student-public-mindmaps-header">
          <p className="header-kicker">Kho học liệu học sinh</p>
          <h1>Thư viện mindmap công khai</h1>
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

        <section className="student-public-mindmaps-section">
          <div className="student-public-section-header">
            <h2>Mindmap công khai</h2>
          </div>

          <div className="resource-toolbar">
            <label className="resource-search-box">
              <Search size={16} />
              <input
                type="text"
                value={mindmapKeyword}
                onChange={(e) => {
                  setMindmapKeyword(e.target.value);
                  setMindmapPage(0);
                }}
                placeholder="Tìm theo tiêu đề hoặc mô tả mindmap..."
              />
            </label>

            <div className="resource-toolbar-right">
              <select
                value={mindmapSortBy}
                onChange={(e) => {
                  setMindmapSortBy(e.target.value);
                  setMindmapPage(0);
                }}
              >
                <option value="createdAt">Sắp xếp: Ngày tạo</option>
                <option value="updatedAt">Sắp xếp: Cập nhật</option>
              </select>

              <select
                value={mindmapDirection}
                onChange={(e) => {
                  setMindmapDirection(e.target.value as SortDirection);
                  setMindmapPage(0);
                }}
              >
                <option value="DESC">Mới nhất trước</option>
                <option value="ASC">Cũ nhất trước</option>
              </select>

              <select
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

          {loadingMindmaps && <p className="state-text">Đang tải mindmap công khai...</p>}
          {mindmapsError && <p className="state-text state-text--error">{mindmapsError}</p>}

          {!loadingMindmaps && !mindmapsError && mindmapsResult.content.length === 0 && (
            <p className="state-text">Không có mindmap công khai phù hợp bộ lọc hiện tại.</p>
          )}

          {!loadingMindmaps && mindmapsResult.content.length > 0 && (
            <>
              <p className="resource-summary">
                Hiển thị {mindmapsResult.content.length}/{mindmapsResult.totalElements} mindmap công
                khai.
              </p>

              <section className="student-public-mindmaps-grid">
                {mindmapsResult.content.map((mindmap) => (
                  <article key={mindmap.id} className="mindmap-card-public">
                    <h3>{mindmap.title}</h3>
                    <p>{mindmap.description || 'Không có mô tả.'}</p>
                    <div className="mindmap-card-public-meta">
                      <span>{mindmap.nodeCount} nút</span>
                      <span>{mindmap.teacherName || 'Giáo viên'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/mindmaps/public/${mindmap.id}`)}
                      className="mindmap-card-public-btn"
                    >
                      <Workflow size={16} /> Xem mindmap
                    </button>
                  </article>
                ))}
              </section>

              <div className="resource-pagination">
                <button
                  type="button"
                  onClick={() => setMindmapPage((prev) => Math.max(prev - 1, 0))}
                  disabled={mindmapsResult.number <= 0}
                >
                  Trang trước
                </button>
                <span>
                  Trang {mindmapsResult.number + 1}/{Math.max(mindmapsResult.totalPages, 1)}
                </span>
                <button
                  type="button"
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
