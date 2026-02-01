import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import './Pages.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    // Handle form submission
  };

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
              <Link to="/pricing" className="nav-link">
                Giá cả
              </Link>
              <Link to="/contact" className="nav-link active">
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
            <span className="gradient-text">Liên hệ</span> với chúng tôi
          </h1>
          <p className="page-subtitle">
            Chúng tôi sẵn sàng hỗ trợ bạn. Hãy để lại thông tin và chúng tôi sẽ liên hệ sớm nhất!
          </p>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon">📧</div>
                <h3>Email</h3>
                <p>support@mathmaster.vn</p>
                <p>sales@mathmaster.vn</p>
              </div>
              <div className="info-card">
                <div className="info-icon">📞</div>
                <h3>Điện thoại</h3>
                <p>Hotline: 1900 xxxx</p>
                <p>Thời gian: 8:00 - 22:00</p>
              </div>
              <div className="info-card">
                <div className="info-icon">📍</div>
                <h3>Địa chỉ</h3>
                <p>123 Đường ABC, Quận 1</p>
                <p>Thành phố Hồ Chí Minh</p>
              </div>
              <div className="info-card">
                <div className="info-icon">💬</div>
                <h3>Mạng xã hội</h3>
                <p>Facebook | Zalo | YouTube</p>
                <p>Theo dõi để cập nhật tin mới</p>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <h2>Gửi tin nhắn</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Chủ đề *</label>
                  <select
                    name="subject"
                    className="form-control"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="support">Hỗ trợ kỹ thuật</option>
                    <option value="sales">Tư vấn bán hàng</option>
                    <option value="partnership">Hợp tác</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    name="message"
                    className="form-control"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  Gửi tin nhắn
                </button>
              </form>
            </div>
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

export default Contact;
