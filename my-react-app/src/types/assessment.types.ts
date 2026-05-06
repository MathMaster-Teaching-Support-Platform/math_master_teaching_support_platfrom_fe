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
    lessonIds?: string[];  // Optional - auto-populated from matrix
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

export interface AddQuestionToAssessmentRequest {
    /** @NotNull */
    questionId: string;
    orderIndex?: number;
    /** @DecimalMin(0) */
    pointsOverride?: number;
}

export interface GenerateAssessmentFromMatrixRequest {
    examMatrixId: string;
    /**
     * Legacy single-bank field, kept for backward compatibility. New code should
     * use {@link questionBankIds} which supports multi-bank source pools.
     */
    questionBankId?: string;
    /**
     * Multi-bank source pool. Questions are randomly drawn from the union of
     * all listed banks for each cell of the matrix. When omitted the BE falls
     * back to the legacy single-bank field, then to the matrix's stored
     * default bank.
     */
    questionBankIds?: string[];
    reuseApprovedQuestions?: boolean;
    selectionStrategy?: AssessmentSelectionStrategy;
}

export interface GenerateQuestionsForAssessmentRequest {
    examMatrixId: string;
    /** See {@link GenerateAssessmentFromMatrixRequest.questionBankId}. */
    questionBankId?: string;
    /** See {@link GenerateAssessmentFromMatrixRequest.questionBankIds}. */
    questionBankIds?: string[];
    reuseApprovedQuestions?: boolean;
    selectionStrategy?: AssessmentSelectionStrategy;
}

/** Pre-flight bank-coverage check payload (POST /assessments/validate-bank-coverage). */
export interface ValidateBankCoverageRequest {
    examMatrixId: string;
    questionBankIds: string[];
}

export interface BankCoverageCell {
    chapterId?: string;
    chapterTitle?: string;
    cognitiveLevel?: string;
    questionType?: string;
    required: number;
    available: number;
}

export interface BankCoverageResponse {
    ok: boolean;
    cells: BankCoverageCell[];
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
    diagramData?: Record<string, unknown> | string | null;
    diagramUrl?: string;
    diagramLatex?: string;
    canonicalQuestionId?: string;
    createdAt?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
    cognitiveLevel?: string;
    questionSourceType?: 'MANUAL' | 'TEMPLATE_GENERATED' | 'AI_GENERATED' | 'BANK_IMPORTED' | 'BANK' | 'AI';
    source?: 'BANK' | 'AI';
    studentAnswer?: string;  // NEW: MCQ="B", SA="8", TF="A,C"
    scoringDetail?: Record<string, unknown>;  // NEW: Clause breakdown for TF questions
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

export interface PagedDataResponse<T> {
    data: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────
export interface AssessmentResponse {
    id: string;
    teacherId: string;
    teacherName: string;
    lessonIds: string[];
    lessonTitles: string[];
    lessons?: AssessmentLessonInfo[];  // BUG FIX #4: Detailed lesson info
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
    questionBankName?: string;
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

// BUG FIX #4: Detailed lesson information with subject and grade
export interface AssessmentLessonInfo {
    lessonId: string;
    lessonName: string;
    chapterName: string;
    orderIndex?: number;
    // Subject and grade information from chapter
    subjectName?: string;      // e.g., "Toán", "Vật lý"
    gradeLevel?: number;       // e.g., 10, 11, 12
    gradeName?: string;        // e.g., "Lớp 10", "Lớp 11"
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

