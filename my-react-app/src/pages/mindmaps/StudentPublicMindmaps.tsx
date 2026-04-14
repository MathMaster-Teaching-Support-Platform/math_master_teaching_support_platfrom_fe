import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import type {
  ChapterBySubject,
  LessonByChapter,
  LessonSlideGeneratedFile,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import type { Mindmap } from '../../types';
import './StudentPublicMindmaps.css';

const PAGE_SIZE = 12;

export default function StudentPublicMindmaps() {
  const navigate = useNavigate();

  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);

  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [slideTimeFilter, setSlideTimeFilter] = useState<'ALL' | '7D' | '30D'>('ALL');

  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [publicSlides, setPublicSlides] = useState<LessonSlideGeneratedFile[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingMindmaps, setLoadingMindmaps] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [downloadingSlideId, setDownloadingSlideId] = useState('');
  const [error, setError] = useState('');

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

  const filteredPublicSlides = useMemo(() => {
    const keyword = resourceSearch.trim().toLowerCase();
    const now = Date.now();

    return publicSlides.filter((slide) => {
      if (slideTimeFilter !== 'ALL') {
        const cutoffDays = slideTimeFilter === '7D' ? 7 : 30;
        const publishedAt = slide.publishedAt ? new Date(slide.publishedAt).getTime() : 0;
        if (!publishedAt || now - publishedAt > cutoffDays * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      if (!keyword) return true;
      return (slide.fileName || '').toLowerCase().includes(keyword);
    });
  }, [publicSlides, resourceSearch, slideTimeFilter]);

  const filteredMindmaps = useMemo(() => {
    const keyword = resourceSearch.trim().toLowerCase();
    if (!keyword) return mindmaps;

    return mindmaps.filter((mindmap) => {
      const title = (mindmap.title || '').toLowerCase();
      const description = (mindmap.description || '').toLowerCase();
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [mindmaps, resourceSearch]);

  const totalResources = filteredPublicSlides.length + filteredMindmaps.length;

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
    const loadGrades = async () => {
      try {
        setLoadingCatalog(true);
        const response = await LessonSlideService.getSchoolGrades(true);
        setSchoolGrades(response.result || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách khối lớp');
      } finally {
        setLoadingCatalog(false);
      }
    };

    void loadGrades();
  }, []);

  const handleGradeChange = async (value: string) => {
    setGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setMindmaps([]);
    if (!value) return;

    try {
      setLoadingCatalog(true);
      setError('');
      const response = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
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
    setMindmaps([]);
    if (!value) return;

    try {
      setLoadingCatalog(true);
      setError('');
      const response = await LessonSlideService.getChaptersBySubject(value);
      setChapters(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách chương');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleChapterChange = async (value: string) => {
    setChapterId(value);
    setLessonId('');
    setLessons([]);
    setMindmaps([]);
    if (!value) return;

    try {
      setLoadingCatalog(true);
      setError('');
      const response = await LessonSlideService.getLessonsByChapter(value);
      setLessons(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài học');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleLessonChange = async (value: string) => {
    setLessonId(value);
    setMindmaps([]);
    setPublicSlides([]);
    if (!value) return;

    try {
      setLoadingMindmaps(true);
      setLoadingSlides(true);
      setError('');
      const [mindmapsResult, slidesResult] = await Promise.allSettled([
        MindmapService.getPublicMindmapsByLesson(value, {
          page: 0,
          size: PAGE_SIZE,
        }),
        LessonSlideService.getPublicGeneratedFilesByLessonId(value),
      ]);

      if (mindmapsResult.status === 'fulfilled') {
        setMindmaps(mindmapsResult.value.result.content || []);
      }

      if (slidesResult.status === 'fulfilled') {
        setPublicSlides(slidesResult.value.result || []);
      }

      if (mindmapsResult.status === 'rejected' && slidesResult.status === 'rejected') {
        const message =
          mindmapsResult.reason instanceof Error
            ? mindmapsResult.reason.message
            : 'Không thể tải tài nguyên public của bài học';
        setError(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tài nguyên public');
    } finally {
      setLoadingMindmaps(false);
      setLoadingSlides(false);
    }
  };

  const handleDownloadSlide = async (generatedFileId: string) => {
    setDownloadingSlideId(generatedFileId);
    setError('');

    try {
      const response = await LessonSlideService.downloadPublicGeneratedFile(generatedFileId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải slide public');
    } finally {
      setDownloadingSlideId('');
    }
  };

  return (
    <DashboardLayout user={mockStudent} role="student">
      <div className="student-public-mindmaps-page">
        <header className="student-public-mindmaps-header">
          <p className="header-kicker">Kho học liệu học sinh</p>
          <h1>Tài nguyên công khai</h1>
          <p>Chọn bài học để xem slide và mindmap đã được giáo viên công khai cho lớp.</p>
        </header>

        <section className="student-public-metrics">
          <article className="metric-card">
            <p>Tổng đang hiển thị</p>
            <strong>{totalResources}</strong>
          </article>
          <article className="metric-card">
            <p>Slide công khai</p>
            <strong>{filteredPublicSlides.length}</strong>
          </article>
          <article className="metric-card">
            <p>Mindmap công khai</p>
            <strong>{filteredMindmaps.length}</strong>
          </article>
        </section>

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
            onChange={(e) => void handleLessonChange(e.target.value)}
            disabled={!chapterId}
          >
            <option value="">Chọn bài học</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            placeholder="Tìm theo tên slide hoặc mindmap..."
            disabled={!lessonId}
          />

          <select
            value={slideTimeFilter}
            onChange={(e) => setSlideTimeFilter(e.target.value as 'ALL' | '7D' | '30D')}
            disabled={!lessonId}
          >
            <option value="ALL">Slide: Tất cả thời gian</option>
            <option value="7D">Slide: 7 ngày gần đây</option>
            <option value="30D">Slide: 30 ngày gần đây</option>
          </select>
        </section>

        {loadingCatalog && <p className="state-text">Đang tải danh mục...</p>}
        {loadingMindmaps && <p className="state-text">Đang tải mindmap công khai...</p>}
        {loadingSlides && <p className="state-text">Đang tải slide công khai...</p>}
        {error && <p className="state-text state-text--error">{error}</p>}

        {selectedLesson && !loadingMindmaps && (
          <p className="state-text">Bài học: {selectedLesson.title}</p>
        )}

        <section className="student-public-slides-section">
          <div className="student-public-section-header">
            <h2>Slide công khai 📄</h2>
            <p>Danh sách file slide học sinh có thể tải.</p>
          </div>

          {!loadingSlides && lessonId && filteredPublicSlides.length === 0 && !error && (
            <p className="state-text">Bài học này chưa có slide public.</p>
          )}

          {!loadingSlides && filteredPublicSlides.length > 0 && (
            <div className="student-public-slides-grid">
              {filteredPublicSlides.map((slide) => (
                <article key={slide.id} className="slide-card-public">
                  <h3>{slide.fileName || 'generated-slide.pptx'}</h3>
                  <div className="slide-card-public-meta">
                    <span>Dung lượng: {formatFileSize(slide.fileSizeBytes)}</span>
                    <span>
                      Công khai lúc:{' '}
                      {slide.publishedAt
                        ? new Date(slide.publishedAt).toLocaleDateString('vi-VN')
                        : '--'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mindmap-card-public-btn"
                    onClick={() => void handleDownloadSlide(slide.id)}
                    disabled={downloadingSlideId === slide.id}
                  >
                    {downloadingSlideId === slide.id ? 'Đang tải...' : '📥 Tải slide'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="student-public-mindmaps-section">
          <div className="student-public-section-header">
            <h2>Mindmap công khai 🧠</h2>
            <p>Chọn để mở bản đồ tư duy công khai theo bài học.</p>
          </div>

          {!loadingMindmaps && lessonId && filteredMindmaps.length === 0 && !error && (
            <p className="state-text">Bài học này chưa có mindmap ở trạng thái công khai.</p>
          )}

          <section className="student-public-mindmaps-grid">
            {filteredMindmaps.map((mindmap) => (
              <article key={mindmap.id} className="mindmap-card-public">
                <h3>{mindmap.title}</h3>
                <p>{mindmap.description || 'Không có mô tả.'}</p>
                <div className="mindmap-card-public-meta">
                  <span>{mindmap.nodeCount} nút</span>
                  <span>{new Date(mindmap.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/mindmaps/public/${mindmap.id}`)}
                  className="mindmap-card-public-btn"
                >
                  🔎 Xem mindmap
                </button>
              </article>
            ))}
          </section>
        </section>
      </div>
    </DashboardLayout>
  );
}
