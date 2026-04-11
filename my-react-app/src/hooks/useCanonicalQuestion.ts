import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canonicalQuestionService } from '../services/canonicalQuestionService';
import { questionService } from '../services/questionService';
import type {
  CanonicalQuestionPagingParams,
  CanonicalQuestionRequest,
} from '../types/canonicalQuestion';
import type { GenerateQuestionsFromCanonicalRequest } from '../types/questionTemplate';

export const canonicalQuestionKeys = {
  all: ['canonicalQuestions'] as const,
  mine: (page: number, size: number, sortBy: string, sortDirection: string) =>
    [...canonicalQuestionKeys.all, 'my', page, size, sortBy, sortDirection] as const,
  detail: (id: string) => [...canonicalQuestionKeys.all, 'detail', id] as const,
  questions: (id: string, params: CanonicalQuestionPagingParams) =>
    [...canonicalQuestionKeys.all, 'questions', id, params] as const,
};

export const useGetMyCanonicalQuestions = (
  page = 0,
  size = 20,
  sortBy = 'createdAt',
  sortDirection = 'DESC'
) =>
  useQuery({
    queryKey: canonicalQuestionKeys.mine(page, size, sortBy, sortDirection),
    queryFn: () =>
      canonicalQuestionService.getMyCanonicalQuestions(page, size, sortBy, sortDirection),
  });

export const useGetCanonicalQuestionById = (id: string, enabled = true) =>
  useQuery({
    queryKey: canonicalQuestionKeys.detail(id),
    queryFn: () => canonicalQuestionService.getCanonicalQuestionById(id),
    enabled: !!id && enabled,
  });

export const useGetQuestionsByCanonicalQuestion = (
  id: string,
  params: CanonicalQuestionPagingParams = {},
  enabled = true
) =>
  useQuery({
    queryKey: canonicalQuestionKeys.questions(id, params),
    queryFn: () => canonicalQuestionService.getQuestionsByCanonicalQuestion(id, params),
    enabled: !!id && enabled,
  });

export const useCreateCanonicalQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CanonicalQuestionRequest) =>
      canonicalQuestionService.createCanonicalQuestion(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.all });
    },
  });
};

export const useUpdateCanonicalQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CanonicalQuestionRequest }) =>
      canonicalQuestionService.updateCanonicalQuestion(id, request),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.all });
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCanonicalQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => canonicalQuestionService.deleteCanonicalQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.all });
    },
  });
};

export const useReviewCanonicalQuestions = (
  canonicalId: string,
  params: CanonicalQuestionPagingParams = {},
  enabled = true
) =>
  useQuery({
    queryKey: canonicalQuestionKeys.questions(canonicalId, params),
    queryFn: () => canonicalQuestionService.getQuestionsByCanonicalQuestion(canonicalId, params),
    enabled: !!canonicalId && enabled,
  });

export const useApproveCanonicalQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => questionService.approveQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.all });
    },
  });
};

export const useBulkApproveCanonicalQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => questionService.bulkApproveQuestions({ questionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: canonicalQuestionKeys.all });
    },
  });
};

export const useGenerateQuestionsFromCanonical = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      canonicalId,
      request,
    }: {
      canonicalId: string;
      request: GenerateQuestionsFromCanonicalRequest;
    }) => canonicalQuestionService.generateQuestionsFromCanonical(canonicalId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};