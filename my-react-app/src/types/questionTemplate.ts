export const CognitiveLevel = {
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

export interface QuestionTemplateRequest {
    name: string;
    description?: string;
    templateType: QuestionType;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    difficultyRules: Record<string, unknown>;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: string[];
    isPublic?: boolean;
}

export interface QuestionTemplateResponse {
    id: string;
    createdBy: string;
    creatorName: string;
    name: string;
    description?: string;
    templateType: QuestionType;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    difficultyRules: Record<string, unknown>;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: string[];
    isPublic?: boolean;
    status: TemplateStatus;
    usageCount?: number;
    avgSuccessRate?: number;
    createdAt: string;
    updatedAt: string;
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
}

export interface TemplateTestResponse {
    templateId?: string;
    templateName?: string;
    samples?: GeneratedQuestionSample[];
    isValid?: boolean;
    validationErrors?: string[];
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
