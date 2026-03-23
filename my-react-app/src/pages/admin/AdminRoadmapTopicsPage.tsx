import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useLessonsByChapter } from '../../hooks/useLessons';
import {
  useAddRoadmapTopic,
  useAdminRoadmapDetail,
  useArchiveRoadmapTopic,
  useUpdateRoadmapTopic,
} from '../../hooks/useRoadmaps';
import type { TopicStatus, UpdateRoadmapTopicRequest } from '../../types';
import './admin-roadmap-page.css';
import './admin-roadmap-topics-page.css';

type TopicDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
type TopicFieldKey = keyof UpdateRoadmapTopicRequest;

interface PersistedTopicBaseline {
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  sequenceOrder: number;
  priority: number;
  estimatedHours: number;
  topicAssessmentId: string;
  passThresholdPercentage: number;
  status: TopicStatus;
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
  priority: number;
  estimatedHours: number;
  topicAssessmentId: string;
  passThresholdPercentage: number;
  status: TopicStatus;
  selectedChapterId: string;
  selectedLessonIds: string[];
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

const buildUpdatePayload = (node: TopicNodeDraft): UpdateRoadmapTopicRequest => {
  if (node.isDraft || !node.baseline) return {};

  const dirty = new Set(node.dirtyFields);
  const payload: UpdateRoadmapTopicRequest = {};

  setIfChanged(payload, 'title', node.title, node.baseline.title, dirty);
  setIfChanged(payload, 'description', node.description, node.baseline.description, dirty);
  setIfChanged(payload, 'difficulty', node.difficulty, node.baseline.difficulty, dirty);
  setIfChanged(payload, 'sequenceOrder', node.sequenceOrder, node.baseline.sequenceOrder, dirty);
  setIfChanged(payload, 'priority', node.priority, node.baseline.priority, dirty);
  setIfChanged(payload, 'estimatedHours', node.estimatedHours, node.baseline.estimatedHours, dirty);
  setIfChanged(
    payload,
    'topicAssessmentId',
    node.topicAssessmentId,
    node.baseline.topicAssessmentId,
    dirty
  );
  setIfChanged(
    payload,
    'passThresholdPercentage',
    node.passThresholdPercentage,
    node.baseline.passThresholdPercentage,
    dirty
  );
  setIfChanged(payload, 'status', node.status, node.baseline.status, dirty);
  if (dirty.has('lessonIds')) {
    payload.lessonIds = node.selectedLessonIds;
  }

  return payload;
};

export default function AdminRoadmapTopicsPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();
  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const addTopic = useAddRoadmapTopic();
  const updateTopic = useUpdateRoadmapTopic();
  const archiveTopic = useArchiveRoadmapTopic();

  const [nodes, setNodes] = useState<TopicNodeDraft[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const topics = roadmapDetail.data?.result.topics;
    if (!topics) return;

    const mapped = [...topics]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map((topic) => ({
        clientId: `persisted-${topic.id}`,
        persistedId: topic.id,
        title: topic.title,
        description: topic.description ?? '',
        difficulty: topic.difficulty,
        sequenceOrder: topic.sequenceOrder,
        priority: topic.priority,
        estimatedHours: topic.estimatedHours,
        topicAssessmentId: topic.topicAssessmentId ?? '',
        passThresholdPercentage: topic.passThresholdPercentage ?? 70,
        status: topic.status,
        selectedChapterId: '',
        selectedLessonIds: [],
        isDraft: false,
        dirtyFields: [],
        baseline: {
          title: topic.title,
          description: topic.description ?? '',
          difficulty: topic.difficulty,
          sequenceOrder: topic.sequenceOrder,
          priority: topic.priority,
          estimatedHours: topic.estimatedHours,
          topicAssessmentId: topic.topicAssessmentId ?? '',
          passThresholdPercentage: topic.passThresholdPercentage ?? 70,
          status: topic.status,
        },
      }));

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
  const lessonsQuery = useLessonsByChapter(
    activeNode?.selectedChapterId ?? '',
    isTopicModalOpen && !!activeNode?.selectedChapterId
  );

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
      title: `Topic ${nodes.length + 1}`,
      description: '',
      difficulty: 'EASY',
      sequenceOrder: nodes.length + 1,
      priority: 1,
      estimatedHours: 2,
      topicAssessmentId: '',
      passThresholdPercentage: 70,
      status: 'NOT_STARTED',
      selectedChapterId: '',
      selectedLessonIds: [],
      isDraft: true,
      dirtyFields: [],
    };

