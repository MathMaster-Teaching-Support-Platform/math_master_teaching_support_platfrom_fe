import { useQuery } from '@tanstack/react-query';
import { GradeService } from '../services/api/grade.service';

export const gradeKeys = {
  all: ['grades'] as const,
  list: () => [...gradeKeys.all, 'list'] as const,
};

export function useGrades(enabled = true) {
  return useQuery({
    queryKey: gradeKeys.list(),
    queryFn: () => GradeService.getSchoolGrades(),
    enabled,
  });
}
