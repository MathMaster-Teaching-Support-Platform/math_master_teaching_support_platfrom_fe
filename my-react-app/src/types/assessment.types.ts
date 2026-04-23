// ─── Enums ────────────────────────────────────────────────────────────────────
export type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type AssessmentMode = 'DIRECT' | 'MATRIX_BASED';
export type AttemptScoringPolicy = 'BEST' | 'LATEST' | 'AVERAGE';
export type AssessmentSelectionStrategy = 'BANK_FIRST' | 'AI_FIRST' | 'MIXED';

// ─── Request DTOs ─────────────────────────────────────────────────────────────
export interface AssessmentRequest {
    /** @NotBlank @Size(max=255) */
    title: string;
    description?: string;
    /** @NotNull */
    assessmentType: AssessmentType;
    lessonIds: string[];
    /** @Min(1) */
    timeLimitMinutes?: number;
    /** @DecimalMin(0) @DecimalMax(100) */
    passingScore?: number;
    startDate?: string;   // ISO instant
    endDate?: string;     // ISO instant
    randomizeQuestions?: boolean;
    showCorrectAnswers?: boolean;
    assessmentMode?: AssessmentMode;
    examMatrixId: string;
    allowMultipleAttempts?: boolean;
    /** @Min(1) */
    maxAttempts?: number;
    attemptScoringPolicy?: AttemptScoringPolicy;
    showScoreImmediately?: boolean;
}

export interface PointsOverrideRequest {
    /** @NotNull */
    questionId: string;
    /** @DecimalMin(0) */
    pointsOverride?: number | null;
}

export interface CloneAssessmentRequest {
    newTitle?: string;
    cloneQuestions?: boolean;
}

export interface AddQuestionToAssessmentRequest {
    /** @NotNull */
    questionId: string;
    orderIndex?: number;
    /** @DecimalMin(0) */
    pointsOverride?: number;
}

export interface GenerateAssessmentFromMatrixRequest {
    examMatrixId: string;
    reuseApprovedQuestions?: boolean;
    selectionStrategy?: AssessmentSelectionStrategy;
}

export interface GenerateQuestionsForAssessmentRequest {
    examMatrixId: string;
    reuseApprovedQuestions?: boolean;
    selectionStrategy?: AssessmentSelectionStrategy;
}

export interface AssessmentGenerationSummary {
    totalQuestionsGenerated?: number;
    questionsFromBank?: number;
    questionsFromAi?: number;
    totalPoints?: number;
    warnings?: string[];
    message?: string;
}

export interface AssessmentQuestionItem {
    id?: string;
    questionId: string;
    orderIndex: number;
    /** Effective final points (pointsOverride ?? question.points). */
    points?: number;
    questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
    questionText: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    explanation?: string;
    solutionSteps?: string;
    diagramData?: Record<string, unknown>;
    canonicalQuestionId?: string;
    createdAt?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
    cognitiveLevel?: string;
    questionSourceType?: 'MANUAL' | 'TEMPLATE_GENERATED' | 'AI_GENERATED' | 'BANK_IMPORTED' | 'BANK' | 'AI';
    source?: 'BANK' | 'AI';
}

// ─── Batch request types ──────────────────────────────────────────────────────
export interface BatchAddQuestionsRequest {
    questionIds: string[];
}

export interface QuestionPointItem {
    id: string;
    point: number;
}

export interface BatchUpdatePointsRequest {
    questions: QuestionPointItem[];
}

export interface AutoDistributePointsRequest {
    totalPoints: number;
    distribution?: Record<string, number>;
}

export type DistributePointsStrategy = 'EQUAL';

export interface DistributeAssessmentPointsRequest {
    totalPoints: number;
    strategy: DistributePointsStrategy;
    scale?: number;
}

export interface DistributeAssessmentPointsResponse {
    updated: number;
    pointPerQuestion: number;
    totalPoints: number;
    scale: number;
    strategy: DistributePointsStrategy;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────
export interface AssessmentResponse {
    id: string;
    teacherId: string;
    teacherName: string;
    lessonIds: string[];
    lessonTitles: string[];
    title: string;
    description?: string;
    assessmentType: AssessmentType;
    timeLimitMinutes?: number;
    passingScore?: number;
    startDate?: string;
    endDate?: string;
    randomizeQuestions?: boolean;
    showCorrectAnswers?: boolean;
    assessmentMode?: AssessmentMode;
    examMatrixId?: string;
    examMatrixName?: string;
    examMatrixGradeLevel?: number;
    allowMultipleAttempts?: boolean;
    maxAttempts?: number;
    attemptScoringPolicy?: AttemptScoringPolicy;
    showScoreImmediately?: boolean;
    status: AssessmentStatus;
    totalQuestions: number;
    totalPoints: number;
    generationSummary?: AssessmentGenerationSummary;
    submissionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentSummary {
    totalQuestions: number;
    totalPoints: number;
    timeLimitMinutes?: number;
    startDate?: string;
    endDate?: string;
    hasSchedule: boolean;
    canPublish: boolean;
    validationMessage?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface GetMyAssessmentsParams {
    status?: AssessmentStatus;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

