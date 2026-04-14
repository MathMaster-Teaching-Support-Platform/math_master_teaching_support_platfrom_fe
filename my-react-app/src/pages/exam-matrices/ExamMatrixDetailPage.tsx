import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useApproveMatrix,
  useDeleteExamMatrix,
  useGetExamMatrixById,
  useGetExamMatrixTable,
  useRemoveExamMatrixRow,
  useResetMatrix,
} from '../../hooks/useExamMatrix';
import { examMatrixService } from '../../services/examMatrixService';
import '../../styles/module-refactor.css';
import {
  MatrixStatus,
  type ExamMatrixTableRow,
  type MatrixCognitiveDistribution,
  type MatrixValidationReport,
} from '../../types/examMatrix';
import { ExamMatrixRowModal } from './ExamMatrixRowModal';

const matrixStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

const cognitiveOrder = ['NB', 'TH', 'VD', 'VDC'] as const;

type MatrixLevel = (typeof cognitiveOrder)[number];

function normalizeLevel(level: string): MatrixLevel | null {
  const upper = level.toUpperCase();
  if (upper === 'NB' || upper === 'NHAN_BIET' || upper === 'REMEMBER') return 'NB';
  if (upper === 'TH' || upper === 'THONG_HIEU' || upper === 'UNDERSTAND') return 'TH';
  if (upper === 'VD' || upper === 'VAN_DUNG' || upper === 'APPLY') return 'VD';
  if (upper === 'VDC' || upper === 'VAN_DUNG_CAO' || upper === 'ANALYZE') return 'VDC';
  return null;
}

function getLevelCount(distribution: MatrixCognitiveDistribution | undefined, level: MatrixLevel) {
  if (!distribution) return 0;
  if (level === 'NB')
    return distribution.NB ?? distribution.NHAN_BIET ?? distribution.REMEMBER ?? 0;
  if (level === 'TH')
    return distribution.TH ?? distribution.THONG_HIEU ?? distribution.UNDERSTAND ?? 0;
  if (level === 'VD') return distribution.VD ?? distribution.VAN_DUNG ?? distribution.APPLY ?? 0;
  return distribution.VDC ?? distribution.VAN_DUNG_CAO ?? distribution.ANALYZE ?? 0;
}

function getRowCell(row: ExamMatrixTableRow, level: MatrixLevel) {
  const fromCells = row.cells?.find((cell) => normalizeLevel(cell.cognitiveLevel) === level);
  const questionCount = fromCells?.questionCount ?? getLevelCount(row.countByCognitive, level);
  const pointsPerQuestion = fromCells?.pointsPerQuestion ?? 0;
  return { questionCount, pointsPerQuestion };
}

function pickDisplayValue(...values: Array<string | number | null | undefined>) {
  const found = values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ''
  );
  return found !== undefined && found !== null ? String(found) : '-';
}

