import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolService } from '../../services/api/school.service';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { School, SubmitTeacherProfileRequest } from '../../types';
import './TeacherProfile.css';

interface SubmitTeacherProfileProps {
  onSuccess?: () => void;
}

const SubmitTeacherProfile: React.FC<SubmitTeacherProfileProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SubmitTeacherProfileRequest>({
    schoolId: 0,
    position: '',
    certificateUrl: '',
    identificationDocumentUrl: '',
    description: '',
  });

  useEffect(() => {
    loadSchools();
    checkExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchools = async () => {
    try {
      const response = await SchoolService.getAllSchools();
      setSchools(response.result);
    } catch (err) {
      setError('Failed to load schools. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingProfile = async () => {
    try {
      await TeacherProfileService.getMyProfile();
      // If profile exists, redirect to view page (only if not in Profile page context)
      if (!onSuccess) {
        navigate('/profile');
      }
    } catch {
      // No profile exists, continue
      console.log('No existing profile found');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'schoolId' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate
      if (!formData.schoolId || formData.schoolId === 0) {
        throw new Error('Please select a school');
      }
      if (!formData.position.trim()) {
        throw new Error('Please enter your position');
      }

      await TeacherProfileService.submitProfile(formData);
      setSuccess(true);

      // Redirect after 2 seconds or call callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/profile');
        }
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit profile. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-profile-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="teacher-profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Become a Teacher</h1>
          <p>Submit your profile for admin review to unlock teacher features</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Profile submitted successfully! Redirecting to profile page...
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="schoolId">
              School <span className="required">*</span>
            </label>
            <select
              id="schoolId"
              name="schoolId"
              value={formData.schoolId}
              onChange={handleInputChange}
              required
              disabled={submitting}
            >
              <option value="0">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.city}
                </option>
              ))}
            </select>
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
            <small>Max 100 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="certificateUrl">Teaching Certificate URL</label>
            <input
              type="url"
              id="certificateUrl"
              name="certificateUrl"
              value={formData.certificateUrl}
              onChange={handleInputChange}
              placeholder="https://storage.example.com/certificates/cert.pdf"
              disabled={submitting}
            />
            <small>URL to your teaching certificate or qualification document</small>
          </div>

          <div className="form-group">
            <label htmlFor="identificationDocumentUrl">Identification Document URL</label>
            <input
              type="url"
              id="identificationDocumentUrl"
              name="identificationDocumentUrl"
              value={formData.identificationDocumentUrl}
              onChange={handleInputChange}
              placeholder="https://storage.example.com/id/id-card.jpg"
              disabled={submitting}
            />
            <small>URL to your ID card or verification document</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us about your teaching experience, qualifications, and why you want to be a teacher on our platform..."
              maxLength={1000}
              disabled={submitting}
            />
            <small>Max 1000 characters (optional)</small>
          </div>

          <div className="file-upload-hint">
            <p>
              <strong>📁 File Upload Instructions:</strong>
            </p>
            <p>1. Upload your files to a cloud storage service (Google Drive, Dropbox, etc.)</p>
            <p>2. Make sure the files are publicly accessible or shared with view permission</p>
            <p>3. Copy the public URL and paste it in the fields above</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitTeacherProfile;
