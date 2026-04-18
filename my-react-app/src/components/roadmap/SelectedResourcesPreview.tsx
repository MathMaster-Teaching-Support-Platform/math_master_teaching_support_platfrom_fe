import { X, BookOpen, Presentation, FileText, Brain, Layers, GraduationCap } from 'lucide-react';
import type { ResourceType } from './MaterialResourceSelector';

interface SelectedResource {
  id: string;
  name: string;
  type: ResourceType;
}

interface SelectedResourcesPreviewProps {
  resources: SelectedResource[];
  onRemove: (id: string, type: ResourceType) => void;
}

const RESOURCE_META: Record<ResourceType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  LESSON: {
    label: 'Bài học',
    icon: <BookOpen size={14} />,
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  TEMPLATE_SLIDE: {
    label: 'Slide',
    icon: <Presentation size={14} />,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  ASSESSMENT: {
    label: 'Bài kiểm tra',
    icon: <FileText size={14} />,
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  LESSON_PLAN: {
    label: 'Giáo án',
    icon: <Layers size={14} />,
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  MINDMAP: {
    label: 'Mindmap',
    icon: <Brain size={14} />,
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  COURSE: {
    label: 'Khóa học',
    icon: <GraduationCap size={14} />,
    color: '#06b6d4',
    bgColor: '#ecfeff',
  },
};

export default function SelectedResourcesPreview({ resources, onRemove }: SelectedResourcesPreviewProps) {
  if (resources.length === 0) {
    return (
      <div className="selected-resources-empty">
        <p>Chưa có tài nguyên nào được chọn</p>
        <span className="selected-resources-hint">
          Nhấn "+ Thêm tài nguyên" để bắt đầu xây dựng chủ đề
        </span>
      </div>
    );
  }

  // Group by type
  const grouped = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) acc[resource.type] = [];
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<ResourceType, SelectedResource[]>);

  return (
    <div className="selected-resources-container">
      <div className="selected-resources-header">
        <span className="selected-resources-count">{resources.length} tài nguyên</span>
      </div>
      <div className="selected-resources-list">
        {(Object.keys(grouped) as ResourceType[]).map((type) => {
          const meta = RESOURCE_META[type];
          const items = grouped[type];

          return items.map((item) => (
            <div key={`${type}-${item.id}`} className="selected-resource-item">
              <span
                className="selected-resource-badge"
                style={{ color: meta.color, backgroundColor: meta.bgColor }}
              >
                {meta.icon}
                {meta.label}
              </span>
              <span className="selected-resource-name">{item.name}</span>
              <button
                className="selected-resource-remove"
                onClick={() => onRemove(item.id, type)}
                aria-label={`Xóa ${item.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
