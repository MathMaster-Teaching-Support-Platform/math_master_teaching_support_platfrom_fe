import { ArrowLeft, Check, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import QuestionDiagram from '../../components/common/QuestionDiagram';
import { TrueFalseAnswerSummary } from '../../components/question/TrueFalseAnswerSummary';
import { extractOptionText } from '../../utils/optionText';
import {
  useApproveQuestion,
  useBulkApproveQuestions,
  useBulkRejectQuestions,
  useReviewQueue,
} from '../../hooks/useQuestionTemplate';
import { useToast } from '../../context/ToastContext';
import type { ReviewQuestionResponse } from '../../types/questionTemplate';

// Per-template review screen. Reached only with a `templateId` query param —
// there is no global pending queue. Without a template the page redirects to
// the template list so the teacher picks one to review.
export function QuestionReviewQueue() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') ?? undefined;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState('');

  const queueEnabled = !!templateId;
  const { data, isLoading, isError, error, refetch } = useReviewQueue(templateId, page, 20);
  const approveOne = useApproveQuestion();
  const bulkApprove = useBulkApproveQuestions();
  const bulkReject = useBulkRejectQuestions();

  const items = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  useEffect(() => {
    setSelected(new Set());
  }, [templateId, page]);

  if (!queueEnabled) {
    return <Navigate to="/teacher/question-templates" replace />;
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(items.map((q) => q.id)));
  }
  function clearAll() {
    setSelected(new Set());
  }

  async function approve(id: string) {
    try {
      await approveOne.mutateAsync(id);
      showToast({ type: 'success', message: 'Đã duyệt câu hỏi.' });
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không thể duyệt câu hỏi.',
      });
    }
  }

  async function approveSelected() {
    if (selected.size === 0) return;
    try {
      await bulkApprove.mutateAsync(Array.from(selected));
      showToast({ type: 'success', message: `Đã duyệt ${selected.size} câu hỏi.` });
      clearAll();
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không thể duyệt các câu hỏi đã chọn.',
      });
    }
  }

  async function rejectSelected() {
    if (selected.size === 0) return;
    try {
      await bulkReject.mutateAsync({
        questionIds: Array.from(selected),
        reason: rejectReason.trim() || undefined,
      });
      showToast({ type: 'success', message: `Đã từ chối ${selected.size} câu hỏi.` });
      setRejectReason('');
      clearAll();
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không thể từ chối các câu hỏi đã chọn.',
      });
    }
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page" style={{ padding: '1.25rem' }}>
          <header className="page-header" style={{ marginBottom: '1rem' }}>
            <div className="header-stack">
              <button
                type="button"
                className="btn secondary btn-sm"
                onClick={() => navigate('/teacher/question-templates')}
                style={{ alignSelf: 'flex-start', marginBottom: 8 }}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2>Duyệt câu hỏi</h2>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={() => void refetch()}>
                <RefreshCw size={14} />
                Làm mới
              </button>
            </div>
          </header>

          {isLoading && <div className="empty">Đang tải…</div>}
          {isError && (
            <div className="empty" style={{ color: '#b91c1c' }}>
              Lỗi: {error instanceof Error ? error.message : 'không xác định'}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="empty">Không có câu hỏi nào đang chờ duyệt.</div>
          )}

          {items.length > 0 && (
            <>
              <div
                className="row"
                style={{
                  gap: 8,
                  alignItems: 'center',
                  margin: '8px 0 14px',
                  flexWrap: 'wrap',
                }}
              >
                <button className="btn secondary" onClick={selectAll}>
                  Chọn tất cả
                </button>
                <button className="btn secondary" onClick={clearAll}>
                  Bỏ chọn
                </button>
                <span className="muted">Đã chọn {selected.size}</span>
                <input
                  className="input"
                  placeholder="Lý do từ chối (không bắt buộc)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ flex: 1, minWidth: 240 }}
                />
                <button
                  className="btn btn--feat-emerald"
                  disabled={selected.size === 0 || bulkApprove.isPending}
                  onClick={approveSelected}
                >
                  <Check size={14} />
                  Duyệt {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
                <button
                  className="btn danger"
                  disabled={selected.size === 0 || bulkReject.isPending}
                  onClick={rejectSelected}
                >
                  <X size={14} />
                  Từ chối {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {items.map((q: ReviewQuestionResponse) => {
                  const isTrueFalse = q.questionType === 'TRUE_FALSE';
                  return (
                    <div
                      key={q.id}
                      className="data-card"
                      style={{
                        minHeight: 0,
                        padding: '0.9rem 1rem',
                        borderColor: selected.has(q.id) ? '#a78bfa' : undefined,
                      }}
                    >
                      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggle(q.id)}
                          style={{ marginTop: 6 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="row"
                            style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                          >
                            <span className="badge draft" style={{ fontSize: '0.7rem' }}>
                              {q.questionType}
                            </span>
                            <span className="badge draft" style={{ fontSize: '0.7rem' }}>
                              {q.questionStatus}
                            </span>
                            <span className="muted" style={{ fontSize: '0.75rem' }}>
                              {new Date(q.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="preview-box" style={{ marginTop: 8 }}>
                            <MathText text={q.questionText} />
                          </div>
                          <QuestionDiagram
                            source={{
                              diagramData: q.diagramData,
                              diagramUrl: q.diagramUrl,
                            }}
                          />
                          {!isTrueFalse && q.options && Object.keys(q.options).length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              {Object.entries(q.options).map(([key, val]) => (
                                <div key={key} style={{ marginTop: 4 }}>
                                  <strong>{key}.</strong>{' '}
                                  <MathText text={extractOptionText(val)} />
                                </div>
                              ))}
                            </div>
                          )}
                          {isTrueFalse ? (
                            <div style={{ marginTop: 10 }}>
                              <TrueFalseAnswerSummary
                                answer={q.correctAnswer}
                                clauses={q.options}
                              />
                            </div>
                          ) : (
                            q.correctAnswer && (
                              <div style={{ marginTop: 8 }}>
                                <span className="muted">Đáp án đúng:</span>{' '}
                                <strong>
                                  <MathText text={q.correctAnswer} />
                                </strong>
                              </div>
                            )
                          )}
                          {q.explanation && (
                            <div className="muted" style={{ marginTop: 8 }}>
                              <em>
                                <MathText text={q.explanation} />
                              </em>
                            </div>
                          )}
                        </div>
                        <div className="row" style={{ flexDirection: 'column', gap: 6 }}>
                          <button
                            className="btn btn--feat-emerald"
                            disabled={approveOne.isPending}
                            onClick={() => void approve(q.id)}
                          >
                            <Check size={14} />
                            Duyệt
                          </button>
                          <button
                            className="btn danger"
                            disabled={bulkReject.isPending}
                            onClick={() =>
                              void bulkReject
                                .mutateAsync({
                                  questionIds: [q.id],
                                  reason: rejectReason.trim() || undefined,
                                })
                                .then(() =>
                                  showToast({
                                    type: 'success',
                                    message: 'Đã từ chối câu hỏi.',
                                  })
                                )
                                .catch((err) =>
                                  showToast({
                                    type: 'error',
                                    message:
                                      err instanceof Error
                                        ? err.message
                                        : 'Không thể từ chối câu hỏi.',
                                  })
                                )
                            }
                          >
                            <X size={14} />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={20}
                onChange={setPage}
              />
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default QuestionReviewQueue;
