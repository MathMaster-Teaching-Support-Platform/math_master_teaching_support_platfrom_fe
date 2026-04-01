import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionBankService } from '../services/questionBankService';
import type { QuestionBankRequest, SearchQuestionBanksParams } from '../types/questionBank';

export const questionBankKeys = {
  all: ['questionBanks'] as const,
  mine: (page: number, size: number, sortBy: string, sortDirection: string) =>
    [...questionBankKeys.all, 'my', { page, size, sortBy, sortDirection }] as const,
  detail: (id: string) => [...questionBankKeys.all, 'detail', id] as const,
  search: (params: SearchQuestionBanksParams) =>
    [...questionBankKeys.all, 'search', params] as const,
  canEdit: (id: string) => [...questionBankKeys.all, 'can-edit', id] as const,
  canDelete: (id: string) => [...questionBankKeys.all, 'can-delete', id] as const,
  templates: (id: string) => [...questionBankKeys.all, 'templates', id] as const,
};

export const useGetMyQuestionBanks = (
  page = 0,
  size = 20,
  sortBy = 'createdAt',
  sortDirection: 'ASC' | 'DESC' = 'DESC',
  enabled = true
) =>
  useQuery({
    queryKey: questionBankKeys.mine(page, size, sortBy, sortDirection),
    queryFn: () => questionBankService.getMyQuestionBanks(page, size, sortBy, sortDirection),
    enabled,
  });

export const useGetQuestionBankById = (id: string, enabled = true) =>
  useQuery({
    queryKey: questionBankKeys.detail(id),
    queryFn: () => questionBankService.getQuestionBankById(id),
    enabled: !!id && enabled,
  });

export const useSearchQuestionBanks = (
  params: SearchQuestionBanksParams,
  enabled = true
) =>
  useQuery({
    queryKey: questionBankKeys.search(params),
    queryFn: () => questionBankService.searchQuestionBanks(params),
    enabled,
  });

export const useCanEditQuestionBank = (id: string, enabled = true) =>
  useQuery({
    queryKey: questionBankKeys.canEdit(id),
    queryFn: () => questionBankService.canEditQuestionBank(id),
    enabled: !!id && enabled,
  });

export const useCanDeleteQuestionBank = (id: string, enabled = true) =>
  useQuery({
    queryKey: questionBankKeys.canDelete(id),
    queryFn: () => questionBankService.canDeleteQuestionBank(id),
    enabled: !!id && enabled,
  });

export const useGetQuestionBankTemplates = (id: string, enabled = true) =>
  useQuery({
    queryKey: questionBankKeys.templates(id),
    queryFn: () => questionBankService.getTemplatesByQuestionBank(id),
    enabled: !!id && enabled,
  });

export const useCreateQuestionBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: QuestionBankRequest) =>
      questionBankService.createQuestionBank(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};

export const useUpdateQuestionBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: QuestionBankRequest }) =>
      questionBankService.updateQuestionBank(id, request),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: questionBankKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};

export const useDeleteQuestionBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionBankService.deleteQuestionBank(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};

export const useToggleQuestionBankPublicStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionBankService.togglePublicStatus(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: questionBankKeys.detail(id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};

export const useMapTemplateToQuestionBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId }: { id: string; templateId: string }) =>
      questionBankService.mapTemplateToQuestionBank(id, templateId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: questionBankKeys.templates(vars.id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};

export const useUnmapTemplateFromQuestionBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId }: { id: string; templateId: string }) =>
      questionBankService.unmapTemplateFromQuestionBank(id, templateId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: questionBankKeys.templates(vars.id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: questionBankKeys.all });
    },
  });
};
