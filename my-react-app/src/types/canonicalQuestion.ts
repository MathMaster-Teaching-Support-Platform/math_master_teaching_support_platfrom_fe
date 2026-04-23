export type CanonicalCognitiveLevel =
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

export interface CanonicalQuestionRequest {
  title: string;
  problemText: string;
  solutionSteps: string;
  cognitiveLevel: CanonicalCognitiveLevel;
}

export interface CanonicalQuestionResponse {
  id: string;
  createdBy?: string;
  creatorName?: string;
  title: string;
  problemText: string;
  solutionSteps: string;
  cognitiveLevel: CanonicalCognitiveLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

export interface CanonicalQuestionPagingParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
