import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canonicalQuestionService } from '../services/canonicalQuestionService';
import type { CanonicalQuestionRequest } from '../types/canonicalQuestion';
import type { GenerateQuestionsFromCanonicalRequest } from '../types/questionTemplate';

export const canonicalQuestionKeys = {
  all: ['canonicalQuestions'] as const,
  mine: (page: number, size: number, sortBy: string, sortDirection: string) =>
    [...canonicalQuestionKeys.all, 'my', page, size, sortBy, sortDirection] as const,
  detail: (id: string) => [...canonicalQuestionKeys.all, 'detail', id] as const,
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