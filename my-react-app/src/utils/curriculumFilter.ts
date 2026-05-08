import type { RoadmapCatalogItem } from '../types';
import type { SchoolGrade } from '../types/lessonSlide.types';

/** Khớp catalog lộ trình (subjectId + gradeLevel text) với lớp SGK đã chọn. */
export function roadmapMatchesCurriculum(
  r: RoadmapCatalogItem,
  gradeId: string,
  subjectId: string,
  grades: SchoolGrade[]
): boolean {
  if (subjectId && r.subjectId !== subjectId) return false;
  if (!gradeId) return true;
  const g = grades.find((x) => x.id === gradeId);
  if (!g) return true;
  const raw = (r.gradeLevel ?? '').trim();
  if (!raw) return false;
  if (raw === String(g.gradeLevel)) return true;
  const digits = raw.match(/\d+/)?.[0];
  if (digits && Number(digits) === g.gradeLevel) return true;
  const normalizedName = g.name.trim().toLowerCase();
  const normalizedRaw = raw.toLowerCase();
  return normalizedRaw === normalizedName || normalizedRaw.includes(String(g.gradeLevel));
}

/** Khớp khóa học / đề có schoolGradeId + subjectId (+ gradeLevel fallback). */
export function entityMatchesGradeSubject(
  entity: {
    schoolGradeId?: string | null;
    subjectId?: string | null;
    gradeLevel?: number | null;
  },
  gradeId: string,
  subjectId: string,
  schoolGrades: SchoolGrade[]
): boolean {
  if (subjectId && entity.subjectId !== subjectId) return false;
  if (!gradeId) return true;
  if (entity.schoolGradeId === gradeId) return true;
  const selectedLevel = schoolGrades.find((g) => g.id === gradeId)?.gradeLevel;
  if (
    selectedLevel != null &&
    entity.schoolGradeId == null &&
    entity.gradeLevel != null &&
    entity.gradeLevel === selectedLevel
  ) {
    return true;
  }
  return false;
}

/** Ma trận đề: khớp `gradeLevel` dạng text (BE) với lớp SGK đã chọn. */
export function examMatrixMatchesCurriculum(
  matrix: { subjectId?: string | null; gradeLevel?: string | null },
  gradeId: string,
  subjectId: string,
  grades: SchoolGrade[]
): boolean {
  if (subjectId && matrix.subjectId !== subjectId) return false;
  if (!gradeId) return true;
  const g = grades.find((x) => x.id === gradeId);
  if (!g) return true;
  const raw = (matrix.gradeLevel ?? '').trim();
  if (!raw) return false;
  if (raw === String(g.gradeLevel)) return true;
  const digits = raw.match(/\d+/)?.[0];
  if (digits && Number(digits) === g.gradeLevel) return true;
  const normalizedName = g.name.trim().toLowerCase();
  const normalizedRaw = raw.toLowerCase();
  return normalizedRaw === normalizedName || normalizedRaw.includes(String(g.gradeLevel));
}
