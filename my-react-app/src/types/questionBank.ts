export interface QuestionBankRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface QuestionBankResponse {
  id: string;
  teacherId: string;
  teacherName?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface SearchQuestionBanksParams {
  isPublic?: boolean;
  searchTerm?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
