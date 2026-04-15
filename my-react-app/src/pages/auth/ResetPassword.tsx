import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// Decorative SVG — Spiral / golden ratio
const MathSpiral = () => (
  <svg
    className="auth-graph"
    viewBox="0 0 440 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9896f5" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>

    {/* Grid lines */}
    {[80, 150, 220, 290, 360].map((x) => (
      <line
        key={`v${x}`}
        x1={x}
        y1="20"
        x2={x}
        y2="240"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
    ))}
    {[75, 130, 185].map((y) => (
      <line
        key={`h${y}`}
        x1="40"
        y1={y}
        x2="410"
        y2={y}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
    ))}

    {/* Fibonacci rectangles (outline only) */}
    <rect
      x="130"
      y="75"
      width="110"
      height="110"
      stroke="rgba(255,255,255,0.07)"
      strokeWidth="1"
      fill="none"
    />
    <rect
      x="240"
      y="75"
      width="68"
      height="68"
      stroke="rgba(255,255,255,0.07)"
      strokeWidth="1"
      fill="none"
    />
    <rect
      x="240"
      y="143"
      width="68"
      height="42"
      stroke="rgba(255,255,255,0.07)"
      strokeWidth="1"
      fill="none"
    />
    <rect
      x="130"
      y="185"
      width="110"
      height="42"
      stroke="rgba(255,255,255,0.07)"
      strokeWidth="1"
      fill="none"
    />

    {/* Golden spiral approximate */}
    <path
      d="M 240,130 Q 240,75 185,75 Q 130,75 130,130 Q 130,185 185,185 Q 240,185 240,163 Q 240,143 274,143 Q 308,143 308,111 Q 308,75 274,75"
      stroke="url(#spiralGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Dashed extension */}
    <path
      d="M 274,75 Q 308,75 308,43"
      stroke="rgba(192,132,252,0.4)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="5 4"
      fill="none"
    />

    {/* Highlight dots */}
    <circle cx="240" cy="130" r="4.5" fill="#9896f5" />
    <circle cx="185" cy="75" r="3.5" fill="rgba(152,150,245,0.7)" />
    <circle cx="308" cy="143" r="3" fill="rgba(192,132,252,0.6)" />

    {/* Label */}
    <text
      x="56"
      y="56"
      fill="rgba(152,150,245,0.88)"
      fontSize="13"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      φ = (1 + √5) / 2
    </text>
    <text
      x="56"
      y="73"
      fill="rgba(192,132,252,0.5)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      Golden Ratio
    </text>
  </svg>
);

// ─── Password strength helpers ────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pw)) score++;
  return score as StrengthLevel;
}

const strengthLabel: Record<StrengthLevel, string> = {
  0: '',
  1: 'Yếu',
  2: 'Trung bình',
  3: 'Khá',
  4: 'Mạnh',
};

const strengthColor: Record<StrengthLevel, string> = {
  0: 'transparent',
  1: '#ef4444',
  2: '#f59e0b',
  3: '#3b82f6',
  4: '#22c55e',
};

