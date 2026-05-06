import { BookOpen, GraduationCap } from 'lucide-react';
import { useEffect } from 'react';
import { useGrades } from '../../hooks/useGrades';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import type { SubjectResponse } from '../../types/subject.types';

interface GradeSubjectSelectProps {
  gradeLevel: string;
  subjectId: string;
  onGradeChange: (gradeLevel: string) => void;
  onSubjectChange: (subjectId: string, subject?: SubjectResponse) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function GradeSubjectSelect({
  gradeLevel,
  subjectId,
  onGradeChange,
  onSubjectChange,
  disabled = false,
  required = false,
  className = '',
}: GradeSubjectSelectProps) {
  const { data: gradesData, isLoading: isLoadingGrades, isError: isGradesError } = useGrades();
  const {
    data: subjectsData,
    isLoading: isLoadingSubjects,
    isError: isSubjectsError,
  } = useSubjectsByGrade(gradeLevel, !!gradeLevel);

  const grades = gradesData?.result ?? [];
  const subjects = subjectsData?.result ?? [];

  // Reset subject when grade changes
  useEffect(() => {
    if (gradeLevel && subjectId) {
      // Check if current subject belongs to the selected grade
      const currentSubject = subjects.find((s) => s.id === subjectId);
      if (!currentSubject) {
        // Subject doesn't exist in this grade, reset it
        onSubjectChange('');
      }
    }
  }, [gradeLevel, subjects, subjectId, onSubjectChange]);

  // Sort grades by level
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <div className={`grade-subject-select ${className}`}>
      {/* Grade Select */}
      <div className="grade-subject-field">
        <label htmlFor="grade-select" className="grade-subject-label">
          <GraduationCap size={16} className="grade-subject-icon" />
          <span>Lớp</span>
          {required && <span className="grade-subject-required">*</span>}
        </label>
        <select
          id="grade-select"
          className="grade-subject-input"
          value={gradeLevel}
          onChange={(e) => {
            const newGrade = e.target.value;
            onGradeChange(newGrade);
            // Reset subject when grade changes
            onSubjectChange('');
          }}
          disabled={disabled || isLoadingGrades}
        >
          <option value="">Chọn lớp</option>
          {sortedGrades.map((grade) => (
            <option key={grade.id} value={String(grade.level)}>
              {grade.name || `Lớp ${grade.level}`}
            </option>
          ))}
        </select>
        {isLoadingGrades && <span className="grade-subject-loading">Đang tải...</span>}
        {isGradesError && <span className="grade-subject-loading">Không tải được lớp</span>}
      </div>

      {/* Subject Select */}
      <div className="grade-subject-field">
        <label htmlFor="subject-select" className="grade-subject-label">
          <BookOpen size={16} className="grade-subject-icon" />
          <span>Môn học</span>
          {required && <span className="grade-subject-required">*</span>}
        </label>
        <select
          id="subject-select"
          className="grade-subject-input"
          value={subjectId}
          onChange={(e) => {
            const newSubjectId = e.target.value;
            const subject = subjects.find((s) => s.id === newSubjectId);
            onSubjectChange(newSubjectId, subject);
          }}
          disabled={disabled || isLoadingSubjects || !gradeLevel}
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
        {selectedSubject && (
          <span className="grade-subject-hint">{subjects.length} môn học có sẵn</span>
        )}
        {isSubjectsError && <span className="grade-subject-loading">Không tải được môn học</span>}
      </div>
    </div>
  );
}
