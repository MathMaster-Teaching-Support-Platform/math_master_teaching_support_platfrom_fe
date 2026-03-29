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
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  studentAnswer?: string | Record<string, unknown>;
  correctAnswer?: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  maxPoints: number;
  feedback?: string;
  needsManualGrading: boolean;
  aiReviews?: AiReviewResponse[];
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
  adjustmentPoints: number;
  reason: string;
}

export interface GradingAnalyticsResponse {
  assessmentId: string;
  assessmentTitle: string;
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  scoreDistribution: Record<string, number>;
  averageTimeSpent: number;
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  averageScore: number;
  successRate: number;
  totalAttempts: number;
}

export interface RegradeRequestResponse {
  requestId: string;
  submissionId: string;
  questionId: string;
  studentId: string;
  studentName: string;
  questionText: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherResponse?: string;
  reviewedBy?: string;
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
