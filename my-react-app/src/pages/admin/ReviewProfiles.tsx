import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  UserCheck, 
  UserX,
  User as UserIcon,
  Calendar,
  Building2,
  MapPin,
  Globe,
  FileText,
  X
} from 'lucide-react';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { TeacherProfile, ProfileStatus } from '../../types';
import { DashboardLayout } from '../../components/layout';
import { mockAdmin } from '../../data/mockData';
import './ReviewProfiles.css';

const ReviewProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ProfileStatus>('PENDING');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState<TeacherProfile | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfiles();
    loadPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus, page]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TeacherProfileService.getProfilesByStatus(currentStatus, page, 10);
      setProfiles(response.result.content);
      setTotalPages(response.result.totalPages);
      setTotalElements(response.result.totalElements);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách hồ sơ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const response = await TeacherProfileService.countPendingProfiles();
      setPendingCount(response.result);
    } catch (err) {
      console.error('Failed to load pending count', err);
    }
  };

  const handleStatusChange = (status: ProfileStatus) => {
    if (currentStatus === status) return;
    setCurrentStatus(status);
    setPage(0);
  };

  const handleViewProfile = (profile: TeacherProfile) => {
    setSelectedProfile(profile);
    setReviewAction(null);
    setAdminComment('');
  };

  const handleCloseModal = () => {
    setSelectedProfile(null);
    setReviewAction(null);
    setAdminComment('');
  };

  const handleReviewSubmit = async () => {
    if (!selectedProfile || !reviewAction) return;

    setSubmitting(true);
    try {
      await TeacherProfileService.reviewProfile(selectedProfile.id, {
        status: reviewAction,
        adminComment: adminComment.trim() || undefined,
      });

      await loadProfiles();
      await loadPendingCount();

      handleCloseModal();
      const actionText = reviewAction === 'APPROVED' ? 'phê duyệt' : 'từ chối';
      alert(`Hồ sơ đã được ${actionText} thành công!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Thao tác thất bại';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDocuments = async (profileId: string) => {
    try {
      const response = await TeacherProfileService.getDownloadUrl(profileId);
      if (response.result) {
        window.open(response.result as string, '_blank');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể lấy link tải hồ sơ';
      alert(errorMessage);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar!, role: 'admin' }}
      notificationCount={pendingCount}
    >
      <div className="review-profiles-container">
        <header className="review-header">
          <h1>Duyệt Hồ Sơ Giáo Viên</h1>
          <p>Xác minh và quản lý hồ sơ chuyên môn của tài khoản giáo viên</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <section className="review-stats-grid">
          <div
            className={`review-stat-card pending ${currentStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => handleStatusChange('PENDING')}
          >
            <div className="review-stat-info">
              <h3>Chờ xác minh</h3>
              <div className="review-stat-value">{pendingCount}</div>
            </div>
            <div className="review-stat-icon"><Clock size={24} /></div>
          </div>
          
          <div
            className={`review-stat-card approved ${currentStatus === 'APPROVED' ? 'active' : ''}`}
            onClick={() => handleStatusChange('APPROVED')}
          >
            <div className="review-stat-info">
              <h3>Hồ sơ đã duyệt</h3>
              <div className="review-stat-value">{currentStatus === 'APPROVED' ? totalElements : '—'}</div>
            </div>
            <div className="review-stat-icon"><CheckCircle2 size={24} /></div>
          </div>
          
          <div
            className={`review-stat-card rejected ${currentStatus === 'REJECTED' ? 'active' : ''}`}
            onClick={() => handleStatusChange('REJECTED')}
          >
            <div className="review-stat-info">
              <h3>Yêu cầu đã từ chối</h3>
              <div className="review-stat-value">{currentStatus === 'REJECTED' ? totalElements : '—'}</div>
            </div>
            <div className="review-stat-icon"><XCircle size={24} /></div>
          </div>
        </section>

        <section className="review-content-card">
          <div className="review-content-header">
            <h2>{currentStatus === 'PENDING' ? 'Đang chờ phê duyệt' : `Hồ sơ ${getStatusLabel(currentStatus)}`}</h2>
          </div>

          <div className="review-table-wrapper">
            {loading ? (
              <div className="review-loading-box">
                <p>Đang tải dữ liệu hồ sơ...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="review-empty-box">
                <p>Không tìm thấy hồ sơ nào ở trạng thái {getStatusLabel(currentStatus).toLowerCase()}.</p>
              </div>
            ) : (
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Giáo viên</th>
                    <th>Trường & Vị trí</th>
                    <th>Ngày nộp</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td>
                        <div className="review-user-cell">
                          <div className="review-user-avatar">
                            {profile.fullName.charAt(0)}
                          </div>
                          <div className="review-user-info">
                            <span className="review-user-name">{profile.fullName}</span>
                            <span className="review-user-handle">@{profile.userName}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="review-user-info">
                          <span className="review-user-name">{profile.schoolName}</span>
                          <span className="review-user-handle">{profile.position}</span>
                        </div>
                      </td>
                      <td>
                        <div className="review-user-cell">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="review-user-handle">
                            {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${profile.status.toLowerCase()}`}>
                          {getStatusLabel(profile.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => handleViewProfile(profile)}
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && !loading && (
            <footer className="review-pagination">
              <div className="pagination-text">
                Hiển thị từ {page * 10 + 1} đến {Math.min((page + 1) * 10, totalElements)} trong tổng số {totalElements} hồ sơ
              </div>
              <div className="pagination-actions">
                <button 
                  className="page-btn" 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                <button 
                  className="page-btn" 
                  onClick={() => setPage(page + 1)} 
                  disabled={page >= totalPages - 1}
                >
                  Sau <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          )}
        </section>

        {/* Improved Modal */}
        {selectedProfile && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <header className="modal-header-modern">
                <h2>Chi tiết hồ sơ nộp</h2>
                <button className="close-modal-btn" onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </header>
              
              <div className="modal-content-scroll">
                <div className="profile-modern-grid">
                  <div className="info-block">
                    <h4><UserIcon size={12} style={{marginRight: 4}} /> Thông tin cá nhân</h4>
                    <div className="info-card-lite">
                      <div className="info-row">
                        <span className="info-label">Họ và tên</span>
                        <span className="info-value">{selectedProfile.fullName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Tên đăng nhập</span>
                        <span className="info-value">@{selectedProfile.userName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">ID người dùng</span>
                        <span className="info-value">{selectedProfile.userId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-block">
                    <h4><Building2 size={12} style={{marginRight: 4}} /> Thông tin chuyên môn</h4>
                    <div className="info-card-lite">
                      <div className="info-row">
                        <span className="info-label">Trường công tác</span>
                        <span className="info-value">{selectedProfile.schoolName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Chức vụ</span>
                        <span className="info-value">{selectedProfile.position}</span>
                      </div>
                    </div>
                  </div>

                  {selectedProfile.schoolAddress && (
                    <div className="info-block">
                      <h4><MapPin size={12} style={{marginRight: 4}} /> Địa chỉ</h4>
                      <div className="info-card-lite">
                        <span className="info-value">{selectedProfile.schoolAddress}</span>
                      </div>
                    </div>
                  )}

                  {selectedProfile.schoolWebsite && (
                    <div className="info-block">
                      <h4><Globe size={12} style={{marginRight: 4}} /> Trang web trường</h4>
                      <div className="info-card-lite">
                        <a href={selectedProfile.schoolWebsite} target="_blank" rel="noopener noreferrer">
                          {selectedProfile.schoolWebsite}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedProfile.description && (
                    <div className="info-block full">
                      <h4><FileText size={12} style={{marginRight: 4}} /> Giới thiệu bản thân</h4>
                      <div className="description-box">
                        {selectedProfile.description}
                      </div>
                    </div>
                  )}

                  <div className="info-block full">
                    <h4>Bộ hồ sơ xác minh</h4>
                    <div className="download-banner">
                      <div className="download-text">
                        <h5>Bằng cấp & Giấy tờ chuyên môn</h5>
                        <p>Bộ hồ sơ xác minh tiêu chuẩn (Nén ZIP)</p>
                      </div>
                      <button 
                        className="download-action-btn"
                        onClick={() => handleDownloadDocuments(selectedProfile.id)}
                      >
                        <Download size={18} /> Tải hồ sơ xác minh
                      </button>
                    </div>
                  </div>
                </div>

                <div className="review-actions-area">
                  <h4>Trạng thái phê duyệt & Mốc thời gian</h4>
                  <div className="info-card-lite" style={{marginBottom: 20}}>
                     <div className="info-row">
                        <span className="info-label">Ngày gửi yêu cầu</span>
                        <span className="info-value">{new Date(selectedProfile.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      {selectedProfile.reviewedAt && (
                        <>
                          <div className="info-row">
                            <span className="info-label">Ngày hoàn tất duyệt</span>
                            <span className="info-value">{new Date(selectedProfile.reviewedAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Người duyệt</span>
                            <span className="info-value">{selectedProfile.reviewedByName}</span>
                          </div>
                        </>
                      )}
                  </div>

                  {selectedProfile.adminComment && (
                    <div className="info-block full">
                      <h4>Ghi chú từ quản trị viên</h4>
                      <div className="description-box" style={{borderLeft: '4px solid var(--primary-color)'}}>
                        {selectedProfile.adminComment}
                      </div>
                    </div>
                  )}

                  {selectedProfile.status === 'PENDING' && (
                    <div className="review-form-modern">
                      <div className="review-choice-buttons">
                        <button
                          className={`approve-btn-modern ${reviewAction === 'APPROVED' ? 'selected' : ''}`}
                          onClick={() => setReviewAction('APPROVED')}
                        >
                          <UserCheck size={20} /> Phê duyệt hồ sơ
                        </button>
                        <button
                          className={`reject-btn-modern ${reviewAction === 'REJECTED' ? 'selected' : ''}`}
                          onClick={() => setReviewAction('REJECTED')}
                        >
                          <UserX size={20} /> Từ chối hồ sơ
                        </button>
                      </div>

                      {reviewAction && (
                        <div className="animate-fade-in">
                          <textarea
                            className="comment-textarea"
                            placeholder={`Cung cấp lý do ${reviewAction === 'APPROVED' ? 'phê duyệt' : 'từ chối'}...`}
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            maxLength={1000}
                          />
                          <button
                            className="submit-review-btn"
                            onClick={handleReviewSubmit}
                            disabled={submitting}
                          >
                            {submitting ? 'Đang xử lý...' : `Hoàn tất ${reviewAction === 'APPROVED' ? 'phê duyệt' : 'từ chối'}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewProfiles;
