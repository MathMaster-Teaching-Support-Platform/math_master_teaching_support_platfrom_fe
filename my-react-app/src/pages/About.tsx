import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Homepage.css';
import './Pages.css';

const About: React.FC = () => {
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
              <Link to="/features" className="nav-link">
                Tính năng
              </Link>
              <Link to="/about" className="nav-link active">
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

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-dots" aria-hidden="true" />
        <div className="container">
          <div className="about-hero-content">
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>Về chúng tôi</span>
            <h1 className="about-hero-title">
              Câu chuyện <span className="gradient-text">MathMaster</span>
            </h1>
            <p className="about-hero-desc">
              Sứ mệnh của chúng tôi là giúp giáo viên Việt Nam giảng dạy toán học hiệu quả hơn
            </p>
          </div>
        </div>
      </section>

      {/* ── Our Story — Split Layout ── */}
      <section className="about-story-section">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <span className="about-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Câu chuyện của chúng tôi
              </span>
              <h2 className="about-heading">
                Xây dựng nền tảng <span className="gradient-text">hỗ trợ giảng dạy</span> thông minh
              </h2>
              <p className="about-body">
                MathMaster được ra đời từ mong muốn giúp các giáo viên toán học có thêm thời gian tập
                trung vào việc truyền đạt kiến thức và hỗ trợ học sinh, thay vì dành quá nhiều thời
                gian cho các công việc chuẩn bị giảng dạy.
              </p>
              <p className="about-body">
                Với sự phát triển của công nghệ AI, chúng tôi tin rằng giáo viên có thể được hỗ trợ
                mạnh mẽ trong việc tạo bài giảng, thiết kế bài tập, và quản lý lớp học một cách thông
                minh và hiệu quả hơn.
              </p>
            </div>

            <div className="about-story-visual">
              <div className="about-visual-card">
                <div className="about-visual-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 0 1 1h1a4 4 0 0 1 0 8h-1a1 1 0 0 0-1 1v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1H6a4 4 0 0 1 0-8h1a1 1 0 0 0 1-1V6a4 4 0 0 1 4-4z" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h3 className="about-visual-title">AI-Powered</h3>
                <p className="about-visual-desc">Nền tảng giáo dục tích hợp trí tuệ nhân tạo hàng đầu Việt Nam</p>
                <div className="about-visual-stats">
                  <div className="about-stat">
                    <span className="about-stat-num">10K+</span>
                    <span className="about-stat-label">Giáo viên</span>
                  </div>
                  <div className="about-stat">
                    <span className="about-stat-num">50K+</span>
                    <span className="about-stat-label">Bài giảng</span>
                  </div>
                  <div className="about-stat">
                    <span className="about-stat-num">98%</span>
                    <span className="about-stat-label">Hài lòng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vision — Accent Card ── */}
      <section className="about-vision-section">
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="about-vision-card">
            <div className="about-vision-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
              </svg>
            </div>
            <div className="about-vision-content">
              <span className="about-label about-label--blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Tầm nhìn
              </span>
              <h2 className="about-heading" style={{ marginBottom: '1rem' }}>
                Nền tảng giảng dạy toán học <span className="gradient-text">#1 Việt Nam</span>
              </h2>
              <p className="about-body" style={{ marginBottom: 0 }}>
                Trở thành nền tảng hỗ trợ giảng dạy toán học hàng đầu tại Việt Nam, giúp hàng nghìn
                giáo viên nâng cao chất lượng giảng dạy và hàng triệu học sinh yêu thích môn toán.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values — Bento Grid ── */}
      <section className="about-values-section">
        <div className="container">
          <div className="about-section-header">
            <span className="ft-badge ft-badge--green" style={{ marginBottom: '1rem' }}>Giá trị cốt lõi</span>
            <h2 className="about-heading" style={{ textAlign: 'center' }}>
              Những <span className="gradient-text">giá trị</span> định hướng
            </h2>
          </div>

          <div className="about-values-grid">
            {/* Value 1 */}
            <div className="ft-card about-value-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              </div>
              <h3 className="ft-title">Tập trung vào giáo viên</h3>
              <p className="ft-desc">
                Mọi tính năng đều được thiết kế để phục vụ nhu cầu thực tế của giáo viên
              </p>
            </div>

            {/* Value 2 */}
            <div className="ft-card about-value-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="ft-title">Đổi mới sáng tạo</h3>
              <p className="ft-desc">
                Không ngừng cải tiến và áp dụng công nghệ mới để nâng cao trải nghiệm
              </p>
            </div>

            {/* Value 3 */}
            <div className="ft-card about-value-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="ft-title">Cộng đồng giáo viên</h3>
              <p className="ft-desc">
                Xây dựng nền tảng chia sẻ và hỗ trợ lẫn nhau trong cộng đồng giáo viên
              </p>
            </div>

            {/* Value 4 */}
            <div className="ft-card about-value-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="ft-title">Chất lượng cao</h3>
              <p className="ft-desc">
                Cam kết mang đến sản phẩm và dịch vụ tốt nhất cho người dùng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why MathMaster — Platform Benefits ── */}
      <section className="about-benefits-section">
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="about-section-header">
            <span className="ft-badge ft-badge--orange" style={{ marginBottom: '1rem' }}>Tại sao chọn chúng tôi</span>
            <h2 className="about-heading" style={{ textAlign: 'center' }}>
              Vì sao giáo viên <span className="gradient-text">tin tưởng</span> MathMaster?
            </h2>
            <p className="about-benefits-desc">
              Nền tảng được thiết kế bởi những người hiểu giáo dục, dành cho những người yêu giáo dục
            </p>
          </div>

          <div className="about-benefits-grid">
            {/* Benefit 1 */}
            <div className="ft-card about-benefit-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 className="ft-title">Tiết kiệm 70% thời gian</h3>
              <p className="ft-desc">
                Tự động tạo bài giảng, bài tập và đề kiểm tra với AI — giáo viên chỉ cần tập trung vào điều quan trọng nhất: giảng dạy.
              </p>
              <div className="about-benefit-highlight">
                <span className="about-benefit-stat">3x</span>
                <span className="about-benefit-stat-text">nhanh hơn so với soạn thủ công</span>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="ft-card about-benefit-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="ft-title">Dễ sử dụng, không cần kỹ thuật</h3>
              <p className="ft-desc">
                Giao diện thân thiện, trực quan — chỉ cần vài cú nhấp chuột là có ngay bài giảng chuyên nghiệp, phù hợp chương trình GDPT.
              </p>
              <div className="about-benefit-highlight">
                <span className="about-benefit-stat">5 phút</span>
                <span className="about-benefit-stat-text">để tạo một bộ bài giảng hoàn chỉnh</span>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="ft-card about-benefit-card">
              <div className="ft-card__glow" aria-hidden="true" />
              <div className="ft-icon ft-icon--pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="ft-title">An toàn & bảo mật dữ liệu</h3>
              <p className="ft-desc">
                Dữ liệu giáo viên được bảo vệ tuyệt đối. Hệ thống tuân thủ các tiêu chuẩn bảo mật cao nhất, đảm bảo quyền riêng tư.
              </p>
              <div className="about-benefit-highlight">
                <span className="about-benefit-stat">100%</span>
                <span className="about-benefit-stat-text">mã hóa dữ liệu người dùng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta-section">
        <div className="container">
          <div className="about-cta-card">
            <div className="about-cta-glow" aria-hidden="true" />
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1rem' }}>Bắt đầu ngay</span>
            <h2 className="about-cta-title">
              Sẵn sàng nâng cao chất lượng <span className="gradient-text">giảng dạy</span>?
            </h2>
            <p className="about-cta-desc">
              Tham gia cùng hàng nghìn giáo viên đang sử dụng MathMaster để tạo ra những bài giảng tốt hơn mỗi ngày.
            </p>
            <div className="about-cta-actions">
              <Link to="/register" className="btn-primary-large">
                Đăng ký miễn phí <span className="btn-icon">→</span>
              </Link>
              <Link to="/features" className="btn-video">
                Khám phá tính năng
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
