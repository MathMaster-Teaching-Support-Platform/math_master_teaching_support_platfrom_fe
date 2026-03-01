import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
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

      {/* Unique Approach Section — matching math-master.org */}
      <section className="unique-approach-section">
        <div className="container">
          <h2 className="unique-approach__title">
            <span className="gradient-text">Phương pháp</span> giải toán độc đáo
          </h2>
          <div className="unique-approach__content">
            <div className="unique-approach__steps">
              <div className="unique-approach__step">
                <div className="step-badge step-badge--1">01</div>
                <h3 className="step-title">Chụp ảnh.</h3>
                <p className="step-desc">Chụp ảnh bài toán hoặc nhập thủ công với máy tính thông minh của chúng tôi.</p>
              </div>
              <div className="unique-approach__step">
                <div className="step-badge step-badge--2">02</div>
                <h3 className="step-title">Giải bài.</h3>
                <p className="step-desc">Nhận lời giải được xác minh bởi chuyên gia chỉ trong vài giây.</p>
              </div>
              <div className="unique-approach__step">
                <div className="step-badge step-badge--3">03</div>
                <h3 className="step-title">Học hỏi.</h3>
                <p className="step-desc">Xem các bước giải chi tiết và nhận giải thích từ chuyên gia.</p>
              </div>
            </div>
            <div className="unique-approach__phones">
              <img
                src="https://gcdn.fx2.io/math-master.org/_nuxt/phones.d9bce636.png"
                alt="Phone mockups"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Intro / Branding Section — matching math-master.org */}
      <section className="intro-section">
        <div className="container">
          <div className="intro-content">
            <div className="intro-icon-card">
              <svg viewBox="0 0 100 100" fill="none" className="intro-math-icon" aria-hidden="true">
                <text x="8" y="48" fontSize="36" fontWeight="700" fill="#5E5CE6" fontFamily="serif">³</text>
                <text x="24" y="72" fontSize="52" fontWeight="700" fill="#1a1a2e" fontFamily="serif">√</text>
                <text x="58" y="72" fontSize="42" fontWeight="800" fill="#5E5CE6" fontFamily="sans-serif">x</text>
              </svg>
            </div>
            <div className="intro-text">
              <h2 className="intro-title">
                Math<span className="intro-title-accent">Master</span>
              </h2>
              <p className="intro-description">
                là nền tảng hỗ trợ giảng dạy và học toán. Nền tảng cung cấp cho bạn:
              </p>
              <ul className="intro-features">
                <li>giải pháp từng bước cho mọi bài toán một cách nhanh chóng</li>
                <li>hỗ trợ toàn diện từ công nghệ AI tiên tiến 24/7</li>
              </ul>
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

      {/* Features Section — Bento Grid */}
      <section id="features" className="features-section">
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="gradient-text">Tính năng</span> nổi bật
            </h2>
            <p className="section-description">
              Tất cả công cụ bạn cần để giảng dạy toán học hiệu quả
            </p>
          </div>
          <div className="features-bento">
            {/* Hero card — spans 2 cols */}
            <div className="ft-card ft-card--hero">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--purple">AI-Powered</span>
              <div className="ft-icon ft-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 0 1 1h1a4 4 0 0 1 0 8h-1a1 1 0 0 0-1 1v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1H6a4 4 0 0 1 0-8h1a1 1 0 0 0 1-1V6a4 4 0 0 1 4-4z" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="ft-title">AI Tạo nội dung</h3>
              <p className="ft-desc">
                Tự động tạo bài giảng, ví dụ, lý thuyết và lời giải chi tiết với công thức LaTeX chuẩn. Chỉ cần nhập chủ đề — AI lo phần còn lại.
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
            </div>

            {/* Card 2 */}
            <div className="ft-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--blue">Smart</span>
              <div className="ft-icon ft-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="13" y2="11" />
                </svg>
              </div>
              <h3 className="ft-title">Ngân hàng bài tập</h3>
              <p className="ft-desc">
                Hàng nghìn bài tập từ cơ bản đến nâng cao, tự động điều chỉnh độ khó phù hợp
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
            </div>

            {/* Card 3 */}
            <div className="ft-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--green">Auto</span>
              <div className="ft-icon ft-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="ft-title">Vẽ đồ thị tự động</h3>
              <p className="ft-desc">
                Tạo đồ thị hàm số, hình học, biểu đồ thống kê chính xác và có thể chỉnh sửa
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
            </div>

            {/* Card 4 */}
            <div className="ft-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--orange">Nhanh</span>
              <div className="ft-icon ft-icon--orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="ft-title">Tài liệu giảng dạy</h3>
              <p className="ft-desc">
                Tạo slides, mindmap, đề thi và giáo án chi tiết chỉ trong vài phút
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
            </div>

            {/* Card 5 */}
            <div className="ft-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--pink">Tiện lợi</span>
              <div className="ft-icon ft-icon--pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <h3 className="ft-title">Quản lý tài nguyên</h3>
              <p className="ft-desc">
                Lưu trữ, tổ chức và chia sẻ tài liệu giảng dạy một cách dễ dàng và khoa học
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
            </div>

            {/* Card 6 — spans 2 cols */}
            <div className="ft-card ft-card--wide">
              <div className="ft-card__glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--teal">24/7</span>
              <div className="ft-icon ft-icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                </svg>
              </div>
              <h3 className="ft-title">Trợ lý AI toán học</h3>
              <p className="ft-desc">
                Chat với AI để giải đáp thắc mắc, hướng dẫn giải bài tập và tư vấn phương pháp giảng dạy — luôn sẵn sàng 24/7.
              </p>
              <span className="ft-link">Tìm hiểu thêm <span className="ft-arrow">→</span></span>
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
      <Footer />
    </div>
  );
};

export default Homepage;
