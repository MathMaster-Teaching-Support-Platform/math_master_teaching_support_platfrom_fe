import { AlertCircle, ChevronLeft, ChevronRight, Flag, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionDisplay from '../../components/assessment/QuestionDisplay';
import QuestionNavigator from '../../components/assessment/QuestionNavigator';
import Timer from '../../components/assessment/Timer';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useDraftSnapshot,
  useSaveAndExit,
  useStartAssessment,
  useSubmitAssessment,
  useUpdateAnswer,
  useUpdateFlag,
} from '../../hooks/useStudentAssessment';
import '../../styles/module-refactor.css';
import type { AttemptStartResponse } from '../../types/studentAssessment.types';

export default function TakeAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<AttemptStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const sequenceRef = useRef(0);

  const startMutation = useStartAssessment();
  const updateAnswerMutation = useUpdateAnswer();
  const updateFlagMutation = useUpdateFlag();
  const submitMutation = useSubmitAssessment();
  const saveAndExitMutation = useSaveAndExit();

  // Start assessment on mount
  useEffect(() => {
    if (!assessmentId) return;
    startMutation.mutate(
      { assessmentId },
      {
        onSuccess: (response) => {
          setAttemptData(response.result);
          // Load existing answers if resuming
          if (response.result.attemptId) {
            // Will be loaded via draft snapshot
          }
        },
        onError: (error) => {
          console.error('Failed to start assessment:', error);
          navigate('/student/assessments');
        },
      }
    );
  }, [assessmentId]);

  // Load draft snapshot if resuming
  const { data: draftData } = useDraftSnapshot(attemptData?.attemptId || '', {
    enabled: !!attemptData?.attemptId,
  });

  useEffect(() => {
    if (draftData?.result) {
      setAnswers(draftData.result.answers || {});
      setFlags(draftData.result.flags || {});
    }
  }, [draftData]);

  // Debounced auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));

      if (!attemptData?.attemptId) return;

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Schedule save
      saveTimeoutRef.current = setTimeout(() => {
        updateAnswerMutation.mutate(
          {
            attemptId: attemptData.attemptId,
            questionId,
            answerValue: value,
            clientTimestamp: new Date().toISOString(),
            sequenceNumber: ++sequenceRef.current,
          },
          {
            onSuccess: () => {
              setLastSaved(new Date());
            },
          }
        );
      }, 1000);
    },
    [attemptData, updateAnswerMutation]
  );

  const handleFlagToggle = useCallback(
    (questionId: string) => {
      const newFlagged = !flags[questionId];
      setFlags((prev) => ({ ...prev, [questionId]: newFlagged }));

      if (!attemptData?.attemptId) return;

      updateFlagMutation.mutate({
        attemptId: attemptData.attemptId,
        questionId,
        flagged: newFlagged,
      });
    },
    [attemptData, flags, updateFlagMutation]
  );

  const handleSubmit = useCallback(() => {
    if (!attemptData?.attemptId) return;

    submitMutation.mutate(
      {
        attemptId: attemptData.attemptId,
        confirmed: true,
      },
      {
        onSuccess: () => {
          // Navigate to result page with submissionId
          navigate(`/student/assessments/result/${attemptData.submissionId}`);
        },
      }
    );
  }, [attemptData, submitMutation, navigate]);

  const handleSaveAndExit = useCallback(() => {
    if (!attemptData?.attemptId) return;

    saveAndExitMutation.mutate(attemptData.attemptId, {
      onSuccess: () => {
        navigate('/student/assessments');
      },
    });
  }, [attemptData, saveAndExitMutation, navigate]);

  const handleAutoSubmit = useCallback(() => {
    if (!attemptData?.attemptId) return;
    submitMutation.mutate({
      attemptId: attemptData.attemptId,
      confirmed: false,
    });
    // Navigate to result page with submissionId
    navigate(`/student/assessments/result/${attemptData.submissionId}`);
  }, [attemptData, submitMutation, navigate]);

  const currentQuestion = attemptData?.questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== ''
  ).length;
  const totalQuestions = attemptData?.questions.length || 0;

  if (startMutation.isPending) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: 'Student', avatar: '', role: 'student' }}
        notificationCount={0}
      >
        <div className="module-layout-container">
          <div className="empty">Đang khởi tạo bài kiểm tra...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attemptData || !currentQuestion) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: 'Student', avatar: '', role: 'student' }}
        notificationCount={0}
      >
        <div className="module-layout-container">
          <div className="empty">Không thể tải bài kiểm tra</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page" style={{ maxWidth: '100%' }}>
          {/* Header */}
          <header
            className="page-header"
            style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}
          >
            <div>
              <h2>{attemptData.instructions || 'Bài kiểm tra'}</h2>
              <p className="muted">
                Câu {currentIndex + 1} / {totalQuestions} • Đã trả lời: {answeredCount}
              </p>
            </div>
            <div className="row" style={{ gap: 16 }}>
              {lastSaved && (
                <span className="muted" style={{ fontSize: '0.875rem' }}>
                  <Save size={14} style={{ marginRight: 4 }} />
                  Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                </span>
              )}
              {attemptData.expiresAt && (
                <Timer expiresAt={attemptData.expiresAt} onExpire={handleAutoSubmit} />
              )}
            </div>
          </header>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginTop: 24 }}
          >
            {/* Main content */}
            <div>
              <QuestionDisplay
                question={currentQuestion}
                answer={answers[currentQuestion.questionId]}
                onAnswerChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
              />

              {/* Navigation */}
              <div className="row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
                <button
                  className="btn secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                >
                  <ChevronLeft size={14} />
                  Câu trước
                </button>

                <button
                  className="btn secondary"
                  onClick={() => handleFlagToggle(currentQuestion.questionId)}
                  style={{
                    backgroundColor: flags[currentQuestion.questionId]
                      ? 'var(--warning-color)'
                      : undefined,
                    color: flags[currentQuestion.questionId] ? 'white' : undefined,
                  }}
                >
                  <Flag size={14} />
                  {flags[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>

                <button
                  className="btn secondary"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  Câu sau
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <QuestionNavigator
                questions={attemptData.questions}
                currentIndex={currentIndex}
                answers={answers}
                flags={flags}
                onNavigate={setCurrentIndex}
              />

              <div style={{ marginTop: 24 }}>
                <button
                  className="btn secondary"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={handleSaveAndExit}
                  disabled={saveAndExitMutation.isPending}
                >
                  <Save size={14} />
                  Lưu và thoát
                </button>

                <button
                  className="btn"
                  style={{ width: '100%' }}
                  onClick={() => setShowSubmitConfirm(true)}
                >
                  Nộp bài
                </button>
              </div>
            </div>
          </div>

          {/* Submit confirmation modal */}
          {showSubmitConfirm && (
            <div className="modal-layer">
              <div className="modal-card" style={{ width: 'min(480px, 100%)' }}>
                <div className="modal-header">
                  <div>
                    <h3>Xác nhận nộp bài</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Bạn có chắc chắn muốn nộp bài không?
                    </p>
                  </div>
                </div>

                <div className="modal-body">
                  <div
                    className="row"
                    style={{
                      gap: 8,
                      padding: 12,
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 8,
                    }}
                  >
                    <AlertCircle size={16} style={{ color: 'var(--warning-color)' }} />
                    <div>
                      <p>
                        Đã trả lời: {answeredCount} / {totalQuestions} câu
                      </p>
                      {answeredCount < totalQuestions && (
                        <p className="muted" style={{ marginTop: 4, fontSize: '0.875rem' }}>
                          Bạn còn {totalQuestions - answeredCount} câu chưa trả lời
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn secondary" onClick={() => setShowSubmitConfirm(false)}>
                    Hủy
                  </button>
                  <button
                    className="btn"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Đang nộp...' : 'Xác nhận nộp bài'}
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
