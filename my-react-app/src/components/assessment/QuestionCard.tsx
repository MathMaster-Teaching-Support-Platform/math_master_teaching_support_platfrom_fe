import { Check, ChevronDown, ChevronUp, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
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
  onUpdate: (
    questionId: string,
    orderIndex: number,
    pointsOverride: number | null
  ) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onClearOverride: (questionId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  /**
   * When true, hide the inline "Thứ tự" input — order is managed externally
   * via drag-and-drop and the page-level "Save Order" button. The card only
   * tracks/saves pointsOverride changes in this mode.
   */
  disableOrderEdit?: boolean;
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
  disableOrderEdit = false,
}: QuestionCardProps) {
  const questionId = question.questionId || question.id || '';
  const { showToast } = useToast();

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Check if there are unsaved changes
  const hasOrderChanged =
    !disableOrderEdit && orderValue !== String(question.orderIndex);
  const hasPointsChanged =
    pointsValue !==
    (question.pointsOverride !== null && question.pointsOverride !== undefined
      ? String(question.pointsOverride)
      : '');
  const isDirty = hasOrderChanged || hasPointsChanged;

  // Truncate question text
  const shouldTruncate = question.questionText.length > 150;
  const displayText =
    !isExpanded && shouldTruncate
      ? question.questionText.slice(0, 150) + '...'
      : question.questionText;

  const handleSave = async () => {
    const newOrder = disableOrderEdit ? question.orderIndex : Number(orderValue);
    const newPoints = pointsValue.trim() === '' ? null : Number(pointsValue);

    if (!disableOrderEdit && (isNaN(newOrder) || newOrder < 1)) {
      showToast({ type: 'warning', message: 'Order phải là số nguyên dương' });
      return;
    }

    if (pointsValue.trim() !== '' && (isNaN(newPoints!) || newPoints! < 0)) {
      showToast({ type: 'warning', message: 'Điểm phải >= 0' });
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
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          aria-expanded={!isCollapsed}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #E8E6DC',
            borderRadius: 6,
            padding: '2px 8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#5E5D59',
            fontSize: 12,
          }}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {isCollapsed ? 'Chi tiết' : 'Thu gọn'}
        </button>
      </div>

      {/* Question Content */}
      <div className="question-card__content">
        <div className="question-card__text">
          <MathText text={displayText} />
        </div>
        {shouldTruncate && (
          <button className="question-card__expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
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

      {/* Collapsed compact summary — keeps row short while dragging */}
      {isCollapsed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
            fontSize: 12,
            color: '#5E5D59',
          }}
        >
          <span>
            Điểm:{' '}
            <strong style={{ color: '#141413' }}>
              {question.pointsOverride ?? question.points ?? 0}
            </strong>
          </span>
        </div>
      )}

      {/* Editable Section */}
      {!isCollapsed && (
      <div className="question-card__editable">
        <ScoreDisplay currentScore={question.points} overrideScore={question.pointsOverride} />

        {isDraft && (
          <div className="question-card__inputs">
            {!disableOrderEdit && (
              <EditableField
                label="Thứ tự"
                value={orderValue}
                onChange={setOrderValue}
                type="number"
                min={1}
                placeholder="Order"
                disabled={!isDraft}
              />
            )}
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
      )}

      {/* Actions */}
      {!isCollapsed && isDraft && (
        <div className="question-card__actions">
          <div className="question-card__actions-left">
            {isDirty && (
              <button className="btn btn--primary" onClick={handleSave} disabled={isUpdating}>
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
            <button className="btn btn--danger" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={14} />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
