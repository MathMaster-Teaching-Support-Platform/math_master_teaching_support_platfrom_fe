import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, MessageSquare } from 'lucide-react';
import { UI_TEXT } from '../../constants/uiText';
import { useMyResult, useCreateRegradeRequest } from '../../hooks/useGrading';
import { ClauseDetailDisplay } from '../../components/assessment/ClauseDetailDisplay';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import '../../styles/module-refactor.css';

export default function AssessmentResult() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [showRegradeModal, setShowRegradeModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [regradeReason, setRegradeReason] = useState('');

  const { data, isLoading, isError } = useMyResult(submissionId || '');
  const createRegradeRequestMutation = useCreateRegradeRequest();

  const result = data?.result;

  const handleRegradeRequest = () => {
    if (!result || !selectedQuestionId || !regradeReason.trim()) return;

    createRegradeRequestMutation.mutate(
      {
        submissionId: result.submissionId,
        questionId: selectedQuestionId,
        reason: regradeReason,
      },
      {
        onSuccess: () => {
          setShowRegradeModal(false);
          setSelectedQuestionId('');
          setRegradeReason('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Đang tải kết quả...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !result) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Không thể tải kết quả</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <button className="btn secondary" onClick={() => navigate('/student/assessments')}>
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2 style={{ marginTop: 12 }}>{result.assessmentTitle}</h2>
              <p className="muted">Kết quả {UI_TEXT.QUIZ.toLowerCase()}</p>
            </div>
          </header>

          {/* Score summary */}
          <div
            style={{
              padding: 24,
              backgroundColor: 'var(--primary-color-light)',
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h1 style={{ fontSize: '3rem', marginBottom: 8 }}>
                  {result.finalScore?.toFixed(1) || result.score?.toFixed(1) || 0} / {result.maxScore}
                </h1>
                <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {result.percentage?.toFixed(1)}%
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.timeSpentSeconds && (
                  <div className="row" style={{ gap: 8 }}>
                    <Clock size={16} />
                    <span>Thời gian: {Math.floor(result.timeSpentSeconds / 60)} phút</span>
                  </div>
                )}
                {result.attemptNumber && (
                  <div className="row" style={{ gap: 8 }}>
                    <FileText size={16} />
                    <span>Lần làm thứ {result.attemptNumber}</span>
                  </div>
                )}
                {result.submittedAt && (
                  <div className="row" style={{ gap: 8 }}>
                    <span className="muted">Nộp lúc: {new Date(result.submittedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>

            {result.manualAdjustment !== undefined && result.manualAdjustment !== 0 && (
              <div style={{ marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 6 }}>
                <p>
                  Điều chỉnh thủ công: {result.manualAdjustment > 0 ? '+' : ''}
                  {result.manualAdjustment} điểm
                </p>
                {result.manualAdjustmentReason && (
                  <p className="muted" style={{ marginTop: 4, fontSize: '0.875rem' }}>
                    Lý do: {result.manualAdjustmentReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answers list */}
          <div>
            <h3 style={{ marginBottom: 16 }}>Chi tiết câu trả lời</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result.answers.map((answer, index) => (
                <div
                  key={answer.answerId}
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4>Câu {index + 1}</h4>
                    <div className="row" style={{ gap: 8 }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            answer.isCorrect === true
                              ? 'var(--success-color)'
                              : answer.isCorrect === false
                              ? 'var(--danger-color)'
                              : 'var(--warning-color)',
                        }}
                      >
                        {answer.pointsEarned?.toFixed(1) || 0} / {answer.maxPoints} điểm
                      </span>
                      {answer.needsManualGrading && !answer.pointsEarned && (
                        <span className="badge" style={{ backgroundColor: 'var(--warning-color)' }}>
                          Đang chấm
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ marginBottom: 12 }}>
                    <MathText text={answer.questionText} />
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                      Câu trả lời của bạn:
                    </p>
                    <p
                      style={{
                        padding: 12,
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {answer.answerText || '(Không có câu trả lời)'}
                    </p>
                  </div>

                  {answer.correctAnswer && (
                    <div style={{ marginBottom: 12 }}>
                      <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                        Đáp án đúng:
                      </p>
                      <p
                        style={{
                          padding: 12,
                          backgroundColor: 'var(--success-color-light)',
                          borderRadius: 6,
                        }}
                      >
                        {answer.correctAnswer}
                      </p>
                    </div>
                  )}

                  {answer.feedback && (
                    <div style={{ marginBottom: 12 }}>
                      <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                        Nhận xét từ giáo viên:
                      </p>
                      <p
                        style={{
                          padding: 12,
                          backgroundColor: 'var(--primary-color-light)',
                          borderRadius: 6,
                        }}
                      >
                        {answer.feedback}
                      </p>
                    </div>
                  )}

                  {/* NEW: Clause detail display for TRUE_FALSE questions */}
                  {answer.scoringDetail && (
                    <ClauseDetailDisplay scoringDetail={answer.scoringDetail} />
                  )}

                  {/* AI Reviews - Not yet implemented in BE
                  {answer.aiReviews && answer.aiReviews.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                        Đánh giá AI:
                      </p>
                      {answer.aiReviews.map((review, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 12,
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                        >
                          <p style={{ fontSize: '0.875rem' }}>{review.reviewContent}</p>
                          {review.suggestions && review.suggestions.length > 0 && (
                            <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: '0.875rem' }}>
                              {review.suggestions.map((suggestion, sIdx) => (
                                <li key={sIdx}>{suggestion}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  */}

                  {result.gradesReleased && (
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setSelectedQuestionId(answer.questionId);
                        setShowRegradeModal(true);
                      }}
                    >
                      <MessageSquare size={14} />
                      Yêu cầu chấm lại
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Regrade request modal */}
          {showRegradeModal && (
            <div className="modal-layer">
              <div className="modal-card" style={{ width: 'min(520px, 100%)' }}>
                <div className="modal-header">
                  <div>
                    <h3>Yêu cầu chấm lại</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Giải thích lý do bạn muốn giáo viên chấm lại câu này
                    </p>
                  </div>
                </div>

                <div className="modal-body">
                  <textarea
                    className="input"
                    value={regradeReason}
                    onChange={(e) => setRegradeReason(e.target.value)}
                    placeholder="Nhập lý do yêu cầu chấm lại..."
                    rows={5}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setShowRegradeModal(false);
                      setRegradeReason('');
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn"
                    disabled={!regradeReason.trim() || createRegradeRequestMutation.isPending}
                    onClick={handleRegradeRequest}
                  >
                    {createRegradeRequestMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
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
