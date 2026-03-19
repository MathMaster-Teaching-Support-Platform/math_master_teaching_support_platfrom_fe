import type { ApiResponse } from './auth.types';

export interface SubjectResponse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  gradeMin?: number;
  gradeMax?: number;
  primaryGradeLevel?: number;
  schoolGradeId?: string;
  isActive?: boolean;
  gradeLevels?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export type SubjectsApiResponse = ApiResponse<SubjectResponse[]>;
