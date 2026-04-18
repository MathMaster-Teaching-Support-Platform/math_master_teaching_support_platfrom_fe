import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  useAddRoadmapTopic,
  useAdminRoadmapDetail,
  useArchiveRoadmapTopic,
  useCreateRoadmapEntryTest,
  useUpdateRoadmapTopic,
} from '../../hooks/useRoadmaps';
import { useBatchSaveTopics } from '../../hooks/useBatchTopics';
import { CourseService } from '../../services/api/course.service';
import { useDebounce } from '../../hooks/useDebounce';
import type {
  AssessmentResponse,
  CourseResponse,
  PaginatedResponse,
  ApiResponse,
  TopicStatus,
  UpdateRoadmapTopicRequest,
} from '../../types';
import { AuthService } from '../../services/api/auth.service';
import { API_BASE_URL } from '../../config/api.config';
import './admin-roadmap-topics-page.css';

type TopicDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
type TopicFieldKey = keyof UpdateRoadmapTopicRequest;

interface TopicDraft {
  clientId: string;
  persistedId?: string;
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  sequenceOrder: number;
  courseIds: string[]; // Multiple courses (no primary/additional distinction)
  status: TopicStatus;
  isDraft: boolean;
  dirtyFields: TopicFieldKey[];
}

interface Toast { type: 'success' | 'error'; message: string; }

const PIN_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#ec4899','#14b8a6'];
const DIFF_LABELS: Record<TopicDifficulty, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
const STATUS_LABELS: Record<TopicStatus, string> = { NOT_STARTED: 'Chưa bắt đầu', IN_PROGRESS: 'Đang học', COMPLETED: 'Hoàn thành' };

function makeNewDraft(order: number): TopicDraft {
  return {
    clientId: `draft-${Date.now()}-${Math.random()}`,
    title: '', description: '', difficulty: 'MEDIUM',
    sequenceOrder: order, courseIds: [],
    status: 'NOT_STARTED',
    isDraft: true, dirtyFields: [],
  };
}

// ── SVG winding road builder ──────────────────────────────────────
const ROAD_W = 900;
const ROW_H = 180;
const PAD_TOP = 60;
const COLS = 4;

function nodePos(index: number) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const visualCol = row % 2 === 1 ? COLS - 1 - col : col;
  const step = ROAD_W * 0.7 / (COLS - 1);
  return {
    x: ROAD_W * 0.15 + visualCol * step,
    y: PAD_TOP + row * ROW_H,
  };
}

function buildRoadPath(count: number): string {
  if (count === 0) return '';
  const rowCount = Math.max(1, Math.ceil(count / COLS));
  let d = '';
  for (let row = 0; row < rowCount; row++) {
    const y = PAD_TOP + row * ROW_H;
    const prevY = PAD_TOP + (row - 1) * ROW_H;
    const L = ROAD_W * 0.15;
    const R = ROAD_W * 0.85;
    if (row === 0) {
      d += `M ${L},${y} C ${L + 150},${y - 40} ${R - 150},${y + 40} ${R},${y}`;
    } else if (row % 2 === 1) {
      d += ` C ${R + 60},${prevY + 40} ${R + 60},${y - 40} ${R},${y}`;
      d += ` C ${R - 150},${y - 40} ${L + 150},${y + 40} ${L},${y}`;
    } else {
      d += ` C ${L - 60},${prevY + 40} ${L - 60},${y - 40} ${L},${y}`;
      d += ` C ${L + 150},${y - 40} ${R - 150},${y + 40} ${R},${y}`;
    }
  }
  return d;
}

// ── Sortable Pin Component ────────────────────────────────────────
interface SortablePinProps {
  topic: TopicDraft;
  index: number;
  isActive: boolean;
  onActivate: () => void;
}

