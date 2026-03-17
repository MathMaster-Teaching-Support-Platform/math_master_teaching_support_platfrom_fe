import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/api/auth.service';
import type { RegisterRequest } from '../../types/auth.types';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
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
        userName: formData.email,
        password: formData.password,
        email: formData.email,
        fullName: '',
        phoneNumber: '',
        gender: 'MALE',
        dob: '2000-01-01',
        role: 'STUDENT',
      };

      const response = await AuthService.register(registerData);

      if (response.code === 1000) {
        setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.',
      });
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
      setErrors({ submit: err instanceof Error ? err.message : 'Đăng ký Google thất bại. Vui lòng thử lại.' });
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

          <form onSubmit={handleSubmit} className="auth-form">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
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
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control${errors.password ? ' error' : ''}`}
                placeholder="Tối thiểu 8 ký tự"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
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
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
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
                locale="vi"
                size="large"
              />
            </div>
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
