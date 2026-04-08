export const CognitiveLevel = {
    NHAN_BIET: 'NHAN_BIET',
    THONG_HIEU: 'THONG_HIEU',
    VAN_DUNG: 'VAN_DUNG',
    VAN_DUNG_CAO: 'VAN_DUNG_CAO',
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
} as const;
export type CognitiveLevel = typeof CognitiveLevel[keyof typeof CognitiveLevel];

export const QuestionType = {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    SHORT_ANSWER: 'SHORT_ANSWER',
    ESSAY: 'ESSAY',
    CODING: 'CODING',
} as const;
export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export const TemplateStatus = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
} as const;
export type TemplateStatus = typeof TemplateStatus[keyof typeof TemplateStatus];

export const QuestionGenerationMode = {
    PARAMETRIC: 'PARAMETRIC',
    AI_FROM_CANONICAL: 'AI_FROM_CANONICAL',
} as const;
export type QuestionGenerationMode = typeof QuestionGenerationMode[keyof typeof QuestionGenerationMode];

export interface QuestionTemplateRequest {
    name: string;
    description?: string;
    templateType: QuestionType;
    templateVariant?: string;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    difficultyRules?: Record<string, unknown>;
    topic?: string;
    difficulty?: string;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: string[];
    isPublic?: boolean;
    questionBankId?: string | null;
    generationMode?: QuestionGenerationMode;
    canonicalQuestionId?: string | null;
    solutionTemplate?: string;
    diagramTemplate?: Record<string, unknown>;
    variableDefinitions?: Record<string, unknown>;
}

export interface QuestionTemplateResponse {
    id: string;
    createdBy: string;
    creatorName: string;
    name: string;
    description?: string;
    templateType: QuestionType;
    templateVariant?: string;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    difficultyRules?: Record<string, unknown>;
    topic?: string;
    difficulty?: string;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: string[];
    isPublic?: boolean;
    status: TemplateStatus;
    usageCount?: number;
    avgSuccessRate?: number;
    createdAt: string;
    updatedAt: string;
    questionBankId?: string | null;
    generationMode?: QuestionGenerationMode;
    canonicalQuestionId?: string | null;
    solutionTemplate?: string;
    diagramTemplate?: Record<string, unknown>;
    variableDefinitions?: Record<string, unknown>;
}

export interface AIEnhancedQuestionResponse {
    enhancedQuestionText?: string;
    enhancedOptions?: Record<string, string>;
    correctAnswerKey?: string;
    explanation?: string;
    alternativeSolutions?: string[];
    distractorExplanations?: Record<string, string>;
    enhanced: boolean;
    isValid: boolean;
    validationErrors?: string[];
    originalQuestionText?: string;
    originalOptions?: Record<string, string>;
}

export interface PlaceholderSuggestion {
    variableName?: string;
    type?: string;
    correctAnswer?: string;
    answerCalculation?: string;
    explanation?: string;
    usedParameters?: Record<string, unknown>;
}

export interface QuestionStructureAnalysis {
    detectedType?: QuestionType;
    detectedPatterns?: string[];
    placeholderSuggestions?: PlaceholderSuggestion[];
    detectedFormulas?: string[];
    mathematicalStructure?: string;
    detectedLanguage?: string;
    sampleQuestions?: string[];
}

export interface TemplateDraft {
    name?: string;
    description?: string;
    templateType?: QuestionType;
    templateText?: Record<string, string>;
    parameters?: Record<string, unknown>;
    answerFormula?: string;
    optionsGenerator?: Record<string, unknown>;
    difficultyRules?: Record<string, string>;
    cognitiveLevel?: CognitiveLevel;
    tags?: string[];
}

export interface ImportPreviewResponse {
    analysisSuccessful: boolean;
    suggestedTemplate?: QuestionTemplateRequest;
    detectedPatterns?: string[];
    placeholderSuggestions?: PlaceholderSuggestion[];
    detectedFormulas?: string[];
    mathematicalStructure?: string;
    detectedLanguage?: string;
    sampleQuestions?: string[];
}

export interface TemplateImportResponse {
    extractedText?: string;
    analysis?: QuestionStructureAnalysis;
    suggestedTemplate?: TemplateDraft;
    confidenceScore?: number;
    warnings?: string[];
    analysisSuccessful?: boolean;
}

export const QuestionDifficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    VERY_HARD: 'VERY_HARD',
} as const;
export type QuestionDifficulty = typeof QuestionDifficulty[keyof typeof QuestionDifficulty];

export interface GeneratedQuestionSample {
    questionText?: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    explanation?: string;
    calculatedDifficulty?: QuestionDifficulty;
    usedParameters?: Record<string, unknown>;
    analysisResult?: Record<string, unknown>;
    answerCalculation?: string;
    canonicalQuestionId?: string;
    solutionSteps?: string;
    diagramData?: Record<string, unknown>;
}

export interface TemplateTestResponse {
    templateId?: string;
    templateName?: string;
    samples?: GeneratedQuestionSample[];
    isValid?: boolean;
    validationErrors?: string[];
}

export interface GenerateQuestionsRequest {
    count: number;
    difficultyDistribution: {
        EASY?: number;
        MEDIUM?: number;
        HARD?: number;
    };
    generationMode?: QuestionGenerationMode;
    canonicalQuestionId?: string;
}

export interface GeneratedQuestionsBatchResponse {
    totalRequested?: number;
    totalGenerated?: number;
    generatedQuestionIds?: string[];
    warnings?: string[];
}

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    first: boolean;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    numberOfElements: number;
    empty: boolean;
}

export interface ApiResponse<T> {
    code?: number;
    message?: string;
    result?: T;
}
