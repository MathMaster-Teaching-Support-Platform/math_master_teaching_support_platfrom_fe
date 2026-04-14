import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Grid2x2,
  List,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCreateCourse,
  useDeleteCourse,
  usePublishCourse,
  useTeacherCourses,
} from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type { CourseResponse, CreateCourseRequest } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './TeacherCourses.css';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;

// ─── Create Course Modal ───────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCourseRequest) => void;
  isLoading: boolean;
}

const CreateCourseModal: React.FC<CreateModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState<CreateCourseRequest>({
    subjectId: '',
    schoolGradeId: '',
    title: '',
    description: '',
    thumbnailUrl: '',
  });

  const [grades, setGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  React.useEffect(() => {
    setLoadingGrades(true);
    LessonSlideService.getSchoolGrades(true)
      .then((r) => setGrades(r.result || []))
      .catch(() => {})
      .finally(() => setLoadingGrades(false));
  }, []);

  const handleGradeChange = async (schoolGradeId: string) => {
    setForm({ ...form, schoolGradeId, subjectId: '' });
    setSubjects([]);
    if (!schoolGradeId) return;
    setLoadingSubjects(true);
    try {
      const r = await LessonSlideService.getSubjectsBySchoolGrade(schoolGradeId);
      setSubjects(r.result || []);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.subjectId || !form.schoolGradeId || !form.title) return;
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2>Tạo giáo trình mới</h2>
              <p>Điền thông tin để bắt đầu soạn thảo</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grade-select" className="form-label">
                Khối lớp <span className="required">*</span>
              </label>
              <select
                id="grade-select"
                className="form-select"
                value={form.schoolGradeId}
                onChange={(e) => void handleGradeChange(e.target.value)}
                required
                disabled={loadingGrades}
              >
                <option value="">{loadingGrades ? 'Đang tải...' : '-- Chọn khối lớp --'}</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    Khối {g.gradeLevel} – {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="subject-select" className="form-label">
                Môn học <span className="required">*</span>
              </label>
              <select
                id="subject-select"
                className="form-select"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
                disabled={!form.schoolGradeId || loadingSubjects}
              >
                <option value="">
                  {(() => {
                    if (!form.schoolGradeId) return 'Chọn khối lớp trước';
                    if (loadingSubjects) return 'Đang tải...';
                    return '-- Chọn môn học --';
                  })()}
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="course-title" className="form-label">
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              id="course-title"
              className="form-input"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tên giáo trình..."
              required
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="course-desc" className="form-label">
              Mô tả
            </label>
            <textarea
              id="course-desc"
              className="form-input form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về nội dung giáo trình..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="course-thumb" className="form-label">
              Thumbnail URL
            </label>
            <input
              id="course-thumb"
              className="form-input"
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn secondary">
              Hủy bỏ
            </button>
            <button type="submit" className="btn" disabled={isLoading || !form.subjectId}>
              {isLoading ? (
                <>
                  <span className="btn-spinner" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Tạo giáo trình
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Page
const TeacherCourses: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: coursesData, isLoading, error } = useTeacherCourses();
  const createMutation = useCreateCourse();
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();

  const courses: CourseResponse[] = useMemo(() => coursesData?.result ?? [], [coursesData]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      let statusMatch = true;
      if (filterStatus === 'active') statusMatch = course.published;
      else if (filterStatus === 'draft') statusMatch = !course.published;
      const searchMatch = course.title.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [courses, filterStatus, search]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      active: courses.filter((c) => c.published).length,
      draft: courses.filter((c) => !c.published).length,
      students: courses.reduce((sum, c) => sum + c.studentsCount, 0),
    }),
    [courses]
  );

  const handleCreate = (data: CreateCourseRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleTogglePublish = (course: CourseResponse) => {
    publishMutation.mutate({ courseId: course.id, data: { published: !course.published } });
  };

  const handleDelete = (courseId: string) => {
    if (globalThis.confirm('Bạn có chắc muốn xóa giáo trình này?')) {
      deleteMutation.mutate(courseId);
    }
  };

  const filterTabs = [
    { id: 'all' as const, label: `Tất cả (${stats.total})` },
    { id: 'active' as const, label: `Công khai (${stats.active})` },
    { id: 'draft' as const, label: `Nháp (${stats.draft})` },
  ];

  return (
    <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="header-kicker">Course management</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Giáo trình</h2>
                {!isLoading && <span className="count-chip">{courses.length}</span>}
              </div>
              <p className="header-sub">
                {stats.active} đang hoạt động • {stats.students} học viên
              </p>
            </div>
            <button className="btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Tạo giáo trình
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng giáo trình</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.active}</h3>
                <p>Đang hoạt động</p>
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
                <GraduationCap size={20} />
              </div>
              <div>
                <h3>{stats.students}</h3>
                <p>Học viên</p>
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
                placeholder="Tìm kiếm giáo trình..."
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
                  className={`pill-btn${filterStatus === tab.id ? ' active' : ''}`}
                  onClick={() => setFilterStatus(tab.id)}
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
          {!isLoading && !error && courses.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {filteredCourses.length} / {courses.length}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Công khai</span>
                <strong className="summary-value">{stats.active}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Nháp</span>
                <strong className="summary-value">{stats.draft}</strong>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
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
              <p>Không thể tải giáo trình. Vui lòng thử lại.</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!isLoading && !error && filteredCourses.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {filteredCourses.map((course, idx) => (
                <article key={course.id} className="data-card course-card">
                  <div
                    className="course-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title} className="cover-thumb" />
                    )}
                    <div className="cover-overlay" />
                    <div className="cover-index">#{String(idx + 1).padStart(2, '0')}</div>
                    <span
                      className={`course-badge ${course.published ? 'badge-live' : 'badge-draft'}`}
                    >
                      {course.published ? (
                        <>
                          <Eye size={11} /> Công khai
                        </>
                      ) : (
                        <>
                          <EyeOff size={11} /> Nháp
                        </>
                      )}
                    </span>
                    <h3 className="cover-title">{course.title}</h3>
                  </div>

                  <div className="course-body">
                    <p className="course-desc">
                      {course.description || 'Chưa có mô tả cho giáo trình này.'}
                    </p>

                    <div className="course-metrics">
                      <div className="metric">
                        <Users size={13} />
                        <span>{course.studentsCount} học viên</span>
                      </div>
                      <div className="metric">
                        <Star size={13} />
                        <span>{Number(course.rating).toFixed(1)}</span>
                      </div>
                      <div className="metric">
                        <BookOpen size={13} />
                        <span>{course.lessonsCount} bài</span>
                      </div>
                    </div>

                    <div className="course-actions">
                      <button
                        className="action-primary"
                        onClick={() => navigate(`/teacher/courses/${course.id}/lessons`)}
                      >
                        <Settings2 size={14} /> Quản lý
                      </button>
                      <button
                        className={`action-toggle${course.published ? ' is-live' : ''}`}
                        onClick={() => handleTogglePublish(course)}
                        disabled={publishMutation.isPending}
                      >
                        {course.published ? (
                          <>
                            <EyeOff size={14} /> Ẩn
                          </>
                        ) : (
                          <>
                            <Eye size={14} /> Công khai
                          </>
                        )}
                      </button>
                      <button
                        className="action-danger"
                        onClick={() => handleDelete(course.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Xóa giáo trình"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!isLoading && !error && filteredCourses.length === 0 && courses.length > 0 && (
            <div className="empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>
                Không tìm thấy giáo trình{search ? ` khớp với "${search}"` : ' với bộ lọc này'}.
              </p>
            </div>
          )}

          {/* ── Empty: no courses ── */}
          {!isLoading && !error && courses.length === 0 && (
            <div className="empty">
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có giáo trình nào. Hãy tạo giáo trình để bắt đầu giảng dạy.</p>
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Tạo giáo trình đầu tiên
              </button>
            </div>
          )}
        </section>

        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
