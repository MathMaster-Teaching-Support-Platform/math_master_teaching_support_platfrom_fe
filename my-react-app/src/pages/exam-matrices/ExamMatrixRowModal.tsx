import { Database } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ModalCloseButton from '../../components/common/ModalCloseButton';
import { MatrixStatsTree } from '../../components/question-banks/MatrixStatsTree';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useGrades } from '../../hooks/useGrades';
import { useGetQuestionBankMatrixStats } from '../../hooks/useQuestionBank';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import type { ExamMatrixRowRequest } from '../../types/examMatrix';


const CAP_RANGES: Record<1 | 2 | 3, { min: number; max: number }> = {
  1: { min: 1, max: 5 },
  2: { min: 6, max: 9 },
  3: { min: 10, max: 12 },
};

const CAP_LABELS: Record<1 | 2 | 3, { name: string; sub: string }> = {
  1: { name: 'Cấp 1', sub: 'Tiểu học' },
  2: { name: 'Cấp 2', sub: 'THCS' },
  3: { name: 'Cấp 3', sub: 'THPT' },
};

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  lockedSchoolLevel?: 1 | 2 | 3 | null;
  subjectId?: string;
  bankId?: string;
  /** Chapter IDs that are already used by existing rows — blocked from re-adding. */
  usedChapterIds?: string[];
  onClose: () => void;
  onSuccess: () => void;
};

export function ExamMatrixRowModal({
  isOpen,
  matrixId,
  matrixGradeLevel,
  lockedSchoolLevel,
  subjectId,
  bankId,
  usedChapterIds,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const usedChapterSet = useMemo(
    () => new Set((usedChapterIds ?? []).filter(Boolean)),
    [usedChapterIds]
  );
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

  // Resolve effective school level: prop from parent (rows/matrix) OR derive from matrixGradeLevel.
  const effectiveLevel = useMemo((): 1 | 2 | 3 | null => {
    if (lockedSchoolLevel) return lockedSchoolLevel;
    const n = Number(matrixGradeLevel || 0);
    if (n >= 1 && n <= 5) return 1;
    if (n >= 6 && n <= 9) return 2;
    if (n >= 10 && n <= 12) return 3;
    return null;
  }, [lockedSchoolLevel, matrixGradeLevel]);

  // Filter grades to the same school level (cấp) as existing rows, then sort asc.
  const filteredSortedGrades = useMemo(() => {
    const range = effectiveLevel ? CAP_RANGES[effectiveLevel] : null;
    return [...grades]
      .filter((g) => !range || (g.level >= range.min && g.level <= range.max))
      .sort((a, b) => a.level - b.level);
  }, [grades, effectiveLevel]);

  const lockedCapInfo = useMemo(() => {
    if (!lockedSchoolLevel) return null;
    const { min, max } = CAP_RANGES[lockedSchoolLevel];
    const { name, sub } = CAP_LABELS[lockedSchoolLevel];
    return { name, sub, range: `Lớp ${min}–${max}` };
  }, [lockedSchoolLevel]);


  // Sort chapters ascending by orderIndex, then by title/name.
  const sortedChapters = useMemo(
    () =>
      [...chapters].sort((a, b) => {
        if (a.orderIndex != null && b.orderIndex != null) return a.orderIndex - b.orderIndex;
        if (a.orderIndex != null) return -1;
        if (b.orderIndex != null) return 1;
        return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      }),
    [chapters]
  );

  const chapterLabel = useMemo(() => {
    const selected = sortedChapters.find((item) => item.id === chapterId);
    return selected?.title || selected?.name || chapterId;
  }, [sortedChapters, chapterId]);

  useEffect(() => {
    if (!isOpen) return;
    setGradeLevel(matrixGradeLevel != null ? String(matrixGradeLevel) : '');
    setSelectedSubjectId(subjectId ?? '');
    setError(null);
    setChapterId('');
  }, [isOpen, subjectId, matrixGradeLevel]);

  useEffect(() => {
    if (!isOpen) return;
    if (sortedChapters.length === 0) {
      setChapterId('');
      return;
    }
    // Skip already-used chapters when picking the default; if the current
    // pick has since been taken, advance to the next free one.
    if (!chapterId || usedChapterSet.has(chapterId)) {
      const firstFree = sortedChapters.find((c) => !usedChapterSet.has(c.id));
      setChapterId(firstFree?.id ?? '');
    }
  }, [isOpen, sortedChapters, chapterId, usedChapterSet]);

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

    if (usedChapterSet.has(chapterId)) {
      setError('Chương này đã có trong ma trận. Mỗi chương chỉ được thêm một lần.');
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
          <ModalCloseButton onClick={onClose} />
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
                {/* School-level lock banner */}
                {lockedCapInfo && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: '#1d4ed8',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>
                      📌 Cấp học đã được khóa: {lockedCapInfo.name} ({lockedCapInfo.sub}) —{' '}
                      {lockedCapInfo.range}
                    </strong>
                    <br />
                    Theo quy định của Bộ GD&ĐT, một ma trận đề kiểm tra chỉ được phép bao gồm nội
                    dung từ{' '}
                    <strong>cùng một cấp học</strong>. Ma trận này đã có dòng thuộc{' '}
                    {lockedCapInfo.name}, vì vậy chỉ hiển thị{' '}
                    <strong>{lockedCapInfo.range}</strong> trong danh sách lớp bên dưới.
                  </div>
                )}

                {/* Grade Selection — chips only, level is determined by the matrix */}
                <div>
                  <label className="label" style={{ marginBottom: 8, display: 'block' }}>
                    Lớp
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {filteredSortedGrades.map((g) => {
                      const val = String(g.level);
                      const active = gradeLevel === val;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={isLoadingGrades}
                          onClick={() => {
                            setGradeLevel(val);
                            setSelectedSubjectId('');
                            setChapterId('');
                          }}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 20,
                            border: active ? '2px solid #C96442' : '1px solid #e2e8f0',
                            background: active ? '#C96442' : '#f8fafc',
                            color: active ? '#fff' : '#141413',
                            fontWeight: active ? 600 : 400,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {g.name || `Lớp ${g.level}`}
                        </button>
                      );
                    })}
                  </div>
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
                        {sortedChapters.map((chapter) => {
                          const inBank = bankCountByChapter.get(chapter.id);
                          const isUsed = usedChapterSet.has(chapter.id);
                          const bankSuffix =
                            showBankPanel && inBank !== undefined
                              ? ` — ${inBank} câu trong kho`
                              : '';
                          const usedSuffix = isUsed ? ' — đã thêm' : '';
                          return (
                            <option
                              key={chapter.id}
                              value={chapter.id}
                              disabled={isUsed}
                            >
                              {(chapter.title || chapter.name || chapter.id) +
                                bankSuffix +
                                usedSuffix}
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
                Sau khi thêm dòng, bạn có thể chỉnh sửa số câu theo từng độ khó câu hỏi trực tiếp
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
