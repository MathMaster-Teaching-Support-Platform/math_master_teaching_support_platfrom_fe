import { useQuery } from '@tanstack/react-query';
import { ChapterService } from '../services/api/chapter.service';

export const chapterKeys = {
  all: ['chapters'] as const,
  bySubject: (subjectId: string) => [...chapterKeys.all, 'subject', subjectId] as const,
};

export function useChaptersBySubject(subjectId: string, enabled = true) {
  const normalizedSubjectId = subjectId?.trim?.() ?? '';
  const hasValidSubjectId =
    normalizedSubjectId.length > 0 &&
    normalizedSubjectId.toLowerCase() !== 'undefined' &&
    normalizedSubjectId.toLowerCase() !== 'null';

  return useQuery({
    queryKey: chapterKeys.bySubject(normalizedSubjectId),
    queryFn: () => ChapterService.getChaptersBySubject(normalizedSubjectId),
    enabled: enabled && hasValidSubjectId,
  });
}
