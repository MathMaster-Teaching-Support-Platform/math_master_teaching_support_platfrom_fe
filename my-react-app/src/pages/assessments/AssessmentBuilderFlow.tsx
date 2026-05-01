import { ArrowRight, CheckCircle2, FileCheck2, Library, Ruler, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import {
  useAssessment,
  useAssessmentQuestions,
  useGenerateAssessmentFromMatrix,
  usePublishAssessment,
  usePublishSummary,
} from '../../hooks/useAssessment';
import { useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import '../../styles/module-refactor.css';
import { MatrixStatus } from '../../types/examMatrix';
import '../courses/TeacherCourses.css';
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

  const matrices = useMemo(() => matrixQuery.data?.result ?? [], [matrixQuery.data]);
  const readyMatrices = useMemo(
    () =>
      matrices.filter(
        (item) => item.status === MatrixStatus.APPROVED || item.status === MatrixStatus.LOCKED
      ),
    [matrices]
  );

  const assessmentQuery = useAssessment(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const questionsQuery = useAssessmentQuestions(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const summaryQuery = usePublishSummary(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });

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
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page assessment-builder-flow-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="header-kicker"></div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Trình tạo đề thi</h2>
              </div>
              <p className="header-sub">
                Không gian điều phối gọn nhẹ để lắp ráp đề từ tài nguyên đã duyệt, rà soát cuối và
                xuất bản.
              </p>
            </div>
          </header>

          <nav className="abf-quicknav">
            <button
              className="abf-quicknav__item"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              <span className="abf-quicknav__icon abf-nav-indigo">
                <Ruler size={14} />
              </span>
              <span className="abf-quicknav__text">
                <span className="abf-quicknav__title">Ma trận đề</span>
                <span className="abf-quicknav__desc">
                  Định nghĩa blueprint và ràng buộc phân bố câu hỏi
                </span>
              </span>
              <ArrowRight size={14} className="abf-quicknav__arrow" />
            </button>
            <span className="abf-quicknav__divider" />
            <button
              className="abf-quicknav__item"
              onClick={() => navigate('/teacher/question-templates')}
            >
              <span className="abf-quicknav__icon abf-nav-violet">
                <Sparkles size={14} />
              </span>
              <span className="abf-quicknav__text">
                <span className="abf-quicknav__title">Mẫu câu hỏi</span>
                <span className="abf-quicknav__desc">Soạn mẫu tái sử dụng và sinh câu hỏi AI</span>
              </span>
              <ArrowRight size={14} className="abf-quicknav__arrow" />
            </button>
            <span className="abf-quicknav__divider" />
            <button
              className="abf-quicknav__item"
              onClick={() => navigate('/teacher/question-banks')}
            >
              <span className="abf-quicknav__icon abf-nav-blue">
                <Library size={14} />
              </span>
              <span className="abf-quicknav__text">
                <span className="abf-quicknav__title">Ngân hàng câu hỏi</span>
                <span className="abf-quicknav__desc">Duyệt, phê duyệt và quản lý kho câu hỏi</span>
              </span>
              <ArrowRight size={14} className="abf-quicknav__arrow" />
            </button>
          </nav>

          <section className="data-card course-card" style={{ minHeight: 0 }}>
            <div style={{ marginBottom: '0.85rem' }}>
              <h3 style={{ margin: '0 0 0.2rem' }}>Quy trình tạo đề 4 bước</h3>
              <p className="muted" style={{ margin: 0 }}>
                Làm theo thứ tự để lên đề hoàn chỉnh, đúng dữ liệu và đúng quy trình.
              </p>
            </div>
            <ol className="abf-step-list">
              <li className="abf-step">
                <span className="abf-step__num">1</span>
                <div className="abf-step__body">
                  <strong className="abf-step__title">Question Template</strong>
                  <p className="abf-step__desc">
                    Tạo mẫu câu hỏi, khai báo biến số, công thức đáp án và kiểm tra preview.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn secondary btn--tint-violet"
                  onClick={() => navigate('/teacher/question-templates')}
                >
                  Mở <ArrowRight size={13} />
                </button>
              </li>
              <li className="abf-step">
                <span className="abf-step__num">2</span>
                <div className="abf-step__body">
                  <strong className="abf-step__title">Question Bank</strong>
                  <p className="abf-step__desc">
                    Sinh câu hỏi từ template, rà soát chất lượng và đưa vào ngân hàng.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn secondary btn--tint-emerald"
                  onClick={() => navigate('/teacher/question-banks')}
                >
                  Mở <ArrowRight size={13} />
                </button>
              </li>
              <li className="abf-step">
                <span className="abf-step__num">3</span>
                <div className="abf-step__body">
                  <strong className="abf-step__title">Exam Matrix</strong>
                  <p className="abf-step__desc">
                    Tạo ma trận đề, phân bố chương/chủ đề, phê duyệt để sẵn sàng tạo đề.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn secondary btn--tint-indigo"
                  onClick={() => navigate('/teacher/exam-matrices')}
                >
                  Mở <ArrowRight size={13} />
                </button>
              </li>
              <li className="abf-step">
                <span className="abf-step__num abf-step__num--active">4</span>
                <div className="abf-step__body">
                  <strong className="abf-step__title">{UI_TEXT.QUIZ}</strong>
                  <p className="abf-step__desc">
                    Chọn ma trận đã duyệt, Generate đề nháp, rà soát cuối và xuất bản.
                  </p>
                </div>
                <span className="badge draft">Bạn đang ở đây</span>
              </li>
            </ol>
          </section>

          <section className="assessment-builder-flow__orchestration-grid">
            <article className="data-card">
              <h3>Bước 1: Lắp ráp đề nháp từ ma trận</h3>
              <p className="muted">
                Chọn ma trận đã duyệt. Hệ thống chỉ chọn câu hỏi từ Question Bank theo rule của ma
                trận.
              </p>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Ma trận đã duyệt
                </p>
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
                Generation Mode: BANK_FIRST (cố định). Không dùng AI trong bước tạo{' '}
                {UI_TEXT.QUIZ.toLowerCase()} từ matrix.
              </p>

              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--feat-indigo"
                  onClick={() => void handleGenerate()}
                  disabled={!selectedMatrixId || generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Đang tạo...' : 'Generate from Matrix'}
                </button>
                <button
                  type="button"
                  className="btn secondary btn--tint-indigo"
                  onClick={() => navigate('/teacher/exam-matrices')}
                >
                  Quản lý ma trận
                </button>
              </div>

              {matrixQuery.isError && (
                <p className="empty">
                  {matrixQuery.error instanceof Error
                    ? matrixQuery.error.message
                    : 'Không thể tải danh sách ma trận.'}
                </p>
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
                    <span
                      className={`badge ${generatedAssessment?.status === 'PUBLISHED' ? 'published' : 'draft'}`}
                    >
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
                        totalQuestionsGenerated:{' '}
                        {generatedAssessment.generationSummary.totalQuestionsGenerated ?? 0}
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

                  {/* BUG FIX #4: Display auto-populated lessons */}
                  {generatedAssessment?.lessons && generatedAssessment.lessons.length > 0 && (
                    <div className="data-card" style={{ minHeight: 0 }}>
                      <h3>Phạm vi bài học</h3>
                      <p className="muted" style={{ marginBottom: 12 }}>
                        Đề này bao gồm {generatedAssessment.lessons.length} bài học (tự động lấy từ
                        ma trận)
                      </p>
                      <div className="lesson-chips">
                        {generatedAssessment.lessons.map((lesson) => (
                          <span key={lesson.lessonId} className="chip">
                            {lesson.chapterName} - {lesson.lessonName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {publishSummary && (
                    <div
                      className={`assessment-builder-flow__publish-summary ${publishSummary.canPublish ? 'ok' : 'warn'}`}
                    >
                      <div className="row">
                        {publishSummary.canPublish ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <FileCheck2 size={16} />
                        )}
                        <strong>
                          {publishSummary.canPublish
                            ? 'Sẵn sàng xuất bản'
                            : 'Cần xử lý trước khi xuất bản'}
                        </strong>
                      </div>
                      {publishSummary.validationMessage && (
                        <p>{publishSummary.validationMessage}</p>
                      )}
                    </div>
                  )}

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn secondary btn--tint-violet"
                      onClick={() => navigate(`/teacher/assessments/${generatedAssessmentId}`)}
                    >
                      Mở chi tiết đề
                    </button>
                    <button
                      type="button"
                      className="btn btn--feat-emerald"
                      onClick={() => void handlePublish()}
                      disabled={
                        !publishSummary?.canPublish ||
                        publishMutation.isPending ||
                        generatedAssessment?.status === 'PUBLISHED'
                      }
                    >
                      {publishButtonLabel}
                    </button>
                  </div>
                </>
              )}
            </article>
          </section>

          {toast && (
            <div
              className={`assessment-builder-flow__toast assessment-builder-flow__toast--${toast.type}`}
            >
              {toast.message}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
