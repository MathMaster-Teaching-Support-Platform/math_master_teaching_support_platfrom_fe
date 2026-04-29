import type { QuestionType } from './question';

export const PART_TYPE_MAP: Record<number, QuestionType> = {
  1: 'MULTIPLE_CHOICE',
  2: 'TRUE_FALSE',
  3: 'SHORT_ANSWER',
};

export const PART_LABELS: Record<number, string> = {
  1: 'Phần I (Trắc nghiệm)',
  2: 'Phần II (Đúng/Sai)',
  3: 'Phần III (Trả lời ngắn)',
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
