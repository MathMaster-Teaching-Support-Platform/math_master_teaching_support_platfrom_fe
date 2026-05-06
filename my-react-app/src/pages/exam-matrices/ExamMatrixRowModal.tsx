import { Database, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MatrixStatsTree } from '../../components/question-banks/MatrixStatsTree';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useGrades } from '../../hooks/useGrades';
import { useGetQuestionBankMatrixStats } from '../../hooks/useQuestionBank';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import type { ExamMatrixRowRequest } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  subjectId?: string;
  bankId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ExamMatrixRowModal({
  isOpen,
  matrixId,
  matrixGradeLevel,
  subjectId,
  bankId,
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
  const bankStatsQuery = useGetQuestionBankMatrixStats(bankId ?? '', isOpen && !!bankId);

  const chapters = chapterQuery.data?.result ?? [];
  const subjectsByGrade = subjectsByGradeQuery.data?.result ?? [];
  const grades = gradesData?.result ?? [];
  const bankStats = useMemo(() => bankStatsQuery.data?.result ?? [], [bankStatsQuery.data]);

  // chapterId -> total approved questions in the bank, for hint badges in the dropdown.
  const bankCountByChapter = useMemo(() => {
    const map = new Map<string, number>();
    for (const grade of bankStats) {
      for (const chapter of grade.chapters) {
        map.set(chapter.chapterId, chapter.totalQuestions);
      }
    }
    return map;
  }, [bankStats]);

  const chosenChapterCount =
    chapterId && bankCountByChapter.has(chapterId) ? bankCountByChapter.get(chapterId)! : null;

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

  const showBankPanel = !!bankId;

  return (
    <div className="modal-layer">
      <div
        className="modal-card"
        style={{ width: showBankPanel ? 'min(960px, 100%)' : 'min(600px, 100%)' }}
      >
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
          <div
            className="modal-body"
            style={{
              display: 'grid',
              gridTemplateColumns: showBankPanel ? 'minmax(0, 1fr) minmax(280px, 380px)' : '1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div style={{ minWidth: 0 }}>
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
                    <option value="">Chọn lớp</option>
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
                      <option value="">Chọn lớp trước</option>
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
                        {chapters.map((chapter) => {
                          const inBank = bankCountByChapter.get(chapter.id);
                          const suffix =
                            showBankPanel && inBank !== undefined
                              ? ` — ${inBank} câu trong kho`
                              : '';
                          return (
                            <option key={chapter.id} value={chapter.id}>
                              {(chapter.title || chapter.name || chapter.id) + suffix}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  {showBankPanel && chapterId && chosenChapterCount === 0 && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#92400e',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 6,
                        padding: '6px 10px',
                      }}
                    >
                      ⚠️ Chương này hiện chưa có câu hỏi đã duyệt trong ngân hàng. Bạn vẫn có thể
                      thêm dòng nhưng sẽ cần bổ sung câu hỏi trước khi sinh đề.
                    </p>
                  )}
                </div>
              </div>

              <p className="muted" style={{ marginTop: 16 }}>
                Sau khi thêm dòng, bạn có thể chỉnh sửa số câu cho từng mức độ nhận thức trực tiếp
                trong bảng ma trận.
              </p>
            </div>

            {/* Right pane: bank stats tree (Grade → Chapter → Type → Cognitive) */}
            {showBankPanel && (
              <aside
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  maxHeight: 480,
                  overflowY: 'auto',
                  minWidth: 0,
                }}
                aria-label="Phân bố câu hỏi trong ngân hàng"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  <Database size={14} aria-hidden="true" />
                  Có gì trong ngân hàng câu hỏi?
                </div>
                {bankStatsQuery.isLoading && (
                  <p className="muted" style={{ fontSize: 12 }}>
                    Đang tải thống kê...
                  </p>
                )}
                {bankStatsQuery.isError && (
                  <p style={{ fontSize: 12, color: '#b91c1c' }}>
                    Không thể tải thống kê ngân hàng.
                  </p>
                )}
                {!bankStatsQuery.isLoading && !bankStatsQuery.isError && (
                  <MatrixStatsTree stats={bankStats} />
                )}
                <p className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
                  Chỉ tính câu hỏi đã duyệt. Đừng yêu cầu nhiều hơn số có sẵn ở mỗi chương / mức độ.
                </p>
              </aside>
            )}
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
