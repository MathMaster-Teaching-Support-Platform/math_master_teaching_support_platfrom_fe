import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { QuestionEditorSwitch } from '../../components/question';
import MathText from '../../components/common/MathText';
import { TagSelector } from '../../components/common/TagSelector';
import { LatexToolbar } from '../../components/common/LatexToolbar';
import type { QuestionType, QuestionDifficulty } from '../../types/question';
import type { QuestionTag } from '../../types/questionTemplate';

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

const difficultyLabels: Record<QuestionDifficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
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
  const [tags, setTags] = useState<QuestionTag[]>(
    (initialData?.tags as unknown as QuestionTag[] | undefined) || []
  );
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
      setTags((initialData.tags as unknown as QuestionTag[] | undefined) || []);
      setExplanation(initialData.explanation || '');
      setDiagramData('');
      setEditorValue({
        questionText: initialData.questionText || '',
        options: initialData.options || {},
        correctAnswer: initialData.correctAnswer || '',
        generationMetadata: initialData.generationMetadata || {},
      });
    }
  }, [isOpen, initialData]);

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
        tags: tags,
        explanation: explanation.trim() || undefined,
        diagramData: diagramData.trim() ? { latex: diagramData.trim() } : undefined,
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
      <div className="modal-card" style={{ width: 'min(800px, 95vw)', maxHeight: '90vh', overflow: 'auto' }}>
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

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <>
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

          {/* Question Type Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              Loại câu hỏi {mode === 'edit' && <span style={{ color: '#6b7280', fontWeight: 400 }}>(không thể thay đổi)</span>}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] as QuestionType[]).map((type) => (
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
              ))}
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

          {/* LaTeX Preview for Question Text */}
          {editorValue.questionText && String(editorValue.questionText).includes('$') && (
            <div
              style={{
                padding: 16,
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
              }}
            >
              <p
                className="muted"
                style={{ marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}
              >
                Xem trước LaTeX:
              </p>
              <MathText text={String(editorValue.questionText)} />
            </div>
          )}

          {/* Common Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                Độ khó
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                {Object.entries(difficultyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                Điểm
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <div>
            <TagSelector selectedTags={tags} onChange={setTags} maxTags={5} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
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
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              Sơ đồ / Hình vẽ (LaTeX, không bắt buộc)
            </label>
            <textarea
              ref={diagramTextareaRef}
              value={diagramData}
              onChange={(e) => setDiagramData(e.target.value)}
              disabled={saving}
              placeholder="Nhập LaTeX cho hình vẽ nếu có... Ví dụ: \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
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
            
            {/* LaTeX Toolbar */}
            <LatexToolbar onInsert={insertLatexAtCursor} disabled={saving} />
            
            {diagramData && diagramData.trim() && (
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 8,
                }}
              >
                <p
                  className="muted"
                  style={{ marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Xem trước LaTeX:
                </p>
                <MathText text={diagramData} />
              </div>
            )}
          </div>
          </>
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