    setNodes((previous) => resequenceNodes([...previous, draft]));
    setActiveNodeId(draft.clientId);
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
      setToast({ type: 'error', message: 'Unauthorized. Please sign in again.' });
      void navigate('/login', { replace: true });
      return;
    }
    if (status === 403) {
      setToast({ type: 'error', message: 'Forbidden. ADMIN permission is required.' });
      return;
    }
    if (status === 404) {
      setToast({
        type: 'error',
        message:
          'Topic or roadmap not found. It may already be archived or linked data is invalid.',
      });
      return;
    }

    setToast({ type: 'error', message: extractErrorMessage(error, fallback) });
  };

  const saveActiveNode = () => {
    if (!roadmapId || !activeNode || isSubmitting) return;

    if (activeNode.isDraft) {
      if (!activeNode.title || activeNode.selectedLessonIds.length === 0) return;

      addTopic.mutate(
        {
          roadmapId,
          payload: {
            title: activeNode.title,
            description: activeNode.description,
            difficulty: activeNode.difficulty,
            sequenceOrder: activeNode.sequenceOrder,
            priority: activeNode.priority,
            estimatedHours: activeNode.estimatedHours,
            lessonIds: activeNode.selectedLessonIds,
            topicAssessmentId: activeNode.topicAssessmentId || undefined,
            passThresholdPercentage: activeNode.passThresholdPercentage,
          },
        },
        {
          onSuccess: () => {
            setToast({ type: 'success', message: 'Roadmap topic created successfully' });
            setIsTopicModalOpen(false);
            setActiveNodeId(null);
            void roadmapDetail.refetch();
          },
          onError: (error) => handleMutationError(error, 'Failed to create roadmap topic'),
        }
      );
      return;
    }

    if (!activeNode.persistedId) return;

    const payload = buildUpdatePayload(activeNode);
    if (Object.keys(payload).length === 0) {
      setToast({ type: 'error', message: 'No changes detected for this topic.' });
      return;
    }

    updateTopic.mutate(
      { roadmapId, topicId: activeNode.persistedId, payload },
      {
        onSuccess: () => {
          setToast({ type: 'success', message: 'Roadmap topic updated successfully' });
          setIsTopicModalOpen(false);
          setActiveNodeId(null);
          void roadmapDetail.refetch();
        },
        onError: (error) => handleMutationError(error, 'Failed to update roadmap topic'),
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
          setToast({ type: 'success', message: 'Roadmap topic archived successfully' });
          setDeleteTargetId(null);
          setIsTopicModalOpen(false);
          setActiveNodeId(null);
          void roadmapDetail.refetch();
        },
        onError: (error) => handleMutationError(error, 'Failed to archive roadmap topic'),
      }
    );
  };

  const difficultyClass = (difficulty: TopicDifficulty) => {
    if (difficulty === 'MEDIUM') return 'admin-roadmap-page__topic-node--medium';
    if (difficulty === 'HARD') return 'admin-roadmap-page__topic-node--hard';
    return 'admin-roadmap-page__topic-node--easy';
  };

  const title = useMemo(
    () => roadmapDetail.data?.result.name ?? 'Roadmap topic builder',
    [roadmapDetail.data]
  );
  const chapters = chaptersQuery.data?.result ?? [];
  const lessons = lessonsQuery.data?.result ?? [];
  const roadmapErrorStatus = extractHttpStatus(roadmapDetail.error);
  let submitButtonLabel = 'Save changes';
  if (activeNode?.isDraft) {
    submitButtonLabel = 'Save topic';
  }
  if (updateTopic.isPending) {
    submitButtonLabel = 'Saving...';
  }
  if (addTopic.isPending) {
    submitButtonLabel = 'Adding...';
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
            <h1>Topic road builder</h1>
            <p>{title} - create, edit, and archive topics directly from this board.</p>
          </div>
          <div className="admin-roadmap-topics-page__header-actions">
            <button
              type="button"
              className="admin-roadmap-page__button"
              onClick={() => navigate(`/admin/roadmaps/edit/${roadmapId}`)}
            >
              Back to roadmap edit
            </button>
            <button type="button" className="admin-roadmap-page__button" onClick={createDraftNode}>
              Add topic node
            </button>
          </div>
        </header>

        {roadmapDetail.isLoading && <p className="admin-roadmap-page__state">Loading roadmap...</p>}
        {roadmapDetail.error && roadmapErrorStatus !== 403 && roadmapErrorStatus !== 401 && (
          <p className="admin-roadmap-page__state">Unable to load roadmap.</p>
        )}
        {roadmapErrorStatus === 403 && (
          <p className="admin-roadmap-page__state">Forbidden. You need ADMIN access to manage roadmap topics.</p>
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
                    {node.isDraft && <em className="admin-roadmap-page__topic-badge">Draft</em>}
                    <strong>{node.title}</strong>
                    <small>{node.difficulty}</small>
                  </button>

                  {node.isDraft && (
                    <button
                      type="button"
                      className="admin-roadmap-topics-page__node-delete"
                      aria-label="Delete draft topic"
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

        {isTopicModalOpen && activeNode && (
          <div className="admin-roadmap-page__modal-backdrop">
            <dialog className="admin-roadmap-page__modal" open>
              <header className="admin-roadmap-page__modal-header">
                <h3>Topic node details</h3>
                <button
                  type="button"
                  className="admin-roadmap-page__modal-close"
                  onClick={() => setIsTopicModalOpen(false)}
                >
                  Close
                </button>
              </header>

              <div className="admin-roadmap-page__form-grid">
                <label>
                  <span>Topic title</span>
                  <input
                    value={activeNode.title}
                    onChange={(event) => updateActiveNode('title', event.target.value, 'title')}
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Difficulty</span>
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
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={activeNode.status}
                    onChange={(event) =>
                      updateActiveNode('status', event.target.value as TopicStatus, 'status')
                    }
                    disabled={activeNode.isDraft || isSubmitting}
                  >
                    {TOPIC_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Chapter</span>
                  <select
                    value={activeNode.selectedChapterId}
                    onChange={(event) => {
                      updateActiveNode('selectedChapterId', event.target.value);
                      updateActiveNode('selectedLessonIds', [], 'lessonIds');
                    }}
                    disabled={isSubmitting || chaptersQuery.isLoading || chapters.length === 0}
                  >
                    <option value="">Select chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title || chapter.name || chapter.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Topic description</span>
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
                  <span>Sequence order</span>
                  <input type="number" min={1} value={activeNode.sequenceOrder} readOnly />
                </label>
                <label>
                  <span>Priority</span>
                  <input
                    type="number"
                    min={1}
                    value={activeNode.priority}
                    onChange={(event) =>
                      updateActiveNode('priority', Number(event.target.value) || 1, 'priority')
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Estimated hours</span>
                  <input
                    type="number"
                    min={1}
                    value={activeNode.estimatedHours}
                    onChange={(event) =>
                      updateActiveNode(
                        'estimatedHours',
                        Number(event.target.value) || 1,
                        'estimatedHours'
                      )
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Topic assessment ID (optional)</span>
                  <input
                    value={activeNode.topicAssessmentId}
                    onChange={(event) =>
                      updateActiveNode('topicAssessmentId', event.target.value, 'topicAssessmentId')
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label>
                  <span>Lessons in chapter</span>
                  <div className="admin-roadmap-topics-page__lesson-picker">
                    {!activeNode.selectedChapterId && (
                      <p className="admin-roadmap-page__state">Choose a chapter to load lessons.</p>
                    )}
                    {activeNode.selectedChapterId && lessonsQuery.isLoading && (
                      <p className="admin-roadmap-page__state">Loading lessons...</p>
                    )}
                    {activeNode.selectedChapterId && lessonsQuery.error && (
                      <p className="admin-roadmap-page__state">Unable to load lessons.</p>
                    )}
                    {activeNode.selectedChapterId &&
                      !lessonsQuery.isLoading &&
                      !lessonsQuery.error && (
                        <div className="admin-roadmap-topics-page__lesson-list">
                          {lessons.map((lesson) => (
                            <label
                              key={lesson.id}
                              className="admin-roadmap-topics-page__lesson-item"
                            >
                              <input
                                type="checkbox"
                                checked={activeNode.selectedLessonIds.includes(lesson.id)}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...activeNode.selectedLessonIds, lesson.id]
                                    : activeNode.selectedLessonIds.filter((id) => id !== lesson.id);
                                  updateActiveNode('selectedLessonIds', next, 'lessonIds');
                                }}
                                disabled={isSubmitting}
                              />
                              <span>{lesson.title || lesson.id}</span>
                            </label>
                          ))}
                          {lessons.length === 0 && (
                            <p className="admin-roadmap-page__state">
                              No lessons found in this chapter.
                            </p>
                          )}
                        </div>
                      )}
                    <p className="admin-roadmap-topics-page__lesson-count">
                      Selected lessons: {activeNode.selectedLessonIds.length}
                    </p>
                  </div>
                </label>
                <label>
                  <span>Pass threshold %</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activeNode.passThresholdPercentage}
                    onChange={(event) =>
                      updateActiveNode(
                        'passThresholdPercentage',
                        Number(event.target.value) || 70,
                        'passThresholdPercentage'
                      )
                    }
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <div className="admin-roadmap-page__actions">
                <button
                  type="button"
                  className="admin-roadmap-page__button"
                  disabled={
                    isSubmitting ||
                    !roadmapId ||
                    !activeNode.title ||
                    (activeNode.isDraft && activeNode.selectedLessonIds.length === 0)
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
                    Archive topic
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
                <h3>Archive topic</h3>
                <button
                  type="button"
                  className="admin-roadmap-page__modal-close"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={archiveTopic.isPending}
                >
                  Close
                </button>
              </header>

              <p className="admin-roadmap-page__state">
                Confirm archiving topic "{deleteTarget.title}". This keeps history but removes it
                from active roadmap flow.
              </p>

              <div className="admin-roadmap-page__actions">
                <button
                  type="button"
                  className="admin-roadmap-page__button"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={archiveTopic.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-roadmap-topics-page__archive-button"
                  onClick={confirmArchiveTopic}
                  disabled={archiveTopic.isPending}
                >
                  {archiveTopic.isPending ? 'Archiving...' : 'Confirm archive'}
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
