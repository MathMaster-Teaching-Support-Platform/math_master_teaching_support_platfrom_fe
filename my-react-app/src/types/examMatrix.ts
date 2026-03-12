import type { CognitiveLevel, QuestionDifficulty, QuestionType } from './questionTemplate';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const MatrixStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    LOCKED: 'LOCKED',
} as const;
export type MatrixStatus = typeof MatrixStatus[keyof typeof MatrixStatus];

// ── Request types ─────────────────────────────────────────────────────────────

export interface ExamMatrixRequest {
    name: string;
    description?: string;
    isReusable?: boolean;
}

export interface AddTemplateMappingRequest {
    templateId: string;
    cognitiveLevel: CognitiveLevel;
    questionCount: number;
    pointsPerQuestion: number;
}

export interface GeneratePreviewRequest {
    templateId: string;
    count: number;
    difficulty?: QuestionDifficulty;
    seed?: number;
}

export interface FinalizePreviewQuestionItem {
    questionText: string;
    questionType: QuestionType;
    options?: Record<string, string>;
    correctAnswer?: string;
    explanation?: string;
    difficulty?: QuestionDifficulty;
    cognitiveLevel?: CognitiveLevel;
    tags?: string[];
    generationMetadata?: Record<string, unknown>;
}

export interface FinalizePreviewRequest {
    templateId: string;
    questions: FinalizePreviewQuestionItem[];
    replaceExisting?: boolean;
    pointsPerQuestion?: number;
    questionBankId?: string;
}

export interface ListMatchingTemplatesParams {
    q?: string;
    page?: number;
    size?: number;
    onlyMine?: boolean;
    publicOnly?: boolean;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface TemplateMappingResponse {
    id: string;
    examMatrixId: string;
    templateId: string;
    templateName?: string;
    cognitiveLevel: CognitiveLevel;
    questionCount: number;
    pointsPerQuestion: number;
    totalPoints: number;
    createdAt: string;
    updatedAt: string;
}

export interface ExamMatrixResponse {
    id: string;
    teacherId: string;
    teacherName: string;
    name: string;
    description?: string;
    isReusable: boolean;
    status: MatrixStatus;
    templateMappingCount: number;
    templateMappings: TemplateMappingResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface MatrixValidationReport {
    canApprove: boolean;
    errors: string[];
    warnings: string[];
    totalTemplateMappings: number;
    totalQuestions: number;
    totalPoints: number;
    cognitiveLevelCoverage: Record<string, number>;
    questionsMatchTarget: boolean;
    allCognitiveLevelsCovered: boolean;
}

// Matching templates
export interface MappingRequirementsInfo {
    matrixId: string;
    cognitiveLevel?: CognitiveLevel;
    questionCount: number;
}

export interface TemplateItem {
    templateId: string;
    name: string;
    description?: string;
    templateType: QuestionType;
    cognitiveLevel?: CognitiveLevel;
    tags?: string[];
    mine: boolean;
    isPublic?: boolean;
    createdBy: string;
    createdByName?: string;
    usageCount?: number;
    avgSuccessRate?: number;
    relevanceScore: number;
    createdAt: string;
    updatedAt: string;
}

export interface MatchingTemplatesResponse {
    mappingRequirements: MappingRequirementsInfo;
    totalTemplatesFound: number;
    templates: TemplateItem[];
    hint?: string;
}

// Preview / Finalize
export interface CandidateQuestion {
    index: number;
    questionText: string;
    options?: Record<string, string>;
    correctAnswerKey?: string;
    usedParameters?: Record<string, unknown>;
    answerCalculation?: string;
    calculatedDifficulty?: QuestionDifficulty;
    explanation?: string;
}

export interface PreviewMappingInfo {
    templateMappingId: string;
    templateId: string;
    templateName?: string;
    cognitiveLevel: CognitiveLevel;
    questionCount: number;
}

export interface PreviewCandidatesResponse {
    templateId: string;
    templateName: string;
    templateMappingId: string;
    matrixId: string;
    requestedCount: number;
    generatedCount: number;
    mappingRequirements: PreviewMappingInfo;
    candidates: CandidateQuestion[];
    warnings?: string[];
}

export interface FinalizePreviewResponse {
    templateMappingId: string;
    matrixId: string;
    templateId: string;
    requestedCount: number;
    savedCount: number;
    questionIds: string[];
    currentMappingQuestionCount: number;
    mappingTargetCount: number;
    warnings?: string[];
}

/** Generic API response wrapper used by exam-matrix service */
export interface ExamMatrixApiResponse<T> {
    code?: number;
    message?: string;
    result?: T;
}
