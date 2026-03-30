import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, Flag, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import QuestionDisplay from '../../components/assessment/QuestionDisplay';
import QuestionNavigator from '../../components/assessment/QuestionNavigator';
import Timer from '../../components/assessment/Timer';
import {
  useFinishRoadmapEntryTest,
  useRoadmapEntryTest,
  useRoadmapEntryTestActiveAttempt,
  useRoadmapEntryTestSnapshot,
  useSaveAndExitRoadmapEntryTest,
  useStartRoadmapEntryTest,
  useUpdateRoadmapEntryTestAnswer,
  useUpdateRoadmapEntryTestFlag,
} from '../../hooks/useRoadmaps';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';
import type { RoadmapEntryTestAttemptStartResponse } from '../../types';
import '../../styles/module-refactor.css';

function toAttemptQuestions(data: RoadmapEntryTestAttemptStartResponse | null): AttemptQuestionResponse[] {
  if (!data) return [];
  return data.questions.map((q) => ({
    questionId: q.questionId,
    orderIndex: q.orderIndex,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    points: q.points,
  }));
}

export default function TakeRoadmapEntryTest() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<RoadmapEntryTestAttemptStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | Record<string, unknown>>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [entryTestError, setEntryTestError] = useState<string | null>(null);
  const sequenceRef = useRef(0);

  const entryInfoQuery = useRoadmapEntryTest(roadmapId);
  const activeAttemptQuery = useRoadmapEntryTestActiveAttempt(roadmapId);
  const startMutation = useStartRoadmapEntryTest();
  const updateAnswerMutation = useUpdateRoadmapEntryTestAnswer();
  const updateFlagMutation = useUpdateRoadmapEntryTestFlag();
  const saveAndExitMutation = useSaveAndExitRoadmapEntryTest();
  const finishMutation = useFinishRoadmapEntryTest();

  const activeAttemptId =
    activeAttemptQuery.data?.result.attemptId ??
    entryInfoQuery.data?.result.activeAttemptId ??
    attemptData?.attemptId ??
    '';

  const snapshotQuery = useRoadmapEntryTestSnapshot(roadmapId, activeAttemptId);

  useEffect(() => {
    if (!roadmapId) return;
    startMutation.mutate(
      { roadmapId },
      {
        onSuccess: (response) => {
          setAttemptData(response.result);
          setEntryTestError(null);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Không thể bắt đầu bài test đầu vào';
          setEntryTestError(message);
        },
      }
    );
  }, [roadmapId]);

  useEffect(() => {
    if (!snapshotQuery.data?.result) return;
    setAnswers(snapshotQuery.data.result.answers ?? {});
    setFlags(snapshotQuery.data.result.flags ?? {});
  }, [snapshotQuery.data]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnswerChange = useCallback(
    (questionId: string, value: string | Record<string, unknown>) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));

      if (!attemptData?.attemptId || !roadmapId) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        updateAnswerMutation.mutate(
          {
            roadmapId,
            attemptId: attemptData.attemptId,
            payload: {
              questionId,
              answerValue: value,
              clientTimestamp: new Date().toISOString(),
              sequenceNumber: ++sequenceRef.current,
            },
          },
          {
            onSuccess: () => {
              setLastSaved(new Date());
            },
          }
        );
      }, 600);
    },
    [attemptData, roadmapId, updateAnswerMutation]
  );

  const handleFlagToggle = useCallback(
    (questionId: string) => {
      const flagged = !flags[questionId];
      setFlags((prev) => ({ ...prev, [questionId]: flagged }));

      if (!attemptData?.attemptId || !roadmapId) return;

      updateFlagMutation.mutate({
        roadmapId,
        attemptId: attemptData.attemptId,
        payload: { questionId, flagged },
      });
    },
    [attemptData, flags, roadmapId, updateFlagMutation]
  );

  const handleSaveAndExit = useCallback(() => {
    if (!roadmapId || !attemptData?.attemptId) return;
    saveAndExitMutation.mutate(
      { roadmapId, attemptId: attemptData.attemptId },
      {
        onSuccess: () => {
          navigate(`/roadmaps/${roadmapId}`);
        },
      }
    );
  }, [attemptData, navigate, roadmapId, saveAndExitMutation]);

  const handleSubmit = useCallback(() => {
    if (!roadmapId || !attemptData?.attemptId) return;
    finishMutation.mutate(
      { roadmapId, attemptId: attemptData.attemptId },
      {
        onSuccess: () => {
          navigate(`/roadmaps/${roadmapId}`);
        },
      }
    );
  }, [attemptData, finishMutation, navigate, roadmapId]);

  const questions = toAttemptQuestions(attemptData);
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((key) => {
    const value = answers[key];
    return value !== undefined && value !== '';
  }).length;

  if (startMutation.isPending || entryInfoQuery.isLoading || activeAttemptQuery.isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Đang khởi tạo bài test đầu vào...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (entryTestError || !attemptData || !currentQuestion) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">{entryTestError || 'Không thể tải bài test đầu vào'}</div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
              <button className="btn secondary" onClick={() => navigate(`/roadmaps/${roadmapId}`)}>
                Quay lại roadmap
              </button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
      <div className="module-layout-container">
        <section className="module-page" style={{ maxWidth: '100%' }}>
          <header className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
            <div>
              <h2>{entryInfoQuery.data?.result.title || attemptData.instructions || 'Roadmap entry test'}</h2>
              <p className="muted">
                Câu {currentIndex + 1} / {questions.length} • Đã trả lời: {answeredCount}
              </p>
            </div>
            <div className="row" style={{ gap: 16 }}>
              {lastSaved && (
                <span className="muted" style={{ fontSize: '0.875rem' }}>
                  <Save size={14} style={{ marginRight: 4 }} />
                  Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                </span>
              )}
              {attemptData.expiresAt && <Timer expiresAt={attemptData.expiresAt} onExpire={handleSubmit} />}
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginTop: 24 }}>
            <div>
              <QuestionDisplay
                question={currentQuestion}
                answer={answers[currentQuestion.questionId]}
                onAnswerChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
              />

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
                    backgroundColor: flags[currentQuestion.questionId] ? 'var(--warning-color)' : undefined,
                    color: flags[currentQuestion.questionId] ? 'white' : undefined,
                  }}
                >
                  <Flag size={14} />
                  {flags[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>

                <button
                  className="btn secondary"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  Câu sau
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div>
              <QuestionNavigator
                questions={questions}
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

                <button className="btn" style={{ width: '100%' }} onClick={() => setShowSubmitConfirm(true)}>
                  Nộp bài
                </button>
              </div>
            </div>
          </div>

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
                  <div className="row" style={{ gap: 8, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <AlertCircle size={16} style={{ color: 'var(--warning-color)' }} />
                    <div>
                      <p>Đã trả lời: {answeredCount} / {questions.length} câu</p>
                      {answeredCount < questions.length && (
                        <p className="muted" style={{ marginTop: 4, fontSize: '0.875rem' }}>
                          Bạn còn {questions.length - answeredCount} câu chưa trả lời
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn secondary" onClick={() => setShowSubmitConfirm(false)}>
                    Hủy
                  </button>
                  <button className="btn" onClick={handleSubmit} disabled={finishMutation.isPending}>
                    {finishMutation.isPending ? 'Đang nộp...' : 'Xác nhận nộp bài'}
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
