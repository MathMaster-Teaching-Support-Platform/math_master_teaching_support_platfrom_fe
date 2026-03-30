import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { StudentAssessmentService } from '../services/studentAssessment.service';
import type { ApiResponse, PaginatedResponse } from '../types';
import type {
  AnswerUpdateRequest,
  DraftSnapshotResponse,
  FlagUpdateRequest,
  StartAssessmentRequest,
  StudentAssessmentResponse,
  SubmitAssessmentRequest,
} from '../types/studentAssessment.types';

// Query Keys
export const studentAssessmentKeys = {
  all: ['studentAssessments'] as const,
  lists: () => [...studentAssessmentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...studentAssessmentKeys.lists(), filters] as const,
  details: () => [...studentAssessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentAssessmentKeys.details(), id] as const,
  attempts: () => [...studentAssessmentKeys.all, 'attempt'] as const,
  attempt: (id: string) => [...studentAssessmentKeys.attempts(), id] as const,
  snapshots: () => [...studentAssessmentKeys.all, 'snapshot'] as const,
  snapshot: (attemptId: string) => [...studentAssessmentKeys.snapshots(), attemptId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Get my assessments with filters */
export function useMyAssessments(
  params: {
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  },
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<StudentAssessmentResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: studentAssessmentKeys.list(params),
    queryFn: () => StudentAssessmentService.getMyAssessments(params),
    ...options,
  });
}

/** Get assessment details */
export function useAssessmentDetails(
  assessmentId: string,
  options?: Omit<UseQueryOptions<ApiResponse<StudentAssessmentResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: studentAssessmentKeys.detail(assessmentId),
    queryFn: () => StudentAssessmentService.getAssessmentDetails(assessmentId),
    enabled: !!assessmentId,
    ...options,
  });
}

/** Get draft snapshot for resume */
export function useDraftSnapshot(
  attemptId: string,
  options?: Omit<UseQueryOptions<ApiResponse<DraftSnapshotResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: studentAssessmentKeys.snapshot(attemptId),
    queryFn: () => StudentAssessmentService.getDraftSnapshot(attemptId),
    enabled: !!attemptId,
    ...options,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Start assessment */
export function useStartAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: StartAssessmentRequest) =>
      StudentAssessmentService.startAssessment(request),
    onSuccess: (_data, variables) => {
      // Invalidate assessments list to update attempt count
      queryClient.invalidateQueries({ queryKey: studentAssessmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: studentAssessmentKeys.detail(variables.assessmentId),
      });
    },
  });
}

/** Update answer (auto-save) */
export function useUpdateAnswer() {
  return useMutation({
    mutationFn: (request: AnswerUpdateRequest) => StudentAssessmentService.updateAnswer(request),
    // Don't invalidate queries to avoid refetch during typing
  });
}

/** Update flag */
export function useUpdateFlag() {
  return useMutation({
    mutationFn: (request: FlagUpdateRequest) => StudentAssessmentService.updateFlag(request),
  });
}

/** Submit assessment */
export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SubmitAssessmentRequest) =>
      StudentAssessmentService.submitAssessment(request),
    onSuccess: () => {
      // Invalidate all assessment queries
      queryClient.invalidateQueries({ queryKey: studentAssessmentKeys.all });
    },
  });
}

/** Save and exit */
export function useSaveAndExit() {
  return useMutation({
    mutationFn: (attemptId: string) => StudentAssessmentService.saveAndExit(attemptId),
  });
}
