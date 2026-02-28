import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage: React.FC = () => {
  return (
    <div className="homepage">
      {/* Header / Navigation */}
      <header className="homepage-header">
        <div className="container">
          <nav className="navbar">
            <div className="navbar-brand">
              <div className="logo">
                <span className="logo-icon">∑π</span>
                <span className="logo-text">MathMaster</span>
              </div>
            </div>
            <div className="navbar-menu">
              <Link to="/features" className="nav-link">
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

      {/* Hero Section */}
      <section className="hero-section">
        {/* Refined Decorative System — intentional, cohesive, depth-layered */}
        <div className="hero-decorations">
          {/* Gradient orbs — background depth layer */}
          <div className="deco-orb orb-1" aria-hidden="true"></div>
          <div className="deco-orb orb-2" aria-hidden="true"></div>

          {/* Stroke-based math line art — top-left */}
          <svg className="deco-math deco-math-1" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <ellipse cx="60" cy="60" rx="48" ry="18" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
            <ellipse cx="60" cy="60" rx="30" ry="48" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
          </svg>

          {/* Stroke-based math line art — bottom-right */}
          <svg className="deco-math deco-math-2" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect x="20" y="20" width="45" height="45" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            <rect x="35" y="10" width="45" height="45" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
            <line x1="20" y1="20" x2="35" y2="10" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
            <line x1="65" y1="20" x2="80" y2="10" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
            <line x1="65" y1="65" x2="80" y2="55" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
          </svg>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-icon">✨</span>
                <span>Powered by AI</span>
              </div>
              <h1 className="hero-title">
                Nền tảng hỗ trợ
                <br />
                <span className="gradient-text">giảng dạy toán học</span>
                <br />
                thông minh
              </h1>
              <p className="hero-description">
                MathMaster giúp giáo viên tiết kiệm thời gian chuẩn bị bài giảng, tạo bài tập, vẽ đồ
                thị và quản lý lớp học với công nghệ AI tiên tiến. Tối ưu cho chương trình toán học
                từ lớp 1 đến lớp 12.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary-large">
                  Bắt đầu miễn phí
                  <span className="btn-icon">→</span>
                </Link>
                <button className="btn btn-video">
                  <span className="play-icon">▶</span>
                  Xem video giới thiệu
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">5,000+</div>
                  <div className="stat-label">Giáo viên tin dùng</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10,000+</div>
                  <div className="stat-label">Bài giảng được tạo</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">98%</div>
                  <div className="stat-label">Đánh giá hài lòng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="gradient-text">Tính năng</span> nổi bật
            </h2>
            <p className="section-description">
              Tất cả công cụ bạn cần để giảng dạy toán học hiệu quả
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon icon-purple">
                <span>🤖</span>
              </div>
              <h3 className="feature-title">AI Tạo nội dung</h3>
              <p className="feature-description">
                Tự động tạo bài giảng, ví dụ, lý thuyết và lời giải chi tiết với công thức LaTeX
                chuẩn
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <span>📚</span>
              </div>
              <h3 className="feature-title">Ngân hàng bài tập</h3>
              <p className="feature-description">
                Hàng nghìn bài tập từ cơ bản đến nâng cao, tự động điều chỉnh độ khó phù hợp với học
                sinh
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-green">
                <span>📊</span>
              </div>
              <h3 className="feature-title">Vẽ đồ thị tự động</h3>
              <p className="feature-description">
                Tạo đồ thị hàm số, hình học, biểu đồ thống kê chính xác và có thể chỉnh sửa
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-orange">
                <span>🎯</span>
              </div>
              <h3 className="feature-title">Tài liệu giảng dạy</h3>
              <p className="feature-description">
                Tạo slides, mindmap, đề thi và giáo án chi tiết chỉ trong vài phút
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-pink">
                <span>📁</span>
              </div>
              <h3 className="feature-title">Quản lý tài nguyên</h3>
              <p className="feature-description">
                Lưu trữ, tổ chức và chia sẻ tài liệu giảng dạy một cách dễ dàng và khoa học
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon icon-teal">
                <span>💬</span>
              </div>
              <h3 className="feature-title">Trợ lý AI toán học</h3>
              <p className="feature-description">
                Chat với AI để giải đáp thắc mắc, hướng dẫn giải bài tập và tư vấn phương pháp giảng
                dạy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="gradient-text">Cách</span> hoạt động
            </h2>
            <p className="section-description">Chỉ với 3 bước đơn giản để bắt đầu</p>
          </div>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3 className="step-title">Đăng ký tài khoản</h3>
                <p className="step-description">
                  Tạo tài khoản miễn phí trong vài giây. Không cần thẻ tín dụng.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3 className="step-title">Chọn công cụ</h3>
                <p className="step-description">
                  Chọn công cụ bạn cần: tạo bài giảng, bài tập, đồ thị hoặc đề thi.
                </p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3 className="step-title">Tạo và chia sẻ</h3>
                <p className="step-description">
                  AI tự động tạo nội dung chất lượng cao. Xuất file và chia sẻ với học sinh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section — "Students love MathMaster" style */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Học sinh <span className="gradient-text">yêu thích</span> MathMaster
            </h2>
          </div>
          <div className="testimonials-grid">
            {/* Card 1 — top left */}
            <div className="testimonial-card">
              <p className="testimonial-text">
                MathMaster đã giúp tôi tiết kiệm hơn 5 giờ mỗi tuần trong việc chuẩn bị bài giảng.
                Tính năng tạo bài tập tự động rất thông minh và phù hợp với chương trình học.
              </p>
              <div className="testimonial-author">
                <span className="author-name-inline">Nguyễn Thị Lan</span>
                <span className="author-dot">•</span>
                <span className="author-role-inline">Giáo viên</span>
              </div>
              <div className="bubble-tail"></div>
            </div>

            {/* Card 2 — top right */}
            <div className="testimonial-card">
              <p className="testimonial-text">
                Công cụ vẽ đồ thị và hình học rất chính xác và dễ sử dụng. Học sinh của tôi hiểu
                bài nhanh hơn nhiều nhờ hình ảnh trực quan.
              </p>
              <div className="testimonial-author">
                <span className="author-name-inline">Phạm Văn Hùng</span>
                <span className="author-dot">•</span>
                <span className="author-role-inline">Giáo viên</span>
              </div>
              <div className="bubble-tail"></div>
            </div>

            {/* Card 3 — bottom center */}
            <div className="testimonial-card testimonial-card--center">
              <p className="testimonial-text">
                AI trợ lý toán học như một đồng nghiệp luôn sẵn sàng hỗ trợ. Tôi có thể hỏi bất cứ
                điều gì về phương pháp giảng dạy và nhận được câu trả lời chất lượng.
              </p>
              <div className="testimonial-author">
                <span className="author-name-inline">Lê Thị Mai</span>
                <span className="author-dot">•</span>
                <span className="author-role-inline">Giáo viên</span>
              </div>
              <div className="bubble-tail"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Sẵn sàng nâng cao chất lượng giảng dạy?</h2>
            <p className="cta-description">
              Tham gia cùng hàng nghìn giáo viên đang sử dụng MathMaster mỗi ngày
            </p>
            <Link to="/register" className="btn btn-white-large">
              Đăng ký miễn phí ngay
              <span className="btn-icon">→</span>
            </Link>
            <p className="cta-note">Không cần thẻ tín dụng • Dùng thử 14 ngày miễn phí</p>
          </div>
        </div>
      </section>

      {/* Footer — math-master.org style */}
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
                <li><a href="#features">Tính năng</a></li>
                <li><a href="#pricing">Bảng giá</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#docs">Tài liệu</a></li>
                <li><a href="#contact">Liên hệ</a></li>
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
                <a href="#" className="footer-app-btn footer-app-btn--dark">
                  Về chúng tôi
                  <span className="btn-icon">→</span>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">2026 © MathMaster - SP26SE026. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
