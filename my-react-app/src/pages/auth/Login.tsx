import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import type { LoginRequest } from '../../types/auth.types';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password,
      };

      const response = await AuthService.login(loginData);

      if (response.code === 1000 && response.result.token) {
        // Save token to localStorage
        AuthService.saveToken(response.result.token, response.result.expiryTime);

        // Get dashboard URL based on user role from token
        const dashboardUrl = AuthService.getDashboardUrl();
        navigate(dashboardUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;

    setError('');
    setIsLoading(true);

    try {
      const authResponse = await AuthService.googleLogin(response.credential);

      if (authResponse.code === 1000 && authResponse.result.token) {
        AuthService.saveToken(authResponse.result.token, authResponse.result.expiryTime);

        if (authResponse.result.newRegistration) {
          navigate('/select-role');
        } else {
          const dashboardUrl = AuthService.getDashboardUrl();
          navigate(dashboardUrl);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
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
            <span>Quản lý bài giảng &amp; ngân hàng câu hỏi</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">02</div>
            <span>Lộ trình học tập được cá nhân hoá</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">03</div>
            <span>Hỗ trợ AI trong giảng dạy &amp; đánh giá</span>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">04</div>
            <span>Thống kê &amp; phân tích kết quả học tập</span>
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
            <h2>Chào mừng trở lại!</h2>
            <p>Đăng nhập để tiếp tục sử dụng MathMaster</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="link-text">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </button>

            <div className="divider">
              <span>hoặc</span>
            </div>

            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="pill"
                text="signin_with"
                size="large"
              />
            </div>
          </form>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="link-primary">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
