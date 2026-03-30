import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import {
  useSubmissionForGrading,
  useCompleteGrading,
  useAddManualAdjustment,
  useTriggerAiReview,
} from '../../hooks/useGrading';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import AnswerGradingCard from '../../components/grading/AnswerGradingCard';
import type { ManualGradeRequest } from '../../types/grading.types';
import '../../styles/module-refactor.css';

export default function GradingDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [grades, setGrades] = useState<Record<string, ManualGradeRequest>>({});
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const { data, isLoading, isError } = useSubmissionForGrading(submissionId || '');
  const completeGradingMutation = useCompleteGrading();
  const addManualAdjustmentMutation = useAddManualAdjustment();
  const triggerAiReviewMutation = useTriggerAiReview();

  const submission = data?.result;

  const totalScore = useMemo(() => {
    if (!submission) return 0;
    let total = 0;
    submission.answers.forEach((answer) => {
      if (grades[answer.answerId]) {
        total += grades[answer.answerId].pointsEarned;
      } else if (answer.pointsEarned !== undefined) {
        total += answer.pointsEarned;
      }
    });
    return total + manualAdjustment;
  }, [submission, grades, manualAdjustment]);

  const handleCompleteGrading = () => {
    if (!submissionId) return;

    const gradesToSubmit = Object.values(grades);
    if (gradesToSubmit.length === 0) {
      alert('Vui lòng chấm ít nhất một câu trả lời');
      return;
    }

    completeGradingMutation.mutate(
      {
        submissionId,
        grades: gradesToSubmit,
      },
      {
        onSuccess: () => {
          // Apply manual adjustment if any
          if (manualAdjustment !== 0 && adjustmentReason.trim()) {
            addManualAdjustmentMutation.mutate({
              submissionId,
              adjustmentAmount: manualAdjustment, // Fixed: changed from adjustmentPoints
              reason: adjustmentReason,
            });
          }
          navigate('/teacher/grading');
        },
      }
    );
  };

  const handleTriggerAiReview = () => {
    if (!submissionId) return;
    triggerAiReviewMutation.mutate(submissionId);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Đang tải bài nộp...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !submission) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Không thể tải bài nộp</div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingAnswers = submission.answers.filter((a) => a.needsManualGrading && a.pointsEarned === undefined);

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <button className="btn secondary" onClick={() => navigate('/teacher/grading')}>
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2 style={{ marginTop: 12 }}>{submission.assessmentTitle}</h2>
              <p className="muted">
                Học sinh: {submission.studentName} ({submission.studentEmail})
              </p>
            </div>
            <div>
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 8,
                  textAlign: 'right',
                }}
              >
                <p className="muted" style={{ fontSize: '0.875rem' }}>Tổng điểm</p>
                <h2 style={{ marginTop: 4 }}>
                  {totalScore.toFixed(1)} / {submission.maxScore}
                </h2>
                <p className="muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  {((totalScore / submission.maxScore) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </header>

          {pendingAnswers.length > 0 && (
            <div
              style={{
                padding: 16,
                backgroundColor: 'var(--warning-color-light)',
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <p>
                Còn {pendingAnswers.length} câu trả lời chờ chấm điểm
              </p>
            </div>
          )}

          {/* Answers list */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Danh sách câu trả lời</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submission.answers.map((answer, index) => (
                <AnswerGradingCard
                  key={answer.answerId}
                  answer={answer}
                  index={index}
                  grade={grades[answer.answerId]}
                  onGradeChange={(grade) => {
                    setGrades((prev) => ({
                      ...prev,
                      [answer.answerId]: grade,
                    }));
                  }}
                  onTriggerAiReview={handleTriggerAiReview}
                  isAiReviewLoading={triggerAiReviewMutation.isPending}
                />
              ))}
            </div>
          </div>

          {/* Manual adjustment */}
          <div
            style={{
              padding: 20,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Điều chỉnh điểm thủ công</h3>
            <p className="muted" style={{ marginBottom: 12, fontSize: '0.875rem' }}>
              Thêm hoặc trừ điểm cho toàn bộ bài làm (ví dụ: thưởng cho trình bày đẹp, trừ vì nộp muộn)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                <label>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.875rem' }}>
                    Điểm điều chỉnh
                  </p>
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    value={manualAdjustment}
                    onChange={(e) => setManualAdjustment(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </label>
              </div>
              <div>
                <label>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.875rem' }}>
                    Lý do
                  </p>
                  <input
                    className="input"
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Nhập lý do điều chỉnh"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn"
              onClick={handleCompleteGrading}
              disabled={completeGradingMutation.isPending || Object.keys(grades).length === 0}
            >
              <Save size={14} />
              {completeGradingMutation.isPending ? 'Đang lưu...' : 'Hoàn thành chấm điểm'}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
