import { useQuery } from '@tanstack/react-query';
import { SubjectService } from '../services/api/subject.service';

export const subjectKeys = {
  all: ['subjects'] as const,
  list: () => [...subjectKeys.all, 'list'] as const,
  byGrade: (gradeLevel: string) => [...subjectKeys.all, 'grade', gradeLevel] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: () => SubjectService.getSubjects(),
  });
}

export function useSubjectsByGrade(gradeLevel: string, enabled = true) {
  const normalizedGradeLevel = gradeLevel?.trim?.() ?? '';
  const hasValidGradeLevel =
    normalizedGradeLevel.length > 0 &&
    normalizedGradeLevel.toLowerCase() !== 'undefined' &&
    normalizedGradeLevel.toLowerCase() !== 'null';

  return useQuery({
    queryKey: subjectKeys.byGrade(normalizedGradeLevel),
    queryFn: () => SubjectService.getSubjectsByGrade(normalizedGradeLevel),
    enabled: enabled && hasValidGradeLevel,
  });
}
