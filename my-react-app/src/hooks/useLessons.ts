import { useQuery } from '@tanstack/react-query';
import { LessonService } from '../services/api/lesson.service';

export const lessonKeys = {
  all: ['lessons'] as const,
  allList: () => [...lessonKeys.all, 'all-list'] as const,
  list: (gradeLevel: string, subject: string) =>
    [...lessonKeys.all, 'list', gradeLevel, subject] as const,
  byChapter: (chapterId: string, name = '') =>
    [...lessonKeys.all, 'chapter', chapterId, name] as const,
};

export function useAllLessons(enabled = true) {
  return useQuery({
    queryKey: lessonKeys.allList(),
    queryFn: () => LessonService.getAllLessons(),
    enabled,
  });
}

export function useLessons(gradeLevel: string, subject: string, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.list(gradeLevel, subject),
    queryFn: () => LessonService.getLessons({ gradeLevel, subject }),
    enabled: enabled && !!gradeLevel && !!subject,
  });
}

export function useLessonsByChapter(chapterId: string, name = '', enabled = true) {
  return useQuery({
    queryKey: lessonKeys.byChapter(chapterId, name),
    queryFn: () => LessonService.getLessonsByChapter(chapterId, name),
    enabled: enabled && !!chapterId,
  });
}
