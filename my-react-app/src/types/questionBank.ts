import type { QuestionTemplateResponse } from './questionTemplate';

export interface QuestionBankRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  /** Happy-case: anchor the bank to one school grade (lớp). */
  schoolGradeId?: string;
  /** Optional: scope to a single subject within the grade. */
  subjectId?: string;
}

export interface QuestionBankResponse {
  id: string;
  teacherId: string;
  teacherName?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  questionCount: number;
  cognitiveStats?: Record<string, number>;
  schoolGradeId?: string;
  gradeLevel?: number;
  schoolGradeName?: string;
  subjectId?: string;
  subjectName?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Bank tree (happy-case view) ───────────────────────────────────────────

export type CognitiveLevelVi =
  | 'NHAN_BIET'
  | 'THONG_HIEU'
  | 'VAN_DUNG'
  | 'VAN_DUNG_CAO';

export interface QuestionBankTreeQuestionSummary {
  id: string;
  questionText: string;
  questionType?: string;
  questionStatus?: string;
}

export interface QuestionBankTreeCognitiveBucket {
  level: CognitiveLevelVi;
  count: number;
  questions: QuestionBankTreeQuestionSummary[];
}

export interface QuestionBankTreeChapterNode {
  chapterId: string;
  title: string;
  orderIndex?: number;
  totalQuestions: number;
  /** Always contains the four Vietnamese cognitive levels keyed by name. */
  buckets: Record<CognitiveLevelVi, QuestionBankTreeCognitiveBucket>;
}

export interface QuestionBankTreeResponse {
  bankId: string;
  bankName: string;
  schoolGradeId?: string;
  gradeLevel?: number;
  schoolGradeName?: string;
  subjectId?: string;
  subjectName?: string;
  chapters: QuestionBankTreeChapterNode[];
}

export interface QuestionBankTemplateMappingRequest {
  questionBankId: string;
  templateId: string;
}

export type QuestionBankTemplatesResponse = QuestionTemplateResponse[];

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

export interface SearchQuestionBanksParams {
  isPublic?: boolean;
  searchTerm?: string;
  // ❌ REMOVED: chapterId, subjectId, gradeLevel (search by name/visibility only)
  mineOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// Matrix Stats Types
export interface QuestionBankMatrixStatsResponse {
  gradeLevel: string;
  totalQuestions: number;
  chapters: ChapterStats[];
}

export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  totalQuestions: number;
  types: TypeStats[];
}

export interface TypeStats {
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  totalQuestions: number;
  cognitiveCounts: Record<string, number>;
}
