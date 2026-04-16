import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import {
  useCourseDetail,
  useDeleteCourse,
  usePublishCourse,
  useCourseStudents,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import './TeacherCourses.css';
import './TeacherCourseDetail.css';

// Import tab components
import CourseOverviewTab from './tabs/CourseOverviewTab.tsx';
import CourseLessonsTab from './tabs/CourseLessonsTab.tsx';
import CourseAssessmentsTab from './tabs/CourseAssessmentsTab.tsx';
import CourseStudentsTab from './tabs/CourseStudentsTab.tsx';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students';

const TeacherCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const { data: courseData, isLoading: loadingCourse } = useCourseDetail(courseId!);
  const { data: studentsData } = useCourseStudents(courseId!);
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();

  const [showEditModal, setShowEditModal] = useState(false);

  const course = courseData?.result;
  const students = studentsData?.result?.content ?? [];

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleTogglePublish = () => {
    if (!course) return;
    publishMutation.mutate({
      courseId: course.id,
      data: { published: !course.published },
    });
  };

  const handleDelete = () => {
    if (!course) return;
    if (
      window.confirm(
        `Bạn có chắc muốn xóa giáo trình "${course.title}"? Hành động này không thể hoàn tác.`
      )
    ) {
      deleteMutation.mutate(course.id, {
        onSuccess: () => navigate('/teacher/courses'),
      });
    }
  };

  if (loadingCourse) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">Đang tải thông tin giáo trình...</div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#ef4444' }} />
              <p>Không tìm thấy giáo trình</p>
              <button className="btn secondary" onClick={() => navigate('/teacher/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: BookOpen },
    { id: 'lessons' as const, label: 'Bài học', icon: FileText, count: course.lessonsCount },
    { id: 'assessments' as const, label: 'Bài đánh giá', icon: CheckCircle2 },
    { id: 'students' as const, label: 'Học viên', icon: Users, count: students.length },
  ];

  return (
    <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
      <div className="module-layout-container">
        <section className="module-page">
          {/* Breadcrumb */}
          <CourseBreadcrumb courseTitle={course.title} />

          {/* Course Header */}
          <div className="course-detail-header">
            <div className="course-header-main">
              <button
                className="btn secondary btn-sm"
                onClick={() => navigate('/teacher/courses')}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>

              <div className="course-header-info">
                <div className="course-header-title-row">
                  <h1 className="course-detail-title">{course.title}</h1>
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
                </div>

                <div className="course-header-meta">
                  <span className="meta-item">
                    <GraduationCap size={14} />
                    {course.subjectName} • Khối {course.gradeLevel}
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">
                    <BookOpen size={14} />
                    {course.lessonsCount} bài học
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">
                    <Users size={14} />
                    {course.studentsCount} học viên
                  </span>
                </div>

                {course.description && (
                  <p className="course-header-description">{course.description}</p>
                )}
              </div>
            </div>

            <div className="course-header-actions">
              <button
                className="btn secondary"
                onClick={() => setShowEditModal(true)}
                title="Chỉnh sửa thông tin giáo trình"
              >
                <Pencil size={14} />
                Chỉnh sửa
              </button>
              <button
                className={`btn ${course.published ? 'secondary' : ''}`}
                onClick={handleTogglePublish}
                disabled={publishMutation.isPending}
              >
                {course.published ? (
                  <>
                    <EyeOff size={14} />
                    Ẩn giáo trình
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    Công khai
                  </>
                )}
              </button>
              <button className="btn danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                <Trash2 size={14} />
                Xóa
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="course-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`course-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="course-tab-content">
            {activeTab === 'overview' && <CourseOverviewTab course={course} />}
            {activeTab === 'lessons' && <CourseLessonsTab courseId={course.id} course={course} />}
            {activeTab === 'assessments' && <CourseAssessmentsTab courseId={course.id} />}
            {activeTab === 'students' && <CourseStudentsTab courseId={course.id} />}
          </div>
        </section>
      </div>

      {/* Edit Modal - TODO: Implement */}
      {showEditModal && (
        <div className="modal-layer" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa giáo trình</h3>
            </div>
            <div className="modal-body">
              <p>Chức năng chỉnh sửa đang được phát triển...</p>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowEditModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherCourseDetail;
