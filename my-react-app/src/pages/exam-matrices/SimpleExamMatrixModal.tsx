import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { questionBankService } from '../../services/questionBankService';
import { examMatrixService } from '../../services/examMatrixService';
import { ChapterService } from '../../services/api/chapter.service';
import { useGrades } from '../../hooks/useGrades';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import type { QuestionBankResponse } from '../../types/questionBank';
import type { BuildSimpleExamMatrixRequest, ExamMatrixTableResponse } from '../../types/examMatrix';
import type { ChapterResponse } from '../../types/chapter.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (matrix: ExamMatrixTableResponse) => void;
};

type ChapterCounts = {
  enabled: boolean;
  nb: number;
  th: number;
  vd: number;
  vdc: number;
};

const EMPTY_COUNTS: ChapterCounts = { enabled: false, nb: 0, th: 0, vd: 0, vdc: 0 };

/**
 * Happy-case matrix builder modal.
 *
 * <p>Matrix is a pure blueprint: structure (chapters × NB/TH/VD/VDC counts) is
 * what gets stored. The flow is fully bank-independent —
 *   1. pick a grade (required)
 *   2. pick a subject (required, scoped to grade)
 *   3. modal loads the chapter list for that subject
 *   4. teacher fills NB/TH/VD/VDC counts per chapter
 *   5. (optional) pick a default question bank for the assessment-time pre-fill
 *   6. submit -> POST /exam-matrices/build-simple
 */
