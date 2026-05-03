import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../config/api.config';
import { mockAdmin } from '../../data/mockData';
import { useBatchSaveTopics } from '../../hooks/useBatchTopics';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useAddRoadmapTopic,
  useAdminRoadmapDetail,
  useArchiveRoadmapTopic,
  useCreateRoadmapEntryTest,
  useRemoveRoadmapEntryTest,
  useUpdateRoadmap,
  useUpdateRoadmapTopic,
} from '../../hooks/useRoadmaps';
import { AuthService } from '../../services/api/auth.service';
import { CourseService } from '../../services/api/course.service';
import '../../styles/module-refactor.css';
import type {
  ApiResponse,
  AssessmentResponse,
  CourseResponse,
  PaginatedResponse,
  TopicStatus,
  UpdateRoadmapTopicRequest,
} from '../../types';
import '../courses/TeacherCourses.css';
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
  mark: number;
  courseIds: string[]; // Multiple courses (no primary/additional distinction)
  status: TopicStatus;
  isDraft: boolean;
  dirtyFields: TopicFieldKey[];
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

/** Warm, legible accents (terracotta first per DESIGN.md brand) */
const PIN_COLORS = [
  '#c96442',
  '#d97757',
  '#b45309',
  '#0d845d',
  '#1d6fa8',
  '#6b5b4f',
  '#92400e',
  '#047857',
];
const DIFF_LABELS: Record<TopicDifficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};
const STATUS_LABELS: Record<TopicStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
};

const ROADMAP_STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Sẵn sàng',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
};

function makeNewDraft(order: number): TopicDraft {
  return {
    clientId: `draft-${Date.now()}-${Math.random()}`,
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    sequenceOrder: order,
    mark: order,
    courseIds: [],
    status: 'NOT_STARTED',
    isDraft: true,
    dirtyFields: [],
  };
}

// ── SVG winding road builder ──────────────────────────────────────
const ROAD_W = 900;
const ROW_H = 180;
const PAD_TOP = 60;
const COLS = 4;
/** ViewBox Y distance from top of pin stack to bottom of tip (circle + tip), for anchoring tip on path */
const PIN_STACK_TO_TIP = 61;

function nodePos(index: number) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const visualCol = row % 2 === 1 ? COLS - 1 - col : col;
  const step = (ROAD_W * 0.7) / (COLS - 1);
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
  /** Point on road centerline (viewBox coords) where pin tip should meet the path */
  pathAnchor: { x: number; y: number } | null;
  roadH: number;
}

