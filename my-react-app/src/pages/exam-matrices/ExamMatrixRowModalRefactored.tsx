import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { useAddExamMatrixRow } from '../../hooks/useExamMatrix';
import { useSearchQuestionBanks } from '../../hooks/useQuestionBank';
import { useSubjects, useSubjectsByGrade } from '../../hooks/useSubjects';
import type { ExamMatrixRowRequest } from '../../types/examMatrix';
import './exam-matrix-row-modal.css';

type Props = {
  isOpen: boolean;
  matrixId: string;
  matrixGradeLevel?: string;
  subjectId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ExamMatrixRowModalRefactored({
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
  const [questionBankId, setQuestionBankId] = useState('');
  const [questionBankSearch, setQuestionBankSearch] = useState('');
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
      gradeFromApi.add(String(matrixGradeLevel));
    }

    return Array.from(new Set([...defaults, ...Array.from(gradeFromApi)])).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [allSubjects, matrixGradeLevel]);

  const selectedQuestionBank = useMemo(
    () => questionBanks.find((item) => item.id === questionBankId),
    [questionBanks, questionBankId],
  );

  useEffect(() => {
    if (!isOpen) return;
    setGradeLevel(matrixGradeLevel ?? '');
    setSelectedSubjectId(subjectId ?? '');
    setQuestionBankSearch('');
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

    const payload: ExamMatrixRowRequest = {
      chapterId,
      questionBankId,
      questionTypeName: selectedQuestionBank?.name?.trim() || 'Bank mapping',
      cells: [],
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
    <div className="matrix-modal-overlay">
      <div className="matrix-modal-container">
        {/* Compact Header */}
        <div className="matrix-modal-header">
          <h3 className="matrix-modal-title">Thêm dòng ngân hàng câu hỏi</h3>
          <button className="matrix-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          {/* Error Message */}
          {error && <div className="matrix-modal-error">{error}</div>}

          {/* Matrix Row Input */}
          <div className="matrix-row-editor">
            <p className="matrix-row-note">
              Dòng này chỉ dùng để map ngân hàng câu hỏi. Số câu sẽ được phân bổ theo phần trăm ở dòng tổng của bảng ma trận.
            </p>
            <table className="matrix-row-table">
              <thead>
                <tr>
                  <th className="matrix-row-th matrix-row-th--grade">Lớp</th>
                  <th className="matrix-row-th matrix-row-th--subject">Môn</th>
                  <th className="matrix-row-th matrix-row-th--chapter">Chương</th>
                  <th className="matrix-row-th matrix-row-th--bank">Bank</th>
                  <th className="matrix-row-th matrix-row-th--total">Loại dòng</th>
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

                  <td className="matrix-row-td matrix-row-td--total">
                    <div className="matrix-row-total">Mapping bank</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cognitive Stats Panel */}
          {selectedQuestionBank && (
            <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>
                Số câu trong bank: <strong style={{ color: '#111' }}>{selectedQuestionBank.name}</strong>
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {([
                  { backendKey: 'NHAN_BIET', label: 'Nhận biết', color: '#6b7280', bg: '#f3f4f6' },
                  { backendKey: 'THONG_HIEU', label: 'Thông hiểu', color: '#2563eb', bg: '#eff6ff' },
                  { backendKey: 'VAN_DUNG', label: 'Vận dụng', color: '#ea580c', bg: '#fff7ed' },
                  { backendKey: 'VAN_DUNG_CAO', label: 'Vận dụng cao', color: '#dc2626', bg: '#fef2f2' },
                ] as const).map(({ backendKey, label, color, bg }) => {
                  const available = selectedQuestionBank.cognitiveStats?.[backendKey] ?? 0;
                  return (
                    <div key={backendKey} style={{ flex: '1 1 calc(25% - 8px)', minWidth: 100, padding: '8px 10px', borderRadius: 6, background: bg, border: `1px solid ${color}33` }}>
                      <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color }}>{available}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>câu</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              {addRowMutation.isPending ? 'Đang thêm...' : 'Thêm bank vào ma trận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
