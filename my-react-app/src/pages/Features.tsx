import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import './Pages.css';

const Features: React.FC = () => {
  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="container">
          <nav className="navbar">
            <div className="navbar-brand">
              <Link to="/" className="logo">
                <span className="logo-icon">∑π</span>
                <span className="logo-text">MathMaster</span>
              </Link>
            </div>
            <div className="navbar-menu">
              <Link to="/features" className="nav-link active">
                Tính năng
              </Link>
              <Link to="/about" className="nav-link">
                Về chúng tôi
              </Link>
              <Link to="/pricing" className="nav-link">
                Giá cả
              </Link>
              <Link to="/contact" className="nav-link">
                Liên hệ
              </Link>
            </div>
            <div className="navbar-actions">
              <Link to="/login" className="btn btn-outline-white">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary-gradient">
                Đăng ký miễn phí
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero — clean, matching Homepage style */}
      <section className="features-page-hero">
        <div className="features-hero-dots" aria-hidden="true" />
        <div className="container">
          <div className="features-hero-content">
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.5rem' }}>Nền tảng #1</span>
            <h1 className="features-hero-title">
              Tính năng <span className="gradient-text">Vượt trội</span>
            </h1>
            <p className="features-hero-desc">
              Khám phá các tính năng mạnh mẽ giúp giáo viên tiết kiệm thời gian và nâng cao chất lượng giảng dạy
            </p>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="features-page-grid">
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="fp-bento">

            {/* Card 1 — AI Trợ lý — Hero card */}
            <div className="ft-card ft-card--hero fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--purple">AI-Powered</span>
              <div className="ft-icon ft-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 0 1 1h1a4 4 0 0 1 0 8h-1a1 1 0 0 0-1 1v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1H6a4 4 0 0 1 0-8h1a1 1 0 0 0 1-1V6a4 4 0 0 1 4-4z" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="ft-title">AI Trợ lý giảng dạy</h3>
              <p className="ft-desc">
                Tạo bài giảng, đề kiểm tra và bài tập tự động với AI thông minh. Chỉ cần mô tả yêu cầu — AI tạo ngay nội dung chuẩn chương trình.
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Tự động tạo đề thi theo chuẩn
                </li>
                <li>
                  <span className="fp-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Gợi ý phương pháp giảng dạy
                </li>
                <li>
                  <span className="fp-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Phân tích điểm mạnh/yếu học sinh
                </li>
              </ul>
            </div>

            {/* Card 2 — Đồ thị */}
            <div className="ft-card fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--green">Auto</span>
              <div className="ft-icon ft-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="ft-title">Vẽ đồ thị thông minh</h3>
              <p className="ft-desc">
                Công cụ vẽ đồ thị toán học chuyên nghiệp và dễ sử dụng
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check fp-check--green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Hỗ trợ đa dạng loại đồ thị
                </li>
                <li>
                  <span className="fp-check fp-check--green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Xuất file chất lượng cao
                </li>
                <li>
                  <span className="fp-check fp-check--green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Thư viện mẫu phong phú
                </li>
              </ul>
            </div>

            {/* Card 3 — Quản lý nội dung */}
            <div className="ft-card fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--blue">Smart</span>
              <div className="ft-icon ft-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <h3 className="ft-title">Quản lý nội dung</h3>
              <p className="ft-desc">
                Tổ chức và quản lý tài liệu giảng dạy hiệu quả
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check fp-check--blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Lưu trữ không giới hạn
                </li>
                <li>
                  <span className="fp-check fp-check--blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Tìm kiếm thông minh
                </li>
                <li>
                  <span className="fp-check fp-check--blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Chia sẻ dễ dàng
                </li>
              </ul>
            </div>

            {/* Card 4 — Quản lý lớp học */}
            <div className="ft-card fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--orange">Toàn diện</span>
              <div className="ft-icon ft-icon--orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="ft-title">Quản lý lớp học</h3>
              <p className="ft-desc">
                Theo dõi tiến độ học tập của từng học sinh
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check fp-check--orange">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Điểm danh tự động
                </li>
                <li>
                  <span className="fp-check fp-check--orange">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Báo cáo chi tiết
                </li>
                <li>
                  <span className="fp-check fp-check--orange">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Giao tiếp phụ huynh
                </li>
              </ul>
            </div>

            {/* Card 5 — Tạo bài tập */}
            <div className="ft-card fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--pink">Nhanh</span>
              <div className="ft-icon ft-icon--pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 className="ft-title">Tạo bài tập</h3>
              <p className="ft-desc">
                Thiết kế bài tập đa dạng và chấm điểm tự động
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check fp-check--pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Ngân hàng câu hỏi lớn
                </li>
                <li>
                  <span className="fp-check fp-check--pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Chấm điểm tự động
                </li>
                <li>
                  <span className="fp-check fp-check--pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Phản hồi chi tiết
                </li>
              </ul>
            </div>

            {/* Card 6 — Phân tích — Wide card */}
            <div className="ft-card ft-card--wide fp-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--teal">Insights</span>
              <div className="ft-icon ft-icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="ft-title">Phân tích & Báo cáo</h3>
              <p className="ft-desc">
                Dashboard thống kê trực quan và dễ hiểu. Theo dõi tiến độ lớp học, so sánh kết quả và xuất báo cáo chuyên nghiệp.
              </p>
              <ul className="fp-details">
                <li>
                  <span className="fp-check fp-check--teal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Biểu đồ trực quan
                </li>
                <li>
                  <span className="fp-check fp-check--teal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Xuất báo cáo PDF
                </li>
                <li>
                  <span className="fp-check fp-check--teal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  So sánh tiến độ
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Sẵn sàng <span className="gradient-text">nâng cao</span> chất lượng giảng dạy?
            </h2>
            <p className="cta-description">
              Đăng ký ngay để nhận 30 ngày dùng thử miễn phí
            </p>
            <Link to="/register" className="btn btn-cta-primary">
              Bắt đầu ngay
              <span className="btn-icon">→</span>
            </Link>
            <p className="cta-note">Không cần thẻ tín dụng • Hủy bất cứ lúc nào</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-bottom">
            <p className="footer-copyright">2026 © MathMaster - SP26SE026. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;
