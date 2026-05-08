import { Sparkles } from 'lucide-react';
import ModalCloseButton from '../../components/common/ModalCloseButton';
import { useEffect, useState } from 'react';
import {
  CognitiveLevel,
  QuestionType,
  type BlueprintFromRealQuestionRequest,
  type BlueprintFromRealQuestionResponse,
} from '../../types/questionTemplate';
import { useBlueprintFromRealQuestion } from '../../hooks/useQuestionTemplate';
import { useToast } from '../../context/ToastContext';
import { QuestionTemplateApiError } from '../../services/questionTemplateService';

const NO_TOKEN_TOAST =
  'Bạn đã hết lượt sử dụng AI. Vui lòng liên hệ quản trị viên để nạp thêm.';
import { TypeSelector } from '../../components/question-templates/TypeSelector';
import { AcademicCascade } from '../../components/common/AcademicCascade';
import MathText from '../../components/common/MathText';
import { LatexToolbar } from '../../components/common/LatexToolbar';

/**
 * Method 1 entry form. The teacher writes a complete, real-valued question — no
 * placeholders. On submit we call POST /question-templates/blueprint-from-real-question;
 * the response is handed up to the parent which renders the Blueprint Confirm modal.
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBlueprintReady: (
    request: BlueprintFromRealQuestionRequest,
    response: BlueprintFromRealQuestionResponse
  ) => void;
};

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

const STEP_LABELS = ['Thông tin chung', 'Đề bài', 'Phương án', 'Lời giải & xem trước'];

function FormStepper({
  current,
  onJump,
}: Readonly<{ current: 1 | 2 | 3 | 4; onJump: (step: 1 | 2 | 3 | 4) => void }>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
        const isActive = stepNum === current;
        const isPast = stepNum < current;
        const clickable = isPast;
        return (
          <button
            key={label}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onJump(stepNum)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: isActive ? '2px solid #6366f1' : '1px solid #e5e7eb',
              background: isActive ? '#eef2ff' : isPast ? '#f8fafc' : '#ffffff',
              cursor: clickable ? 'pointer' : 'default',
              textAlign: 'left',
              opacity: !isActive && !isPast ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>Bước {stepNum}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{label}</div>
          </button>
        );
      })}
    </div>
  );
}

export function RealQuestionForm({ isOpen, onClose, onBlueprintReady }: Readonly<Props>) {
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.THONG_HIEU);
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');
  const [diagramLatex, setDiagramLatex] = useState('');
  const [options, setOptions] = useState([
    { key: 'A', text: '', isCorrect: true },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ]);
  const [clauses, setClauses] = useState([
    { key: 'A', text: '', truthValue: true },
    { key: 'B', text: '', truthValue: false },
    { key: 'C', text: '', truthValue: true },
    { key: 'D', text: '', truthValue: false },
  ]);
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [lastFocusedInput, setLastFocusedInput] = useState<
    HTMLInputElement | HTMLTextAreaElement | null
  >(null);

  const blueprintMutation = useBlueprintFromRealQuestion();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setError(null);
    }
  }, [isOpen]);

  // Track the last focused input/textarea so the LaTeX toolbar knows where to insert.
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setLastFocusedInput(e.target);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  function insertLatexAtCursor(latex: string) {
    if (!lastFocusedInput) {
      setError('Vui lòng chọn một ô nhập liệu trước khi chèn công thức.');
      return;
    }
    const wrapped = `$${latex}$`;
    const start = lastFocusedInput.selectionStart ?? 0;
    const end = lastFocusedInput.selectionEnd ?? 0;
    const text = lastFocusedInput.value;
    const newText = text.substring(0, start) + wrapped + text.substring(end);

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (lastFocusedInput instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(lastFocusedInput, newText);
    } else if (lastFocusedInput instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(lastFocusedInput, newText);
    }

    lastFocusedInput.dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      lastFocusedInput.focus();
      const newPosition = start + wrapped.length;
      lastFocusedInput.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  if (!isOpen) return null;

  function updateClause(index: number, field: 'text' | 'truthValue', value: string | boolean) {
    setClauses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function markOptionCorrect(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  function validateStep2(): string | null {
    if (!questionText.trim()) return 'Vui lòng nhập đề bài.';
    return null;
  }

  function validateStep3(): string | null {
    if (questionType === QuestionType.MULTIPLE_CHOICE) {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return 'Câu trắc nghiệm cần ít nhất 2 đáp án.';
      const correct = options.find((o) => o.isCorrect);
      if (!correct) return 'Vui lòng đánh dấu một phương án là đáp án đúng.';
      if (!correct.text.trim())
        return `Phương án ${correct.key} được đánh dấu đáp án đúng nhưng chưa có nội dung.`;
      return null;
    }
    if (questionType === QuestionType.TRUE_FALSE) {
      if (clauses.some((c) => !c.text.trim())) return 'Mọi mệnh đề phải có nội dung.';
      const trueCount = clauses.filter((c) => c.truthValue).length;
      const falseCount = clauses.filter((c) => !c.truthValue).length;
      if (trueCount === 0 || falseCount === 0)
        return 'Phải có ít nhất 1 mệnh đề đúng và 1 mệnh đề sai.';
      return null;
    }
    return null;
  }

  function goNext() {
    let err: string | null = null;
    if (currentStep === 2) err = validateStep2();
    else if (currentStep === 3) err = validateStep3();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setCurrentStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  }

  function goBack() {
    setError(null);
    setCurrentStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));
  }

  function jumpTo(step: 1 | 2 | 3 | 4) {
    if (step >= currentStep) return;
    setError(null);
    setCurrentStep(step);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    for (const [step, gate] of [
      [2, validateStep2],
      [3, validateStep3],
    ] as const) {
      const err = gate();
      if (err) {
        setError(err);
        setCurrentStep(step as 2 | 3);
        return;
      }
    }

    const request: BlueprintFromRealQuestionRequest = {
      questionType,
      questionText: questionText.trim(),
      correctAnswer: correctAnswer.trim() || undefined,
      solutionSteps: solutionSteps.trim() || undefined,
      diagramLatex: diagramLatex.trim() || undefined,
      cognitiveLevel,
      gradeLevel: gradeLevel || undefined,
      subjectId: subjectId || undefined,
      chapterId: chapterId || undefined,
    };

    if (questionType === QuestionType.MULTIPLE_CHOICE) {
      const filled = options.filter((o) => o.text.trim());
      const correct = filled.find((o) => o.isCorrect)!;
      request.options = Object.fromEntries(filled.map((o) => [o.key, o.text.trim()]));
      request.correctAnswer = correct.text.trim();
    } else if (questionType === QuestionType.TRUE_FALSE) {
      const map: Record<string, { text: string; truthValue: boolean }> = {};
      for (const c of clauses) {
        map[c.key] = { text: c.text.trim(), truthValue: c.truthValue };
      }
      request.clauses = map;
    }

    try {
      const res = await blueprintMutation.mutateAsync(request);
      const blueprint = res.result;
      if (!blueprint) {
        setError('AI không trả về Blueprint. Vui lòng thử lại.');
        return;
      }
      onBlueprintReady(request, blueprint);
    } catch (err) {
      // Out-of-tokens / no-subscription errors get a toast, no inline error
      // (per spec). Other errors keep the inline message.
      if (
        err instanceof QuestionTemplateApiError &&
        (err.code === 1167 || err.code === 1166)
      ) {
        showToast({ type: 'error', message: NO_TOKEN_TOAST });
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi khi gọi AI.');
    }
  }

  const isLoading = blueprintMutation.isPending;
  const correctOption = options.find((o) => o.isCorrect);

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(960px, 96vw)' }}>
        <div className="modal-header">
          <div className="modal-title-block">
            <div className="modal-title-row">
              <span className="modal-icon-badge">
                <Sparkles size={16} />
              </span>
              <h3>Viết câu hỏi thật — AI sẽ tự tạo mẫu câu hỏi</h3>
            </div>
            <p className="modal-subtitle">
              Bạn dùng <em>câu hỏi thật</em>, không cần biến số. Sau khi lưu, AI sẽ gợi ý các
              biến số và ràng buộc cho bạn tạo mẫu câu hỏi.
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
            <FormStepper current={currentStep} onJump={jumpTo} />

            {/* STEP 1: Thông tin chung */}
            {currentStep === 1 && (
              <>
                <TypeSelector selectedType={questionType} onChange={setQuestionType} />

                <AcademicCascade
                  gradeLevel={gradeLevel}
                  subjectId={subjectId}
                  chapterId={chapterId}
                  onGradeChange={setGradeLevel}
                  onSubjectChange={setSubjectId}
                  onChapterChange={setChapterId}
                  required={false}
                />

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Mức độ câu hỏi
                  </p>
                  <select
                    className="select"
                    value={cognitiveLevel}
                    onChange={(e) => setCognitiveLevel(e.target.value as CognitiveLevel)}
                  >
                    {Object.entries(cognitiveLevelLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {/* STEP 2: Đề bài */}
            {currentStep === 2 && (
              <>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Đề bài (số thật, không cần biến số){' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </p>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Ví dụ: Giải phương trình 2x + 5 = 0"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                  {questionText && (
                    <div className="preview-box">
                      <MathText text={questionText} />
                    </div>
                  )}
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Sơ đồ / Hình LaTeX (tùy chọn)
                  </p>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={diagramLatex}
                    onChange={(e) => setDiagramLatex(e.target.value)}
                  />
                </label>
              </>
            )}

            {/* STEP 3: Phương án */}
            {currentStep === 3 && questionType === QuestionType.MULTIPLE_CHOICE && (
              <section className="data-card" style={{ minHeight: 0 }}>
                <h4 style={{ margin: 0, color: '#92400e' }}>Đáp án A / B / C / D</h4>
                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>
                  Nhập <em>giá trị thật</em> cho từng đáp án và chọn ô bên trái để đánh dấu đáp án
                  đúng. Bỏ trống nếu chỉ dùng 2-3 phương án.
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {options.map((opt, i) => (
                    <label
                      key={opt.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto auto 1fr',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 10px',
                        border: opt.isCorrect ? '1px solid #10b981' : '1px solid #e5e7eb',
                        background: opt.isCorrect ? '#ecfdf5' : '#fff',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="mcq-correct"
                        checked={opt.isCorrect}
                        onChange={() => markOptionCorrect(i)}
                        title="Đánh dấu là đáp án đúng"
                      />
                      <strong
                        style={{ width: 16, color: opt.isCorrect ? '#047857' : '#475569' }}
                      >
                        {opt.key}
                      </strong>
                      <input
                        className="input"
                        placeholder={`Nội dung phương án ${opt.key}`}
                        value={opt.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>
            )}

            {currentStep === 3 && questionType === QuestionType.TRUE_FALSE && (
              <section className="data-card" style={{ minHeight: 0 }}>
                <h4 style={{ margin: 0, color: '#1e40af' }}>Mệnh đề Đúng/Sai (4 mệnh đề)</h4>
                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>
                  Mỗi mệnh đề ghi <em>giá trị thật</em>; AI sẽ chuyển thành placeholder. Phải có
                  ít nhất 1 mệnh đề Đúng và 1 mệnh đề Sai.
                </p>
                {clauses.map((c, i) => (
                  <div
                    key={c.key}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 10,
                      background: '#fff',
                    }}
                  >
                    <div className="row" style={{ alignItems: 'center', gap: 10 }}>
                      <strong style={{ color: '#1e40af' }}>Mệnh đề {c.key}</strong>
                      <div className="row" style={{ gap: 6, marginLeft: 'auto' }}>
                        <button
                          type="button"
                          className={`btn ${c.truthValue ? '' : 'secondary'}`}
                          onClick={() => updateClause(i, 'truthValue', true)}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          className={`btn ${!c.truthValue ? '' : 'secondary'}`}
                          onClick={() => updateClause(i, 'truthValue', false)}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="textarea"
                      rows={2}
                      placeholder="Nội dung mệnh đề (số thật)"
                      value={c.text}
                      onChange={(e) => updateClause(i, 'text', e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                ))}
              </section>
            )}

            {currentStep === 3 && questionType === QuestionType.SHORT_ANSWER && (
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Đáp án đúng (số thật)
                </p>
                <input
                  className="input"
                  placeholder="Ví dụ: x = -2.5"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
                <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                  Tùy chọn — nếu để trống, AI sẽ cố gắng suy luận từ đề bài và lời giải.
                </p>
              </label>
            )}

            {/* STEP 4: Lời giải & xem trước */}
            {currentStep === 4 && (
              <>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Lời giải mẫu
                  </p>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Ví dụ: Bước 1: Chuyển 5 sang vế phải → 2x = -5. Bước 2: Chia hai vế cho 2 → x = -2.5."
                    value={solutionSteps}
                    onChange={(e) => setSolutionSteps(e.target.value)}
                  />
                  {solutionSteps && (
                    <div className="preview-box">
                      <MathText text={solutionSteps} />
                    </div>
                  )}
                </label>

                <section
                  className="data-card"
                  style={{ minHeight: 0, border: '1px solid #c7d2fe', background: '#eef2ff' }}
                >
                  <h3 style={{ color: '#3730a3', marginTop: 0 }}>Xem trước câu hỏi</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                    Đây là nội dung sẽ được gửi cho AI để phân tích và tạo Blueprint.
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Đề bài:</strong>
                    <div className="preview-box">
                      <MathText text={questionText} />
                    </div>
                  </div>

                  {questionType === QuestionType.MULTIPLE_CHOICE && (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {options
                        .filter((o) => o.text.trim())
                        .map((o) => (
                          <div
                            key={o.key}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr',
                              gap: 8,
                              alignItems: 'center',
                              padding: '6px 10px',
                              border: o.isCorrect ? '1px solid #10b981' : '1px solid #e5e7eb',
                              background: o.isCorrect ? '#ecfdf5' : '#fff',
                              borderRadius: 8,
                            }}
                          >
                            <strong style={{ color: o.isCorrect ? '#047857' : '#475569' }}>
                              {o.key}.
                            </strong>
                            <MathText text={o.text} />
                          </div>
                        ))}
                    </div>
                  )}

                  {questionType === QuestionType.TRUE_FALSE && (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {clauses.map((c) => (
                        <div
                          key={c.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: 10,
                            alignItems: 'center',
                            padding: '8px 12px',
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            borderRadius: 8,
                          }}
                        >
                          <strong style={{ color: '#1e40af' }}>{c.key}.</strong>
                          <MathText text={c.text} />
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 999,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              background: c.truthValue ? '#ecfdf5' : '#fef2f2',
                              color: c.truthValue ? '#047857' : '#b91c1c',
                            }}
                          >
                            {c.truthValue ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionType === QuestionType.SHORT_ANSWER && (
                    <div
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #10b981',
                        background: '#ecfdf5',
                        borderRadius: 8,
                      }}
                    >
                      <strong style={{ color: '#047857' }}>Đáp án đúng:</strong>
                      <div style={{ marginTop: 4 }}>
                        {correctAnswer.trim() ? (
                          <MathText text={correctAnswer} />
                        ) : (
                          <em className="muted">(AI sẽ suy luận)</em>
                        )}
                      </div>
                    </div>
                  )}

                  {questionType === QuestionType.MULTIPLE_CHOICE && correctOption && (
                    <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#475569' }}>
                      <strong>Đáp án đúng:</strong> {correctOption.key}
                    </div>
                  )}

                  {diagramLatex.trim() && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Sơ đồ:</strong>
                      <div className="preview-box">
                        <MathText text={diagramLatex} />
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {error && (
              <div className="empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}

            {/* Sticky LaTeX toolbar — same pattern as TemplateFormModal so it stays
             * reachable while the teacher edits any field on any step. */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                marginTop: 12,
                marginInline: 'calc(-1 * var(--modal-body-pad, 1rem))',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '0.55rem 1rem',
                boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.05)',
                zIndex: 4,
              }}
            >
              <LatexToolbar onInsert={insertLatexAtCursor} disabled={isLoading} />
            </div>
          </div>

          <div className="modal-footer">
            {currentStep === 1 ? (
              <button type="button" className="btn secondary" onClick={onClose}>
                Hủy
              </button>
            ) : (
              <button type="button" className="btn secondary" onClick={goBack} disabled={isLoading}>
                ← Quay lại
              </button>
            )}
            {currentStep < 4 ? (
              <button type="button" className="btn" onClick={goNext}>
                Tiếp tục →
              </button>
            ) : (
              <button type="submit" className="btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/35 border-t-white animate-spin mr-2 align-middle shrink-0"
                      aria-hidden
                    />
                    AI đang phân tích…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} style={{ marginRight: 6 }} />
                    Phân tích &amp; tạo Blueprint
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
