import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import type { RegisterRequest } from '../../types/auth.types';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

const UserIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="7" r="3.5" />
    <path d="M2.5 18c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
  </svg>
);

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

const MathRose = () => (
  <svg
    className="auth-graph"
    viewBox="0 0 440 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="roseGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9896f5" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>

    {/* Polar grid — concentric circles */}
    <circle cx="220" cy="130" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <circle cx="220" cy="130" r="85" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

    {/* Polar grid — radial lines every 45° */}
    <line x1="220" y1="130" x2="315" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="287" y2="63" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="220" y2="35" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="153" y2="63" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="125" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="153" y2="197" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="220" y2="225" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="287" y2="197" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

    {/* 4-petal rose  r = cos(2θ) */}
    {/* Right petal */}
    <path
      d="M 220,130 C 248,105 305,105 305,130 C 305,155 248,155 220,130"
      stroke="url(#roseGradReg)"
      strokeWidth="2.2"
      fill="rgba(152,150,245,0.08)"
      strokeLinecap="round"
    />
    {/* Left petal */}
    <path
      d="M 220,130 C 192,105 135,105 135,130 C 135,155 192,155 220,130"
      stroke="rgba(192,132,252,0.72)"
      strokeWidth="2.2"
      fill="rgba(192,132,252,0.05)"
      strokeLinecap="round"
    />
    {/* Bottom petal */}
    <path
      d="M 220,130 C 195,158 195,215 220,215 C 245,215 245,158 220,130"
      stroke="url(#roseGradReg)"
      strokeWidth="2.2"
      fill="rgba(152,150,245,0.08)"
      strokeLinecap="round"
    />
    {/* Top petal */}
    <path
      d="M 220,130 C 195,102 195,45 220,45 C 245,45 245,102 220,130"
      stroke="rgba(192,132,252,0.72)"
      strokeWidth="2.2"
      fill="rgba(192,132,252,0.05)"
      strokeLinecap="round"
    />

    {/* Petal tip dots */}
    <circle cx="305" cy="130" r="4.5" fill="#9896f5" />
    <circle cx="135" cy="130" r="4.5" fill="#9896f5" />
    <circle cx="220" cy="215" r="4.5" fill="#9896f5" />
    <circle cx="220" cy="45" r="4.5" fill="#9896f5" />

    {/* Center dot */}
    <circle
      cx="220"
      cy="130"
      r="3"
      fill="rgba(255,255,255,0.5)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
    />

    {/* Equation label */}
    <text
      x="322"
      y="115"
      fill="rgba(152,150,245,0.88)"
      fontSize="13"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      r = cos 2θ
    </text>
    <text
      x="322"
      y="132"
      fill="rgba(192,132,252,0.45)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      Polar Rose
    </text>

    {/* Angle labels */}
    <text x="308" y="127" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="Georgia, serif">
      0°
    </text>
    <text x="223" y="32" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="Georgia, serif">
      90°
    </text>
    <text x="108" y="127" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="Georgia, serif">
      180°
    </text>
    <text x="223" y="240" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="Georgia, serif">
      270°
    </text>

    {/* Small θ arc indicator near center */}
    <path
      d="M 238,130 A 18,18 0 0,0 233,117"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="1"
      fill="none"
    />
    <text
      x="239"
      y="122"
      fill="rgba(255,255,255,0.3)"
      fontSize="9"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      θ
    </text>
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          submit: error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.',
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
          localStorage.setItem('pendingRoleSelection', 'true');
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

        <MathRose />

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
          {/* Formula chips — different from Login */}
          <span className="rdeco-chip rdeco-chip--1">∇²φ = 0</span>
          <span className="rdeco-chip rdeco-chip--2">det(A − λI) = 0</span>
          <span className="rdeco-chip rdeco-chip--3">P(A|B) = P(AB)/P(B)</span>
          <span className="rdeco-chip rdeco-chip--4">x̄ = Σxᵢ/n</span>

          {/* Animated SVG — hexagram (two overlapping triangles) */}
          <svg
            className="rdeco-orbit"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Triangle pointing up */}
            <polygon
              points="100,28 174,152 26,152"
              stroke="rgba(94,92,230,0.18)"
              strokeWidth="1.5"
              fill="rgba(94,92,230,0.04)"
              strokeLinejoin="round"
            />
            {/* Triangle pointing down */}
            <polygon
              points="100,172 26,48 174,48"
              stroke="rgba(192,132,252,0.18)"
              strokeWidth="1.5"
              fill="rgba(192,132,252,0.04)"
              strokeLinejoin="round"
            />
            {/* Center dot */}
            <circle cx="100" cy="100" r="3.5" fill="rgba(152,150,245,0.5)" />
            {/* Animated vertex dots */}
            <circle
              className="rdeco-dot rdeco-dot--a"
              cx="100"
              cy="28"
              r="4.5"
              fill="rgba(94,92,230,0.5)"
            />
            <circle
              className="rdeco-dot rdeco-dot--b"
              cx="100"
              cy="172"
              r="3.5"
              fill="rgba(192,132,252,0.45)"
            />
          </svg>

          {/* Animated SVG — Archimedean spiral with tracer */}
          <svg
            className="rdeco-parabola"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 90,90
                 C 90,80 100,76 108,82
                 C 116,88 116,102 106,110
                 C 96,118 80,116 72,104
                 C 64,92 66,74 78,64
                 C 90,54 108,54 120,64
                 C 132,74 136,92 130,108
                 C 124,124 108,132 90,130"
              stroke="rgba(94,92,230,0.22)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            <circle className="rdeco-tracer" r="4" fill="rgba(94,92,230,0.6)" />
          </svg>

          {/* Floating symbols — different from Login */}
          <span className="rdeco-sym rdeco-sym--1">λ</span>
          <span className="rdeco-sym rdeco-sym--2">φ</span>
          <span className="rdeco-sym rdeco-sym--3">Ω</span>
          <span className="rdeco-sym rdeco-sym--4">∇</span>
        </div>

        <Link to="/" className="auth-nav-link auth-nav" aria-label="Về trang chủ">
          ← Trang chủ
        </Link>
        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <h2>Tạo tài khoản</h2>
              <p>Bắt đầu hành trình học toán với MathMaster</p>
            </div>

            {successMessage ? (
              <div className="reg-success">
                <div className="reg-success__icon-wrap">
                  <svg
                    className="reg-success__icon"
                    viewBox="0 0 52 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="26"
                      cy="26"
                      r="25"
                      stroke="#22c55e"
                      strokeWidth="2"
                      fill="rgba(34,197,94,0.08)"
                    />
                    <path
                      d="M15 26.5l8 8 14-16"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="reg-success__title">Đăng ký thành công!</h3>
                <p className="reg-success__body">
                  Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác nhận để kích hoạt tài khoản.
                </p>
                <div className="reg-success__hint">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <rect x="2" y="5" width="16" height="12" rx="2" />
                    <polyline points="2,5 10,12 18,5" />
                  </svg>
                  Không thấy email? Kiểm tra thư mục <strong>Spam / Junk</strong>.
                </div>
                <Link to="/login" className="btn btn-primary btn-block reg-success__btn">
                  Đến trang đăng nhập →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

                <div className="form-group">
                  <label htmlFor="userName" className="form-label">
                    Tên người dùng
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">
                      <UserIcon />
                    </span>
                    <input
                      type="text"
                      id="userName"
                      name="userName"
                      className={`form-control with-icon${errors.userName ? ' error' : ''}`}
                      placeholder="username"
                      value={formData.userName}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                  {errors.userName && <span className="form-error">{errors.userName}</span>}
                </div>

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
                      className={`form-control with-icon${errors.email ? ' error' : ''}`}
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
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
                      className={`form-control with-icon with-toggle${errors.password ? ' error' : ''}`}
                      placeholder="Mật khẩu"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
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
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Xác nhận mật khẩu
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">
                      <LockIcon />
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-control with-icon with-toggle${errors.confirmPassword ? ' error' : ''}`}
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
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
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" /> Đang tạo tài khoản...
                    </>
                  ) : (
                    <>Tạo tài khoản →</>
                  )}
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
          {/* end auth-card-inner */}
        </div>
      </div>
    </div>
  );
};

export default Register;
