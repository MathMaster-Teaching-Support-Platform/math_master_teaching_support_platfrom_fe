import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/api/auth.service';
import type { RegisterRequest } from '../../types/auth.types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dob: '',
    role: 'teacher',
    school: '',
    grade: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Goong API states
  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Goong API autocomplete for school
    if (name === 'school') {
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
    }
  };

  const handleSelectSchool = (schoolName: string) => {
    setFormData(prev => ({ ...prev, school: schoolName }));
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (!formData.dob) {
      newErrors.dob = 'Vui lòng nhập ngày sinh';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      setSuccessMessage('');

      try {
        // Prepare data for API
        const registerData: RegisterRequest = {
          userName: formData.email, // Using email as username
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dob: formData.dob,
        };

        const response = await AuthService.register(registerData);

        if (response.code === 1000) {
          setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');

          // Redirect to login page after 2 seconds
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>MathMaster</h1>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>
        <div className="auth-illustration">
          <div className="floating-shapes">
            <div className="shape shape-1">√</div>
            <div className="shape shape-2">∞</div>
            <div className="shape shape-3">α</div>
            <div className="shape shape-4">β</div>
            <div className="shape shape-5">∆</div>
            <div className="shape shape-6">θ</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h2>Tạo tài khoản mới</h2>
            <p>Bắt đầu hành trình giảng dạy toán học hiệu quả</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Họ và tên <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-control ${errors.fullName ? 'error' : ''}`}
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Số điện thoại <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className={`form-control ${errors.phoneNumber ? 'error' : ''}`}
                placeholder="0912345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Giới tính <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dob" className="form-label">
                  Ngày sinh <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  className={`form-control ${errors.dob ? 'error' : ''}`}
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.dob && <span className="form-error">{errors.dob}</span>}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mật khẩu <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Xác nhận mật khẩu <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <span className="form-error">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Vai trò
              </label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="teacher">Giáo viên</option>
                <option value="student">Học sinh</option>
              </select>
            </div>

            {formData.role === 'teacher' && (
              <>
                <div className="form-group autocomplete-wrapper" ref={autocompleteRef}>
                  <label htmlFor="school" className="form-label">
                    Trường
                  </label>
                  <input
                    type="text"
                    id="school"
                    name="school"
                    className="form-control"
                    placeholder="Nhập tên trường (Ví dụ: THPT Lê Quý Đôn)"
                    value={formData.school}
                    onChange={handleChange}
                    onFocus={() => {
                      if (formData.school.trim() && schoolSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  {showSuggestions && formData.school.trim() && (
                    <div className="autocomplete-dropdown">
                      {isSearchingSchool ? (
                        <div className="autocomplete-loading">Đang tìm kiếm...</div>
                      ) : schoolSuggestions.length > 0 ? (
                        schoolSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="autocomplete-item"
                            onClick={() => handleSelectSchool(suggestion.description)}
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

                <div className="form-group">
                  <label htmlFor="grade" className="form-label">
                    Cấp học giảng dạy
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    className="form-control"
                    value={formData.grade}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Chọn cấp học</option>
                    <option value="elementary">Tiểu học (Lớp 1-5)</option>
                    <option value="middle">THCS (Lớp 6-9)</option>
                    <option value="high">THPT (Lớp 10-12)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="link-primary">
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="link-primary">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && <span className="form-error">{errors.agreeToTerms}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>

            <div className="divider">
              <span>hoặc</span>
            </div>

            <button type="button" className="btn btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Đăng ký với Google
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login" className="link-primary">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
