import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="homepage-footer">
      <div className="container">
        <div className="footer-content">
          {/* Column 1: Logo + Name */}
          <div className="footer-column">
            <img
              className="footer-logo-img"
              src="https://gcdn.fx2.io/math-master.org/_nuxt/footer-logo.aa70d0bf.svg"
              alt="MathMaster logo"
              width="56"
              height="64"
            />
            <p className="footer-brand-name">MathMaster</p>
          </div>

          {/* Column 2: Follow Us */}
          <div className="footer-column">
            <h4 className="footer-title">Theo dõi chúng tôi</h4>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.06c-5.5 0-10 4.5-10 10c0 4.94 3.61 9.06 8.33 9.89v-7.06h-2.5v-2.78h2.5V9.84c0-2.5 1.61-3.89 3.89-3.89c.72 0 1.5.11 2.22.22v2.56h-1.28c-1.22 0-1.5.61-1.5 1.39v1.94h2.67l-.44 2.78h-2.22v7.06c4.72-.83 8.33-4.94 8.33-9.89c0-5.5-4.5-10-10-10" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7.377a4.623 4.623 0 1 0 0 9.248a4.623 4.623 0 0 0 0-9.248m0 7.627a3.004 3.004 0 1 1 0-6.008a3.004 3.004 0 0 1 0 6.008m4.807-8.875a1.078 1.078 0 1 0 0 2.156a1.078 1.078 0 1 0 0-2.156" />
                  <path d="M20.533 6.111A4.6 4.6 0 0 0 17.9 3.479a6.6 6.6 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.6 6.6 0 0 0-2.184.42a4.6 4.6 0 0 0-2.633 2.632a6.6 6.6 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71s0 2.753.056 3.71c.015.748.156 1.486.419 2.187a4.6 4.6 0 0 0 2.634 2.632a6.6 6.6 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.6 6.6 0 0 0 2.186-.419a4.6 4.6 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186c.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.6 6.6 0 0 0-.421-2.217m-1.218 9.532a5 5 0 0 1-.311 1.688a3 3 0 0 1-1.712 1.711a5 5 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055c-2.438 0-2.687 0-3.655-.055a5 5 0 0 1-1.669-.311a3 3 0 0 1-1.719-1.711a5.1 5.1 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654s0-2.686.053-3.655a5 5 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5 5 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a5 5 0 0 1 1.67.311a3 3 0 0 1 1.712 1.712a5.1 5.1 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655s0 2.698-.043 3.654z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-column">
            <h4 className="footer-title">Tài nguyên</h4>
            <ul className="footer-links">
              <li><Link to="/features">Tính năng</Link></li>
              <li><Link to="/pricing">Bảng giá</Link></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#docs">Tài liệu</a></li>
              <li><Link to="/contact">Liên hệ</Link></li>
              <li><a href="#terms">Điều khoản</a></li>
            </ul>
          </div>

          {/* Column 4: Product */}
          <div className="footer-column">
            <h4 className="footer-title">Sản phẩm</h4>
            <div className="footer-app-buttons">
              <Link to="/register" className="footer-app-btn footer-app-btn--primary">
                Dùng thử ngay
                <span className="btn-icon">→</span>
              </Link>
              <Link to="/about" className="footer-app-btn footer-app-btn--dark">
                Về chúng tôi
                <span className="btn-icon">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">2026 © MathMaster - SP26SE026. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
