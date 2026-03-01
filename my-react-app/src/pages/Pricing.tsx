import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Homepage.css';
import './Pricing.css';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Miễn phí',
      price: '0đ',
      period: '/tháng',
      description: 'Phù hợp để trải nghiệm',
      features: [
        'Tạo tối đa 10 bài giảng/tháng',
        'Lưu trữ 100MB',
        'Quản lý 1 lớp học',
        'AI trợ lý cơ bản',
        'Hỗ trợ email',
      ],
      highlighted: false,
      buttonText: 'Bắt đầu miễn phí',
    },
    {
      name: 'Giáo viên',
      price: '199,000đ',
      period: '/tháng',
      description: 'Dành cho giáo viên cá nhân',
      features: [
        'Tạo không giới hạn bài giảng',
        'Lưu trữ 10GB',
        'Quản lý không giới hạn lớp học',
        'AI trợ lý nâng cao',
        'Thư viện tài liệu cao cấp',
        'Xuất file không watermark',
        'Hỗ trợ ưu tiên',
      ],
      highlighted: true,
      buttonText: 'Đăng ký ngay',
    },
    {
      name: 'Trường học',
      price: 'Liên hệ',
      period: '',
      description: 'Giải pháp cho tổ chức',
      features: [
        'Tất cả tính năng gói Giáo viên',
        'Không giới hạn tài khoản',
        'Lưu trữ không giới hạn',
        'Dashboard quản trị tập trung',
        'API tích hợp',
        'Đào tạo và hỗ trợ chuyên biệt',
        'Tùy chỉnh theo yêu cầu',
      ],
      highlighted: false,
      buttonText: 'Liên hệ tư vấn',
    },
  ];

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
              <Link to="/about" className="nav-link">
                Về chúng tôi
              </Link>
              <Link to="/pricing" className="nav-link active">
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
      <section className="pricing-hero">
        <div className="pricing-hero-dots" aria-hidden="true" />
        <div className="container">
          <div className="pricing-hero-content">
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>Bảng giá</span>
            <h1 className="pricing-hero-title">
              Chọn gói <span className="gradient-text">phù hợp với bạn</span>
            </h1>
            <p className="pricing-hero-desc">
              Dùng thử miễn phí 30 ngày. Nâng cấp hoặc hạ cấp bất kỳ lúc nào.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="pricing-cards-section">
        <div className="container">
          <div className="pricing-cards-grid">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-plan-card ${plan.highlighted ? 'pricing-plan-card--featured' : ''}`}
              >
                {plan.highlighted && (
                  <div className="pricing-popular-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Phổ biến nhất
                  </div>
                )}
                <div className="pricing-plan-header">
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <p className="pricing-plan-desc">{plan.description}</p>
                </div>
                <div className="pricing-plan-price-block">
                  <span className="pricing-plan-price">{plan.price}</span>
                  {plan.period && <span className="pricing-plan-period">{plan.period}</span>}
                </div>
                <Link
                  to="/register"
                  className={`pricing-plan-btn ${plan.highlighted ? 'pricing-plan-btn--primary' : 'pricing-plan-btn--outline'}`}
                >
                  {plan.buttonText}
                </Link>
                <div className="pricing-plan-divider" />
                <ul className="pricing-plan-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className={`pricing-check ${plan.highlighted ? 'pricing-check--primary' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pricing-faq-section">
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="pricing-faq-header">
            <span className="ft-badge ft-badge--blue" style={{ marginBottom: '1rem' }}>FAQ</span>
            <h2 className="pricing-faq-title">
              Câu hỏi <span className="gradient-text">thường gặp</span>
            </h2>
          </div>
          <div className="pricing-faq-grid">
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có thể thay đổi gói sau khi đăng ký không?</h4>
              <p className="pricing-faq-a">Có, bạn có thể nâng cấp hoặc hạ cấp gói bất kỳ lúc nào.</p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có chính sách hoàn tiền không?</h4>
              <p className="pricing-faq-a">Chúng tôi có chính sách hoàn tiền trong vòng 14 ngày nếu không hài lòng.</p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Thanh toán như thế nào?</h4>
              <p className="pricing-faq-a">Chấp nhận thanh toán qua thẻ, chuyển khoản, hoặc ví điện tử.</p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có hỗ trợ đào tạo không?</h4>
              <p className="pricing-faq-a">Gói Trường học có đào tạo chuyên biệt. Các gói khác có tài liệu hướng dẫn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pricing-cta-section">
        <div className="container">
          <div className="pricing-cta-card">
            <div className="pricing-cta-glow" aria-hidden="true" />
            <span className="ft-badge ft-badge--green" style={{ marginBottom: '1rem' }}>Bắt đầu ngay</span>
            <h2 className="pricing-cta-title">
              Sẵn sàng tối ưu hóa <span className="gradient-text">bài giảng</span> của bạn?
            </h2>
            <p className="pricing-cta-desc">
              Tham gia cùng hàng nghìn giáo viên đã lựa chọn MathMaster. Dùng thử miễn phí, không cần thẻ tín dụng.
            </p>
            <div className="pricing-cta-actions">
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

export default Pricing;
