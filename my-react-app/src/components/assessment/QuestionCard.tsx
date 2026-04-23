import { useState } from 'react';
import { Trash2, RotateCcw, Save, ChevronDown, ChevronUp, Check } from 'lucide-react';
import MathText from '../common/MathText';
import { EditableField } from './EditableField';
import { ScoreDisplay } from './ScoreDisplay';

interface QuestionCardProps {
  question: {
    questionId?: string;
    id?: string;
    orderIndex: number;
    questionText: string;
    points?: number;
    pointsOverride?: number | null;
    questionSourceType?: string;
    canonicalQuestionId?: string;
    solutionSteps?: string;
    diagramData?: unknown;
  };
  index: number;
  isDraft: boolean;
  onUpdate: (questionId: string, orderIndex: number, pointsOverride: number | null) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onClearOverride: (questionId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function QuestionCard({
  question,
  index,
  isDraft,
  onUpdate,
  onDelete,
  onClearOverride,
  isUpdating,
  isDeleting,
}: QuestionCardProps) {
  const questionId = question.questionId || question.id || '';
  
  // Local state for editable fields
  const [orderValue, setOrderValue] = useState(String(question.orderIndex));
  const [pointsValue, setPointsValue] = useState(
    question.pointsOverride !== null && question.pointsOverride !== undefined
      ? String(question.pointsOverride)
      : ''
  );
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Check if there are unsaved changes
  const hasOrderChanged = orderValue !== String(question.orderIndex);
  const hasPointsChanged = pointsValue !== (
    question.pointsOverride !== null && question.pointsOverride !== undefined
      ? String(question.pointsOverride)
      : ''
  );
  const isDirty = hasOrderChanged || hasPointsChanged;
  
  // Truncate question text
  const shouldTruncate = question.questionText.length > 150;
  const displayText = !isExpanded && shouldTruncate
    ? question.questionText.slice(0, 150) + '...'
    : question.questionText;
  
  const handleSave = async () => {
    const newOrder = Number(orderValue);
    const newPoints = pointsValue.trim() === '' ? null : Number(pointsValue);
    
    if (isNaN(newOrder) || newOrder < 1) {
      alert('Order phải là số nguyên dương');
      return;
    }
    
    if (pointsValue.trim() !== '' && (isNaN(newPoints!) || newPoints! < 0)) {
      alert('Điểm phải >= 0');
      return;
    }
    
    await onUpdate(questionId, newOrder, newPoints);
    
    // Show success feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  
  const handleClearOverride = async () => {
    await onClearOverride(questionId);
    setPointsValue('');
  };
  
  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      await onDelete(questionId);
    }
  };
  
  return (
    <div
      className={`question-card ${isDirty ? 'question-card--dirty' : ''} ${
        showSuccess ? 'question-card--success' : ''
      }`}
    >
      {/* Header */}
      <div className="question-card__header">
        <div className="question-card__index">Câu {index + 1}</div>
        {question.questionSourceType && (
          <div className="question-card__badges">
            {question.questionSourceType === 'AI_GENERATED' && (
              <span className="badge badge--ai">AI Generated</span>
            )}
            {question.questionSourceType === 'TEMPLATE_GENERATED' && (
              <span className="badge badge--parametric">Parametric</span>
            )}
            {question.canonicalQuestionId && (
              <span className="badge badge--canonical">From Canonical</span>
            )}
          </div>
        )}
      </div>
      
      {/* Question Content */}
      <div className="question-card__content">
        <div className="question-card__text">
          <MathText text={displayText} />
        </div>
        {shouldTruncate && (
          <button
            className="question-card__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Xem thêm
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Additional Content (when expanded) */}
      {isExpanded && (
        <div className="question-card__details">
          {question.solutionSteps && (
            <div className="question-card__solution">
              <p className="question-card__detail-label">Solution Steps</p>
              <MathText text={question.solutionSteps} />
            </div>
          )}
          {question.diagramData ? (
            <div className="question-card__diagram">
              <p className="question-card__detail-label">Diagram Data</p>
              <pre className="question-card__diagram-code">
                {((): string => {
                  try {
                    return JSON.stringify(question.diagramData as Record<string, unknown>, null, 2);
                  } catch {
                    return 'Unable to display diagram data';
                  }
                })()}
              </pre>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Editable Section */}
      <div className="question-card__editable">
        <ScoreDisplay
          currentScore={question.points}
          overrideScore={question.pointsOverride}
        />
        
        {isDraft && (
          <div className="question-card__inputs">
            <EditableField
              label="Thứ tự"
              value={orderValue}
              onChange={setOrderValue}
              type="number"
              min={1}
              placeholder="Order"
              disabled={!isDraft}
            />
            <EditableField
              label="Điểm"
              value={pointsValue}
              onChange={setPointsValue}
              type="number"
              min={0}
              step={0.25}
              placeholder="Điểm"
              disabled={!isDraft}
            />
          </div>
        )}
      </div>
      
      {/* Actions */}
      {isDraft && (
        <div className="question-card__actions">
          <div className="question-card__actions-left">
            {isDirty && (
              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  'Đang lưu...'
                ) : (
                  <>
                    <Save size={14} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            )}
            {showSuccess && (
              <span className="question-card__success-indicator">
                <Check size={14} />
                Đã lưu
              </span>
            )}
          </div>
          
          <div className="question-card__actions-right">
            {question.pointsOverride !== null && question.pointsOverride !== undefined && (
              <button
                className="btn btn--ghost"
                onClick={handleClearOverride}
                disabled={isUpdating}
              >
                <RotateCcw size={14} />
                Reset điểm
              </button>
            )}
            <button
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={14} />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
