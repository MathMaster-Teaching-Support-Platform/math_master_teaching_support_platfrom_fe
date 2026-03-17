import { useQuery } from '@tanstack/react-query';
import { ChapterService } from '../services/api/chapter.service';

export const chapterKeys = {
  all: ['chapters'] as const,
  bySubject: (subjectId: string) => [...chapterKeys.all, 'subject', subjectId] as const,
};

export function useChaptersBySubject(subjectId: string, enabled = true) {
  return useQuery({
    queryKey: chapterKeys.bySubject(subjectId),
    queryFn: () => ChapterService.getChaptersBySubject(subjectId),
    enabled: enabled && !!subjectId,
  });
}
