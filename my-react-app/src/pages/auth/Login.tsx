import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/api/auth.service';
import type { LoginRequest } from '../../types/auth.types';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

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
        const dashboardUrl = AuthService.getDashboardUrl();
        navigate(dashboardUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.'
      );
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

            <div className="google-btn-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="rectangular"
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
