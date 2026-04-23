import type { ApiResponse } from './auth.types';

export type RoadmapStatus = 'GENERATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

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

export type MaterialResourceType = 'ARTICLE' | 'VIDEO' | 'COURSE' | 'BOOK' | 'PODCAST' | 'OTHER';

export interface TopicMaterial {
  id: string;
  title: string;
  url: string;
  resourceType: MaterialResourceType;
  isFree: boolean;
  description?: string;
}

/** Enriched course info embedded in each topic */
export interface RoadmapTopicCourse {
  id: string;
  title: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  description?: string;
  totalLessons?: number;
  isEnrolled?: boolean;
  completedLessons?: number;
  progress?: number;
}

/** A single topic in the roadmap — always clickable, no locking */
export interface RoadmapTopic {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  difficulty: QuestionDifficulty;
  sequenceOrder: number;
  mark?: number;
  /** Multiple linked courses */
  courses?: RoadmapTopicCourse[];
  startedAt?: string | null;
  totalLessons?: number;
  completedLessons?: number;
  progress?: number;
}

export interface RoadmapProgressInfo {
  current_topic_index: number;
}

export interface RoadmapStats {
  totalEstimatedHours: number;
  easyTopicsCount: number;
  mediumTopicsCount: number;
  hardTopicsCount: number;
  averageProgress: number;
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
  entryTest?: RoadmapEntryTestInfo | null;
  progress?: RoadmapProgressInfo;
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

/** Admin: create a new topic (single courseId required) */
export interface CreateRoadmapTopicRequest {
  title: string;
  description?: string;
  sequenceOrder: number;
  difficulty: QuestionDifficulty;
  mark?: number;
  courseId: string;
}

/** Admin: update an existing topic */
export interface UpdateRoadmapTopicRequest {
  title?: string;
  description?: string;
  sequenceOrder?: number;
  difficulty?: QuestionDifficulty;
  mark?: number;
  courseId?: string;
  status?: TopicStatus;
}

export interface CreateRoadmapEntryTestRequest {
  assessmentId: string;
}

export interface RoadmapEntryTestInfo {
  assessmentId: string;
  name: string;
  description?: string;
  totalQuestions: number;
  studentStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  canStart?: boolean;
  cannotStartReason?: string | null;
  activeAttemptId?: string | null;
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
  studentStatus?: 'NOT_STARTED' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
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
  suggestedTopicId?: string;
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

export interface RoadmapTopicResponse {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  difficulty: QuestionDifficulty;
  sequenceOrder: number;
  mark?: number;
  courses?: RoadmapTopicCourse[];
  startedAt?: string | null;
}

export interface CreateAdminRoadmapRequest {
  name: string;
  subjectId: string;
  description: string;
  estimatedDays?: number;
}

export interface UpdateAdminRoadmapRequest {
  name?: string;
  subjectId?: string;
  description?: string;
  estimatedCompletionDays?: number;
  status?: RoadmapStatus;
}

export interface UpdateRoadmapProgressRequest {
  topicId: string;
  status: TopicStatus;
  progressPercentage?: number;
}

export type RoadmapApiResponse<T> = ApiResponse<T>;
