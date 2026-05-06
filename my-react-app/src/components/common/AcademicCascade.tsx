import { useChaptersBySubject } from '../../hooks/useChapters';
import { useGrades } from '../../hooks/useGrades';
import { useSubjectsByGrade } from '../../hooks/useSubjects';

interface AcademicCascadeProps {
  gradeLevel: string;
  subjectId: string;
  chapterId: string;
  onGradeChange: (grade: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onChapterChange: (chapterId: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function AcademicCascade({
  gradeLevel,
  subjectId,
  chapterId,
  onGradeChange,
  onSubjectChange,
  onChapterChange,
  disabled = false,
  required = false,
}: Readonly<AcademicCascadeProps>) {
  const { data: gradesData, isLoading: isLoadingGrades } = useGrades(true);
  const { data: subjectsData, isLoading: isLoadingSubjects } = useSubjectsByGrade(
    gradeLevel,
    !!gradeLevel
  );
  const { data: chaptersData, isLoading: isLoadingChapters } = useChaptersBySubject(
    subjectId,
    !!subjectId
  );

  const grades = gradesData?.result ?? [];
  const subjects = subjectsData?.result ?? [];
  const chapters = chaptersData?.result ?? [];
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);

  return (
    <>
      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Lớp {required && <span style={{ color: '#ef4444' }}>*</span>}
        </p>
        <select
          className="select"
          value={gradeLevel}
          onChange={(event) => {
            const newGrade = event.target.value;
            onGradeChange(newGrade);
            onSubjectChange('');
            onChapterChange('');
          }}
          disabled={disabled || isLoadingGrades}
          required={required}
        >
          <option value="">Chọn lớp</option>
          {sortedGrades.map((grade) => (
            <option key={grade.id} value={String(grade.level)}>
              {grade.name || `Lớp ${grade.level}`}
            </option>
          ))}
        </select>
      </label>

      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Môn học {required && <span style={{ color: '#ef4444' }}>*</span>}
        </p>
        <select
          className="select"
          value={subjectId}
          onChange={(event) => {
            onSubjectChange(event.target.value);
            onChapterChange('');
          }}
          disabled={disabled || isLoadingSubjects || !gradeLevel}
          required={required}
        >
          {!gradeLevel ? (
            <option value="">Chọn lớp trước</option>
          ) : isLoadingSubjects ? (
            <option value="">Đang tải môn học...</option>
          ) : subjects.length === 0 ? (
            <option value="">Không có môn học cho lớp này</option>
          ) : (
            <>
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </>
          )}
        </select>
      </label>

      <label>
        <p className="muted" style={{ marginBottom: 6 }}>
          Chương học {required && <span style={{ color: '#ef4444' }}>*</span>}
        </p>
        <select
          className="select"
          value={chapterId}
          onChange={(event) => onChapterChange(event.target.value)}
          disabled={disabled || isLoadingChapters || !subjectId}
          required={required}
        >
          {!subjectId ? (
            <option value="">Chọn môn học trước</option>
          ) : isLoadingChapters ? (
            <option value="">Đang tải chương...</option>
          ) : chapters.length === 0 ? (
            <option value="">Không có chương cho môn này</option>
          ) : (
            <>
              <option value="">Chọn chương học</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title || chapter.name || chapter.id}
                </option>
              ))}
            </>
          )}
        </select>
      </label>
    </>
  );
}
