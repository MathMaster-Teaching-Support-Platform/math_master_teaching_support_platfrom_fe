import type { ApiResponse } from './auth.types';

export interface SearchDocumentChapter {
  id: string;
  name: string;
}

export interface SearchDocumentLesson {
  id: string;
  name: string;
}

export interface SearchDocumentItem {
  id: string;
  title: string;
  chapter: SearchDocumentChapter;
  lesson: SearchDocumentLesson;
  type: string;
  createdAt: string;
}

export interface SearchDocumentsResult {
  documents: SearchDocumentItem[];
}

export interface SearchDocumentsApiResponse {
  code?: number;
  result?: SearchDocumentsResult;
  documents?: SearchDocumentItem[];
}

export interface AssessmentSearchItem {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  questionCount?: number;
  createdAt?: string;
}

export interface AssessmentSearchResult {
  assessments: AssessmentSearchItem[];
}

export interface AssessmentSearchApiResponse {
  code?: number;
  result?: AssessmentSearchResult;
  assessments?: AssessmentSearchItem[];
}

export type DocumentApiResponse = ApiResponse<SearchDocumentsResult>;
