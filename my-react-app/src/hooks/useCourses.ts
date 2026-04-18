import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourseService } from '../services/api/course.service';
import type {
  AddAssessmentToCourseRequest,
  CreateCourseLessonRequest,
  CreateCourseRequest,
  GetPublicCoursesParams,
  PublishCourseRequest,
  UpdateCourseAssessmentRequest,
  UpdateCourseLessonRequest,
  UpdateCourseRequest,
  UpdateCustomCourseSectionRequest,
  CreateCustomCourseSectionRequest,
  CourseReviewRequest,
  InstructorReplyRequest,
} from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const courseKeys = {
  all: ['courses'] as const,
  my: () => [...courseKeys.all, 'my'] as const,
  public: (params: GetPublicCoursesParams) => [...courseKeys.all, 'public', params] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  lessons: (courseId: string) => [...courseKeys.all, 'lessons', courseId] as const,
  students: (courseId: string) => [...courseKeys.all, 'students', courseId] as const,
  enrollments: () => ['enrollments', 'my'] as const,
  progress: (enrollmentId: string) => ['enrollments', 'progress', enrollmentId] as const,
};

// ─── Teacher Hooks ────────────────────────────────────────────────────────────

export function useTeacherCourses() {
  return useQuery({
    queryKey: courseKeys.my(),
    queryFn: () => CourseService.getMyCourses(),
  });
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => CourseService.getCourseById(courseId),
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, thumbnailFile }: { data: CreateCourseRequest; thumbnailFile?: File }) =>
      CourseService.createCourse({ ...data, thumbnailFile }),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.my() }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: UpdateCourseRequest }) =>
      CourseService.updateCourse(courseId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: courseKeys.my() });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => CourseService.deleteCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.my() }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: PublishCourseRequest }) =>
      CourseService.publishCourse(courseId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: courseKeys.my() });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: courseKeys.students(courseId),
    queryFn: () => CourseService.getStudentsInCourse(courseId),
    enabled: !!courseId,
  });
}

// ─── Course Lesson Hooks ──────────────────────────────────────────────────────

export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: courseKeys.lessons(courseId),
    queryFn: () => CourseService.getLessons(courseId),
    enabled: !!courseId,
  });
}

export function useAddCourseLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      request,
      videoFile,
    }: {
      courseId: string;
      request: CreateCourseLessonRequest;
      videoFile?: File;
    }) => CourseService.addLesson(courseId, request, videoFile),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId) }),
  });
}

export function useUpdateCourseLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      request,
      videoFile,
    }: {
      courseId: string;
      lessonId: string;
      request: UpdateCourseLessonRequest;
      videoFile?: File;
    }) => CourseService.updateLesson(courseId, lessonId, request, videoFile),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId) }),
  });
}

export function useDeleteCourseLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
      CourseService.deleteLesson(courseId, lessonId),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId) }),
  });
}

// ─── Public / Student Hooks ───────────────────────────────────────────────────

export function usePublicCourses(params: GetPublicCoursesParams = {}) {
  return useQuery({
    queryKey: courseKeys.public(params),
    queryFn: () => CourseService.getPublicCourses(params),
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: courseKeys.enrollments(),
    queryFn: () => CourseService.getMyEnrollments(),
  });
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => CourseService.enroll(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.enrollments() }),
  });
}

export function useDropEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => CourseService.dropEnrollment(enrollmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.enrollments() }),
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Hủy đăng ký thất bại';
      globalThis.alert(msg);
    },
  });
}

export function useCourseProgress(enrollmentId: string) {
  return useQuery({
    queryKey: courseKeys.progress(enrollmentId),
    queryFn: () => CourseService.getProgress(enrollmentId),
    enabled: !!enrollmentId,
  });
}

export function useMarkLessonComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      courseLessonId,
    }: {
      enrollmentId: string;
      courseLessonId: string;
    }) => CourseService.markLessonComplete(enrollmentId, courseLessonId),
    onSuccess: (_data, { enrollmentId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.progress(enrollmentId) }),
  });
}

// ─── Course Assessment Hooks ──────────────────────────────────────────────────

export function useCourseAssessments(
  courseId: string,
  filters?: {
    status?: string;
    type?: string;
    isRequired?: boolean;
  }
) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'assessments', filters],
    queryFn: () => CourseService.getCourseAssessments(courseId, filters),
    enabled: !!courseId,
  });
}

export function useAvailableAssessmentsForCourse(
  courseId: string,
  includeOutOfCourseLessons = false
) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'assessments', 'available', includeOutOfCourseLessons],
    queryFn: () =>
      CourseService.getAvailableAssessmentsForCourse(courseId, includeOutOfCourseLessons),
    enabled: !!courseId,
  });
}

