import { Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionEditorSwitch } from '../../components/question';
import QuestionDiagram from '../../components/common/QuestionDiagram';
import MathText from '../../components/common/MathText';
import { LatexToolbar } from '../../components/common/LatexToolbar';
import { questionService } from '../../services/questionService';
import { useToast } from '../../context/ToastContext';
import type { QuestionType, QuestionDifficulty } from '../../types/question';
import './EnhancedQuestionFormModal.css';

function extractEditableLatex(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const latex = (value as { latex?: unknown }).latex;
    if (typeof latex === 'string') return latex;
  }
  return '';
}

interface EnhancedQuestionFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: {
    questionId?: string;
    questionText?: string;
    questionType?: QuestionType;
    difficulty?: QuestionDifficulty;
    points?: number;
    correctAnswer?: string;
    explanation?: string;
    tags?: string[];
    options?: Record<string, string>;
    generationMetadata?: Record<string, unknown>;
    diagramData?: unknown;
    diagramUrl?: string;
  };
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const selectCls =
  'w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]';

export function EnhancedQuestionFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: EnhancedQuestionFormModalProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.questionType || 'MULTIPLE_CHOICE'
  );
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(
    initialData?.difficulty || 'MEDIUM'
  );
  const [points, setPoints] = useState<string>(String(initialData?.points || 1));
  const [explanation, setExplanation] = useState<string>(initialData?.explanation || '');
  const [diagramData, setDiagramData] = useState<string>('');

  const [editorValue, setEditorValue] = useState<Record<string, unknown>>({
    questionText: initialData?.questionText || '',
    options: initialData?.options || {},
    correctAnswer: initialData?.correctAnswer || '',
    generationMetadata: initialData?.generationMetadata || {},
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const { showToast } = useToast();

  const previewQuestionText = String(editorValue.questionText || '').trim();
  const previewCorrectAnswer = String(editorValue.correctAnswer || '').trim();
  const previewExplanation = explanation.trim();
  const previewTypeLabel = questionTypeLabels[questionType];
  const previewOptions = (editorValue.options as Record<string, unknown>) || {};
  const previewOptionEntries = Object.entries(previewOptions).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );
  const hasDiagramPreview = Boolean(
    diagramData.trim() || initialData?.diagramData || initialData?.diagramUrl
  );

  const showAiEnhance =
    questionType === 'TRUE_FALSE' ||
    questionType === 'SHORT_ANSWER' ||
    questionType === 'MULTIPLE_CHOICE';

  const copyFallback = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }

    document.body.removeChild(textarea);
    return ok;
  };

  const handleInsertLatex = (rawLatex: string) => {
    const wrapped = `$${rawLatex}$`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(wrapped)
        .then(() => {
          showToast({
            message: `Đã sao chép: ${wrapped}. Dán vào vị trí con trỏ bằng Ctrl+V.`,
            type: 'success',
          });
        })
        .catch(() => {
          const ok = copyFallback(wrapped);
          showToast({
            message: ok
              ? `Đã sao chép: ${wrapped}. Dán vào vị trí con trỏ bằng Ctrl+V.`
              : 'Không thể sao chép tự động. Hãy thử lại.',
            type: ok ? 'success' : 'error',
          });
        });
      return;
    }

    const ok = copyFallback(wrapped);
    showToast({
      message: ok
        ? `Đã sao chép: ${wrapped}. Dán vào vị trí con trỏ bằng Ctrl+V.`
        : 'Không thể sao chép tự động. Hãy thử lại.',
      type: ok ? 'success' : 'error',
    });
  };

  useEffect(() => {
    if (isOpen && initialData) {
      setQuestionType(initialData.questionType || 'MULTIPLE_CHOICE');
      setDifficulty(initialData.difficulty || 'MEDIUM');
      setPoints(String(initialData.points || 1));
      setExplanation(initialData.explanation || '');
      setDiagramData(extractEditableLatex(initialData.diagramData));
      setEditorValue({
        questionText: initialData.questionText || '',
        options: initialData.options || {},
        correctAnswer: initialData.correctAnswer || '',
        generationMetadata: initialData.generationMetadata || {},
      });
    }
  }, [isOpen, initialData]);

  const handleAIEnhance = async () => {
    if (!editorValue.questionText || String(editorValue.questionText).trim() === '') {
      showToast({ message: 'Vui lòng nhập nội dung câu hỏi trước khi sử dụng AI', type: 'error' });
      return;
    }

    if (!editorValue.correctAnswer || String(editorValue.correctAnswer).trim() === '') {
      showToast({ message: 'Vui lòng nhập đáp án đúng trước khi sử dụng AI', type: 'error' });
      return;
    }

    setEnhancing(true);
    try {
      const response = await questionService.enhanceQuestionWithAI({
        rawQuestionText: String(editorValue.questionText),
        questionType: questionType,
        correctAnswer: String(editorValue.correctAnswer),
        rawOptions: editorValue.options as Record<string, string> | undefined,
        difficulty: difficulty,
      });

      const result = response.result;
      if (result && result.enhanced && result.valid) {
        setExplanation(result.explanation || '');

        if (questionType === 'TRUE_FALSE' || questionType === 'SHORT_ANSWER') {
          setEditorValue({
            ...editorValue,
            questionText: result.enhancedQuestionText || editorValue.questionText,
          });
        }

        showToast({ message: '✨ AI đã tạo lời giải thích và các bước giải!', type: 'success' });
      } else {
        showToast({ message: 'AI không thể tạo lời giải. Vui lòng thử lại.', type: 'warning' });
      }
    } catch (err) {
      console.error('AI enhancement error:', err);
      showToast({
        message: err instanceof Error ? err.message : 'Không thể kết nối với AI',
        type: 'error',
      });
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!editorValue.questionText || String(editorValue.questionText).trim() === '') {
      setError('Nội dung câu hỏi không được trống');
      return;
    }

    if (!editorValue.correctAnswer || String(editorValue.correctAnswer).trim() === '') {
      setError('Đáp án đúng không được trống');
      return;
    }

    const pointsNum = parseFloat(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      setError('Điểm phải là số dương');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...editorValue,
        questionType,
        difficulty,
        points: pointsNum,
        tags: initialData?.tags || [],
        explanation: explanation.trim() || undefined,
        diagramData: diagramData.trim() ? diagramData.trim() : undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-3 sm:p-5 bg-[rgba(20,20,19,0.48)] backdrop-blur-[3px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eqfm-title"
        className="flex flex-col w-full max-w-[min(1240px,calc(100vw-24px))] max-h-[min(92vh,920px)] rounded-2xl bg-white border border-[#E8E6DC] shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — cố định, không cuộn */}
        <div className="flex-shrink-0 px-5 py-4 sm:px-6 border-b border-[#F0EEE6] bg-[#FAF9F5] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="eqfm-title"
              className="font-[Playfair_Display] text-[19px] sm:text-[21px] font-medium text-[#141413] leading-tight"
            >
              {mode === 'create' ? 'Tạo câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
            </h2>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
              {mode === 'create'
                ? 'Chọn loại câu hỏi và điền thông tin'
                : 'Cập nhật thông tin câu hỏi'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex-shrink-0 w-10 h-10 rounded-xl border border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED] hover:text-[#141413] transition-colors inline-flex items-center justify-center"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body — chỉ khối này cuộn → scrollbar dính mép phải của modal, không “lệch gap” */}
        <div className="eqfm-modal-scroll eqfm-modal-bg flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-5 max-w-full">
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label className="block font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] mb-2 uppercase tracking-wide">
                Loại câu hỏi{' '}
                {mode === 'edit' && (
                  <span className="font-normal normal-case text-[#87867F]">(không thể thay đổi)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5 p-1 bg-[#F5F4ED] rounded-xl">
                {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] as QuestionType[]).map((type) => {
                  const active = questionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setQuestionType(type)}
                      disabled={mode === 'edit'}
                      className={`flex-1 min-w-[140px] px-3 py-2.5 rounded-lg font-[Be_Vietnam_Pro] text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? 'bg-white text-[#141413] shadow-sm ring-1 ring-[#E8E6DC]'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      } ${mode === 'edit' ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      {questionTypeLabels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E6DC] bg-white/90 p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <LatexToolbar onInsert={handleInsertLatex} disabled={saving} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              <div className="rounded-2xl border-2 border-[#E8E6DC] bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]">
                <QuestionEditorSwitch
                  type={questionType}
                  value={editorValue}
                  onChange={setEditorValue}
                  disabled={saving}
                />
              </div>

              <section className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-5 min-h-[120px] flex flex-col gap-2">
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                  Xem trước câu hỏi
                </p>
                <span className="inline-flex self-start px-2 py-0.5 rounded-full bg-[#EEF2FF] font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#4F7EF7]">
                  {previewTypeLabel}
                </span>
                <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#141413] leading-relaxed eqfm-preview-question min-h-[2.5rem]">
                  <MathText text={previewQuestionText || 'Chưa có nội dung câu hỏi.'} />
                </div>

                {previewOptionEntries.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-[#F0EEE6]">
                    <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] mb-2">
                      Lựa chọn
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 font-[Be_Vietnam_Pro] text-[13px] text-[#374151]">
                      {previewOptionEntries.map(([key, value], index) => (
                        <li key={`preview-option-${key}`}>
                          <strong className="text-[#141413]">
                            {(key || String.fromCharCode(65 + index)).toUpperCase()}.
                          </strong>{' '}
                          <MathText text={String(value)} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <p className="mt-auto pt-3 border-t border-[#F0EEE6] font-[Be_Vietnam_Pro] text-[13px]">
                  <span className="text-[#87867F] font-medium">Đáp án:</span>{' '}
                  <span className="text-[#141413] font-semibold">
                    {previewCorrectAnswer || 'Chưa có đáp án'}
                  </span>
                </p>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              <div className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-5">
                <label className="block font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] mb-2">
                  Hình vẽ <span className="text-red-500 font-normal">*</span>
                </label>
                <textarea
                  className={`${selectCls} resize-y min-h-[140px] font-mono text-[13px]`}
                  value={diagramData}
                  onChange={(e) => setDiagramData(e.target.value)}
                  disabled={saving}
                  placeholder="Nhập LaTeX cho hình vẽ nếu có... Ví dụ: \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
                  rows={6}
                />
              </div>

              <section className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-5 min-h-[140px]">
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F] mb-2">
                  Xem trước hình
                </p>
                {hasDiagramPreview ? (
                  <QuestionDiagram
                    source={{
                      diagramData: diagramData.trim() ? diagramData.trim() : initialData?.diagramData,
                      diagramUrl: initialData?.diagramUrl,
                    }}
                  />
                ) : (
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] m-0">Chưa có hình minh họa.</p>
                )}
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              <div className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-5">
                <label className="block font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] mb-2">
                  Giải thích <span className="text-red-500 font-normal">*</span>
                </label>
                <textarea
                  className={`${selectCls} resize-y min-h-[120px]`}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  disabled={saving}
                  placeholder="Nhập lời giải thích cho câu hỏi..."
                  rows={5}
                />
              </div>

              <section className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-5 min-h-[120px]">
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F] mb-2">
                  Xem trước giải thích
                </p>
                {previewExplanation ? (
                  <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#374151] leading-relaxed">
                    <MathText text={previewExplanation} />
                  </div>
                ) : (
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] m-0">
                    Chưa có nội dung giải thích.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Footer: AI thấp hơn (tách khối), nút Hủy / Lưu nổi bật */}
        <div className="flex-shrink-0 border-t border-[#E8E6DC] bg-white">
          {showAiEnhance && (
            <div className="px-4 sm:px-6 pt-5 pb-5 bg-gradient-to-b from-[#FAF9F5] to-[#F5F4ED] border-b border-[#E8E6DC]/90 flex justify-center">
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={enhancing || saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7c3aed] text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:bg-[#6d28d9] hover:brightness-[1.02] disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                {enhancing ? 'Đang tạo lời giải...' : '✨ Tạo lời giải bằng AI'}
              </button>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-4 sm:px-6 py-4 sm:py-5 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto min-w-[132px] px-5 py-3 rounded-xl border-2 border-[#141413] bg-white font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] hover:bg-[#FAF9F5] disabled:opacity-45 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto min-w-[156px] px-6 py-3 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[14px] font-bold shadow-[0_6px_22px_rgba(201,100,66,0.38)] hover:brightness-[1.03] active:scale-[0.98] disabled:opacity-45 disabled:shadow-none transition-all duration-150"
            >
              {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo câu hỏi' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
