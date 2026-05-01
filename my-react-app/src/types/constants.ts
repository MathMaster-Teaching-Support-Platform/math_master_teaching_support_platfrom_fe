import type { QuestionType } from './question';
import type { MatrixQuestionType } from './examMatrix';

// DEPRECATED: Part type is now dynamic from API (exam_matrix_parts table)
// Use ExamMatrixPartConfig.questionType instead
// @deprecated Use parts[] from API response instead
export const PART_TYPE_MAP: Record<number, QuestionType> = {
  1: 'MULTIPLE_CHOICE',
  2: 'TRUE_FALSE',
  3: 'SHORT_ANSWER',
};

// DEPRECATED: Part labels are now dynamic from API
// Use ExamMatrixPartConfig.name or generate from questionType
// @deprecated Use parts[] from API response instead
export const PART_LABELS: Record<number, string> = {
  1: 'Phần I (Trắc nghiệm)',
  2: 'Phần II (Đúng/Sai)',
  3: 'Phần III (Trả lời ngắn)',
};

// FE-3: NEW - Question type labels for dynamic part configuration
export const QUESTION_TYPE_LABELS: Record<MatrixQuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
};

export const FE_DEFAULTS = {
  questionType: 'MULTIPLE_CHOICE' as QuestionType,
  numberOfParts: 1,
  partTypeMapping: { 1: 'MULTIPLE_CHOICE' as QuestionType },
} as const;

export const COGNITIVE_LEVELS = {
  NB: 'NHAN_BIET',
  TH: 'THONG_HIEU',
  VD: 'VAN_DUNG',
  VDC: 'VAN_DUNG_CAO',
} as const;

export const COGNITIVE_LEVEL_LABELS = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
} as const;
