import { useState, useEffect } from 'react';
import { Search, X, FileText, HelpCircle, Check } from 'lucide-react';
import type { AssessmentSearchItem } from '../../types';

interface EntryTestSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assessment: AssessmentSearchItem | null) => void;
  selectedAssessment: AssessmentSearchItem | null;
  assessments: AssessmentSearchItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function EntryTestSelector({
  isOpen,
  onClose,
  onSelect,
  selectedAssessment,
  assessments,
  isLoading,
  searchQuery,
  onSearchChange,
}: EntryTestSelectorProps) {
  const [localSelected, setLocalSelected] = useState<AssessmentSearchItem | null>(selectedAssessment);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedAssessment);
    }
  }, [isOpen, selectedAssessment]);

  const handleSelect = (assessment: AssessmentSearchItem) => {
    setLocalSelected(assessment);
  };

  const handleConfirm = () => {
    onSelect(localSelected);
    onClose();
  };

  const handleClear = () => {
    setLocalSelected(null);
    onSelect(null);
    onClose();
  };

  const handleClose = () => {
    setLocalSelected(selectedAssessment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="entry-test-selector-overlay" onClick={handleClose}>
      <div className="entry-test-selector-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="entry-test-selector-header">
          <div className="entry-test-selector-title">
            <span className="entry-test-selector-icon">
              <FileText size={24} />
            </span>
            <div>
              <h2>Chọn bài kiểm tra đầu vào</h2>
              <p>Bài kiểm tra sẽ được gán cho chủ đề này (không bắt buộc)</p>
            </div>
          </div>
          <button className="entry-test-selector-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </header>

        {/* Search */}
        <div className="entry-test-selector-search-wrapper">
          <div className="entry-test-selector-search">
            <Search size={20} className="entry-test-selector-search-icon" />
            <input
              type="text"
              placeholder="Tìm bài kiểm tra theo tên..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="entry-test-selector-search-input"
            />
          </div>
        </div>

        {/* Content */}
        <div className="entry-test-selector-content">
          {isLoading ? (
            <div className="entry-test-selector-loading">
              <div className="entry-test-selector-spinner" />
              <p>Đang tìm kiếm...</p>
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="entry-test-selector-empty">
              <HelpCircle size={48} className="entry-test-selector-empty-icon" />
              <p>Nhập ít nhất 2 ký tự để tìm kiếm</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="entry-test-selector-empty">
              <p>Không tìm thấy bài kiểm tra phù hợp</p>
            </div>
          ) : (
            <div className="entry-test-selector-list">
              {assessments.map((assessment) => {
                const isSelected = localSelected?.id === assessment.id;
                return (
                  <div
                    key={assessment.id}
                    className={`entry-test-selector-item ${isSelected ? 'entry-test-selector-item--selected' : ''}`}
                    onClick={() => handleSelect(assessment)}
                  >
                    <div className="entry-test-selector-item-main">
                      <div className="entry-test-selector-checkbox">
                        {isSelected && <Check size={16} />}
                      </div>
                      <div className="entry-test-selector-info">
                        <h3>{assessment.title}</h3>
                        <p>{assessment.description || 'Không có mô tả'}</p>
                        <div className="entry-test-selector-meta">
                          <span>
                            <HelpCircle size={14} />
                            {assessment.questionCount ?? 0} câu
                          </span>
                          {assessment.subject && (
                            <span>• {assessment.subject}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="entry-test-selector-footer">
          {localSelected ? (
            <div className="entry-test-selector-selected-info">
              <span>Đã chọn:</span>
              <strong>{localSelected.title}</strong>
            </div>
          ) : (
            <div className="entry-test-selector-selected-info">
              <span>Chưa chọn bài kiểm tra</span>
            </div>
          )}
          <div className="entry-test-selector-actions">
            <button
              className="entry-test-selector-btn entry-test-selector-btn--secondary"
              onClick={handleClear}
            >
              Bỏ chọn
            </button>
            <button
              className="entry-test-selector-btn entry-test-selector-btn--primary"
              onClick={handleConfirm}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