// ─── Component ───────────────────────────────────────────────────────────────

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!token) setTokenMissing(true);
  }, [token]);

  const strength = getStrength(formData.newPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const pw = formData.newPassword;

    if (!pw) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (pw.length < 8 || pw.length > 128) {
      newErrors.newPassword = 'Mật khẩu phải từ 8 đến 128 ký tự';
    } else if (!/[A-Z]/.test(pw)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một chữ hoa';
    } else if (!/[a-z]/.test(pw)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một chữ thường';
    } else if (!/\d/.test(pw)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một chữ số';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pw)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await AuthService.resetPassword({ token, newPassword: formData.newPassword });
      setIsSuccess(true);
      // Auto-redirect to login after 4 seconds
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      if (err instanceof ApiError && err.code === 1006) {
        setErrors({
          submit: 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại.',
        });
      } else {
        setErrors({
          submit:
            err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsLoading(false);
    }
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

        <MathSpiral />

        <blockquote className="auth-quote">
          <p>"Toán học là nơi ngôn ngữ của lý trí trở nên trong sáng nhất."</p>
          <footer>— Gottfried Wilhelm Leibniz</footer>
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
        <div className="auth-right-deco" aria-hidden="true">
          <span className="rdeco-chip rdeco-chip--1">
            e<sup>iπ</sup> + 1 = 0
          </span>
          <span className="rdeco-chip rdeco-chip--2">∫₀^∞ e⁻ˣ dx = 1</span>
          <span className="rdeco-chip rdeco-chip--3">a² + b² = c²</span>
          <span className="rdeco-chip rdeco-chip--4">lim(x→∞)</span>
          <svg className="rdeco-orbit" viewBox="0 0 200 200" fill="none">
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke="rgba(94,92,230,0.12)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx="100" cy="30" r="5" fill="rgba(94,92,230,0.4)" />
          </svg>
          <svg className="rdeco-parabola" viewBox="0 0 180 100" fill="none">
            <path
              d="M10,90 Q90,5 170,90"
              stroke="rgba(94,92,230,0.2)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            <circle className="rdeco-tracer" r="4" fill="rgba(94,92,230,0.55)" />
          </svg>
          <span className="rdeco-sym rdeco-sym--1">∑</span>
          <span className="rdeco-sym rdeco-sym--2">∞</span>
          <span className="rdeco-sym rdeco-sym--3">θ</span>
          <span className="rdeco-sym rdeco-sym--4">∂</span>
        </div>

        <Link to="/login" className="auth-nav-link auth-nav" aria-label="Quay lại đăng nhập">
          ← Quay lại đăng nhập
        </Link>

        <div className="auth-card">
          <div className="auth-card-inner">
            {/* ── Token missing ── */}
            {tokenMissing ? (
              <div className="rp-state rp-state--error">
                <div className="rp-state__icon">
                  <svg viewBox="0 0 64 64" fill="none">
                    <defs>
                      <linearGradient id="errGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" fill="#fef2f2" />
                    <circle cx="32" cy="32" r="24" fill="#fee2e2" />
                    <line
                      x1="22"
                      y1="22"
                      x2="42"
                      y2="42"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="42"
                      y1="22"
                      x2="22"
                      y2="42"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2 className="rp-state__title">Link không hợp lệ</h2>
                <p className="rp-state__body">
                  Link đặt lại mật khẩu không đúng định dạng. Vui lòng yêu cầu gửi lại email.
                </p>
                <Link to="/forgot-password" className="btn btn-primary btn-block rp-state__btn">
                  Gửi lại email
                </Link>
              </div>
            ) : isSuccess ? (
              /* ── Success ── */
              <div className="rp-state rp-state--success">
                <div className="rp-state__icon">
                  <svg viewBox="0 0 64 64" fill="none">
                    <defs>
                      <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6b69f0" />
                        <stop offset="100%" stopColor="#9896f5" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" fill="rgba(94,92,230,0.08)" />
                    <circle cx="32" cy="32" r="24" fill="rgba(94,92,230,0.12)" />
                    <circle cx="32" cy="32" r="18" fill="url(#successGrad)" />
                    <polyline
                      points="23,32 29,38 41,26"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <h2 className="rp-state__title">Mật khẩu đã được đặt lại!</h2>
                <p className="rp-state__body">
                  Tài khoản của bạn đã được bảo vệ. Bạn sẽ được chuyển đến trang đăng nhập sau vài
                  giây.
                </p>
                <div className="rp-state__hint">
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                    <path
                      d="M8 5v3.5l2 2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  Đang chuyển hướng về đăng nhập...
                </div>
                <Link to="/login" className="btn btn-primary btn-block rp-state__btn">
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="auth-header">
                  <h2>Đặt lại mật khẩu</h2>
                  <p>Tạo mật khẩu mới mạnh và chưa từng dùng trước đây</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  {errors.submit && (
                    <div className="alert alert-error rp-alert-error">
                      <span className="rp-alert-error__msg">
                        {errors.submit.replace(' Vui lòng yêu cầu gửi lại.', '')}
                      </span>
                      {errors.submit.includes('hết hạn') && (
                        <Link to="/forgot-password" className="rp-alert-error__link">
                          Gửi lại email →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* New password */}
                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      Mật khẩu mới
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon">
                        <LockIcon />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        className={`form-control with-icon with-toggle${errors.newPassword ? ' error' : ''}`}
                        placeholder="••••••••"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        autoFocus
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
                    {/* Strength bar */}
                    {formData.newPassword && (
                      <div className="rp-strength">
                        <div className="rp-strength__bar">
                          {([1, 2, 3, 4] as StrengthLevel[]).map((lvl) => (
                            <div
                              key={lvl}
                              className="rp-strength__segment"
                              style={{
                                background: strength >= lvl ? strengthColor[strength] : '#e8e5f0',
                              }}
                            />
                          ))}
                        </div>
                        <span
                          className="rp-strength__label"
                          style={{ color: strengthColor[strength] }}
                        >
                          {strengthLabel[strength]}
                        </span>
                      </div>
                    )}
                    {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
                  </div>

                  {/* Confirm password */}
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
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
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

                  {/* Requirements hint */}
                  <p className="rp-hint">
                    Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isLoading}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="btn-spinner" /> Đang xử lý...
                      </>
                    ) : (
                      'Đặt lại mật khẩu'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    <Link to="/login" className="link-primary">
                      ← Quay lại đăng nhập
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
