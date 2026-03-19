import type { ApiResponse } from './auth.types';

export interface ChapterResponse {
  id: string;
  subjectId?: string;
  title?: string;
  name?: string;
  description?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ChaptersApiResponse = ApiResponse<ChapterResponse[]>;
