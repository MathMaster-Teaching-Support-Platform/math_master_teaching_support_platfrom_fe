import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useLessonsByChapter } from '../../hooks/useLessons';
import {
  useAddRoadmapTopic,
  useAdminRoadmapDetail,
  useArchiveRoadmapTopic,
  useCreateRoadmapEntryTest,
  useUpdateRoadmapTopic,
} from '../../hooks/useRoadmaps';
import { AssessmentService } from '../../services/api/assessment.service';
import { CourseService } from '../../services/api/course.service';
import { RoadmapService } from '../../services/api/roadmap.service';
import type {
  AssessmentSearchApiResponse,
  AssessmentSearchItem,
  CourseResponse,
  RoadmapResourceOption,
  TopicStatus,
  UpdateRoadmapTopicRequest,
} from '../../types';
import './admin-roadmap-page.css';
import './admin-roadmap-topics-page.css';

type TopicDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
type TopicFieldKey = keyof UpdateRoadmapTopicRequest;
type MaterialTab =
  | 'LESSON'
  | 'TEMPLATE_SLIDE'
  | 'ASSESSMENT'
  | 'LESSON_PLAN'
  | 'MINDMAP'
  | 'COURSE';

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

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

interface TopicNodeDraft {
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

const resequenceNodes = (nodes: TopicNodeDraft[]) =>
  nodes.map((node, index) => ({
    ...node,
    sequenceOrder: index + 1,
  }));

const TOPIC_STATUSES: TopicStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED'];

const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  LOCKED: 'Đã khóa',
};

const DIFFICULTY_LABELS: Record<TopicDifficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const MATERIAL_TAB_LABELS: Record<MaterialTab, string> = {
  LESSON: 'Bài học',
  TEMPLATE_SLIDE: 'Slide mẫu',
  ASSESSMENT: 'Bài kiểm tra',
  LESSON_PLAN: 'Giáo án',
  MINDMAP: 'Sơ đồ tư duy',
  COURSE: 'Khóa học',
};

const extractHttpStatus = (error: unknown) => {
  if (typeof error === 'object' && error && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }

  const message = error instanceof Error ? error.message : '';
  const statusRegex = /^(\d{3})\b/;
  const match = statusRegex.exec(message);
  if (!match) return null;

  return Number(match[1]);
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  return error.message.replace(/^\d{3}\s+[^:]+:\s*/, '').trim() || fallback;
};

const normalizeAssessmentSearchResults = (payload: AssessmentSearchApiResponse | undefined) => {
  if (!payload) return [] as AssessmentSearchItem[];
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.assessments)) return payload.assessments;
  if (Array.isArray(payload.result?.assessments)) return payload.result.assessments;
  return [] as AssessmentSearchItem[];
};

const setIfChanged = <T,>(
  payload: UpdateRoadmapTopicRequest,
  field: TopicFieldKey,
  value: T,
  baselineValue: T,
  dirty: Set<TopicFieldKey>
) => {
  if (!dirty.has(field) || value === baselineValue) return;

  Object.assign(payload, { [field]: value });
};

const areSameIds = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
};

const buildUpdatePayload = (node: TopicNodeDraft): UpdateRoadmapTopicRequest => {
  if (node.isDraft || !node.baseline) return {};

  const dirty = new Set(node.dirtyFields);
  const payload: UpdateRoadmapTopicRequest = {};

  setIfChanged(payload, 'title', node.title, node.baseline.title, dirty);
  setIfChanged(payload, 'description', node.description, node.baseline.description, dirty);
  setIfChanged(payload, 'difficulty', node.difficulty, node.baseline.difficulty, dirty);
  setIfChanged(payload, 'sequenceOrder', node.sequenceOrder, node.baseline.sequenceOrder, dirty);
  setIfChanged(payload, 'mark', node.mark, node.baseline.mark, dirty);
  setIfChanged(
    payload,
    'topicAssessmentId',
    node.topicAssessmentId,
    node.baseline.topicAssessmentId,
    dirty
  );
  if (dirty.has('courseIds') && !areSameIds(node.courseIds, node.baseline.courseIds)) {
    payload.courseIds = node.courseIds;
  }
  setIfChanged(payload, 'status', node.status, node.baseline.status, dirty);

  if (dirty.has('lessonIds') && !areSameIds(node.lessonIds, node.baseline.lessonIds)) {
    payload.lessonIds = node.lessonIds;
  }
  if (dirty.has('slideLessonIds') && !areSameIds(node.slideLessonIds, node.baseline.slideLessonIds)) {
    payload.slideLessonIds = node.slideLessonIds;
  }
  if (dirty.has('assessmentIds') && !areSameIds(node.assessmentIds, node.baseline.assessmentIds)) {
    payload.assessmentIds = node.assessmentIds;
  }
  if (dirty.has('lessonPlanIds') && !areSameIds(node.lessonPlanIds, node.baseline.lessonPlanIds)) {
    payload.lessonPlanIds = node.lessonPlanIds;
  }
  if (dirty.has('mindmapIds') && !areSameIds(node.mindmapIds, node.baseline.mindmapIds)) {
    payload.mindmapIds = node.mindmapIds;
  }

  return payload;
};

