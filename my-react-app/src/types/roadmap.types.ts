import type { ApiResponse } from './auth.types';

export type RoadmapStatus = 'GENERATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type RoadmapLessonStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface RoadmapCatalogItem {
  id: string;
  name: string;
  subjectId: string;
  studentId: string | null;
  studentName: string | null;
  subject: string;
  gradeLevel: string;
  status: RoadmapStatus;
  progressPercentage: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface RoadmapLesson {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  status: RoadmapLessonStatus;
  isRequired: boolean;
}

export interface RoadmapModule {
  id: string;
  title: string;
  order: number;
  description?: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

export interface RoadmapTopic {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  difficulty: QuestionDifficulty;
  sequenceOrder: number;
  mark?: number;
  lessonIds?: string[];
  slideLessonIds?: string[];
  assessmentIds?: string[];
  lessonPlanIds?: string[];
  mindmapIds?: string[];
  topicAssessmentId?: string | null;
  startedAt?: string | null;
  questionTemplates: unknown[];
  mindmaps: unknown[];
}

export interface RoadmapStats {
  totalEstimatedHours: number;
  easyTopicsCount: number;
  mediumTopicsCount: number;
  hardTopicsCount: number;
  averageProgress: number;
  lockedTopicsCount: number;
  daysRemaining: number;
}

export interface RoadmapDetail extends RoadmapCatalogItem {
  teacherId?: string | null;
  generationType?: 'ADMIN_TEMPLATE';
  estimatedCompletionDays: number;
  startedAt?: string | null;
  completedAt?: string | null;
  topics: RoadmapTopic[];
  stats?: RoadmapStats;
}

export interface StudentRoadmapProgress {
  roadmapId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  currentLessonId?: string;
  lastUpdatedAt?: string;
}

export interface StudentRoadmapSnapshot {
  roadmap: RoadmapDetail;
  progress: StudentRoadmapProgress;
}

export type TopicMaterialResourceType =
  | 'LESSON'
  | 'ASSESSMENT'
  | 'MINDMAP'
  | 'SLIDE'
  | 'LESSON_PLAN';

export interface TopicMaterial {
  id: string;
  resourceTitle: string;
  resourceType: TopicMaterialResourceType;
  sequenceOrder: number;
  isRequired: boolean;
  lessonId: string | null;
  questionId: string | null;
  assessmentId: string | null;
  mindmapId: string | null;
  chapterId: string | null;
}

export interface LinkTopicMaterialsByQuestionRequest {
  questionId: string;
  includeSlides: boolean;
  includeQuestions: boolean;
  includeMindmaps: boolean;
  includeDocuments: boolean;
  startSequenceOrder: number;
}

export interface CreateRoadmapTopicRequest {
  title: string;
  description?: string;
  sequenceOrder: number;
  mark?: number;
  lessonIds: string[];
  slideLessonIds?: string[];
  assessmentIds?: string[];
  lessonPlanIds?: string[];
  mindmapIds?: string[];
  topicAssessmentId?: string;
  difficulty: QuestionDifficulty;
}

export interface RoadmapTopicResponse {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  difficulty: QuestionDifficulty;
  sequenceOrder: number;
  mark?: number;
  lessonIds?: string[];
  slideLessonIds?: string[];
  assessmentIds?: string[];
  lessonPlanIds?: string[];
  mindmapIds?: string[];
  topicAssessmentId?: string | null;
  startedAt?: string | null;
  questionTemplates: unknown[];
  mindmaps: unknown[];
}

export interface UpdateRoadmapTopicRequest {
  title?: string;
  description?: string;
  sequenceOrder?: number;
  mark?: number;
  lessonIds?: string[];
  slideLessonIds?: string[];
  assessmentIds?: string[];
  lessonPlanIds?: string[];
  mindmapIds?: string[];
  topicAssessmentId?: string;
  difficulty?: QuestionDifficulty;
  status?: TopicStatus;
}

export type RoadmapResourceOptionType =
  | 'LESSON'
  | 'TEMPLATE_SLIDE'
  | 'MINDMAP'
  | 'LESSON_PLAN'
  | 'ASSESSMENT';

export interface RoadmapResourceOption {
  id: string;
  name: string;
  type: RoadmapResourceOptionType;
  lessonId: string | null;
  chapterId: string | null;
}

export interface CreateRoadmapEntryTestRequest {
  assessmentId: string;
}

export interface StudentRoadmapEntryTestInfo {
  assessmentId: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  totalQuestions: number;
  canStart: boolean;
  cannotStartReason?: string | null;
}

export interface StartRoadmapEntryTestRequest {
  ipAddress?: string;
}

export interface RoadmapEntryTestQuestion {
  questionId: string;
  orderIndex: number;
  questionType: string;
  questionText: string;
  options?: Record<string, string>;
  points: number;
}

export interface RoadmapEntryTestAttemptStartResponse {
  attemptId: string;
  assessmentId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  instructions?: string;
  connectionToken?: string;
  channelName?: string;
  questions: RoadmapEntryTestQuestion[];
}

export interface SubmitRoadmapEntryTestRequest {
  submissionId: string;
}

export interface SubmitRoadmapEntryTestResult {
  roadmapId: string;
  submissionId: string;
  suggestedTopicId: string;
  scoreOnTen: number;
  evaluatedQuestions: number;
  thresholdPercentage: number;
  evaluatedAt: string;
}

export type RoadmapEntryTestResultResponse = SubmitRoadmapEntryTestResult;

export interface SubmitRoadmapFeedbackRequest {
  rating: number;
  content?: string;
}

export interface RoadmapFeedbackResponse {
  id: string;
  roadmapId: string;
  studentId: string;
  studentName: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapFeedbackPage {
  content: RoadmapFeedbackResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateAdminRoadmapRequest {
  name: string;
  subjectId: string;
  description: string;
  estimatedDays?: number;
}

export interface UpdateAdminRoadmapRequest {
  subjectId?: string;
  description?: string;
  estimatedCompletionDays?: number;
  status?: RoadmapStatus;
}

export interface UpdateRoadmapProgressRequest {
  lessonId: string;
  status: Extract<RoadmapLessonStatus, 'IN_PROGRESS' | 'COMPLETED'>;
}

export type RoadmapApiResponse<T> = ApiResponse<T>;
