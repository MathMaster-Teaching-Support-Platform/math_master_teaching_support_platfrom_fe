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
  diagramData?: Record<string, unknown>;
  tags?: string[];
  templateId?: string;
  questionBankId?: string;
  questionBankName?: string;
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
  diagramData?: Record<string, unknown>;
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
  search?: string;
  type?: QuestionType;
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
}

export interface BulkApproveRequest {
  questionIds: string[];
}
