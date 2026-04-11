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
    pointsOverride?: number | null;
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
    points?: number;
    questionSourceType?: 'MANUAL' | 'TEMPLATE_GENERATED' | 'AI_GENERATED' | 'BANK_IMPORTED' | 'BANK' | 'AI';
    source?: 'BANK' | 'AI';
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
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

