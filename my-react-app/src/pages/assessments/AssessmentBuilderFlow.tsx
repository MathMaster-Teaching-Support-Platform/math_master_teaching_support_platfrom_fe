import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileCheck2, Library, Ruler, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useAssessment,
  useAssessmentQuestions,
  useGenerateAssessmentFromMatrix,
  usePublishAssessment,
  usePublishSummary,
} from '../../hooks/useAssessment';
import { useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import { MatrixStatus } from '../../types/examMatrix';
import '../../styles/module-refactor.css';
import './assessment-builder-flow.css';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

export default function AssessmentBuilderFlow() {
  const navigate = useNavigate();
  const [selectedMatrixId, setSelectedMatrixId] = useState('');
  const [generatedAssessmentId, setGeneratedAssessmentId] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const matrixQuery = useGetMyExamMatrices();
  const generateMutation = useGenerateAssessmentFromMatrix();
  const publishMutation = usePublishAssessment();

  const matrices = matrixQuery.data?.result ?? [];
  const readyMatrices = useMemo(
    () => matrices.filter((item) => item.status === MatrixStatus.APPROVED || item.status === MatrixStatus.LOCKED),
    [matrices]
  );

  const assessmentQuery = useAssessment(generatedAssessmentId, { enabled: !!generatedAssessmentId });
  const questionsQuery = useAssessmentQuestions(generatedAssessmentId, { enabled: !!generatedAssessmentId });
  const summaryQuery = usePublishSummary(generatedAssessmentId, { enabled: !!generatedAssessmentId });

  const generatedAssessment = assessmentQuery.data?.result;
  const generatedQuestions = questionsQuery.data?.result ?? [];
  const publishSummary = summaryQuery.data?.result;
  let publishButtonLabel = 'Xuất bản đề';
  if (publishMutation.isPending) publishButtonLabel = 'Đang xuất bản...';
  else if (generatedAssessment?.status === 'PUBLISHED') publishButtonLabel = 'Đã xuất bản';

  async function handleGenerate() {
    if (!selectedMatrixId || generateMutation.isPending) return;

    try {
      const response = await generateMutation.mutateAsync({
        examMatrixId: selectedMatrixId,
        selectionStrategy: 'BANK_FIRST',
        reuseApprovedQuestions: true,
      });
      const createdId = response.result.id;
      setGeneratedAssessmentId(createdId);
      setToast({
        type: 'success',
        message: 'Đã tạo đề nháp thành công. Tiếp tục bước rà soát cuối và xuất bản.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đề nháp.';
      const normalized = message.toUpperCase();
      setToast({
        type: 'error',
        message:
          normalized.includes('INSUFFICIENT_QUESTIONS_AVAILABLE') ||
          normalized.includes('INSUFFICIENT QUESTIONS')
            ? 'Không đủ câu hỏi trong ngân hàng theo cấu trúc đề. Vui lòng bổ sung thêm câu hỏi.'
            : message,
      });
    }
  }

  async function handlePublish() {
    if (!generatedAssessmentId || publishMutation.isPending) return;

    try {
      await publishMutation.mutateAsync(generatedAssessmentId);
      setToast({ type: 'success', message: 'Đã xuất bản đề thành công.' });
      void assessmentQuery.refetch();
      void summaryQuery.refetch();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xuất bản đề.',
      });
    }
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <h2>Trình tạo đề thi</h2>
              <p>
                Không gian điều phối gọn nhẹ để lắp ráp đề từ tài nguyên đã duyệt, rà soát cuối và xuất bản.
              </p>
            </div>
          </header>

          <section className="hero-card assessment-builder-flow__orchestration-card">
            <p className="hero-kicker">Phân tách trách nhiệm</p>
            <h2>Xây đề từ các module chuyên biệt, không gom tất cả vào một trang</h2>
            <div className="assessment-builder-flow__routing-grid">
              <article className="assessment-builder-flow__route-item">
                <div className="assessment-builder-flow__route-icon"><Ruler size={16} /></div>
                <div>
                  <strong>Ma trận đề</strong>
                  <p>Định nghĩa blueprint, cấu trúc và ràng buộc phân bố câu hỏi.</p>
                </div>
                <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
                  Mở trang <ArrowRight size={14} />
                </button>
              </article>

              <article className="assessment-builder-flow__route-item">
                <div className="assessment-builder-flow__route-icon"><Sparkles size={16} /></div>
                <div>
                  <strong>Mẫu câu hỏi</strong>
                  <p>Soạn mẫu tái sử dụng và chạy sinh câu hỏi có hỗ trợ AI.</p>
                </div>
                <button className="btn secondary" onClick={() => navigate('/teacher/question-templates')}>
                  Mở trang <ArrowRight size={14} />
                </button>
              </article>

              <article className="assessment-builder-flow__route-item">
                <div className="assessment-builder-flow__route-icon"><Library size={16} /></div>
                <div>
                  <strong>Ngân hàng câu hỏi</strong>
                  <p>Chỉnh sửa, duyệt, phê duyệt và quản lý kho câu hỏi dùng lại.</p>
                </div>
                <button className="btn secondary" onClick={() => navigate('/teacher/question-banks')}>
                  Mở trang <ArrowRight size={14} />
                </button>
              </article>
            </div>
          </section>

          <section className="assessment-builder-flow__orchestration-grid">
            <article className="data-card">
              <h3>Bước 1: Lắp ráp đề nháp từ ma trận</h3>
              <p className="muted">
                Chọn ma trận đã duyệt. Hệ thống chỉ chọn câu hỏi từ Question Bank theo rule của ma trận.
              </p>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Ma trận đã duyệt</p>
                <select
                  className="select"
                  value={selectedMatrixId}
                  onChange={(event) => setSelectedMatrixId(event.target.value)}
                  disabled={matrixQuery.isLoading}
                >
                  <option value="">Chọn ma trận</option>
                  {readyMatrices.map((matrix) => (
                    <option key={matrix.id} value={matrix.id}>
                      {matrix.name}
                    </option>
                  ))}
                </select>
              </label>

              <p className="muted" style={{ marginTop: 8 }}>
                Generation Mode: BANK_FIRST (cố định). Không dùng AI trong bước tạo assessment từ matrix.
              </p>

              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => void handleGenerate()} disabled={!selectedMatrixId || generateMutation.isPending}>
                  {generateMutation.isPending ? 'Đang tạo...' : 'Generate from Matrix'}
                </button>
                <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
                  Quản lý ma trận
                </button>
              </div>

              {matrixQuery.isError && (
                <p className="empty">{matrixQuery.error instanceof Error ? matrixQuery.error.message : 'Không thể tải danh sách ma trận.'}</p>
              )}
            </article>

            <article className="data-card">
              <h3>Bước 2: Rà soát cuối và xuất bản</h3>
              {!generatedAssessmentId && (
                <p className="empty">Hãy tạo đề nháp trước để bật bước rà soát cuối.</p>
              )}

              {generatedAssessmentId && (
                <>
                  <div className="assessment-builder-flow__review-meta">
                    <span className={`badge ${generatedAssessment?.status === 'PUBLISHED' ? 'published' : 'draft'}`}>
                      {generatedAssessment?.status || 'DRAFT'}
                    </span>
                    <span className="muted">Mã đề: {generatedAssessmentId}</span>
                  </div>

                  <div className="assessment-builder-flow__review-stats">
                    <div className="stat-card">
                      <p>Tổng số câu hỏi</p>
                      <h3>{generatedQuestions.length}</h3>
                    </div>
                    <div className="stat-card">
                      <p>Tổng điểm</p>
                      <h3>{generatedAssessment?.totalPoints ?? 0}</h3>
                    </div>
                  </div>

                  {generatedAssessment?.generationSummary && (
                    <div className="data-card" style={{ minHeight: 0 }}>
                      <h3>Kết quả Generate from Matrix</h3>
                      <p className="muted">
                        totalQuestionsGenerated: {generatedAssessment.generationSummary.totalQuestionsGenerated ?? 0}
                      </p>
                      {(generatedAssessment.generationSummary.warnings || []).length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {(generatedAssessment.generationSummary.warnings || []).map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {publishSummary && (
                    <div className={`assessment-builder-flow__publish-summary ${publishSummary.canPublish ? 'ok' : 'warn'}`}>
                      <div className="row">
                        {publishSummary.canPublish ? <CheckCircle2 size={16} /> : <FileCheck2 size={16} />}
                        <strong>{publishSummary.canPublish ? 'Sẵn sàng xuất bản' : 'Cần xử lý trước khi xuất bản'}</strong>
                      </div>
                      {publishSummary.validationMessage && <p>{publishSummary.validationMessage}</p>}
                    </div>
                  )}

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button className="btn secondary" onClick={() => navigate(`/teacher/assessments/${generatedAssessmentId}`)}>
                      Mở chi tiết đề
                    </button>
                    <button
                      className="btn"
                      onClick={() => void handlePublish()}
                      disabled={!publishSummary?.canPublish || publishMutation.isPending || generatedAssessment?.status === 'PUBLISHED'}
                    >
                      {publishButtonLabel}
                    </button>
                  </div>
                </>
              )}
            </article>
          </section>

          {toast && (
            <div className={`assessment-builder-flow__toast assessment-builder-flow__toast--${toast.type}`}>
              {toast.message}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
