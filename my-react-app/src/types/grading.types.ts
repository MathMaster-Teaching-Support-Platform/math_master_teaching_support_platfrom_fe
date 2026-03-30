// Grading Types
export interface GradingSubmissionResponse {
  submissionId: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'INVALIDATED';
  submittedAt?: string;
  score?: number;
  maxScore: number;
  percentage?: number;
  manualAdjustment?: number;
  manualAdjustmentReason?: string;
  finalScore?: number;
  timeSpentSeconds?: number;
  attemptNumber?: number;
  pendingQuestionsCount: number;
  autoGradedQuestionsCount: number;
  answers: AnswerGradeResponse[];
  gradesReleased: boolean;
  gradedAt?: string;
}

export interface AnswerGradeResponse {
  answerId: string;
  questionId: string;
  questionText: string;
  answerText?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  maxPoints: number;
  feedback?: string;
  isManuallyAdjusted?: boolean;
  gradedAt?: string;
  // FE-only fields (not in BE response, will be undefined)
  questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  needsManualGrading?: boolean;
}

export interface AiReviewResponse {
  reviewContent: string;
  suggestions: string[];
  confidenceScore: number;
  createdAt: string;
}

export interface CompleteGradingRequest {
  submissionId: string;
  grades: ManualGradeRequest[];
}

export interface ManualGradeRequest {
  answerId: string;
  pointsEarned: number;
  feedback?: string;
  isCorrect: boolean;
}

export interface GradeOverrideRequest {
  answerId: string;
  newPoints: number;
  reason: string;
}

export interface ManualAdjustmentRequest {
  submissionId: string;
  adjustmentAmount: number; // Changed from adjustmentPoints to match BE
  reason: string;
}

export interface GradingAnalyticsResponse {
  totalSubmissions: number;
  gradedSubmissions: number; // Changed from gradedCount to match BE
  pendingSubmissions: number; // Changed from pendingCount to match BE
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  scoreDistribution: Record<string, number>;
  questionDifficulty?: Record<string, number>; // Added from BE
  averageTimeSpentSeconds: number; // Changed from averageTimeSpent to match BE
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  averageScore: number;
  successRate: number;
  totalAttempts: number;
}

export interface RegradeRequestResponse {
  id: string; // Changed from requestId to match BE
  submissionId: string;
  questionId: string;
  studentId: string;
  studentName: string;
  questionText: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherResponse?: string;
  reviewedBy?: string;
  reviewerName?: string; // Added from BE
  reviewedAt?: string;
  createdAt: string;
}

export interface RegradeRequestCreationRequest {
  submissionId: string;
  questionId: string;
  reason: string;
}

export interface RegradeResponseRequest {
  requestId: string;
  status: 'APPROVED' | 'REJECTED';
  teacherResponse: string;
  newPoints?: number;
}
