import { X } from 'lucide-react';
import { UI_TEXT } from '../../constants/uiText';
import { useEffect, useState } from 'react';
import { useGetExamMatrixById, useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import type {
  AssessmentMode,
  AssessmentRequest,
  AssessmentResponse,
  AssessmentType,
  AttemptScoringPolicy,
} from '../../types';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: AssessmentResponse | null;
  onClose: () => void;
  onSubmit: (data: AssessmentRequest) => Promise<void>;
};

const defaultForm: AssessmentRequest = {
  title: '',
  description: '',
  assessmentType: 'QUIZ',
  // lessonIds removed - auto-populated from matrix
  examMatrixId: '',
  assessmentMode: 'MATRIX_BASED',
  timeLimitMinutes: 45,
  passingScore: 50,
  randomizeQuestions: false,
  showCorrectAnswers: false,
  allowMultipleAttempts: false,
  maxAttempts: 1,
  attemptScoringPolicy: 'BEST',
  showScoreImmediately: true,
};

export default function AssessmentModal({ isOpen, mode, initialData, onClose, onSubmit }: Readonly<Props>) {
  const [formData, setFormData] = useState<AssessmentRequest>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: matrixData } = useGetMyExamMatrices();
  useGetExamMatrixById(formData.examMatrixId, !!formData.examMatrixId && isOpen);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        assessmentType: initialData.assessmentType,
        // lessonIds removed - auto-populated from matrix
        examMatrixId: initialData.examMatrixId || '',
        assessmentMode: initialData.assessmentMode || 'MATRIX_BASED',
        timeLimitMinutes: initialData.timeLimitMinutes,
        passingScore: initialData.passingScore,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        randomizeQuestions: initialData.randomizeQuestions,
        showCorrectAnswers: initialData.showCorrectAnswers,
        allowMultipleAttempts: initialData.allowMultipleAttempts,
        maxAttempts: initialData.maxAttempts,
        attemptScoringPolicy: initialData.attemptScoringPolicy,
        showScoreImmediately: initialData.showScoreImmediately,
      });
    } else {
      setFormData(defaultForm);
    }

    setError(null);
    setSaving(false);
  }, [isOpen, mode, initialData]);

  const matrices = matrixData?.result ?? [];

  // Determine if fields should be read-only based on matrix mode
  // Use examMatrixId as indicator - more reliable than assessmentMode
  const isEditingMatrixAssessment = mode === 'edit' && !!formData.examMatrixId;

  let submitLabel = `Cập nhật ${UI_TEXT.QUIZ.toLowerCase()}`;
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = `Tạo ${UI_TEXT.QUIZ.toLowerCase()}`;

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!formData.examMatrixId) {
      setError('Vui lòng chọn ma trận đề trước.');
      return;
    }

    // Lessons are auto-populated from matrix - no validation needed

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Không thể lưu ${UI_TEXT.QUIZ.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? `Tạo ${UI_TEXT.QUIZ.toLowerCase()}` : `Chỉnh sửa ${UI_TEXT.QUIZ.toLowerCase()}`}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {isEditingMatrixAssessment 
                ? `${UI_TEXT.QUIZ} này được tạo từ ma trận đề. Một số trường không thể chỉnh sửa.`
                : `Cấu hình ${UI_TEXT.QUIZ.toLowerCase()} theo ma trận đề.`}
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
                <p className="muted" style={{ marginBottom: 6 }}>Tiêu đề</p>
                <input
                  className="input"
                  required
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Loại {UI_TEXT.QUIZ.toLowerCase()}</p>
                {isEditingMatrixAssessment ? (
                  <div className="input-readonly">
                    {formData.assessmentType === 'QUIZ' && 'Trắc nghiệm nhanh'}
                    {formData.assessmentType === 'TEST' && UI_TEXT.QUIZ}
                    {formData.assessmentType === 'EXAM' && 'Bài thi'}
                    {formData.assessmentType === 'HOMEWORK' && 'Bài tập về nhà'}
                  </div>
                ) : (
                  <select
                    className="select"
                    value={formData.assessmentType}
                    onChange={(event) => setFormData({ ...formData, assessmentType: event.target.value as AssessmentType })}
                  >
                    <option value="QUIZ">Trắc nghiệm nhanh</option>
                    <option value="TEST">{UI_TEXT.QUIZ}</option>
                    <option value="EXAM">Bài thi</option>
                    <option value="HOMEWORK">Bài tập về nhà</option>
                  </select>
                )}
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Chế độ tạo đề</p>
                {isEditingMatrixAssessment ? (
                  <div className="input-readonly">
                    Theo ma trận đề
                  </div>
                ) : (
                  <select
                    className="select"
                    value={formData.assessmentMode}
                    onChange={(event) => setFormData({ ...formData, assessmentMode: event.target.value as AssessmentMode })}
                  >
                    <option value="DIRECT">Trực tiếp</option>
                    <option value="MATRIX_BASED">Theo ma trận đề</option>
                  </select>
                )}
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Ma trận đề</p>
                {isEditingMatrixAssessment ? (
                  <div className="input-readonly">
                    {matrices.find(m => m.id === formData.examMatrixId)?.name || formData.examMatrixId} (APPROVED)
                  </div>
                ) : (
                  <select
                    className="select"
                    value={formData.examMatrixId}
                    onChange={(event) => setFormData({ ...formData, examMatrixId: event.target.value })}
                  >
                    <option value="">Chọn ma trận</option>
                    {matrices.map((matrix) => (
                      <option key={matrix.id} value={matrix.id}>{matrix.name} ({matrix.status})</option>
                    ))}
                  </select>
                )}
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
              <textarea
                className="textarea"
                rows={2}
                value={formData.description || ''}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />
            </label>

            {/* Display subject and grade summary only (no lesson details) */}
            {mode === 'edit' && initialData?.lessons && initialData.lessons.length > 0 && (
              <section className="data-card" style={{ minHeight: 0, marginTop: 12 }}>
                <p className="muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                  Phạm vi bài học (tự động từ ma trận)
                </p>
                
                {/* Subject & Grade Summary Only */}
                {(() => {
                  const subjects = [...new Set(initialData.lessons.map(l => l.subjectName).filter(Boolean))];
                  const grades = [...new Set(initialData.lessons.map(l => l.gradeLevel).filter(Boolean))].sort((a, b) => (a ?? 0) - (b ?? 0));
                  
                  return (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: '12px 16px', 
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                      borderRadius: 12, 
                      border: '1px solid #bae6fd',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14 }}>
                        {subjects.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              fontWeight: 600, 
                              color: '#0369a1',
                              fontSize: 14
                            }}>
                              Môn học:
                            </span>
                            <span style={{ 
                              color: '#1e40af', 
                              fontWeight: 500,
                              padding: '2px 8px',
                              background: '#dbeafe',
                              borderRadius: 6,
                              fontSize: 13
                            }}>
                              {subjects.join(', ')}
                            </span>
                          </div>
                        )}
                        {grades.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              fontWeight: 600, 
                              color: '#0369a1',
                              fontSize: 14
                            }}>
                              Khối lớp:
                            </span>
                            <span style={{ 
                              color: '#92400e', 
                              fontWeight: 500,
                              padding: '2px 8px',
                              background: '#fef3c7',
                              borderRadius: 6,
                              fontSize: 13
                            }}>
                              {grades.map(g => `Lớp ${g}`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <p className="muted" style={{ marginBottom: 0, fontSize: 13 }}>
                  Đề này kiểm tra {initialData.lessons.length} bài học được lấy tự động từ ma trận đề.
                </p>
              </section>
            )}

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Thời gian làm bài (phút)</p>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={formData.timeLimitMinutes || 1}
                  onChange={(event) => setFormData({ ...formData, timeLimitMinutes: Number(event.target.value) })}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Điểm đạt (%)</p>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passingScore || 0}
                  onChange={(event) => setFormData({ ...formData, passingScore: Number(event.target.value) })}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Số lần làm tối đa</p>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={formData.maxAttempts || 1}
                  onChange={(event) => setFormData({ ...formData, maxAttempts: Number(event.target.value) })}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Chính sách chấm điểm</p>
                <select
                  className="select"
                  value={formData.attemptScoringPolicy || 'BEST'}
                  onChange={(event) => setFormData({ ...formData, attemptScoringPolicy: event.target.value as AttemptScoringPolicy })}
                >
                  <option value="BEST">Lần tốt nhất</option>
                  <option value="LATEST">Lần gần nhất</option>
                  <option value="AVERAGE">Điểm trung bình</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label className="row" style={{ justifyContent: 'start' }}>
                <input
                  type="checkbox"
                  checked={formData.randomizeQuestions || false}
                  onChange={(event) => setFormData({ ...formData, randomizeQuestions: event.target.checked })}
                />{' '}
                Trộn thứ tự câu hỏi
              </label>

              <label className="row" style={{ justifyContent: 'start' }}>
                <input
                  type="checkbox"
                  checked={formData.showCorrectAnswers || false}
                  onChange={(event) => setFormData({ ...formData, showCorrectAnswers: event.target.checked })}
                />{' '}
                Hiển thị đáp án đúng
              </label>

              <label className="row" style={{ justifyContent: 'start' }}>
                <input
                  type="checkbox"
                  checked={formData.allowMultipleAttempts || false}
                  onChange={(event) => setFormData({ ...formData, allowMultipleAttempts: event.target.checked })}
                />{' '}
                Cho phép làm nhiều lần
              </label>

              <label className="row" style={{ justifyContent: 'start' }}>
                <input
                  type="checkbox"
                  checked={formData.showScoreImmediately || false}
                  onChange={(event) => setFormData({ ...formData, showScoreImmediately: event.target.checked })}
                />{' '}
                Hiển thị điểm ngay sau khi nộp
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
