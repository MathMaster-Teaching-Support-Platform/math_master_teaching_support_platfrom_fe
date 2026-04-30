import type { QuestionTemplateResponse } from './questionTemplate';

export interface QuestionBankRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  // ❌ REMOVED: chapterId (QuestionBank is now a simple container with NO academic context)
}

export interface QuestionBankResponse {
  id: string;
  teacherId: string;
  teacherName?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  // ❌ REMOVED: chapterId, chapterTitle (QuestionBank is now a simple container)
  questionCount: number;
  cognitiveStats?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
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
