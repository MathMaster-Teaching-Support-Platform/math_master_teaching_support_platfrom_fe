import { useState, useMemo } from 'react';
import { X, Save, Trash2, FileText, Plus } from 'lucide-react';
import type {
  AssessmentSearchItem,
  ChapterResponse,
  LessonResponse,
  RoadmapResourceOption,
  CourseResponse,
  TopicStatus,
  UpdateRoadmapTopicRequest,
} from '../../types';
import MaterialResourceSelector, { type ResourceType } from './MaterialResourceSelector';
import EntryTestSelector from './EntryTestSelector';
import SelectedResourcesPreview from './SelectedResourcesPreview';

type TopicDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

type TopicFieldKey = keyof UpdateRoadmapTopicRequest;

interface PersistedTopicBaseline {
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  sequenceOrder: number;
  mark: number;
  topicAssessmentId: string;
  courseIds: string[];
  status: TopicStatus;
  lessonIds: string[];
  slideLessonIds: string[];
  assessmentIds: string[];
  lessonPlanIds: string[];
  mindmapIds: string[];
}

export interface TopicNodeDraft {
  clientId: string;
  persistedId?: string;
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  sequenceOrder: number;
  mark: number;
  topicAssessmentId: string;
  courseIds: string[];
  status: TopicStatus;
  selectedChapterId: string;
  lessonKeyword: string;
  lessonIds: string[];
  slideLessonIds: string[];
  assessmentIds: string[];
  selectedResourceLessonId: string;
  resourceKeyword: string;
  lessonPlanIds: string[];
  mindmapIds: string[];
  isDraft: boolean;
  dirtyFields: TopicFieldKey[];
  baseline?: PersistedTopicBaseline;
}

interface TopicFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicNodeDraft | null;
  chapters: ChapterResponse[];
  lessons: LessonResponse[];
  isSubmitting: boolean;
  onSave: () => void;
  onArchive?: () => void;
  onUpdateField: <K extends keyof TopicNodeDraft>(
    field: K,
    value: TopicNodeDraft[K],
    dirtyField?: TopicFieldKey
  ) => void;
  onToggleIdList: (
    field: 'lessonIds' | 'slideLessonIds' | 'assessmentIds' | 'lessonPlanIds' | 'mindmapIds' | 'courseIds',
    id: string,
    checked: boolean
  ) => void;
  // Resource queries
  templateSlides: RoadmapResourceOption[];
  mindmaps: RoadmapResourceOption[];
  lessonPlans: RoadmapResourceOption[];
  assessments: RoadmapResourceOption[];
  courses: CourseResponse[];
  isLoadingResources: Record<ResourceType, boolean>;
  // Entry test
  selectedEntryTest: AssessmentSearchItem | null;
  onSelectEntryTest: (assessment: AssessmentSearchItem | null) => void;
  entryTestAssessments: AssessmentSearchItem[];
  entryTestSearchQuery: string;
  onEntryTestSearchChange: (query: string) => void;
  isLoadingEntryTest: boolean;
}

const TOPIC_STATUSES: TopicStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
};

const DIFFICULTY_LABELS: Record<TopicDifficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const RESOURCE_ADD_LABELS: Record<ResourceType, string> = {
  LESSON: 'Thêm bài học',
  TEMPLATE_SLIDE: 'Thêm slide mẫu',
  ASSESSMENT: 'Thêm bài kiểm tra',
  LESSON_PLAN: 'Thêm giáo án',
  MINDMAP: 'Thêm sơ đồ tư duy',
  COURSE: 'Thêm khóa học',
};