export function useAddAssessmentToCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: AddAssessmentToCourseRequest }) =>
      CourseService.addAssessmentToCourse(courseId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'assessments'] });
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'assessments', 'available'] });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useUpdateCourseAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      assessmentId,
      data,
    }: {
      courseId: string;
      assessmentId: string;
      data: UpdateCourseAssessmentRequest;
    }) => CourseService.updateCourseAssessment(courseId, assessmentId, data),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'assessments'] }),
  });
}

export function useRemoveAssessmentFromCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, assessmentId }: { courseId: string; assessmentId: string }) =>
      CourseService.removeAssessmentFromCourse(courseId, assessmentId),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'assessments'] });
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'assessments', 'available'] });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

// ─── Custom Course Section Hooks ─────────────────────────────────────────────

export const sectionKeys = {
  all: ['course-sections'] as const,
  course: (courseId: string) => [...sectionKeys.all, courseId] as const,
};

export function useCustomCourseSections(courseId: string) {
  return useQuery({
    queryKey: sectionKeys.course(courseId),
    queryFn: () => CourseService.listSections(courseId),
    enabled: !!courseId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CreateCustomCourseSectionRequest }) =>
      CourseService.createSection(courseId, data),
    onSuccess: (_data, { courseId }) => qc.invalidateQueries({ queryKey: sectionKeys.course(courseId) }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      data,
    }: {
      courseId: string;
      sectionId: string;
      data: UpdateCustomCourseSectionRequest;
    }) => CourseService.updateSection(courseId, sectionId, data),
    onSuccess: (_data, { courseId }) => qc.invalidateQueries({ queryKey: sectionKeys.course(courseId) }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId }: { courseId: string; sectionId: string }) =>
      CourseService.deleteSection(courseId, sectionId),
    onSuccess: (_data, { courseId }) => qc.invalidateQueries({ queryKey: sectionKeys.course(courseId) }),
  });
}

// ─── Lesson Material Hooks ───────────────────────────────────────────────────

export function useAddMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, file }: { courseId: string; lessonId: string; file: File }) =>
      CourseService.addMaterial(courseId, lessonId, file),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId) }),
  });
}

export function useRemoveMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      materialId,
    }: {
      courseId: string;
      lessonId: string;
      materialId: string;
    }) => CourseService.removeMaterial(courseId, lessonId, materialId),
    onSuccess: (_data, { courseId }) =>
      qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId) }),
  });
}

// ─── Course Review Hooks ──────────────────────────────────────────────────────

export function useCourseReviews(courseId: string, page = 0, size = 10, rating?: number) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'reviews', page, size, rating],
    queryFn: () => CourseService.getCourseReviews(courseId, page, size, rating),
    enabled: !!courseId,
  });
}

export function useReviewSummary(courseId: string) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'reviews', 'summary'],
    queryFn: () => CourseService.getReviewSummary(courseId),
    enabled: !!courseId,
  });
}

export function useMyReview(courseId: string) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'my-review'],
    queryFn: () => CourseService.getMyReview(courseId),
    enabled: !!courseId,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CourseReviewRequest }) =>
      CourseService.submitReview(courseId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'reviews'] });
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'my-review'] });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; courseId: string; data: CourseReviewRequest }) =>
      CourseService.updateReview(reviewId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'reviews'] });
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'my-review'] });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId }: { reviewId: string; courseId: string }) =>
      CourseService.deleteReview(reviewId),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'reviews'] });
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'my-review'] });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

// ─── Discovery & Instructor Hooks ──────────────────────────────────────────

export function useRelatedCourses(courseId: string, page = 0, size = 6) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'related', page, size],
    queryFn: () => CourseService.getRelatedCourses(courseId, page, size),
    enabled: !!courseId,
  });
}

export function useInstructorCourses(teacherId: string) {
  return useQuery({
    queryKey: ['courses', 'instructor', teacherId],
    queryFn: () => CourseService.getTeacherCourses(teacherId),
    enabled: !!teacherId,
  });
}

export function useTeacherProfile(teacherId: string) {
  return useQuery({
    queryKey: ['teacher', 'profile', teacherId],
    queryFn: () => CourseService.getTeacherProfile(teacherId),
    enabled: !!teacherId,
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; courseId: string; data: InstructorReplyRequest }) =>
      CourseService.replyToReview(reviewId, data),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: [...courseKeys.detail(courseId), 'reviews'] });
    },
  });
}
