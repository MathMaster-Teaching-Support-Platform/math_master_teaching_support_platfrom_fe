import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { AssessmentService } from '../services/api/assessment.service';
import type {
  AddQuestionToAssessmentRequest,
  ApiResponse,
  AssessmentQuestionItem,
  AssessmentRequest,
  AssessmentResponse,
  AssessmentSummary,
  CloneAssessmentRequest,
  GenerateAssessmentFromMatrixRequest,
  GenerateQuestionsForAssessmentRequest,
  GetMyAssessmentsParams,
  PaginatedResponse,
  PointsOverrideRequest,
} from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  myList: (params: GetMyAssessmentsParams) => [...assessmentKeys.lists(), 'my', params] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
  questions: (id: string) => [...assessmentKeys.detail(id), 'questions'] as const,
  preview: (id: string) => [...assessmentKeys.all, 'preview', id] as const,
  publishSummary: (id: string) => [...assessmentKeys.all, 'publish-summary', id] as const,
  canEdit: (id: string) => [...assessmentKeys.all, 'can-edit', id] as const,
  canDelete: (id: string) => [...assessmentKeys.all, 'can-delete', id] as const,
  canPublish: (id: string) => [...assessmentKeys.all, 'can-publish', id] as const,
};

// ─── Queries (GET) ────────────────────────────────────────────────────────────

/** Fetch all assessments of the current teacher (paginated) */
export function useMyAssessments(
  params: GetMyAssessmentsParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResponse<AssessmentResponse>>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: assessmentKeys.myList(params),
    queryFn: () => AssessmentService.getMyAssessments(params),
    ...options,
  });
}

/** Fetch a single assessment by ID */
export function useAssessment(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<AssessmentResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => AssessmentService.getAssessmentById(id),
    enabled: !!id,
    ...options,
  });
}

export function useAssessmentQuestions(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<AssessmentQuestionItem[]>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assessmentKeys.questions(id),
    queryFn: () => AssessmentService.getAssessmentQuestions(id),
    enabled: !!id,
    ...options,
  });
}

/** Fetch assessment preview (teacher view of student experience) */
export function useAssessmentPreview(id: string) {
  return useQuery({
    queryKey: assessmentKeys.preview(id),
    queryFn: () => AssessmentService.getAssessmentPreview(id),
    enabled: !!id,
  });
}

/** Fetch publish validation summary before publishing */
export function usePublishSummary(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<AssessmentSummary>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assessmentKeys.publishSummary(id),
    queryFn: () => AssessmentService.getPublishSummary(id),
    enabled: !!id,
    ...options,
  });
}

/** Check if current user can edit the assessment */
export function useCanEditAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.canEdit(id),
    queryFn: () => AssessmentService.canEditAssessment(id),
    enabled: !!id,
  });
}

/** Check if current user can delete the assessment */
export function useCanDeleteAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.canDelete(id),
    queryFn: () => AssessmentService.canDeleteAssessment(id),
    enabled: !!id,
  });
}

/** Check if current user can publish the assessment */
export function useCanPublishAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.canPublish(id),
    queryFn: () => AssessmentService.canPublishAssessment(id),
    enabled: !!id,
  });
}

// ─── Mutations (POST / PUT / PATCH / DELETE) ──────────────────────────────────

/** Create a new assessment */
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssessmentRequest) => AssessmentService.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
  });
}

/** Update an existing DRAFT assessment */
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssessmentRequest }) =>
      AssessmentService.updateAssessment(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(id) });
    },
  });
}

/** Override points for a question within a specific assessment */
export function useSetPointsOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, data }: { assessmentId: string; data: PointsOverrideRequest }) =>
      AssessmentService.setPointsOverride(assessmentId, data),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
    },
  });
}

/** Publish a DRAFT assessment to make it visible to students */
export function usePublishAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssessmentService.publishAssessment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(id) });
    },
  });
}

/** Unpublish a PUBLISHED assessment (only when no submissions exist) */
export function useUnpublishAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssessmentService.unpublishAssessment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(id) });
    },
  });
}

/** Permanently close a PUBLISHED assessment */
export function useCloseAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssessmentService.closeAssessment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(id) });
    },
  });
}

/** Soft-delete a DRAFT assessment with no submissions */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssessmentService.deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
  });
}

/** Clone an existing assessment into a new DRAFT */
export function useCloneAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloneAssessmentRequest }) =>
      AssessmentService.cloneAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
  });
}

/** One-step auto-generate assessment from selected exam matrix */
export function useGenerateAssessmentFromMatrix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateAssessmentFromMatrixRequest) =>
      AssessmentService.generateAssessmentFromMatrix(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
  });
}

export function useGenerateQuestionsForAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: GenerateQuestionsForAssessmentRequest;
    }) => AssessmentService.generateQuestionsForAssessment(assessmentId, data),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
  });
}

/** Add an existing question to a DRAFT assessment */
export function useAddQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: AddQuestionToAssessmentRequest;
    }) => AssessmentService.addQuestion(assessmentId, data),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

