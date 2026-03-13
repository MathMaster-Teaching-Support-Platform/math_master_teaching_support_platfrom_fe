import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useApproveMatrix,
  useDeleteExamMatrix,
  useGetExamMatrixById,
  useGetTemplateMappings,
  useRemoveTemplateMapping,
  useResetMatrix,
} from '../../hooks/useExamMatrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { examMatrixService } from '../../services/examMatrixService';
import '../../styles/module-refactor.css';
import { MatrixStatus, type MatrixValidationReport, type TemplateMappingResponse } from '../../types/examMatrix';
import { GeneratePreviewModal } from './GeneratePreviewModal';
import { TemplateMappingModal } from './TemplateMappingModal';

const matrixStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

const cognitiveLevelLabel: Record<string, string> = {
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

export default function ExamMatrixDetailPage() {
  const { matrixId } = useParams<{ matrixId: string }>();
  const navigate = useNavigate();

  const [validation, setValidation] = useState<MatrixValidationReport | null>(null);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<TemplateMappingResponse | null>(null);
  const [validating, setValidating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetExamMatrixById(matrixId ?? '', !!matrixId);
  const { data: mappingData, refetch: refetchMappings } = useGetTemplateMappings(matrixId ?? '', !!matrixId);

  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const removeMappingMutation = useRemoveTemplateMapping();

  const matrix = data?.result;
  const mappings = mappingData?.result ?? matrix?.templateMappings ?? [];

  const canEdit = matrix?.status === MatrixStatus.DRAFT;

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

  async function removeMapping(mappingId: string) {
    if (!matrixId) return;
    await removeMappingMutation.mutateAsync({ matrixId, mappingId });
    await refetchMappings();
  }

  async function removeMatrix() {
    if (!matrixId) return;
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices');
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      <section className="module-page">
        <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
          <ArrowLeft size={15} />
          Quay lại danh sách ma trận
        </button>

        {isLoading && <div className="empty">Đang tải chi tiết ma trận...</div>}
        {isError && <div className="empty">{error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}</div>}
        {!isLoading && !isError && !matrix && <div className="empty">Không tìm thấy ma trận.</div>}

        {!isLoading && !isError && matrix && (
          <>
            <article className="hero-card">
              <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <p className="hero-kicker">Chi tiết ma trận đề</p>
                  <h2>{matrix.name}</h2>
                  <p>{matrix.description || 'Không có mô tả'}</p>
                </div>
                <span className={`badge ${matrix.status.toLowerCase()}`}>{matrixStatusLabel[matrix.status] || matrix.status}</span>
              </div>

              <div className="toolbar" style={{ marginTop: 14, border: '0', padding: 0, background: 'transparent' }}>
                <button className="btn secondary" onClick={() => void refetch()}>
                  Làm mới
                </button>
                <button className="btn secondary" onClick={() => void runValidation()} disabled={validating}>
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
              <h3>Ánh xạ mẫu câu hỏi</h3>
              {canEdit && (
                <button className="btn" onClick={() => setMappingOpen(true)}>
                  <Plus size={15} />
                  Thêm ánh xạ
                </button>
              )}
            </div>

            {mappings.length === 0 ? (
              <div className="empty">Ma trận này chưa có ánh xạ mẫu.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mẫu câu hỏi</th>
                      <th>Mức độ</th>
                      <th>Số câu</th>
                      <th>Điểm/câu</th>
                      <th>Tổng điểm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td>{mapping.templateName ?? mapping.templateId}</td>
                        <td>{cognitiveLevelLabel[mapping.cognitiveLevel] || mapping.cognitiveLevel}</td>
                        <td>{mapping.questionCount}</td>
                        <td>{mapping.pointsPerQuestion}</td>
                        <td>{mapping.totalPoints}</td>
                        <td>
                          <div className="row" style={{ justifyContent: 'start' }}>
                            <button className="btn secondary" onClick={() => setPreviewTarget(mapping)}>
                              Xem trước
                            </button>
                            {canEdit && (
                              <button className="btn danger" onClick={() => void removeMapping(mapping.id)}>
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {matrixId && (
          <TemplateMappingModal
            isOpen={mappingOpen}
            matrixId={matrixId}
            onClose={() => setMappingOpen(false)}
            onSuccess={() => {
              setMappingOpen(false);
              void refetchMappings();
            }}
          />
        )}

        {matrixId && previewTarget && (
          <GeneratePreviewModal
            isOpen={!!previewTarget}
            matrixId={matrixId}
            mapping={previewTarget}
            onClose={() => setPreviewTarget(null)}
            onSuccess={() => void refetchMappings()}
          />
        )}
      </section>
    </DashboardLayout>
  );
}
