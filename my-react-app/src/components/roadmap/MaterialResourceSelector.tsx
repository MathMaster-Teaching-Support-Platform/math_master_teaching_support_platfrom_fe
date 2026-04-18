import { useState } from 'react';
import { Search, X, Check, BookOpen, Presentation, FileText, Brain, GraduationCap, Layers } from 'lucide-react';

export type ResourceType = 'LESSON' | 'TEMPLATE_SLIDE' | 'ASSESSMENT' | 'LESSON_PLAN' | 'MINDMAP' | 'COURSE';

interface ResourceItem {
  id: string;
  name: string;
  type: ResourceType;
  lessonName?: string;
  chapterName?: string;
}

interface MaterialResourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  initialSelectedIds: string[];
  resourceType: ResourceType;
  resources: ResourceItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lessonContext?: { id: string; name: string }[];
  selectedLessonId?: string;
  onLessonChange?: (lessonId: string) => void;
}

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  LESSON: {
    label: 'Bài học',
    icon: <BookOpen size={18} />,
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  TEMPLATE_SLIDE: {
    label: 'Slide mẫu',
    icon: <Presentation size={18} />,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  ASSESSMENT: {
    label: 'Bài kiểm tra',
    icon: <FileText size={18} />,
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  LESSON_PLAN: {
    label: 'Giáo án',
    icon: <Layers size={18} />,
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  MINDMAP: {
    label: 'Sơ đồ tư duy',
    icon: <Brain size={18} />,
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  COURSE: {
    label: 'Khóa học',
    icon: <GraduationCap size={18} />,
    color: '#06b6d4',
    bgColor: '#ecfeff',
  },
};

export default function MaterialResourceSelector({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedIds,
  resourceType,
  resources,
  isLoading,
  searchQuery,
  onSearchChange,
  lessonContext,
  selectedLessonId,
  onLessonChange,
}: MaterialResourceSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const config = RESOURCE_CONFIG[resourceType];

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set(initialSelectedIds));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="material-selector-overlay" onClick={handleClose}>
      <div className="material-selector-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="material-selector-header">
          <div className="material-selector-title">
            <span className="material-selector-icon" style={{ color: config.color, backgroundColor: config.bgColor }}>
              {config.icon}
            </span>
            <h2>Chọn {config.label.toLowerCase()}</h2>
          </div>
          <button className="material-selector-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </header>

        {/* Filter Bar */}
        <div className="material-selector-filters">
          <div className="material-selector-search">
            <Search size={20} className="material-selector-search-icon" />
            <input
              type="text"
              placeholder={`Tìm ${config.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="material-selector-search-input"
            />
          </div>

          {lessonContext && lessonContext.length > 0 && onLessonChange && (
            <select
              className="material-selector-lesson-select"
              value={selectedLessonId || ''}
              onChange={(e) => onLessonChange(e.target.value)}
            >
              <option value="">Chọn bài học</option>
              {lessonContext.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content Grid */}
        <div className="material-selector-content">
          {isLoading ? (
            <div className="material-selector-loading">
              <div className="material-selector-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="material-selector-empty">
              <p>Không tìm thấy {config.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="material-selector-grid">
              {resources.map((resource) => {
                const isSelected = selectedIds.has(resource.id);
                return (
                  <div
                    key={resource.id}
                    className={`material-selector-card ${isSelected ? 'material-selector-card--selected' : ''}`}
                    onClick={() => toggleSelection(resource.id)}
                  >
                    <div className="material-selector-card-header">
                      <span
                        className="material-selector-card-badge"
                        style={{ color: config.color, backgroundColor: config.bgColor }}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                      <div className={`material-selector-checkbox ${isSelected ? 'material-selector-checkbox--checked' : ''}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                    <h3 className="material-selector-card-title">{resource.name}</h3>
                    {resource.lessonName && (
                      <p className="material-selector-card-subtitle">{resource.lessonName}</p>
                    )}
                    {resource.chapterName && (
                      <p className="material-selector-card-meta">{resource.chapterName}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar */}
        <div className="material-selector-footer">
          <div className="material-selector-count">
            <span className="material-selector-count-badge">{selectedIds.size}</span>
            <span>tài nguyên đã chọn</span>
          </div>
          <div className="material-selector-actions">
            <button className="material-selector-btn material-selector-btn--secondary" onClick={handleClose}>
              Hủy
            </button>
            <button
              className="material-selector-btn material-selector-btn--primary"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              Thêm vào chủ đề
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
