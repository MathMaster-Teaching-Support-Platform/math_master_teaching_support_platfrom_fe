import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  XCircle,
} from 'lucide-react';
import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  useApproveCourseReview,
  useCourseReviewHistory,
  usePendingReviewCourses,
  useRejectCourseReview,
} from '../../hooks/useCourses';
import type { CourseResponse } from '../../types';
import './AdminCourseReviewsPage.css';

const PAGE_SIZE = 10;

const PROVIDER_LABELS: Record<string, string> = {
  MINISTRY: 'Bộ GD&ĐT',
  CUSTOM: 'Tùy chỉnh',
};

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  DRAFT: 'Bản nháp',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: 'badge-pending',
  PUBLISHED: 'badge-approved',
  REJECTED: 'badge-rejected',
  DRAFT: 'badge-draft',
};

// ─── Pending Tab ──────────────────────────────────────────────────────────────
function PendingTab() {
  const { showToast } = useToast();
  const [page, setPage] = React.useState(0);
  const [rejectCourseId, setRejectCourseId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  const { data, isLoading, refetch } = usePendingReviewCourses(page, PAGE_SIZE);
  const approveMutation = useApproveCourseReview();
  const rejectMutation = useRejectCourseReview();

  const pendingPage = data?.result;
  const courses = pendingPage?.content ?? [];
  const totalPages = pendingPage?.totalPages ?? 1;

  const approvingId =
    approveMutation.isPending && typeof approveMutation.variables === 'string'
      ? approveMutation.variables
      : null;
  const rejectingId =
    rejectMutation.isPending && rejectMutation.variables ? rejectMutation.variables.courseId : null;

  const onApprove = (courseId: string) => {
    approveMutation.mutate(courseId, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã duyệt và xuất bản khóa học.' });
        refetch();
      },
      onError: (err: unknown) => {
        showToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể duyệt khóa học.',
        });
      },
    });
  };

  const onReject = () => {
    if (!rejectCourseId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showToast({ type: 'error', message: 'Vui lòng nhập lý do từ chối.' });
      return;
    }
    rejectMutation.mutate(
      { courseId: rejectCourseId, data: { reason } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã từ chối khóa học.' });
          setRejectCourseId(null);
          setRejectReason('');
          refetch();
        },
        onError: (err: unknown) => {
          showToast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Không thể từ chối khóa học.',
          });
        },
      }
    );
  };

  let content: React.ReactNode;
  if (isLoading) {
    content = <div className="acr-empty">Đang tải danh sách chờ duyệt...</div>;
  } else if (courses.length === 0) {
    content = <div className="acr-empty">Không có khóa học nào đang chờ duyệt.</div>;
  } else {
    content = (
      <>
        <table className="acr-table">
          <thead>
            <tr>
              <th>Tên khóa học</th>
              <th>Giảng viên</th>
              <th>Loại</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                actions={
                  <div className="acr-actions">
                    <a
                      className="acr-btn acr-btn-preview"
                      href={`/admin/courses/${course.id}/review`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="acr-icon" />
                      Xem nội dung
                    </a>
                    <button
                      className="acr-btn acr-btn-approve"
                      onClick={() => onApprove(course.id)}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <CheckCircle2 className="acr-icon" />
                      {approvingId === course.id ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                    <button
                      className="acr-btn acr-btn-reject"
                      onClick={() => {
                        setRejectCourseId(course.id);
                        setRejectReason('');
                      }}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <XCircle className="acr-icon" />
                      Từ chối
                    </button>
                  </div>
                }
              />
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </>
    );
  }

  return (
    <>
      <div className="acr-card">{content}</div>

      {rejectCourseId && (
        <div className="acr-modal-backdrop">
          <div className="acr-modal">
            <h2>Từ chối khóa học</h2>
            <p>Nhập lý do để giáo viên chỉnh sửa và gửi lại.</p>
            <textarea
              rows={5}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Nội dung khóa học chưa đủ rõ ràng ở phần mục tiêu học tập..."
            />
            <div className="acr-modal-actions">
              <button
                className="acr-btn"
                onClick={() => {
                  setRejectCourseId(null);
                  setRejectReason('');
                }}
              >
                Hủy
              </button>
              <button
                className="acr-btn acr-btn-reject"
                onClick={onReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [page, setPage] = React.useState(0);
  const [status, setStatus] = React.useState('ALL');

  const { data, isLoading } = useCourseReviewHistory(status, page, PAGE_SIZE);
  const historyPage = data?.result;
  const courses = historyPage?.content ?? [];
  const totalPages = historyPage?.totalPages ?? 1;

  const handleStatusChange = (s: string) => {
    setStatus(s);
    setPage(0);
  };

  let content: React.ReactNode;
  if (isLoading) {
    content = <div className="acr-empty">Đang tải lịch sử...</div>;
  } else if (courses.length === 0) {
    content = <div className="acr-empty">Không có khóa học nào.</div>;
  } else {
    content = (
      <>
        <table className="acr-table">
          <thead>
            <tr>
              <th>Tên khóa học</th>
              <th>Giảng viên</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                showStatus
                actions={
                  <a
                    className="acr-btn acr-btn-preview"
                    href={`/admin/courses/${course.id}/review`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="acr-icon" />
                    Xem nội dung
                  </a>
                }
              />
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </>
    );
  }

  return (
    <div className="acr-card">
      <div className="acr-filter-bar">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`acr-filter-btn ${status === key ? 'active' : ''}`}
            onClick={() => handleStatusChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function CourseRow({
  course,
  actions,
  showStatus = false,
}: Readonly<{
  course: CourseResponse;
  actions: React.ReactNode;
  showStatus?: boolean;
}>) {
  return (
    <tr>
      <td>
        <div className="acr-title-cell">
          <strong>{course.title}</strong>
          {course.rejectionReason && (
            <span className="acr-rejection-reason" title={course.rejectionReason}>
              Lý do: {course.rejectionReason}
            </span>
          )}
        </div>
      </td>
      <td>{course.teacherName ?? '—'}</td>
      <td>{PROVIDER_LABELS[course.provider] ?? course.provider}</td>
      {showStatus && (
        <td>
          <span className={`acr-status-badge ${STATUS_BADGE[course.status ?? ''] ?? ''}`}>
            {STATUS_LABELS[course.status ?? ''] ?? course.status}
          </span>
        </td>
      )}
      <td>{new Date(course.updatedAt ?? course.createdAt).toLocaleDateString('vi-VN')}</td>
      <td>{actions}</td>
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: Readonly<{
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}>) {
  return (
    <div className="acr-pagination">
      <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
        <ChevronLeft className="acr-icon" />
        Trước
      </button>
      <span>
        Trang {page + 1} / {Math.max(totalPages, 1)}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page + 1 >= totalPages}
      >
        Sau
        <ChevronRight className="acr-icon" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const AdminCourseReviewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'history'>('pending');

  return (
    <DashboardLayout role="admin" user={{ name: 'Admin', avatar: '', role: 'admin' }}>
      <div className="acr-page">
        <div className="acr-header">
          <div>
            <h1>
              <BookOpen className="acr-header-icon" />
              Duyệt Khóa Học
            </h1>
            <p>Quản lý và theo dõi trạng thái phê duyệt khóa học.</p>
          </div>
        </div>

        <div className="acr-tabs">
          <button
            className={`acr-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock3 className="acr-tab-icon" />
            Chờ duyệt
          </button>
          <button
            className={`acr-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="acr-tab-icon" />
            Lịch sử duyệt
          </button>
        </div>

        {activeTab === 'pending' ? <PendingTab /> : <HistoryTab />}
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseReviewsPage;
