export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type QuestionCognitiveLevel =
  | 'NHAN_BIET'
  | 'THONG_HIEU'
  | 'VAN_DUNG'
  | 'VAN_DUNG_CAO'
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export type QuestionStatus = 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';

// NEW: TF Clause Metadata
export interface TFClauseMetadata {
  chapterId?: string;
  cognitiveLevel?: QuestionCognitiveLevel;
}

export interface TFClausesMetadata {
  A?: TFClauseMetadata;
  B?: TFClauseMetadata;
  C?: TFClauseMetadata;
  D?: TFClauseMetadata;
}

// NEW: Scoring Detail for TF questions
export interface ClauseResult {
  expected: boolean;
  actual: boolean;
  correct: boolean;
  cognitiveLevel?: string;  // NEW: Cognitive level of this clause (e.g., "NHAN_BIET", "THONG_HIEU")
}

export interface ScoringDetail {
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  clauseResults?: Record<string, ClauseResult>;  // For TF questions
  correctCount?: number;  // For TF questions
  totalClauses?: number;  // For TF questions
  scoringRule?: string;  // e.g., "VIET_THPT"
  earnedRatio?: number;  // 0-1
}

export interface QuestionResponse {
  id: string;
  createdBy: string;
  creatorName?: string;
  questionText: string;
  questionType: QuestionType;
  options?: Record<string, unknown>;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  difficulty?: QuestionDifficulty;
  cognitiveLevel?: QuestionCognitiveLevel;
  questionStatus?: QuestionStatus;
  questionSourceType?: 'MANUAL' | 'TEMPLATE_GENERATED' | 'AI_GENERATED' | 'BANK_IMPORTED';
  canonicalQuestionId?: string;
  solutionSteps?: string;
  diagramData?: Record<string, unknown> | string;
  diagramUrl?: string;
  tags?: string[];
  templateId?: string;
  questionBankId?: string;
  questionBankName?: string;
  /** Chapter (chương) the question belongs to. Used for bank-tree bucket grouping. */
  chapterId?: string;
  lessonId?: string;
  // ✅ NEW: Generation metadata for TF clause tracking and SA validation
  generationMetadata?: {
    tfClauses?: TFClausesMetadata;  // For TRUE_FALSE: tracks chapter/level per clause
    answerValidation?: {  // For SHORT_ANSWER: validation mode
      mode: 'EXACT' | 'NUMERIC' | 'REGEX';
      tolerance?: number;
      pattern?: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  questionText: string;
  questionType: QuestionType;
  options?: Record<string, unknown> | null;
  correctAnswer?: string | null;
  explanation?: string;
  points?: number;
  difficulty?: QuestionDifficulty;
  cognitiveLevel?: QuestionCognitiveLevel;
  tags?: string[];
  questionBankId?: string | null;
  templateId?: string | null;
  canonicalQuestionId?: string | null;
  solutionSteps?: string;
  diagramData?: string;
}

export interface GetMyQuestionsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  searchName?: string;
  searchTag?: string;
}

export interface SearchQuestionsParams {
  keyword?: string;
  tag?: string;
  /** Narrow to a single chapter (server-side filter via /questions/search). */
  chapterId?: string;
  /**
   * One of NHAN_BIET / THONG_HIEU / VAN_DUNG / VAN_DUNG_CAO.
   * Bloom-style English levels are folded onto the matching bucket server-side.
   */
  cognitiveLevel?: string;
  page?: number;
  size?: number;
}

export interface QuestionIdsBatchRequest {
  questionIds: string[];
}

export interface UpdateQuestionRequest {
  questionText?: string;
  options?: Record<string, unknown>;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  difficulty?: QuestionDifficulty;
  cognitiveLevel?: QuestionCognitiveLevel;
  tags?: string[];
  status?: QuestionStatus;
  diagramData?: string;
}

export interface BulkApproveRequest {
  questionIds: string[];
}
