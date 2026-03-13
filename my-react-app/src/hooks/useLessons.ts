import { useQuery } from '@tanstack/react-query';
import { LessonService } from '../services/api/lesson.service';

export const lessonKeys = {
  all: ['lessons'] as const,
  list: (gradeLevel: string, subject: string) =>
    [...lessonKeys.all, 'list', gradeLevel, subject] as const,
};

export function useLessons(gradeLevel: string, subject: string, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.list(gradeLevel, subject),
    queryFn: () => LessonService.getLessons({ gradeLevel, subject }),
    enabled: enabled && !!gradeLevel && !!subject,
  });
}
