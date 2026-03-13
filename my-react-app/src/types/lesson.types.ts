export interface LessonResponse {
  id: string;
  chapterId?: string;
  title?: string;
  learningObjectives?: string;
  lessonContent?: string;
  summary?: string;
  orderIndex?: number;
  durationMinutes?: number;
  difficulty?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonQueryParams {
  gradeLevel: string;
  subject: string;
}
