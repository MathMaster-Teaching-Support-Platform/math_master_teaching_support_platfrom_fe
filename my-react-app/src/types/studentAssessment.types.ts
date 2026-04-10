// Student Assessment Types
export interface StudentAssessmentResponse {
  id: string;
  title: string;
  description?: string;
  assessmentType: 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';
  totalQuestions: number;
  totalPoints: number;
  timeLimitMinutes?: number;
  passingScore?: number; // Added back - BE now returns this
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string; // AssessmentStatus from BE
  
  studentStatus: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  currentAttemptId?: string;
  attemptNumber?: number; // Changed from attemptCount to match BE
  maxAttempts?: number;
  allowMultipleAttempts: boolean;
  canStart: boolean;
  cannotStartReason?: string;
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
  options?: Record<string, unknown>; // Changed from string to unknown to match BE
  points: number;
  diagramData?: Record<string, unknown> | string | null;
  diagramUrl?: string;
  diagramLatex?: string;
  latexContent?: string;
  answerFormula?: string;
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
  serverTimestamp?: string; // Changed from savedAt to match BE
  sequenceNumber?: number;
  success: boolean;
  message?: string;
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
  startedAt?: string;
  expiresAt?: string;
  timeRemainingSeconds?: number; // Changed from timeRemaining to match BE
  answeredCount?: number;
  totalQuestions?: number;
}

export interface StartAssessmentRequest {
  assessmentId: string;
}
