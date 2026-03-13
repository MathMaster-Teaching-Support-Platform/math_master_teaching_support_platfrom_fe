import React, { useState, useEffect } from 'react';
import { useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import { useGetExamMatrixById } from '../../hooks/useExamMatrix';
import { useLessons } from '../../hooks/useLessons';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import { AssessmentService } from '../../services/api/assessment.service';
import type {
    AssessmentMode,
    AssessmentRequest,
    AssessmentResponse,
    AssessmentType,
    AttemptScoringPolicy,
} from '../../types';
import './TeacherAssessments.css';

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssessmentRequest) => Promise<void>;
    initialData?: AssessmentResponse | null;
    mode: 'create' | 'edit';
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}) => {
    const [gradeLevel, setGradeLevel] = useState('Lớp 10');
    const [subject, setSubject] = useState('Đại số');
    const [lessonSearch, setLessonSearch] = useState('');
    const [formData, setFormData] = useState<AssessmentRequest>({
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
    });
    const [modalError, setModalError] = useState<string | null>(null);
    const [compatibilityHint, setCompatibilityHint] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: matrixData } = useGetMyExamMatrices();
    const matrices = matrixData?.result ?? [];
    const { data: selectedMatrixData } = useGetExamMatrixById(formData.examMatrixId, !!formData.examMatrixId && isOpen);
    const { data: lessonsData, isLoading: loadingLessons } = useLessons(gradeLevel, subject, isOpen);
    const lessons = lessonsData?.result ?? [];
    const filteredLessons = lessons.filter((lesson) => {
        if (!lessonSearch.trim()) return true;
        const q = lessonSearch.trim().toLowerCase();
        return (
            (lesson.title || '').toLowerCase().includes(q) ||
            lesson.id.toLowerCase().includes(q)
        );
    });

    const parseGradeLevelFromText = (value?: string): string | null => {
        if (!value) return null;
        const lopMatch = value.match(/L[ớo]p\s*\d+/i);
        if (lopMatch) {
            return lopMatch[0].replace(/\s+/g, ' ').replace(/^l/i, 'L');
        }
        const toanMatch = value.match(/To[aá]n\s*(\d+)/i);
        if (toanMatch?.[1]) {
            return `Lớp ${toanMatch[1]}`;
        }
        return null;
    };

    const parseSubjectFromText = (value?: string): string | null => {
        if (!value) return null;
        if (/to[aá]n/i.test(value)) return 'Đại số';
        return null;
    };

    useEffect(() => {
        if (initialData && mode === 'edit') {
            setFormData({
                title: initialData.title,
                description: initialData.description || '',
                assessmentType: initialData.assessmentType,
                lessonIds: initialData.lessonIds ?? [],
                examMatrixId: initialData.examMatrixId ?? '',
                assessmentMode: initialData.assessmentMode ?? 'MATRIX_BASED',
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
            setModalError(null);
        } else {
            setFormData({
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
            });
            setModalError(null);
        }
    }, [initialData, mode, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        let isCancelled = false;

        const applyContextDefaults = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const queryGrade = urlParams.get('gradeLevel');
            const querySubject = urlParams.get('subject');
            const queryCourse = urlParams.get('course');

            let persistedGrade: string | null = null;
            let persistedSubject: string | null = null;

            const persistedRaw = localStorage.getItem('teacherCourseContext');
            if (persistedRaw) {
                try {
                    const parsed = JSON.parse(persistedRaw) as {
                        gradeLevel?: string;
                        subject?: string;
                        courseName?: string;
                    };
                    persistedGrade =
                        parsed.gradeLevel || parseGradeLevelFromText(parsed.courseName) || null;
                    persistedSubject =
                        parsed.subject || parseSubjectFromText(parsed.courseName) || null;
                } catch {
                    // Ignore malformed context and continue fallback resolution.
                }
            }

            let profileDerivedSubject: string | null = null;
            let profileDerivedGrade: string | null = null;
            try {
                const profile = await TeacherProfileService.getMyProfile();
                const positionText = profile.result?.position;
                profileDerivedSubject = parseSubjectFromText(positionText) || profileDerivedSubject;
                profileDerivedGrade = parseGradeLevelFromText(positionText) || profileDerivedGrade;
            } catch {
                // Keep defaults when profile endpoint fails or is unavailable for role.
            }

            if (isCancelled) return;

            const resolvedGrade =
                queryGrade ||
                parseGradeLevelFromText(queryCourse || undefined) ||
                persistedGrade ||
                profileDerivedGrade ||
                'Lớp 10';

            const resolvedSubject =
                querySubject ||
                parseSubjectFromText(queryCourse || undefined) ||
                persistedSubject ||
                profileDerivedSubject ||
                'Đại số';

            setGradeLevel(resolvedGrade);
            setSubject(resolvedSubject);
        };

        void applyContextDefaults();
        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        localStorage.setItem(
            'teacherCourseContext',
            JSON.stringify({ gradeLevel, subject })
        );
    }, [gradeLevel, subject, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setCompatibilityHint(null);
        if (!formData.examMatrixId) {
            setModalError('Vui lòng chọn ma trận đề trước khi tạo assessment.');
            return;
        }
        if (formData.lessonIds.length === 0) {
            setModalError('Vui lòng chọn ít nhất một bài học.');
            return;
        }

        const lessonIdSet = new Set(lessons.map((lesson) => lesson.id));
        const invalidLesson = formData.lessonIds.find((id) => !lessonIdSet.has(id));
        if (invalidLesson) {
            setModalError('Một số lesson đã chọn không thuộc danh sách tìm thấy theo grade/subject hiện tại.');
            return;
        }

        if ((selectedMatrixData?.result?.templateMappingCount ?? 0) === 0) {
            setModalError('Ma trận đề chưa có template mapping. Vui lòng thêm mapping trước khi gán bài kiểm tra.');
            return;
        }

        try {
            const compatibility = await AssessmentService.checkMatrixLessonCompatibility({
                examMatrixId: formData.examMatrixId,
                lessonIds: formData.lessonIds,
            });
            if (compatibility.supported && !compatibility.compatible) {
                setModalError(
                    compatibility.message ||
                        'Một số lesson không tương thích với ma trận đề đã chọn.'
                );
                return;
            }
            if (!compatibility.supported) {
                setCompatibilityHint(
                    'Backend chưa mở endpoint compatibility check. Đang dùng validation tiêu chuẩn khi submit.'
                );
            }
        } catch (error) {
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Không thể kiểm tra tương thích matrix/lesson trước khi submit.'
            );
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting assessment:', error);
            setModalError(
                error instanceof Error
                    ? error.message
                    : 'Tạo/cập nhật assessment thất bại. Backend sẽ kiểm tra lesson có thuộc ma trận hay không.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleLesson = (lessonId: string) => {
        const selected = new Set(formData.lessonIds);
        if (selected.has(lessonId)) {
            selected.delete(lessonId);
        } else {
            selected.add(lessonId);
        }
        setFormData({ ...formData, lessonIds: Array.from(selected) });
    };

    const removeLesson = (lessonId: string) => {
        setFormData({
            ...formData,
            lessonIds: formData.lessonIds.filter((id) => id !== lessonId),
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {mode === 'create' ? 'Tạo bài kiểm tra mới' : 'Chỉnh sửa bài kiểm tra'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {modalError && (
                            <div style={{ marginBottom: '12px', color: '#b91c1c', fontSize: '0.85rem' }}>
                                {modalError}
                            </div>
                        )}
                        {compatibilityHint && (
                            <div style={{ marginBottom: '12px', color: '#7c2d12', fontSize: '0.8rem' }}>
                                {compatibilityHint}
                            </div>
                        )}
                        <div className="form-group">
                            <label>Tiêu đề *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ví dụ: Kiểm tra 15 phút Đại số"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nhập mô tả bài kiểm tra..."
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Loại *</label>
                                <select
                                    value={formData.assessmentType}
                                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value as AssessmentType })}
                                >
                                    <option value="QUIZ">Trắc nghiệm</option>
                                    <option value="TEST">Kiểm tra</option>
                                    <option value="EXAM">Thi học kỳ</option>
                                    <option value="HOMEWORK">Bài tập về nhà</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assessment mode *</label>
                                <select
                                    value={formData.assessmentMode}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assessmentMode: e.target.value as AssessmentMode,
                                        })
                                    }
                                >
                                    <option value="DIRECT">DIRECT</option>
                                    <option value="MATRIX_BASED">MATRIX_BASED</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Thời gian (phút) *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={formData.timeLimitMinutes}
                                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Exam Matrix *</label>
                            <select
                                required
                                value={formData.examMatrixId}
                                onChange={(e) =>
                                    setFormData({ ...formData, examMatrixId: e.target.value })
                                }
                            >
                                <option value="">-- Chọn ma trận đề --</option>
                                {matrices.map((matrix) => (
                                    <option key={matrix.id} value={matrix.id}>
                                        {matrix.name} ({matrix.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Lesson picker *</label>
                            <div className="form-row" style={{ marginBottom: '8px' }}>
                                <div className="form-group">
                                    <label>Khối lớp</label>
                                    <input
                                        value={gradeLevel}
                                        onChange={(e) => setGradeLevel(e.target.value)}
                                        placeholder="Ví dụ: Lớp 10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Môn học</label>
                                    <input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Ví dụ: Đại số"
                                    />
                                </div>
                            </div>
                            {!!formData.lessonIds.length && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    {formData.lessonIds.map((lessonId) => {
                                        const lessonName = lessons.find((item) => item.id === lessonId)?.title;
                                        return (
                                            <span
                                                key={lessonId}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 8px',
                                                    background: '#eef2ff',
                                                    color: '#3730a3',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                }}
                                            >
                                                {lessonName || lessonId}
                                                <button
                                                    type="button"
                                                    onClick={() => removeLesson(lessonId)}
                                                    style={{ border: 'none', background: 'transparent', color: '#4338ca', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    aria-label={`remove-${lessonId}`}
                                                >
                                                    x
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            <input
                                type="text"
                                value={lessonSearch}
                                onChange={(e) => setLessonSearch(e.target.value)}
                                placeholder="Tìm lesson theo tên hoặc UUID"
                                style={{ marginBottom: '8px' }}
                            />
                            <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', maxHeight: '170px', overflowY: 'auto', padding: '10px' }}>
                                {loadingLessons ? (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Đang tải danh sách bài học...</p>
                                ) : filteredLessons.length === 0 ? (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Không có lesson phù hợp với grade/subject hiện tại.</p>
                                ) : (
                                    filteredLessons.map((lesson) => (
                                        <label key={lesson.id} style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.lessonIds.includes(lesson.id)}
                                                onChange={() => toggleLesson(lesson.id)}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {lesson.title || lesson.id}
                                        </label>
                                    ))
                                )}
                            </div>
                            <p style={{ marginTop: '6px', marginBottom: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                                Đã chọn {formData.lessonIds.length} lesson. Backend sẽ kiểm tra lesson có thuộc matrix khi submit.
                            </p>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Điểm đạt (%) *</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    max={100}
                                    value={formData.passingScore}
                                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Attempt scoring policy</label>
                                <select
                                    value={formData.attemptScoringPolicy}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            attemptScoringPolicy: e.target
                                                .value as AttemptScoringPolicy,
                                        })
                                    }
                                >
                                    <option value="BEST">BEST</option>
                                    <option value="LATEST">LATEST</option>
                                    <option value="AVERAGE">AVERAGE</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Bắt đầu (tùy chọn)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.startDate ? formData.startDate.slice(0, 16) : ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            startDate: e.target.value
                                                ? new Date(e.target.value).toISOString()
                                                : undefined,
                                        })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Kết thúc (tùy chọn)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.endDate ? formData.endDate.slice(0, 16) : ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            endDate: e.target.value
                                                ? new Date(e.target.value).toISOString()
                                                : undefined,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!formData.randomizeQuestions}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            randomizeQuestions: e.target.checked,
                                        })
                                    }
                                />{' '}
                                Randomize questions
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!formData.allowMultipleAttempts}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            allowMultipleAttempts: e.target.checked,
                                        })
                                    }
                                />{' '}
                                Allow multiple attempts
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssessmentModal;