export function SimpleExamMatrixModal({ isOpen, onClose, onCreated }: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsPerQuestion, setPointsPerQuestion] = useState<string>('0.25');
  const [isReusable, setIsReusable] = useState(false);

  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [counts, setCounts] = useState<Record<string, ChapterCounts>>({});

  // Optional default bank (no longer required for matrix creation).
  const [banks, setBanks] = useState<QuestionBankResponse[]>([]);
  const [defaultBankId, setDefaultBankId] = useState<string>('');
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: gradesData, isLoading: loadingGrades } = useGrades(isOpen);
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjectsByGrade(
    gradeLevel,
    isOpen && !!gradeLevel
  );
  const grades = useMemo(() => gradesData?.result ?? [], [gradesData]);
  const subjects = useMemo(() => subjectsData?.result ?? [], [subjectsData]);

  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => a.level - b.level),
    [grades]
  );

  // Reset on open/close.
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setDescription('');
    setPointsPerQuestion('0.25');
    setIsReusable(false);
    setGradeLevel('');
    setSubjectId('');
    setChapters([]);
    setCounts({});
    setDefaultBankId('');
    setError(null);
  }, [isOpen]);

  // Load chapters when subject changes.
  useEffect(() => {
    if (!isOpen || !subjectId) {
      setChapters([]);
      setCounts({});
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    ChapterService.getChaptersBySubject(subjectId)
      .then((res) => {
        if (cancelled) return;
        const list = res.result ?? [];
        setChapters(list);
        const initial: Record<string, ChapterCounts> = {};
        for (const ch of list) initial[ch.id] = { ...EMPTY_COUNTS };
        setCounts(initial);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không tải được danh sách chương');
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, subjectId]);

  // Load (optional) default bank list once on open.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingBanks(true);
    questionBankService
      .getMyQuestionBanks(0, 200)
      .then((res) => {
        if (cancelled) return;
        setBanks(res.result?.content ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setBanks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBanks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const totals = useMemo(() => {
    let chaptersUsed = 0;
    let questions = 0;
    for (const c of Object.values(counts)) {
      if (!c.enabled) continue;
      const sum = (c.nb ?? 0) + (c.th ?? 0) + (c.vd ?? 0) + (c.vdc ?? 0);
      if (sum > 0) {
        chaptersUsed += 1;
        questions += sum;
      }
    }
    return { chapters: chaptersUsed, questions };
  }, [counts]);

  if (!isOpen) return null;

  function update(chapterId: string, patch: Partial<ChapterCounts>) {
    setCounts((prev) => ({
      ...prev,
      [chapterId]: { ...EMPTY_COUNTS, ...prev[chapterId], ...patch },
    }));
  }

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập tên ma trận.');
      return;
    }
    if (!gradeLevel) {
      setError('Vui lòng chọn lớp.');
      return;
    }
    if (!subjectId) {
      setError('Vui lòng chọn môn học.');
      return;
    }

    const chapterPayload: BuildSimpleExamMatrixRequest['chapters'] = [];
    for (const [chapterId, c] of Object.entries(counts)) {
      if (!c.enabled) continue;
      const sum = (c.nb ?? 0) + (c.th ?? 0) + (c.vd ?? 0) + (c.vdc ?? 0);
      if (sum <= 0) continue;
      chapterPayload.push({
        chapterId,
        nb: c.nb || 0,
        th: c.th || 0,
        vd: c.vd || 0,
        vdc: c.vdc || 0,
      });
    }

    if (chapterPayload.length === 0) {
      setError('Hãy chọn ít nhất một chương và đặt số câu cho mỗi mức độ.');
      return;
    }

    const payload: BuildSimpleExamMatrixRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      // Bank is optional now — sent only if the teacher picked a default for
      // pre-filling the "Tạo đề thi" picker downstream.
      questionBankId: defaultBankId || undefined,
      gradeLevel: Number(gradeLevel),
      pointsPerQuestion: pointsPerQuestion ? Number(pointsPerQuestion) : undefined,
      isReusable,
      chapters: chapterPayload,
    };

    try {
      setSubmitting(true);
      const res = await examMatrixService.buildSimpleExamMatrix(payload);
      const data = res.result;
      onClose();
      if (data && onCreated) onCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo ma trận.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(1080px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Tạo ma trận đề (nhanh)</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chọn lớp + môn → tích chương → đặt số câu NB / TH / VD / VDC.
            </p>
            <p className="muted" style={{ marginTop: 2, fontSize: 12 }}>
              Ma trận là blueprint thuần — không cần ràng buộc với ngân hàng đề. Bạn sẽ
              chọn ngân hàng ở bước "Tạo đề thi". Trường "ngân hàng mặc định" bên dưới chỉ
              để pre-fill picker đó cho thuận tiện.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row" style={{ gap: 12 }}>
              <label style={{ flex: 2 }}>
                <p className="muted" style={{ marginBottom: 6 }}>Tên ma trận</p>
                <input
                  className="input"
                  required
                  maxLength={255}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Ma trận GHK1 - Toán 9"
                />
              </label>
              <label style={{ flex: 1 }}>
                <p className="muted" style={{ marginBottom: 6 }}>Điểm / câu</p>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  className="input"
                  value={pointsPerQuestion}
                  onChange={(e) => setPointsPerQuestion(e.target.value)}
                />
              </label>
            </div>

            <div className="row" style={{ gap: 12 }}>
              <label style={{ flex: 1 }}>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Lớp <span style={{ color: 'var(--mod-danger, #dc2626)' }}>*</span>
                </p>
                <select
                  className="input"
                  required
                  value={gradeLevel}
                  disabled={loadingGrades}
                  onChange={(e) => {
                    setGradeLevel(e.target.value);
                    setSubjectId('');
                  }}
                >
                  <option value="">{loadingGrades ? 'Đang tải...' : '— Chọn lớp —'}</option>
                  {sortedGrades.map((g) => (
                    <option key={g.id} value={String(g.level)}>
                      {g.name || `Lớp ${g.level}`}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: 1 }}>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Môn học <span style={{ color: 'var(--mod-danger, #dc2626)' }}>*</span>
                </p>
                <select
                  className="input"
                  required
                  value={subjectId}
                  disabled={!gradeLevel || loadingSubjects}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">
                    {!gradeLevel
                      ? 'Chọn lớp trước'
                      : loadingSubjects
                        ? 'Đang tải...'
                        : '— Chọn môn học —'}
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Ngân hàng câu hỏi mặc định{' '}
                <span style={{ color: 'var(--mod-muted, #64748b)', fontSize: 12 }}>
                  (tùy chọn)
                </span>
              </p>
              <select
                className="input"
                value={defaultBankId}
                disabled={loadingBanks}
                onChange={(e) => setDefaultBankId(e.target.value)}
              >
                <option value="">— Không gợi ý ngân hàng nào —</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.schoolGradeName ? ` · ${b.schoolGradeName}` : ''}
                    {b.subjectName ? ` · ${b.subjectName}` : ''}
                  </option>
                ))}
              </select>
              <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                Lưu thành ngân hàng mặc định của ma trận; teacher có thể đổi bank khác khi
                tạo đề.
              </p>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
              <textarea
                className="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="row" style={{ justifyContent: 'flex-start' }}>
              <input
                type="checkbox"
                checked={isReusable}
                onChange={(e) => setIsReusable(e.target.checked)}
              />{' '}
              Cho phép dùng lại cho nhiều đề thi
            </label>

            {loadingChapters && <div className="empty">Đang tải chương...</div>}

            {!loadingChapters && subjectId && chapters.length === 0 && (
              <div className="empty">Môn này chưa có chương trong hệ thống.</div>
            )}

            {!loadingChapters && chapters.length > 0 && (
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={cellStyle}>Chọn</th>
                      <th style={{ ...cellStyle, textAlign: 'left' }}>Chương</th>
                      <th style={cellStyle}>NB</th>
                      <th style={cellStyle}>TH</th>
                      <th style={cellStyle}>VD</th>
                      <th style={cellStyle}>VDC</th>
                      <th style={cellStyle}>Σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((ch) => {
                      const c = counts[ch.id] ?? EMPTY_COUNTS;
                      const sum = (c.nb ?? 0) + (c.th ?? 0) + (c.vd ?? 0) + (c.vdc ?? 0);
                      return (
                        <tr key={ch.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td style={cellStyle}>
                            <input
                              type="checkbox"
                              checked={c.enabled}
                              onChange={(e) =>
                                update(ch.id, { enabled: e.target.checked })
                              }
                            />
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'left' }}>
                            {ch.orderIndex != null ? `${ch.orderIndex}. ` : ''}
                            {ch.title || ch.name || ch.id}
                          </td>
                          {(['nb', 'th', 'vd', 'vdc'] as const).map((lvl) => (
                            <td key={lvl} style={cellStyle}>
                              <input
                                type="number"
                                min="0"
                                className="input"
                                style={{ width: 70 }}
                                disabled={!c.enabled}
                                value={c[lvl] || 0}
                                onChange={(e) =>
                                  update(ch.id, {
                                    [lvl]: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                              />
                            </td>
                          ))}
                          <td style={cellStyle}>
                            <strong>{sum}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ background: '#f9fafb' }}>
                    <tr>
                      <td style={cellStyle} />
                      <td style={{ ...cellStyle, textAlign: 'left' }}>
                        <strong>Tổng cộng</strong>
                      </td>
                      <td style={cellStyle} colSpan={4}>
                        <span className="muted">
                          {totals.chapters} chương · {totals.questions} câu
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <strong>{totals.questions}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {error && (
              <div className="empty" style={{ color: 'var(--mod-danger)', marginTop: 0 }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn"
              disabled={
                submitting ||
                !name.trim() ||
                !gradeLevel ||
                !subjectId ||
                totals.questions === 0
              }
            >
              {submitting ? 'Đang tạo...' : 'Tạo ma trận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'center',
  verticalAlign: 'middle',
};
