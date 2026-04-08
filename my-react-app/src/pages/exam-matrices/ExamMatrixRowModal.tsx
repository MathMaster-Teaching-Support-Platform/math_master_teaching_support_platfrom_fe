import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import { useLessonsByChapter } from '../../hooks/useLessons';
import type { ExamMatrixRowRequest, MatrixCognitiveLevel } from '../../types/examMatrix';

const LEVELS: MatrixCognitiveLevel[] = ['NB', 'TH', 'VD', 'VDC'];

type CellDraft = {
  questionCount: number;
  scorePercent: number;
};

type CellDraftMap = Record<MatrixCognitiveLevel, CellDraft>;

type Props = {
  isOpen: boolean;
  matrixId: string;
  subjectId?: string;
  matrixTotalPointsTarget?: number;
  onClose: () => void;
  onSuccess: () => void;
};

const defaultCells: CellDraftMap = {
  NB: { questionCount: 0, scorePercent: 0 },
  TH: { questionCount: 0, scorePercent: 0 },
  VD: { questionCount: 0, scorePercent: 0 },
  VDC: { questionCount: 0, scorePercent: 0 },
};

export function ExamMatrixRowModal({
  isOpen,
  matrixId,
  subjectId,
  matrixTotalPointsTarget,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [questionTypeName, setQuestionTypeName] = useState('');
  const [referenceQuestions, setReferenceQuestions] = useState('');
  const [cells, setCells] = useState<CellDraftMap>(defaultCells);
  const [error, setError] = useState<string | null>(null);

  const addRowMutation = useAddExamMatrixRow();
  const chapterQuery = useChaptersBySubject(subjectId ?? '', isOpen && !!subjectId);
  const lessonQuery = useLessonsByChapter(chapterId, '', isOpen && !!chapterId);
  const questionBanksQuery = useGetMyQuestionBanks(0, 100, 'createdAt', 'DESC', isOpen);

  const chapters = chapterQuery.data?.result ?? [];
  const lessons = lessonQuery.data?.result ?? [];
  const questionBanks = questionBanksQuery.data?.result?.content ?? [];

  const chapterLabel = useMemo(() => {
    const selected = chapters.find((item) => item.id === chapterId);
    return selected?.title || selected?.name || chapterId;
  }, [chapters, chapterId]);

  const totalPercent = useMemo(
    () => LEVELS.reduce((sum, level) => sum + (cells[level].scorePercent || 0), 0),
    [cells],
  );

  useEffect(() => {
    if (!isOpen) return;
    setLessonId('');
    setQuestionTypeName('');
    setReferenceQuestions('');
    setQuestionDifficulty('MEDIUM');
    setError(null);
    setCells(defaultCells);
    if (!subjectId) {
      setChapterId('');
    }
  }, [isOpen, subjectId]);

  useEffect(() => {
    if (!isOpen) return;
    if (chapters.length > 0 && !chapterId) {
      setChapterId(chapters[0].id);
    }
  }, [isOpen, chapters, chapterId]);

  useEffect(() => {
    if (!isOpen) return;
    if (questionBanks.length > 0 && !questionBankId) {
      setQuestionBankId(questionBanks[0].id);
    }
  }, [isOpen, questionBanks, questionBankId]);

  if (!isOpen) return null;

  const activeCells = LEVELS.filter(
    (level) => cells[level].questionCount > 0 && cells[level].scorePercent > 0,
  );

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

    if (!questionTypeName.trim()) {
      setError('Vui lòng nhập dạng bài.');
      return;
    }

    if (activeCells.length === 0) {
      setError('Mỗi dòng cần ít nhất 1 ô có số câu và phổ điểm (%) > 0.');
      return;
    }

    const hasInvalidCell = LEVELS.some(
      (level) =>
        cells[level].questionCount < 0 ||
        cells[level].scorePercent < 0 ||
        cells[level].scorePercent > 100,
    );
    if (hasInvalidCell) {
      setError('Số câu phải >= 0 và phổ điểm phải nằm trong khoảng 0-100.');
      return;
    }

    if (totalPercent <= 0) {
      setError('Tổng phổ điểm phải lớn hơn 0%.');
      return;
    }

    if (totalPercent > 100) {
      setError('Tổng phổ điểm vượt quá 100%. Vui lòng điều chỉnh lại.');
      return;
    }

    const examTotalPoints = matrixTotalPointsTarget && matrixTotalPointsTarget > 0
      ? matrixTotalPointsTarget
      : 10;

    const payload: ExamMatrixRowRequest = {
      chapterId,
      ...(lessonId ? { lessonId } : {}),
      questionBankId,
      questionDifficulty,
      questionTypeName: questionTypeName.trim(),
      referenceQuestions: referenceQuestions.trim() || undefined,
      cells: LEVELS.filter((level) => cells[level].questionCount > 0 && cells[level].scorePercent > 0).map(
        (level) => ({
          cognitiveLevel: level,
          questionCount: cells[level].questionCount,
          pointsPerQuestion: Number(
            (
              (examTotalPoints * cells[level].scorePercent) /
              100 /
              cells[level].questionCount
            ).toFixed(4),
          ),
        }),
      ),
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
      <div className="modal-card" style={{ width: 'min(920px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Thêm dòng ma trận</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Ma trận là blueprint của đề. Câu hỏi sẽ được chọn ngẫu nhiên từ ngân hàng khi tạo đề.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Chương</p>
                <select
                  className="select"
                  value={chapterId}
                  onChange={(event) => {
                    setChapterId(event.target.value);
                    setLessonId('');
                  }}
                  required
                  disabled={chapterQuery.isLoading || !subjectId}
                >
                  {!subjectId && <option value="">Không có dữ liệu môn học trong ma trận</option>}
                  {subjectId && chapters.length === 0 && <option value="">Không có chương</option>}
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title || chapter.name || chapter.id}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Bài học (tùy chọn)</p>
                <select
                  className="select"
                  value={lessonId}
                  onChange={(event) => setLessonId(event.target.value)}
                  disabled={!chapterId || lessonQuery.isLoading}
                >
                  <option value="">Tất cả bài trong chương</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title || lesson.id}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Ngân hàng câu hỏi</p>
                <select
                  className="select"
                  value={questionBankId}
                  onChange={(event) => setQuestionBankId(event.target.value)}
                  required
                  disabled={questionBanksQuery.isLoading}
                >
                  {questionBanks.length === 0 && <option value="">Không có ngân hàng câu hỏi</option>}
                  {questionBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Độ khó</p>
                <select
                  className="select"
                  value={questionDifficulty}
                  onChange={(event) => setQuestionDifficulty(event.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Dạng bài</p>
                <input
                  className="input"
                  required
                  placeholder="Ví dụ: Đơn điệu của hàm số"
                  value={questionTypeName}
                  onChange={(event) => setQuestionTypeName(event.target.value)}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Gợi ý câu tham chiếu (tùy chọn)</p>
                <input
                  className="input"
                  placeholder="Ví dụ: Câu 1-3 SGK"
                  value={referenceQuestions}
                  onChange={(event) => setReferenceQuestions(event.target.value)}
                />
              </label>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mức độ</th>
                    <th>Số câu</th>
                    <th>Phổ điểm (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVELS.map((level) => (
                    <tr key={level}>
                      <td><strong>{level}</strong></td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          value={cells[level].questionCount}
                          onChange={(event) =>
                            setCells((prev) => ({
                              ...prev,
                              [level]: {
                                ...prev[level],
                                questionCount: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={cells[level].scorePercent}
                          onChange={(event) =>
                            setCells((prev) => ({
                              ...prev,
                              [level]: {
                                ...prev[level],
                                scorePercent: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="muted" style={{ marginTop: 6 }}>
              Tổng phổ điểm hiện tại: <strong>{totalPercent.toFixed(1)}%</strong>
              {matrixTotalPointsTarget && matrixTotalPointsTarget > 0
                ? ` | Quy đổi theo tổng điểm mục tiêu: ${matrixTotalPointsTarget}`
                : ' | Ma trận chưa có tổng điểm mục tiêu, FE tạm quy đổi theo tổng điểm mặc định 10.'}
            </p>

            <p className="muted" style={{ marginTop: 4 }}>
              Chương đang chọn: <strong>{chapterLabel || 'Chưa chọn'}</strong>. Hệ thống sẽ chọn câu ngẫu nhiên từ ngân hàng câu hỏi.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={addRowMutation.isPending}>
              {addRowMutation.isPending ? 'Đang thêm dòng...' : 'Thêm dòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
