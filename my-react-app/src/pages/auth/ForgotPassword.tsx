import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import './Auth.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

const MailSentIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="mailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6b69f0" />
        <stop offset="100%" stopColor="#9896f5" />
      </linearGradient>
    </defs>
    {/* Circle bg */}
    <circle cx="32" cy="32" r="32" fill="url(#mailGrad)" opacity="0.12" />
    <circle cx="32" cy="32" r="26" fill="url(#mailGrad)" opacity="0.18" />
    {/* Envelope */}
    <rect x="14" y="22" width="36" height="24" rx="3" fill="url(#mailGrad)" />
    <polyline
      points="14,22 32,36 50,22"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Check badge */}
    <circle cx="46" cy="20" r="9" fill="#22c55e" />
    <polyline
      points="41,20 44.5,23.5 51,17"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ─── Decorative SVG — Lemniscate of Bernoulli (∞) ────────────────────────────

const MathLemniscate = () => (
  <svg
    className="auth-graph"
    viewBox="0 0 440 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="lemGradF" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9896f5" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>

    {/* Polar grid — concentric ellipses */}
    <ellipse cx="220" cy="130" rx="50" ry="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <ellipse cx="220" cy="130" rx="95" ry="55" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

    {/* Polar grid — radial lines */}
    {[0, 45, 90, 135].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x2 = Math.round(220 + 100 * Math.cos(rad));
      const y2 = Math.round(130 + 60 * Math.sin(rad));
      const x1 = Math.round(220 - 100 * Math.cos(rad));
      const y1 = Math.round(130 - 60 * Math.sin(rad));
      return (
        <line
          key={deg}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      );
    })}

    {/* Right lobe */}
    <path
      d="M 220,130 C 248,98 310,98 310,130 C 310,162 248,162 220,130"
      stroke="url(#lemGradF)"
      strokeWidth="2.5"
      fill="rgba(152,150,245,0.07)"
      strokeLinecap="round"
    />

    {/* Left lobe — dashed, softer */}
    <path
      d="M 220,130 C 192,98 130,98 130,130 C 130,162 192,162 220,130"
      stroke="rgba(192,132,252,0.6)"
      strokeWidth="2"
      fill="rgba(192,132,252,0.04)"
      strokeLinecap="round"
      strokeDasharray="5 3"
    />

    {/* Right lobe tip */}
    <circle cx="310" cy="130" r="4.5" fill="#9896f5" />
    {/* Left lobe tip */}
    <circle cx="130" cy="130" r="4.5" fill="#9896f5" />

    {/* Center crossing point */}
    <circle
      cx="220"
      cy="130"
      r="3.5"
      fill="rgba(255,255,255,0.5)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
    />

    {/* Equation label */}
    <text
      x="60"
      y="72"
      fill="rgba(152,150,245,0.88)"
      fontSize="13"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      (x² + y²)² = a²(x² − y²)
    </text>
    <text
      x="60"
      y="90"
      fill="rgba(192,132,252,0.5)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      Lemniscate of Bernoulli
    </text>

    {/* Small θ arc indicator */}
    <path
      d="M 238,130 A 18,18 0 0,0 234,116"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="1"
      fill="none"
    />
    <text
      x="240"
      y="122"
      fill="rgba(255,255,255,0.3)"
      fontSize="9"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      θ
    </text>

    {/* Tip labels */}
    <text
      x="316"
      y="127"
      fill="rgba(152,150,245,0.9)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      a
    </text>
    <text
      x="112"
      y="127"
      fill="rgba(152,150,245,0.9)"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontStyle="italic"
    >
      −a
    </text>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await AuthService.forgotPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
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

        <MathLemniscate />

        <blockquote className="auth-quote">
          <p>"Không có vấn đề nào trong toán học không thể giải quyết được."</p>
          <footer>— David Hilbert</footer>
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
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx="100" cy="30" r="5" fill="rgba(94,92,230,0.4)" />
          </svg>

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
            {isSuccess ? (
              /* ── Success state ── */
              <div className="reg-success">
                <div className="reg-success__icon-wrap">
                  <div className="reg-success__icon">
                    <MailSentIcon />
                  </div>
                </div>
                <h2 className="reg-success__title">Kiểm tra hộp thư!</h2>
                <p className="reg-success__body">
                  Nếu địa chỉ <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link
                  đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư mục spam).
                </p>
                <span className="reg-success__hint">
                  ⏱ Link có hiệu lực trong <strong>15 phút</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-block reg-success__btn"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                >
                  Gửi lại email
                </button>
                <div
                  className="auth-footer"
                  style={{ marginTop: '1.25rem', width: '100%', maxWidth: '320px' }}
                >
                  <p>
                    <Link to="/login" className="link-primary">
                      Quay lại đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Request form ── */
              <>
                <div className="auth-header">
                  <h2>Quên mật khẩu</h2>
                  <p>Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
                        value={email}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isLoading}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="btn-spinner" /> Đang gửi...
                      </>
                    ) : (
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    Nhớ mật khẩu rồi?{' '}
                    <Link to="/login" className="link-primary">
                      Đăng nhập
                    </Link>
                  </p>
                  <p>
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="link-primary">
                      Đăng ký ngay
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

export default ForgotPassword;
