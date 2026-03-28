import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourseService } from '../services/api/course.service';
import type {
  CreateCourseRequest,
  CreateCourseLessonRequest,
  GetPublicCoursesParams,
  PublishCourseRequest,
  UpdateCourseRequest,
  UpdateCourseLessonRequest,
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
    mutationFn: (data: CreateCourseRequest) => CourseService.createCourse(data),
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