export default function TopicFormDrawer({
  isOpen,
  onClose,
  topic,
  chapters,
  lessons,
  isSubmitting,
  onSave,
  onArchive,
  onUpdateField,
  onToggleIdList,
  templateSlides,
  mindmaps,
  lessonPlans,
  assessments,
  courses,
  isLoadingResources,
  selectedEntryTest,
  onSelectEntryTest,
  entryTestAssessments,
  entryTestSearchQuery,
  onEntryTestSearchChange,
  isLoadingEntryTest,
}: TopicFormDrawerProps) {
  const [activeResourceType, setActiveResourceType] = useState<ResourceType | null>(null);
  const [isEntryTestSelectorOpen, setIsEntryTestSelectorOpen] = useState(false);

  if (!isOpen || !topic) return null;

  const submitButtonLabel = topic.isDraft
    ? isSubmitting
      ? 'Đang tạo...'
      : 'Tạo chủ đề'
    : isSubmitting
      ? 'Đang lưu...'
      : 'Lưu thay đổi';

  const getResourceItems = (type: ResourceType): { id: string; name: string; type: ResourceType; lessonName?: string }[] => {
    switch (type) {
      case 'LESSON':
        return lessons.map((l) => ({ id: l.id, name: l.title || l.id, type, lessonName: undefined }));
      case 'TEMPLATE_SLIDE':
        return templateSlides.map((s) => ({ id: s.id, name: s.name, type }));
      case 'LESSON_PLAN':
        return lessonPlans.map((p) => ({ id: p.id, name: p.name, type }));
      case 'MINDMAP':
        return mindmaps.map((m) => ({ id: m.id, name: m.name, type }));
      case 'ASSESSMENT':
        return assessments.map((a) => ({ id: a.id, name: a.name, type }));
      case 'COURSE':
        return courses.map((c) => ({ id: c.id, name: c.title || c.id, type }));
      default:
        return [];
    }
  };

  const getSelectedIdsForType = (type: ResourceType): string[] => {
    switch (type) {
      case 'LESSON':
        return topic.lessonIds;
      case 'TEMPLATE_SLIDE':
        return topic.slideLessonIds;
      case 'LESSON_PLAN':
        return topic.lessonPlanIds;
      case 'MINDMAP':
        return topic.mindmapIds;
      case 'ASSESSMENT':
        return topic.assessmentIds;
      case 'COURSE':
        return topic.courseIds;
      default:
        return [];
    }
  };

  const handleResourceConfirm = (selectedIds: string[]) => {
    if (!activeResourceType) return;

    const fieldMap: Record<ResourceType, 'lessonIds' | 'slideLessonIds' | 'assessmentIds' | 'lessonPlanIds' | 'mindmapIds' | 'courseIds'> = {
      LESSON: 'lessonIds',
      TEMPLATE_SLIDE: 'slideLessonIds',
      ASSESSMENT: 'assessmentIds',
      LESSON_PLAN: 'lessonPlanIds',
      MINDMAP: 'mindmapIds',
      COURSE: 'courseIds',
    };

    const field = fieldMap[activeResourceType];
    const currentIds = getSelectedIdsForType(activeResourceType);

    // Calculate added and removed
    const newSet = new Set(selectedIds);
    const currentSet = new Set(currentIds);

    // Update by toggling each id
    selectedIds.forEach((id) => {
      if (!currentSet.has(id)) {
        onToggleIdList(field, id, true);
      }
    });

    currentIds.forEach((id) => {
      if (!newSet.has(id)) {
        onToggleIdList(field, id, false);
      }
    });

    setActiveResourceType(null);
  };

  const handleResourceRemove = (id: string, type: ResourceType) => {
    const fieldMap: Record<ResourceType, 'lessonIds' | 'slideLessonIds' | 'assessmentIds' | 'lessonPlanIds' | 'mindmapIds' | 'courseIds'> = {
      LESSON: 'lessonIds',
      TEMPLATE_SLIDE: 'slideLessonIds',
      ASSESSMENT: 'assessmentIds',
      LESSON_PLAN: 'lessonPlanIds',
      MINDMAP: 'mindmapIds',
      COURSE: 'courseIds',
    };
    onToggleIdList(fieldMap[type], id, false);
  };

  const allSelectedResources = useMemo(() => {
    const resources: { id: string; name: string; type: ResourceType }[] = [];

    topic.lessonIds.forEach((id) => {
      const lesson = lessons.find((l) => l.id === id);
      if (lesson) resources.push({ id, name: lesson.title || id, type: 'LESSON' });
    });

    topic.slideLessonIds.forEach((id) => {
      const slide = templateSlides.find((s) => s.id === id);
      if (slide) resources.push({ id, name: slide.name, type: 'TEMPLATE_SLIDE' });
    });

    topic.lessonPlanIds.forEach((id) => {
      const plan = lessonPlans.find((p) => p.id === id);
      if (plan) resources.push({ id, name: plan.name, type: 'LESSON_PLAN' });
    });

    topic.mindmapIds.forEach((id) => {
      const mindmap = mindmaps.find((m) => m.id === id);
      if (mindmap) resources.push({ id, name: mindmap.name, type: 'MINDMAP' });
    });

    topic.assessmentIds.forEach((id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (assessment) resources.push({ id, name: assessment.name, type: 'ASSESSMENT' });
    });

    topic.courseIds.forEach((id) => {
      const course = courses.find((c) => c.id === id);
      if (course) resources.push({ id, name: course.title || id, type: 'COURSE' });
    });

    return resources;
  }, [topic, lessons, templateSlides, lessonPlans, mindmaps, assessments, courses]);

  return (
    <>
      {/* Backdrop */}
      <div className="topic-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <aside className="topic-drawer">
        {/* Header */}
        <header className="topic-drawer-header">
          <div>
            <h2>{topic.isDraft ? 'Tạo chủ đề mới' : 'Chỉnh sửa chủ đề'}</h2>
            <p className="topic-drawer-subtitle">
              {topic.isDraft ? 'Xây dựng chủ đề học tập mới cho lộ trình' : `Chủ đề #${topic.sequenceOrder}`}
            </p>
          </div>
          <button className="topic-drawer-close" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="topic-drawer-content">
          {/* Section 1: Basic Info */}
          <section className="topic-section">
            <div className="topic-section-header">
              <span className="topic-section-icon topic-section-icon--info">1</span>
              <h3>Thông tin chủ đề</h3>
            </div>

            <div className="topic-section-card">
              <div className="topic-form-grid">
                <div className="topic-form-field">
                  <label>Tên chủ đề *</label>
                  <input
                    type="text"
                    value={topic.title}
                    onChange={(e) => onUpdateField('title', e.target.value, 'title')}
                    placeholder="Nhập tên chủ đề"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="topic-form-field">
                  <label>Độ khó</label>
                  <select
                    value={topic.difficulty}
                    onChange={(e) => onUpdateField('difficulty', e.target.value as TopicDifficulty, 'difficulty')}
                    disabled={isSubmitting}
                  >
                    {(['EASY', 'MEDIUM', 'HARD'] as TopicDifficulty[]).map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="topic-form-field">
                  <label>Chương</label>
                  <select
                    value={topic.selectedChapterId}
                    onChange={(e) => {
                      onUpdateField('selectedChapterId', e.target.value);
                      onUpdateField('lessonKeyword', '');
                      onUpdateField('selectedResourceLessonId', '');
                    }}
                    disabled={isSubmitting || chapters.length === 0}
                  >
                    <option value="">Chọn chương</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title || chapter.name || chapter.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="topic-form-field">
                  <label>Trạng thái</label>
                  <select
                    value={topic.status}
                    onChange={(e) => onUpdateField('status', e.target.value as TopicStatus, 'status')}
                    disabled={topic.isDraft || isSubmitting}
                  >
                    {TOPIC_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {TOPIC_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="topic-form-field">
                  <label>Thứ tự</label>
                  <input type="number" value={topic.sequenceOrder} readOnly disabled />
                </div>

                <div className="topic-form-field topic-form-field--full">
                  <label>Mô tả chủ đề</label>
                  <textarea
                    rows={3}
                    value={topic.description}
                    onChange={(e) => onUpdateField('description', e.target.value, 'description')}
                    placeholder="Mô tả ngắn về nội dung chủ đề"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Entry Test */}
          <section className="topic-section">
            <div className="topic-section-header">
              <span className="topic-section-icon topic-section-icon--test">2</span>
              <h3>Bài kiểm tra chủ đề</h3>
              <span className="topic-section-badge">Tùy chọn</span>
            </div>

            <div className="topic-section-card">
              {selectedEntryTest ? (
                <div className="entry-test-card">
                  <div className="entry-test-card-icon">
                    <FileText size={32} />
                  </div>
                  <div className="entry-test-card-info">
                    <h4>{selectedEntryTest.title}</h4>
                    <div className="entry-test-card-meta">
                      <span>{selectedEntryTest.questionCount ?? 0} câu hỏi</span>
                      {selectedEntryTest.subject && <span>• {selectedEntryTest.subject}</span>}
                    </div>
                  </div>
                  <button
                    className="entry-test-card-change"
                    onClick={() => setIsEntryTestSelectorOpen(true)}
                  >
                    Đổi
                  </button>
                </div>
              ) : (
                <button
                  className="entry-test-add-btn"
                  onClick={() => setIsEntryTestSelectorOpen(true)}
                >
                  <Plus size={20} />
                  <span>Chọn bài kiểm tra</span>
                </button>
              )}
            </div>
          </section>

          {/* Section 3: Resources */}
          <section className="topic-section">
            <div className="topic-section-header">
              <span className="topic-section-icon topic-section-icon--resource">3</span>
              <h3>Tài nguyên chủ đề</h3>
            </div>

            <div className="topic-section-card">
              {/* Resource Add Buttons */}
              <div className="resource-add-buttons">
                {(['LESSON', 'TEMPLATE_SLIDE', 'LESSON_PLAN', 'MINDMAP', 'ASSESSMENT', 'COURSE'] as ResourceType[]).map(
                  (type) => (
                    <button
                      key={type}
                      className="resource-add-btn"
                      onClick={() => setActiveResourceType(type)}
                      disabled={isSubmitting}
                    >
                      <Plus size={16} />
                      {RESOURCE_ADD_LABELS[type]}
                    </button>
                  )
                )}
              </div>

              {/* Selected Resources Preview */}
              <div className="selected-resources-wrapper">
                <h4 className="selected-resources-title">Tài nguyên đã chọn</h4>
                <SelectedResourcesPreview
                  resources={allSelectedResources}
                  onRemove={handleResourceRemove}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="topic-drawer-footer">
          <div className="topic-drawer-actions">
            {!topic.isDraft && onArchive && (
              <button
                type="button"
                className="topic-drawer-btn topic-drawer-btn--danger"
                onClick={onArchive}
                disabled={isSubmitting}
              >
                <Trash2 size={18} />
                Lưu trữ
              </button>
            )}
            <div className="topic-drawer-actions-right">
              <button
                type="button"
                className="topic-drawer-btn topic-drawer-btn--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="topic-drawer-btn topic-drawer-btn--primary"
                onClick={onSave}
                disabled={isSubmitting || !topic.title || (topic.isDraft && topic.lessonIds.length === 0)}
              >
                <Save size={18} />
                {submitButtonLabel}
              </button>
            </div>
          </div>
        </footer>
      </aside>

      {/* Resource Selector Modal */}
      {activeResourceType && (
        <MaterialResourceSelector
          isOpen={!!activeResourceType}
          onClose={() => setActiveResourceType(null)}
          onConfirm={handleResourceConfirm}
          initialSelectedIds={getSelectedIdsForType(activeResourceType)}
          resourceType={activeResourceType}
          resources={getResourceItems(activeResourceType)}
          isLoading={isLoadingResources[activeResourceType]}
          searchQuery={topic.resourceKeyword}
          onSearchChange={(query) => onUpdateField('resourceKeyword', query)}
          lessonContext={
            topic.lessonIds.length > 0
              ? topic.lessonIds.map((id) => {
                  const lesson = lessons.find((l) => l.id === id);
                  return { id, name: lesson?.title || id };
                })
              : undefined
          }
          selectedLessonId={topic.selectedResourceLessonId}
          onLessonChange={(id) => onUpdateField('selectedResourceLessonId', id)}
        />
      )}

      {/* Entry Test Selector */}
      <EntryTestSelector
        isOpen={isEntryTestSelectorOpen}
        onClose={() => setIsEntryTestSelectorOpen(false)}
        onSelect={onSelectEntryTest}
        selectedAssessment={selectedEntryTest}
        assessments={entryTestAssessments}
        isLoading={isLoadingEntryTest}
        searchQuery={entryTestSearchQuery}
        onSearchChange={onEntryTestSearchChange}
      />
    </>
  );
}
