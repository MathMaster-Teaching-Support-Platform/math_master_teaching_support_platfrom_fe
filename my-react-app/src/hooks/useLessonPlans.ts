import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LessonPlanService } from '../services/api/lessonPlan.service';
import type { CreateLessonPlanRequest, UpdateLessonPlanRequest } from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const lessonPlanKeys = {
  all: ['lesson-plans'] as const,
  my: () => [...lessonPlanKeys.all, 'my'] as const,
  detail: (id: string) => [...lessonPlanKeys.all, 'detail', id] as const,
  myByLesson: (lessonId: string) => [...lessonPlanKeys.all, 'my', 'lesson', lessonId] as const,
  byLesson: (lessonId: string) => [...lessonPlanKeys.all, 'lesson', lessonId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Get all lesson plans of the current teacher */
export function useMyLessonPlans(enabled = true) {
  return useQuery({
    queryKey: lessonPlanKeys.my(),
    queryFn: () => LessonPlanService.getMyLessonPlans(),
    enabled,
  });
}

/** Get a single lesson plan by ID */
export function useLessonPlan(id: string, enabled = true) {
  return useQuery({
    queryKey: lessonPlanKeys.detail(id),
    queryFn: () => LessonPlanService.getLessonPlanById(id),
    enabled: enabled && !!id,
  });
}

/** Get the current teacher's lesson plan for a specific lesson */
export function useMyLessonPlanByLesson(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: lessonPlanKeys.myByLesson(lessonId),
    queryFn: () => LessonPlanService.getMyLessonPlanByLesson(lessonId),
    enabled: enabled && !!lessonId,
  });
}

/** Get all lesson plans for a lesson (admin/teacher view) */
export function useLessonPlansByLesson(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: lessonPlanKeys.byLesson(lessonId),
    queryFn: () => LessonPlanService.getLessonPlansByLesson(lessonId),
    enabled: enabled && !!lessonId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a new lesson plan */
export function useCreateLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonPlanRequest) => LessonPlanService.createLessonPlan(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonPlanKeys.my() });
      queryClient.invalidateQueries({
        queryKey: lessonPlanKeys.byLesson(variables.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: lessonPlanKeys.myByLesson(variables.lessonId),
      });
    },
  });
}

/** Update an existing lesson plan */
export function useUpdateLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonPlanRequest }) =>
      LessonPlanService.updateLessonPlan(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: lessonPlanKeys.my() });
      queryClient.invalidateQueries({ queryKey: lessonPlanKeys.detail(id) });
    },
  });
}

/** Delete a lesson plan */
export function useDeleteLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LessonPlanService.deleteLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonPlanKeys.all });
    },
  });
}
