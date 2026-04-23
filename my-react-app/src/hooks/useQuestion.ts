import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import type {
  CreateQuestionRequest,
  GetMyQuestionsParams,
  SearchQuestionsParams,
  UpdateQuestionRequest,
} from '../types/question';

export const questionKeys = {
  all: ['questions'] as const,
  myList: (params: GetMyQuestionsParams) => [...questionKeys.all, 'my', params] as const,
  detail: (questionId: string) => [...questionKeys.all, 'detail', questionId] as const,
  byBank: (bankId: string, page: number, size: number) =>
    [...questionKeys.all, 'by-bank', bankId, { page, size }] as const,
  search: (params: SearchQuestionsParams) => [...questionKeys.all, 'search', params] as const,
  byTemplate: (templateId: string) => [...questionKeys.all, 'by-template', templateId] as const,
};

export const useGetMyQuestions = (params: GetMyQuestionsParams = {}, enabled = true) =>
  useQuery({
    queryKey: questionKeys.myList(params),
    queryFn: () => questionService.getMyQuestions(params),
    enabled,
  });

export const useGetQuestionById = (questionId: string, enabled = true) =>
  useQuery({
    queryKey: questionKeys.detail(questionId),
    queryFn: () => questionService.getQuestionById(questionId),
    enabled: !!questionId && enabled,
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateQuestionRequest) => questionService.createQuestion(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};

export const useGetQuestionsByBank = (bankId: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: questionKeys.byBank(bankId, page, size),
    queryFn: () => questionService.getQuestionsByBank(bankId, page, size),
    enabled: !!bankId && enabled,
  });

export const useSearchQuestions = (
  params: {
    keyword?: string;
    tag?: string;
    page?: number;
    size?: number;
  },
  enabled = true
) => {
  const normalizedParams: SearchQuestionsParams = {
    keyword: params.keyword,
    tag: params.tag,
    page: params.page ?? 0,
    size: params.size ?? 20,
  };

  return useQuery({
    queryKey: questionKeys.search(normalizedParams),
    queryFn: () => questionService.searchQuestions(normalizedParams),
    enabled,
  });
};

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

export const useBatchAssignQuestionsToBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bankId, questionIds }: { bankId: string; questionIds: string[] }) =>
      questionService.batchAssignQuestionsToBank(bankId, { questionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};

export const useBatchRemoveQuestionsFromBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bankId, questionIds }: { bankId: string; questionIds: string[] }) =>
      questionService.batchRemoveQuestionsFromBank(bankId, { questionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
};
