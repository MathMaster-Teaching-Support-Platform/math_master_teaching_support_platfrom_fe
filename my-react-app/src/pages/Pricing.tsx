import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Homepage.css';
import './Pages.css';

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

      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">
            Bảng giá <span className="gradient-text">Phù hợp với bạn</span>
          </h1>
          <p className="page-subtitle">
            Chọn gói phù hợp với nhu cầu giảng dạy của bạn. Dùng thử miễn phí 30 ngày!
          </p>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
                {plan.highlighted && <div className="popular-badge">Phổ biến nhất</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-outline'} btn-block`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>

          <div className="pricing-faq">
            <h2 className="section-title">Câu hỏi thường gặp</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>Có thể thay đổi gói sau khi đăng ký không?</h4>
                <p>Có, bạn có thể nâng cấp hoặc hạ cấp gói bất kỳ lúc nào.</p>
              </div>
              <div className="faq-item">
                <h4>Có chính sách hoàn tiền không?</h4>
                <p>Chúng tôi có chính sách hoàn tiền trong vòng 14 ngày nếu không hài lòng.</p>
              </div>
              <div className="faq-item">
                <h4>Thanh toán như thế nào?</h4>
                <p>Chấp nhận thanh toán qua thẻ, chuyển khoản, hoặc ví điện tử.</p>
              </div>
              <div className="faq-item">
                <h4>Có hỗ trợ đào tạo không?</h4>
                <p>Gói Trường học có đào tạo chuyên biệt. Các gói khác có tài liệu hướng dẫn.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
