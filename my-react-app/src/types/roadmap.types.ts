import type { ApiResponse } from './auth.types';

export type RoadmapLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type RoadmapStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type RoadmapLessonStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface RoadmapCatalogItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  level: RoadmapLevel;
  status: RoadmapStatus;
  estimatedHours: number;
  moduleCount: number;
  lessonCount: number;
  enrolledStudents: number;
  updatedAt: string;
}

export interface RoadmapLesson {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  status: RoadmapLessonStatus;
  isRequired: boolean;
}

export interface RoadmapModule {
  id: string;
  title: string;
  order: number;
  description?: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

export interface RoadmapDetail extends RoadmapCatalogItem {
  summary?: string;
  tags: string[];
  modules: RoadmapModule[];
}

export interface StudentRoadmapProgress {
  roadmapId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  currentLessonId?: string;
  lastUpdatedAt?: string;
}

export interface StudentRoadmapSnapshot {
  roadmap: RoadmapDetail;
  progress: StudentRoadmapProgress;
}

export interface UpdateRoadmapProgressRequest {
  lessonId: string;
  status: Extract<RoadmapLessonStatus, 'IN_PROGRESS' | 'COMPLETED'>;
}

export interface AdminRoadmapPayload {
  title: string;
  slug: string;
  description: string;
  level: RoadmapLevel;
  status: RoadmapStatus;
  estimatedHours: number;
  tags: string[];
}

export type RoadmapApiResponse<T> = ApiResponse<T>;
