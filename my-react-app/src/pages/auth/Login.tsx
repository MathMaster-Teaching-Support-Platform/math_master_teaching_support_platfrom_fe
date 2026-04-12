import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import type { LoginRequest } from '../../types/auth.types';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

const EmailIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="16" height="12" rx="2" />
    <polyline points="2,5 10,12 18,5" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="9" width="12" height="8" rx="2" />
    <path d="M7 9V7a3 3 0 016 0v2" />
    <circle cx="10" cy="13.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1.5 10S4.5 3.5 10 3.5 18.5 10 18.5 10 15.5 16.5 10 16.5 1.5 10 1.5 10z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="2" y1="2" x2="18" y2="18" />
    <path d="M6.7 6.8A7.3 7.3 0 002 10s3 6.5 8 6.5c1.7 0 3.2-.6 4.4-1.6M9 4.1A8.4 8.4 0 0110 4c5 0 8 6 8 6a14 14 0 01-2 2.9" />
  </svg>
);

const MathGraph = () => (
  <svg
    className="auth-graph"
    viewBox="0 0 440 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9896f5" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>

    {/* Grid — vertical */}
    {[80, 150, 220, 290, 360].map((x) => (
      <line
        key={`v${x}`}
        x1={x}
        y1="20"
        x2={x}
        y2="240"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    ))}
    {/* Grid — horizontal */}
    {[75, 130, 185].map((y) => (
      <line
        key={`h${y}`}
        x1="40"
        y1={y}
        x2="410"
        y2={y}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    ))}

    {/* X axis */}
    <line x1="40" y1="130" x2="405" y2="130" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
    <polygon points="405,126 413,130 405,134" fill="rgba(255,255,255,0.22)" />
    {/* Y axis */}
    <line x1="220" y1="245" x2="220" y2="22" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
    <polygon points="216,22 220,14 224,22" fill="rgba(255,255,255,0.22)" />

    {/* Axis labels */}
    <text
      x="416"
      y="135"
      fill="rgba(255,255,255,0.3)"
      fontSize="13"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      x
    </text>
    <text
      x="226"
      y="16"
      fill="rgba(255,255,255,0.3)"
      fontSize="13"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      y
    </text>

    {/* Tick marks on x-axis */}
    {[80, 150, 290, 360].map((x) => (
      <line
        key={`tx${x}`}
        x1={x}
        y1="126"
        x2={x}
        y2="134"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
    ))}
    {/* Tick marks on y-axis */}
    {[75, 185].map((y) => (
      <line
        key={`ty${y}`}
        x1="216"
        y1={y}
        x2="224"
        y2={y}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
    ))}

    {/* Cosine curve — dashed, light purple */}
    {/* cos: starts at peak (x=80,y=75), zero at x=150, trough at x=220, zero at x=290, peak at x=360 */}
    <path
      d="M 80,75 C 119,75 111,130 150,130 C 189,130 181,185 220,185 C 259,185 251,130 290,130 C 329,130 321,75 360,75"
      stroke="rgba(192,132,252,0.35)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="5 4"
    />

    {/* Sine curve — main, gradient */}
    {/* sin: zero at x=80, peak at x=150, zero at x=220, trough at x=290, zero at x=360 */}
    <path
      d="M 80,130 C 119,130 111,75 150,75 C 189,75 181,130 220,130 C 259,130 251,185 290,185 C 329,185 321,130 360,130"
      stroke="url(#sinGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Highlight points */}
    <circle cx="150" cy="75" r="4.5" fill="#9896f5" />
    <circle cx="290" cy="185" r="4.5" fill="#9896f5" />
    <circle
      cx="220"
      cy="130"
      r="3.5"
      fill="rgba(255,255,255,0.4)"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1"
    />

    {/* Point labels */}
    <text
      x="157"
      y="70"
      fill="rgba(152,150,245,0.9)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      max
    </text>
    <text
      x="297"
      y="200"
      fill="rgba(152,150,245,0.9)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      min
    </text>

    {/* Function label */}
    <text
      x="58"
      y="54"
      fill="rgba(152,150,245,0.75)"
      fontSize="12"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      f(x) = sin x
    </text>
    <text
      x="58"
      y="72"
      fill="rgba(192,132,252,0.5)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
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

        // Get dashboard URL based on user role from token
        const dashboardUrl = AuthService.getDashboardUrl();
        navigate(dashboardUrl);
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
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link" aria-label="Về trang chủ MathMaster">
            <span className="auth-logo-text-icon">∑π</span>
            <div>
              <h1>MathMaster</h1>
            </div>
          </Link>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>

        <MathGraph />

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
      <div className="auth-right">
        {/* Animated math decorations */}
        <div className="auth-right-deco" aria-hidden="true">
          {/* Floating formula chips */}
          <span className="rdeco-chip rdeco-chip--1">
            e<sup>iπ</sup> + 1 = 0
          </span>
          <span className="rdeco-chip rdeco-chip--2">∫₀^∞ e⁻ˣ dx = 1</span>
          <span className="rdeco-chip rdeco-chip--3">a² + b² = c²</span>
          <span className="rdeco-chip rdeco-chip--4">lim(x→∞)</span>

          {/* Animated SVG — orbiting ring */}
          <svg
            className="rdeco-orbit"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke="rgba(94,92,230,0.12)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <circle
              cx="100"
              cy="100"
              r="45"
              stroke="rgba(94,92,230,0.08)"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
            <circle
              className="rdeco-dot rdeco-dot--a"
              cx="170"
              cy="100"
              r="5"
              fill="rgba(94,92,230,0.45)"
            />
            <circle
              className="rdeco-dot rdeco-dot--b"
              cx="55"
              cy="100"
              r="3.5"
              fill="rgba(192,132,252,0.4)"
            />
          </svg>

          {/* Animated SVG — parabola trace */}
          <svg
            className="rdeco-parabola"
            viewBox="0 0 180 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10,90 Q90,5 170,90"
              stroke="rgba(94,92,230,0.2)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            <circle className="rdeco-tracer" r="4" fill="rgba(94,92,230,0.55)" />
          </svg>

          {/* Floating symbols */}
          <span className="rdeco-sym rdeco-sym--1">∑</span>
          <span className="rdeco-sym rdeco-sym--2">∞</span>
          <span className="rdeco-sym rdeco-sym--3">θ</span>
          <span className="rdeco-sym rdeco-sym--4">∂</span>
        </div>

        <Link to="/" className="auth-nav-link auth-nav" aria-label="Về trang chủ">
          ← Trang chủ
        </Link>
        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <h2>Đăng nhập</h2>
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
                    <EmailIcon />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control with-icon"
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
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control with-icon with-toggle"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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
                <Link to="/forgot-password" className="link-text">
                  Quên mật khẩu?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
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
