// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateLessonPlanRequest {
  lessonId: string;
  objectives?: string[];
  materialsNeeded?: string[];
  teachingStrategy?: string;
  assessmentMethods?: string;
  notes?: string;
}

export interface UpdateLessonPlanRequest {
  objectives?: string[];
  materialsNeeded?: string[];
  teachingStrategy?: string;
  assessmentMethods?: string;
  notes?: string;
}

// ─── Response DTO ─────────────────────────────────────────────────────────────

export interface LessonPlanResponse {
  id: string;
  lessonId: string;
  teacherId: string;
  lessonTitle?: string;
  objectives?: string[];
  materialsNeeded?: string[];
  teachingStrategy?: string;
  assessmentMethods?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
