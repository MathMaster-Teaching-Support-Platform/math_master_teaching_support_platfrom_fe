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
  requiredPoint?: number;
  unlocked?: boolean;
  courseIds?: string[];
  courses?: Array<{
    id: string;
    title: string;
  }>;
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
  studentBestScore?: number;
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
  courseIds?: string[];
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
  requiredPoint?: number;
  unlocked?: boolean;
  courseIds?: string[];
  courses?: Array<{
    id: string;
    title: string;
  }>;
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
  courseIds?: string[];
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
  totalPoints?: number;
  timeLimitMinutes?: number;
  startDate?: string;
  endDate?: string;
  totalQuestions: number;
  studentStatus?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  activeAttemptId?: string | null;
  attemptNumber?: number;
  maxAttempts?: number;
  allowMultipleAttempts?: boolean;
  canStart: boolean;
  cannotStartReason?: string | null;
}

export interface RoadmapEntryTestQuestion {
  questionId: string;
  orderIndex: number;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  questionText: string;
  options?: Record<string, string>;
  points: number;
  diagramData?: Record<string, unknown> | string | null;
  diagramUrl?: string;
  diagramLatex?: string;
  latexContent?: string;
  answerFormula?: string;
}

export interface RoadmapEntryTestAttemptStartResponse {
  attemptId: string;
  submissionId?: string;
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

export interface RoadmapEntryTestAnswerRequest {
  questionId: string;
  answerValue: string | Record<string, unknown>;
  clientTimestamp: string;
  sequenceNumber: number;
}

export interface RoadmapEntryTestFlagRequest {
  questionId: string;
  flagged: boolean;
}

export interface RoadmapEntryTestAnswerAckResponse {
  type: 'ack' | 'flag_ack';
  questionId: string;
  serverTimestamp?: string;
  sequenceNumber?: number;
  success: boolean;
  message?: string;
}

export interface RoadmapEntryTestSnapshotProgress {
  answeredCount: number;
  totalQuestions: number;
  completionPercentage: number;
}

export interface RoadmapEntryTestSnapshotResponse {
  attemptId: string;
  answers: Record<string, string | Record<string, unknown>>;
  flags: Record<string, boolean>;
  startedAt?: string;
  expiresAt?: string;
  timeRemainingSeconds?: number;
  progress: RoadmapEntryTestSnapshotProgress;
}

export interface RoadmapEntryTestActiveAttemptResponse {
  assessmentId: string;
  studentStatus: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  attemptId: string | null;
  startedAt?: string;
  expiresAt?: string;
  timeRemainingSeconds?: number;
  progress?: RoadmapEntryTestSnapshotProgress;
}

export interface SubmitRoadmapEntryTestRequest {
  submissionId: string;
}

export interface RoadmapUnlockedTopicItem {
  id: string;
  name: string;
  requiredPoint: number;
}

export interface SubmitRoadmapEntryTestResult {
  roadmapId: string;
  submissionId: string;
  score: number;
  studentBestScore: number;
  unlockedTopics: RoadmapUnlockedTopicItem[];
  newlyUnlockedTopics: RoadmapUnlockedTopicItem[];
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
