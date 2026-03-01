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

      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">
            Về <span className="gradient-text">MathMaster</span>
          </h1>
          <p className="page-subtitle">
            Sứ mệnh của chúng tôi là giúp giáo viên Việt Nam giảng dạy toán học hiệu quả hơn
          </p>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-section">
            <h2 className="section-title">Câu chuyện của chúng tôi</h2>
            <p className="section-text">
              MathMaster được ra đời từ mong muốn giúp các giáo viên toán học có thêm thời gian tập
              trung vào việc truyền đạt kiến thức và hỗ trợ học sinh, thay vì dành quá nhiều thời
              gian cho các công việc chuẩn bị giảng dạy.
            </p>
            <p className="section-text">
              Với sự phát triển của công nghệ AI, chúng tôi tin rằng giáo viên có thể được hỗ trợ
              mạnh mẽ trong việc tạo bài giảng, thiết kế bài tập, và quản lý lớp học một cách thông
              minh và hiệu quả hơn.
            </p>
          </div>

          <div className="about-section">
            <h2 className="section-title">Tầm nhìn</h2>
            <p className="section-text">
              Trở thành nền tảng hỗ trợ giảng dạy toán học hàng đầu tại Việt Nam, giúp hàng nghìn
              giáo viên nâng cao chất lượng giảng dạy và hàng triệu học sinh yêu thích môn toán.
            </p>
          </div>

          <div className="about-section">
            <h2 className="section-title">Giá trị cốt lõi</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3>Tập trung vào giáo viên</h3>
                <p>Mọi tính năng đều được thiết kế để phục vụ nhu cầu thực tế của giáo viên</p>
              </div>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>Đổi mới sáng tạo</h3>
                <p>Không ngừng cải tiến và áp dụng công nghệ mới để nâng cao trải nghiệm</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Cộng đồng giáo viên</h3>
                <p>Xây dựng nền tảng chia sẻ và hỗ trợ lẫn nhau trong cộng đồng giáo viên</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🌟</div>
                <h3>Chất lượng cao</h3>
                <p>Cam kết mang đến sản phẩm và dịch vụ tốt nhất cho người dùng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
