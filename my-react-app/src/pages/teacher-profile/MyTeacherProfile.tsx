import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { TeacherProfile, UpdateTeacherProfileRequest } from '../../types';
import './TeacherProfile.css';

interface MyTeacherProfileProps {
  onDelete?: () => void;
}

// ── OCR failure helpers ───────────────────────────────────────────────────
interface OcrField {
  label: string;
  valid: boolean;
}

function parseOcrFields(comment: string): OcrField[] | null {
  // Matches patterns like "Họ tên: v", "Chức danh+Toán: X", "Tên trường: v"
  const fieldPattern = /([^,\n]+?):\s*([vVxX✓✗])\b/g;
  const results: OcrField[] = [];
  let match: RegExpExecArray | null;
  while ((match = fieldPattern.exec(comment)) !== null) {
    const rawLabel = match[1].trim();
    // Skip lines that look like header sentences (contain spaces and are long)
    if (rawLabel.length > 40) continue;
    results.push({ label: rawLabel, valid: ['v', 'V', '✓'].includes(match[2]) });
  }
  return results.length > 0 ? results : null;
}

function isOcrFailureComment(comment: string): boolean {
  return /TỰ ĐỘNG TỪ CHỐI|XÁC MINH THẤT BẠI|Xác minh OCR thất bại/i.test(comment);
}

function extractOcrSubtitle(comment: string): string {
  const match = comment.match(/XÁC MINH THẤT BẠI[:\s]*([^.]+\.?)/i);
  if (match) return match[1].trim();
  const match2 = comment.match(/Xác minh OCR thất bại[.:\s]*([^.]*\.?)/i);
  if (match2 && match2[1].trim()) return match2[1].trim();
  return 'Một số thông tin trong hồ sơ chưa khớp với giấy tờ đã nộp.';
}
// ─────────────────────────────────────────────────────────────────────────────

