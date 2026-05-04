import type { ApiResponse } from './auth.types';

export type LessonDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface SchoolGradeResponse {
  id: string;
  gradeLevel: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolGradeRequest {
  gradeLevel: number;
  name: string;
  description?: string;
}

export interface UpdateSchoolGradeRequest {
  gradeLevel?: number;
  name?: string;
  description?: string;
  active?: boolean;
}

export interface SubjectResponse {
  id: string;
  name: string;
  description?: string;
  gradeMin?: number;
  gradeMax?: number;
  isActive?: boolean;
  schoolGradeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectRequest {
  name: string;
  schoolGradeId: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  description?: string;
  gradeMin?: number;
  gradeMax?: number;
  isActive?: boolean;
  schoolGradeId?: string;
}

export interface ChapterResponse {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChapterRequest {
  subjectId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface UpdateChapterRequest {
  title?: string;
  description?: string;
  orderIndex?: number;
}

export interface LessonResponse {
  id: string;
  chapterId: string;
  title: string;
  learningObjectives?: string;
  lessonContent?: string;
  summary?: string;
  orderIndex?: number;
  durationMinutes?: number;
  difficulty?: LessonDifficulty;
  status?: LessonStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonRequest {
  chapterId: string;
  title: string;
  learningObjectives?: string;
  lessonContent?: string;
  summary?: string;
  orderIndex?: number;
  durationMinutes?: number;
  difficulty?: LessonDifficulty;
}

export interface UpdateLessonRequest {
  title?: string;
  learningObjectives?: string;
  lessonContent?: string;
  summary?: string;
  orderIndex?: number;
  durationMinutes?: number;
  difficulty?: LessonDifficulty;
  status?: LessonStatus;
}

export type SchoolGradesApiResponse = ApiResponse<SchoolGradeResponse[]>;
export type SubjectsApiResponse = ApiResponse<SubjectResponse[]>;
export type ChaptersApiResponse = ApiResponse<ChapterResponse[]>;
export type LessonsApiResponse = ApiResponse<LessonResponse[]>;
