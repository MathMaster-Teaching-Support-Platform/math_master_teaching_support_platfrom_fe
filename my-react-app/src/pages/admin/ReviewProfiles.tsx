import React, { useState, useEffect } from 'react';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { TeacherProfile, ProfileStatus } from '../../types';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles';
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

      // Reload data
      await loadProfiles();
      await loadPendingCount();

      handleCloseModal();
      alert(`Profile ${reviewAction.toLowerCase()} successfully!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to review profile';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: ProfileStatus) => {
    return `table-status-badge status-${status.toLowerCase()}`;
  };

  return (
    <div className="review-profiles-page">
      <div className="page-header">
        <h1>Review Teacher Profiles</h1>
        <p>Manage teacher profile applications</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-cards">
        <div
          className={`stat-card pending ${currentStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => handleStatusChange('PENDING')}
        >
          <h3>Pending</h3>
          <div className="stat-number">{pendingCount}</div>
        </div>
        <div
          className={`stat-card approved ${currentStatus === 'APPROVED' ? 'active' : ''}`}
          onClick={() => handleStatusChange('APPROVED')}
        >
          <h3>Approved</h3>
          <div className="stat-number">{currentStatus === 'APPROVED' ? totalElements : '—'}</div>
        </div>
        <div
          className={`stat-card rejected ${currentStatus === 'REJECTED' ? 'active' : ''}`}
          onClick={() => handleStatusChange('REJECTED')}
        >
          <h3>Rejected</h3>
          <div className="stat-number">{currentStatus === 'REJECTED' ? totalElements : '—'}</div>
        </div>
      </div>

      <div className="profiles-table-container">
        <div className="table-header">
          <h2>{currentStatus} Profiles</h2>
        </div>

        {loading ? (
          <div className="loading" style={{ padding: '3rem' }}>
            Loading profiles...
          </div>
        ) : profiles.length === 0 ? (
          <div className="empty-state">
            <p>No {currentStatus.toLowerCase()} profiles found</p>
          </div>
        ) : (
          <>
            <table className="profiles-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>School</th>
                  <th>Position</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <div className="profile-user-info">
                        <span className="profile-user-name">{profile.fullName}</span>
                        <span className="profile-user-email">@{profile.userName}</span>
                      </div>
                    </td>
                    <td>{profile.schoolName}</td>
                    <td>{profile.position}</td>
                    <td>{new Date(profile.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusBadgeClass(profile.status)}>{profile.status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewProfile(profile)}
                          title="View Details"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalElements)} of{' '}
                  {totalElements} profiles
                </div>
                <div className="pagination-controls">
                  <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                    Previous
                  </button>
                  <span>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profile Details</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-details">
                <div className="detail-section">
                  <h3>User Information</h3>
                  <p>
                    <strong>Name:</strong> {selectedProfile.fullName}
                  </p>
                  <p>
                    <strong>Username:</strong> {selectedProfile.userName}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedProfile.userId}
                  </p>
                </div>

                <div className="detail-section">
                  <h3>School & Position</h3>
                  <p>
                    <strong>School:</strong> {selectedProfile.schoolName}
                  </p>
                  {selectedProfile.schoolAddress && (
                    <p>
                      <strong>Address:</strong> {selectedProfile.schoolAddress}
                    </p>
                  )}
                  {selectedProfile.schoolWebsite && (
                    <p>
                      <strong>Website:</strong>{' '}
                      <a href={selectedProfile.schoolWebsite} target="_blank" rel="noopener noreferrer">
                        {selectedProfile.schoolWebsite}
                      </a>
                    </p>
                  )}
                  <p>
                    <strong>Position:</strong> {selectedProfile.position}
                  </p>
                </div>

                {selectedProfile.description && (
                  <div className="detail-section">
                    <h3>Description</h3>
                    <p>{selectedProfile.description}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Verification Document</h3>
                  <p>
                    <strong>Type:</strong> {selectedProfile.documentType}
                  </p>
                  <p>
                    <strong>File:</strong>{' '}
                    <a
                      href={selectedProfile.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      View Document
                    </a>
                  </p>
                </div>

                <div className="detail-section">
                  <h3>Status & Timeline</h3>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={getStatusBadgeClass(selectedProfile.status)}>
                      {selectedProfile.status}
                    </span>
                  </p>
                  <p>
                    <strong>Submitted:</strong>{' '}
                    {new Date(selectedProfile.createdAt).toLocaleString()}
                  </p>
                  {selectedProfile.reviewedAt && (
                    <>
                      <p>
                        <strong>Reviewed:</strong>{' '}
                        {new Date(selectedProfile.reviewedAt).toLocaleString()}
                      </p>
                      <p>
                        <strong>Reviewed By:</strong> {selectedProfile.reviewedByName}
                      </p>
                    </>
                  )}
                </div>

                {selectedProfile.adminComment && (
                  <div className="admin-comment">
                    <strong>Previous Admin Comment:</strong>
                    <p>{selectedProfile.adminComment}</p>
                  </div>
                )}
              </div>

              {selectedProfile.status === 'PENDING' && (
                <div className="review-form">
                  <h3>Review This Profile</h3>
                  <div className="review-actions">
                    <button
                      className={`btn-approve ${reviewAction === 'APPROVED' ? 'active' : ''}`}
                      onClick={() => setReviewAction('APPROVED')}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className={`btn-reject ${reviewAction === 'REJECTED' ? 'active' : ''}`}
                      onClick={() => setReviewAction('REJECTED')}
                    >
                      ❌ Reject
                    </button>
                  </div>

                  {reviewAction && (
                    <>
                      <textarea
                        placeholder={`Add a comment (optional)...`}
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        maxLength={1000}
                      />
                      <button
                        className="btn-primary"
                        onClick={handleReviewSubmit}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : `Submit ${reviewAction}`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewProfiles;
