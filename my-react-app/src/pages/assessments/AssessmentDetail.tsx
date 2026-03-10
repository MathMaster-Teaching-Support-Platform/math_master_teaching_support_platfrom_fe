import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AssessmentService } from '../../services/api/assessment.service';
import type { AssessmentResponse, AssessmentRequest } from '../../types';
import AssessmentModal from './AssessmentModal';
import './TeacherAssessments.css';

const AssessmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await AssessmentService.getAssessmentById(id);
            setAssessment(response.result);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch assessment details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleEditMetadata = () => {
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (data: AssessmentRequest) => {
        if (!id) return;
        try {
            await AssessmentService.updateAssessment(id, data);
            alert('Cập nhật thông tin thành công!');
            fetchDetail();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật thông tin');
            throw err;
        }
    };

    if (loading) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}><div className="loading-state">Đang tải...</div></DashboardLayout>;
    if (error) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}><div className="error-state">{error}</div></DashboardLayout>;
    if (!assessment) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}><div className="empty-state">Không tìm thấy bài kiểm tra</div></DashboardLayout>;

    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
            notificationCount={0}
        >
            <div className="assessment-detail-page" style={{ padding: '2rem' }}>
                <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                    ← Quay lại
                </button>

                <div className="detail-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0 }}>{assessment.title}</h1>
                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{assessment.description || 'Không có mô tả'}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <span className={`status-badge badge-${assessment.status.toLowerCase()}`}>
                                {assessment.status === 'DRAFT' ? 'Nháp' : assessment.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Đã đóng'}
                            </span>
                            {assessment.status === 'DRAFT' && (
                                <button className="btn btn-sm btn-outline" onClick={handleEditMetadata}>
                                    ✏️ Sửa thông tin
                                </button>
                            )}
                        </div>
                    </div>

                    <hr style={{ margin: '1.5rem 0', borderColor: '#f3f4f6' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3>Thông tin cơ bản</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Loại:</strong> {assessment.assessmentType}</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Bài học:</strong> {assessment.lessonTitle || 'N/A'}</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Thời gian làm bài:</strong> {assessment.timeLimitMinutes} phút</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Điểm đạt:</strong> {assessment.passingScore}%</li>
                            </ul>
                        </div>
                        <div>
                            <h3>Thống kê</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Số câu hỏi:</strong> {assessment.totalQuestions}</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Tổng điểm:</strong> {assessment.totalPoints}</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Số lượt làm bài:</strong> {assessment.submissionCount}</li>
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary">Bắt đầu sửa câu hỏi</button>
                        <button className="btn btn-outline">Preview (Học sinh)</button>
                    </div>
                </div>
            </div>

            <AssessmentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
                initialData={assessment}
                mode="edit"
            />
        </DashboardLayout>
    );
};

export default AssessmentDetail;
