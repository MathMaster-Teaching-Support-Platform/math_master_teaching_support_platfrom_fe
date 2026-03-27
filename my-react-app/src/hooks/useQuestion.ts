import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import type { UpdateQuestionRequest } from '../types/question';

export const questionKeys = {
  all: ['questions'] as const,
  byBank: (bankId: string, page: number, size: number) =>
    [...questionKeys.all, 'by-bank', bankId, { page, size }] as const,
  byTemplate: (templateId: string) => [...questionKeys.all, 'by-template', templateId] as const,
};

export const useGetQuestionsByBank = (bankId: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: questionKeys.byBank(bankId, page, size),
    queryFn: () => questionService.getQuestionsByBank(bankId, page, size),
    enabled: !!bankId && enabled,
  });

export const useReviewQuestions = (templateId: string, enabled = true) =>
  useQuery({
    queryKey: questionKeys.byTemplate(templateId),
    queryFn: () => questionService.getQuestionsByTemplate(templateId),
    enabled: !!templateId && enabled,
  });

export const useApproveQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => questionService.approveQuestion(questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};

export const useBulkApproveQuestions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => questionService.bulkApproveQuestions({ questionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};

export const useUpdateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      request,
    }: {
      questionId: string;
      request: UpdateQuestionRequest;
    }) => questionService.updateQuestion(questionId, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};

export const useDeleteQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => questionService.deleteQuestion(questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};
