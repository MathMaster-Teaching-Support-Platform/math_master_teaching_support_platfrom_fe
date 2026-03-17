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

  const roadmap = data?.result;
  const materialsQuery = useStudentTopicMaterials(selectedTopicId, resourceType);

  const materials = Array.isArray(materialsQuery.data?.result) ? materialsQuery.data?.result : [];

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
                <p>Select a topic to load linked materials (including linked lessons).</p>
              </header>

              <div className="roadmap-detail-page__topics-grid">
                {roadmap.topics.map((topic) => (
                  <article key={topic.id} className="roadmap-detail-page__topic-card">
                    <div className="roadmap-detail-page__topic-top">
                      <strong>{topic.sequenceOrder}. {topic.title}</strong>
                      <span>{topic.status}</span>
                    </div>
                    <p>{topic.description || 'No description'}</p>
                    <div className="roadmap-detail-page__topic-meta">
                      <span>{topic.difficulty}</span>
                      <span>{topic.estimatedHours}h</span>
                      <span>{Math.round(topic.progressPercentage)}%</span>
                    </div>
                    <button type="button" onClick={() => setSelectedTopicId(topic.id)}>
                      Open topic materials
                    </button>
                  </article>
                ))}
              </div>
            </section>

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
