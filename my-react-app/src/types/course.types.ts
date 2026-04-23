// Course Management Types

export type CourseProvider = 'MINISTRY' | 'CUSTOM';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';

export interface MaterialItem {
  type: 'slide' | 'mindmap' | 'document';
  title: string;
  url: string;
}

export interface CourseTeacherProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  position: string | null;
}

export interface CourseResponse {
  id: string;
  teacherId: string;
  teacherName: string | null;
  provider: CourseProvider;
  subjectId: string | null;
  subjectName: string | null;
  schoolGradeId: string | null;
  gradeLevel: number | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  published: boolean; // Backend returns 'published', not 'isPublished'
  isPublished: boolean; // Alias for compatibility
  status?: CourseStatus;
  rejectionReason?: string | null;
  
  // Approval audit trail
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  
  rating: number;
  ratingCount: number; // Add review count
  studentsCount: number;
  lessonsCount: number;
  teacherAvatar: string | null;
  teacherPosition: string | null;
  createdAt: string;
  updatedAt: string;
  whatYouWillLearn?: string;
  requirements?: string;
  targetAudience?: string;
  subtitle?: string;
  language?: string;
  level?: CourseLevel;
  totalVideoHours?: number;
  articlesCount?: number;
  resourcesCount?: number;
  sectionsCount: number;
  originalPrice: number | null;
  discountedPrice: number | null;
  discountExpiryDate: string | null;
  isEnrolled?: boolean | null;
  completedLessons?: number | null;
  progress?: number | null;
}

export interface CourseLessonResponse {
  id: string;
  courseId: string;
  /** FK to Ministry Lesson. Null for CUSTOM-course lessons. */
  lessonId: string | null;
  /** FK to CustomCourseSection. Null for MINISTRY-course lessons. */
  sectionId: string | null;
  /**
   * Display title: populated from Ministry lesson title (MINISTRY)
   * or from customTitle (CUSTOM) transparently.
   */
  lessonTitle: string | null;
  /** Teacher-defined description (CUSTOM courses only). */
  customDescription: string | null;
  videoUrl: string | null;
  videoTitle: string | null;
  durationSeconds: number | null;
  orderIndex: number | null;
  isFreePreview: boolean;
  materials: string | null;
  /** MINISTRY courses only */
  chapterId: string | null;
  chapterTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessonPreviewResponse {
  id: string;
  courseId: string;
  sectionId: string | null;
  lessonTitle: string | null;
  customDescription: string | null;
  videoTitle: string | null;
  durationSeconds: number | null;
  orderIndex: number | null;
  isFreePreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePreviewResponse {
  course: CourseResponse;
  lessons: CourseLessonPreviewResponse[];
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
  courseThumbnailUrl: string | null;
  completedLessons?: number;
  totalLessons?: number;
  completionRate?: number;
}

export interface LessonProgressItem {
  courseLessonId: string;
  videoTitle: string | null;
  orderIndex: number | null;
  isCompleted: boolean;
  completedAt: string | null;
  watchedSeconds?: number;
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
  provider: CourseProvider;
  /** Required when provider = MINISTRY */
  subjectId?: string;
  /** Required when provider = MINISTRY */
  schoolGradeId?: string;
  title: string;
  description?: string;
  thumbnailFile?: File;
  whatYouWillLearn?: string;
  requirements?: string;
  targetAudience?: string;
  subtitle?: string;
  language?: string;
  level?: CourseLevel;
  originalPrice?: number;
  discountedPrice?: number;
  discountExpiryDate?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnailFile?: File;
  whatYouWillLearn?: string;
  requirements?: string;
  targetAudience?: string;
  subtitle?: string;
  language?: string;
  level?: CourseLevel;
  originalPrice?: number;
  discountedPrice?: number;
  discountExpiryDate?: string;
}

export interface CreateCourseLessonRequest {
  /** Required for MINISTRY courses */
  lessonId?: string;
  /** Required for CUSTOM courses */
  sectionId?: string;
  /** Required for CUSTOM courses */
  customTitle?: string;
  /** Optional description for CUSTOM courses */
  customDescription?: string;
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

export interface ReorderLessonsRequest {
  orders: Array<{
    lessonId: string;
    orderIndex: number;
  }>;
}

export interface PublishCourseRequest {
  published: boolean;
}

export interface RejectCourseRequest {
  reason: string;
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

// ─── Custom Course Section Types ─────────────────────────────────────────────

export interface CustomCourseSectionResponse {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomCourseSectionRequest {
  title: string;
  description?: string;
  orderIndex: number;
}

export interface UpdateCustomCourseSectionRequest {
  title?: string;
  description?: string;
  orderIndex?: number;
}

// ─── Course Review Types ─────────────────────────────────────────────────────

export interface CourseReviewResponse {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  rating: number;
  comment: string;
  instructorReply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProfileResponse {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  schoolName: string;
  schoolAddress: string;
  schoolWebsite: string;
  position: string | null;
  verificationDocumentKey: string;
  description: string | null;
  status: string;
  adminComment: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  avatar: string | null;
  totalCourses: number;
  totalStudents: number;
  totalRatings: number;
  averageRating: number;
  websiteUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
}

export interface CourseReviewSummaryResponse {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface CourseReviewRequest {
  rating: number;
  comment: string;
}

export interface InstructorReplyRequest {
  reply: string;
}
