import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { GradingService } from '../services/grading.service';
import type {
  GradingSubmissionResponse,
  CompleteGradingRequest,
  GradeOverrideRequest,
  ManualAdjustmentRequest,
  GradingAnalyticsResponse,
  RegradeRequestResponse,
  RegradeRequestCreationRequest,
  RegradeResponseRequest,
} from '../types/grading.types';
import type { ApiResponse, PaginatedResponse } from '../types';

// Query Keys
export const gradingKeys = {
  all: ['grading'] as const,
  queues: () => [...gradingKeys.all, 'queue'] as const,
  queue: (filters: Record<string, unknown>) => [...gradingKeys.queues(), filters] as const,
  submissions: () => [...gradingKeys.all, 'submission'] as const,
  submission: (id: string) => [...gradingKeys.submissions(), id] as const,
  analytics: () => [...gradingKeys.all, 'analytics'] as const,
  analytic: (assessmentId: string) => [...gradingKeys.analytics(), assessmentId] as const,
  regradeRequests: () => [...gradingKeys.all, 'regrade'] as const,
  regradeRequest: (filters: Record<string, unknown>) => [...gradingKeys.regradeRequests(), filters] as const,
  myResult: (submissionId: string) => [...gradingKeys.all, 'my-result', submissionId] as const,
  pendingCount: () => [...gradingKeys.all, 'pending-count'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Get grading queue */
export function useGradingQueue(
  params: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<GradingSubmissionResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: gradingKeys.queue(params),
    queryFn: () => GradingService.getGradingQueue(params),
    ...options,
  });
}

/** Get grading queue by teacher */
export function useGradingQueueByTeacher(
  teacherId: string,
  params: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<GradingSubmissionResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: gradingKeys.queue({ teacherId, ...params }),
    queryFn: () => GradingService.getGradingQueueByTeacher(teacherId, params),
    enabled: !!teacherId,
    ...options,
  });
}

/** Get submission for grading */
export function useSubmissionForGrading(
  submissionId: string,
  options?: Omit<UseQueryOptions<ApiResponse<GradingSubmissionResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gradingKeys.submission(submissionId),
    queryFn: () => GradingService.getSubmissionForGrading(submissionId),
    enabled: !!submissionId,
    ...options,
  });
}

/** Get grading analytics */
export function useGradingAnalytics(
  assessmentId: string,
  options?: Omit<UseQueryOptions<ApiResponse<GradingAnalyticsResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gradingKeys.analytic(assessmentId),
    queryFn: () => GradingService.getGradingAnalytics(assessmentId),
    enabled: !!assessmentId,
    ...options,
  });
}

/** Get regrade requests */
export function useRegradeRequests(
  params: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<RegradeRequestResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: gradingKeys.regradeRequest(params),
    queryFn: () => GradingService.getRegradeRequests(params),
    ...options,
  });
}

/** Get student regrade requests */
export function useStudentRegradeRequests(
  studentId: string,
  params: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<RegradeRequestResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: gradingKeys.regradeRequest({ studentId, ...params }),
    queryFn: () => GradingService.getStudentRegradeRequests(studentId, params),
    enabled: !!studentId,
    ...options,
  });
}

/** Get my result (student view) */
export function useMyResult(
  submissionId: string,
  options?: Omit<UseQueryOptions<ApiResponse<GradingSubmissionResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gradingKeys.myResult(submissionId),
    queryFn: () => GradingService.getMyResult(submissionId),
    enabled: !!submissionId,
    ...options,
  });
}

/** Get pending count */
export function usePendingCount(
  options?: Omit<UseQueryOptions<ApiResponse<number>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gradingKeys.pendingCount(),
    queryFn: () => GradingService.getPendingCount(),
    ...options,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Complete grading */
export function useCompleteGrading() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CompleteGradingRequest) =>
      GradingService.completeGrading(request),
    onSuccess: (_data, variables) => {
      // Invalidate grading queue and submission
      queryClient.invalidateQueries({ queryKey: gradingKeys.queues() });
      queryClient.invalidateQueries({ 
        queryKey: gradingKeys.submission(variables.submissionId) 
      });
      queryClient.invalidateQueries({ queryKey: gradingKeys.pendingCount() });
    },
  });
}

/** Override grade */
export function useOverrideGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: GradeOverrideRequest) =>
      GradingService.overrideGrade(request),
    onSuccess: () => {
      // Invalidate all grading queries
      queryClient.invalidateQueries({ queryKey: gradingKeys.all });
    },
  });
}

/** Add manual adjustment */
export function useAddManualAdjustment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: ManualAdjustmentRequest) =>
      GradingService.addManualAdjustment(request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: gradingKeys.submission(variables.submissionId) 
      });
    },
  });
}

/** Release grades */
export function useReleaseGrades() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assessmentId: string) =>
      GradingService.releaseGrades(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.all });
    },
  });
}

/** Release grades for submission */
export function useReleaseGradesForSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (submissionId: string) =>
      GradingService.releaseGradesForSubmission(submissionId),
    onSuccess: (_data, submissionId) => {
      queryClient.invalidateQueries({ 
        queryKey: gradingKeys.submission(submissionId) 
      });
    },
  });
}

/** Create regrade request */
export function useCreateRegradeRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: RegradeRequestCreationRequest) =>
      GradingService.createRegradeRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.regradeRequests() });
    },
  });
}

/** Respond to regrade request */
export function useRespondToRegradeRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: RegradeResponseRequest) =>
      GradingService.respondToRegradeRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.regradeRequests() });
      queryClient.invalidateQueries({ queryKey: gradingKeys.submissions() });
    },
  });
}

/** Invalidate submission */
export function useInvalidateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, reason }: { submissionId: string; reason?: string }) =>
      GradingService.invalidateSubmission(submissionId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: gradingKeys.submission(variables.submissionId) 
      });
      queryClient.invalidateQueries({ queryKey: gradingKeys.queues() });
    },
  });
}

/** Trigger AI review */
export function useTriggerAiReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (submissionId: string) =>
      GradingService.triggerAiReview(submissionId),
    onSuccess: (_data, submissionId) => {
      // Refetch submission to get AI reviews
      queryClient.invalidateQueries({ 
        queryKey: gradingKeys.submission(submissionId) 
      });
    },
  });
}

/** Export grades */
export function useExportGrades() {
  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const blob = await GradingService.exportGrades(assessmentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades_${assessmentId}_${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
}
