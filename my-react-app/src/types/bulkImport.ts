// types/bulkImport.ts
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
  answerFormula: string;
  optionsGenerator?: Record<string, string>;
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
