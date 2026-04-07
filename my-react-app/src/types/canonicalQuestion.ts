export type CanonicalQuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface CanonicalQuestionRequest {
  title: string;
  problemText: string;
  solutionSteps: string;
  diagramDefinition?: Record<string, unknown>;
  problemType: string;
  difficulty: CanonicalQuestionDifficulty;
}

export interface CanonicalQuestionResponse {
  id: string;
  createdBy?: string;
  creatorName?: string;
  title: string;
  problemText: string;
  solutionSteps: string;
  diagramDefinition?: Record<string, unknown>;
  problemType: string;
  difficulty: CanonicalQuestionDifficulty;
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
