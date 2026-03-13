export interface QuestionResponse {
  id: string;
  createdBy: string;
  creatorName?: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  options?: Record<string, unknown>;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  cognitiveLevel?: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  questionStatus?: 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
  questionSourceType?: 'MANUAL' | 'TEMPLATE_GENERATED' | 'AI_GENERATED' | 'BANK_IMPORTED';
  tags?: string[];
  templateId?: string;
  questionBankId?: string;
  questionBankName?: string;
  createdAt: string;
  updatedAt: string;
}
