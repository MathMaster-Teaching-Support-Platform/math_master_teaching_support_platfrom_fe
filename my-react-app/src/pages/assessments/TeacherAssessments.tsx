import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AssessmentService } from '../../services/api/assessment.service';
import type { AssessmentResponse, AssessmentStatus, AssessmentType } from '../../types';
import './TeacherAssessments.css';

const TeacherAssessments: React.FC = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<AssessmentStatus | 'ALL'>('ALL');

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            const response = await AssessmentService.getMyAssessments({
                status: filterStatus === 'ALL' ? undefined : filterStatus,
                size: 50
            });
            setAssessments(response.result.content);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch assessments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssessments();
    }, [filterStatus]);

    const handleView = (id: string) => {
        navigate(`/teacher/assessments/${id}`);
    };

    const handleEdit = (id: string) => {
        // Navigate to editor/builder (using detail page for now as placeholder)
        navigate(`/teacher/assessments/${id}`);
    };

    const handlePublish = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xuất bản bài kiểm tra này?')) return;
        try {
            await AssessmentService.publishAssessment(id);
            alert('Xuất bản thành công!');
            fetchAssessments();
        } catch (err: any) {
            alert(err.message || 'Failed to publish');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;
        try {
            await AssessmentService.deleteAssessment(id);
            alert('Xóa thành công!');
            fetchAssessments();
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    const getStatusBadgeClass = (status: AssessmentStatus) => {
        switch (status) {
            case 'DRAFT': return 'badge-draft';
            case 'PUBLISHED': return 'badge-published';
            case 'CLOSED': return 'badge-closed';
            default: return '';
        }
    };

    const getStatusLabel = (status: AssessmentStatus) => {
        switch (status) {
            case 'DRAFT': return 'Nháp';
            case 'PUBLISHED': return 'Đã xuất bản';
            case 'CLOSED': return 'Đã đóng';
            default: return status;
        }
    };

    const getTypeLabel = (type: AssessmentType) => {
        switch (type) {
            case 'QUIZ': return 'Trắc nghiệm';
            case 'TEST': return 'Kiểm tra';
            case 'EXAM': return 'Thi học kỳ';
            case 'HOMEWORK': return 'Bài tập về nhà';
            default: return type;
        }
    };

    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }} // In real app, get from auth context
            notificationCount={0}
        >
            <div className="teacher-assessments-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📝 Quản lý Kiểm tra</h1>
                        <p className="page-subtitle">Tạo và quản lý các bài kiểm tra, đánh giá học sinh</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => alert('Chức năng tạo mới đang được cập nhật')}>
                        <span>➕</span> Tạo bài kiểm tra mới
                    </button>
                </div>

                <div className="assessments-toolbar">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filterStatus === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('ALL')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-tab ${filterStatus === 'DRAFT' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('DRAFT')}
                        >
                            Bản nháp
                        </button>
                        <button
                            className={`filter-tab ${filterStatus === 'PUBLISHED' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('PUBLISHED')}
                        >
                            Đã xuất bản
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : assessments.length === 0 ? (
                    <div className="empty-state">
                        <p>Chưa có bài kiểm tra nào.</p>
                        <button className="btn btn-outline" onClick={() => fetchAssessments()}>Thử lại</button>
                    </div>
                ) : (
                    <div className="assessments-grid">
                        {assessments.map((assessment) => (
                            <div key={assessment.id} className="assessment-card">
                                <div className="card-header">
                                    <span className={`status-badge ${getStatusBadgeClass(assessment.status)}`}>
                                        {getStatusLabel(assessment.status)}
                                    </span>
                                    <span className="type-label">{getTypeLabel(assessment.assessmentType)}</span>
                                </div>
                                <h3 className="assessment-title">{assessment.title}</h3>
                                <p className="assessment-desc">{assessment.description || 'Không có mô tả'}</p>

                                <div className="assessment-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">❓</span>
                                        <span>{assessment.totalQuestions} câu hỏi</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">💯</span>
                                        <span>{assessment.totalPoints} điểm</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">⏱️</span>
                                        <span>{assessment.timeLimitMinutes} phút</span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button className="btn btn-sm btn-outline" onClick={() => handleView(assessment.id)}>Xem</button>
                                    {assessment.status === 'DRAFT' && (
                                        <>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleEdit(assessment.id)}>Sửa</button>
                                            <button className="btn btn-sm btn-primary" onClick={() => handlePublish(assessment.id)}>Xuất bản</button>
                                        </>
                                    )}
                                    {assessment.status === 'DRAFT' && assessment.submissionCount === 0 && (
                                        <button className="btn btn-sm btn-danger" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDelete(assessment.id)}>Xóa</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TeacherAssessments;
