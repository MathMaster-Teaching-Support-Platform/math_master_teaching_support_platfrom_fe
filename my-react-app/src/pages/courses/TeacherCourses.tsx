import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2x2, List, Plus, Search, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useTeacherCourses, useCreateCourse, useDeleteCourse, usePublishCourse } from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type { CreateCourseRequest, CourseResponse } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './TeacherCourses.css';

const gradients = [
  'linear-gradient(135deg, #2d7be7 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
  'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
] as const;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId || !form.schoolGradeId || !form.title) return;
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tạo giáo trình mới</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Khối lớp <span className="required">*</span>
            <select
              value={form.schoolGradeId}
              onChange={(e) => void handleGradeChange(e.target.value)}
              required
              disabled={loadingGrades}
            >
              <option value="">{loadingGrades ? 'Đang tải...' : '-- Chọn khối lớp --'}</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>Khối {g.gradeLevel} – {g.name}</option>
              ))}
            </select>
          </label>
          <label>
            Môn học <span className="required">*</span>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              required
              disabled={!form.schoolGradeId || loadingSubjects}
            >
              <option value="">
                {!form.schoolGradeId ? 'Chọn khối lớp trước' : loadingSubjects ? 'Đang tải...' : '-- Chọn môn học --'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Tiêu đề <span className="required">*</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tên giáo trình"
              required
              maxLength={255}
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả giáo trình"
              rows={3}
            />
          </label>
          <label>
            Thumbnail URL
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" className="btn-primary" disabled={isLoading || !form.subjectId}>
              {isLoading ? 'Đang tạo...' : 'Tạo giáo trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
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

  const courses: CourseResponse[] = coursesData?.result ?? [];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const statusMatch =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
            ? course.isPublished
            : !course.isPublished;
      const searchMatch = course.title.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [courses, filterStatus, search]);

  const stats = {
    total: courses.length,
    active: courses.filter((c) => c.isPublished).length,
    draft: courses.filter((c) => !c.isPublished).length,
    students: courses.reduce((sum, c) => sum + c.studentsCount, 0),
  };

  const handleCreate = (data: CreateCourseRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleTogglePublish = (course: CourseResponse) => {
    publishMutation.mutate({ courseId: course.id, data: { published: !course.isPublished } });
  };

  const handleDelete = (courseId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa giáo trình này?')) {
      deleteMutation.mutate(courseId);
    }
  };

  return (
    <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
      <div className="teacher-courses-page">
        <header className="courses-header">
          <div className="head-left">
            <h1>📚 Giáo Trình của tôi</h1>
            <p>Quản lý và theo dõi tất cả Giáo Trình bạn đang giảng dạy</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Tạo giáo trình
          </button>
        </header>

        <section className="courses-stats">
          <article className="stat-box">
            <span className="stat-icon blue">📘</span>
            <div>
              <div className="stat-label">Tổng giáo trình</div>
              <strong>{stats.total}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon green">✅</span>
            <div>
              <div className="stat-label">Đang hoạt động</div>
              <strong>{stats.active}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon amber">📝</span>
            <div>
              <div className="stat-label">Bản nháp</div>
              <strong>{stats.draft}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon violet">👥</span>
            <div>
              <div className="stat-label">Học viên</div>
              <strong>{stats.students}</strong>
            </div>
          </article>
        </section>

        <section className="courses-toolbar">
          <div className="filter-tabs">
            <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>
              Tất cả ({stats.total})
            </button>
            <button className={filterStatus === 'active' ? 'active' : ''} onClick={() => setFilterStatus('active')}>
              Hoạt động ({stats.active})
            </button>
            <button className={filterStatus === 'draft' ? 'active' : ''} onClick={() => setFilterStatus('draft')}>
              Nháp ({stats.draft})
            </button>
          </div>

          <div className="toolbar-right">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm giáo trình..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="view-toggle" aria-label="Chế độ hiển thị">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                <Grid2x2 size={16} />
              </button>
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                <List size={16} />
              </button>
            </div>
          </div>
        </section>

        {isLoading && <div className="loading-state">Đang tải giáo trình...</div>}
        {error && <div className="error-state">Không thể tải giáo trình. Vui lòng thử lại.</div>}

        <section className={`courses-grid ${viewMode}`}>
          {filteredCourses.map((course, idx) => (
            <article key={course.id} className="course-card">
              <div
                className="course-cover"
                style={{ background: gradients[idx % gradients.length] }}
              >
                <span className="course-status">
                  {course.isPublished ? 'CÔNG KHAI' : 'BẢN NHÁP'}
                </span>
                <h3>{course.title}</h3>
              </div>

              <div className="course-body">
                <p className="course-desc">{course.description ?? 'Chưa có mô tả'}</p>
                <div className="course-metrics">
                  <div>
                    <strong>{course.studentsCount}</strong>
                    <span>Học viên</span>
                  </div>
                  <div>
                    <strong>{Number(course.rating).toFixed(1)} ★</strong>
                    <span>Đánh giá</span>
                  </div>
                  <div>
                    <strong>{course.lessonsCount}</strong>
                    <span>Bài học</span>
                  </div>
                </div>

                <div className="course-actions">
                  <button
                    onClick={() => navigate(`/teacher/courses/${course.id}/lessons`)}
                    className="primary"
                  >
                    Quản lý bài học
                  </button>
                  <button
                    onClick={() => handleTogglePublish(course)}
                    disabled={publishMutation.isPending}
                  >
                    {course.isPublished ? 'Ẩn' : 'Công khai'}
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={deleteMutation.isPending}
                    className="danger"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          ))}

          <article className="course-add-card" onClick={() => setShowCreateModal(true)}>
            <div className="add-circle">+</div>
            <h3>Thêm giáo trình</h3>
            <p>Bắt đầu soạn thảo chương mới</p>
          </article>
        </section>
      </div>

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
};

export default TeacherCourses;
