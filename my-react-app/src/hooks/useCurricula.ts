import { useQuery } from '@tanstack/react-query';
import { CurriculumService } from '../services/api/curriculum.service';

export function useCurricula() {
  return useQuery({
    queryKey: ['curricula', 'all'],
    queryFn: () => CurriculumService.getAllCurricula(),
    staleTime: 5 * 60 * 1000, // cache 5 phút vì data ít thay đổi
  });
}