export default function ExamMatrixDetailPage() {
  const { matrixId } = useParams<{ matrixId: string }>();
  const navigate = useNavigate();

  const [validation, setValidation] = useState<MatrixValidationReport | null>(null);
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetExamMatrixById(
    matrixId ?? '',
    !!matrixId
  );
  const { data: tableData, refetch: refetchTable } = useGetExamMatrixTable(
    matrixId ?? '',
    !!matrixId
  );

  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const removeRowMutation = useRemoveExamMatrixRow();

  const matrix = data?.result;
  const table = tableData?.result;
  const chapters = useMemo(() => table?.chapters ?? [], [table]);

  const tableRows = useMemo(() => {
    return chapters.flatMap((chapter) =>
      chapter.rows.map((row) => ({
        ...row,
        chapterName: row.chapterName || row.chapter_name || chapter.chapterName || 'N/A',
      }))
    );
  }, [chapters]);

  const tableTotals = useMemo(() => {
    let nb = 0;
    let th = 0;
    let vd = 0;
    let vdc = 0;
    let total = 0;

    for (const row of tableRows) {
      nb += getRowCell(row, 'NB').questionCount;
      th += getRowCell(row, 'TH').questionCount;
      vd += getRowCell(row, 'VD').questionCount;
      vdc += getRowCell(row, 'VDC').questionCount;
      total += row.rowTotalQuestions;
    }

    return { nb, th, vd, vdc, total };
  }, [tableRows]);

  const canEdit = matrix?.status === MatrixStatus.DRAFT;

  async function refreshMatrix() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTable()]);
    } finally {
      setRefreshing(false);
    }
  }

  async function runValidation() {
    if (!matrixId) return;
    setValidating(true);
    try {
      const result = await examMatrixService.validateMatrix(matrixId);
      setValidation(result.result ?? null);
    } finally {
      setValidating(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!matrixId) return;
    await removeRowMutation.mutateAsync({ matrixId, rowId });
    await refetchTable();
  }

  async function removeMatrix() {
    if (!matrixId) return;
    if (!globalThis.confirm('Bạn có chắc muốn xóa ma trận này?')) return;
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices', { replace: true });
  }

  async function handleApprove() {
    if (!matrix?.id) return;
    if (
      !globalThis.confirm(
        'Bạn có chắc muốn phê duyệt ma trận này? Sau khi phê duyệt, bạn không thể chỉnh sửa.'
      )
    )
      return;
    await approveMutation.mutateAsync(matrix.id);
    await refetch();
  }

  async function handleReset() {
    if (!matrix?.id) return;
    if (!globalThis.confirm('Bạn có chắc muốn đặt lại ma trận về trạng thái nháp?')) return;
    await resetMutation.mutateAsync(matrix.id);
    await refetch();
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
            <ArrowLeft size={15} />
            Quay lại danh sách ma trận
          </button>

          {isLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                gap: '1rem',
              }}
            >
              <style>{`@keyframes emxd-spin { to { transform: rotate(360deg); } }`}</style>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  animation: 'emxd-spin 0.75s linear infinite',
                  display: 'inline-block',
                }}
              />
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Đang tải chi tiết ma trận...
              </p>
            </div>
          )}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}
            </div>
          )}
          {!isLoading && !isError && !matrix && (
            <div className="empty">Không tìm thấy ma trận.</div>
          )}

          {!isLoading && !isError && matrix && (
            <>
              <article className="hero-card">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <p className="hero-kicker">Blueprint đề kiểm tra</p>
                    <h2 style={{ marginTop: 8, marginBottom: 12 }}>{matrix.name}</h2>
                    <p style={{ marginBottom: 12 }}>{matrix.description || 'Không có mô tả'}</p>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Khối
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.gradeLevel || table?.gradeLevel || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Môn học
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.subjectName || table?.subjectName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Tổng điểm
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.totalPointsTarget || 10}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge ${matrix.status.toLowerCase()}`}
                    style={{ fontSize: 13, padding: '6px 12px' }}
                  >
                    {matrixStatusLabel[matrix.status] || matrix.status}
                  </span>
                </div>

                <div className="row" style={{ marginTop: 20, gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn secondary"
                    onClick={() => void refreshMatrix()}
                    disabled={refreshing}
                  >
                    <RefreshCw size={14} />
                    {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => void runValidation()}
                    disabled={validating}
                  >
                    <ShieldCheck size={15} />
                    {validating ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                  {matrix.status === MatrixStatus.DRAFT && (
                    <button
                      className="btn"
                      onClick={() => void handleApprove()}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 size={15} />
                      {approveMutation.isPending ? 'Đang phê duyệt...' : 'Phê duyệt'}
                    </button>
                  )}
                  {matrix.status === MatrixStatus.APPROVED && (
                    <button
                      className="btn warn"
                      onClick={() => void handleReset()}
                      disabled={resetMutation.isPending}
                    >
                      <RotateCcw size={15} />
                      {resetMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại'}
                    </button>
                  )}
                  {matrix.status !== MatrixStatus.LOCKED && (
                    <button
                      className="btn danger"
                      onClick={() => void removeMatrix()}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={15} />
                      {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  )}
                </div>
              </article>

              {validation && (
                <article className="data-card" style={{ minHeight: 0 }}>
                  <div className="row" style={{ alignItems: 'start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: 8 }}>Báo cáo kiểm tra</h3>
                      <p className="muted" style={{ fontSize: 13 }}>
                        Lỗi:{' '}
                        <strong
                          style={{ color: validation.errors.length > 0 ? '#dc2626' : '#10b981' }}
                        >
                          {validation.errors.length}
                        </strong>{' '}
                        | Cảnh báo:{' '}
                        <strong
                          style={{ color: validation.warnings.length > 0 ? '#f59e0b' : '#10b981' }}
                        >
                          {validation.warnings.length}
                        </strong>
                      </p>
                    </div>
                    <span className={`badge ${validation.canApprove ? 'approved' : 'closed'}`}>
                      {validation.canApprove ? 'Sẵn sàng phê duyệt' : 'Cần xử lý'}
                    </span>
                  </div>
                  {validation.errors.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p
                        style={{ fontWeight: 600, fontSize: 13, color: '#dc2626', marginBottom: 8 }}
                      >
                        Lỗi cần sửa:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.errors.map((item) => (
                          <li
                            key={`error-${item}`}
                            style={{ color: '#dc2626', fontSize: 13, marginBottom: 4 }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p
                        style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', marginBottom: 8 }}
                      >
                        Cảnh báo:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.warnings.map((item) => (
                          <li
                            key={`warning-${item}`}
                            style={{ color: '#f59e0b', fontSize: 13, marginBottom: 4 }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}

              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 24,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ marginBottom: 4 }}>Bảng ma trận đề</h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    Ma trận đề theo chuẩn Bộ Giáo dục và Đào tạo
                  </p>
                </div>
                {canEdit && (
                  <button className="btn" onClick={() => setRowModalOpen(true)}>
                    <Plus size={15} />
                    Thêm dòng
                  </button>
                )}
              </div>

              {tableRows.length === 0 ? (
                <div className="empty">
                  Ma trận chưa có dòng nào. Hãy thêm dòng từ ngân hàng câu hỏi.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table matrix-table">
                    <thead>
                      <tr>
                        <th>Lớp</th>
                        <th>Môn</th>
                        <th>Chương</th>
                        <th>Bank</th>
                        <th>Dạng bài</th>
                        <th
                          className="matrix-level-header matrix-level-header--nb"
                          title="questions will be randomly selected from Question Bank"
                        >
                          NB
                        </th>
                        <th
                          className="matrix-level-header matrix-level-header--th"
                          title="questions will be randomly selected from Question Bank"
                        >
                          TH
                        </th>
                        <th
                          className="matrix-level-header matrix-level-header--vd"
                          title="questions will be randomly selected from Question Bank"
                        >
                          VD
                        </th>
                        <th
                          className="matrix-level-header matrix-level-header--vdc"
                          title="questions will be randomly selected from Question Bank"
                        >
                          VDC
                        </th>
                        <th>Tổng dạng bài</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.rowId}>
                          <td>
                            {pickDisplayValue(
                              row.schoolGradeName,
                              row.school_grade_name,
                              row.gradeLevel,
                              row.grade_level,
                              row.schoolGrade,
                              row.school_grade,
                              matrix?.gradeLevel,
                              table?.gradeLevel
                            )}
                          </td>
                          <td>
                            {pickDisplayValue(
                              row.subjectName,
                              row.subject_name,
                              row.subject,
                              matrix?.subjectName,
                              table?.subjectName
                            )}
                          </td>
                          <td>
                            {pickDisplayValue(row.chapterName, row.chapter_name, row.chapter)}
                          </td>
                          <td>
                            <div>{row.questionBankName || row.questionBankId || '-'}</div>
                            {canEdit && (
                              <button
                                className="btn danger"
                                style={{ marginTop: 6 }}
                                onClick={() => void removeRow(row.rowId)}
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong>{row.questionTypeName}</strong>
                              {row.referenceQuestions && (
                                <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                                  {row.referenceQuestions}
                                </p>
                              )}
                            </div>
                          </td>
                          {cognitiveOrder.map((level) => {
                            const cell = getRowCell(row, level);
                            const isEmpty = cell.questionCount <= 0;
                            return (
                              <td
                                key={`${row.rowId}-${level}`}
                                className={
                                  isEmpty ? 'matrix-cell matrix-cell--empty' : 'matrix-cell'
                                }
                              >
                                <strong>{cell.questionCount || 0}</strong>
                              </td>
                            );
                          })}
                          <td>
                            <strong>{row.rowTotalQuestions}</strong>
                          </td>
                        </tr>
                      ))}

                      <tr className="matrix-grand-total-row">
                        <td colSpan={5}>
                          <strong>Tổng</strong>
                        </td>
                        <td>
                          <strong>{tableTotals.nb}</strong>
                        </td>
                        <td>
                          <strong>{tableTotals.th}</strong>
                        </td>
                        <td>
                          <strong>{tableTotals.vd}</strong>
                        </td>
                        <td>
                          <strong>{tableTotals.vdc}</strong>
                        </td>
                        <td>
                          <strong>{tableTotals.total}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {matrixId && (
            <ExamMatrixRowModal
              isOpen={rowModalOpen}
              matrixId={matrixId}
              matrixGradeLevel={matrix?.gradeLevel ?? table?.gradeLevel}
              subjectId={matrix?.subjectId ?? table?.subjectId}
              matrixTotalPointsTarget={matrix?.totalPointsTarget}
              onClose={() => {
                setRowModalOpen(false);
              }}
              onSuccess={() => {
                setRowModalOpen(false);
                void refetchTable();
              }}
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
