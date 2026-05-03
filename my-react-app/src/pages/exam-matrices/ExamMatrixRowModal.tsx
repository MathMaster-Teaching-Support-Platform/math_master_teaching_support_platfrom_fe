import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useGrades } from '../../hooks/useGrades';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import type { ExamMatrixRowRequest } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  subjectId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ExamMatrixRowModal({
  isOpen,
  matrixId,
  matrixGradeLevel,
  subjectId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addRowMutation = useAddExamMatrixRow();
  const { data: gradesData, isLoading: isLoadingGrades } = useGrades(isOpen);
  const subjectsByGradeQuery = useSubjectsByGrade(gradeLevel, isOpen && !!gradeLevel);
  const chapterQuery = useChaptersBySubject(selectedSubjectId, isOpen && !!selectedSubjectId);

  const chapters = chapterQuery.data?.result ?? [];
  const subjectsByGrade = subjectsByGradeQuery.data?.result ?? [];
  const grades = gradesData?.result ?? [];

  // Sort grades by level
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);

  const chapterLabel = useMemo(() => {
    const selected = chapters.find((item) => item.id === chapterId);
    return selected?.title || selected?.name || chapterId;
  }, [chapters, chapterId]);

  useEffect(() => {
    if (!isOpen) return;
    setGradeLevel(matrixGradeLevel ?? '');
    setSelectedSubjectId(subjectId ?? '');
    setError(null);
    setChapterId('');
  }, [isOpen, subjectId, matrixGradeLevel]);

  useEffect(() => {
    if (!isOpen) return;
    if (chapters.length > 0 && !chapterId) {
      setChapterId(chapters[0].id);
      return;
    }
    if (chapters.length === 0) {
      setChapterId('');
    }
  }, [isOpen, chapters, chapterId]);

  useEffect(() => {
    if (!isOpen) return;
    if (subjectsByGrade.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectsByGrade[0].id);
    }
  }, [isOpen, subjectsByGrade, selectedSubjectId]);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!chapterId) {
      setError('Vui lòng chọn chủ đề.');
      return;
    }

    // FE-2: Simplified payload - only chapter, no cells
    const payload: ExamMatrixRowRequest = {
      chapterId,
      questionTypeName: chapterLabel || 'Chủ đề',
      cells: [], // Empty cells - will be edited inline in MatrixTable
    };

    try {
      await addRowMutation.mutateAsync({ matrixId, request: payload });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm dòng ma trận.');
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(600px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Thêm dòng ma trận</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chọn chủ đề cho dòng ma trận. Số câu sẽ được chỉnh sửa trực tiếp trong bảng ma trận.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Grade Selection */}
              <div>
                <label className="label">Lớp</label>
                <select
                  className="select"
                  value={gradeLevel}
                  onChange={(event) => {
                    setGradeLevel(event.target.value);
                    setSelectedSubjectId('');
                    setChapterId('');
                  }}
                  disabled={isLoadingGrades}
                  style={{ width: '100%' }}
                >
                  <option value="">Chọn khối lớp</option>
                  {sortedGrades.map((grade) => (
                    <option key={grade.id} value={String(grade.level)}>
                      {grade.name || `Lớp ${grade.level}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="label">Môn học</label>
                <select
                  className="select"
                  value={selectedSubjectId}
                  onChange={(event) => {
                    setSelectedSubjectId(event.target.value);
                    setChapterId('');
                  }}
                  disabled={
                    subjectsByGradeQuery.isLoading || !gradeLevel || subjectsByGrade.length === 0
                  }
                  style={{ width: '100%' }}
                >
                  {!gradeLevel ? (
                    <option value="">Chọn khối lớp trước</option>
                  ) : subjectsByGrade.length === 0 ? (
                    <option value="">Không có môn học</option>
                  ) : (
                    <>
                      <option value="">Chọn môn học</option>
                      {subjectsByGrade.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Chapter Selection */}
              <div>
                <label className="label">Chủ đề *</label>
                <select
                  className="select"
                  value={chapterId}
                  onChange={(event) => setChapterId(event.target.value)}
                  required
                  disabled={chapterQuery.isLoading || !selectedSubjectId}
                  style={{ width: '100%' }}
                >
                  {!selectedSubjectId ? (
                    <option value="">Chọn môn học trước</option>
                  ) : chapters.length === 0 ? (
                    <option value="">Không có chủ đề</option>
                  ) : (
                    <>
                      <option value="">Chọn chủ đề</option>
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title || chapter.name || chapter.id}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <p className="muted" style={{ marginTop: 16 }}>
              Sau khi thêm dòng, bạn có thể chỉnh sửa số câu cho từng mức độ nhận thức trực tiếp
              trong bảng ma trận.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={addRowMutation.isPending}>
              {addRowMutation.isPending ? 'Đang thêm dòng...' : 'Thêm dòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
