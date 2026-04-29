import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useSearchQuestionBanks } from '../../hooks/useQuestionBank';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import { useGrades } from '../../hooks/useGrades';
import { TFQuestionEditor } from '../../components/exam-matrix/TFQuestionEditor';
import type { ExamMatrixRowRequest, MatrixCognitiveLevel } from '../../types/examMatrix';

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

interface TFClause {
  text: string;
  chapterId?: string;
  cognitiveLevel?: MatrixCognitiveLevel;
  truthValue: boolean;
}

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  subjectId?: string;
  matrixTotalPointsTarget?: number;
  numberOfParts?: number;  // NEW: Number of parts in the matrix (1, 2, or 3)
  onClose: () => void;
  onSuccess: () => void;
};

const defaultCells: CellDraftMap = {
  NB: { questionCount: 0 },
  TH: { questionCount: 0 },
  VD: { questionCount: 0 },
  VDC: { questionCount: 0 },
};

export function ExamMatrixRowModal({
  isOpen,
  matrixId,
  matrixGradeLevel,
  subjectId,
  matrixTotalPointsTarget,
  numberOfParts = 1,  // NEW: Default to 1 part
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const [questionBankSearch, setQuestionBankSearch] = useState('');
  const [partNumber, setPartNumber] = useState(1);  // NEW: Selected part number
  const [cells, setCells] = useState<CellDraftMap>(defaultCells);
  const [error, setError] = useState<string | null>(null);
  const [tfClauses, setTfClauses] = useState<TFClause[]>([
    { text: '', truthValue: false },
    { text: '', truthValue: false },
    { text: '', truthValue: false },
    { text: '', truthValue: false },
  ]);
  const [tfStem, setTfStem] = useState('');

  const addRowMutation = useAddExamMatrixRow();
  const { data: gradesData, isLoading: isLoadingGrades } = useGrades(isOpen);
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
  const grades = gradesData?.result ?? [];
  const questionBanks = questionBanksQuery.data?.result?.content ?? [];

  // Sort grades by level
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);


  const chapterLabel = useMemo(() => {
    const selected = chapters.find((item) => item.id === chapterId);
    return selected?.title || selected?.name || chapterId;
  }, [chapters, chapterId]);

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
    setPartNumber(1);  // NEW: Reset to part 1
    setTfStem('');
    setTfClauses([
      { text: '', truthValue: false },
      { text: '', truthValue: false },
      { text: '', truthValue: false },
      { text: '', truthValue: false },
    ]);
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

    const hasInvalidCell = LEVELS.some(
      (level) => cells[level].questionCount < 0,
    );
    if (hasInvalidCell) {
      setError('Số câu phải >= 0.');
      return;
    }

    const payload: ExamMatrixRowRequest = {
      chapterId,
      questionBankId,
      questionTypeName: selectedQuestionBank?.name?.trim() || 'Dạng bài theo bank',
      cells: LEVELS.filter((level) => cells[level].questionCount > 0).map(
        (level) => ({
          cognitiveLevel: BACKEND_COGNITIVE_LEVEL[level],
          questionCount: cells[level].questionCount,
          pointsPerQuestion: Number(((matrixTotalPointsTarget && matrixTotalPointsTarget > 0 ? matrixTotalPointsTarget : 10) / rowTotalQuestions).toFixed(4)),
          partNumber: partNumber,  // NEW: Include part number
        }),
      ),
    };

    // NEW: Include TF metadata if part 2 is selected
    if (partNumber === 2) {
      (payload as any).tfMetadata = {
        stem: tfStem,
        clauses: tfClauses,
      };
    }

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

            {/* NEW: Part Number Selector */}
            {numberOfParts > 1 && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mod-ink)', display: 'block', marginBottom: 8 }}>
                  Chọn phần đề
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3].map((num) => {
                    if (num > numberOfParts) return null;
                    const partLabels: Record<number, string> = {
                      1: 'Phần I (MCQ)',
                      2: 'Phần II (TF)',
                      3: 'Phần III (SA)',
                    };
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPartNumber(num)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0.8rem',
                          borderRadius: 6,
                          border: '2px solid',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          backgroundColor: partNumber === num ? '#1d4ed8' : 'transparent',
                          borderColor: partNumber === num ? '#1d4ed8' : '#cbd5e1',
                          color: partNumber === num ? '#fff' : '#64748b',
                        }}
                      >
                        {partLabels[num]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NEW: TF Question Editor */}
            {partNumber === 2 && (
              <TFQuestionEditor
                stem={tfStem}
                clauses={tfClauses}
                onStemChange={setTfStem}
                onClauseChange={(index, clause) => {
                  const newClauses = [...tfClauses];
                  newClauses[index] = clause;
                  setTfClauses(newClauses);
                }}
              />
            )}

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lớp</th>
                    <th>Môn</th>
                    <th>Chương</th>
                    <th>Bank</th>
                    <th>NB</th>
                    <th>TH</th>
                    <th>VD</th>
                    <th>VDC</th>
                    <th>Tổng dạng bài</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select
                        className="select"
                        value={gradeLevel}
                        onChange={(event) => {
                          setGradeLevel(event.target.value);
                          setSelectedSubjectId('');
                          setChapterId('');
                          setQuestionBankId('');
                        }}
                        disabled={isLoadingGrades}
                      >
                        <option value="">Chọn khối lớp</option>
                        {sortedGrades.map((grade) => (
                          <option key={grade.id} value={String(grade.level)}>
                            {grade.name || `Lớp ${grade.level}`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={selectedSubjectId}
                        onChange={(event) => {
                          setSelectedSubjectId(event.target.value);
                          setChapterId('');
                          setQuestionBankId('');
                        }}
                        disabled={subjectsByGradeQuery.isLoading || !gradeLevel || subjectsByGrade.length === 0}
                      >
                        {!gradeLevel ? (
                          <option value="">Chọn khối lớp trước</option>
                        ) : subjectsByGrade.length === 0 ? (
                          <option value="">Không có môn học</option>
                        ) : (
                          <>
                            <option value="">Chọn môn học</option>
                            {subjectsByGrade.map((subject) => (
                              <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                          </>
                        )}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={chapterId}
                        onChange={(event) => setChapterId(event.target.value)}
                        required
                        disabled={chapterQuery.isLoading || !selectedSubjectId}
                      >
                        {!selectedSubjectId ? (
                          <option value="">Chọn môn học trước</option>
                        ) : chapters.length === 0 ? (
                          <option value="">Không có chương</option>
                        ) : (
                          <>
                            <option value="">Chọn chương</option>
                            {chapters.map((chapter) => (
                              <option key={chapter.id} value={chapter.id}>
                                {chapter.title || chapter.name || chapter.id}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        placeholder="Tìm bank..."
                        value={questionBankSearch}
                        onChange={(event) => setQuestionBankSearch(event.target.value)}
                        style={{ marginBottom: 6 }}
                      />
                      <select
                        className="select"
                        value={questionBankId}
                        onChange={(event) => setQuestionBankId(event.target.value)}
                        required
                        disabled={questionBanksQuery.isLoading || !chapterId}
                      >
                        {!chapterId ? (
                          <option value="">Chọn chương trước</option>
                        ) : questionBanks.length === 0 ? (
                          <option value="">Không có bank phù hợp</option>
                        ) : (
                          <>
                            <option value="">Chọn ngân hàng câu hỏi</option>
                            {questionBanks.map((bank) => (
                              <option key={bank.id} value={bank.id}>
                                {bank.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </td>
                    {LEVELS.map((level) => (
                      <td key={level}>
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
                    ))}
                    <td><strong>{rowTotalQuestions}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="muted" style={{ marginTop: 6 }}>
              Tổng dạng bài (số câu): <strong>{rowTotalQuestions}</strong>
            </p>

            <p className="muted" style={{ marginTop: 4 }}>
              Chương đang chọn: <strong>{chapterLabel || 'Chưa chọn'}</strong>. Hệ thống sẽ chọn câu ngẫu nhiên từ ngân hàng câu hỏi.
            </p>

            {selectedQuestionBank && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-2, #f8f9fa)', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted, #6b7280)' }}>
                  Số câu khả dụng trong bank: <strong style={{ color: 'var(--text, #111)' }}>{selectedQuestionBank.name}</strong>
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(
                    [
                      { key: 'NB' as UiCognitiveLevel, label: 'Nhận biết',    color: '#6b7280', bg: '#f3f4f6' },
                      { key: 'TH' as UiCognitiveLevel, label: 'Thông hiểu',   color: '#2563eb', bg: '#eff6ff' },
                      { key: 'VD' as UiCognitiveLevel, label: 'Vận dụng',     color: '#ea580c', bg: '#fff7ed' },
                      { key: 'VDC' as UiCognitiveLevel, label: 'Vận dụng cao', color: '#dc2626', bg: '#fef2f2' },
                    ] as const
                  ).map(({ key, label, color, bg }) => {
                    const backendKey = BACKEND_COGNITIVE_LEVEL[key];
                    const available = selectedQuestionBank.cognitiveStats?.[backendKey] ?? 0;
                    const requested = cells[key].questionCount;
                    const isOver = requested > available;
                    return (
                      <div
                        key={key}
                        style={{
                          flex: '1 1 calc(25% - 8px)',
                          minWidth: 100,
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: bg,
                          border: `1px solid ${isOver ? '#fca5a5' : color + '33'}`,
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isOver ? '#dc2626' : color }}>
                          {available}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>câu khả dụng</div>
                        {isOver && (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>
                            ⚠ Yêu cầu {requested} &gt; {available} khả dụng
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                  Tổng câu trong bank:{' '}
                  <strong style={{ color: '#374151' }}>
                    {Object.values(selectedQuestionBank.cognitiveStats ?? {}).reduce(
                      (sum, v) => sum + Number(v),
                      0,
                    )}
                  </strong>
                </p>
              </div>
            )}
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