const MyTeacherProfile: React.FC<MyTeacherProfileProps> = ({ onDelete }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ocrDismissed, setOcrDismissed] = useState(false);

  const [formData, setFormData] = useState<UpdateTeacherProfileRequest>({
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await TeacherProfileService.getMyProfile();
      setProfile(response.result);
      setFormData({
        fullName: response.result.fullName || '',
        schoolName: response.result.schoolName,
        schoolAddress: response.result.schoolAddress || '',
        schoolWebsite: response.result.schoolWebsite || '',
        position: response.result.position,
        description: response.result.description || '',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải hồ sơ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolSearch = (value: string) => {
    setFormData((prev) => ({ ...prev, schoolName: value }));

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
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=Pqo1poLXDFAq43GqCePcCWJjPvTl4cB6y4jG0Ofr&input=${encodeURIComponent(value)}`
        );
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
    setFormData((prev) => ({
      ...prev,
      schoolName: suggestion.structured_formatting?.main_text || suggestion.description,
      schoolAddress: suggestion.description,
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.fullName.trim()) throw new Error('Vui lòng nhập họ và tên');
      if (!formData.schoolName.trim()) throw new Error('Vui lòng nhập tên trường');
      if (!formData.position.trim()) throw new Error('Vui lòng nhập chức vụ');

      const response = await TeacherProfileService.updateMyProfile(formData, selectedFiles);
      setProfile(response.result);
      setEditing(false);
      setSuccess('Cập nhật hồ sơ thành công!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ giáo viên này không?')) return;

    setSubmitting(true);
    try {
      await TeacherProfileService.deleteMyProfile();
      if (onDelete) {
        onDelete();
      } else {
        navigate('/profile');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa hồ sơ';
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  const canEdit = profile?.status === 'PENDING' || profile?.status === 'REJECTED';
  const canDelete = profile?.status === 'PENDING' || profile?.status === 'REJECTED';

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-card">
          <div className="tp-loading">
            <div className="tp-loading__spinner" />
            Đang tải hồ sơ...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tp-page">
        <div className="tp-card">
          <div className="tp-card-body">
            <div className="tp-alert tp-alert--warning">
              <span className="tp-alert__icon">⚠️</span>
              <span>
                Không tìm thấy hồ sơ giáo viên. Bạn có muốn{' '}
                <a href="/submit-teacher-profile">nộp hồ sơ</a> không?
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (profile.status) {
      case 'PENDING':
        return <span className="tp-status-badge tp-status-badge--pending">⏳ Đang xét duyệt</span>;
      case 'APPROVED':
        return <span className="tp-status-badge tp-status-badge--approved">✓ Đã duyệt</span>;
      case 'REJECTED':
        return <span className="tp-status-badge tp-status-badge--rejected">✕ Bị từ chối</span>;
    }
  };

  const getStatusMessage = () => {
    switch (profile.status) {
      case 'PENDING':
        return (
          <div className="tp-alert tp-alert--warning">
            <span className="tp-alert__icon">⏳</span>
            <span>
              Hồ sơ của bạn đang được xem xét. Bạn sẽ được thông báo sau khi quản trị viên hoàn tất
              việc xét duyệt.
            </span>
          </div>
        );
      case 'APPROVED':
        return (
          <div className="tp-alert tp-alert--success">
            <span className="tp-alert__icon">✓</span>
            <span>
              Chúc mừng! Hồ sơ giáo viên của bạn đã được duyệt. Bạn có thể tạo và quản lý khóa học
              ngay bây giờ.
            </span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="tp-alert tp-alert--error">
            <span className="tp-alert__icon">✕</span>
            <span>
              Hồ sơ của bạn đã bị từ chối. Vui lòng xem lại nhận xét từ quản trị viên bên dưới và
              cập nhật hồ sơ để nộp lại.
            </span>
          </div>
        );
    }
  };

  if (!editing) {
    return (
      <div className="tp-page">
        <div className="tp-card">
          <div className="tp-card-header">
            <div className="tp-card-header__top">
              <div>
                <h1 className="tp-card-header__title">
                  Hồ sơ <span className="tp-gradient-text">giáo viên</span> của tôi
                </h1>
                <p className="tp-card-header__subtitle">
                  Thông tin được xem xét và xác minh bởi quản trị viên
                </p>
              </div>
              {getStatusBadge()}
            </div>
          </div>

          <div className="tp-card-body">
            {error && (
              <div className="tp-alert tp-alert--error">
                <span className="tp-alert__icon">✕</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="tp-alert tp-alert--success">
                <span className="tp-alert__icon">✓</span>
                <span>{success}</span>
              </div>
            )}
            {getStatusMessage()}

            <p className="tp-section-label">Thông tin cá nhân</p>

            <div className="tp-info-grid">
              <div className="tp-info-row">
                <span className="tp-info-label">Họ và tên</span>
                <span className="tp-info-value">{profile.fullName}</span>
              </div>
              <div className="tp-info-row">
                <span className="tp-info-label">Tên đăng nhập</span>
                <span className="tp-info-value">{profile.userName}</span>
              </div>
              <div className="tp-info-row">
                <span className="tp-info-label">Trường học</span>
                <span className="tp-info-value">{profile.schoolName}</span>
              </div>
              {profile.schoolAddress && (
                <div className="tp-info-row">
                  <span className="tp-info-label">Địa chỉ</span>
                  <span className="tp-info-value">{profile.schoolAddress}</span>
                </div>
              )}
              {profile.schoolWebsite && (
                <div className="tp-info-row">
                  <span className="tp-info-label">Website</span>
                  <span className="tp-info-value">
                    <a href={profile.schoolWebsite} target="_blank" rel="noopener noreferrer">
                      {profile.schoolWebsite}
                    </a>
                  </span>
                </div>
              )}
              <div className="tp-info-row">
                <span className="tp-info-label">Chức vụ</span>
                <span className="tp-info-value">{profile.position}</span>
              </div>
              {profile.verificationDocumentKey && (
                <div className="tp-info-row">
                  <span className="tp-info-label">Tài liệu XM</span>
                  <span className="tp-info-value tp-info-value--muted">Đã tải lên</span>
                </div>
              )}
              {profile.description && (
                <div className="tp-info-row">
                  <span className="tp-info-label">Mô tả</span>
                  <span className="tp-info-value">{profile.description}</span>
                </div>
              )}
              <div className="tp-info-row">
                <span className="tp-info-label">Ngày nộp</span>
                <span className="tp-info-value">
                  {new Date(profile.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              {profile.reviewedAt && (
                <div className="tp-info-row">
                  <span className="tp-info-label">Xét duyệt lúc</span>
                  <span className="tp-info-value">
                    {new Date(profile.reviewedAt).toLocaleString('vi-VN')} —{' '}
                    {profile.reviewedByName}
                  </span>
                </div>
              )}
            </div>

            {profile.adminComment &&
              (() => {
                if (!ocrDismissed && isOcrFailureComment(profile.adminComment!)) {
                  const fields = parseOcrFields(profile.adminComment!);
                  const subtitle = extractOcrSubtitle(profile.adminComment!);
                  return (
                    <div className="tp-ocr-card">
                      <div className="tp-ocr-card__header">
                        <div className="tp-ocr-card__icon" aria-hidden="true">
                          !
                        </div>
                        <div>
                          <p className="tp-ocr-card__title">Hồ sơ chưa được xác minh</p>
                          <p className="tp-ocr-card__subtitle">{subtitle}</p>
                        </div>
                      </div>

                      {fields && fields.length > 0 && (
                        <ul className="tp-ocr-fields">
                          {fields.map((f, i) => (
                            <li key={i} className="tp-ocr-field">
                              <span className="tp-ocr-field__label">{f.label}</span>
                              {f.valid ? (
                                <span className="tp-ocr-field__badge tp-ocr-field__badge--valid">
                                  Hợp lệ ✓
                                </span>
                              ) : (
                                <span className="tp-ocr-field__badge tp-ocr-field__badge--failed">
                                  Không khớp ✗
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="tp-ocr-card__actions">
                        {canEdit && (
                          <button
                            type="button"
                            className="tp-ocr-card__btn"
                            onClick={() => setEditing(true)}
                          >
                            Cập nhật hồ sơ
                          </button>
                        )}
                        <button
                          type="button"
                          className="tp-ocr-card__dismiss"
                          onClick={() => setOcrDismissed(true)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="tp-admin-comment">
                    <p className="tp-admin-comment__title">💬 Nhận xét từ quản trị viên</p>
                    <p className="tp-admin-comment__text">{profile.adminComment}</p>
                  </div>
                );
              })()}

            <div className="tp-actions">
              <button type="button" className="tp-btn tp-btn--ghost" onClick={() => navigate(-1)}>
                ← Quay lại
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="tp-btn tp-btn--primary"
                  onClick={() => setEditing(true)}
                  disabled={submitting}
                >
                  Chỉnh sửa hồ sơ
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="tp-btn tp-btn--danger"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? 'Đang xóa...' : 'Xóa hồ sơ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="tp-page">
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header__top">
            <div>
              <h1 className="tp-card-header__title">
                Chỉnh sửa <span className="tp-gradient-text">hồ sơ giáo viên</span>
              </h1>
              <p className="tp-card-header__subtitle">
                Cập nhật thông tin và nộp lại để được xét duyệt
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        <div className="tp-card-body">
          {error && (
            <div className="tp-alert tp-alert--error">
              <span className="tp-alert__icon">✕</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="tp-alert tp-alert--success">
              <span className="tp-alert__icon">✓</span>
              <span>{success}</span>
            </div>
          )}

          <form className="tp-form" onSubmit={handleUpdate}>
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
                Họ tên phải khớp chính xác với thông tin trên Thẻ Giáo viên
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
                  if (formData.schoolName.trim() && schoolSuggestions.length > 0)
                    setShowSuggestions(true);
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
                <option value="" disabled>
                  -- Chọn chức vụ --
                </option>
                <option value="Giảng Viên Toán">Giảng Viên Toán</option>
                <option value="Giáo Viên Toán">Giáo Viên Toán</option>
              </select>
              <p className="tp-form-hint">
                Chọn chức vụ từ danh sách để hệ thống OCR có thể xác minh được hồ sơ
              </p>
            </div>

            <div className="tp-form-group">
              <label className="tp-label" htmlFor="file-upload">
                Tài liệu xác minh mới (Tuỳ chọn)
              </label>
              <p className="tp-form-hint">
                Tải lên Thẻ Cán bộ, Công chức, Viên chức (Giáo Viên) NẾU BẠN CẦN THAY ĐỔI. Nếu không
                chọn, hệ thống sẽ sử dụng ảnh cũ.
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
                    <p className="tp-file-zone__title">Nhấn để tải lên tài liệu mới</p>
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
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button type="submit" className="tp-btn tp-btn--primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyTeacherProfile;
