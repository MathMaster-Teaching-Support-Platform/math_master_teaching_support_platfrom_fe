// Student Assessment Types
export interface StudentAssessmentResponse {
  id: string;
  title: string;
  description?: string;
  assessmentType: 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';
  timeLimitMinutes?: number;
  passingScore?: number;
  startDate?: string;
  endDate?: string;
  totalQuestions: number;
  totalPoints: number;
  attemptCount: number;
  maxAttempts?: number;
  allowMultipleAttempts: boolean;
  canStart: boolean;
  cannotStartReason?: string;
  studentStatus: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  lastAttemptScore?: number;
  lastAttemptPercentage?: number;
  bestScore?: number;
}

export interface AttemptStartResponse {
  attemptId: string;
  submissionId: string;
  assessmentId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt?: string;
  timeLimitMinutes?: number;
  totalQuestions: number;
  instructions?: string;
  connectionToken: string;
  channelName: string;
  questions: AttemptQuestionResponse[];
}

export interface AttemptQuestionResponse {
  questionId: string;
  orderIndex: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  options?: Record<string, string>;
  points: number;
}

export interface AnswerUpdateRequest {
  attemptId: string;
  questionId: string;
  answerValue: string | Record<string, unknown>;
  clientTimestamp: string;
  sequenceNumber: number;
}

export interface AnswerAckResponse {
  type: 'ack' | 'flag_ack';
  questionId: string;
  sequenceNumber?: number;
  savedAt: string;
  success: boolean;
}

export interface FlagUpdateRequest {
  attemptId: string;
  questionId: string;
  flagged: boolean;
}

export interface SubmitAssessmentRequest {
  attemptId: string;
  confirmed?: boolean;
}

export interface DraftSnapshotResponse {
  attemptId: string;
  answers: Record<string, string | Record<string, unknown>>;
  flags: Record<string, boolean>;
  timeRemaining?: number;
  progress: {
    answered: number;
    total: number;
  };
}

export interface StartAssessmentRequest {
  assessmentId: string;
}
