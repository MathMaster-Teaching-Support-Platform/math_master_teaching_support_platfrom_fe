import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGetExamMatrixById, useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import { useLessonsByChapter } from '../../hooks/useLessons';
import { useSubjects } from '../../hooks/useSubjects';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { AssessmentService } from '../../services/api/assessment.service';
import { LessonService } from '../../services/api/lesson.service';
import type {
  AssessmentMode,
  AssessmentRequest,
  AssessmentResponse,
  AssessmentType,
  AttemptScoringPolicy,
  LessonResponse,
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
  lessonIds: [],
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
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [formData, setFormData] = useState<AssessmentRequest>(defaultForm);
  const [persistedLessons, setPersistedLessons] = useState<LessonResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityHint, setCompatibilityHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: matrixData } = useGetMyExamMatrices();
  const { data: selectedMatrixData } = useGetExamMatrixById(formData.examMatrixId, !!formData.examMatrixId && isOpen);
  const { data: subjectsData } = useSubjects();
  const { data: chaptersData } = useChaptersBySubject(selectedSubjectId, !!selectedSubjectId && isOpen);
  const { data: lessonsData, isLoading: loadingLessons } = useLessonsByChapter(
    selectedChapterId,
    lessonSearch,
    !!selectedChapterId && isOpen
  );

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        assessmentType: initialData.assessmentType,
        lessonIds: initialData.lessonIds || [],
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

    setLessonSearch('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setError(null);
    setCompatibilityHint(null);
    setSaving(false);
  }, [isOpen, mode, initialData]);

  const matrices = matrixData?.result ?? [];
  const subjects = subjectsData?.result ?? [];
  const chapters = chaptersData?.result ?? [];
  const lessons = lessonsData?.result ?? [];
  const lessonMap = useMemo(() => {
    const map = new Map<string, LessonResponse>();
    lessons.forEach((lesson) => map.set(lesson.id, lesson));
    persistedLessons.forEach((lesson) => map.set(lesson.id, lesson));
    return map;
  }, [lessons, persistedLessons]);
  const mergedLessons = useMemo(() => Array.from(lessonMap.values()), [lessonMap]);

  useEffect(() => {
    if (!isOpen || mode !== 'edit') {
      setPersistedLessons([]);
      return;
    }

    const lessonIds = initialData?.lessonIds ?? [];
    if (lessonIds.length === 0) {
      setPersistedLessons([]);
      return;
    }

    let cancelled = false;
    Promise.all(
      lessonIds.map(async (lessonId) => {
        try {
          const response = await LessonService.getLessonById(lessonId);
          return response.result;
        } catch {
          return undefined;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setPersistedLessons(results.filter((lesson): lesson is LessonResponse => !!lesson));
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, initialData?.lessonIds]);

  const filteredLessons = useMemo(() => mergedLessons, [mergedLessons]);

  let submitLabel = 'Cập nhật bài kiểm tra';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo bài kiểm tra';

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);
    setCompatibilityHint(null);

    if (!formData.examMatrixId) {
      setError('Vui lòng chọn ma trận đề trước.');
      return;
    }

    if (mode === 'create' && formData.lessonIds.length === 0) {
      setError('Vui lòng chọn ít nhất một bài học.');
      return;
    }

    const availableLessonIds = new Set(mergedLessons.map((item) => item.id));
    const invalidLesson = formData.lessonIds.find((id) => !availableLessonIds.has(id));
    if (formData.lessonIds.length > 0 && invalidLesson) {
      setError('Có bài học đã chọn không nằm trong danh sách hiện tại.');
      return;
    }

    const matrixRowCount = selectedMatrixData?.result?.rowCount ?? selectedMatrixData?.result?.templateMappingCount ?? 0;
    if (matrixRowCount === 0) {
      setError('Ma trận đã chọn chưa có dòng blueprint câu hỏi.');
      return;
    }

    if (formData.lessonIds.length > 0) {
      try {
        const compatibility = await AssessmentService.checkMatrixLessonCompatibility({
          examMatrixId: formData.examMatrixId,
          lessonIds: formData.lessonIds,
        });

        if (compatibility.supported && !compatibility.compatible) {
          setError(compatibility.message || 'Danh sách bài học không tương thích với ma trận đã chọn.');
          return;
        }

        if (!compatibility.supported) {
          setCompatibilityHint('Backend chưa hỗ trợ endpoint kiểm tra tương thích, hệ thống sẽ kiểm tra theo cách mặc định.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể kiểm tra tương thích giữa ma trận và bài học.');
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu bài kiểm tra.');
    } finally {
      setSaving(false);
    }
  }

  function toggleLesson(lessonId: string) {
    const selected = new Set(formData.lessonIds);
    if (selected.has(lessonId)) selected.delete(lessonId);
    else selected.add(lessonId);
    setFormData({ ...formData, lessonIds: Array.from(selected) });
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? 'Tạo bài kiểm tra' : 'Chỉnh sửa bài kiểm tra'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>Cấu hình bài kiểm tra theo ma trận đề.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}
            {compatibilityHint && <p style={{ color: '#9a4a00', fontSize: 13 }}>{compatibilityHint}</p>}

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
                <p className="muted" style={{ marginBottom: 6 }}>Loại bài kiểm tra</p>
                <select
                  className="select"
                  value={formData.assessmentType}
                  onChange={(event) => setFormData({ ...formData, assessmentType: event.target.value as AssessmentType })}
                >
                  <option value="QUIZ">Trắc nghiệm nhanh</option>
                  <option value="TEST">Bài kiểm tra</option>
                  <option value="EXAM">Bài thi</option>
                  <option value="HOMEWORK">Bài tập về nhà</option>
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Chế độ tạo đề</p>
                <select
                  className="select"
                  value={formData.assessmentMode}
                  onChange={(event) => setFormData({ ...formData, assessmentMode: event.target.value as AssessmentMode })}
                >
                  <option value="DIRECT">Trực tiếp</option>
                  <option value="MATRIX_BASED">Theo ma trận đề</option>
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Ma trận đề</p>
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

            <section className="data-card" style={{ minHeight: 0 }}>
              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Môn học</p>
                  <select
                    className="select"
                    value={selectedSubjectId}
                    onChange={(event) => {
                      setSelectedSubjectId(event.target.value);
                      setSelectedChapterId('');
                    }}
                  >
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Chapter</p>
                  <select
                    className="select"
                    value={selectedChapterId}
                    onChange={(event) => setSelectedChapterId(event.target.value)}
                  >
                    <option value="">Chọn chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title || chapter.name || chapter.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tìm bài học</p>
                <input className="input" value={lessonSearch} onChange={(event) => setLessonSearch(event.target.value)} />
              </label>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Chọn</th>
                      <th>Bài học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLessons && (
                      <tr>
                        <td colSpan={2}>Đang tải bài học...</td>
                      </tr>
                    )}
                    {!loadingLessons && filteredLessons.length === 0 && (
                      <tr>
                        <td colSpan={2}>Không tìm thấy bài học phù hợp.</td>
                      </tr>
                    )}
                    {!loadingLessons && filteredLessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={formData.lessonIds.includes(lesson.id)}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                        </td>
                        <td>{lesson.title || lesson.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

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