/** Remove a question from a DRAFT assessment */
export function useRemoveQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, questionId }: { assessmentId: string; questionId: string }) =>
      AssessmentService.removeQuestion(assessmentId, questionId),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

/** Update assessment-question with workaround (delete + add) when BE has no PUT endpoint */
export function useUpdateAssessmentQuestionWorkaround() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      questionId,
      data,
    }: {
      assessmentId: string;
      questionId: string;
      data: { orderIndex?: number; pointsOverride?: number | null };
    }) => AssessmentService.updateAssessmentQuestionWorkaround(assessmentId, questionId, data),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

/** Get all assessments linked to a specific lesson */
export function useAssessmentsByLesson(lessonId: string | undefined, options?: any) {
  return useQuery<ApiResponse<AssessmentResponse[]>>({
    queryKey: ['assessments', 'lesson', lessonId],
    queryFn: () => AssessmentService.getAssessmentsByLesson(lessonId!),
    enabled: !!lessonId,
    ...options,
  });
}

/** Link an assessment to a lesson */
export function useLinkAssessmentToLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, lessonId }: { assessmentId: string; lessonId: string }) =>
      AssessmentService.linkAssessmentToLesson(assessmentId, lessonId),
    onSuccess: (_data, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'lesson', lessonId] });
    },
  });
}

/** Unlink an assessment from a lesson */
export function useUnlinkAssessmentFromLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, lessonId }: { assessmentId: string; lessonId: string }) =>
      AssessmentService.unlinkAssessmentFromLesson(assessmentId, lessonId),
    onSuccess: (_data, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'lesson', lessonId] });
    },
  });
}

// ─── New batch hooks ──────────────────────────────────────────────────────────

/** Search questions by keyword and tags (for the question picker). */
export function useSearchQuestions(params: {
  keyword?: string;
  tags?: string[];
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: ['questions', 'search', queryParams],
    queryFn: () => AssessmentService.searchQuestions(queryParams),
    enabled: enabled && (!!queryParams.keyword || (!!queryParams.tags && queryParams.tags.length > 0)),
    staleTime: 30_000,
  });
}

/** Batch add questions to an assessment. */
export function useBatchAddQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, questionIds }: { assessmentId: string; questionIds: string[] }) =>
      AssessmentService.batchAddQuestions(assessmentId, { questionIds }),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

/** Batch update points for questions in an assessment. */
export function useBatchUpdatePoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      questions,
    }: {
      assessmentId: string;
      questions: { id: string; point: number }[];
    }) => AssessmentService.batchUpdatePoints(assessmentId, { questions }),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

/** Auto-distribute total points by cognitive level percentages. */
export function useAutoDistributePoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      totalPoints,
      distribution,
    }: {
      assessmentId: string;
      totalPoints: number;
      distribution?: Record<string, number>;
    }) => AssessmentService.autoDistributePoints(assessmentId, { totalPoints, distribution }),
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}

function buildEqualDistribution(totalPoints: number, count: number, scale: number): number[] {
  if (count <= 0) return [];
  const safeScale = Math.max(0, Math.min(6, scale));
  const factor = 10 ** safeScale;
  const totalUnits = Math.round(totalPoints * factor);
  const baseUnits = Math.floor(totalUnits / count);
  const remainder = totalUnits - baseUnits * count;

  return Array.from({ length: count }, (_item, index) => {
    const units = baseUnits + (index < remainder ? 1 : 0);
    return units / factor;
  });
}

export function useDistributeQuestionPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      totalPoints,
      strategy,
      scale,
    }: {
      assessmentId: string;
      totalPoints: number;
      strategy: 'EQUAL';
      scale?: number;
    }) =>
      AssessmentService.distributeQuestionPoints(assessmentId, {
        totalPoints,
        strategy,
        scale,
      }),
    onMutate: async ({ assessmentId, totalPoints, scale = 2 }) => {
      await queryClient.cancelQueries({ queryKey: assessmentKeys.questions(assessmentId) });

      const previousQuestions = queryClient.getQueryData<ApiResponse<AssessmentQuestionItem[]>>(
        assessmentKeys.questions(assessmentId)
      );

      if (previousQuestions?.result) {
        const distributed = buildEqualDistribution(totalPoints, previousQuestions.result.length, scale);
        const nextQuestions = previousQuestions.result.map((question, index) => ({
          ...question,
          points: distributed[index] ?? question.points,
        }));
        queryClient.setQueryData<ApiResponse<AssessmentQuestionItem[]>>(
          assessmentKeys.questions(assessmentId),
          {
            ...previousQuestions,
            result: nextQuestions,
          }
        );
      }

      return { previousQuestions };
    },
    onError: (_error, { assessmentId }, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          assessmentKeys.questions(assessmentId),
          context.previousQuestions
        );
      }
    },
    onSuccess: (_data, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.publishSummary(assessmentId) });
    },
  });
}
