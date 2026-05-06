export const CognitiveLevel = {
    NHAN_BIET: 'NHAN_BIET',
    THONG_HIEU: 'THONG_HIEU',
    VAN_DUNG: 'VAN_DUNG',
    VAN_DUNG_CAO: 'VAN_DUNG_CAO',
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

// Question Tag Enum - matches backend QuestionTag.java
export const QuestionTag = {
  // Algebra
  LINEAR_EQUATIONS: 'LINEAR_EQUATIONS',
  QUADRATIC_EQUATIONS: 'QUADRATIC_EQUATIONS',
  POLYNOMIALS: 'POLYNOMIALS',
  SYSTEMS_OF_EQUATIONS: 'SYSTEMS_OF_EQUATIONS',
  INEQUALITIES: 'INEQUALITIES',
  FUNCTIONS: 'FUNCTIONS',
  SEQUENCES_SERIES: 'SEQUENCES_SERIES',
  
  // Geometry
  TRIANGLES: 'TRIANGLES',
  CIRCLES: 'CIRCLES',
  POLYGONS: 'POLYGONS',
  SOLID_GEOMETRY: 'SOLID_GEOMETRY',
  COORDINATE_GEOMETRY: 'COORDINATE_GEOMETRY',
  TRANSFORMATIONS: 'TRANSFORMATIONS',
  VECTORS: 'VECTORS',
  AREA_PERIMETER: 'AREA_PERIMETER',
  
  // Calculus
  LIMITS: 'LIMITS',
  DERIVATIVES: 'DERIVATIVES',
  INTEGRALS: 'INTEGRALS',
  DIFFERENTIAL_EQUATIONS: 'DIFFERENTIAL_EQUATIONS',
  SERIES_CONVERGENCE: 'SERIES_CONVERGENCE',
  
  // Statistics & Probability
  DESCRIPTIVE_STATISTICS: 'DESCRIPTIVE_STATISTICS',
  PROBABILITY: 'PROBABILITY',
  DISTRIBUTIONS: 'DISTRIBUTIONS',
  HYPOTHESIS_TESTING: 'HYPOTHESIS_TESTING',
  
  // Trigonometry
  TRIGONOMETRIC_FUNCTIONS: 'TRIGONOMETRIC_FUNCTIONS',
  TRIGONOMETRIC_IDENTITIES: 'TRIGONOMETRIC_IDENTITIES',
  INVERSE_TRIG: 'INVERSE_TRIG',
  
  // Number Theory
  PRIME_NUMBERS: 'PRIME_NUMBERS',
  DIVISIBILITY: 'DIVISIBILITY',
  MODULAR_ARITHMETIC: 'MODULAR_ARITHMETIC',
  GCD_LCM: 'GCD_LCM',
  
  // Combinatorics
  PERMUTATIONS: 'PERMUTATIONS',
  COMBINATIONS: 'COMBINATIONS',
  COUNTING_PRINCIPLES: 'COUNTING_PRINCIPLES',
  
  // Logic & Sets
  SET_THEORY: 'SET_THEORY',
  LOGIC: 'LOGIC',
  PROOF_TECHNIQUES: 'PROOF_TECHNIQUES',
  
  // Applied Math
  OPTIMIZATION: 'OPTIMIZATION',
  LINEAR_PROGRAMMING: 'LINEAR_PROGRAMMING',
  MATRICES: 'MATRICES',
  GRAPH_THEORY: 'GRAPH_THEORY',
  
  // Other
  WORD_PROBLEMS: 'WORD_PROBLEMS',
  PROBLEM_SOLVING: 'PROBLEM_SOLVING',
  MATHEMATICAL_REASONING: 'MATHEMATICAL_REASONING',
} as const;
export type QuestionTag = typeof QuestionTag[keyof typeof QuestionTag];

// Vietnamese labels for tags
export const questionTagLabels: Record<QuestionTag, string> = {
  // Algebra
  LINEAR_EQUATIONS: 'Phương trình bậc nhất',
  QUADRATIC_EQUATIONS: 'Phương trình bậc hai',
  POLYNOMIALS: 'Đa thức',
  SYSTEMS_OF_EQUATIONS: 'Hệ phương trình',
  INEQUALITIES: 'Bất phương trình',
  FUNCTIONS: 'Hàm số',
  SEQUENCES_SERIES: 'Dãy số và chuỗi',
  
  // Geometry
  TRIANGLES: 'Tam giác',
  CIRCLES: 'Đường tròn',
  POLYGONS: 'Đa giác',
  SOLID_GEOMETRY: 'Hình học không gian',
  COORDINATE_GEOMETRY: 'Hình học tọa độ',
  TRANSFORMATIONS: 'Phép biến hình',
  VECTORS: 'Vectơ',
  AREA_PERIMETER: 'Diện tích và chu vi',
  
  // Calculus
  LIMITS: 'Giới hạn',
  DERIVATIVES: 'Đạo hàm',
  INTEGRALS: 'Tích phân',
  DIFFERENTIAL_EQUATIONS: 'Phương trình vi phân',
  SERIES_CONVERGENCE: 'Hội tụ chuỗi',
  
  // Statistics & Probability
  DESCRIPTIVE_STATISTICS: 'Thống kê mô tả',
  PROBABILITY: 'Xác suất',
  DISTRIBUTIONS: 'Phân phối xác suất',
  HYPOTHESIS_TESTING: 'Kiểm định giả thuyết',
  
  // Trigonometry
  TRIGONOMETRIC_FUNCTIONS: 'Hàm lượng giác',
  TRIGONOMETRIC_IDENTITIES: 'Đồng nhất thức lượng giác',
  INVERSE_TRIG: 'Hàm lượng giác ngược',
  
  // Number Theory
  PRIME_NUMBERS: 'Số nguyên tố',
  DIVISIBILITY: 'Tính chia hết',
  MODULAR_ARITHMETIC: 'Số học modulo',
  GCD_LCM: 'ƯCLN và BCNN',
  
  // Combinatorics
  PERMUTATIONS: 'Hoán vị',
  COMBINATIONS: 'Tổ hợp',
  COUNTING_PRINCIPLES: 'Nguyên lý đếm',
  
  // Logic & Sets
  SET_THEORY: 'Lý thuyết tập hợp',
  LOGIC: 'Logic',
  PROOF_TECHNIQUES: 'Kỹ thuật chứng minh',
  
  // Applied Math
  OPTIMIZATION: 'Tối ưu hóa',
  LINEAR_PROGRAMMING: 'Quy hoạch tuyến tính',
  MATRICES: 'Ma trận',
  GRAPH_THEORY: 'Lý thuyết đồ thị',
  
  // Other
  WORD_PROBLEMS: 'Bài toán thực tế',
  PROBLEM_SOLVING: 'Giải quyết vấn đề',
  MATHEMATICAL_REASONING: 'Lập luận toán học',
};

export type DiagramValue = string | Record<string, unknown> | null;

export const QuestionGenerationMode = {
    PARAMETRIC: 'PARAMETRIC',
    AI_FROM_CANONICAL: 'AI_FROM_CANONICAL',
} as const;
export type QuestionGenerationMode = typeof QuestionGenerationMode[keyof typeof QuestionGenerationMode];

export interface QuestionTemplateRequest {
    name: string;
    description?: string;
    gradeLevel?: string;  // ✅ NEW: Template owns academic context
    subjectId?: string;   // ✅ NEW: Template owns academic context
    chapterId?: string;   // ✅ NEW: Template owns academic context (CRITICAL)
    templateType: QuestionType;
    templateVariant?: string;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    statementMutations?: {  // ✅ NEW: For TRUE_FALSE templates
        clauseTemplates: Array<{
            text: string;
            truthValue: boolean;
            chapterId?: string;
            cognitiveLevel?: CognitiveLevel;
        }>;
    };
    topic?: string;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: QuestionTag[];
    isPublic?: boolean;
    questionBankId?: string | null;
    canonicalQuestionId?: string | null;
    diagramTemplate?: DiagramValue;
    solutionStepsTemplate?: string;
}

export interface QuestionTemplateResponse {
    id: string;
    createdBy: string;
    creatorName: string;
    name: string;
    description?: string;
    gradeLevel?: string;      // Template's academic context (e.g. "10")
    subjectId?: string;       // Subject of the chapter; needed to seed the FE cascade
    subjectName?: string;     // Display only
    chapterId?: string;       // Direct chapter anchor
    chapterName?: string;     // Display only
    lessonId?: string;        // Optional lesson anchor (preserves Excel-import value)
    templateType: QuestionType;
    templateVariant?: string;
    templateText: Record<string, unknown>;
    parameters: Record<string, unknown>;
    answerFormula: string;
    optionsGenerator?: Record<string, unknown>;
    statementMutations?: Record<string, unknown>;  // ✅ NEW: For TRUE_FALSE templates
    topic?: string;
    constraints?: string[];
    cognitiveLevel: CognitiveLevel;
    tags: QuestionTag[];
    isPublic?: boolean;
    status: TemplateStatus;
    usageCount?: number;
    avgSuccessRate?: number;
    createdAt: string;
    updatedAt: string;
    questionBankId?: string | null;
    canonicalQuestionId?: string | null;
    diagramTemplate?: DiagramValue;
    solutionStepsTemplate?: string;
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
    cognitiveLevel?: CognitiveLevel;
    tags?: QuestionTag[];
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
    diagramData?: DiagramValue;
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
    avoidDuplicates?: boolean;
    /** Free-text hint forwarded to the value selector, e.g. "vary signs of b". */
    distinctnessHint?: string;
    /** @deprecated retained for API compatibility; ignored by the new generator. */
    generationMode?: QuestionGenerationMode;
    /** @deprecated retained for API compatibility; ignored by the new generator. */
    canonicalQuestionId?: string;
}

// ── Method 1: Blueprint from a real-valued question ──────────────────────────
export interface BlueprintFromRealQuestionRequest {
    questionType: QuestionType;
    questionText: string;
    correctAnswer?: string;
    /** MCQ options, key = "A"|"B"|"C"|"D". */
    options?: Record<string, string>;
    /** TF clauses, key = "A"|"B"|"C"|"D" → { text, truthValue }. */
    clauses?: Record<string, { text: string; truthValue: boolean }>;
    solutionSteps?: string;
    diagramLatex?: string;
    cognitiveLevel: CognitiveLevel;
    gradeLevel?: string;
    subjectId?: string;
    chapterId?: string;
    questionBankId?: string;
}

export interface BlueprintParameter {
    name: string;
    constraintText: string;
    sampleValue: number | string | null;
    occurrences: string[];
}

export interface BlueprintDiffEntry {
    field: string;
    before: string;
    after: string;
}

export interface BlueprintTfClauseDraft {
    key: string;
    text: string;
    truthValue: boolean;
}

export interface BlueprintFromRealQuestionResponse {
    templateText: string;
    answerFormula: string;
    solutionStepsTemplate?: string;
    diagramTemplate?: string;
    optionsGenerator?: Record<string, string>;
    clauseTemplates?: BlueprintTfClauseDraft[];
    parameters: BlueprintParameter[];
    globalConstraints: string[];
    diff: BlueprintDiffEntry[];
    warnings: string[];
    confidence: number;
}

// ── Review queue (post-generation approval flow) ────────────────────────────
export interface ReviewQuestionResponse {
    id: string;
    questionType: QuestionType;
    questionText: string;
    options?: Record<string, unknown>;
    correctAnswer?: string;
    explanation?: string;
    solutionSteps?: string;
    diagramData?: DiagramValue;
    diagramUrl?: string;
    cognitiveLevel?: CognitiveLevel;
    questionStatus: 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
    templateId?: string;
    /** Display name of the template — populated by BE QuestionResponse.templateName. */
    templateName?: string;
    generationMetadata?: Record<string, unknown>;
    createdAt: string;
}

export interface BulkRejectQuestionsRequest {
    questionIds: string[];
    reason?: string;
}

export interface GenerateQuestionsFromCanonicalRequest {
    templateId: string;
    count: number;
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

// ── Feature 1: Extract Parameters ────────────────────────────────────────────
export interface ExtractParametersRequest {
  templateText: string;
  answerFormula?: string;
  solutionSteps?: string;
  diagramLatex?: string;
  options?: Record<string, string>;   // MCQ options if present
  clauses?: Record<string, string>;   // TF clauses if present
}

export interface SuggestedParam {
  originalValue: string;
  location: string;         // e.g. "2x² (leading coefficient)"
  suggestedName: string;    // e.g. "a"
  reason: string;
  changeable: true;
}

export interface FixedValue {
  originalValue: string;
  location: string;
  reason: string;
}

export interface ExtractParametersResponse {
  suggestedParams: SuggestedParam[];
  fixedValues: FixedValue[];
  templateResult: string;   // template text with {{a}} {{b}} {{c}} inserted
}

// ── Feature 2: Generate Parameters ───────────────────────────────────────────
export interface GenerateParametersRequest {
  templateText: string;
  answerFormula?: string;
  solutionSteps?: string;
  diagramLatex?: string;
  options?: Record<string, string>;
  clauses?: Record<string, string>;
  parameters: string[];                          // ["a", "b", "c"]
  sampleQuestions?: Array<Record<string, unknown>>;
}

export interface GenerateParametersResponse {
  parameters: Record<string, number | string>;  // { a: 2, b: -3, c: 1 }
  constraintText: Record<string, string>;        // plain text per param
  combinedConstraints: string[];
  filledTextPreview?: string;
}

// ── Feature 2b: Update Parameters ────────────────────────────────────────────
export interface UpdateParametersRequest {
  currentParameters: Record<string, number | string>;
  currentConstraintText: Record<string, string>;
  teacherCommand: string;
  answerFormula?: string;
}

// ── Feature 4: Set Clause Points ─────────────────────────────────────────────
export interface SetClausePointsRequest {
  totalPoint: number;
  clausePoints: Record<string, number>;  // { A: 0.25, B: 0.25, C: 0.25, D: 0.25 }
}
