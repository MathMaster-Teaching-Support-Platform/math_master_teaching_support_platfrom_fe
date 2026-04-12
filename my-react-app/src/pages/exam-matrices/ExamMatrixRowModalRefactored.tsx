import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useSearchQuestionBanks } from '../../hooks/useQuestionBank';
import { useSubjects, useSubjectsByGrade } from '../../hooks/useSubjects';
import type { ExamMatrixRowRequest, MatrixCognitiveLevel } from '../../types/examMatrix';
import './exam-matrix-row-modal.css';

type UiCognitiveLevel = 'NB' | 'TH' | 'VD' | 'VDC';

const LEVELS: UiCognitiveLevel[] = ['NB', 'TH', 'VD', 'VDC'];

const BACKEND_COGNITIVE_LEVEL: Record<UiCognitiveLevel, MatrixCognitiveLevel> = {
  NB: 'NHAN_BIET',
  TH: 'THONG_HIEU',
  VD: 'VAN_DUNG',
  VDC: 'VAN_DUNG_CAO',
};

type CellDraft = {
  questionCount: number;
};

type CellDraftMap = Record<UiCognitiveLevel, CellDraft>;

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  subjectId?: string;
  matrixTotalPointsTarget?: number;
  onClose: () => void;
  onSuccess: () => void;
};

const defaultCells: CellDraftMap = {
  NB: { questionCount: 0 },
  TH: { questionCount: 0 },
  VD: { questionCount: 0 },
  VDC: { questionCount: 0 },
};