function SortablePin({ topic, index, isActive, onActivate }: SortablePinProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.clientId });

  const pos = nodePos(index);
  const color = PIN_COLORS[index % PIN_COLORS.length];
  const hasCourses = topic.courseIds.length > 0;

  const style: React.CSSProperties = {
    left: `${(pos.x / ROAD_W) * 100}%`,
    top: `${pos.y - 56}px`,
    '--pin-color': color,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 1,
  } as React.CSSProperties;

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`art-pin ${isActive ? 'art-pin--active' : ''} ${topic.isDraft ? 'art-pin--draft' : ''}`}
      style={style}
      onClick={onActivate}
      title={topic.title || '(Chưa có tiêu đề)'}
    >
      <div className="art-pin__circle">
        {topic.dirtyFields.length > 0 && !topic.isDraft && <span className="art-pin__dot" />}
        <span className="art-pin__num">{topic.sequenceOrder}</span>
      </div>
      <div className="art-pin__tip" />
      <div className="art-pin__label">
        <span className="art-pin__title">{topic.title || 'Chưa có tiêu đề'}</span>
        {!hasCourses && <span className="art-pin__warn">Chưa có khóa học</span>}
        {hasCourses && <span className="art-pin__course-ok">✓ {topic.courseIds.length} khóa học</span>}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function AdminRoadmapTopicsPage() {
  const { roadmapId = '' } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { data: roadmapData, isLoading } = useAdminRoadmapDetail(roadmapId);
  const addMutation = useAddRoadmapTopic();
  const updateMutation = useUpdateRoadmapTopic();
  const archiveMutation = useArchiveRoadmapTopic();
  const entryTestMutation = useCreateRoadmapEntryTest();
  const batchSaveMutation = useBatchSaveTopics();

  const roadmap = roadmapData?.result;

  const [topics, setTopics] = useState<TopicDraft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [courseKw, setCourseKw] = useState('');
  const [entryTestId, setEntryTestId] = useState('');
  const [entryKw, setEntryKw] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);

  // Debounce courseKw to avoid hammering the API on every keystroke
  const courseKwDebounced = useDebounce(courseKw, 350);
  const entryKwDebounced = useDebounce(entryKw, 350);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    })
  );

  // Handle drag end - reorder topics
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTopics((items) => {
      const oldIndex = items.findIndex((t) => t.clientId === active.id);
      const newIndex = items.findIndex((t) => t.clientId === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return items;

      // Reorder array
      const reordered = [...items];
      const [movedItem] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedItem);

      // Update sequence orders and mark as dirty
      return reordered.map((t, i) => ({
        ...t,
        sequenceOrder: i + 1,
        dirtyFields: t.isDraft ? t.dirtyFields : [...new Set([...t.dirtyFields, 'sequenceOrder' as TopicFieldKey])],
      }));
    });
  }

  // Course search — admin endpoint, returns ALL courses (published + draft)
  const coursesQuery = useQuery<ApiResponse<PaginatedResponse<CourseResponse>>, Error>({
    queryKey: ['admin-courses-search', courseKwDebounced],
    queryFn: () => CourseService.adminSearchCourses({ keyword: courseKwDebounced || undefined, page: 0, size: 24 }),
  });
  const courseOptions = useMemo(() => coursesQuery.data?.result?.content ?? [], [coursesQuery.data]);

  // Assessment search — GET /assessments/search?name=keyword returns List<AssessmentResponse>
  const assessmentsQuery = useQuery<ApiResponse<AssessmentResponse[]>, Error>({
    queryKey: ['admin-assessments-entry', entryKwDebounced],
    queryFn: async () => {
      const token = AuthService.getToken();
      const qs = entryKwDebounced ? `?name=${encodeURIComponent(entryKwDebounced)}` : '';
      const res = await fetch(`${API_BASE_URL}/assessments/search${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
  });
  const assessmentOptions = useMemo(() => assessmentsQuery.data?.result ?? [], [assessmentsQuery.data]);

  // Load from API
  useEffect(() => {
    if (!roadmap) return;
    const sorted = [...(roadmap.topics ?? [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const loaded: TopicDraft[] = sorted.map((t) => ({
      clientId: t.id, persistedId: t.id,
      title: t.title, description: t.description ?? '',
      difficulty: (t.difficulty ?? 'MEDIUM') as TopicDifficulty,
      sequenceOrder: t.sequenceOrder, 
      courseIds: ((t as any).courses ?? []).map((c: any) => c.id), // Load courses from API response
      status: t.status as TopicStatus, isDraft: false, dirtyFields: [],
    }));
    setTopics(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id]);

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  const activeTopic = topics.find((t) => t.clientId === activeId) ?? null;

  function patchActive<K extends keyof TopicDraft>(field: K, value: TopicDraft[K], dirtyKey?: TopicFieldKey) {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.clientId !== activeId) return t;
        const updated = { ...t, [field]: value };
        if (dirtyKey && !updated.dirtyFields.includes(dirtyKey)) {
          updated.dirtyFields = [...updated.dirtyFields, dirtyKey];
        }
        return updated;
      })
    );
  }

  function addTopic() {
    const draft = makeNewDraft(topics.length + 1);
    setTopics((p) => [...p, draft]);
    setActiveId(draft.clientId);
  }

  function removeLocal(clientId: string) {
    setTopics((prev) => {
      const rest = prev.filter((t) => t.clientId !== clientId);
      return rest.map((t, i) => ({ ...t, sequenceOrder: i + 1 }));
    });
    if (activeId === clientId) setActiveId(null);
  }

  async function saveTopic(_: TopicDraft) {
    // NOTE: This function is deprecated - use saveAll() for batch operations instead
    showToast('error', 'Vui lòng sử dụng nút "Lưu tất cả" để lưu thay đổi.');
    return false;
  }

  async function saveAll() {
    // Validate all topics before saving
    const invalid = topics.find(t => !t.title.trim());
    if (invalid) {
      showToast('error', 'Vui lòng điền tiêu đề cho tất cả chủ đề.');
      return;
    }

    setIsSavingAll(true);
    try {
      await batchSaveMutation.mutateAsync({
        roadmapId,
        topics: topics.map((t, index) => ({
          id: t.persistedId,
          title: t.title.trim(),
          description: t.description.trim() || undefined,
          sequenceOrder: index + 1, // Use array index for order
          difficulty: t.difficulty,
          courseIds: t.courseIds.length > 0 ? t.courseIds : undefined,
          status: t.isDraft ? 'NOT_STARTED' : t.status,
        })),
      });
      
      // Clear dirty flags after successful save
      setTopics(prev => prev.map(t => ({ ...t, isDraft: false, dirtyFields: [] })));
      showToast('success', `Đã lưu toàn bộ lộ trình (${topics.length} chủ đề).`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSavingAll(false);
    }
  }

  async function deleteTopic(t: TopicDraft) {
    if (t.isDraft) { removeLocal(t.clientId); setDeleteId(null); return; }
    if (!t.persistedId) return;
    try {
      await archiveMutation.mutateAsync({ roadmapId, topicId: t.persistedId });
      removeLocal(t.clientId);
      showToast('success', `Đã xóa "${t.title}".`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa chủ đề');
    }
    setDeleteId(null);
  }

  async function saveEntryTest() {
    if (!entryTestId) { showToast('error', 'Vui lòng chọn bài kiểm tra.'); return; }
    try {
      await entryTestMutation.mutateAsync({ roadmapId, payload: { assessmentId: entryTestId } });
      showToast('success', 'Đã cấu hình bài kiểm tra đầu vào.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi cấu hình');
    }
  }

  const pendingCount = topics.filter((t) => t.isDraft || t.dirtyFields.length > 0).length;
  const roadH = Math.max(300, Math.ceil(topics.length / COLS) * ROW_H + 100);
  const roadPath = buildRoadPath(topics.length);

  if (isLoading) {
    return (
      <DashboardLayout role="admin" user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}>
        <div className="art-loading">Đang tải lộ trình...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}>
      <div className="art">

        {/* Toast */}
        {toast && <div className={`art-toast art-toast--${toast.type}`}>{toast.message}</div>}

        {/* Header */}
        <div className="art-header">
          <button className="art-back" onClick={() => navigate(-1)}>← Quay lại</button>
          <div className="art-header__info">
            <h1 className="art-header__title">{roadmap?.name ?? 'Lộ trình'}</h1>
            <p className="art-header__sub">{roadmap?.subject} · {roadmap?.gradeLevel}</p>
          </div>
          <div className="art-header__actions">
            {pendingCount > 0 && (
              <button className="art-btn art-btn--save-all" onClick={saveAll} disabled={isSavingAll}>
                {isSavingAll ? 'Đang lưu...' : `Lưu tất cả (${pendingCount})`}
              </button>
            )}
            <button className="art-btn art-btn--add" onClick={addTopic}>+ Thêm chủ đề</button>
          </div>
        </div>

        {/* ── Road Canvas ── */}
        <div className="art-canvas-wrap">
          <svg
            className="art-road-svg"
            viewBox={`0 0 ${ROAD_W} ${roadH}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Road shadow */}
            <path d={roadPath} className="art-road__shadow" />
            {/* Road surface */}
            <path d={roadPath} className="art-road__surface" />
            {/* Center dashes */}
            <path d={roadPath} className="art-road__dash" />
          </svg>

          {/* Topic pins */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={topics.map((t) => t.clientId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="art-pins" style={{ height: roadH }}>
                {topics.map((t, i) => (
                  <SortablePin
                    key={t.clientId}
                    topic={t}
                    index={i}
                    isActive={activeId === t.clientId}
                    onActivate={() => setActiveId(activeId === t.clientId ? null : t.clientId)}
                  />
                ))}

                {topics.length === 0 && (
                  <div className="art-empty-road">
                    <p>Chưa có chủ đề nào.<br />Nhấn <strong>"+ Thêm chủ đề"</strong> để bắt đầu xây dựng lộ trình.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* ── Entry Test (collapsible) ── */}
        <div className="art-entry">
          <button className="art-entry__trigger" onClick={() => setEntryOpen((o) => !o)}>
            <span>🎯 Cấu hình bài kiểm tra đầu vào</span>
            <span className="art-entry__chevron">{entryOpen ? '▲' : '▼'}</span>
          </button>
          {entryOpen && (
            <div className="art-entry__body">
              <p className="art-entry__hint">Kết quả bài test gợi ý điểm xuất phát phù hợp cho học sinh (không khoá chủ đề nào).</p>
              <div className="art-field">
                <label className="art-label">Tìm bài kiểm tra</label>
                <input className="art-input" placeholder="Tên bài kiểm tra..." value={entryKw} onChange={(e) => setEntryKw(e.target.value)} />
              </div>
              {assessmentOptions.length > 0 && (
                <div className="art-list">
                  {assessmentOptions.map((a: AssessmentResponse) => (
                    <button key={a.id.toString()} className={`art-list-item ${entryTestId === a.id?.toString() ? 'art-list-item--active' : ''}`} onClick={() => setEntryTestId(a.id?.toString())}>
                      <div className="art-list-item__info">
                        <span>{a.title}</span>
                        {a.timeLimitMinutes && <span className="art-list-item__meta">⏱ {a.timeLimitMinutes} phút</span>}
                      </div>
                      {entryTestId === a.id?.toString() && <span className="art-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button className="art-btn art-btn--save" onClick={saveEntryTest} disabled={!entryTestId || entryTestMutation.isPending} style={{ marginTop: 12 }}>
                {entryTestMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          )}
        </div>

        {/* ── Side Drawer ── */}
        <AnimatePresence>
          {activeTopic && (
            <>
              <motion.div className="art-overlay-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveId(null)} />
              <motion.aside
                className="art-drawer"
                initial={{ x: 440 }}
                animate={{ x: 0 }}
                exit={{ x: 440 }}
                transition={{ type: 'spring', stiffness: 320, damping: 38 }}
              >
                <div className="art-drawer__header">
                  <h2 className="art-drawer__title">
                    Chủ đề #{activeTopic.sequenceOrder}
                    {activeTopic.isDraft && <span className="art-badge art-badge--new">Mới</span>}
                  </h2>
                  <div className="art-drawer__actions">
                    <button
                      className="art-btn art-btn--save"
                      onClick={() => saveTopic(activeTopic)}
                      disabled={addMutation.isPending || updateMutation.isPending}
                    >
                      {addMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button className="art-btn art-btn--delete" onClick={() => setDeleteId(activeTopic.clientId)}>Xóa</button>
                    <button className="art-drawer__close" onClick={() => setActiveId(null)}>✕</button>
                  </div>
                </div>

                <div className="art-drawer__content">
                  {/* Basic Info */}
                  <div className="art-drawer__section">
                    <div className="art-section-title">🧩 Thông tin cơ bản</div>
                    <div className="art-field">
                      <label className="art-label">Tiêu đề *</label>
                      <input className="art-input" value={activeTopic.title} onChange={(e) => patchActive('title', e.target.value, 'title')} placeholder="Tên chủ đề..." />
                    </div>
                    <div className="art-field">
                      <label className="art-label">Mô tả</label>
                      <textarea className="art-textarea" rows={3} value={activeTopic.description} onChange={(e) => patchActive('description', e.target.value, 'description')} placeholder="Mô tả ngắn (tùy chọn)" />
                    </div>
                    <div className="art-row">
                      <div className="art-field">
                        <label className="art-label">Độ khó</label>
                        <select className="art-select" value={activeTopic.difficulty} onChange={(e) => patchActive('difficulty', e.target.value as TopicDifficulty, 'difficulty')}>
                          {(['EASY', 'MEDIUM', 'HARD'] as TopicDifficulty[]).map((d) => (
                            <option key={d} value={d}>{DIFF_LABELS[d]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="art-field">
                        <label className="art-label">Thứ tự</label>
                        <input className="art-input" type="number" min={1} value={activeTopic.sequenceOrder} onChange={(e) => patchActive('sequenceOrder', Number(e.target.value), 'sequenceOrder')} />
                      </div>
                      {activeTopic.persistedId && (
                        <div className="art-field">
                          <label className="art-label">Trạng thái</label>
                          <select className="art-select" value={activeTopic.status} onChange={(e) => patchActive('status', e.target.value as TopicStatus, 'status')}>
                            {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as TopicStatus[]).map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="art-drawer__section">
                    <div className="art-section-title">📚 Khóa học của chủ đề</div>
                    <p className="art-section-hint">Chọn các khóa học liên quan đến chủ đề này (tùy chọn).</p>

                    {activeTopic.courseIds.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {activeTopic.courseIds.map((courseId) => {
                          const course = courseOptions.find(c => c.id === courseId);
                          if (!course) return null;
                          return (
                            <div key={courseId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px' }}>
                              <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{course.title}</span>
                              <button 
                                onClick={() => patchActive('courseIds', activeTopic.courseIds.filter(id => id !== courseId), 'courseId')}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
                              >×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button className="art-btn art-btn--pick" onClick={() => setCoursePickerOpen(true)}>
                      + Thêm khóa học
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Course Picker (full-screen overlay) ── */}
        <AnimatePresence>
          {coursePickerOpen && (
            <motion.div className="art-picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="art-picker__inner">
                <div className="art-picker__header">
                  <h2 className="art-picker__title">Chọn khóa học</h2>
                  <button className="art-drawer__close" onClick={() => setCoursePickerOpen(false)}>✕</button>
                </div>
                <div className="art-picker__search">
                  <input className="art-input art-picker__input" placeholder="🔍 Tìm khóa học..." value={courseKw} onChange={(e) => setCourseKw(e.target.value)} autoFocus />
                </div>
                {coursesQuery.isLoading && <p className="art-loading-text">Đang tải...</p>}
                {!coursesQuery.isLoading && courseOptions.length === 0 && (
                  <p className="art-loading-text">Không tìm thấy khóa học nào{courseKw ? ` cho "${courseKw}"` : ''}.</p>
                )}
                <div className="art-picker__grid">
                  {courseOptions.map((c) => {
                    const isSelected = activeTopic?.courseIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        className={`art-picker__card ${isSelected ? 'art-picker__card--selected' : ''}`}
                        onClick={() => {
                          if (!activeTopic) return;
                          if (isSelected) {
                            patchActive('courseIds', activeTopic.courseIds.filter(id => id !== c.id), 'courseId');
                          } else {
                            patchActive('courseIds', [...activeTopic.courseIds, c.id], 'courseId');
                          }
                        }}
                      >
                        {c.thumbnailUrl && <img className="art-picker__card-thumb" src={c.thumbnailUrl} alt={c.title} />}
                        <div className="art-picker__card-body">
                          <strong className="art-picker__card-title">{c.title}</strong>
                          {c.description && <p className="art-picker__card-desc">{c.description}</p>}
                        </div>
                        {isSelected && <div className="art-picker__card-check">✓</div>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1.5px solid #f3f4f6', background: '#fafafa' }}>
                  <button 
                    className="art-btn art-btn--save" 
                    onClick={() => setCoursePickerOpen(false)}
                    style={{ width: '100%' }}
                  >
                    Xong ({activeTopic?.courseIds.length || 0} khóa học đã chọn)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Delete modal ── */}
        {deleteId && (
          <div className="art-modal-overlay">
            <div className="art-modal">
              <h3 className="art-modal__title">Xác nhận xóa</h3>
              <p className="art-modal__body">Bạn có chắc muốn xóa chủ đề "{topics.find((t) => t.clientId === deleteId)?.title || '(trống)'}"?</p>
              <div className="art-modal__actions">
                <button className="art-btn art-btn--delete" onClick={() => { const t = topics.find((n) => n.clientId === deleteId); if (t) deleteTopic(t); }}>Xóa</button>
                <button className="art-btn" onClick={() => setDeleteId(null)}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
