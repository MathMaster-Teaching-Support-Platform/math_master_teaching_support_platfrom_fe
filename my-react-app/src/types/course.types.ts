// Course Management Types

export interface MaterialItem {
  type: 'slide' | 'mindmap' | 'document';
  title: string;
  url: string;
}

export interface CourseResponse {
  id: string;
  teacherId: string;
  teacherName: string | null;
  subjectId: string;
  subjectName: string | null;
  schoolGradeId: string;
  gradeLevel: number | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  published: boolean; // Backend returns 'published', not 'isPublished'
  isPublished: boolean; // Alias for compatibility
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessonResponse {
  id: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string | null;
  videoUrl: string | null;
  videoTitle: string | null;
  durationSeconds: number | null;
  orderIndex: number | null;
  isFreePreview: boolean;
  materials: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentResponse {
  id: string;
  courseId: string;
  courseTitle: string | null;
  studentId: string;
  studentName: string | null;
  status: 'ACTIVE' | 'DROPPED';
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgressItem {
  courseLessonId: string;
  videoTitle: string | null;
  orderIndex: number | null;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface StudentProgressResponse {
  enrollmentId: string;
  courseId: string;
  courseTitle: string | null;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  lessons: LessonProgressItem[];
}

export interface StudentInCourseResponse {
  studentId: string;
  studentName: string | null;
  email: string | null;
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
}

// Request types
export interface CreateCourseRequest {
  subjectId: string;
  schoolGradeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface CreateCourseLessonRequest {
  lessonId: string;
  videoTitle?: string;
  orderIndex?: number;
  isFreePreview?: boolean;
  materials?: string;
}

export interface UpdateCourseLessonRequest {
  videoTitle?: string;
  orderIndex?: number;
  isFreePreview?: boolean;
  materials?: string;
}

export interface PublishCourseRequest {
  published: boolean;
}

export interface GetPublicCoursesParams {
  schoolGradeId?: string;
  subjectId?: string;
  keyword?: string;
  page?: number;
  size?: number;
}
