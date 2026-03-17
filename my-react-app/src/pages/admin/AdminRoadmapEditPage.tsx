import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminRoadmapEditor } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useAddRoadmapTopic,
  useAdminRoadmapDetail,
  useCreateRoadmapEntryTest,
  useUpdateRoadmap,
} from '../../hooks/useRoadmaps';
import { mockAdmin } from '../../data/mockData';
import type { UpdateAdminRoadmapRequest } from '../../types';
import './admin-roadmap-page.css';

export default function AdminRoadmapEditPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();

  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const updateRoadmap = useUpdateRoadmap();
  const addTopic = useAddRoadmapTopic();
  const createEntryTest = useCreateRoadmapEntryTest();

  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [priority, setPriority] = useState(1);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [lessonIdsText, setLessonIdsText] = useState('');
  const [topicAssessmentId, setTopicAssessmentId] = useState('');
  const [passThresholdPercentage, setPassThresholdPercentage] = useState(70);

  const [assessmentId, setAssessmentId] = useState('');
  const [mappingQuestionId, setMappingQuestionId] = useState('');
  const [mappingTopicId, setMappingTopicId] = useState('');
  const [mappingOrderIndex, setMappingOrderIndex] = useState(1);
  const [mappingWeight, setMappingWeight] = useState(1);

  useEffect(() => {
    if (updateRoadmap.isSuccess) {
      void navigate('/admin/roadmaps');
    }
  }, [navigate, updateRoadmap.isSuccess]);

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Edit roadmap</h1>
            <p>Update roadmap content and metadata safely.</p>
          </div>
        </header>

        {roadmapDetail.isLoading && <p className="admin-roadmap-page__state">Loading roadmap...</p>}
        {roadmapDetail.error && <p className="admin-roadmap-page__state">Unable to load roadmap.</p>}

        {roadmapDetail.data?.result && (
          <>
            <AdminRoadmapEditor
              initialRoadmap={roadmapDetail.data.result}
              submitting={updateRoadmap.isPending}
              mode="edit"
              onSubmit={(payload) => {
                if (!roadmapId) return;
                updateRoadmap.mutate({ roadmapId, payload: payload as UpdateAdminRoadmapRequest });
              }}
            />

            <section className="admin-roadmap-page__panel-grid">
              <article className="admin-roadmap-page__panel">
                <h3>Add topic with many lessons</h3>
                <p>Create one roadmap topic and attach multiple lesson IDs directly in one API call.</p>
                <div className="admin-roadmap-page__form-grid">
                  <label>
                    <span>Topic title</span>
                    <input value={topicTitle} onChange={(event) => setTopicTitle(event.target.value)} />
                  </label>
                  <label>
                    <span>Difficulty</span>
                    <select
                      value={topicDifficulty}
                      onChange={(event) => setTopicDifficulty(event.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </label>
                  <label>
                    <span>Lesson IDs (comma or newline separated)</span>
                    <textarea
                      value={lessonIdsText}
                      onChange={(event) => setLessonIdsText(event.target.value)}
                      rows={4}
                      placeholder="lesson-id-1, lesson-id-2"
                    />
                  </label>
                  <label>
                    <span>Topic description</span>
                    <textarea
                      rows={3}
                      value={topicDescription}
                      onChange={(event) => setTopicDescription(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Sequence order</span>
                    <input
                      type="number"
                      min={1}
                      value={sequenceOrder}
                      onChange={(event) => setSequenceOrder(Number(event.target.value) || 1)}
                    />
                  </label>
                  <label>
                    <span>Priority</span>
                    <input
                      type="number"
                      min={1}
                      value={priority}
                      onChange={(event) => setPriority(Number(event.target.value) || 1)}
                    />
                  </label>
                  <label>
                    <span>Estimated hours</span>
                    <input
                      type="number"
                      min={1}
                      value={estimatedHours}
                      onChange={(event) => setEstimatedHours(Number(event.target.value) || 1)}
                    />
                  </label>
                  <label>
                    <span>Topic assessment ID (optional)</span>
                    <input
                      value={topicAssessmentId}
                      onChange={(event) => setTopicAssessmentId(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Pass threshold %</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={passThresholdPercentage}
                      onChange={(event) => setPassThresholdPercentage(Number(event.target.value) || 70)}
                    />
                  </label>
                </div>
                <div className="admin-roadmap-page__actions">
                  <button
                    type="button"
                    className="admin-roadmap-page__button"
                    disabled={addTopic.isPending || !topicTitle || !lessonIdsText.trim() || !roadmapId}
                    onClick={() => {
                      if (!roadmapId || !topicTitle) return;
                      const lessonIds = lessonIdsText
                        .split(/[\n,]/)
                        .map((item) => item.trim())
                        .filter(Boolean);

                      if (lessonIds.length === 0) return;

                      addTopic.mutate({
                        roadmapId,
                        payload: {
                          title: topicTitle,
                          description: topicDescription,
                          difficulty: topicDifficulty,
                          sequenceOrder,
                          priority,
                          estimatedHours,
                          lessonIds,
                          topicAssessmentId: topicAssessmentId || undefined,
                          passThresholdPercentage,
                        },
                      });
                    }}
                  >
                    {addTopic.isPending ? 'Adding...' : 'Add topic'}
                  </button>
                </div>

                {addTopic.isSuccess && (
                  <p className="admin-roadmap-page__success">Topic added successfully.</p>
                )}
              </article>

              <article className="admin-roadmap-page__panel">
                <h3>Configure roadmap entry test</h3>
                <p>Map assessment questions to roadmap topics for placement suggestion.</p>
                <div className="admin-roadmap-page__form-grid">
                  <label>
                    <span>Assessment ID</span>
                    <input
                      value={assessmentId}
                      onChange={(event) => setAssessmentId(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Mapping question ID</span>
                    <input
                      value={mappingQuestionId}
                      onChange={(event) => setMappingQuestionId(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Roadmap topic ID</span>
                    <input
                      value={mappingTopicId}
                      onChange={(event) => setMappingTopicId(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Order index</span>
                    <input
                      type="number"
                      min={1}
                      value={mappingOrderIndex}
                      onChange={(event) => setMappingOrderIndex(Number(event.target.value) || 1)}
                    />
                  </label>
                  <label>
                    <span>Weight</span>
                    <input
                      type="number"
                      min={1}
                      value={mappingWeight}
                      onChange={(event) => setMappingWeight(Number(event.target.value) || 1)}
                    />
                  </label>
                </div>
                <div className="admin-roadmap-page__actions">
                  <button
                    type="button"
                    className="admin-roadmap-page__button"
                    disabled={
                      createEntryTest.isPending ||
                      !roadmapId ||
                      !assessmentId ||
                      !mappingQuestionId ||
                      !mappingTopicId
                    }
                    onClick={() => {
                      if (!roadmapId) return;
                      createEntryTest.mutate({
                        roadmapId,
                        payload: {
                          assessmentId,
                          mappings: [
                            {
                              questionId: mappingQuestionId,
                              roadmapTopicId: mappingTopicId,
                              orderIndex: mappingOrderIndex,
                              weight: mappingWeight,
                            },
                          ],
                        },
                      });
                    }}
                  >
                    {createEntryTest.isPending ? 'Saving...' : 'Save entry test mapping'}
                  </button>
                </div>
                {createEntryTest.isSuccess && (
                  <p className="admin-roadmap-page__success">Entry test mapping saved successfully.</p>
                )}
              </article>
            </section>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
