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
    totalQuestionsTarget?: number | null;
    totalPointsTarget?: number | null;
}

export interface BuildExamMatrixRequest extends ExamMatrixRequest {
    gradeLevel?: string;
    subjectId?: string;
}

export type MatrixCognitiveLevel =
    | 'NB'
    | 'TH'
    | 'VD'
    | 'VDC'
    | 'NHAN_BIET'
    | 'THONG_HIEU'
    | 'VAN_DUNG'
    | 'VAN_DUNG_CAO';

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
    orderIndex?: number;
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
    subjectId?: string;
    subjectName?: string;
    subject?: string;
    schoolGradeName?: string;
    schoolGrade?: string;
    gradeLevel?: string;
    chapterId?: string;
    chapterName?: string;
    chapter?: string;
    lessonId?: string;
    lessonName?: string;
    questionBankId: string;
    questionBankName?: string;
    questionDifficulty?: string;
    questionTypeName: string;
    referenceQuestions?: string;
    countByCognitive?: MatrixCognitiveDistribution;
    cells?: ExamMatrixRowCellResponse[];
    subject_id?: string;
    subject_name?: string;
    school_grade_name?: string;
    school_grade?: string;
    grade_level?: string;
    chapter_name?: string;
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

export interface ExamMatrixResponse {
    id: string;
    teacherId: string;
    teacherName: string;
    name: string;
    description?: string;
    isReusable: boolean;
    totalQuestionsTarget?: number;
    totalPointsTarget?: number;
    cognitiveLevelPercentages?: MatrixCognitiveDistribution;
    gradeLevel?: string;
    subjectId?: string;
    subjectName?: string;
    status: MatrixStatus;
    rowCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface MatrixValidationReport {
    canApprove: boolean;
    errors: string[];
    warnings: string[];
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
    totalBankMappings?: number;
}

export type PercentageCognitiveLevel =
    | 'NHAN_BIET'
    | 'THONG_HIEU'
    | 'VAN_DUNG'
    | 'VAN_DUNG_CAO';

export interface UpdateMatrixPercentagesRequest {
    totalQuestionsTarget: number;
    cognitiveLevelPercentages: Record<PercentageCognitiveLevel, number>;
}

export interface GenerateAssessmentByPercentageRequest {
    examMatrixId: string;
    totalQuestions: number;
    cognitiveLevelPercentages: Record<PercentageCognitiveLevel, number>;
    assessmentTitle?: string;
    assessmentDescription?: string;
    randomizeQuestions?: boolean;
    reuseApprovedQuestions?: boolean;
    timeLimitMinutes?: number;
    passingScore?: number;
}

export interface CognitiveLevelDistribution {
    cognitiveLevel: PercentageCognitiveLevel;
    requestedPercentage: number;
    requestedCount: number;
    actualCount: number;
    availableInBank: number;
    status: 'SUCCESS' | 'INSUFFICIENT';
    message: string;
}

export interface PercentageBasedGenerationResponse {
    assessmentId: string;
    assessmentTitle: string;
    totalQuestionsRequested: number;
    totalQuestionsGenerated: number;
    totalPoints: number;
    distribution: CognitiveLevelDistribution[];
    warnings: string[] | null;
    success: boolean;
}

export interface ExamMatrixApiResponse<T> {
    code?: number;
    message?: string;
    result?: T;
}
