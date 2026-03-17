import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useLessonsByChapter } from '../../hooks/useLessons';
import { useAddRoadmapTopic, useAdminRoadmapDetail } from '../../hooks/useRoadmaps';
import './admin-roadmap-page.css';
import './admin-roadmap-topics-page.css';

type TopicDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

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
  selectedChapterId: string;
  selectedLessonIds: string[];
  isDraft: boolean;
}

const resequenceNodes = (nodes: TopicNodeDraft[]) =>
  nodes.map((node, index) => ({
    ...node,
    sequenceOrder: index + 1,
  }));

export default function AdminRoadmapTopicsPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();
  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const addTopic = useAddRoadmapTopic();

  const [nodes, setNodes] = useState<TopicNodeDraft[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

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
        selectedChapterId: '',
        selectedLessonIds: [],
        isDraft: false,
      }));

    setNodes(mapped);
  }, [roadmapDetail.data?.result.topics]);

  useEffect(() => {
    if (addTopic.isSuccess) {
      setIsTopicModalOpen(false);
      setActiveNodeId(null);
    }
  }, [addTopic.isSuccess]);

  const activeNode = nodes.find((node) => node.clientId === activeNodeId) ?? null;
  const subjectId = roadmapDetail.data?.result.subjectId ?? '';
  const chaptersQuery = useChaptersBySubject(subjectId, isTopicModalOpen && !!activeNode?.isDraft);
  const lessonsQuery = useLessonsByChapter(
    activeNode?.selectedChapterId ?? '',
    isTopicModalOpen && !!activeNode?.isDraft && !!activeNode?.selectedChapterId
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
      selectedChapterId: '',
      selectedLessonIds: [],
      isDraft: true,
    };

    setNodes((previous) => resequenceNodes([...previous, draft]));
    setActiveNodeId(draft.clientId);
  };

  const openNodePopup = (clientId: string) => {
    setActiveNodeId(clientId);
    setIsTopicModalOpen(true);
  };

  const updateActiveNode = <K extends keyof TopicNodeDraft>(field: K, value: TopicNodeDraft[K]) => {
    if (!activeNodeId) return;
    setNodes((previous) =>
      previous.map((node) => (node.clientId === activeNodeId ? { ...node, [field]: value } : node))
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

  const difficultyClass = (difficulty: TopicDifficulty) => {
    if (difficulty === 'MEDIUM') return 'admin-roadmap-page__topic-node--medium';
    if (difficulty === 'HARD') return 'admin-roadmap-page__topic-node--hard';
    return 'admin-roadmap-page__topic-node--easy';
  };

  const title = useMemo(() => roadmapDetail.data?.result.name ?? 'Roadmap topic builder', [roadmapDetail.data]);
  const chapters = chaptersQuery.data?.result ?? [];
  const lessons = lessonsQuery.data?.result ?? [];

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
            <p>{title} - add nodes first, then click node to edit details.</p>
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
        {roadmapDetail.error && <p className="admin-roadmap-page__state">Unable to load roadmap.</p>}

        {!roadmapDetail.isLoading && !roadmapDetail.error && (
          <section className="admin-roadmap-topics-page__snake-road" style={{ minHeight: `${roadHeight}px` }}>
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
                    onChange={(event) => updateActiveNode('title', event.target.value)}
                    disabled={!activeNode.isDraft}
                  />
                </label>
                <label>
                  <span>Difficulty</span>
                  <select
                    value={activeNode.difficulty}
                    onChange={(event) => updateActiveNode('difficulty', event.target.value as TopicDifficulty)}
                    disabled={!activeNode.isDraft}
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </label>
                <label>
                  <span>Chapter</span>
                  <select
                    value={activeNode.selectedChapterId}
                    onChange={(event) => {
                      updateActiveNode('selectedChapterId', event.target.value);
                      updateActiveNode('selectedLessonIds', []);
                    }}
                    disabled={!activeNode.isDraft || chaptersQuery.isLoading || chapters.length === 0}
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
                    onChange={(event) => updateActiveNode('description', event.target.value)}
                    disabled={!activeNode.isDraft}
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
                    onChange={(event) => updateActiveNode('priority', Number(event.target.value) || 1)}
                    disabled={!activeNode.isDraft}
                  />
                </label>
                <label>
                  <span>Estimated hours</span>
                  <input
                    type="number"
                    min={1}
                    value={activeNode.estimatedHours}
                    onChange={(event) => updateActiveNode('estimatedHours', Number(event.target.value) || 1)}
                    disabled={!activeNode.isDraft}
                  />
                </label>
                <label>
                  <span>Topic assessment ID (optional)</span>
                  <input
                    value={activeNode.topicAssessmentId}
                    onChange={(event) => updateActiveNode('topicAssessmentId', event.target.value)}
                    disabled={!activeNode.isDraft}
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
                    {activeNode.selectedChapterId && !lessonsQuery.isLoading && !lessonsQuery.error && (
                      <div className="admin-roadmap-topics-page__lesson-list">
                        {lessons.map((lesson) => (
                          <label key={lesson.id} className="admin-roadmap-topics-page__lesson-item">
                            <input
                              type="checkbox"
                              checked={activeNode.selectedLessonIds.includes(lesson.id)}
                              onChange={(event) => {
                                if (!activeNode.isDraft) return;
                                const next = event.target.checked
                                  ? [...activeNode.selectedLessonIds, lesson.id]
                                  : activeNode.selectedLessonIds.filter((id) => id !== lesson.id);
                                updateActiveNode('selectedLessonIds', next);
                              }}
                              disabled={!activeNode.isDraft}
                            />
                            <span>{lesson.title || lesson.id}</span>
                          </label>
                        ))}
                        {lessons.length === 0 && (
                          <p className="admin-roadmap-page__state">No lessons found in this chapter.</p>
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
                      updateActiveNode('passThresholdPercentage', Number(event.target.value) || 70)
                    }
                    disabled={!activeNode.isDraft}
                  />
                </label>
              </div>

              <div className="admin-roadmap-page__actions">
                {activeNode.isDraft ? (
                  <button
                    type="button"
                    className="admin-roadmap-page__button"
                    disabled={
                      addTopic.isPending ||
                      !activeNode.title ||
                      activeNode.selectedLessonIds.length === 0 ||
                      !roadmapId
                    }
                    onClick={() => {
                      if (!roadmapId || !activeNode.title) return;
                      if (activeNode.selectedLessonIds.length === 0) return;

                      addTopic.mutate({
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
                      });
                    }}
                  >
                    {addTopic.isPending ? 'Adding...' : 'Save topic'}
                  </button>
                ) : (
                  <p className="admin-roadmap-page__state">
                    Existing topic is view-only here. You can drag nodes to reorder visually.
                  </p>
                )}
              </div>
            </dialog>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
