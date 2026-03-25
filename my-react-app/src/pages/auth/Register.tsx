import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { ApiError } from '../../types/auth.types';
import type { RegisterRequest } from '../../types/auth.types';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Vui lòng nhập tên người dùng';
    } else if (formData.userName.trim().length < 3 || formData.userName.trim().length > 50) {
      newErrors.userName = 'Tên người dùng phải từ 3 đến 50 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    } else if (formData.email.length > 50) {
      newErrors.email = 'Email không được vượt quá 50 ký tự';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8 || formData.password.length > 128) {
      newErrors.password = 'Mật khẩu phải từ 8 đến 128 ký tự';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ hoa';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ thường';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ số';
    } else if (!/[!@#$%^&*()_+\-={}\[\];':"\\|,.<>/?]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const registerData: RegisterRequest = {
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await AuthService.register(registerData);

      if (response.code === 1000) {
        setSuccessMessage(
          'Đăng ký thành công! Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác nhận để kích hoạt tài khoản.'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 1002) {
          setErrors({ userName: 'Tên người dùng này đã được sử dụng' });
        } else if (error.code === 1013) {
          setErrors({ email: 'Email này đã được đăng ký' });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        setErrors({
          submit:
            error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setIsLoading(true);
    setErrors({});
    try {
      const authResponse = await AuthService.googleLogin(response.credential);
      if (authResponse.code === 1000 && authResponse.result.token) {
        AuthService.saveToken(authResponse.result.token, authResponse.result.expiryTime);
        if (authResponse.result.newRegistration) {
          navigate('/select-role');
        } else {
          navigate(AuthService.getDashboardUrl());
        }
      }
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Đăng ký Google thất bại. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: 'Đăng ký Google thất bại. Vui lòng thử lại.' });
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-math-bg" aria-hidden="true">
          <span className="auth-math-sym ms1">∑</span>
          <span className="auth-math-sym ms2">∫</span>
          <span className="auth-math-sym ms3">√</span>
          <span className="auth-math-sym ms4">π</span>
          <span className="auth-math-sym ms5">∞</span>
          <span className="auth-math-sym ms6">Δ</span>
          <span className="auth-math-sym ms7">θ</span>
          <span className="auth-math-sym ms8">α</span>
        </div>

        <div className="auth-brand">
          <Link to="/" className="auth-brand-link" aria-label="Về trang chủ MathMaster">
            <div className="auth-logo-mark">M</div>
            <div>
              <h1>MathMaster</h1>
            </div>
          </Link>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon">01</div>
            <span>Tham gia cộng đồng giáo viên toán</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">02</div>
            <span>Tạo đề kiểm tra &amp; bài tập tự động</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">03</div>
            <span>Theo dõi tiến độ học sinh theo thời gian thực</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">04</div>
            <span>Bảo mật dữ liệu, miễn phí sử dụng</span>
          </div>
        </div>
        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-number">1,200+</span>
            <span className="auth-stat-label">Giáo viên</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-number">50K+</span>
            <span className="auth-stat-label">Học sinh</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-number">200K+</span>
            <span className="auth-stat-label">Câu hỏi</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <Link to="/" className="auth-nav-link auth-nav" aria-label="Về trang chủ">
          ← Trang chủ
        </Link>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Tạo tài khoản</h2>
            <p>Bắt đầu hành trình học toán với MathMaster</p>
          </div>

          {successMessage ? (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              <p>{successMessage}</p>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                Đã có tài khoản?{' '}
                <Link to="/login" className="link-primary">
                  Đăng nhập
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

              <div className="form-group">
                <label htmlFor="userName" className="form-label">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  className={`form-control${errors.userName ? ' error' : ''}`}
                  placeholder="vd: john_doe"
                  value={formData.userName}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="username"
                />
                {errors.userName && <span className="form-error">{errors.userName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-control${errors.email ? ' error' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-control${errors.password ? ' error' : ''}`}
                  placeholder="Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control${errors.confirmPassword ? ' error' : ''}`}
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="form-error">{errors.confirmPassword}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
                style={{ marginTop: '0.5rem' }}
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản →'}
              </button>

              <div className="divider">
                <span>hoặc</span>
              </div>

              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  shape="pill"
                  text="signup_with"
                  size="large"
                />
              </div>
            </form>
          )}

          {!successMessage && (
            <div className="auth-footer">
              <p>
                Đã có tài khoản?{' '}
                <Link to="/login" className="link-primary">
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
