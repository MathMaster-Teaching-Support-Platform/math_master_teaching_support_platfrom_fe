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

export interface BuildExamMatrixRequest extends ExamMatrixRequest {
    gradeLevel?: string;
    subjectId?: string;
}

export type MatrixCognitiveLevel = 'NB' | 'TH' | 'VD' | 'VDC';

export interface MatrixCognitiveDistribution {
    NB?: number;
    TH?: number;
    VD?: number;
    VDC?: number;
    NHAN_BIET?: number;
    THONG_HIEU?: number;
    VAN_DUNG?: number;
    VAN_DUNG_CAO?: number;
    REMEMBER?: number;
    UNDERSTAND?: number;
    APPLY?: number;
    ANALYZE?: number;
}

export interface ExamMatrixRowCellRequest {
    cognitiveLevel: MatrixCognitiveLevel;
    questionCount: number;
    pointsPerQuestion: number;
}

export interface ExamMatrixRowRequest {
    chapterId: string;
    lessonId?: string;
    questionBankId: string;
    questionDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionTypeName: string;
    referenceQuestions?: string;
    cells: ExamMatrixRowCellRequest[];
}

export interface ExamMatrixRowCellResponse {
    cognitiveLevel: string;
    questionCount: number;
    pointsPerQuestion: number;
    totalPoints?: number;
}

export interface ExamMatrixTableRow {
    rowId: string;
    chapterId?: string;
    chapterName?: string;
    lessonId?: string;
    lessonName?: string;
    questionBankId: string;
    questionBankName?: string;
    questionDifficulty?: string;
    questionTypeName: string;
    referenceQuestions?: string;
    countByCognitive?: MatrixCognitiveDistribution;
    cells?: ExamMatrixRowCellResponse[];
    rowTotalQuestions: number;
    rowTotalPoints: number;
}

export interface ExamMatrixTableChapter {
    chapterId?: string;
    chapterName?: string;
    rows: ExamMatrixTableRow[];
    totalByCognitive?: MatrixCognitiveDistribution;
    chapterTotalQuestions: number;
    chapterTotalPoints: number;
}

export interface ExamMatrixTableResponse {
    matrixId?: string;
    matrixName?: string;
    gradeLevel?: string;
    subjectId?: string;
    subjectName?: string;
    status?: MatrixStatus;
    chapters: ExamMatrixTableChapter[];
    grandTotalByCognitive?: MatrixCognitiveDistribution;
    grandTotalQuestions: number;
    grandTotalPoints: number;
}

export interface AddTemplateMappingRequest {
    templateId: string;
    cognitiveLevel: CognitiveLevel;
    questionCount: number;
    pointsPerQuestion: number;
}

export interface AddTemplateBatchRequest {
    templateIds: string[];
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
    gradeLevel?: string;
    subjectId?: string;
    subjectName?: string;
    status: MatrixStatus;
    templateMappingCount?: number;
    templateMappings?: TemplateMappingResponse[];
    rowCount?: number;
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
