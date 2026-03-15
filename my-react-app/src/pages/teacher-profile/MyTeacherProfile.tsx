import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { TeacherProfile, UpdateTeacherProfileRequest } from '../../types';
import './TeacherProfile.css';

interface MyTeacherProfileProps {
  onDelete?: () => void;
}

const MyTeacherProfile: React.FC<MyTeacherProfileProps> = ({ onDelete }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateTeacherProfileRequest>({
    schoolName: '',
    schoolAddress: '',
    schoolWebsite: '',
    position: '',
    documentUrl: '',
    documentType: '',
    description: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await TeacherProfileService.getMyProfile();
      setProfile(response.result);

      // Set form data
      setFormData({
        schoolName: response.result.schoolName,
        schoolAddress: response.result.schoolAddress || '',
        schoolWebsite: response.result.schoolWebsite || '',
        position: response.result.position,
        documentUrl: response.result.documentUrl,
        documentType: response.result.documentType,
        description: response.result.description || '',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.schoolName.trim()) {
        throw new Error('Please enter your school name');
      }
      if (!formData.position.trim()) {
        throw new Error('Please enter your position');
      }

      const response = await TeacherProfileService.updateMyProfile(formData);
      setProfile(response.result);
      setEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your teacher profile?')) {
      return;
    }

    setSubmitting(true);
    try {
      await TeacherProfileService.deleteMyProfile();
      if (onDelete) {
        onDelete();
      } else {
        navigate('/profile');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  const canEdit = profile?.status === 'PENDING' || profile?.status === 'REJECTED';
  const canDelete = profile?.status === 'PENDING' || profile?.status === 'REJECTED';

  if (loading) {
    return (
      <div className="teacher-profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="teacher-profile-page">
        <div className="alert alert-warning">
          No teacher profile found. Would you like to{' '}
          <a href="/submit-teacher-profile">submit one</a>?
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (profile.status) {
      case 'PENDING':
        return <div className="status-badge status-pending">⏳ Pending Review</div>;
      case 'APPROVED':
        return <div className="status-badge status-approved">✅ Approved</div>;
      case 'REJECTED':
        return <div className="status-badge status-rejected">❌ Rejected</div>;
    }
  };

  const getStatusMessage = () => {
    switch (profile.status) {
      case 'PENDING':
        return (
          <div className="alert alert-warning">
            Your profile is currently under review. You will be notified once an admin reviews your
            application.
          </div>
        );
      case 'APPROVED':
        return (
          <div className="alert alert-success">
            Congratulations! Your teacher profile has been approved. You can now create and manage
            courses.
          </div>
        );
      case 'REJECTED':
        return (
          <div className="alert alert-error">
            Your profile was rejected. Please review the admin's comments below and update your
            profile to resubmit.
          </div>
        );
    }
  };

  if (!editing) {
    return (
      <div className="teacher-profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <h1>My Teacher Profile</h1>
            {getStatusBadge()}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {getStatusMessage()}

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{profile.fullName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{profile.userName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">School:</span>
              <span className="info-value">{profile.schoolName}</span>
            </div>
            {profile.schoolAddress && (
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{profile.schoolAddress}</span>
              </div>
            )}
            {profile.schoolWebsite && (
              <div className="info-row">
                <span className="info-label">Website:</span>
                <span className="info-value">
                  <a href={profile.schoolWebsite} target="_blank" rel="noopener noreferrer">
                    {profile.schoolWebsite}
                  </a>
                </span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Position:</span>
              <span className="info-value">{profile.position}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Verification Document:</span>
              <span className="info-value">{profile.documentType}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Document File:</span>
              <a
                href={profile.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="file-link"
              >
                View Document
              </a>
            </div>
            {profile.description && (
              <div className="info-row">
                <span className="info-label">Description:</span>
                <span className="info-value">{profile.description}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Submitted:</span>
              <span className="info-value">{new Date(profile.createdAt).toLocaleString()}</span>
            </div>
            {profile.reviewedAt && (
              <div className="info-row">
                <span className="info-label">Reviewed:</span>
                <span className="info-value">
                  {new Date(profile.reviewedAt).toLocaleString()} by {profile.reviewedByName}
                </span>
              </div>
            )}
          </div>

          {profile.adminComment && (
            <div className="admin-comment">
              <strong>Admin Comment:</strong>
              <p>{profile.adminComment}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            {canEdit && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setEditing(true)}
                disabled={submitting}
              >
                Edit Profile
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDelete}
                disabled={submitting}
                style={{ background: '#ef4444', color: 'white' }}
              >
                Delete Profile
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="teacher-profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Edit Teacher Profile</h1>
          <p>Update your information and resubmit for review</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="profile-form" onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="schoolName">
              School Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="schoolAddress">School Address</label>
            <input
              type="text"
              id="schoolAddress"
              name="schoolAddress"
              value={formData.schoolAddress}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="schoolWebsite">School Website</label>
            <input
              type="url"
              id="schoolWebsite"
              name="schoolWebsite"
              value={formData.schoolWebsite}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">
              Position/Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="e.g., Math Teacher, Senior Lecturer"
              maxLength={100}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="documentType">
              Document Type <span className="required">*</span>
            </label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              required
              disabled={submitting}
            >
              <option value="Payslip">Payslip</option>
              <option value="Contract">Teaching Contract</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="documentUrl">Document URL</label>
            <input
              type="text"
              id="documentUrl"
              name="documentUrl"
              value={formData.documentUrl}
              onChange={handleInputChange}
              readOnly
              disabled
            />
            <small>Document files cannot be changed here. Please contact admin if you need to update your verification file.</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us about your teaching experience..."
              maxLength={1000}
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditing(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyTeacherProfile;