function SortablePin({ topic, index, isActive, onActivate, pathAnchor, roadH }: SortablePinProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.clientId,
  });

  const fallback = nodePos(index);
  const ax = pathAnchor?.x ?? fallback.x;
  const ay = pathAnchor?.y ?? fallback.y;
  const color = PIN_COLORS[index % PIN_COLORS.length];
  const hasCourses = topic.courseIds.length > 0;

  const dragT = transform ? CSS.Transform.toString(transform) : '';
  const transformParts = ['translateX(-50%)'];
  if (dragT) transformParts.push(dragT);
  if (isActive) transformParts.push('scale(1.08)');

  const style: React.CSSProperties = {
    left: `${(ax / ROAD_W) * 100}%`,
    top: `${((ay - PIN_STACK_TO_TIP) / roadH) * 100}%`,
    '--pin-color': color,
    transform: transformParts.join(' '),
    transition: transition ?? 'transform 0.2s ease, opacity 0.18s ease',
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : isActive ? 20 : 10,
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
        {hasCourses && (
          <span className="art-pin__course-ok">✓ {topic.courseIds.length} khóa học</span>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function AdminRoadmapTopicsPage() {
  const { roadmapId = '' } = useParams<{ roadmapId: string }>();
  const {
    data: roadmapData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminRoadmapDetail(roadmapId);
  const addMutation = useAddRoadmapTopic();
  const updateMutation = useUpdateRoadmapTopic();
  const archiveMutation = useArchiveRoadmapTopic();
  const entryTestMutation = useCreateRoadmapEntryTest();
  const removeEntryTestMutation = useRemoveRoadmapEntryTest();
  const batchSaveMutation = useBatchSaveTopics();
  // ✅ ADD: Mutation for updating roadmap
  const updateRoadmapMutation = useUpdateRoadmap();

  const roadmap = roadmapData?.result;

  const [topics, setTopics] = useState<TopicDraft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [courseKw, setCourseKw] = useState('');
  const [entryTestId, setEntryTestId] = useState('');
  const [currentEntryTestName, setCurrentEntryTestName] = useState<string | null>(null);
  const [entryKw, setEntryKw] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  // ✅ ADD: State for editing roadmap name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const roadSurfaceRef = useRef<SVGPathElement | null>(null);
  const [pathAnchors, setPathAnchors] = useState<Array<{ x: number; y: number }> | null>(null);

  // Debounce courseKw to avoid hammering the API on every keystroke
  const courseKwDebounced = useDebounce(courseKw, 200);
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
        dirtyFields: t.isDraft
          ? t.dirtyFields
          : [...new Set([...t.dirtyFields, 'sequenceOrder' as TopicFieldKey])],
      }));
    });
  }

  // Course search — admin endpoint, returns ALL courses (published + draft)
  const coursesQuery = useQuery<ApiResponse<PaginatedResponse<CourseResponse>>, Error>({
    queryKey: ['admin-courses-search', courseKwDebounced],
    queryFn: () =>
      CourseService.adminSearchCourses({
        keyword: courseKwDebounced || undefined,
        page: 0,
        size: 24,
      }),
  });
  const courseOptions = useMemo(
    () => coursesQuery.data?.result?.content ?? [],
    [coursesQuery.data]
  );

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
  const assessmentOptions = useMemo(
    () => assessmentsQuery.data?.result ?? [],
    [assessmentsQuery.data]
  );

  // Sync entry test from loaded roadmap
  useEffect(() => {
    if (!roadmap) return;
    const et = (roadmap as any).entryTest;
    if (et?.assessmentId) {
      setEntryTestId(String(et.assessmentId));
      setCurrentEntryTestName(et.name ?? null);
    } else {
      setEntryTestId('');
      setCurrentEntryTestName(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id]);

  // Load from API
  useEffect(() => {
    if (!roadmap) return;
    const sorted = [...(roadmap.topics ?? [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const loaded: TopicDraft[] = sorted.map((t) => ({
      clientId: t.id,
      persistedId: t.id,
      title: t.title,
      description: t.description ?? '',
      difficulty: (t.difficulty ?? 'MEDIUM') as TopicDifficulty,
      sequenceOrder: t.sequenceOrder,
      mark: Number((t as any).mark ?? t.sequenceOrder ?? 1),
      courseIds: ((t as any).courses ?? []).map((c: any) => c.id), // Load courses from API response
      status: t.status as TopicStatus,
      isDraft: false,
      dirtyFields: [],
    }));
    setTopics(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id]);

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // ✅ ADD: Function to save roadmap name
  async function saveRoadmapName() {
    if (!editedName.trim()) {
      showToast('error', 'Vui lòng nhập tên lộ trình.');
      return;
    }

    try {
      await updateRoadmapMutation.mutateAsync({
        roadmapId,
        payload: { name: editedName.trim() },
      });
      setIsEditingName(false);
      showToast('success', 'Đã cập nhật tên lộ trình.');
      // Refetch roadmap data
      await refetch();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi cập nhật tên');
    }
  }

  const activeTopic = topics.find((t) => t.clientId === activeId) ?? null;

  const pointValidation = useMemo(() => {
    if (topics.length === 0) {
      return { valid: true, message: '' };
    }

    const sorted = [...topics].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    let prev = -Infinity;
    for (const topic of sorted) {
      if (!Number.isFinite(topic.mark) || topic.mark <= 0) {
        return {
          valid: false,
          message: `Điểm mốc của "${topic.title || `Chủ đề #${topic.sequenceOrder}`}" phải > 0.`,
        };
      }
      if (topic.mark <= prev) {
        return {
          valid: false,
          message: 'Điểm mốc phải tăng dần theo thứ tự chủ đề.',
        };
      }
      prev = topic.mark;
    }

    return { valid: true, message: '' };
  }, [topics]);

  function patchActive<K extends keyof TopicDraft>(
    field: K,
    value: TopicDraft[K],
    dirtyKey?: TopicFieldKey
  ) {
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

  async function saveTopic(topic: TopicDraft) {
    if (!topic.title.trim()) {
      showToast('error', 'Vui lòng điền tiêu đề.');
      return false;
    }

    // Validate mark
    if (!Number.isFinite(topic.mark) || topic.mark <= 0) {
      showToast('error', 'Điểm mốc phải > 0.');
      return false;
    }

    try {
      if (topic.isDraft) {
        // CREATE new topic
        await addMutation.mutateAsync({
          roadmapId,
          payload: {
            title: topic.title.trim(),
            description: topic.description.trim() || undefined,
            sequenceOrder: topic.sequenceOrder,
            difficulty: topic.difficulty,
            mark: topic.mark,
            courseId: topic.courseIds[0], // Use first course as primary
          },
        });
        showToast('success', `Đã tạo "${topic.title}".`);
      } else if (topic.persistedId) {
        // UPDATE existing topic
        const updates: UpdateRoadmapTopicRequest = {};
        if (topic.dirtyFields.includes('title')) updates.title = topic.title.trim();
        if (topic.dirtyFields.includes('description'))
          updates.description = topic.description.trim();
        if (topic.dirtyFields.includes('sequenceOrder'))
          updates.sequenceOrder = topic.sequenceOrder;
        if (topic.dirtyFields.includes('difficulty')) updates.difficulty = topic.difficulty;
        if (topic.dirtyFields.includes('status')) updates.status = topic.status;
        if (topic.dirtyFields.includes('mark')) updates.mark = topic.mark;

        await updateMutation.mutateAsync({
          roadmapId,
          topicId: topic.persistedId,
          payload: updates,
        });

        // Clear dirty flags
        setTopics((prev) =>
          prev.map((t) =>
            t.clientId === topic.clientId ? { ...t, isDraft: false, dirtyFields: [] } : t
          )
        );

        showToast('success', `Đã cập nhật "${topic.title}".`);
      }
      return true;
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi lưu chủ đề');
      return false;
    }
  }

  async function saveAll() {
    // Validate all topics before saving
    const invalid = topics.find((t) => !t.title.trim());
    if (invalid) {
      showToast('error', 'Vui lòng điền tiêu đề cho tất cả chủ đề.');
      return;
    }

    if (!pointValidation.valid) {
      showToast('error', pointValidation.message);
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
          mark: t.mark,
          courseIds: t.courseIds.length > 0 ? t.courseIds : undefined,
          status: t.isDraft ? 'NOT_STARTED' : t.status,
        })),
      });

      // Clear dirty flags after successful save
      setTopics((prev) => prev.map((t) => ({ ...t, isDraft: false, dirtyFields: [] })));
      showToast('success', `Đã lưu toàn bộ lộ trình (${topics.length} chủ đề).`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSavingAll(false);
    }
  }

  async function deleteTopic(t: TopicDraft) {
    if (t.isDraft) {
      removeLocal(t.clientId);
      setDeleteId(null);
      setActiveId(null); // Close drawer after deleting draft
      showToast('success', `Đã xóa "${t.title}".`);
      return;
    }
    if (!t.persistedId) return;
    try {
      await archiveMutation.mutateAsync({ roadmapId, topicId: t.persistedId });
      removeLocal(t.clientId);
      setActiveId(null); // Close drawer after deleting
      showToast('success', `Đã xóa "${t.title}".`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa chủ đề');
    }
    setDeleteId(null);
  }

  async function saveEntryTest() {
    if (!entryTestId) {
      showToast('error', 'Vui lòng chọn bài kiểm tra.');
      return;
    }
    try {
      await entryTestMutation.mutateAsync({ roadmapId, payload: { assessmentId: entryTestId } });
      const selected = assessmentOptions.find(
        (a: AssessmentResponse) => String(a.id) === entryTestId
      );
      setCurrentEntryTestName(selected?.title ?? entryTestId);
      showToast('success', 'Đã cấu hình bài kiểm tra đầu vào.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi cấu hình');
    }
  }

  async function removeEntryTest() {
    if (!globalThis.confirm('Xóa bài kiểm tra đầu vào của lộ trình này?')) return;
    try {
      await removeEntryTestMutation.mutateAsync({ roadmapId });
      setEntryTestId('');
      setCurrentEntryTestName(null);
      showToast('success', 'Đã xóa bài kiểm tra đầu vào.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa bài kiểm tra');
    }
  }

  const pendingCount = topics.filter((t) => t.isDraft || t.dirtyFields.length > 0).length;
  const roadH = useMemo(
    () => Math.max(300, Math.ceil(topics.length / COLS) * ROW_H + 100),
    [topics.length]
  );
  const roadPath = useMemo(() => buildRoadPath(topics.length), [topics.length]);
  const topicCount = topics.length;

  useLayoutEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let attempts = 0;
    const sample = () => {
      if (cancelled) return;
      const el = roadSurfaceRef.current;
      if (!el || topicCount === 0) {
        setPathAnchors(null);
        return;
      }
      const len = el.getTotalLength();
      if (!Number.isFinite(len) || len < 2) {
        if (attempts++ < 12) {
          rafId = requestAnimationFrame(sample);
        } else {
          setPathAnchors(null);
        }
        return;
      }
      const pts = Array.from({ length: topicCount }, (_, i) => {
        const u = topicCount <= 1 ? 0.5 : i / (topicCount - 1);
        const p = el.getPointAtLength(u * len);
        return { x: p.x, y: p.y };
      });
      setPathAnchors(pts);
    };
    sample();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [topicCount, roadPath]);

  const pageShell = (children: ReactNode) => (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-roadmap-mgmt-page">
        <div className="admin-roadmap-mgmt-page__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page admin-roadmap-mgmt-page__content">
          {children}
        </section>
      </div>
    </DashboardLayout>
  );

  if (isLoading) {
    return pageShell(
      <>
        <div className="skeleton-grid" aria-busy="true" aria-label="Đang tải">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          Đang tải dữ liệu lộ trình...
        </p>
      </>
    );
  }

  if (isError) {
    return pageShell(
      <div className="empty admin-roadmap-mgmt-empty" role="alert">
        <AlertCircle
          size={32}
          style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger, #c63f4d)' }}
          aria-hidden
        />
        <p>
          {error instanceof Error ? error.message : 'Không thể tải lộ trình. Vui lòng thử lại.'}
        </p>
        <Link to="/admin/roadmaps" className="btn secondary">
          <ArrowLeft size={15} />
          Về danh sách lộ trình
        </Link>
      </div>
    );
  }

  if (!roadmap) {
    return pageShell(
      <div className="empty admin-roadmap-mgmt-empty">
        <p>Không tìm thấy lộ trình.</p>
        <Link to="/admin/roadmaps" className="btn secondary">
          <ArrowLeft size={15} />
          Về danh sách
        </Link>
      </div>
    );
  }

  return pageShell(
    <>
      <div className="admin-roadmap-create-top">
        <Link to={`/admin/roadmaps/edit/${roadmapId}`} className="btn secondary">
          <ArrowLeft size={15} aria-hidden="true" />
          Quay lại chỉnh sửa lộ trình
        </Link>
      </div>

      <header className="page-header courses-header-row art-page-header--topics">
        <div className="header-stack" style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isEditingName ? (
              <>
                <h2 style={{ margin: 0 }}>{roadmap.name}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(roadmap.name);
                    setIsEditingName(true);
                  }}
                  title="Sửa tên lộ trình"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.85rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  ✏️
                </button>
              </>
            ) : (
              <>
                <input
                  className="input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Tên lộ trình..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void saveRoadmapName();
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false);
                    }
                  }}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    padding: '8px 12px',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    minWidth: '300px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => void saveRoadmapName()}
                  disabled={!editedName.trim() || updateRoadmapMutation.isPending}
                  style={{
                    padding: '8px 12px',
                    background: updateRoadmapMutation.isPending
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: updateRoadmapMutation.isPending ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {updateRoadmapMutation.isPending ? '...' : '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  style={{
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </>
            )}
            <span
              className={`admin-roadmap-page__status admin-roadmap-page__status--${roadmap.status.toLowerCase()}`}
              style={{ fontSize: 12 }}
            >
              <Circle className="admin-roadmap-page__status-dot" aria-hidden="true" />
              {ROADMAP_STATUS_LABELS[roadmap.status] ?? roadmap.status}
            </span>
          </div>
          <p className="header-sub admin-roadmap-mgmt-header-sub">
            {roadmap.subject} · {roadmap.gradeLevel}
          </p>
        </div>
        <div className="art-header__actions" style={{ flexShrink: 0 }}>
          {pendingCount > 0 && (
            <button
              type="button"
              className="btn btn--feat-emerald"
              onClick={() => void saveAll()}
              disabled={isSavingAll || !pointValidation.valid}
            >
              {isSavingAll ? 'Đang lưu...' : `Lưu tất cả (${pendingCount})`}
            </button>
          )}
          <button type="button" className="btn btn--feat-indigo" onClick={addTopic}>
            + Thêm chủ đề
          </button>
        </div>
      </header>

      {!pointValidation.valid && (
        <div className="assessment-summary-bar" style={{ marginTop: 0, marginBottom: 4 }}>
          <div className="summary-item" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <span className="summary-label" style={{ color: 'var(--mod-warn, #a36a12)' }}>
              ⚠ {pointValidation.message}
            </span>
          </div>
        </div>
      )}

      <div className="art art--in-module">
        {/* Toast */}
        {toast && <div className={`art-toast art-toast--${toast.type}`}>{toast.message}</div>}

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
            <path ref={roadSurfaceRef} d={roadPath} className="art-road__surface" />
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
              <div className="art-pins">
                {topics.map((t, i) => (
                  <SortablePin
                    key={t.clientId}
                    topic={t}
                    index={i}
                    isActive={activeId === t.clientId}
                    onActivate={() => setActiveId(activeId === t.clientId ? null : t.clientId)}
                    pathAnchor={pathAnchors?.[i] ?? null}
                    roadH={roadH}
                  />
                ))}

                {topics.length === 0 && (
                  <div className="art-empty-road">
                    <p>
                      Chưa có chủ đề nào.
                      <br />
                      Nhấn <strong>"+ Thêm chủ đề"</strong> để bắt đầu xây dựng lộ trình.
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* ── Entry Test (collapsible) ── */}
        <div className="art-entry">
          <button
            type="button"
            className="art-entry__trigger"
            onClick={() => setEntryOpen((o) => !o)}
            aria-expanded={entryOpen}
          >
            <span className="art-entry__trigger-main">
              <Target
                className="art-entry__trigger-icon"
                size={18}
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="art-entry__trigger-title">Cấu hình bài kiểm tra đầu vào</span>
            </span>
            {entryOpen ? (
              <ChevronUp className="art-entry__chevron-ico" size={18} strokeWidth={2} aria-hidden />
            ) : (
              <ChevronDown
                className="art-entry__chevron-ico"
                size={18}
                strokeWidth={2}
                aria-hidden
              />
            )}
          </button>
          {entryOpen && (
            <div className="art-entry__body">
              <p className="art-entry__hint">
                Kết quả bài test gợi ý điểm xuất phát phù hợp cho học sinh (không khoá chủ đề nào).
              </p>
              {currentEntryTestName && (
                <div className="art-entry__current">
                  <div className="art-entry__current-text">
                    <span className="art-entry__current-label">Bài test hiện tại</span>
                    <span className="art-entry__current-name">{currentEntryTestName}</span>
                  </div>
                  <button
                    type="button"
                    className="art-entry__remove-btn"
                    onClick={removeEntryTest}
                    disabled={removeEntryTestMutation.isPending}
                    title="Xóa bài kiểm tra đầu vào"
                  >
                    {removeEntryTestMutation.isPending ? (
                      'Đang xóa...'
                    ) : (
                      <>
                        <X size={14} strokeWidth={2.5} aria-hidden />
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="art-entry__search">
                <label className="art-entry__search-label" htmlFor="art-entry-test-search">
                  Tìm bài kiểm tra
                </label>
                <input
                  id="art-entry-test-search"
                  className="art-input art-entry__search-input"
                  placeholder="Tên bài kiểm tra..."
                  value={entryKw}
                  onChange={(e) => setEntryKw(e.target.value)}
                />
              </div>
              {assessmentOptions.length > 0 ? (
                <div className="art-list">
                  {assessmentOptions.map((a: AssessmentResponse) => {
                    const selected = entryTestId === a.id?.toString();
                    return (
                      <button
                        key={a.id.toString()}
                        type="button"
                        className={`art-list-item ${selected ? 'art-list-item--active' : ''}`}
                        onClick={() => setEntryTestId(a.id?.toString())}
                      >
                        <div className="art-list-item__info">
                          <span className="art-list-item__title">{a.title}</span>
                          {a.timeLimitMinutes != null && a.timeLimitMinutes > 0 && (
                            <span className="art-list-item__meta">
                              <Clock className="art-list-item__clock" size={13} aria-hidden />
                              {a.timeLimitMinutes} phút
                            </span>
                          )}
                        </div>
                        {selected && (
                          <span className="art-check" aria-hidden>
                            <Check size={18} strokeWidth={2.75} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="art-entry__list-empty">
                  Không có bài kiểm tra phù hợp. Thử từ khóa khác.
                </p>
              )}
              <button
                type="button"
                className="art-btn art-btn--save art-entry__save"
                onClick={saveEntryTest}
                disabled={!entryTestId || entryTestMutation.isPending}
              >
                {entryTestMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          )}
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <>
              <AnimatePresence>
                {activeTopic && (
                  <>
                    <motion.div
                      className="art-overlay-bg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setActiveId(null)}
                    />
                    <motion.aside
                      className="art-drawer art-drawer--studio"
                      initial={{ x: 440 }}
                      animate={{ x: 0 }}
                      exit={{ x: 440 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 38 }}
                    >
                      <div className="art-drawer__header">
                        <h2 className="art-drawer__title">
                          Chủ đề #{activeTopic.sequenceOrder}
                          {activeTopic.isDraft && (
                            <span className="art-badge art-badge--new">Mới</span>
                          )}
                          {activeTopic.dirtyFields.length > 0 && !activeTopic.isDraft && (
                            <span className="art-badge art-badge--warning">
                              <AlertCircle size={12} strokeWidth={2.5} aria-hidden />
                              {activeTopic.dirtyFields.length} thay đổi chưa lưu
                            </span>
                          )}
                        </h2>
                        <div className="art-drawer__actions">
                          <button
                            type="button"
                            className="art-btn art-btn--save"
                            onClick={() => saveTopic(activeTopic)}
                            disabled={addMutation.isPending || updateMutation.isPending}
                          >
                            {addMutation.isPending || updateMutation.isPending ? (
                              'Đang lưu...'
                            ) : (
                              <>
                                <Save size={16} strokeWidth={2.25} aria-hidden />
                                Lưu chủ đề
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="art-btn art-btn--delete"
                            onClick={() => setDeleteId(activeTopic.clientId)}
                          >
                            <Trash2 size={15} strokeWidth={2} aria-hidden />
                            Xóa
                          </button>
                          <button
                            type="button"
                            className="art-drawer__close"
                            onClick={() => setActiveId(null)}
                            aria-label="Đóng bảng chỉnh sửa"
                          >
                            <X size={18} strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      </div>

                      <div className="art-drawer__content">
                        {/* Basic Info */}
                        <div className="art-drawer__section art-drawer__section--basic">
                          <div className="art-section-title art-drawer__section-title">
                            🧩 Thông tin cơ bản
                          </div>
                          <div className="art-field">
                            <label
                              className="art-label"
                              htmlFor={`art-drawer-${activeTopic.clientId}-title`}
                            >
                              Tiêu đề *
                            </label>
                            <input
                              id={`art-drawer-${activeTopic.clientId}-title`}
                              className="art-input"
                              value={activeTopic.title}
                              onChange={(e) => patchActive('title', e.target.value, 'title')}
                              placeholder="Tên chủ đề..."
                            />
                          </div>
                          <div className="art-field">
                            <label
                              className="art-label"
                              htmlFor={`art-drawer-${activeTopic.clientId}-desc`}
                            >
                              Mô tả
                            </label>
                            <textarea
                              id={`art-drawer-${activeTopic.clientId}-desc`}
                              className="art-textarea"
                              rows={3}
                              value={activeTopic.description}
                              onChange={(e) =>
                                patchActive('description', e.target.value, 'description')
                              }
                              placeholder="Mô tả ngắn (tùy chọn)"
                            />
                          </div>
                          <div className="art-drawer__form-row">
                            <div className="art-field">
                              <label
                                className="art-label"
                                htmlFor={`art-drawer-${activeTopic.clientId}-difficulty`}
                              >
                                Độ khó
                              </label>
                              <select
                                id={`art-drawer-${activeTopic.clientId}-difficulty`}
                                className="art-select"
                                value={activeTopic.difficulty}
                                onChange={(e) =>
                                  patchActive(
                                    'difficulty',
                                    e.target.value as TopicDifficulty,
                                    'difficulty'
                                  )
                                }
                              >
                                {(['EASY', 'MEDIUM', 'HARD'] as TopicDifficulty[]).map((d) => (
                                  <option key={d} value={d}>
                                    {DIFF_LABELS[d]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="art-field">
                              <label
                                className="art-label"
                                htmlFor={`art-drawer-${activeTopic.clientId}-order`}
                              >
                                Thứ tự
                              </label>
                              <input
                                id={`art-drawer-${activeTopic.clientId}-order`}
                                className="art-input"
                                type="number"
                                min={1}
                                value={activeTopic.sequenceOrder}
                                onChange={(e) =>
                                  patchActive(
                                    'sequenceOrder',
                                    Number(e.target.value),
                                    'sequenceOrder'
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div
                            className={`art-drawer__form-row${activeTopic.persistedId ? '' : ' art-drawer__form-row--single'}`}
                          >
                            <div className="art-field">
                              <label
                                className="art-label"
                                htmlFor={`art-drawer-${activeTopic.clientId}-mark`}
                              >
                                Điểm mốc *
                              </label>
                              <input
                                id={`art-drawer-${activeTopic.clientId}-mark`}
                                className="art-input"
                                type="number"
                                min={1}
                                step="0.1"
                                value={activeTopic.mark}
                                onChange={(e) =>
                                  patchActive('mark', Number(e.target.value), 'mark')
                                }
                              />
                            </div>
                            {activeTopic.persistedId ? (
                              <div className="art-field">
                                <label
                                  className="art-label"
                                  htmlFor={`art-drawer-${activeTopic.clientId}-status`}
                                >
                                  Trạng thái
                                </label>
                                <select
                                  id={`art-drawer-${activeTopic.clientId}-status`}
                                  className="art-select"
                                  value={activeTopic.status}
                                  onChange={(e) =>
                                    patchActive('status', e.target.value as TopicStatus, 'status')
                                  }
                                >
                                  {(
                                    ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as TopicStatus[]
                                  ).map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Courses */}
                        <div className="art-drawer__section art-drawer__section--courses">
                          <div className="art-section-title art-drawer__section-title">
                            📚 Khóa học của chủ đề
                          </div>
                          <p className="art-section-hint">
                            Chọn các khóa học liên quan đến chủ đề này (tùy chọn).
                          </p>

                          {activeTopic.courseIds.length > 0 && (
                            <div className="art-drawer__course-stack">
                              {activeTopic.courseIds.map((courseId) => {
                                const course = courseOptions.find((c) => c.id === courseId);
                                if (!course) return null;
                                return (
                                  <div key={courseId} className="art-drawer__course-pill">
                                    <span className="art-drawer__course-title">{course.title}</span>
                                    <button
                                      type="button"
                                      className="art-drawer__course-remove"
                                      onClick={() =>
                                        patchActive(
                                          'courseIds',
                                          activeTopic.courseIds.filter((id) => id !== courseId),
                                          'courseId'
                                        )
                                      }
                                      aria-label={`Gỡ ${course.title}`}
                                    >
                                      <X size={16} strokeWidth={2} aria-hidden />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button
                            type="button"
                            className="art-btn art-btn--pick"
                            onClick={() => setCoursePickerOpen(true)}
                          >
                            <Plus size={16} strokeWidth={2.25} aria-hidden />
                            Thêm khóa học
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
                  <motion.div
                    className="art-picker art-picker--studio"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="art-picker__inner">
                      <div className="art-picker__header">
                        <h2 className="art-picker__title">Chọn khóa học</h2>
                        <button
                          type="button"
                          className="art-drawer__close"
                          onClick={() => setCoursePickerOpen(false)}
                          aria-label="Đóng"
                        >
                          <X size={18} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                      <div className="art-picker__search">
                        <input
                          className="art-input art-picker__input"
                          placeholder="🔍 Tìm khóa học (nhấn Esc để đóng)..."
                          value={courseKw}
                          onChange={(e) => setCourseKw(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setCoursePickerOpen(false);
                            }
                          }}
                          autoFocus
                        />
                        {coursesQuery.isFetching && (
                          <div className="art-picker__search-spinner">
                            <span className="spinner">⏳</span>
                          </div>
                        )}
                      </div>
                      {!coursesQuery.isLoading && courseOptions.length > 0 && (
                        <div className="art-picker__result-count">
                          Tìm thấy {courseOptions.length} khóa học{courseKw && ` cho "${courseKw}"`}
                        </div>
                      )}
                      {coursesQuery.isLoading && <p className="art-loading-text">Đang tải...</p>}
                      {!coursesQuery.isLoading && courseOptions.length === 0 && (
                        <p className="art-loading-text">
                          Không tìm thấy khóa học nào{courseKw ? ` cho "${courseKw}"` : ''}.
                        </p>
                      )}
                      <div className="art-picker__grid">
                        {courseOptions.map((c) => {
                          const isSelected = activeTopic?.courseIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`art-picker__card ${isSelected ? 'art-picker__card--selected' : ''}`}
                              onClick={() => {
                                if (!activeTopic) return;
                                if (isSelected) {
                                  patchActive(
                                    'courseIds',
                                    activeTopic.courseIds.filter((id) => id !== c.id),
                                    'courseId'
                                  );
                                } else {
                                  patchActive(
                                    'courseIds',
                                    [...activeTopic.courseIds, c.id],
                                    'courseId'
                                  );
                                }
                              }}
                            >
                              {c.thumbnailUrl && (
                                <img
                                  className="art-picker__card-thumb"
                                  src={c.thumbnailUrl}
                                  alt={c.title}
                                />
                              )}
                              <div className="art-picker__card-body">
                                <strong className="art-picker__card-title">{c.title}</strong>
                                {c.description && (
                                  <p className="art-picker__card-desc">{c.description}</p>
                                )}
                              </div>
                              {isSelected && <div className="art-picker__card-check">✓</div>}
                            </button>
                          );
                        })}
                      </div>
                      <div
                        style={{
                          padding: '16px 24px',
                          borderTop: '1.5px solid #f3f4f6',
                          background: '#fafafa',
                        }}
                      >
                        <button
                          type="button"
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
                    <p className="art-modal__body">
                      Bạn có chắc muốn xóa chủ đề "
                      {topics.find((t) => t.clientId === deleteId)?.title || '(trống)'}"?
                    </p>
                    <div className="art-modal__actions">
                      <button
                        type="button"
                        className="art-btn art-btn--delete"
                        onClick={() => {
                          const t = topics.find((n) => n.clientId === deleteId);
                          if (t) deleteTopic(t);
                        }}
                      >
                        Xóa
                      </button>
                      <button type="button" className="art-btn" onClick={() => setDeleteId(null)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>,
            document.body
          )}
      </div>
    </>
  );
}
