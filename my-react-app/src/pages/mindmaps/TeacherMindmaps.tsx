import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Grid2x2,
  List,
  Network,
  Search,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import { notifySubscriptionUpdated } from '../../services/api/subscription-plan.service';
import '../../styles/module-refactor.css';
import type { Mindmap } from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './TeacherMindmaps.css';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

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
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  const generatorSteps = ['Chọn bài dạy', 'Cấu hình AI'];
  const visualGeneratorStep = Math.max(1, Math.min(activeGeneratorStep, generatorSteps.length));

  const stats = useMemo(
    () => ({
      total: mindmaps.length,
      published: mindmaps.filter((m) => m.status === 'PUBLISHED').length,
      draft: mindmaps.filter((m) => m.status === 'DRAFT').length,
      archived: mindmaps.filter((m) => m.status === 'ARCHIVED').length,
      aiGenerated: mindmaps.filter((m) => m.aiGenerated).length,
    }),
    [mindmaps]
  );

  const filteredMindmaps = useMemo(() => {
    return mindmaps.filter((m) => {
      const statusMatch = statusFilter === 'ALL' || m.status === statusFilter;
      const searchMatch = m.title.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [mindmaps, statusFilter, search]);

  const filterTabs = [
    { id: 'ALL' as const, label: `Tất cả (${stats.total})` },
    { id: 'PUBLISHED' as const, label: `Đã xuất bản (${stats.published})` },
    { id: 'DRAFT' as const, label: `Nháp (${stats.draft})` },
    { id: 'ARCHIVED' as const, label: `Lưu trữ (${stats.archived})` },
  ];

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

  const handleGenerateMindmap = async (e: React.FormEvent<HTMLFormElement>) => {
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
      notifySubscriptionUpdated();

      // Navigate to editor
      navigate(`/teacher/mindmaps/${response.result.mindmap.id}`);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1164) {
        setGeneratorError('Ban chua co goi active. Vui long mua goi truoc khi dung AI Mindmap.');
        if (globalThis.confirm('Ban chua co goi active. Mo trang mua goi ngay?')) {
          navigate('/pricing');
        }
      } else if (apiError.code === 1165) {
        setGeneratorError('Token khong du de tao mindmap. Vui long mua goi hoac nap them vi.');
        if (globalThis.confirm('Token khong du. Mo trang vi de nap tien?')) {
          navigate('/student/wallet');
        }
      } else {
        alert(err instanceof Error ? err.message : 'Failed to generate mindmap');
      }
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

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={5}
    >
      <div className="module-layout-container">
        <section className="module-page">

          {/* ── Header ── */}
          <header className="page-header mindmaps-header-row">
            <div className="header-stack">
              <div className="header-kicker">Mindmap management</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Mindmap của tôi</h2>
                {!loading && <span className="count-chip">{mindmaps.length}</span>}
              </div>
              <p className="header-sub">
                {stats.published} đã xuất bản • {stats.aiGenerated} được tạo bởi AI
              </p>
            </div>
            <button className="btn" onClick={toggleGenerator}>
              <Sparkles size={16} />
              Tạo Mindmap AI
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Network size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng mindmap</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.published}</h3>
                <p>Đã xuất bản</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.draft}</h3>
                <p>Bản nháp</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Archive size={20} />
              </div>
              <div>
                <h3>{stats.archived}</h3>
                <p>Đã lưu trữ</p>
              </div>
            </div>
          </div>

          {/* ── Generator Panel ── */}
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
                    <ol className="mindmap-stepper" aria-label="Tiến trình tạo mindmap">
                      {generatorSteps.map((stepLabel, index) => {
                        const stepNumber = index + 1;
                        const isDone = visualGeneratorStep > stepNumber;
                        const isActive = visualGeneratorStep === stepNumber;
                        return (
                          <li
                            key={stepLabel}
                            className={`mindmap-step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                            aria-current={isActive ? 'step' : undefined}
                          >
                            <span className="mindmap-step-dot" aria-hidden="true">
                              {stepNumber}
                            </span>
                            <span className="mindmap-step-text">{stepLabel}</span>
                          </li>
                        );
                      })}
                    </ol>
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
                        {generating ? (
                          <LoadingSpinner label="Đang tạo mindmap..." />
                        ) : (
                          'Tạo Mindmap'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm kiếm mindmap..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`pill-btn${statusFilter === tab.id ? ' active' : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="view-toggle" style={{ marginLeft: 'auto' }}>
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Hiển thị lưới"
              >
                <Grid2x2 size={16} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                aria-label="Hiển thị danh sách"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* ── Summary bar ── */}
          {!loading && !error && mindmaps.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {filteredMindmaps.length} / {mindmaps.length}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Đã xuất bản</span>
                <strong className="summary-value">{stats.published}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Nháp</span>
                <strong className="summary-value">{stats.draft}</strong>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="empty">
              <AlertCircle
                size={28}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger)' }}
              />
              <p>Không thể tải mindmap. Vui lòng thử lại.</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loading && !error && filteredMindmaps.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {filteredMindmaps.map((mindmap, idx) => (
                <article key={mindmap.id} className="data-card mindmap-card">
                  <div
                    className="mindmap-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <div className="cover-overlay" />
                    <div className="cover-index">#{String(idx + 1).padStart(2, '0')}</div>
                    {mindmap.status === 'PUBLISHED' && (
                      <span className="course-badge badge-live">
                        <Eye size={11} /> Đã xuất bản
                      </span>
                    )}
                    {mindmap.status === 'ARCHIVED' && (
                      <span className="course-badge badge-archived">
                        <Archive size={11} /> Lưu trữ
                      </span>
                    )}
                    {mindmap.status === 'DRAFT' && (
                      <span className="course-badge badge-draft">
                        <EyeOff size={11} /> Nháp
                      </span>
                    )}
                    <h3 className="cover-title">{mindmap.title}</h3>
                  </div>

                  <div className="mindmap-body">
                    <p className="mindmap-desc">
                      {mindmap.description || 'Chưa có mô tả cho mindmap này.'}
                    </p>

                    <div className="mindmap-metrics">
                      <div className="metric">
                        <Network size={13} />
                        <span>{mindmap.nodeCount} nodes</span>
                      </div>
                      {mindmap.aiGenerated && (
                        <div className="metric metric--ai">
                          <Sparkles size={13} />
                          <span>AI Generated</span>
                        </div>
                      )}
                      {mindmap.lessonTitle && (
                        <div className="metric">
                          <FileText size={13} />
                          <span className="metric-lesson">{mindmap.lessonTitle}</span>
                        </div>
                      )}
                    </div>

                    <div className="mindmap-footer">
                      <span className="mindmap-date">{formatDate(mindmap.createdAt)}</span>
                      <div className="mindmap-actions">
                        <button
                          className="btn secondary"
                          onClick={() => navigate(`/teacher/mindmaps/${mindmap.id}`)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          className="btn danger-outline"
                          onClick={() => handleDelete(mindmap.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!loading && !error && filteredMindmaps.length === 0 && mindmaps.length > 0 && (
            <div className="empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Không tìm thấy mindmap nào phù hợp với bộ lọc.</p>
            </div>
          )}

          {/* ── Empty: no mindmaps ── */}
          {!loading && !error && mindmaps.length === 0 && (
            <div className="empty">
              <Network size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có mindmap nào. Hãy tạo mindmap đầu tiên bằng AI.</p>
              <button
                className="btn"
                style={{ marginTop: '1rem' }}
                onClick={toggleGenerator}
              >
                Bắt đầu ngay
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </section>
      </div>
    </DashboardLayout>
  );
}
