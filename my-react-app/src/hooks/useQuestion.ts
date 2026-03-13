import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';

export const questionKeys = {
  all: ['questions'] as const,
  byBank: (bankId: string, page: number, size: number) =>
    [...questionKeys.all, 'by-bank', bankId, { page, size }] as const,
};

export const useGetQuestionsByBank = (bankId: string, page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: questionKeys.byBank(bankId, page, size),
    queryFn: () => questionService.getQuestionsByBank(bankId, page, size),
    enabled: !!bankId && enabled,
  });
