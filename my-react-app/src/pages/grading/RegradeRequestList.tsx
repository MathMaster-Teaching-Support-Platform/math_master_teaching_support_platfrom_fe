import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, Search, XCircle, MessageSquare } from 'lucide-react';
import { useRegradeRequests, useRespondToRegradeRequest } from '../../hooks/useGrading';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import type { RegradeRequestResponse } from '../../types/grading.types';
import '../../styles/module-refactor.css';

const statusFilters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = typeof statusFilters[number];

const statusLabel: Record<StatusFilter, string> = {
  ALL: 'Tất cả',
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
};

const statusClass: Record<string, string> = {
  PENDING: 'badge published',
  APPROVED: 'badge',
  REJECTED: 'badge closed',
};

export default function RegradeRequestList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [respondingRequest, setRespondingRequest] = useState<RegradeRequestResponse | null>(null);
  const [responseStatus, setResponseStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [newPoints, setNewPoints] = useState<number>(0);

  const { data, isLoading, isError, error, refetch } = useRegradeRequests({
    page,
    size: 20,
  });

  const respondMutation = useRespondToRegradeRequest();

  const requests = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

  const filtered = useMemo(() => {
    let result = requests;

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.questionText.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }

    return result;
  }, [requests, statusFilter, search]);

  const handleRespond = () => {
    if (!respondingRequest || !teacherResponse.trim()) return;

    respondMutation.mutate(
      {
        requestId: respondingRequest.requestId,
        status: responseStatus,
        teacherResponse,
        newPoints: responseStatus === 'APPROVED' ? newPoints : undefined,
      },
      {
        onSuccess: () => {
          setRespondingRequest(null);
          setTeacherResponse('');
          setNewPoints(0);
          refetch();
        },
      }
    );
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <h2>Yêu cầu chấm lại</h2>
              <p>Xem và phản hồi yêu cầu chấm lại từ học sinh.</p>
            </div>
          </header>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm theo tên học sinh hoặc câu hỏi"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn ${statusFilter === item ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(item);
                    setPage(0);
                  }}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && <div className="empty">Đang tải danh sách yêu cầu...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách yêu cầu'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Chưa có yêu cầu chấm lại nào.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((request) => (
                <RegradeRequestCard
                  key={request.requestId}
                  request={request}
                  onRespond={() => setRespondingRequest(request)}
                  onViewSubmission={() => navigate(`/teacher/grading/${request.submissionId}`)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}

          {/* Respond Modal */}
          {respondingRequest && (
            <div className="modal-layer">
              <div className="modal-card" style={{ width: 'min(600px, 100%)' }}>
                <div className="modal-header">
                  <div>
                    <h3>Phản hồi yêu cầu chấm lại</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Học sinh: {respondingRequest.studentName}
                    </p>
                  </div>
                </div>

                <div className="modal-body">
                  {/* Question */}
                  <div style={{ marginBottom: 16 }}>
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                      Câu hỏi:
                    </p>
                    <p style={{ padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 6 }}>
                      <MathText text={respondingRequest.questionText} />
                    </p>
                  </div>

                  {/* Student Reason */}
                  <div style={{ marginBottom: 16 }}>
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                      Lý do của học sinh:
                    </p>
                    <p style={{ padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 6 }}>
                      {respondingRequest.reason}
                    </p>
                  </div>

                  {/* Response Status */}
                  <div style={{ marginBottom: 16 }}>
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                      Quyết định:
                    </p>
                    <div className="row" style={{ gap: 12 }}>
                      <button
                        className={`btn ${responseStatus === 'APPROVED' ? '' : 'secondary'}`}
                        onClick={() => setResponseStatus('APPROVED')}
                      >
                        <CheckCircle size={14} />
                        Chấp nhận
                      </button>
                      <button
                        className={`btn ${responseStatus === 'REJECTED' ? 'danger' : 'secondary'}`}
                        onClick={() => setResponseStatus('REJECTED')}
                      >
                        <XCircle size={14} />
                        Từ chối
                      </button>
                    </div>
                  </div>

                  {/* New Points (if approved) */}
                  {responseStatus === 'APPROVED' && (
                    <div style={{ marginBottom: 16 }}>
                      <label>
                        <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
                          Điểm mới:
                        </p>
                        <input
                          className="input"
                          type="number"
                          step="0.5"
                          value={newPoints}
                          onChange={(e) => setNewPoints(parseFloat(e.target.value) || 0)}
                          placeholder="Nhập điểm mới"
                        />
                      </label>
                    </div>
                  )}

                  {/* Teacher Response */}
                  <div>
                    <label>
                      <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
                        Phản hồi của bạn: *
                      </p>
                      <textarea
                        className="input"
                        value={teacherResponse}
                        onChange={(e) => setTeacherResponse(e.target.value)}
                        placeholder="Nhập phản hồi cho học sinh..."
                        rows={5}
                        style={{ width: '100%' }}
                      />
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setRespondingRequest(null);
                      setTeacherResponse('');
                      setNewPoints(0);
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn"
                    disabled={!teacherResponse.trim() || respondMutation.isPending}
                    onClick={handleRespond}
                  >
                    {respondMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function RegradeRequestCard({
  request,
  onRespond,
  onViewSubmission,
}: {
  request: RegradeRequestResponse;
  onRespond: () => void;
  onViewSubmission: () => void;
}) {
  const createdDate = new Date(request.createdAt);
  const reviewedDate = request.reviewedAt ? new Date(request.reviewedAt) : null;

  return (
    <article
      className="data-card"
      style={{
        padding: 20,
        backgroundColor: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className={statusClass[request.status]}>
            {request.status === 'PENDING' && 'Chờ xử lý'}
            {request.status === 'APPROVED' && 'Đã chấp nhận'}
            {request.status === 'REJECTED' && 'Đã từ chối'}
          </span>
        </div>
        <span className="muted" style={{ fontSize: '0.875rem' }}>
          {createdDate.toLocaleString('vi-VN')}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4 style={{ marginBottom: 4 }}>{request.studentName}</h4>
        <p className="muted" style={{ fontSize: '0.875rem' }}>
          Câu hỏi: <MathText text={request.questionText} />
        </p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
          Lý do:
        </p>
        <p style={{ fontSize: '0.875rem' }}>{request.reason}</p>
      </div>

      {request.teacherResponse && (
        <div
          style={{
            padding: 12,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
            Phản hồi của giáo viên:
          </p>
          <p style={{ fontSize: '0.875rem' }}>{request.teacherResponse}</p>
          {reviewedDate && (
            <p className="muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>
              Phản hồi lúc: {reviewedDate.toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      )}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn secondary" onClick={onViewSubmission}>
          <MessageSquare size={14} />
          Xem bài làm
        </button>

        {request.status === 'PENDING' && (
          <button className="btn" onClick={onRespond}>
            Phản hồi
          </button>
        )}
      </div>
    </article>
  );
}
