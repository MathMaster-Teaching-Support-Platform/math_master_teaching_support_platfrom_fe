import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Network, Sparkles, WandSparkles } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { MindmapService } from '../../services/api/mindmap.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type { Mindmap } from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './TeacherMindmaps.css';

const LoadingSpinner = ({ label }: { label: string }) => (
  <span className="mindmaps-inline-loading" role="status" aria-live="polite">
    <span className="mindmaps-spinner" aria-hidden="true" />
    {label}
  </span>
);

export default function TeacherMindmaps() {
  const navigate = useNavigate();
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ALL'>(
    'ALL'
  );

  // Generator form state
  const [generatorForm, setGeneratorForm] = useState({
    title: '',
    prompt: '',
    levels: 3,
  });
  const [activeGeneratorStep, setActiveGeneratorStep] = useState(1);
  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);
  const [schoolGradeId, setSchoolGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const canProceedStep2 = Boolean(lessonId);
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId) || null;

  useEffect(() => {
    loadMindmaps();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: {
        page?: number;
        size?: number;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        sortBy?: string;
        direction?: 'ASC' | 'DESC';
      } = {
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        direction: 'DESC',
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const response = await MindmapService.getMyMindmaps(params);
      setMindmaps(response.result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mindmaps');
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolGrades = async () => {
    try {
      setLoadingGrades(true);
      const response = await LessonSlideService.getSchoolGrades(true);
      setSchoolGrades(response.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách khối lớp');
    } finally {
      setLoadingGrades(false);
    }
  };

  const resetGeneratorSelection = () => {
    setActiveGeneratorStep(1);
    setSchoolGradeId('');
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);
    setGeneratorForm({
      title: '',
      prompt: '',
      levels: 3,
    });
  };

  const toggleGenerator = () => {
    const nextShow = !showGenerator;
    setShowGenerator(nextShow);
    if (nextShow) {
      resetGeneratorSelection();
      if (!schoolGrades.length) {
        void loadSchoolGrades();
      }
    }
  };

  const handleSchoolGradeChange = async (value: string) => {
    setSchoolGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);

    if (!value) return;

    try {
      setLoadingSubjects(true);
      const response = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(response.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (value: string) => {
    setSubjectId(value);
    setChapterId('');
    setLessonId('');
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);

    if (!value) return;

    try {
      setLoadingChapters(true);
      const response = await LessonSlideService.getChaptersBySubject(value);
      setChapters(response.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách chương');
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterChange = async (value: string) => {
    setChapterId(value);
    setLessonId('');
    setLessons([]);
    setGeneratorError(null);

    if (!value) return;

    try {
      setLoadingLessons(true);
      const response = await LessonSlideService.getLessonsByChapter(value);
      setLessons(response.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách bài học');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleGenerateMindmap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonId) {
      setGeneratorError('Vui lòng chọn đầy đủ Khối, Môn, Chương và Bài học trước khi tạo mindmap.');
      setActiveGeneratorStep(1);
      return;
    }

    if (!generatorForm.title.trim() || !generatorForm.prompt.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setGenerating(true);
      setGeneratorError(null);
      const response = await MindmapService.generateMindmap({
        title: generatorForm.title,
        prompt: generatorForm.prompt,
        lessonId,
        levels: generatorForm.levels,
      });

      // Navigate to editor
      navigate(`/teacher/mindmaps/${response.result.mindmap.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate mindmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mindmap này?')) return;

    try {
      await MindmapService.deleteMindmap(id);
      loadMindmaps();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete mindmap');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'Nháp', className: 'status-draft' },
      PUBLISHED: { label: 'Đã xuất bản', className: 'status-published' },
      ARCHIVED: { label: 'Đã lưu trữ', className: 'status-archived' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-mindmaps-page">
        <div className="mindmaps-header">
          <div className="header-copy">
            <h1>Mindmap của tôi</h1>
            <p>Tạo và quản lý mindmap trực quan cho các bài giảng toán học sinh động hơn.</p>
          </div>
          <button className="btn-generate" onClick={toggleGenerator}>
            <Sparkles size={18} />
            <span>Tạo Mindmap AI</span>
          </button>
        </div>

        {showGenerator && (
          <div className="generator-panel">
            <form onSubmit={handleGenerateMindmap}>
              <div className="generator-heading">
                <div className="generator-icon">
                  <WandSparkles size={18} />
                </div>
                <div>
                  <h3>Tạo Mindmap với AI</h3>
                  <p>Hoàn thành Bước 1 để chọn đúng bài dạy, sau đó cấu hình AI ở Bước 2.</p>
                </div>
              </div>

              {activeGeneratorStep === 1 && (
                <div className="generator-step-block">
                  <h4 className="generator-step-title">Bước 1: Chọn dữ liệu bài dạy</h4>
                  <div className="form-group">
                    <label>Khối (School Grade)</label>
                    <select
                      value={schoolGradeId}
                      onChange={(e) => void handleSchoolGradeChange(e.target.value)}
                      disabled={loadingGrades}
                    >
                      <option value="">-- Chọn khối --</option>
                      {schoolGrades.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          Khối {grade.gradeLevel} - {grade.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {schoolGradeId && (
                    <div className="form-group">
                      <label>Môn học (Subject)</label>
                      <select
                        value={subjectId}
                        onChange={(e) => void handleSubjectChange(e.target.value)}
                        disabled={loadingSubjects}
                      >
                        <option value="">-- Chọn môn học --</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {subjectId && (
                    <div className="form-group">
                      <label>Chương (Chapter)</label>
                      <select
                        value={chapterId}
                        onChange={(e) => void handleChapterChange(e.target.value)}
                        disabled={loadingChapters}
                      >
                        <option value="">-- Chọn chương --</option>
                        {chapters.map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.orderIndex}. {chapter.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {chapterId && (
                    <div className="form-group">
                      <label>Bài học (Lesson)</label>
                      <select
                        value={lessonId}
                        onChange={(e) => setLessonId(e.target.value)}
                        disabled={loadingLessons}
                      >
                        <option value="">-- Chọn bài học --</option>
                        {lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.orderIndex}. {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(loadingGrades || loadingSubjects || loadingChapters || loadingLessons) && (
                    <LoadingSpinner label="Đang tải dữ liệu bài dạy..." />
                  )}

                  {selectedLesson && (
                    <p className="generator-selected-lesson">
                      Bài học đã chọn: {selectedLesson.title}
                    </p>
                  )}

                  {generatorError && <p className="generator-error">{generatorError}</p>}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowGenerator(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => setActiveGeneratorStep(2)}
                      disabled={!canProceedStep2}
                    >
                      Tiếp tục: Bước 2
                    </button>
                  </div>
                </div>
              )}

              {activeGeneratorStep === 2 && (
                <div className="generator-step-block">
                  <h4 className="generator-step-title">Bước 2: Cấu hình AI tạo mindmap</h4>

                  {selectedLesson && (
                    <p className="generator-selected-lesson">Bài học: {selectedLesson.title}</p>
                  )}

                  <div className="form-group">
                    <label>Tiêu đề</label>
                    <input
                      type="text"
                      value={generatorForm.title}
                      onChange={(e) =>
                        setGeneratorForm({ ...generatorForm, title: e.target.value })
                      }
                      placeholder="VD: Hình học lớp 9"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả nội dung</label>
                    <textarea
                      value={generatorForm.prompt}
                      onChange={(e) =>
                        setGeneratorForm({ ...generatorForm, prompt: e.target.value })
                      }
                      placeholder="VD: Tạo mindmap về Hình học lớp 9, bao gồm các chủ đề: tam giác, tứ giác, đường tròn..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số cấp độ</label>
                    <input
                      type="number"
                      min="2"
                      max="5"
                      value={generatorForm.levels}
                      onChange={(e) =>
                        setGeneratorForm({ ...generatorForm, levels: Number(e.target.value) })
                      }
                    />
                  </div>

                  {generatorError && <p className="generator-error">{generatorError}</p>}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setActiveGeneratorStep(1)}
                    >
                      ← Quay lại Bước 1
                    </button>
                    <button type="submit" className="btn-submit" disabled={generating}>
                      {generating ? <LoadingSpinner label="Đang tạo mindmap..." /> : 'Tạo Mindmap'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        <div className="mindmaps-filter">
          <button
            className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`filter-tab ${statusFilter === 'DRAFT' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DRAFT')}
          >
            Nháp
          </button>
          <button
            className={`filter-tab ${statusFilter === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            Đã xuất bản
          </button>
          <button
            className={`filter-tab ${statusFilter === 'ARCHIVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ARCHIVED')}
          >
            Lưu trữ
          </button>
        </div>

        {loading ? (
          <div className="page-state loading">Đang tải danh sách mindmap...</div>
        ) : error ? (
          <div className="page-state error-message">{error}</div>
        ) : mindmaps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-visual">
              <div className="empty-visual-ring">
                <Network size={54} strokeWidth={1.7} />
              </div>
            </div>
            <h3>Chưa có mindmap nào</h3>
            <p>
              Bắt đầu hành trình sáng tạo của bạn. Tạo mindmap đầu tiên bằng AI ngay hôm nay để hệ
              thống hóa kiến thức dễ dàng hơn.
            </p>
            <button className="empty-cta" onClick={toggleGenerator}>
              Bắt đầu ngay
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="mindmaps-grid">
            {mindmaps.map((mindmap) => (
              <div key={mindmap.id} className="mindmap-card">
                <div className="card-header">
                  <h3>{mindmap.title}</h3>
                  {getStatusBadge(mindmap.status)}
                </div>
                <p className="card-description">{mindmap.description}</p>
                <div className="card-meta">
                  <span className="meta-item">
                    <span className="icon">●</span>
                    {mindmap.nodeCount} nodes
                  </span>
                  {mindmap.aiGenerated && (
                    <span className="meta-item ai-badge">
                      <Sparkles size={14} />
                      AI Generated
                    </span>
                  )}
                </div>
                <div className="card-footer">
                  <span className="card-date">{formatDate(mindmap.createdAt)}</span>
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/teacher/mindmaps/${mindmap.id}`)}
                    >
                      Chỉnh sửa
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(mindmap.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
