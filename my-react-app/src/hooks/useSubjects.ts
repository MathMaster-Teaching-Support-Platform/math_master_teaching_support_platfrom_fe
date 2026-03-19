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
  return useQuery({
    queryKey: subjectKeys.byGrade(gradeLevel),
    queryFn: () => SubjectService.getSubjectsByGrade(gradeLevel),
    enabled: enabled && !!gradeLevel,
  });
}
