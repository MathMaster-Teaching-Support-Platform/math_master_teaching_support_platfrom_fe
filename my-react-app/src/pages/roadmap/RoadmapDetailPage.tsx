import { useParams } from 'react-router-dom';
import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useRoadmapDetail,
  useStudentTopicMaterials,
  useSubmitRoadmapEntryTest,
} from '../../hooks/useRoadmaps';
import type { TopicMaterialResourceType } from '../../types';
import { mockStudent } from '../../data/mockData';
import './roadmap-detail-page.css';

export default function RoadmapDetailPage() {
  const { roadmapId = '' } = useParams();
  const { data, isLoading, error } = useRoadmapDetail(roadmapId);
  const submitEntryTest = useSubmitRoadmapEntryTest();

  const [submissionId, setSubmissionId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [resourceType, setResourceType] = useState<TopicMaterialResourceType>('LESSON');
  const [finishedTopicIds, setFinishedTopicIds] = useState<string[]>([]);
  const [carTopicId, setCarTopicId] = useState<string | null>(null);

  const roadmap = data?.result;
  const materialsQuery = useStudentTopicMaterials(selectedTopicId, resourceType);

  const materials = Array.isArray(materialsQuery.data?.result) ? materialsQuery.data?.result : [];
  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((left, right) => left.sequenceOrder - right.sequenceOrder);

  const topicsPerRow = 4;
  const rowCount = Math.max(1, Math.ceil(sortedTopics.length / topicsPerRow));
  const roadHeight = Math.max(520, rowCount * 170 + 120);

  const getStopPosition = (index: number) => {
    const row = Math.floor(index / topicsPerRow);
    const col = index % topicsPerRow;
    const visualCol = row % 2 === 1 ? topicsPerRow - 1 - col : col;
    const step = topicsPerRow > 1 ? 80 / (topicsPerRow - 1) : 0;
    return {
      left: `${10 + visualCol * step}%`,
      top: `${76 + row * 170}px`,
    };
  };

  const carTopicIndex = sortedTopics.findIndex((topic) => topic.id === carTopicId);
  const carPosition = carTopicIndex >= 0 ? getStopPosition(carTopicIndex) : { left: '8%', top: '48px' };
  const isFinalFinished =
    sortedTopics.length > 0 && sortedTopics.every((topic) => finishedTopicIds.includes(topic.id));

  const finishTopic = (topicId: string) => {
    setFinishedTopicIds((previous) => (previous.includes(topicId) ? previous : [...previous, topicId]));
    setCarTopicId(topicId);
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <section className="roadmap-detail-page">
        {isLoading && <p className="roadmap-detail-page__state">Loading roadmap detail...</p>}
        {error && <p className="roadmap-detail-page__state">Unable to load roadmap detail.</p>}

        {roadmap && (
          <>
            <header className="roadmap-detail-page__header">
              <h1>{roadmap.name}</h1>
              <p>{roadmap.description}</p>
            </header>

            <section className="roadmap-detail-page__entry-test">
              <h3>Roadmap entry test</h3>
              <p>Submit test result to get suggested starting topic for this roadmap.</p>
              <div className="roadmap-detail-page__entry-test-form">
                <input
                  placeholder="Submission ID"
                  value={submissionId}
                  onChange={(event) => setSubmissionId(event.target.value)}
                />
                <button
                  type="button"
                  disabled={!submissionId || !roadmapId || submitEntryTest.isPending}
                  onClick={() => {
                    if (!roadmapId || !submissionId) return;
                    submitEntryTest.mutate({
                      roadmapId,
                      payload: { submissionId },
                    });
                  }}
                >
                  {submitEntryTest.isPending ? 'Submitting...' : 'Submit entry test'}
                </button>
              </div>
              {submitEntryTest.data?.result && (
                <p className="roadmap-detail-page__entry-test-result">
                  Suggested topic ID: {submitEntryTest.data.result.suggestedTopicId} • Evaluated:
                  {' '}
                  {submitEntryTest.data.result.evaluatedQuestions} questions
                </p>
              )}
            </section>

            <section className="roadmap-detail-page__topics">
              <header className="roadmap-detail-page__topics-header">
                <h3>Roadmap topics</h3>
                <p>Follow the road, finish a topic, and move the car to your newest checkpoint.</p>
              </header>

              {sortedTopics.length > 0 && (
                <section className="roadmap-detail-page__road" style={{ minHeight: `${roadHeight}px` }}>
                  <svg
                    className="roadmap-detail-page__road-svg"
                    viewBox={`0 0 1000 ${roadHeight}`}
                    preserveAspectRatio="none"
                  >
                    {Array.from({ length: rowCount }).map((_, row) => {
                      const y = 95 + row * 170;
                      const d =
                        row % 2 === 0
                          ? `M100,${y} C330,${y - 45} 670,${y + 45} 900,${y}`
                          : `M900,${y} C670,${y - 45} 330,${y + 45} 100,${y}`;

                      return <path key={`detail-road-row-${y}`} d={d} className="roadmap-detail-page__road-line" />;
                    })}
                  </svg>

                  <div className="roadmap-detail-page__road-layer">
                    {sortedTopics.map((topic, index) => {
                      const done = finishedTopicIds.includes(topic.id);
                      return (
                        <article
                          key={topic.id}
                          className={`roadmap-detail-page__road-stop ${
                            done ? 'roadmap-detail-page__road-stop--finished' : ''
                          }`}
                          style={getStopPosition(index)}
                        >
                          <span className="roadmap-detail-page__road-number">{topic.sequenceOrder}</span>
                          <strong>{topic.title}</strong>
                          <small>
                            {topic.difficulty} • {topic.estimatedHours}h
                          </small>
                          <div className="roadmap-detail-page__road-actions">
                            <button
                              type="button"
                              className="roadmap-detail-page__finish-btn"
                              disabled={done}
                              onClick={() => finishTopic(topic.id)}
                            >
                              {done ? 'Finished' : 'Finish'}
                            </button>
                            <button
                              type="button"
                              className="roadmap-detail-page__open-material-btn"
                              onClick={() => setSelectedTopicId(topic.id)}
                            >
                              Materials
                            </button>
                          </div>
                        </article>
                      );
                    })}

                    <div className="roadmap-detail-page__car" style={carPosition}>
                      🚗
                    </div>

                  </div>
                </section>
              )}

              {sortedTopics.length === 0 && <p className="roadmap-detail-page__state">No topics in this roadmap.</p>}
            </section>

            {isFinalFinished && (
              <div className="roadmap-detail-page__fireworks-overlay" aria-hidden="true">
                <div className="pyro"><div className="before"></div><div className="after"></div></div>
                <div className="pyro"><div className="before"></div><div className="after"></div></div>
                <div className="pyro"><div className="before"></div><div className="after"></div></div>
                <div className="pyro"><div className="before"></div><div className="after"></div></div>
              </div>
            )}

            {selectedTopicId && (
              <section className="roadmap-detail-page__materials">
                <header className="roadmap-detail-page__materials-header">
                  <h3>Topic materials</h3>
                  <select
                    value={resourceType}
                    onChange={(event) => setResourceType(event.target.value as TopicMaterialResourceType)}
                  >
                    <option value="LESSON">LESSON</option>
                    <option value="QUESTION">QUESTION</option>
                    <option value="MINDMAP">MINDMAP</option>
                    <option value="DOCUMENT">DOCUMENT</option>
                    <option value="ASSESSMENT">ASSESSMENT</option>
                    <option value="EXAMPLE">EXAMPLE</option>
                    <option value="PRACTICE">PRACTICE</option>
                  </select>
                </header>

                {materialsQuery.isLoading && <p>Loading materials...</p>}
                {materialsQuery.error && <p>Unable to load materials.</p>}

                {!materialsQuery.isLoading && !materialsQuery.error && (
                  <div className="roadmap-detail-page__materials-list">
                    {materials.map((material) => (
                      <article key={material.id} className="roadmap-detail-page__material-item">
                        <strong>{material.resourceTitle}</strong>
                        <span>
                          {material.resourceType} • order {material.sequenceOrder}
                        </span>
                      </article>
                    ))}
                    {materials.length === 0 && <p>No materials found for this topic/type.</p>}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
