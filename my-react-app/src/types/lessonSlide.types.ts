export interface SchoolGrade {
  id: string;
  gradeLevel: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectByGrade {
  id: string;
  name: string;
  code: string;
  description: string | null;
  gradeMin: number | null;
  gradeMax: number | null;
  primaryGradeLevel: number | null;
  schoolGradeId: string;
  isActive: boolean;
  gradeLevels: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterBySubject {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonByChapter {
  id: string;
  chapterId: string;
  title: string;
  learningObjectives: string | null;
  lessonContent: string | null;
  summary: string | null;
  orderIndex: number;
  durationMinutes: number;
  difficulty: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonSlideItem {
  slideNumber: number;
  slideType: string;
  heading: string;
  content: string;
}

export interface LessonSlideTemplate {
  id: string;
  name: string;
  description: string | null;
  originalFileName: string;
  contentType: string;
  previewImage?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonSlideGeneratedFile {
  id: string;
  lessonId: string;
  templateId: string | null;
  name: string | null;
  thumbnail: string | null;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFileListResult {
  content?: LessonSlideGeneratedFile[];
}

export interface PageResult<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PublicGeneratedSlidesQuery {
  lessonId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export type LessonSlidePublicationStatus = 'DRAFT' | 'PUBLISHED';

export type LessonSlideOutputFormat = 'PLAIN_TEXT' | 'LATEX' | 'HYBRID';
export type LessonSlideEquationMode = 'OMML' | 'IMAGE' | 'PLAIN_TEXT';

export interface GenerateSlideContentRequest {
  schoolGradeId: string;
  subjectId: string;
  chapterId: string;
  lessonId: string;
  slideCount: number;
  additionalPrompt: string;
  outputFormat?: LessonSlideOutputFormat;
}

export interface GenerateSlideContentResult {
  subjectId: string;
  chapterId: string;
  lessonId: string;
  lessonTitle: string;
  slideCount: number;
  outputFormat?: LessonSlideOutputFormat;
  additionalPrompt?: string;
  slides: LessonSlideItem[];
}

export interface GeneratePptxRequest {
  lessonId: string;
  templateId: string;
  outputFormat?: LessonSlideOutputFormat;
  equationMode?: LessonSlideEquationMode;
  slides: LessonSlideItem[];
}

export interface ApiEnvelope<T> {
  code: number;
  message?: string;
  result: T;
}
