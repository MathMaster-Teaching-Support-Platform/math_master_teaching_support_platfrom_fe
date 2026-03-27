import type { CognitiveLevel, QuestionDifficulty, QuestionType } from './questionTemplate';

export const MatrixStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    LOCKED: 'LOCKED',
} as const;
export type MatrixStatus = typeof MatrixStatus[keyof typeof MatrixStatus];

export interface ExamMatrixRequest {
    name: string;
    description?: string;
    isReusable?: boolean;
    totalQuestionsTarget?: number;
    totalPointsTarget?: number;
}

export interface AddTemplateMappingRequest {
    templateId: string;
    cognitiveLevel: CognitiveLevel;
    questionCount: number;
    pointsPerQuestion: number;
}

export interface AddBankMappingRequest {
    questionBankId: string;
    difficultyDistribution: {
        EASY?: number;
        MEDIUM?: number;
        HARD?: number;
    };
    cognitiveLevel?: CognitiveLevel | string;
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
    totalQuestionsTarget?: number;
    totalPointsTarget?: number;
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
    totalQuestionsTarget?: number;
    totalPointsTarget?: number;
    cognitiveLevelCoverage: Record<string, number>;
    questionsMatchTarget: boolean;
    pointsMatchTarget: boolean;
    allCognitiveLevelsCovered: boolean;
    aiFallbackLikely?: boolean;
    bankCoverageByDifficulty?: Record<string, number>;
}

export interface BankMappingResponse {
    id: string;
    examMatrixId: string;
    questionBankId: string;
    questionBankName?: string;
    cognitiveLevel?: string;
    difficultyDistribution: {
        EASY?: number;
        MEDIUM?: number;
        HARD?: number;
    };
    createdAt: string;
    updatedAt: string;
}

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

export interface ExamMatrixApiResponse<T> {
    code?: number;
    message?: string;
    result?: T;
}
