import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  useApproveCourseReview,
  usePendingReviewCourses,
  useRejectCourseReview,
} from '../../hooks/useCourses';
import './AdminCourseReviewsPage.css';

const PAGE_SIZE = 10;

// Provider label mapping
const PROVIDER_LABELS: Record<string, string> = {
  MINISTRY: 'Bộ GD&ĐT',
  CUSTOM: 'Tùy chỉnh',
};

const AdminCourseReviewsPage: React.FC = () => {
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

  const approvingCourseId =
    approveMutation.isPending && typeof approveMutation.variables === 'string'
      ? approveMutation.variables
      : null;

  const rejectingCourseId =
    rejectMutation.isPending && rejectMutation.variables
      ? rejectMutation.variables.courseId
      : null;

  const onApprove = (courseId: string) => {
    approveMutation.mutate(courseId, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã duyệt và xuất bản khóa học.' });
        refetch();
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Không thể duyệt khóa học.';
        showToast({ type: 'error', message });
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
          const message = err instanceof Error ? err.message : 'Không thể từ chối khóa học.';
          showToast({ type: 'error', message });
        },
      }
    );
  };

  return (
    <DashboardLayout role="admin" user={{ name: 'Admin', avatar: '', role: 'admin' }}>
      <div className="acr-page">
        <div className="acr-header">
          <div>
            <h1>Duyệt Khóa Học</h1>
            <p>Danh sách khóa học đang chờ phê duyệt trước khi xuất bản.</p>
          </div>
          <button className="acr-refresh" onClick={() => refetch()} disabled={isLoading}>
            Tải lại
          </button>
        </div>

        <div className="acr-card">
          {isLoading ? (
            <div className="acr-empty">Đang tải danh sách chờ duyệt...</div>
          ) : courses.length === 0 ? (
            <div className="acr-empty">Không có khóa học nào đang chờ duyệt.</div>
          ) : (
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
                    <tr key={course.id}>
                      <td>
                        <div className="acr-title-cell">
                          <strong>{course.title}</strong>
                          <Link to={`/course/${course.id}`}>Xem preview</Link>
                        </div>
                      </td>
                      <td>{course.teacherName ?? '—'}</td>
                      <td>{PROVIDER_LABELS[course.provider] || course.provider}</td>
                      <td>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="acr-actions">
                          <button
                            className="acr-btn acr-btn-approve"
                            onClick={() => onApprove(course.id)}
                            disabled={approvingCourseId === course.id || rejectingCourseId === course.id}
                          >
                            {approvingCourseId === course.id ? 'Đang duyệt...' : 'Duyệt'}
                          </button>
                          <button
                            className="acr-btn acr-btn-reject"
                            onClick={() => {
                              setRejectCourseId(course.id);
                              setRejectReason('');
                            }}
                            disabled={approvingCourseId === course.id || rejectingCourseId === course.id}
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="acr-pagination">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Trước
                </button>
                <span>
                  Trang {page + 1} / {Math.max(totalPages, 1)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page + 1 >= totalPages}
                >
                  Sau
                </button>
              </div>
            </>
          )}
        </div>

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
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseReviewsPage;