const validateTopicMarkOrder = (
  activeNode: TopicNodeDraft,
  nodes: TopicNodeDraft[]
): { valid: true } | { valid: false; message: string } => {
  const sortedNodes = [...nodes].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const index = sortedNodes.findIndex((node) => node.clientId === activeNode.clientId);
  if (index < 0) {
    return { valid: true };
  }

  const previousNode = index > 0 ? sortedNodes[index - 1] : null;
  const nextNode = index < sortedNodes.length - 1 ? sortedNodes[index + 1] : null;

  if (previousNode && activeNode.mark <= previousNode.mark) {
    return {
      valid: false,
      message: `Điểm mốc của chủ đề ${activeNode.sequenceOrder} (${activeNode.mark}) phải lớn hơn chủ đề ${previousNode.sequenceOrder} (${previousNode.mark}).`,
    };
  }

  if (nextNode && activeNode.mark >= nextNode.mark) {
    return {
      valid: false,
      message: `Điểm mốc của chủ đề ${activeNode.sequenceOrder} (${activeNode.mark}) phải nhỏ hơn chủ đề ${nextNode.sequenceOrder} (${nextNode.mark}) để giữ thứ tự tăng dần.`,
    };
  }

  return { valid: true };
};

export default function AdminRoadmapTopicsPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();
  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const addTopic = useAddRoadmapTopic();
  const updateTopic = useUpdateRoadmapTopic();
  const archiveTopic = useArchiveRoadmapTopic();
  const createEntryTest = useCreateRoadmapEntryTest();

  const [nodes, setNodes] = useState<TopicNodeDraft[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeMaterialTab, setActiveMaterialTab] = useState<MaterialTab>('LESSON');
  const [entryAssessmentId, setEntryAssessmentId] = useState('');
  const [selectedEntryAssessment, setSelectedEntryAssessment] = useState<AssessmentSearchItem | null>(null);
  const [entryAssessmentQuery, setEntryAssessmentQuery] = useState('');
  const [debouncedEntryAssessmentQuery, setDebouncedEntryAssessmentQuery] = useState('');

  useEffect(() => {
    const timer = globalThis.setTimeout(
      () => setDebouncedEntryAssessmentQuery(entryAssessmentQuery.trim()),
      350
    );
    return () => globalThis.clearTimeout(timer);
  }, [entryAssessmentQuery]);

  useEffect(() => {
    const topics = roadmapDetail.data?.result.topics;
    if (!topics) return;

    const mapped = [...topics]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map((topic) => {
        const lessonPlanIds = topic.lessonPlanIds ?? [];
        const lessonIds = topic.lessonIds ?? [];
        const slideLessonIds = topic.slideLessonIds ?? [];
        const assessmentIds = topic.assessmentIds ?? [];
        const mindmapIds = topic.mindmapIds ?? [];
        const courseIds = topic.courseIds ?? topic.courses?.map((course) => course.id) ?? [];

        return {
          clientId: `persisted-${topic.id}`,
          persistedId: topic.id,
          title: topic.title,
          description: topic.description ?? '',
          difficulty: topic.difficulty,
          sequenceOrder: topic.sequenceOrder,
          mark: topic.mark ?? 0,
          topicAssessmentId: topic.topicAssessmentId ?? '',
          courseIds,
          status: topic.status,
          selectedChapterId: '',
          lessonKeyword: '',
          lessonIds,
          slideLessonIds,
          assessmentIds,
          selectedResourceLessonId: lessonIds[0] ?? '',
          resourceKeyword: '',
          lessonPlanIds,
          mindmapIds,
          isDraft: false,
          dirtyFields: [],
          baseline: {
            title: topic.title,
            description: topic.description ?? '',
            difficulty: topic.difficulty,
            sequenceOrder: topic.sequenceOrder,
            mark: topic.mark ?? 0,
            topicAssessmentId: topic.topicAssessmentId ?? '',
            courseIds,
            status: topic.status,
            lessonIds,
            slideLessonIds,
            assessmentIds,
            lessonPlanIds,
            mindmapIds,
          },
        };
      });

    setNodes(mapped);
  }, [roadmapDetail.data?.result.topics]);

  useEffect(() => {
    if (!toast) return;

    const timer = globalThis.setTimeout(() => setToast(null), 3000);
    return () => globalThis.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const status = extractHttpStatus(roadmapDetail.error);
    if (status === 401) {
      void navigate('/login', { replace: true });
    }
  }, [navigate, roadmapDetail.error]);

  const activeNode = nodes.find((node) => node.clientId === activeNodeId) ?? null;
  const deleteTarget = nodes.find((node) => node.clientId === deleteTargetId) ?? null;
  const isSubmitting = addTopic.isPending || updateTopic.isPending || archiveTopic.isPending;

  const subjectId = roadmapDetail.data?.result.subjectId ?? '';
  const chaptersQuery = useChaptersBySubject(subjectId, isTopicModalOpen && !!activeNode);
  const [debouncedLessonKeyword, setDebouncedLessonKeyword] = useState('');
  const [debouncedResourceKeyword, setDebouncedResourceKeyword] = useState('');

  useEffect(() => {
    const timer = globalThis.setTimeout(
      () => setDebouncedLessonKeyword(activeNode?.lessonKeyword.trim() ?? ''),
      300
    );
    return () => globalThis.clearTimeout(timer);
  }, [activeNode?.lessonKeyword]);

  useEffect(() => {
    const timer = globalThis.setTimeout(
      () => setDebouncedResourceKeyword(activeNode?.resourceKeyword.trim() ?? ''),
      300
    );
    return () => globalThis.clearTimeout(timer);
  }, [activeNode?.resourceKeyword]);

  const lessonsQuery = useLessonsByChapter(
    activeNode?.selectedChapterId ?? '',
    debouncedLessonKeyword,
    isTopicModalOpen && !!activeNode?.selectedChapterId
  );

  const templateSlideQuery = useQuery({
    queryKey: [
      'roadmap-resource-options',
      'TEMPLATE_SLIDE',
      activeNode?.selectedChapterId ?? '',
      activeNode?.selectedResourceLessonId ?? '',
      debouncedResourceKeyword,
    ],
    queryFn: () =>
      RoadmapService.getRoadmapResourceOptions({
        type: 'TEMPLATE_SLIDE',
        chapterId: activeNode?.selectedChapterId || undefined,
        lessonId: activeNode?.selectedResourceLessonId || undefined,
        name: debouncedResourceKeyword || undefined,
      }),
    enabled:
      isTopicModalOpen &&
      activeMaterialTab === 'TEMPLATE_SLIDE' &&
      !!activeNode?.selectedChapterId &&
      !!activeNode?.selectedResourceLessonId,
  });

  const mindmapQuery = useQuery({
    queryKey: [
      'roadmap-resource-options',
      'MINDMAP',
      activeNode?.selectedResourceLessonId ?? '',
      debouncedResourceKeyword,
    ],
    queryFn: () =>
      RoadmapService.getRoadmapResourceOptions({
        type: 'MINDMAP',
        lessonId: activeNode?.selectedResourceLessonId || undefined,
        name: debouncedResourceKeyword || undefined,
      }),
    enabled:
      isTopicModalOpen &&
      activeMaterialTab === 'MINDMAP' &&
      !!activeNode?.selectedResourceLessonId,
  });

  const lessonPlanQuery = useQuery({
    queryKey: [
      'roadmap-resource-options',
      'LESSON_PLAN',
      activeNode?.selectedResourceLessonId ?? '',
      debouncedResourceKeyword,
    ],
    queryFn: () =>
      RoadmapService.getRoadmapResourceOptions({
        type: 'LESSON_PLAN',
        lessonId: activeNode?.selectedResourceLessonId || undefined,
        name: debouncedResourceKeyword || undefined,
      }),
    enabled:
      isTopicModalOpen &&
      activeMaterialTab === 'LESSON_PLAN' &&
      !!activeNode?.selectedResourceLessonId,
  });

  const assessmentQuery = useQuery({
    queryKey: ['roadmap-resource-options', 'ASSESSMENT', debouncedResourceKeyword],
    queryFn: () =>
      RoadmapService.getRoadmapResourceOptions({
        type: 'ASSESSMENT',
        name: debouncedResourceKeyword || undefined,
      }),
    enabled: isTopicModalOpen && activeMaterialTab === 'ASSESSMENT',
  });

  const courseQuery = useQuery({
    queryKey: ['courses', 'public', subjectId, debouncedResourceKeyword],
    queryFn: () =>
      CourseService.getPublicCourses({
        subjectId: subjectId || undefined,
        keyword: debouncedResourceKeyword || undefined,
        size: 30,
      }),
    enabled: isTopicModalOpen && activeMaterialTab === 'COURSE',
  });

  const entryAssessmentSearchQuery = useQuery({
    queryKey: ['assessments', 'search', debouncedEntryAssessmentQuery, subjectId],
    queryFn: () =>
      AssessmentService.searchAssessments(
        debouncedEntryAssessmentQuery,
        'PUBLIC'
      ),
    enabled: debouncedEntryAssessmentQuery.length >= 2,
  });

  const rowCount = Math.max(1, Math.ceil(nodes.length / 5));
  const roadHeight = Math.max(680, rowCount * 190 + 120);

  const getNodePosition = (index: number) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const reversedCol = row % 2 === 1 ? 4 - col : col;
    return {
      left: `${8 + reversedCol * 21}%`,
      top: `${70 + row * 180}px`,
    };
  };

  const createDraftNode = () => {
    const draft: TopicNodeDraft = {
      clientId: `draft-${Date.now()}`,
      title: `Chủ đề ${nodes.length + 1}`,
      description: '',
      difficulty: 'EASY',
      sequenceOrder: nodes.length + 1,
      mark: 0,
      topicAssessmentId: '',
      courseIds: [],
      status: 'NOT_STARTED',
      selectedChapterId: '',
      lessonKeyword: '',
      lessonIds: [],
      slideLessonIds: [],
      assessmentIds: [],
      selectedResourceLessonId: '',
      resourceKeyword: '',
      lessonPlanIds: [],
      mindmapIds: [],
      isDraft: true,
      dirtyFields: [],
    };

    setNodes((previous) => resequenceNodes([...previous, draft]));
    setActiveNodeId(draft.clientId);
    setActiveMaterialTab('LESSON');
    setIsTopicModalOpen(true);
  };

  const openNodePopup = (clientId: string) => {
    setActiveNodeId(clientId);
    setIsTopicModalOpen(true);
  };

  const updateActiveNode = <K extends keyof TopicNodeDraft>(
    field: K,
    value: TopicNodeDraft[K],
    dirtyField?: TopicFieldKey
  ) => {
    if (!activeNodeId) return;
    setNodes((previous) =>
      previous.map((node) => {
        if (node.clientId !== activeNodeId) return node;

        const nextDirtyFields =
          !node.isDraft && dirtyField && !node.dirtyFields.includes(dirtyField)
            ? [...node.dirtyFields, dirtyField]
            : node.dirtyFields;

        return {
          ...node,
          [field]: value,
          dirtyFields: nextDirtyFields,
        };
      })
    );
  };

  const toggleActiveNodeIdList = (
    field:
      | 'lessonIds'
      | 'slideLessonIds'
      | 'assessmentIds'
      | 'lessonPlanIds'
      | 'mindmapIds'
      | 'courseIds',
    id: string,
    checked: boolean
  ) => {
    if (!activeNode) return;
    const current = activeNode[field];
    const next = checked ? [...current, id] : current.filter((item) => item !== id);

    if (field === 'lessonIds') {
      const nextSelectedLessonId = next.includes(activeNode.selectedResourceLessonId)
        ? activeNode.selectedResourceLessonId
        : next[0] ?? '';
      updateActiveNode('selectedResourceLessonId', nextSelectedLessonId);
    }

    updateActiveNode(field, next, field);
  };

  const dropOnNode = (targetId: string) => {
    if (!draggingNodeId || draggingNodeId === targetId) return;
    setNodes((previous) => {
      const fromIndex = previous.findIndex((node) => node.clientId === draggingNodeId);
      const toIndex = previous.findIndex((node) => node.clientId === targetId);
      if (fromIndex < 0 || toIndex < 0) return previous;
      const clone = [...previous];
      const [moved] = clone.splice(fromIndex, 1);
      clone.splice(toIndex, 0, moved);
      return resequenceNodes(clone);
    });
  };

  const deleteDraftNode = (clientId: string) => {
    setNodes((previous) => {
      const target = previous.find((node) => node.clientId === clientId);
      if (!target?.isDraft) return previous;
      return resequenceNodes(previous.filter((node) => node.clientId !== clientId));
    });

    if (activeNodeId === clientId) {
      setActiveNodeId(null);
      setIsTopicModalOpen(false);
    }
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    const status = extractHttpStatus(error);
    if (status === 401) {
      setToast({ type: 'error', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      void navigate('/login', { replace: true });
      return;
    }
    if (status === 403) {
      setToast({ type: 'error', message: 'Bạn không có quyền thao tác. Cần quyền ADMIN.' });
      return;
    }
    if (status === 404) {
      setToast({
        type: 'error',
        message:
          'Không tìm thấy chủ đề hoặc lộ trình. Có thể dữ liệu đã bị lưu trữ hoặc liên kết không hợp lệ.',
      });
      return;
    }

    setToast({ type: 'error', message: extractErrorMessage(error, fallback) });
  };

  const saveActiveNode = () => {
    if (!roadmapId || !activeNode || isSubmitting) return;

    const markValidation = validateTopicMarkOrder(activeNode, nodes);
    if (!markValidation.valid) {
      setToast({ type: 'error', message: markValidation.message });
      return;
    }

    if (activeNode.isDraft) {
      if (!activeNode.title || activeNode.lessonIds.length === 0) return;

      addTopic.mutate(
        {
          roadmapId,
          payload: {
            title: activeNode.title,
            description: activeNode.description,
            difficulty: activeNode.difficulty,
            sequenceOrder: activeNode.sequenceOrder,
            mark: activeNode.mark,
            lessonIds: activeNode.lessonIds,
            slideLessonIds: activeNode.slideLessonIds,
            assessmentIds: activeNode.assessmentIds,
            lessonPlanIds: activeNode.lessonPlanIds,
            mindmapIds: activeNode.mindmapIds,
            topicAssessmentId: activeNode.topicAssessmentId || undefined,
            courseIds: activeNode.courseIds,
          },
        },
        {
          onSuccess: () => {
            setToast({ type: 'success', message: 'Tạo chủ đề lộ trình thành công.' });
            setIsTopicModalOpen(false);
            setActiveNodeId(null);
            void roadmapDetail.refetch();
          },
          onError: (error) => handleMutationError(error, 'Không thể tạo chủ đề lộ trình.'),
        }
      );
      return;
    }

    if (!activeNode.persistedId) return;

    const payload = buildUpdatePayload(activeNode);
    if (Object.keys(payload).length === 0) {
      setToast({ type: 'error', message: 'Không phát hiện thay đổi cho chủ đề này.' });
      return;
    }

    updateTopic.mutate(
      { roadmapId, topicId: activeNode.persistedId, payload },
      {
        onSuccess: () => {
          setToast({ type: 'success', message: 'Cập nhật chủ đề lộ trình thành công.' });
          setIsTopicModalOpen(false);
          setActiveNodeId(null);
          void roadmapDetail.refetch();
        },
        onError: (error) => handleMutationError(error, 'Không thể cập nhật chủ đề lộ trình.'),
      }
    );
  };

  const confirmArchiveTopic = () => {
    if (!roadmapId || !deleteTarget?.persistedId || isSubmitting) return;

    archiveTopic.mutate(
      {
        roadmapId,
        topicId: deleteTarget.persistedId,
      },
      {
        onSuccess: () => {
          setToast({ type: 'success', message: 'Lưu trữ chủ đề lộ trình thành công.' });
          setDeleteTargetId(null);
          setIsTopicModalOpen(false);
          setActiveNodeId(null);
          void roadmapDetail.refetch();
        },
        onError: (error) => handleMutationError(error, 'Không thể lưu trữ chủ đề lộ trình.'),
      }
    );
  };

  const submitEntryTestConfig = () => {
    const selectedAssessmentId = selectedEntryAssessment?.id || entryAssessmentId.trim();
    if (!roadmapId || !selectedAssessmentId) {
      setToast({ type: 'error', message: 'Vui lòng tìm kiếm và chọn bài kiểm tra trước.' });
      return;
    }

    createEntryTest.mutate(
      {
        roadmapId,
        payload: {
          assessmentId: selectedAssessmentId,
        },
      },
      {
        onSuccess: () => {
          setToast({ type: 'success', message: 'Thiết lập bài kiểm tra đầu vào thành công.' });
        },
        onError: (error) => handleMutationError(error, 'Không thể thiết lập bài kiểm tra đầu vào.'),
      }
    );
  };

  const difficultyClass = (difficulty: TopicDifficulty) => {
    if (difficulty === 'MEDIUM') return 'admin-roadmap-page__topic-node--medium';
    if (difficulty === 'HARD') return 'admin-roadmap-page__topic-node--hard';
    return 'admin-roadmap-page__topic-node--easy';
  };

  const title = useMemo(
    () => roadmapDetail.data?.result.name ?? 'Thiết kế chủ đề lộ trình',
    [roadmapDetail.data]
  );
  const chapters = chaptersQuery.data?.result ?? [];
  const lessons = lessonsQuery.data?.result ?? [];
  const templateSlideOptions: RoadmapResourceOption[] = templateSlideQuery.data?.result ?? [];
  const mindmapOptions: RoadmapResourceOption[] = mindmapQuery.data?.result ?? [];
  const lessonPlanOptions: RoadmapResourceOption[] = lessonPlanQuery.data?.result ?? [];
  const assessmentOptions: RoadmapResourceOption[] = assessmentQuery.data?.result ?? [];
  const courseOptions: CourseResponse[] = courseQuery.data?.result?.content ?? [];
  const searchedAssessments = normalizeAssessmentSearchResults(entryAssessmentSearchQuery.data);
  const roadmapErrorStatus = extractHttpStatus(roadmapDetail.error);
  let submitButtonLabel = 'Lưu thay đổi';
  if (activeNode?.isDraft) {
    submitButtonLabel = 'Lưu chủ đề';
  }
  if (updateTopic.isPending) {
    submitButtonLabel = 'Đang lưu...';
  }
  if (addTopic.isPending) {
    submitButtonLabel = 'Đang thêm...';
  }

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
    >
      <section className="admin-roadmap-topics-page">
        <header className="admin-roadmap-topics-page__header">
          <div>
            <h1>Sơ đồ chủ đề lộ trình</h1>
            <p>{title} - tạo, chỉnh sửa và lưu trữ chủ đề trực tiếp trên bảng này.</p>
          </div>
          <div className="admin-roadmap-topics-page__header-actions">
            <button
              type="button"
              className="admin-roadmap-page__button"
              onClick={() => navigate(`/admin/roadmaps/edit/${roadmapId}`)}
            >
              Quay lại chỉnh sửa lộ trình
            </button>
            <button type="button" className="admin-roadmap-page__button" onClick={createDraftNode}>
              Thêm chủ đề
            </button>
          </div>
        </header>

        {roadmapDetail.isLoading && <p className="admin-roadmap-page__state">Đang tải lộ trình...</p>}
        {roadmapDetail.error && roadmapErrorStatus !== 403 && roadmapErrorStatus !== 401 && (
          <p className="admin-roadmap-page__state">Không thể tải lộ trình.</p>
        )}
        {roadmapErrorStatus === 403 && (
          <p className="admin-roadmap-page__state">Bạn cần quyền ADMIN để quản lý chủ đề lộ trình.</p>
        )}

        {!roadmapDetail.isLoading && !roadmapDetail.error && (
          <section
            className="admin-roadmap-topics-page__snake-road"
            style={{ minHeight: `${roadHeight}px` }}
          >
            <svg
              className="admin-roadmap-topics-page__snake-svg"
              viewBox={`0 0 1000 ${roadHeight}`}
              preserveAspectRatio="none"
            >
              {Array.from({ length: rowCount }).map((_, row) => {
                const y = 95 + row * 180;
                const d =
                  row % 2 === 0
                    ? `M80,${y} C300,${y - 55} 700,${y + 55} 920,${y}`
                    : `M920,${y} C700,${y - 55} 300,${y + 55} 80,${y}`;
                return (
                  <path
                    key={`snake-row-${y}`}
                    d={d}
                    className="admin-roadmap-topics-page__snake-line"
                  />
                );
              })}
            </svg>

            <div className="admin-roadmap-topics-page__nodes-layer">
              {nodes.map((node, index) => (
                <div
                  key={node.clientId}
                  className="admin-roadmap-topics-page__node-wrap"
                  style={getNodePosition(index)}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggingNodeId(node.clientId)}
                    onDragEnd={() => setDraggingNodeId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropOnNode(node.clientId)}
                    onClick={() => openNodePopup(node.clientId)}
                    className={`admin-roadmap-page__topic-node admin-roadmap-topics-page__node ${difficultyClass(
                      node.difficulty
                    )} ${activeNodeId === node.clientId ? 'admin-roadmap-page__topic-node--active' : ''}`}
                  >
                    <span className="admin-roadmap-page__topic-order">{node.sequenceOrder}</span>
                    {node.isDraft && <em className="admin-roadmap-page__topic-badge">Bản nháp</em>}
                    <strong>{node.title}</strong>
                    <small>{DIFFICULTY_LABELS[node.difficulty]}</small>
                  </button>

                  {node.isDraft && (
                    <button
                      type="button"
                      className="admin-roadmap-topics-page__node-delete"
                      aria-label="Xóa chủ đề nháp"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteDraftNode(node.clientId);
                      }}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-roadmap-topics-page__entry-test-card">
          <header>
            <h3>Thiết lập bài kiểm tra đầu vào</h3>
          </header>

          <label className="admin-roadmap-topics-page__entry-field">
            <span>Tìm theo tên bài kiểm tra</span>
            <input
              value={entryAssessmentQuery}
              onChange={(event) => setEntryAssessmentQuery(event.target.value)}
              placeholder="Nhập tên bài kiểm tra..."
              disabled={createEntryTest.isPending}
            />
          </label>

          {entryAssessmentSearchQuery.isLoading && (
            <p className="admin-roadmap-page__state">Đang tìm bài kiểm tra...</p>
          )}
          {entryAssessmentSearchQuery.error && (
            <p className="admin-roadmap-page__state">Không thể tìm bài kiểm tra.</p>
          )}

          {debouncedEntryAssessmentQuery.length >= 2 &&
            !entryAssessmentSearchQuery.isLoading &&
            !entryAssessmentSearchQuery.error && (
              <div className="admin-roadmap-topics-page__search-results">
                {searchedAssessments.map((assessment) => (
                  <article
                    key={assessment.id}
                    className="admin-roadmap-topics-page__search-result-item"
                  >
                    <div>
                      <strong>{assessment.title}</strong>
                      <p>{assessment.description || 'Không có mô tả'}</p>
                      <small>
                        Số câu hỏi: {assessment.questionCount ?? 0}
                        {assessment.subject ? ` • ${assessment.subject}` : ''}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="admin-roadmap-page__button"
                      onClick={() => {
                        setEntryAssessmentId(assessment.id);
                        setSelectedEntryAssessment(assessment);
                      }}
                      disabled={createEntryTest.isPending}
                    >
                      Chọn
                    </button>
                  </article>
                ))}
                {searchedAssessments.length === 0 && (
                  <p className="admin-roadmap-page__state">Không tìm thấy bài kiểm tra phù hợp.</p>
                )}
              </div>
            )}

          {selectedEntryAssessment && (
            <p className="admin-roadmap-page__state">
              Đã chọn: {selectedEntryAssessment.title}
            </p>
          )}

          <div className="admin-roadmap-page__actions">
            <button
              type="button"
              className="admin-roadmap-page__button"
              onClick={submitEntryTestConfig}
              disabled={createEntryTest.isPending || !selectedEntryAssessment}
            >
              {createEntryTest.isPending ? 'Đang lưu...' : 'Lưu thiết lập bài kiểm tra đầu vào'}
            </button>
          </div>
        </section>

        {isTopicModalOpen && activeNode && (
          <div className="admin-roadmap-page__modal-backdrop">
            <dialog className="admin-roadmap-page__modal" open>
              <header className="admin-roadmap-page__modal-header">
                <h3>Chi tiết chủ đề</h3>
                <button
                  type="button"
                  className="admin-roadmap-page__modal-close"
                  onClick={() => setIsTopicModalOpen(false)}
                >
                  Đóng
                </button>
              </header>

              <div className="admin-roadmap-page__form-grid">
                <label>
                  <span>Tên chủ đề</span>
                  <input
                    value={activeNode.title}
                    onChange={(event) => updateActiveNode('title', event.target.value, 'title')}
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Độ khó</span>
                  <select
                    value={activeNode.difficulty}
                    onChange={(event) =>
                      updateActiveNode(
                        'difficulty',
                        event.target.value as TopicDifficulty,
                        'difficulty'
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </label>
                <label>
                  <span>Trạng thái</span>
                  <select
                    value={activeNode.status}
                    onChange={(event) =>
                      updateActiveNode('status', event.target.value as TopicStatus, 'status')
                    }
                    disabled={activeNode.isDraft || isSubmitting}
                  >
                    {TOPIC_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {TOPIC_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Chương</span>
                  <select
                    value={activeNode.selectedChapterId}
                    onChange={(event) => {
                      updateActiveNode('selectedChapterId', event.target.value);
                      updateActiveNode('lessonKeyword', '');
                      updateActiveNode('selectedResourceLessonId', '');
                    }}
                    disabled={isSubmitting || chaptersQuery.isLoading || chapters.length === 0}
                  >
                    <option value="">Chọn chương</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title || chapter.name || chapter.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Từ khóa tìm bài học</span>
                  <input
                    value={activeNode.lessonKeyword}
                    onChange={(event) => updateActiveNode('lessonKeyword', event.target.value)}
                    placeholder="Tìm bài học theo tên"
                    disabled={isSubmitting || !activeNode.selectedChapterId}
                  />
                </label>
                <label>
                  <span>Mô tả chủ đề</span>
                  <textarea
                    rows={3}
                    value={activeNode.description}
                    onChange={(event) =>
                      updateActiveNode('description', event.target.value, 'description')
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Thứ tự</span>
                  <input type="number" min={1} value={activeNode.sequenceOrder} readOnly />
                </label>
                <label>
                  <span>Điểm mốc (0-10)</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={activeNode.mark}
                    onChange={(event) =>
                      updateActiveNode('mark', Number(event.target.value) || 0, 'mark')
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>ID bài kiểm tra của chủ đề (không bắt buộc)</span>
                  <input
                    value={activeNode.topicAssessmentId}
                    onChange={(event) =>
                      updateActiveNode('topicAssessmentId', event.target.value, 'topicAssessmentId')
                    }
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <section className="admin-roadmap-topics-page__material-panel">
                <header>
                  <h4>Tài nguyên chủ đề</h4>
                  <p>Hãy chọn bài học trước, sau đó gắn slide mẫu, sơ đồ tư duy, giáo án và bài kiểm tra.</p>
                </header>

                <div className="admin-roadmap-topics-page__material-tabs">
                  {(
                    ['LESSON', 'TEMPLATE_SLIDE', 'ASSESSMENT', 'LESSON_PLAN', 'MINDMAP', 'COURSE'] as MaterialTab[]
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`admin-roadmap-topics-page__material-tab ${activeMaterialTab === tab ? 'admin-roadmap-topics-page__material-tab--active' : ''}`}
                      onClick={() => setActiveMaterialTab(tab)}
                    >
                      {MATERIAL_TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>

                {activeMaterialTab === 'LESSON' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    <p className="admin-roadmap-page__state">
                      Dùng chương và từ khóa để tìm bài học, sau đó chọn một hoặc nhiều bài học.
                    </p>
                    {!activeNode.selectedChapterId && (
                      <p className="admin-roadmap-page__state">Hãy chọn chương để tải danh sách bài học.</p>
                    )}
                    {activeNode.selectedChapterId && lessonsQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải bài học...</p>
                    )}
                    {activeNode.selectedChapterId && lessonsQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải bài học.</p>
                    )}
                    {activeNode.selectedChapterId && !lessonsQuery.isLoading && !lessonsQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {lessons.map((lesson) => (
                          <label key={lesson.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.lessonIds.includes(lesson.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('lessonIds', lesson.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{lesson.title || lesson.id}</span>
                          </label>
                        ))}
                        {lessons.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy bài học trong chương này.</p>
                        )}
                      </div>
                    )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn bài học: {activeNode.lessonIds.length}
                    </p>
                  </div>
                )}

                {activeMaterialTab !== 'LESSON' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    <label>
                      <span>Từ khóa tìm tài nguyên</span>
                      <input
                        value={activeNode.resourceKeyword}
                        onChange={(event) => updateActiveNode('resourceKeyword', event.target.value)}
                        placeholder="Tìm theo tên tài nguyên"
                        disabled={isSubmitting}
                      />
                    </label>

                    {activeMaterialTab !== 'COURSE' && activeNode.lessonIds.length > 0 && (
                      <label>
                        <span>Bối cảnh bài học</span>
                        <select
                          value={activeNode.selectedResourceLessonId}
                          onChange={(event) =>
                            updateActiveNode('selectedResourceLessonId', event.target.value)
                          }
                          disabled={isSubmitting}
                        >
                          <option value="">Chọn bài học</option>
                          {activeNode.lessonIds.map((lessonId) => {
                            const lesson = lessons.find((item) => item.id === lessonId);
                            return (
                              <option key={lessonId} value={lessonId}>
                                {lesson?.title || lessonId}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}
                  </div>
                )}

                {activeMaterialTab === 'TEMPLATE_SLIDE' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    {!activeNode.selectedChapterId && (
                      <p className="admin-roadmap-page__state">Hãy chọn chương trước khi tìm slide mẫu.</p>
                    )}
                    {activeNode.lessonIds.length === 0 && (
                      <p className="admin-roadmap-page__state">Vui lòng chọn ít nhất một bài học trước.</p>
                    )}
                    {!!activeNode.selectedChapterId && !activeNode.selectedResourceLessonId && (
                      <p className="admin-roadmap-page__state">Chọn bối cảnh bài học để tải slide mẫu.</p>
                    )}
                    {templateSlideQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải slide mẫu...</p>
                    )}
                    {templateSlideQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải slide mẫu.</p>
                    )}
                    {!templateSlideQuery.isLoading && !templateSlideQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {templateSlideOptions.map((option) => (
                          <label key={option.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.slideLessonIds.includes(option.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('slideLessonIds', option.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{option.name}</span>
                          </label>
                        ))}
                        {templateSlideOptions.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy slide mẫu.</p>
                        )}
                      </div>
                    )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn slide mẫu: {activeNode.slideLessonIds.length}
                    </p>
                  </div>
                )}

                {activeMaterialTab === 'LESSON_PLAN' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    {activeNode.lessonIds.length === 0 && (
                      <p className="admin-roadmap-page__state">Hãy chọn bài học trước để tìm giáo án.</p>
                    )}
                    {!activeNode.selectedResourceLessonId && activeNode.lessonIds.length > 0 && (
                      <p className="admin-roadmap-page__state">Chọn bối cảnh bài học để tải giáo án.</p>
                    )}
                    {lessonPlanQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải giáo án...</p>
                    )}
                    {lessonPlanQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải giáo án.</p>
                    )}
                    {!lessonPlanQuery.isLoading && !lessonPlanQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {lessonPlanOptions.map((option) => (
                          <label key={option.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.lessonPlanIds.includes(option.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('lessonPlanIds', option.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{option.name}</span>
                          </label>
                        ))}
                        {lessonPlanOptions.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy giáo án.</p>
                        )}
                      </div>
                    )}

                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn giáo án: {activeNode.lessonPlanIds.length}
                    </p>
                  </div>
                )}

                {activeMaterialTab === 'MINDMAP' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    {activeNode.lessonIds.length === 0 && (
                      <p className="admin-roadmap-page__state">Hãy chọn bài học trước để tìm sơ đồ tư duy.</p>
                    )}
                    {!activeNode.selectedResourceLessonId && activeNode.lessonIds.length > 0 && (
                      <p className="admin-roadmap-page__state">Chọn bối cảnh bài học để tải sơ đồ tư duy.</p>
                    )}
                    {mindmapQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải sơ đồ tư duy...</p>
                    )}
                    {mindmapQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải sơ đồ tư duy.</p>
                    )}
                    {!mindmapQuery.isLoading && !mindmapQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {mindmapOptions.map((option) => (
                          <label key={option.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.mindmapIds.includes(option.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('mindmapIds', option.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{option.name}</span>
                          </label>
                        ))}
                        {mindmapOptions.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy sơ đồ tư duy.</p>
                        )}
                      </div>
                    )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn sơ đồ tư duy: {activeNode.mindmapIds.length}
                    </p>
                  </div>
                )}

                {activeMaterialTab === 'ASSESSMENT' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    <p className="admin-roadmap-page__state">
                      Danh sách bài kiểm tra được tìm toàn cục theo tên.
                    </p>
                    {assessmentQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải bài kiểm tra...</p>
                    )}
                    {assessmentQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải bài kiểm tra.</p>
                    )}
                    {!assessmentQuery.isLoading && !assessmentQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {assessmentOptions.map((option) => (
                          <label key={option.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.assessmentIds.includes(option.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('assessmentIds', option.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{option.name}</span>
                          </label>
                        ))}
                        {assessmentOptions.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy bài kiểm tra.</p>
                        )}
                      </div>
                    )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn bài kiểm tra: {activeNode.assessmentIds.length}
                    </p>
                  </div>
                )}

                {activeMaterialTab === 'COURSE' && (
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    <p className="admin-roadmap-page__state">
                      Danh sách khóa học theo môn học của roadmap và từ khóa tìm kiếm.
                    </p>
                    {courseQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Đang tải khóa học...</p>
                    )}
                    {courseQuery.error && (
                      <p className="admin-roadmap-page__state">Không thể tải khóa học.</p>
                    )}
                    {!courseQuery.isLoading && !courseQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {courseOptions.map((course) => (
                          <label key={course.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.courseIds.includes(course.id)}
                              onChange={(event) =>
                                toggleActiveNodeIdList('courseIds', course.id, event.target.checked)
                              }
                              disabled={isSubmitting}
                            />
                            <span>{course.title}</span>
                          </label>
                        ))}
                        {courseOptions.length === 0 && (
                          <p className="admin-roadmap-page__state">Không tìm thấy khóa học.</p>
                        )}
                      </div>
                    )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Đã chọn khóa học: {activeNode.courseIds.length}
                    </p>
                  </div>
                )}
              </section>

              <div className="admin-roadmap-page__actions">
                <button
                  type="button"
                  className="admin-roadmap-page__button"
                  disabled={
                    isSubmitting ||
                    !roadmapId ||
                    !activeNode.title ||
                    (activeNode.isDraft && activeNode.lessonIds.length === 0)
                  }
                  onClick={saveActiveNode}
                >
                  {submitButtonLabel}
                </button>
                {!activeNode.isDraft && (
                  <button
                    type="button"
                    className="admin-roadmap-topics-page__archive-button"
                    disabled={isSubmitting}
                    onClick={() => setDeleteTargetId(activeNode.clientId)}
                  >
                    Lưu trữ chủ đề
                  </button>
                )}
              </div>
            </dialog>
          </div>
        )}

        {deleteTarget && !deleteTarget.isDraft && (
          <div className="admin-roadmap-page__modal-backdrop">
            <dialog
              className="admin-roadmap-page__modal admin-roadmap-topics-page__confirm-modal"
              open
            >
              <header className="admin-roadmap-page__modal-header">
                <h3>Lưu trữ chủ đề</h3>
                <button
                  type="button"
                  className="admin-roadmap-page__modal-close"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={archiveTopic.isPending}
                >
                  Đóng
                </button>
              </header>

              <p className="admin-roadmap-page__state">
                Xác nhận lưu trữ chủ đề "{deleteTarget.title}". Dữ liệu lịch sử vẫn được giữ lại,
                nhưng chủ đề sẽ bị ẩn khỏi luồng lộ trình đang hoạt động.
              </p>

              <div className="admin-roadmap-page__actions">
                <button
                  type="button"
                  className="admin-roadmap-page__button"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={archiveTopic.isPending}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="admin-roadmap-topics-page__archive-button"
                  onClick={confirmArchiveTopic}
                  disabled={archiveTopic.isPending}
                >
                  {archiveTopic.isPending ? 'Đang lưu trữ...' : 'Xác nhận lưu trữ'}
                </button>
              </div>
            </dialog>
          </div>
        )}

        {toast && (
          <div
            className={`admin-roadmap-topics-page__toast admin-roadmap-topics-page__toast--${toast.type}`}
          >
            {toast.message}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
