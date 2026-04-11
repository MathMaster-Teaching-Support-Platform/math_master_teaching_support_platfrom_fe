import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useApproveMatrix,
  useDeleteExamMatrix,
  useGetExamMatrixById,
  useGetExamMatrixTable,
  useRemoveExamMatrixRow,
  useResetMatrix,
} from '../../hooks/useExamMatrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
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
  if (level === 'NB') return distribution.NB ?? distribution.NHAN_BIET ?? distribution.REMEMBER ?? 0;
  if (level === 'TH') return distribution.TH ?? distribution.THONG_HIEU ?? distribution.UNDERSTAND ?? 0;
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
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
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
    !!matrixId,
  );
  const { data: tableData, refetch: refetchTable } = useGetExamMatrixTable(
    matrixId ?? '',
    !!matrixId,
  );

  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const removeRowMutation = useRemoveExamMatrixRow();

  const matrix = data?.result;
  const table = tableData?.result;
  const chapters = table?.chapters ?? [];

  const tableRows = useMemo(() => {
    return chapters.flatMap((chapter) =>
      chapter.rows.map((row) => ({
        ...row,
        chapterName: row.chapterName || row.chapter_name || chapter.chapterName || 'N/A',
      })),
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
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices');
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

          {isLoading && <div className="empty">Đang tải chi tiết ma trận...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}
            </div>
          )}
          {!isLoading && !isError && !matrix && <div className="empty">Không tìm thấy ma trận.</div>}

          {!isLoading && !isError && matrix && (
            <>
              <article className="hero-card">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="hero-kicker">Blueprint đề kiểm tra</p>
                    <h2>{matrix.name}</h2>
                    <p>{matrix.description || 'Không có mô tả'}</p>
                    <p className="muted" style={{ marginTop: 8 }}>
                      Khối: <strong>{matrix.gradeLevel || table?.gradeLevel || 'N/A'}</strong> | Môn:{' '}
                      <strong>{matrix.subjectName || table?.subjectName || 'N/A'}</strong>
                    </p>
                  </div>
                  <span className={`badge ${matrix.status.toLowerCase()}`}>
                    {matrixStatusLabel[matrix.status] || matrix.status}
                  </span>
                </div>

                <div
                  className="toolbar"
                  style={{ marginTop: 14, border: '0', padding: 0, background: 'transparent' }}
                >
                  <button
                    className="btn secondary"
                    onClick={() => void refreshMatrix()}
                    disabled={refreshing}
                  >
                    {refreshing ? 'Đang làm mới...' : 'Làm mới ma trận'}
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
                    <button className="btn" onClick={() => approveMutation.mutate(matrix.id)}>
                      <CheckCircle2 size={15} />
                      Phê duyệt
                    </button>
                  )}
                  {matrix.status === MatrixStatus.APPROVED && (
                    <button className="btn warn" onClick={() => resetMutation.mutate(matrix.id)}>
                      <RotateCcw size={15} />
                      Đặt lại
                    </button>
                  )}
                  {matrix.status !== MatrixStatus.LOCKED && (
                    <button className="btn danger" onClick={() => void removeMatrix()}>
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  )}
                </div>
              </article>

              {validation && (
                <article className="data-card" style={{ minHeight: 0 }}>
                  <div className="row" style={{ alignItems: 'start' }}>
                    <h3>Báo cáo kiểm tra</h3>
                    <span className={`badge ${validation.canApprove ? 'approved' : 'closed'}`}>
                      {validation.canApprove ? 'Sẵn sàng' : 'Cần xử lý'}
                    </span>
                  </div>
                  <p className="muted">
                    Lỗi: {validation.errors.length} | Cảnh báo: {validation.warnings.length}
                  </p>
                  {validation.errors.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {validation.errors.map((item) => (
                        <li key={item} className="muted" style={{ color: '#9f1239' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )}

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>Bảng ma trận đề</h3>
                {canEdit && (
                  <button className="btn" onClick={() => setRowModalOpen(true)}>
                    <Plus size={15} />
                    Thêm dòng
                  </button>
                )}
              </div>

              {tableRows.length === 0 ? (
                <div className="empty">Ma trận chưa có dòng nào. Hãy thêm dòng từ ngân hàng câu hỏi.</div>
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
                        <th className="matrix-level-header matrix-level-header--nb" title="questions will be randomly selected from Question Bank">NB</th>
                        <th className="matrix-level-header matrix-level-header--th" title="questions will be randomly selected from Question Bank">TH</th>
                        <th className="matrix-level-header matrix-level-header--vd" title="questions will be randomly selected from Question Bank">VD</th>
                        <th className="matrix-level-header matrix-level-header--vdc" title="questions will be randomly selected from Question Bank">VDC</th>
                        <th>Tổng dạng bài</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.rowId}>
                          <td>{pickDisplayValue(row.schoolGradeName, row.school_grade_name, row.gradeLevel, row.grade_level, row.schoolGrade, row.school_grade, matrix?.gradeLevel, table?.gradeLevel)}</td>
                          <td>{pickDisplayValue(row.subjectName, row.subject_name, row.subject, matrix?.subjectName, table?.subjectName)}</td>
                          <td>{pickDisplayValue(row.chapterName, row.chapter_name, row.chapter)}</td>
                          <td>
                            <div>{row.questionBankName || row.questionBankId || '-'}</div>
                            {canEdit && (
                              <button className="btn danger" style={{ marginTop: 6 }} onClick={() => void removeRow(row.rowId)}>
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
                                className={isEmpty ? 'matrix-cell matrix-cell--empty' : 'matrix-cell'}
                              >
                                <strong>{cell.questionCount || 0}</strong>
                              </td>
                            );
                          })}
                          <td><strong>{row.rowTotalQuestions}</strong></td>
                        </tr>
                      ))}

                      <tr className="matrix-grand-total-row">
                        <td colSpan={5}><strong>Tổng</strong></td>
                        <td><strong>{tableTotals.nb}</strong></td>
                        <td><strong>{tableTotals.th}</strong></td>
                        <td><strong>{tableTotals.vd}</strong></td>
                        <td><strong>{tableTotals.vdc}</strong></td>
                        <td><strong>{tableTotals.total}</strong></td>
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
