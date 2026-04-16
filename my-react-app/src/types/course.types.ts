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
  thumbnailFile?: File;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnailFile?: File;
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

// Course Assessment Types
export interface CourseAssessmentResponse {
  id: string;
  courseId: string;
  assessmentId: string;
  orderIndex: number | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  // Denormalized assessment fields
  assessmentTitle: string | null;
  assessmentDescription: string | null;
  assessmentType: 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK' | null;
  assessmentStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | null;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  startDate: string | null;
  endDate: string | null;
  totalQuestions: number | null;
  totalPoints: number | null;
  submissionCount: number | null;
  matchedLessonCount: number;
  matchedLessonTitles: string[];
  lessonMatched: boolean;
}

export interface AvailableCourseAssessmentResponse {
  assessmentId: string;
  title: string;
  description: string | null;
  assessmentType: 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  timeLimitMinutes: number | null;
  totalQuestions: number;
  totalPoints: number;
  matchedLessonCount: number;
  matchedLessonIds: string[];
  matchedLessonTitles: string[];
}

export interface AddAssessmentToCourseRequest {
  assessmentId: string;
  orderIndex?: number;
  isRequired?: boolean;
  allowOutOfCourseLessons?: boolean;
}

export interface UpdateCourseAssessmentRequest {
  orderIndex?: number;
  isRequired?: boolean;
}
