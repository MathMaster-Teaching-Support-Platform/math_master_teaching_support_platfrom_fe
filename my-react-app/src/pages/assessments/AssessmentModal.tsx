import React, { useState, useEffect } from 'react';
import type { AssessmentRequest, AssessmentResponse, AssessmentType } from '../../types';
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
    const [formData, setFormData] = useState<AssessmentRequest>({
        title: '',
        description: '',
        assessmentType: 'QUIZ',
        timeLimitMinutes: 45,
        passingScore: 50,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData && mode === 'edit') {
            setFormData({
                title: initialData.title,
                description: initialData.description || '',
                assessmentType: initialData.assessmentType,
                timeLimitMinutes: initialData.timeLimitMinutes,
                passingScore: initialData.passingScore,
                lessonId: initialData.lessonId,
            });
        } else {
            setFormData({
                title: '',
                description: '',
                assessmentType: 'QUIZ',
                timeLimitMinutes: 45,
                passingScore: 50,
            });
        }
    }, [initialData, mode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
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
