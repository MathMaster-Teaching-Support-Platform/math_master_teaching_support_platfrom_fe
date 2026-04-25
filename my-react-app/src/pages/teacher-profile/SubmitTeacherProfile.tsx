import { Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { SubmitTeacherProfileRequest } from '../../types';
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
    fullName: '',
    schoolName: '',
    schoolAddress: '',
    schoolWebsite: '',
    position: '',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Goong API States
  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const existingProfileQuery = useQuery({
    queryKey: ['teacher-profile', 'my-profile'],
    queryFn: () => TeacherProfileService.getMyProfile(),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (existingProfileQuery.isSuccess && !onSuccess) {
      navigate('/profile');
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [existingProfileQuery.isSuccess, navigate, onSuccess]);

  useEffect(() => {
    if (existingProfileQuery.isError) {
      // 404/no profile is expected here; keep submit form visible.
    }
  }, [existingProfileQuery.isError]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolSearch = (value: string) => {
    setFormData(prev => ({ ...prev, schoolName: value }));

    if (!value.trim()) {
        setSchoolSuggestions([]);
        setShowSuggestions(false);
        return;
    }

    setIsSearchingSchool(true);
    setShowSuggestions(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
        try {
            const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=Pqo1poLXDFAq43GqCePcCWJjPvTl4cB6y4jG0Ofr&input=${encodeURIComponent(value)}`);
            const data = await res.json();
            if (data.status === 'OK') {
                setSchoolSuggestions(data.predictions || []);
            } else {
                setSchoolSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
            setSchoolSuggestions([]);
        } finally {
            setIsSearchingSchool(false);
        }
    }, 500);
  };

  const handleSelectSchool = (suggestion: any) => {
    setFormData(prev => ({ 
        ...prev, 
        schoolName: suggestion.structured_formatting?.main_text || suggestion.description,
        schoolAddress: suggestion.description 
    }));
    setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setSelectedFiles(fileList);
      setFileNames(fileList.map((f) => f.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.fullName.trim()) throw new Error('Vui lòng nhập họ và tên');
      if (!formData.schoolName.trim()) throw new Error('Vui lòng nhập tên trường');
      if (!formData.position.trim()) throw new Error('Vui lòng nhập chức vụ');
      if (selectedFiles.length === 0)
        throw new Error('Vui lòng tải lên ít nhất một tài liệu xác minh');

      await TeacherProfileService.submitProfile(formData, selectedFiles);
      setSuccess(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/profile');
        }
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Gửi hồ sơ thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="tp-page">
        <div className="tp-card">
          <div className="tp-success-card">
            <div className="tp-success-card__icon">✓</div>
            <h2 className="tp-success-card__title">Hồ sơ đã được gửi!</h2>
            <p className="tp-success-card__subtitle">Đang chuyển hướng đến trang hồ sơ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-card">
        <div className="tp-card-header">
          <h1 className="tp-card-header__title">
            Trở thành <span className="tp-gradient-text">giáo viên</span>
          </h1>
          <p className="tp-card-header__subtitle">
            Gửi hồ sơ để quản trị viên xét duyệt và mở khóa tính năng giảng dạy. Vui lòng tải lên
            Thẻ Cán bộ, Công chức, Viên chức (Giáo Viên) để xác minh.
          </p>
        </div>

        <div className="tp-card-body">
          {error && (
            <div className="tp-alert tp-alert--error">
              <span className="tp-alert__icon">✕</span>
              <span>{error}</span>
            </div>
          )}

          <form className="tp-form" onSubmit={handleSubmit}>
            <div className="tp-form-group">
              <label className="tp-label" htmlFor="fullName">
                Họ và tên <span className="tp-required">*</span>
              </label>
              <input
                className="tp-input"
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="VD: Nguyễn Văn A"
                maxLength={100}
                required
                disabled={submitting}
              />
              <p className="tp-form-hint">
                Họ tên phải khớp chính xác với thông tin trên Thẻ Giáo viên để OCR xác minh
              </p>
            </div>

            <div className="tp-form-group autocomplete-wrapper" ref={autocompleteRef}>
              <label className="tp-label" htmlFor="schoolName">
                Tên trường <span className="tp-required">*</span>
              </label>
              <input
                className="tp-input"
                type="text"
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={(e) => handleSchoolSearch(e.target.value)}
                onFocus={() => {
                    if (formData.schoolName.trim() && schoolSuggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
                placeholder="VD: Đại học FPT"
                required
                disabled={submitting}
              />
              {showSuggestions && formData.schoolName.trim() && (
                  <div className="autocomplete-dropdown">
                      {isSearchingSchool ? (
                          <div className="autocomplete-loading">Đang tìm kiếm...</div>
                      ) : schoolSuggestions.length > 0 ? (
                          schoolSuggestions.map((suggestion) => (
                              <div 
                                  key={suggestion.place_id} 
                                  className="autocomplete-item"
                                  onClick={() => handleSelectSchool(suggestion)}
                              >
                                  <span className="autocomplete-item-main">
                                      {suggestion.structured_formatting?.main_text || suggestion.description}
                                  </span>
                                  {suggestion.structured_formatting?.secondary_text && (
                                      <span className="autocomplete-item-sub">
                                          {suggestion.structured_formatting.secondary_text}
                                      </span>
                                  )}
                              </div>
                          ))
                      ) : (
                          <div className="autocomplete-loading">Không tìm thấy kết quả</div>
                      )}
                  </div>
              )}
            </div>

            <div className="tp-form-grid">
              <div className="tp-form-group">
                <label className="tp-label" htmlFor="schoolAddress">
                  Địa chỉ trường
                </label>
                <input
                  className="tp-input"
                  type="text"
                  id="schoolAddress"
                  name="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={handleInputChange}
                  placeholder="VD: Hòa Lạc, Hà Nội"
                  disabled={submitting}
                />
              </div>
              <div className="tp-form-group">
                <label className="tp-label" htmlFor="schoolWebsite">
                  Website trường
                </label>
                <input
                  className="tp-input"
                  type="url"
                  id="schoolWebsite"
                  name="schoolWebsite"
                  value={formData.schoolWebsite}
                  onChange={handleInputChange}
                  placeholder="VD: https://fpt.edu.vn"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="tp-form-group">
              <label className="tp-label" htmlFor="position">
                Chức vụ / Chức danh <span className="tp-required">*</span>
              </label>
              <select
                className="tp-input"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                <option value="" disabled>-- Chọn chức vụ --</option>
                <option value="Giảng Viên Toán">Giảng Viên Toán</option>
                <option value="Giáo Viên Toán">Giáo Viên Toán</option>
              </select>
              <p className="tp-form-hint">
                Chọn chức vụ từ danh sách để hệ thống OCR có thể xác minh được hồ sơ
              </p>
            </div>

            <div className="tp-form-group">
              <label className="tp-label" htmlFor="file-upload">
                Tài liệu xác minh <span className="tp-required">*</span>
              </label>
              <p className="tp-form-hint">
                Chọn file Thẻ Cán bộ, Công chức, Viên chức (Giáo Viên) để tải lên xác minh.
              </p>
              <button
                type="button"
                className={`tp-file-zone ${fileNames.length > 0 ? 'tp-file-zone--filled' : ''}`}
                onClick={() => document.getElementById('file-upload')?.click()}
                onKeyDown={(e) =>
                  e.key === 'Enter' && document.getElementById('file-upload')?.click()
                }
                aria-label="Tải lên tài liệu xác minh"
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
                <div className="tp-file-zone__icon">
                  <Upload size={28} />
                </div>
                {fileNames.length > 0 ? (
                  <div className="tp-file-zone__files">
                    {fileNames.map((name) => (
                      <span key={name} className="tp-file-zone__file-name">
                        {name}
                      </span>
                    ))}
                    <span className="tp-file-zone__file-count">
                      {fileNames.length} file đã chọn
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="tp-file-zone__title">Nhấn để tải lên tài liệu</p>
                    <p className="tp-file-zone__subtitle">PDF, JPG, PNG được hỗ trợ</p>
                  </>
                )}
              </button>
            </div>

            <div className="tp-form-group">
              <label className="tp-label" htmlFor="description">
                Mô tả (tuỳ chọn)
              </label>
              <textarea
                className="tp-textarea"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả kinh nghiệm giảng dạy của bạn..."
                maxLength={1000}
                disabled={submitting}
              />
            </div>

            <div className="tp-actions">
              <button
                type="button"
                className="tp-btn tp-btn--ghost"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="tp-btn tp-btn--primary tp-btn--large"
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi hồ sơ →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitTeacherProfile;
