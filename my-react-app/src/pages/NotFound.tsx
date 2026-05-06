import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/api/auth.service';
import './NotFound.css';

const MATH_SYMBOLS = [
  '∑',
  'π',
  '∫',
  '√',
  'Δ',
  '∞',
  '±',
  '÷',
  '×',
  '≈',
  '∂',
  'θ',
  'λ',
  'φ',
  'Ω',
  '∇',
];

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const countRef = useRef<HTMLSpanElement>(null);
  const homeUrl = AuthService.isAuthenticated() ? AuthService.getDashboardUrl() : '/';

  /* Counting animation for 404 */
  useEffect(() => {
    const target = 404;
    let current = 0;
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      if (countRef.current) {
        countRef.current.textContent = Math.round(current).toString();
      }
      if (current >= target) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="nf-root">
      {/* Ambient gradient blobs */}
      <div className="nf-blob nf-blob-1" aria-hidden="true" />
      <div className="nf-blob nf-blob-2" aria-hidden="true" />
      <div className="nf-blob nf-blob-3" aria-hidden="true" />

      {/* Floating math symbols */}
      <div className="nf-symbols" aria-hidden="true">
        {MATH_SYMBOLS.map((sym) => (
          <span key={sym} className={`nf-sym nf-sym-${MATH_SYMBOLS.indexOf(sym) + 1}`}>
            {sym}
          </span>
        ))}
      </div>

      {/* Grid overlay */}
      <div className="nf-grid" aria-hidden="true" />

      {/* Header */}
      <header className="nf-header">
        <Link to={homeUrl} className="nf-logo">
          <span className="nf-logo-icon">∑π</span>
          <span className="nf-logo-text">MathMaster</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="nf-main">
        {/* Equation badge */}
        <div className="nf-equation-badge">
          <span className="nf-eq-text">
            lim<sub>x→∞</sub> Error(x) = 404
          </span>
        </div>

        {/* Big 404 */}
        <div className="nf-code-wrapper">
          <div className="nf-code-bg" aria-hidden="true">
            404
          </div>
          <h1 className="nf-code">
            <span ref={countRef}>0</span>
          </h1>
        </div>

        {/* Divider with formula */}
        <div className="nf-formula-row" aria-hidden="true">
          <div className="nf-formula-line" />
          <span className="nf-formula-chip">P(trang tồn tại) = 0</span>
          <div className="nf-formula-line" />
        </div>

        <h2 className="nf-heading">Trang không tìm thấy</h2>

        <p className="nf-desc">
          Phương trình này không có nghiệm — trang bạn đang tìm không tồn tại,
          <br />
          đã bị xóa, hoặc URL chứa lỗi cú pháp.
        </p>

        {/* Quick links */}
        <div className="nf-quick">
          <span className="nf-quick-label">Thử tìm tại:</span>
          <a href="/dashboard" className="nf-quick-link">
            Dashboard
          </a>
          <a href="/roadmaps" className="nf-quick-link">
            Lộ trình học
          </a>
          <a href="/help" className="nf-quick-link">
            Trợ giúp
          </a>
        </div>

        {/* CTA buttons */}
        <div className="nf-actions">
          <button className="nf-btn nf-btn-ghost" onClick={() => navigate(-1)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại
          </button>
          <Link to={homeUrl} className="nf-btn nf-btn-primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Về trang chủ
          </Link>
        </div>

        {/* Decorative math card */}
        <div className="nf-card" aria-hidden="true">
          <div className="nf-card-row">
            <span className="nf-card-sym">∅</span>
            <span className="nf-card-text">Tập hợp rỗng — không có phần tử nào được tìm thấy</span>
          </div>
          <div className="nf-card-divider" />
          <div className="nf-card-formula">
            <span>f(url) </span>
            <span className="nf-card-op">→</span>
            <span className="nf-card-result"> undefined</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="nf-footer">
        <p>
          © 2026 MathMaster ·{' '}
          <Link to="/contact" className="nf-footer-link">
            Liên hệ hỗ trợ
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default NotFound;
