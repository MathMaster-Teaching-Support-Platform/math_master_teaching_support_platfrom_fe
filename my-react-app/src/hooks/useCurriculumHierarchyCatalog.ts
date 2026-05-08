import { useQuery } from '@tanstack/react-query';
import { LessonSlideService } from '../services/api/lesson-slide.service';

/** Cascading catalog for Lớp → Môn → Chương → Bài (aligned with /student/public-slides). */
export function useCurriculumHierarchyCatalog(state: {
  gradeId: string;
  subjectId: string;
  chapterId: string;
}) {
  const gradesQuery = useQuery({
    queryKey: ['school-grades', 'active'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60 * 1000,
  });

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'by-school-grade', state.gradeId],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(state.gradeId),
    enabled: !!state.gradeId,
    staleTime: 5 * 60 * 1000,
  });

  const chaptersQuery = useQuery({
    queryKey: ['chapters', 'by-subject', state.subjectId],
    queryFn: () => LessonSlideService.getChaptersBySubject(state.subjectId),
    enabled: !!state.subjectId,
    staleTime: 5 * 60 * 1000,
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'by-chapter', state.chapterId],
    queryFn: () => LessonSlideService.getLessonsByChapter(state.chapterId),
    enabled: !!state.chapterId,
    staleTime: 5 * 60 * 1000,
  });

  const loadingCatalog =
    gradesQuery.isFetching ||
    subjectsQuery.isFetching ||
    chaptersQuery.isFetching ||
    lessonsQuery.isFetching;

  return {
    schoolGrades: gradesQuery.data?.result ?? [],
    subjects: subjectsQuery.data?.result ?? [],
    chapters: chaptersQuery.data?.result ?? [],
    lessons: lessonsQuery.data?.result ?? [],
    loadingCatalog,
    catalogError:
      gradesQuery.error || subjectsQuery.error || chaptersQuery.error || lessonsQuery.error,
  };
}
