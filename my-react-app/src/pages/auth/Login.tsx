import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/api/auth.service';
import type { LoginRequest } from '../../types/auth.types';

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

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">
            <span className="math-symbol">∑</span>
            <span className="math-symbol">π</span>
            <span className="math-symbol">∫</span>
          </div>
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
          </div>
        </div>
      </div>

      <div className="auth-right">
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
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
              Đăng nhập với Google
            </button>
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
