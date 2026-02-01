import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import './Pages.css';

const Features: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI Trợ lý giảng dạy',
      description: 'Tạo bài giảng, đề kiểm tra và bài tập tự động với AI thông minh',
      details: [
        'Tự động tạo đề thi theo chuẩn',
        'Gợi ý phương pháp giảng dạy',
        'Phân tích điểm mạnh/yếu học sinh',
      ],
    },
    {
      icon: '📊',
      title: 'Vẽ đồ thị thông minh',
      description: 'Công cụ vẽ đồ thị toán học chuyên nghiệp và dễ sử dụng',
      details: ['Hỗ trợ đa dạng loại đồ thị', 'Xuất file chất lượng cao', 'Thư viện mẫu phong phú'],
    },
    {
      icon: '📚',
      title: 'Quản lý nội dung',
      description: 'Tổ chức và quản lý tài liệu giảng dạy hiệu quả',
      details: ['Lưu trữ không giới hạn', 'Tìm kiếm thông minh', 'Chia sẻ dễ dàng'],
    },
    {
      icon: '👥',
      title: 'Quản lý lớp học',
      description: 'Theo dõi tiến độ học tập của từng học sinh',
      details: ['Điểm danh tự động', 'Báo cáo chi tiết', 'Giao tiếp phụ huynh'],
    },
    {
      icon: '✍️',
      title: 'Tạo bài tập',
      description: 'Thiết kế bài tập đa dạng và chấm điểm tự động',
      details: ['Ngân hàng câu hỏi lớn', 'Chấm điểm tự động', 'Phản hồi chi tiết'],
    },
    {
      icon: '📈',
      title: 'Phân tích & Báo cáo',
      description: 'Dashboard thống kê trực quan và dễ hiểu',
      details: ['Biểu đồ trực quan', 'Xuất báo cáo PDF', 'So sánh tiến độ'],
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

      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">
            Tính năng <span className="gradient-text">Vượt trội</span>
          </h1>
          <p className="page-subtitle">
            Khám phá các tính năng mạnh mẽ giúp giáo viên tiết kiệm thời gian và nâng cao chất lượng
            giảng dạy
          </p>
        </div>
      </section>

      <section className="features-grid-section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card-detailed">
                <div className="feature-icon-large">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <ul className="feature-details">
                  {feature.details.map((detail, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Sẵn sàng trải nghiệm?</h2>
            <p>Đăng ký ngay để nhận 30 ngày dùng thử miễn phí</p>
            <Link to="/register" className="btn btn-primary-large">
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="container">
          <p>&copy; 2026 MathMaster. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