export function ExamMatrixRowModalRefactored({
  isOpen,
  matrixId,
  matrixGradeLevel,
  subjectId,
  matrixTotalPointsTarget,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const [questionBankSearch, setQuestionBankSearch] = useState('');
  const [cells, setCells] = useState<CellDraftMap>(defaultCells);
  const [error, setError] = useState<string | null>(null);

  const addRowMutation = useAddExamMatrixRow();
  const subjectsQuery = useSubjects();
  const subjectsByGradeQuery = useSubjectsByGrade(gradeLevel, isOpen && !!gradeLevel);
  const chapterQuery = useChaptersBySubject(selectedSubjectId, isOpen && !!selectedSubjectId);
  const questionBanksQuery = useSearchQuestionBanks(
    {
      searchTerm: questionBankSearch || undefined,
      chapterId: chapterId || undefined,
      subjectId: selectedSubjectId || undefined,
      gradeLevel: gradeLevel || undefined,
      mineOnly: true,
      page: 0,
      size: 20,
      sortBy: 'updatedAt',
      sortDirection: 'DESC',
    },
    isOpen && !!chapterId,
  );

  const chapters = chapterQuery.data?.result ?? [];
  const subjectsByGrade = subjectsByGradeQuery.data?.result ?? [];
  const allSubjects = subjectsQuery.data?.result ?? [];
  const questionBanks = questionBanksQuery.data?.result?.content ?? [];

  const subjectOptions = gradeLevel ? subjectsByGrade : allSubjects;

  const gradeSuggestions = useMemo(() => {
    const gradeFromApi = new Set<string>();

    for (const subject of allSubjects) {
      if (typeof subject.primaryGradeLevel === 'number') {
        gradeFromApi.add(String(subject.primaryGradeLevel));
      }
      if (Array.isArray(subject.gradeLevels)) {
        subject.gradeLevels.forEach((level) => gradeFromApi.add(String(level)));
      }
      if (typeof subject.gradeMin === 'number' && typeof subject.gradeMax === 'number') {
        for (let level = subject.gradeMin; level <= subject.gradeMax; level += 1) {
          gradeFromApi.add(String(level));
        }
      }
    }

    const defaults = ['10', '11', '12'];
    if (matrixGradeLevel) {
      gradeFromApi.add(matrixGradeLevel);
    }

    return Array.from(new Set([...defaults, ...Array.from(gradeFromApi)])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [allSubjects, matrixGradeLevel]);

  const selectedQuestionBank = useMemo(
    () => questionBanks.find((item) => item.id === questionBankId),
    [questionBanks, questionBankId],
  );

  const rowTotalQuestions = useMemo(
    () => LEVELS.reduce((sum, level) => sum + (cells[level].questionCount || 0), 0),
    [cells],
  );

  useEffect(() => {
    if (!isOpen) return;
    setGradeLevel(matrixGradeLevel ?? '');
    setSelectedSubjectId(subjectId ?? '');
    setQuestionBankSearch('');
    setError(null);
    setCells(defaultCells);
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
    if (subjectOptions.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectOptions[0].id);
    }
  }, [isOpen, subjectOptions, selectedSubjectId]);

  useEffect(() => {
    if (!isOpen) return;
    if (questionBanks.length > 0 && !questionBankId) {
      setQuestionBankId(questionBanks[0].id);
      return;
    }
    if (questionBanks.length === 0) {
      setQuestionBankId('');
    }
  }, [isOpen, questionBanks, questionBankId]);

  if (!isOpen) return null;

  const activeCells = LEVELS.filter((level) => cells[level].questionCount > 0);

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!chapterId) {
      setError('Vui lòng chọn chương.');
      return;
    }

    if (!questionBankId) {
      setError('Vui lòng chọn ngân hàng câu hỏi.');
      return;
    }

    if (activeCells.length === 0) {
      setError('Mỗi dòng cần ít nhất 1 mức độ có số câu > 0.');
      return;
    }

    const hasInvalidCell = LEVELS.some((level) => cells[level].questionCount < 0);
    if (hasInvalidCell) {
      setError('Số câu phải >= 0.');
      return;
    }

    const payload: ExamMatrixRowRequest = {
      chapterId,
      questionBankId,
      questionDifficulty: 'MEDIUM',
      questionTypeName: selectedQuestionBank?.name?.trim() || 'Dạng bài theo bank',
      cells: LEVELS.filter((level) => cells[level].questionCount > 0).map((level) => ({
        cognitiveLevel: BACKEND_COGNITIVE_LEVEL[level],
        questionCount: cells[level].questionCount,
        pointsPerQuestion: Number(
          (
            (matrixTotalPointsTarget && matrixTotalPointsTarget > 0
              ? matrixTotalPointsTarget
              : 10) / rowTotalQuestions
          ).toFixed(4),
        ),
      })),
    };

    try {
      await addRowMutation.mutateAsync({ matrixId, request: payload });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm dòng ma trận.');
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const form = event.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="matrix-modal-overlay" onClick={onClose}>
      <div className="matrix-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Compact Header */}
        <div className="matrix-modal-header">
          <h3 className="matrix-modal-title">Thêm dòng ma trận</h3>
          <button className="matrix-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          {/* Error Message */}
          {error && <div className="matrix-modal-error">{error}</div>}

          {/* Matrix Row Input */}
          <div className="matrix-row-editor">
            <table className="matrix-row-table">
              <thead>
                <tr>
                  <th className="matrix-row-th matrix-row-th--grade">Lớp</th>
                  <th className="matrix-row-th matrix-row-th--subject">Môn</th>
                  <th className="matrix-row-th matrix-row-th--chapter">Chương</th>
                  <th className="matrix-row-th matrix-row-th--bank">Bank</th>
                  <th className="matrix-row-th matrix-row-th--level matrix-row-th--nb">NB</th>
                  <th className="matrix-row-th matrix-row-th--level matrix-row-th--th">TH</th>
                  <th className="matrix-row-th matrix-row-th--level matrix-row-th--vd">VD</th>
                  <th className="matrix-row-th matrix-row-th--level matrix-row-th--vdc">VDC</th>
                  <th className="matrix-row-th matrix-row-th--total">Tổng</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* Grade */}
                  <td className="matrix-row-td">
                    <input
                      className="matrix-row-input matrix-row-input--grade"
                      list="matrix-grade-suggestions"
                      value={gradeLevel}
                      onChange={(e) => {
                        setGradeLevel(e.target.value);
                        setSelectedSubjectId('');
                        setChapterId('');
                        setQuestionBankId('');
                      }}
                      placeholder="12"
                      onKeyDown={handleKeyDown}
                    />
                    <datalist id="matrix-grade-suggestions">
                      {gradeSuggestions.map((grade) => (
                        <option key={grade} value={grade} />
                      ))}
                    </datalist>
                  </td>

                  {/* Subject */}
                  <td className="matrix-row-td">
                    <select
                      className="matrix-row-select"
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setChapterId('');
                        setQuestionBankId('');
                      }}
                      disabled={
                        (gradeLevel ? subjectsByGradeQuery.isLoading : subjectsQuery.isLoading) ||
                        subjectOptions.length === 0
                      }
                      onKeyDown={handleKeyDown}
                    >
                      {subjectOptions.length === 0 && <option value="">Chọn lớp</option>}
                      {subjectOptions.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Chapter */}
                  <td className="matrix-row-td">
                    <select
                      className="matrix-row-select"
                      value={chapterId}
                      onChange={(e) => setChapterId(e.target.value)}
                      required
                      disabled={chapterQuery.isLoading || !selectedSubjectId}
                      onKeyDown={handleKeyDown}
                    >
                      {!selectedSubjectId && <option value="">Chọn môn</option>}
                      {selectedSubjectId && chapters.length === 0 && (
                        <option value="">Không có chương</option>
                      )}
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title || chapter.name || chapter.id}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Bank */}
                  <td className="matrix-row-td matrix-row-td--bank">
                    <div className="matrix-row-bank-wrapper">
                      <input
                        className="matrix-row-input matrix-row-input--search"
                        placeholder="Tìm bank..."
                        value={questionBankSearch}
                        onChange={(e) => setQuestionBankSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <select
                        className="matrix-row-select matrix-row-select--bank"
                        value={questionBankId}
                        onChange={(e) => setQuestionBankId(e.target.value)}
                        required
                        disabled={questionBanksQuery.isLoading || !chapterId}
                        onKeyDown={handleKeyDown}
                      >
                        {!chapterId && <option value="">Chọn chương</option>}
                        {chapterId && questionBanks.length === 0 && (
                          <option value="">Không có bank</option>
                        )}
                        {questionBanks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Cognitive Levels */}
                  {LEVELS.map((level) => (
                    <td key={level} className="matrix-row-td matrix-row-td--level">
                      <input
                        className="matrix-row-input matrix-row-input--number"
                        type="number"
                        min={0}
                        value={cells[level].questionCount}
                        onChange={(e) =>
                          setCells((prev) => ({
                            ...prev,
                            [level]: {
                              ...prev[level],
                              questionCount: Number(e.target.value),
                            },
                          }))
                        }
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                  ))}

                  {/* Total */}
                  <td className="matrix-row-td matrix-row-td--total">
                    <div className="matrix-row-total">{rowTotalQuestions}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compact Footer */}
          <div className="matrix-modal-footer">
            <button type="button" className="matrix-modal-btn matrix-modal-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="matrix-modal-btn matrix-modal-btn--primary"
              disabled={addRowMutation.isPending}
            >
              {addRowMutation.isPending ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
