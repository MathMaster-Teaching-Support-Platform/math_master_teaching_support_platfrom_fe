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
        {/* Refined Decorative System — floating math symbols + geometric wireframes */}
        <div className="hero-decorations">
          {/* Floating math text symbols */}
          <span className="math-symbol symbol-1" aria-hidden="true">∑</span>
          <span className="math-symbol symbol-2" aria-hidden="true">π</span>
          <span className="math-symbol symbol-3" aria-hidden="true">∫</span>
          <span className="math-symbol symbol-4" aria-hidden="true">√</span>
          <span className="math-symbol symbol-5" aria-hidden="true">Δ</span>
          <span className="math-symbol symbol-6" aria-hidden="true">∞</span>
          <span className="math-symbol symbol-7" aria-hidden="true">±</span>
          <span className="math-symbol symbol-8" aria-hidden="true">÷</span>
          <span className="math-symbol symbol-9" aria-hidden="true">×</span>
          <span className="math-symbol symbol-10" aria-hidden="true">≈</span>
          <span className="math-symbol symbol-11" aria-hidden="true">∂</span>
          <span className="math-symbol symbol-12" aria-hidden="true">θ</span>

          {/* Geometric wireframe — Sphere (top area, blue) */}
          <svg className="geo-shape geo-sphere" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="60" cy="60" rx="50" ry="18" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            <ellipse cx="60" cy="60" rx="18" ry="50" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            <line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
            <line x1="60" y1="10" x2="60" y2="110" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
          </svg>

          {/* Geometric wireframe — Cylinder (left side, orange) */}
          <svg className="geo-shape geo-cylinder" viewBox="0 0 150 180" fill="none" aria-hidden="true">
            <ellipse cx="75" cy="30" rx="55" ry="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 3" />
            <line x1="20" y1="30" x2="20" y2="140" stroke="currentColor" strokeWidth="1.5" />
            <line x1="130" y1="30" x2="130" y2="140" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="75" cy="140" rx="55" ry="20" stroke="currentColor" strokeWidth="1.5" />
            <text x="55" y="92" fill="currentColor" fontSize="16" opacity="0.7" fontStyle="italic" fontFamily="serif">b</text>
            <text x="82" y="168" fill="currentColor" fontSize="16" opacity="0.7" fontStyle="italic" fontFamily="serif">r</text>
          </svg>

          {/* Geometric wireframe — Pyramid/Tetrahedron (right side, pink) */}
          <svg className="geo-shape geo-pyramid" viewBox="0 0 160 160" fill="none" aria-hidden="true">
            <polygon points="80,10 20,130 140,130" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
            <line x1="80" y1="10" x2="110" y2="100" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3" />
            <line x1="20" y1="130" x2="110" y2="100" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3" />
            <line x1="140" y1="130" x2="110" y2="100" stroke="currentColor" strokeWidth="1.2" />
            <text x="72" y="150" fill="currentColor" fontSize="14" opacity="0.7" fontStyle="italic" fontFamily="serif">a</text>
          </svg>

          {/* Geometric wireframe — Cube (bottom-right, blue) */}
          <svg className="geo-shape geo-cube" viewBox="0 0 120 130" fill="none" aria-hidden="true">
            <rect x="10" y="35" width="65" height="65" stroke="currentColor" strokeWidth="1.5" />
            <rect x="40" y="10" width="65" height="65" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3" />
            <line x1="10" y1="35" x2="40" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="75" y1="35" x2="105" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="75" y1="100" x2="105" y2="75" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            <line x1="10" y1="100" x2="40" y2="75" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" />
            <text x="95" y="5" fill="currentColor" fontSize="14" opacity="0.7" fontStyle="italic" fontFamily="serif">a</text>
            <text x="110" y="68" fill="currentColor" fontSize="14" opacity="0.7" fontStyle="italic" fontFamily="serif">a</text>
            <text x="35" y="120" fill="currentColor" fontSize="14" opacity="0.7" fontStyle="italic" fontFamily="serif">a</text>
          </svg>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
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

      {/* Help Section — "Instant help with all things math" */}
      <section className="help-section">
        <div className="container">
          <h2 className="help-title">
            <span className="gradient-text">Tức thì</span> hỗ trợ mọi vấn đề toán học
          </h2>

          {/* Row 1 — text left, image right */}
          <div className="help-row help-row--reverse">
            <div className="help-image">
              <img src="https://gcdn.fx2.io/math-master.org/_nuxt/il1.b5161dc8.png" alt="Thuật toán giải toán nâng cao" loading="lazy" />
            </div>
            <div className="help-text">
              <h3 className="help-subtitle">
                Thuật toán giải toán nâng cao <span className="dot-accent">.</span>
              </h3>
              <p className="help-desc">
                Nhận diện bài toán và đưa ra lời giải theo từng bước trong vài giây.
              </p>
            </div>
          </div>

          {/* Row 2 — image left, text right */}
          <div className="help-row">
            <div className="help-image">
              <img src="https://gcdn.fx2.io/math-master.org/_nuxt/il2.2148ec35.png" alt="Hỗ trợ chuyên gia thời gian thực" loading="lazy" />
            </div>
            <div className="help-text">
              <h3 className="help-subtitle">
                Hỗ trợ chuyên gia thời gian thực <span className="dot-accent">.</span>
              </h3>
              <p className="help-desc">
                Gia sư toán giỏi nhất hỗ trợ bạn qua chat trực tuyến bất cứ lúc nào.
              </p>
            </div>
          </div>

          {/* Row 3 — text left, image right */}
          <div className="help-row help-row--reverse">
            <div className="help-image">
              <img src="https://gcdn.fx2.io/math-master.org/_nuxt/il3.659889bd.png" alt="Kho kiến thức" loading="lazy" />
            </div>
            <div className="help-text">
              <h3 className="help-subtitle">
                Kho kiến thức <span className="dot-accent">.</span>
              </h3>
              <p className="help-desc">
                Tài liệu học tập, bảng công thức và bài kiểm tra giúp bạn học toán dễ dàng hơn.
              </p>
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

      {/* Unique Features Section — "What makes us unique" */}
      <section className="unique-section">
        <div className="container">
          <h2 className="unique-title">
            Điều gì làm chúng tôi <span className="gradient-text">khác biệt</span>
          </h2>

          <div className="unique-grid">
            {/* Feature 1 */}
            <div className="unique-card">
              <div className="unique-icon">
                <img src="https://gcdn.fx2.io/math-master.org/_nuxt/ic1.49533d61.svg" alt="Quét & Giải" loading="lazy" />
              </div>
              <h3 className="unique-card-title">
                Quét & Giải ngay <span className="dot-accent">.</span>
              </h3>
              <p className="unique-card-desc">
                Chụp ảnh bài toán và nhận lời giải chi tiết từng bước chỉ trong vài giây.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="unique-card">
              <div className="unique-icon">
                <img src="https://gcdn.fx2.io/math-master.org/_nuxt/ic2.e78ef101.svg" alt="Gia sư trực tuyến" loading="lazy" />
              </div>
              <h3 className="unique-card-title">
                Gia sư trực tuyến 24/7 <span className="dot-accent">.</span>
              </h3>
              <p className="unique-card-desc">
                Kết nối với gia sư toán chuyên nghiệp bất cứ lúc nào qua chat trực tuyến.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="unique-card">
              <div className="unique-icon">
                <img src="https://gcdn.fx2.io/math-master.org/_nuxt/ic3.bd8c7175.svg" alt="Kho bài tập" loading="lazy" />
              </div>
              <h3 className="unique-card-title">
                Kho bài tập phong phú <span className="dot-accent">.</span>
              </h3>
              <p className="unique-card-desc">
                Hàng nghìn bài tập, công thức và bài kiểm tra từ cơ bản đến nâng cao.
              </p>
            </div>
          </div>

          {/* Phone mockups */}
          <div className="unique-mockups">
            <img
              src="https://gcdn.fx2.io/math-master.org/_nuxt/Mockups.74cabfe4.png"
              alt="MathMaster trên các thiết bị"
              loading="lazy"
              className="mockup-center"
            />
          </div>
        </div>
      </section>

      {/* Subjects Section — "What subjects does it cover?" */}
      <section className="subjects-section">
        <div className="container">
          <h2 className="subjects-title">
            Hỗ trợ những <span className="gradient-text">môn học</span> nào?
          </h2>

          <div className="subjects-grid">
            {[
              'Đại số', 'Hình học', 'Giải tích', 'Lượng giác',
              'Thống kê', 'Xác suất', 'Số học', 'Ma trận',
              'Tích phân', 'Đạo hàm', 'Phương trình', 'Bất đẳng thức',
              'Hàm số', 'Tổ hợp', 'Dãy số', 'Logarit'
            ].map((subject) => (
              <span key={subject} className="subject-pill">
                {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Section — stats & trust */}
      <section className="trusted-section">
        <div className="container">
          <div className="trusted-header">
            <h2 className="trusted-title">
              Được <span className="gradient-text">tin tưởng</span> bởi hàng nghìn giáo viên
            </h2>
            <p className="trusted-desc">
              Nền tảng hỗ trợ giảng dạy toán học hàng đầu Việt Nam
            </p>
          </div>

          <div className="trusted-stats">
            <div className="trusted-stat-card">
              <span className="trusted-stat-number">10K+</span>
              <span className="trusted-stat-label">Người dùng</span>
            </div>
            <div className="trusted-stat-card">
              <span className="trusted-stat-number">50K+</span>
              <span className="trusted-stat-label">Bài toán đã giải</span>
            </div>
            <div className="trusted-stat-card">
              <span className="trusted-stat-number">4.8</span>
              <span className="trusted-stat-label">Đánh giá trung bình</span>
            </div>
            <div className="trusted-stat-card">
              <span className="trusted-stat-number">99%</span>
              <span className="trusted-stat-label">Độ chính xác</span>
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

      {/* CTA Section — light, airy, matching page style */}
      <section className="cta-section">
        {/* Subtle decorative math strokes */}
        <svg className="cta-deco cta-deco-1" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 5 Q15 20, 30 40 Q45 60, 30 75" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="20" y1="38" x2="40" y2="42" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="cta-deco cta-deco-2" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="10" y="45" fontSize="48" fontFamily="serif" fill="none" stroke="currentColor" strokeWidth="1">Σ</text>
        </svg>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Sẵn sàng <span className="gradient-text">nâng cao</span> chất lượng giảng dạy?
            </h2>
            <p className="cta-description">
              Tham gia cùng hàng nghìn giáo viên đang sử dụng MathMaster mỗi ngày
            </p>
            <Link to="/register" className="btn btn-cta-primary">
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
