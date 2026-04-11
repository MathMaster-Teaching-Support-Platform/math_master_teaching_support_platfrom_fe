import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingMindmaps, setLoadingMindmaps] = useState(false);
  const [error, setError] = useState('');

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

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
    if (!value) return;

    try {
      setLoadingMindmaps(true);
      setError('');
      const response = await MindmapService.getPublicMindmapsByLesson(value, {
        page: 0,
        size: PAGE_SIZE,
      });
      setMindmaps(response.result.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách mindmap public');
    } finally {
      setLoadingMindmaps(false);
    }
  };

  return (
    <DashboardLayout user={mockStudent} role="student">
      <div className="student-public-mindmaps-page">
        <header className="student-public-mindmaps-header">
          <h1>Mindmap Public</h1>
          <p>Chọn bài học để xem các mindmap đã được publish.</p>
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
        </section>

        {loadingCatalog && <p className="state-text">Đang tải danh mục...</p>}
        {loadingMindmaps && <p className="state-text">Đang tải mindmap public...</p>}
        {error && <p className="state-text state-text--error">{error}</p>}

        {selectedLesson && !loadingMindmaps && (
          <p className="state-text">Bài học: {selectedLesson.title}</p>
        )}

        {!loadingMindmaps && lessonId && mindmaps.length === 0 && !error && (
          <p className="state-text">Bài học này chưa có mindmap ở trạng thái PUBLISHED.</p>
        )}

        <section className="student-public-mindmaps-grid">
          {mindmaps.map((mindmap) => (
            <article key={mindmap.id} className="mindmap-card-public">
              <h3>{mindmap.title}</h3>
              <p>{mindmap.description || 'Không có mô tả.'}</p>
              <div className="mindmap-card-public-meta">
                <span>{mindmap.nodeCount} nodes</span>
                <span>{new Date(mindmap.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/mindmaps/public/${mindmap.id}`)}
                className="mindmap-card-public-btn"
              >
                Xem mindmap
              </button>
            </article>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
