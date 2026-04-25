import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import type { LoginRequest } from '../../types/auth.types';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

const MathGraphWarm = () => (
  <svg className="auth-graph" viewBox="0 0 520 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {[90, 140, 190, 330, 380, 430].map((x) => (
      <line key={x} x1={x} y1="32" x2={x} y2="228" stroke="rgba(250,249,245,0.12)" strokeWidth="1" />
    ))}
    {[80, 130, 180].map((y) => (
      <line key={y} x1="52" y1={y} x2="468" y2={y} stroke="rgba(250,249,245,0.12)" strokeWidth="1" />
    ))}
    <line x1="52" y1="130" x2="468" y2="130" stroke="rgba(250,249,245,0.42)" strokeWidth="1.3" />
    <line x1="260" y1="24" x2="260" y2="236" stroke="rgba(250,249,245,0.42)" strokeWidth="1.3" />
    <path
      d="M 90,130 C 132,130 124,76 170,76 C 214,76 214,130 260,130 C 306,130 306,184 350,184 C 396,184 388,130 430,130"
      stroke="#C96442"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <path
      d="M 90,76 C 132,76 124,130 170,130 C 214,130 214,184 260,184 C 306,184 306,130 350,130 C 396,130 388,76 430,76"
      stroke="rgba(250,249,245,0.55)"
      strokeWidth="1.8"
      strokeDasharray="5 4"
      strokeLinecap="round"
    />
    <circle cx="170" cy="76" r="4.6" fill="#C96442" />
    <circle cx="350" cy="184" r="4.6" fill="#C96442" />
    <text x="68" y="56" fill="rgba(250,249,245,0.82)" fontSize="13" fontFamily="Georgia, serif" fontStyle="italic">
      f(x) = sin x
    </text>
    <text x="68" y="74" fill="rgba(250,249,245,0.58)" fontSize="11" fontFamily="Georgia, serif" fontStyle="italic">
      g(x) = cos x
    </text>
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

        if (response.result.newRegistration) {
          const alreadyShown = localStorage.getItem('pendingRoleSelection') === 'true';
          if (alreadyShown) {
            // Second login without selecting role → default to student courses
            navigate('/student/courses');
          } else {
            localStorage.setItem('pendingRoleSelection', 'true');
            navigate('/select-role');
          }
        } else {
          // Get dashboard URL based on user role from token
          const dashboardUrl = AuthService.getDashboardUrl();
          navigate(dashboardUrl);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 1140) {
        setError('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác nhận tài khoản.');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
        );
      }
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
          localStorage.setItem('pendingRoleSelection', 'true');
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
    <div className="auth-container bg-[#F5F4ED] font-[Be_Vietnam_Pro]">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link" aria-label="Về trang chủ MathMaster">
            <span className="auth-logo-text-icon">∑π</span>
            <div>
              <h1
                className="font-medium text-[#141413]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                MathMaster
              </h1>
            </div>
          </Link>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>

        <MathGraphWarm />

        <blockquote className="auth-quote">
          <p>"Toán học là ngôn ngữ mà Chúa dùng để viết nên vũ trụ."</p>
          <footer>— Galileo Galilei</footer>
        </blockquote>

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

      {/* ── Right panel ── */}
      <div className="auth-right flex-1 bg-[#F5F4ED]">
        <Link
          to="/"
          className="auth-nav-link auth-nav inline-flex items-center gap-2 rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[#5E5D59] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
          aria-label="Về trang chủ"
        >
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>
        <div className="auth-card bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5]">
          <div className="auth-card-inner">
            <div className="auth-header">
              <h2
                className="font-medium text-[#141413]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                Đăng nhập
              </h2>
              <p>Chào mừng trở lại — nhập thông tin để tiếp tục</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="input-icon-wrap">
                  <span className="input-icon">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control with-icon font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <div className="input-icon-wrap">
                  <span className="input-icon">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control with-icon with-toggle font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                <Link
                  to="/forgot-password"
                  className="link-text transition-colors duration-150 hover:text-[#C96442] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block bg-[#C96442] font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" /> Đang đăng nhập...
                  </>
                ) : (
                  <>Đăng nhập</>
                )}
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
          {/* end auth-card-inner */}
        </div>
      </div>
    </div>
  );
};

export default Login;
