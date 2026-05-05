import { X, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { QuestionEditorSwitch } from '../../components/question';
import QuestionDiagram from '../../components/common/QuestionDiagram';
import MathText from '../../components/common/MathText';
import { LatexToolbar } from '../../components/common/LatexToolbar';
import { questionService } from '../../services/questionService';
import { useToast } from '../../context/ToastContext';
import type { QuestionType, QuestionDifficulty } from '../../types/question';

// Pull a single editable LaTeX string out of the shapes BE may return for
// diagramData. Complex non-string shapes that can't be reduced to one latex
// field are surfaced as "" — we keep the original object on submit only if the
// teacher edits the field, otherwise the existing structured value is kept.
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

  const diagramTextareaRef = useRef<HTMLTextAreaElement>(null);

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
  const previewTypeLabel = questionTypeLabels[questionType];
  const previewOptions = (editorValue.options as Record<string, unknown>) || {};
  const previewOptionEntries = Object.entries(previewOptions).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );
  const hasDiagramPreview = Boolean(
    diagramData.trim() || initialData?.diagramData || initialData?.diagramUrl
  );

  const insertLatexAtCursor = (latex: string) => {
    const textarea = diagramTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = diagramData;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + latex + after;
    setDiagramData(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + latex.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
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
    // Validation
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
        // Update form with AI-generated content
        setExplanation(result.explanation || '');

        // For TF and SA, also update the question text if enhanced
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

    // Validation
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

  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div
        className="modal-card"
        style={{ width: 'min(1240px, 96vw)', maxHeight: '92vh', overflow: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>
              {mode === 'create' ? 'Tạo câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
            </h3>
            <p className="muted" style={{ marginTop: 4, fontSize: '0.875rem' }}>
              {mode === 'create'
                ? 'Chọn loại câu hỏi và điền thông tin'
                : 'Cập nhật thông tin câu hỏi'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body eqfm-layout">
          <div className="eqfm-form-column">
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecdd3',
                  borderRadius: 8,
                  color: '#991b1b',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}
              >
                Loại câu hỏi{' '}
                {mode === 'edit' && (
                  <span style={{ color: '#6b7280', fontWeight: 400 }}>(không thể thay đổi)</span>
                )}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] as QuestionType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setQuestionType(type)}
                      disabled={mode === 'edit'}
                      style={{
                        flex: '1 1 150px',
                        padding: '12px 16px',
                        border: '2px solid',
                        borderColor: questionType === type ? '#3b82f6' : '#d1d5db',
                        borderRadius: 8,
                        backgroundColor: questionType === type ? '#eff6ff' : 'white',
                        color: questionType === type ? '#1e40af' : '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: mode === 'edit' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        opacity: mode === 'edit' ? 0.6 : 1,
                      }}
                    >
                      {questionTypeLabels[type]}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
              }}
            >
              <QuestionEditorSwitch
                type={questionType}
                value={editorValue}
                onChange={setEditorValue}
                disabled={saving}
              />
            </div>

            {(questionType === 'TRUE_FALSE' ||
              questionType === 'SHORT_ANSWER' ||
              questionType === 'MULTIPLE_CHOICE') && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  disabled={enhancing || saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    backgroundColor: enhancing ? '#d1d5db' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: enhancing || saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: enhancing || saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!enhancing && !saving) {
                      e.currentTarget.style.backgroundColor = '#7c3aed';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!enhancing && !saving) {
                      e.currentTarget.style.backgroundColor = '#8b5cf6';
                    }
                  }}
                >
                  <Sparkles size={16} />
                  {enhancing ? 'Đang tạo lời giải...' : '✨ Tạo lời giải bằng AI'}
                </button>
              </div>
            )}

            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}
              >
                Giải thích (không bắt buộc)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                disabled={saving}
                placeholder="Nhập lời giải thích cho câu hỏi..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}
              >
                Sơ đồ / Hình vẽ (LaTeX, không bắt buộc)
              </label>
              <textarea
                ref={diagramTextareaRef}
                value={diagramData}
                onChange={(e) => setDiagramData(e.target.value)}
                disabled={saving}
                placeholder="Nhập LaTeX cho hình vẽ nếu có... Ví dụ: \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
              <LatexToolbar onInsert={insertLatexAtCursor} disabled={saving} />
            </div>
          </div>

          <aside className="eqfm-preview-column">
            <section className="eqfm-preview-card">
              <p className="eqfm-preview-heading">Xem trước đề</p>
              <span className="badge" style={{ marginBottom: 8 }}>
                {previewTypeLabel}
              </span>
              <div className="eqfm-preview-question">
                <MathText text={previewQuestionText || 'Chưa có nội dung câu hỏi.'} />
              </div>

              {previewOptionEntries.length > 0 && (
                <div className="eqfm-preview-meta">
                  <p className="eqfm-preview-meta__title">Lựa chọn</p>
                  <ol className="eqfm-preview-options">
                    {previewOptionEntries.map(([key, value], index) => (
                      <li key={`preview-option-${key}`}>
                        <strong>{(key || String.fromCharCode(65 + index)).toUpperCase()}.</strong>{' '}
                        <MathText text={String(value)} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <p className="eqfm-preview-answer">
                <span>Đáp án:</span> {previewCorrectAnswer || 'Chưa có đáp án'}
              </p>
            </section>

            <section className="eqfm-preview-card">
              <p className="eqfm-preview-heading">Xem trước hình</p>
              {hasDiagramPreview ? (
                <QuestionDiagram
                  source={{
                    diagramData: diagramData.trim() ? diagramData.trim() : initialData?.diagramData,
                    diagramUrl: initialData?.diagramUrl,
                  }}
                />
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Chưa có hình minh họa.
                </p>
              )}
            </section>
          </aside>
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button className="btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo câu hỏi' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
