// types/bulkImport.ts
export interface TfClauseTemplate {
  text: string;
  truthValue: boolean;
  cognitiveLevel?: string;
  chapterId?: string;
}

export interface QuestionTemplateRequest {
  name: string;
  description?: string;
  templateType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  templateText: {
    vi: string;
  };
  parameters: Record<
    string,
    {
      type: 'int' | 'float';
      min: number;
      max: number;
    }
  >;
  /** Required for MCQ + SHORT_ANSWER. Empty for TRUE_FALSE. */
  answerFormula?: string;
  /**
   * MCQ only: 4 evaluable formulas keyed A/B/C/D. Each is computed with the
   * sampled parameters at generation time so the question shows consistent
   * numeric options. One key must match `answerFormula`.
   */
  optionsGenerator?: Record<string, string>;
  /** Optional LaTeX/TikZ block with `{{param}}` placeholders. */
  diagramTemplate?: string;
  /** Optional step-by-step solution template, supports LaTeX + `{{param}}`. */
  solutionStepsTemplate?: string;
  /** TRUE_FALSE only: list of clause templates with truth values. */
  statementMutations?: {
    clauseTemplates: TfClauseTemplate[];
  };
  cognitiveLevel:
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
  tags: string[];
  isPublic?: boolean;
  questionBankId?: string;
  canonicalQuestionId?: string;
}

export interface PreviewRow {
  rowNumber: number;
  isValid: boolean;
  data: QuestionTemplateRequest | null;
  validationErrors: string[] | null;
}

export interface ExcelPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
}

export interface ImportErrorDetail {
  rowNumber: number;
  rowName: string;
  field: string;
  message: string;
}

export interface QuestionTemplateResponse {
  id: string;
  name: string;
  description?: string;
  templateType: string;
  templateText: Record<string, string>;
  parameters: Record<string, unknown>;
  answerFormula: string;
  optionsGenerator?: Record<string, unknown>;
  cognitiveLevel: string;
  tags: string[];
  isPublic: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  usageCount: number;
  avgSuccessRate?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBatchImportResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  successfulTemplates: QuestionTemplateResponse[];
  errors: ImportErrorDetail[] | null;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// ─── Question Bulk Import ───────────────────────────────────────────────────

export interface QuestionImportRequest {
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODING';
  cognitiveLevel:
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
  points?: number;
  correctAnswer?: string;
  explanation?: string;
  /** Step-by-step solution (LaTeX-supported). */
  solutionSteps?: string;
  /** Raw TikZ / PGFPlots block; rendered server-side. */
  diagramData?: string;
  tags?: string[];
  /** MCQ: A/B/C/D answer texts. TF: A/B/C/D statements. SHORT_ANSWER: null. */
  options?: Record<string, unknown>;
  /**
   * Type-specific metadata persisted as JSONB.
   * - SHORT_ANSWER: { answerValidationMode: 'EXACT'|'NUMERIC'|'REGEX', answerTolerance: number }
   * - TRUE_FALSE:   { tfClauses: { A: { truthValue, cognitiveLevel }, ... } }
   */
  generationMetadata?: Record<string, unknown>;
  questionBankId?: string;
  /** Chapter the question belongs to. Required by BE; injected by the bulk-import UI. */
  chapterId?: string;
}

export interface QuestionPreviewRow {
  rowNumber: number;
  isValid: boolean;
  data: QuestionImportRequest | null;
  validationErrors: string[] | null;
}

export interface QuestionExcelPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: QuestionPreviewRow[];
}

export interface QuestionBatchImportResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: string[] | null;
}
