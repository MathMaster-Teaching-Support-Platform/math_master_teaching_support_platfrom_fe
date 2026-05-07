import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, Flag, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionNavigator from '../../components/assessment/QuestionNavigator';
import Timer from '../../components/assessment/Timer';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { QuestionRenderer } from '../../components/question';
import { UI_TEXT } from '../../constants/uiText';
import {
  useDraftSnapshot,
  useSaveAndExit,
  useStartAssessment,
  useSubmitAssessment,
  useUpdateAnswer,
  useUpdateFlag,
} from '../../hooks/useStudentAssessment';
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
    (k) => answers[k] !== undefined && answers[k] !== null
  ).length;
  const totalQuestions = attemptData?.questions.length || 0;

  // Group questions by part for display
  const questionsByPart = useMemo(() => {
    if (!attemptData?.questions) return null;

    const grouped = new Map<number, typeof attemptData.questions>();

    attemptData.questions.forEach((q) => {
      let part = q.partNumber;
      if (part === undefined) {
        if (q.questionType === 'TRUE_FALSE') part = 2;
        else if (q.questionType === 'SHORT_ANSWER') part = 3;
        else part = 1;
      }
      if (!grouped.has(part)) grouped.set(part, []);
      grouped.get(part)!.push(q);
    });

    return grouped;
  }, [attemptData?.questions]);

  // Get part info for current question
  const currentPartInfo = useMemo(() => {
    if (!currentQuestion || !questionsByPart) return null;

    const partLabels: Record<number, string> = {
      1: 'Phần I: Trắc nghiệm nhiều lựa chọn',
      2: 'Phần II: Trắc nghiệm Đúng/Sai',
      3: 'Phần III: Trắc nghiệm trả lời ngắn',
    };

    // Determine part number (with fallback)
    let partNum = currentQuestion.partNumber;
    if (partNum === undefined) {
      if (currentQuestion.questionType === 'TRUE_FALSE') partNum = 2;
      else if (currentQuestion.questionType === 'SHORT_ANSWER') partNum = 3;
      else partNum = 1;
    }

    const partQuestions = questionsByPart.get(partNum) || [];
    const questionIndexInPart = partQuestions.findIndex(
      (q) => q.questionId === currentQuestion.questionId
    );

    return {
      partNumber: partNum,
      partLabel: partLabels[partNum] || `Phần ${partNum}`,
      questionIndexInPart: questionIndexInPart + 1,
      totalInPart: partQuestions.length,
    };
  }, [currentQuestion, questionsByPart]);

  if (startMutation.isPending) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: 'Student', avatar: '', role: 'student' }}
        notificationCount={0}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="px-6 py-8 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <span
            className="w-10 h-10 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin"
            aria-hidden
          />
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]" role="status">
            Đang khởi tạo {UI_TEXT.QUIZ.toLowerCase()}...
          </p>
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
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="px-6 py-8 lg:px-8 flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
            <AlertCircle className="w-6 h-6" aria-hidden />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center">
            Không thể tải {UI_TEXT.QUIZ.toLowerCase()}
          </p>
          <button
            type="button"
            onClick={() => navigate('/student/assessments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Quay lại
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6 max-w-[1280px] mx-auto">
          <header className="rounded-2xl border border-[#E8E6DC] bg-white px-5 py-4 shadow-[rgba(0,0,0,0.04)_0px_2px_12px] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-[Playfair_Display] text-[20px] sm:text-[22px] font-medium text-[#141413] leading-tight">
                {attemptData.instructions || UI_TEXT.QUIZ}
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
                Câu {currentIndex + 1} / {totalQuestions} • Đã trả lời: {answeredCount}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {isSaving ? (
                <span className="inline-flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] text-[#3898EC]">
                  <Save className="w-4 h-4" aria-hidden />
                  Đang lưu...
                </span>
              ) : null}
              {!isSaving && lastSaved ? (
                <span className="inline-flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                  <Save className="w-4 h-4" aria-hidden />
                  Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                </span>
              ) : null}
              {typeof attemptData.timeLimitMinutes === 'number' &&
                attemptData.timeLimitMinutes > 0 &&
                countdownExpiresAt && (
                  <Timer expiresAt={countdownExpiresAt} onExpire={handleAutoSubmit} />
                )}
            </div>
          </header>

          {isResumed ? (
            <div className="flex items-start gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden />
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#1e40af] leading-relaxed">
                Đã khôi phục bài làm trước đó với {answeredCount} câu trả lời
              </p>
            </div>
          ) : null}

          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-6 lg:gap-8">
            <div className="min-w-0 space-y-5">
              {currentPartInfo ? (
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
                  <h2 className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#1e3a8a] m-0">
                    {currentPartInfo.partLabel}
                  </h2>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#3b82f6] mt-1 mb-0">
                    Câu {currentPartInfo.questionIndexInPart} / {currentPartInfo.totalInPart} trong
                    phần này
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[#F0EEE6] bg-[#FAF9F5] p-4 sm:p-6 shadow-[rgba(0,0,0,0.04)_0px_2px_12px]">
                <QuestionRenderer
                  question={currentQuestion}
                  studentAnswer={answers[currentQuestion.questionId]}
                  onAnswerChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:order-1"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                  Câu trước
                </button>

                <button
                  type="button"
                  onClick={() => handleFlagToggle(currentQuestion.questionId)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-[Be_Vietnam_Pro] text-[13px] font-medium transition-colors sm:order-2 ${
                    flags[currentQuestion.questionId]
                      ? 'border-amber-300 bg-amber-500 text-white hover:bg-amber-600'
                      : 'border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED]'
                  }`}
                >
                  <Flag className="w-4 h-4" aria-hidden />
                  {flags[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>

                <button
                  type="button"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:order-3 sm:ml-auto"
                >
                  Câu sau
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>

            <aside className="lg:w-[280px] shrink-0 space-y-4">
              <div className="rounded-2xl border border-[#E8E6DC] bg-white p-4 shadow-[rgba(0,0,0,0.04)_0px_2px_12px]">
                <QuestionNavigator
                  questions={attemptData.questions}
                  currentIndex={currentIndex}
                  answers={answers}
                  flags={flags}
                  onNavigate={setCurrentIndex}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saveAndExitMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" aria-hidden />
                  Lưu và thoát
                </button>

                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                >
                  Nộp bài
                </button>
              </div>
            </aside>
          </div>

          {showSubmitConfirm ? (
            <div className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-md flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="submit-confirm-title"
              >
                <div className="px-6 pt-6 pb-2">
                  <h3
                    id="submit-confirm-title"
                    className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
                  >
                    Xác nhận nộp bài
                  </h3>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2">
                    Bạn có chắc chắn muốn nộp bài không?
                  </p>
                </div>

                <div className="px-6 py-4">
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                    <div className="font-[Be_Vietnam_Pro] text-[13px] text-[#92400e]">
                      <p className="font-semibold m-0">
                        Đã trả lời: {answeredCount} / {totalQuestions} câu
                      </p>
                      {answeredCount < totalQuestions ? (
                        <p className="mt-2 mb-0 text-[12px] text-amber-800/90 leading-relaxed">
                          Bạn còn {totalQuestions - answeredCount} câu chưa trả lời
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-2 border-t border-[#F0EEE6]">
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                    onClick={() => setShowSubmitConfirm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Đang nộp...' : 'Xác nhận nộp bài'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
