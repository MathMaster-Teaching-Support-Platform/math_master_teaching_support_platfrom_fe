import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { SubmitTeacherProfileRequest } from '../../types';
import { Upload, Building, Briefcase, Globe } from 'lucide-react';
import './TeacherProfile.css';

interface SubmitTeacherProfileProps {
  onSuccess?: () => void;
}

const SubmitTeacherProfile: React.FC<SubmitTeacherProfileProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SubmitTeacherProfileRequest>({
    schoolName: '',
    schoolAddress: '',
    schoolWebsite: '',
    position: '',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  useEffect(() => {
    checkExistingProfile();
  }, []);

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
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setSelectedFiles(fileList);
      setFileNames(fileList.map(f => f.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate
      if (!formData.schoolName.trim()) {
        throw new Error('Please enter your school name');
      }
      if (!formData.position.trim()) {
        throw new Error('Please enter your position');
      }
      if (selectedFiles.length === 0) {
        throw new Error('Please upload at least one verification document');
      }

      await TeacherProfileService.submitProfile(formData, selectedFiles);
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

  return (
    <div className="teacher-profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Become a Teacher</h1>
          <p>Submit your profile for admin review to unlock teacher features</p>
          <p className="subtitle">Please upload your Teaching Contract and Payslip for verification</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Profile submitted successfully! Redirecting to profile page...
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="schoolName">
              <Building size={16} /> School Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              placeholder="e.g., FPT University"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="schoolAddress">
                <Globe size={16} /> School Address
              </label>
              <input
                type="text"
                id="schoolAddress"
                name="schoolAddress"
                value={formData.schoolAddress}
                onChange={handleInputChange}
                placeholder="e.g., Hòa Lạc, Hà Nội"
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="schoolWebsite"> School Website</label>
              <input
                type="url"
                id="schoolWebsite"
                name="schoolWebsite"
                value={formData.schoolWebsite}
                onChange={handleInputChange}
                placeholder="e.g., https://fpt.edu.vn"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="position">
              <Briefcase size={16} /> Position/Title <span className="required">*</span>
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
            <label>Verification Documents (Zip) <span className="required">*</span></label>
            <p className="form-help" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Select multiple files (Contract, Payslip, etc.) to be zipped and uploaded.
            </p>

            <div 
              className="file-upload-zone"
              onClick={() => document.getElementById('file-upload')?.click()}
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: fileNames.length > 0 ? '#f0fff4' : '#f8fafc'
              }}
            >
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                disabled={submitting}
              />
              <Upload className="upload-icon" size={32} style={{ color: '#667eea', marginBottom: '0.5rem' }} />
              {fileNames.length > 0 ? (
                <div style={{ color: '#2f855a', fontWeight: 'bold' }}>
                  {fileNames.map((name, index) => (
                    <p key={index} style={{ margin: '0.2rem 0' }}>{name}</p>
                  ))}
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#4a5568' }}>
                    {fileNames.length} file(s) selected
                  </p>
                </div>
              ) : (
                <p>Click or drag to upload your verification files (PDF, JPG, PNG)</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
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
