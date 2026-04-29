import { AlertCircle, ChevronLeft, ChevronRight, Flag, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionRenderer } from '../../components/question';
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
import { UI_TEXT } from '../../constants/uiText';
import type { AttemptStartResponse } from '../../types/studentAssessment.types';

export default function TakeAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<AttemptStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const sequenceRef = useRef(0);
  const pendingSavesRef = useRef<Promise<any>[]>([]);
  const hasSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const loadedAnswers = draftData.result.answers || {};
      const loadedFlags = draftData.result.flags || {};

      setAnswers(loadedAnswers);
      setFlags(loadedFlags);

      // Show notification if resuming with existing answers
      if (Object.keys(loadedAnswers).length > 0 && !isResumed) {
        setIsResumed(true);
        console.log(
          'Đã khôi phục bài làm trước đó với',
          Object.keys(loadedAnswers).length,
          'câu trả lời'
        );
        // You can add toast notification here if you have a toast library
      }
    }
  }, [draftData, isResumed]);

  // Debounced auto-save with pending saves tracking
  const removePendingSave = useCallback((promise: Promise<any>) => {
    pendingSavesRef.current = pendingSavesRef.current.filter(
      (trackedPromise) => trackedPromise !== promise
    );
  }, []);

  const clearDebounceTimer = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      setIsSaving(false);
    }
  }, []);

  const waitForPendingSaves = useCallback(async (errorMessage: string) => {
    if (pendingSavesRef.current.length === 0) return;

    try {
      await Promise.all(pendingSavesRef.current);
    } catch (error) {
      console.error(errorMessage, error);
    }
  }, []);

  const submitAttempt = useCallback(
    async (confirmed: boolean) => {
      if (!attemptData?.attemptId || hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      clearDebounceTimer();
      await waitForPendingSaves('Some saves failed before submit:');

      try {
        await submitMutation.mutateAsync({
          attemptId: attemptData.attemptId,
          confirmed,
        });
        navigate(`/student/assessments/result/${attemptData.submissionId}`);
      } catch (error) {
        hasSubmittedRef.current = false;
        console.error('Failed to submit assessment:', error);
      }
    },
    [attemptData, clearDebounceTimer, waitForPendingSaves, submitMutation, navigate]
  );

  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));

      if (!attemptData?.attemptId) return;

      // Clear previous timeout
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      setIsSaving(true);

      // Schedule save
      saveTimeoutRef.current = setTimeout(() => {
        const savePromise = updateAnswerMutation
          .mutateAsync({
            attemptId: attemptData.attemptId,
            questionId,
            answerValue: value,
            clientTimestamp: new Date().toISOString(),
            sequenceNumber: ++sequenceRef.current,
          })
          .then(() => {
            setLastSaved(new Date());
            setIsSaving(false);
            // Remove from pending saves
            removePendingSave(savePromise);
          })
          .catch((error) => {
            console.error('Failed to save answer:', error);
            setIsSaving(false);
            removePendingSave(savePromise);
          });

        // Track pending save
        pendingSavesRef.current.push(savePromise);
      }, 1000);
    },
    [attemptData, updateAnswerMutation, removePendingSave]
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

  const handleSubmit = useCallback(async () => {
    await submitAttempt(true);
  }, [submitAttempt]);

  const handleSaveAndExit = useCallback(() => {
    if (!attemptData?.attemptId) return;

    saveAndExitMutation.mutate(attemptData.attemptId, {
      onSuccess: () => {
        navigate('/student/assessments');
      },
    });
  }, [attemptData, saveAndExitMutation, navigate]);

  const handleAutoSubmit = useCallback(async () => {
    await submitAttempt(false);
  }, [submitAttempt]);

  const countdownExpiresAt = useMemo(() => {
    if (!attemptData) return null;

    if (typeof attemptData.timeLimitMinutes === 'number' && attemptData.timeLimitMinutes > 0) {
      const startedAtMs = new Date(attemptData.startedAt).getTime();
      if (!Number.isNaN(startedAtMs)) {
        return new Date(startedAtMs + attemptData.timeLimitMinutes * 60 * 1000).toISOString();
      }
    }

    // Backward-compatible fallback for existing API responses.
    return attemptData.expiresAt || null;
  }, [attemptData]);

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
          <div className="page-spinner">
            <div className="spinner-ring" />
          </div>
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
          <div className="empty">Không thể tải {UI_TEXT.QUIZ.toLowerCase()}</div>
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
              <h2>{attemptData.instructions || UI_TEXT.QUIZ}</h2>
              <p className="muted">
                Câu {currentIndex + 1} / {totalQuestions} • Đã trả lời: {answeredCount}
              </p>
            </div>
            <div className="row" style={{ gap: 16 }}>
              {isSaving && (
                <span
                  className="muted"
                  style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}
                >
                  <Save size={14} style={{ marginRight: 4 }} />
                  Đang lưu...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="muted" style={{ fontSize: '0.875rem' }}>
                  <Save size={14} style={{ marginRight: 4 }} />
                  Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                </span>
              )}
              {typeof attemptData.timeLimitMinutes === 'number' &&
                attemptData.timeLimitMinutes > 0 &&
                countdownExpiresAt && (
                  <Timer expiresAt={countdownExpiresAt} onExpire={handleAutoSubmit} />
                )}
            </div>
          </header>

          {/* Resume notification banner */}
          {isResumed && (
            <div
              style={{
                padding: 12,
                backgroundColor: 'var(--primary-color-light)',
                borderRadius: 8,
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontSize: '0.875rem' }}>
                Đã khôi phục bài làm trước đó với {answeredCount} câu trả lời
              </span>
            </div>
          )}

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginTop: 24 }}
          >
            {/* Main content */}
            <div>
              <QuestionRenderer
                question={currentQuestion}
                studentAnswer={answers[currentQuestion.questionId]}
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
