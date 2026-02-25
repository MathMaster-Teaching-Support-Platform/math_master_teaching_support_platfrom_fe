import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AssessmentService } from '../../services/api/assessment.service';
import type { AssessmentResponse } from '../../types';
import './TeacherAssessments.css'; // Reuse styles or create new ones

const AssessmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await AssessmentService.getAssessmentById(id);
                setAssessment(response.result);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch assessment details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    if (loading) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}><div className="loading-state">Đang tải...</div></DashboardLayout>;
    if (error) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}><div className="error-state">{error}</div></DashboardLayout>;
    if (!assessment) return <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}><div className="empty-state">Không tìm thấy bài kiểm tra</div></DashboardLayout>;

    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
        >
            <div className="assessment-detail-page" style={{ padding: '2rem' }}>
                <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                    ← Quay lại
                </button>

                <div className="detail-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0 }}>{assessment.title}</h1>
                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{assessment.description}</p>
                        </div>
                        <span className={`status-badge badge-${assessment.status.toLowerCase()}`}>
                            {assessment.status}
                        </span>
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
        </DashboardLayout>
    );
};

export default AssessmentDetail;
