import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

type Status = 'loading' | 'success' | 'error';

/* ── Reusable left-panel rose (same as Register) ── */
const MathRose = () => (
  <svg
    className="auth-graph"
    viewBox="0 0 440 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="roseGradCE" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9896f5" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>
    <circle cx="220" cy="130" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <circle cx="220" cy="130" r="85" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
    <line x1="220" y1="130" x2="315" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="287" y2="63" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="220" y2="35" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="153" y2="63" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="125" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="153" y2="197" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="220" y2="225" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <line x1="220" y1="130" x2="287" y2="197" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <path
      d="M 220,130 C 248,105 305,105 305,130 C 305,155 248,155 220,130"
      stroke="url(#roseGradCE)"
      strokeWidth="2.2"
      fill="rgba(152,150,245,0.08)"
      strokeLinecap="round"
    />
    <path
      d="M 220,130 C 192,105 135,105 135,130 C 135,155 192,155 220,130"
      stroke="rgba(192,132,252,0.72)"
      strokeWidth="2.2"
      fill="rgba(192,132,252,0.05)"
      strokeLinecap="round"
    />
    <path
      d="M 220,130 C 195,158 195,215 220,215 C 245,215 245,158 220,130"
      stroke="url(#roseGradCE)"
      strokeWidth="2.2"
      fill="rgba(152,150,245,0.08)"
      strokeLinecap="round"
    />
    <path
      d="M 220,130 C 195,102 195,45 220,45 C 245,45 245,102 220,130"
      stroke="rgba(192,132,252,0.72)"
      strokeWidth="2.2"
      fill="rgba(192,132,252,0.05)"
      strokeLinecap="round"
    />
    <circle cx="305" cy="130" r="4.5" fill="#9896f5" />
    <circle cx="135" cy="130" r="4.5" fill="#9896f5" />
    <circle cx="220" cy="215" r="4.5" fill="#9896f5" />
    <circle cx="220" cy="45" r="4.5" fill="#9896f5" />
    <circle
      cx="220"
      cy="130"
      r="3"
      fill="rgba(255,255,255,0.5)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
    />
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
  </svg>
);

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(() => (token ? 'loading' : 'error'));
  const [errorMessage, setErrorMessage] = useState<string>(() =>
    token ? '' : 'Liên kết xác nhận không hợp lệ.'
  );
  const [countdown, setCountdown] = useState(5);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (!token) return;

    AuthService.confirmEmail(token)
      .then((res) => {
        if (res.code === 1000) {
          setStatus('success');
        } else {
          setErrorMessage('Xác nhận email thất bại. Vui lòng thử lại.');
          setStatus('error');
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === 1006) {
          setErrorMessage(
            'Liên kết xác nhận này không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.'
          );
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : 'Xác nhận email thất bại. Vui lòng thử lại.'
          );
        }
        setStatus('error');
      });
  }, [searchParams, navigate]);

  /* countdown after success */
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, navigate]);

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
        <Link to="/" className="auth-nav-link auth-nav" aria-label="Về trang chủ">
          ← Trang chủ
        </Link>

        <div className="auth-card">
          <div className="auth-card-inner">
            {/* LOADING */}
            {status === 'loading' && (
              <div className="ce-status">
                <div className="ce-status__spinner" aria-label="Đang xác nhận" />
                <h2 className="ce-status__title">Đang xác nhận…</h2>
                <p className="ce-status__body">
                  Vui lòng chờ trong giây lát, chúng tôi đang kích hoạt tài khoản của bạn.
                </p>
              </div>
            )}

            {/* SUCCESS */}
            {status === 'success' && (
              <div className="ce-status">
                <div className="ce-status__icon-wrap ce-status__icon-wrap--success">
                  <svg
                    viewBox="0 0 52 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ce-status__icon"
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
                <h2 className="ce-status__title">Tài khoản đã được kích hoạt!</h2>
                <p className="ce-status__body">
                  Email của bạn đã được xác nhận thành công. Bạn có thể đăng nhập ngay bây giờ.
                </p>
                <div className="ce-status__countdown">
                  <span>Tự động chuyển trang sau </span>
                  <strong>{countdown}s</strong>
                </div>
                <Link to="/login" className="btn btn-primary btn-block ce-status__btn">
                  Đăng nhập ngay →
                </Link>
              </div>
            )}

            {/* ERROR */}
            {status === 'error' && (
              <div className="ce-status">
                <div className="ce-status__icon-wrap ce-status__icon-wrap--error">
                  <svg
                    viewBox="0 0 52 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ce-status__icon"
                  >
                    <circle
                      cx="26"
                      cy="26"
                      r="25"
                      stroke="#ef4444"
                      strokeWidth="2"
                      fill="rgba(239,68,68,0.08)"
                    />
                    <line
                      x1="17"
                      y1="17"
                      x2="35"
                      y2="35"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="35"
                      y1="17"
                      x2="17"
                      y2="35"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2 className="ce-status__title">Xác nhận thất bại</h2>
                <p className="ce-status__body">{errorMessage}</p>
                <div className="ce-status__actions">
                  <Link to="/register" className="btn btn-primary ce-status__btn--half">
                    Đăng ký lại
                  </Link>
                  <Link to="/login" className="btn btn-outline ce-status__btn--half">
                    Đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
