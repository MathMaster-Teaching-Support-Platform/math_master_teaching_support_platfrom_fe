import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './bank-info-popup.css';

interface CognitiveLevelCount {
  level: string;
  label: string;
  count: number;
  color: string;
}

interface BankInfoPopupProps {
  bankName: string;
  bankId: string;
  cognitiveDistribution: {
    NB?: number;
    TH?: number;
    VD?: number;
    VDC?: number;
  };
  position: { x: number; y: number };
  onClose: () => void;
}

export function BankInfoPopup({
  bankName,
  bankId: _bankId,
  cognitiveDistribution,
  position,
  onClose,
}: BankInfoPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  const levels: CognitiveLevelCount[] = [
    {
      level: 'NB',
      label: 'Nhận biết',
      count: cognitiveDistribution.NB ?? 0,
      color: '#10b981',
    },
    {
      level: 'TH',
      label: 'Thông hiểu',
      count: cognitiveDistribution.TH ?? 0,
      color: '#3b82f6',
    },
    {
      level: 'VD',
      label: 'Vận dụng',
      count: cognitiveDistribution.VD ?? 0,
      color: '#f59e0b',
    },
    {
      level: 'VDC',
      label: 'Vận dụng cao',
      count: cognitiveDistribution.VDC ?? 0,
      color: '#ef4444',
    },
  ];

  const totalQuestions = levels.reduce((sum, level) => sum + level.count, 0);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="bank-info-overlay">
      <div
        ref={popupRef}
        className="bank-info-popup"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Header */}
        <div className="bank-info-popup__header">
          <div>
            <h4 className="bank-info-popup__title">{bankName}</h4>
            <p className="bank-info-popup__subtitle">
              Tổng: {totalQuestions} câu hỏi
            </p>
          </div>
          <button
            className="bank-info-popup__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cognitive Level Distribution */}
        <div className="bank-info-popup__content">
          {levels.map((level) => (
            <div key={level.level} className="bank-info-popup__level">
              <div className="bank-info-popup__level-header">
                <span
                  className="bank-info-popup__level-dot"
                  style={{ backgroundColor: level.color }}
                />
                <span className="bank-info-popup__level-label">
                  {level.label}
                </span>
              </div>
              <div className="bank-info-popup__level-count">
                <span className="bank-info-popup__count">{level.count}</span>
                <span className="bank-info-popup__percentage">
                  {totalQuestions > 0
                    ? `${Math.round((level.count / totalQuestions) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {totalQuestions === 0 && (
          <div className="bank-info-popup__footer">
            <p className="bank-info-popup__empty">
              Ngân hàng câu hỏi chưa có câu hỏi nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
