import { ArrowLeft, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment, useUpdateAssessment } from '../../hooks/useAssessment';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import '../../styles/module-refactor.css';
import type { AssessmentRequest } from '../../types';
import AssessmentModal from './AssessmentModal';

const assessmentStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  CLOSED: 'Đã đóng',
};

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm nhanh',
  TEST: 'Bài kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập về nhà',
};

const assessmentModeLabel: Record<string, string> = {
  DIRECT: 'Trực tiếp',
  MATRIX_BASED: 'Theo ma trận đề',
};

const scoringPolicyLabel: Record<string, string> = {
  BEST: 'Lần tốt nhất',
  LATEST: 'Lần gần nhất',
  AVERAGE: 'Điểm trung bình',
};

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [openEdit, setOpenEdit] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAssessment(id ?? '');
  const updateMutation = useUpdateAssessment();

  const assessment = data?.result;

  async function save(payload: AssessmentRequest) {
    if (!id) return;
    await updateMutation.mutateAsync({ id, data: payload });
    setOpenEdit(false);
    await refetch();
  }

  function renderContent() {
    if (isLoading) {
      return <section className="module-page"><div className="empty">Đang tải chi tiết bài kiểm tra...</div></section>;
    }

    if (isError) {
      return (
        <section className="module-page">
          <div className="empty">{error instanceof Error ? error.message : 'Không thể tải chi tiết bài kiểm tra'}</div>
        </section>
      );
    }

    if (!assessment) {
      return <section className="module-page"><div className="empty">Không tìm thấy bài kiểm tra.</div></section>;
    }

    return (
      <section className="module-page">
        <button className="btn secondary" onClick={() => navigate('/teacher/assessments')}>
          <ArrowLeft size={14} />
          Quay lại danh sách bài kiểm tra
        </button>

        <article className="hero-card">
          <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <p className="hero-kicker">Chi tiết bài kiểm tra</p>
              <h2>{assessment.title}</h2>
              <p>{assessment.description || 'Không có mô tả'}</p>
            </div>
            {assessment.status === 'DRAFT' && (
              <button className="btn secondary" onClick={() => setOpenEdit(true)}>
                <Pencil size={14} />
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </article>

        <div className="stats-grid">
          <article className="stat-card">
            <p>Trạng thái</p>
            <h3>{assessmentStatusLabel[assessment.status] || assessment.status}</h3>
            <span>{assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}</span>
          </article>
          <article className="stat-card">
            <p>Câu hỏi</p>
            <h3>{assessment.totalQuestions}</h3>
            <span>Tổng điểm: {assessment.totalPoints}</span>
          </article>
          <article className="stat-card">
            <p>Lượt nộp</p>
            <h3>{assessment.submissionCount}</h3>
            <span>Chính sách chấm điểm: {scoringPolicyLabel[assessment.attemptScoringPolicy || 'BEST'] || assessment.attemptScoringPolicy || 'BEST'}</span>
          </article>
        </div>

        <div className="table-wrap">
          <table className="table">
            <tbody>
              <tr>
                <th>Bài học</th>
                <td>{assessment.lessonTitles?.join(', ') || 'Không có'}</td>
              </tr>
              <tr>
                <th>Thời gian làm bài</th>
                <td>{assessment.timeLimitMinutes || 0} phút</td>
              </tr>
              <tr>
                <th>Điểm đạt</th>
                <td>{assessment.passingScore || 0}%</td>
              </tr>
              <tr>
                <th>Chế độ tạo đề</th>
                <td>{assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] || assessment.assessmentMode || 'DIRECT'}</td>
              </tr>
              <tr>
                <th>Ma trận đề</th>
                <td>{assessment.examMatrixId || 'Không có'}</td>
              </tr>
              <tr>
                <th>Lịch làm bài</th>
                <td>{assessment.startDate ? new Date(assessment.startDate).toLocaleString() : 'Chưa đặt lịch'} - {assessment.endDate ? new Date(assessment.endDate).toLocaleString() : 'Không giới hạn'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <AssessmentModal
          isOpen={openEdit}
          mode="edit"
          initialData={assessment}
          onClose={() => setOpenEdit(false)}
          onSubmit={save}
        />
      </section>
    );
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      {renderContent()}
    </DashboardLayout>
  );
}
