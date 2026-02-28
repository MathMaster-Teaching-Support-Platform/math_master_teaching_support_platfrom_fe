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
        <div className="hero-bg">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
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
                <span className="gradient-text"> giảng dạy toán học</span>
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
            <div className="hero-image">
              <div className="dashboard-preview">
                <div className="preview-card card-1">
                  <div className="card-icon">📊</div>
                  <div className="card-title">Phân tích học sinh</div>
                  <div className="card-chart"></div>
                </div>
                <div className="preview-card card-2">
                  <div className="card-icon">📝</div>
                  <div className="card-title">Tạo bài kiểm tra</div>
                  <div className="card-content">
                    <div className="math-equation">∫₀¹ x² dx = ?</div>
                  </div>
                </div>
                <div className="preview-card card-3">
                  <div className="card-icon">📈</div>
                  <div className="card-title">Vẽ đồ thị</div>
                  <svg className="card-graph" viewBox="0 0 100 60">
                    <path
                      d="M 0 50 Q 25 10, 50 30 T 100 20"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5B67F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="floating-math-symbols">
                <span className="math-float float-1">α</span>
                <span className="math-float float-2">β</span>
                <span className="math-float float-3">∑</span>
                <span className="math-float float-4">π</span>
                <span className="math-float float-5">∫</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tính năng nổi bật</h2>
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
            <h2 className="section-title">Cách hoạt động</h2>
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Giáo viên nói gì về MathMaster</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "MathMaster đã giúp tôi tiết kiệm hơn 5 giờ mỗi tuần trong việc chuẩn bị bài giảng.
                Tính năng tạo bài tập tự động rất thông minh và phù hợp với chương trình học."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">NT</div>
                <div className="author-info">
                  <div className="author-name">Nguyễn Thị Lan</div>
                  <div className="author-role">Giáo viên THPT, Hà Nội</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "Công cụ vẽ đồ thị và hình học rất chính xác và dễ sử dụng. Học sinh của tôi hiểu
                bài nhanh hơn nhiều nhờ hình ảnh trực quan."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">PH</div>
                <div className="author-info">
                  <div className="author-name">Phạm Văn Hùng</div>
                  <div className="author-role">Giáo viên THCS, TP.HCM</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "AI trợ lý toán học như một đồng nghiệp luôn sẵn sàng hỗ trợ. Tôi có thể hỏi bất cứ
                điều gì về phương pháp giảng dạy và nhận được câu trả lời chất lượng."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">LM</div>
                <div className="author-info">
                  <div className="author-name">Lê Thị Mai</div>
                  <div className="author-role">Giáo viên Tiểu học, Đà Nẵng</div>
                </div>
              </div>
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

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <div className="footer-brand">
                <div className="logo">
                  <span className="logo-icon">∑π</span>
                  <span className="logo-text">MathMaster</span>
                </div>
                <p className="footer-description">
                  Nền tảng hỗ trợ giảng dạy toán học thông minh cho giáo viên Việt Nam
                </p>
              </div>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Sản phẩm</h4>
              <ul className="footer-links">
                <li>
                  <a href="#features">Tính năng</a>
                </li>
                <li>
                  <a href="#pricing">Bảng giá</a>
                </li>
                <li>
                  <a href="#demo">Demo</a>
                </li>
                <li>
                  <a href="#roadmap">Lộ trình</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Công ty</h4>
              <ul className="footer-links">
                <li>
                  <a href="#about">Về chúng tôi</a>
                </li>
                <li>
                  <a href="#blog">Blog</a>
                </li>
                <li>
                  <a href="#careers">Tuyển dụng</a>
                </li>
                <li>
                  <a href="#contact">Liên hệ</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Hỗ trợ</h4>
              <ul className="footer-links">
                <li>
                  <a href="#help">Trung tâm trợ giúp</a>
                </li>
                <li>
                  <a href="#docs">Tài liệu</a>
                </li>
                <li>
                  <a href="#community">Cộng đồng</a>
                </li>
                <li>
                  <a href="#status">Trạng thái hệ thống</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 MathMaster - SP26SE026. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#terms">Điều khoản</a>
              <a href="#privacy">Bảo mật</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
