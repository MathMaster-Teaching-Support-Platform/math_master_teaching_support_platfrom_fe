import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Contact.css';
import './Homepage.css';

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

  /* ── Fade-in on scroll ── */
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('contact-animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    sectionsRef.current.forEach((el) => {
      if (el) {
        el.style.opacity = '0';
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const addSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionsRef.current[index] = el;
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

      {/* ── Hero ── */}
      <section className="contact-hero">
        <div className="contact-hero-dots" aria-hidden="true" />
        <div className="container">
          <div className="contact-hero-content">
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>Liên hệ</span>
            <h1 className="contact-hero-title">
              Liên hệ <span className="gradient-text">với chúng tôi</span>
            </h1>
            <p className="contact-hero-desc">
              Chúng tôi sẵn sàng hỗ trợ bạn. Hãy để lại thông tin và chúng tôi sẽ phản hồi sớm nhất!
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="contact-main-section" ref={addSectionRef(0)}>
        <div className="container">
          <div className="contact-grid">
            {/* ── Info Side Panel ── */}
            <div className="contact-info-panel">
              <div className="contact-info-card">
                <div className="contact-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h3 className="contact-info-title">Email</h3>
                  <p className="contact-info-value">support@mathmaster.vn</p>
                  <p className="contact-info-value">sales@mathmaster.vn</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h3 className="contact-info-title">Điện thoại</h3>
                  <p className="contact-info-value">Hotline: 1900 xxxx</p>
                  <p className="contact-info-value">Thời gian: 8:00 - 22:00</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h3 className="contact-info-title">Địa chỉ</h3>
                  <p className="contact-info-value">123 Đường ABC, Quận 1</p>
                  <p className="contact-info-value">Thành phố Hồ Chí Minh</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h3 className="contact-info-title">Mạng xã hội</h3>
                  <p className="contact-info-value">Facebook | Zalo | YouTube</p>
                  <p className="contact-info-value">Theo dõi để cập nhật tin mới</p>
                </div>
              </div>

              {/* ── Trust Notes ── */}
              <div className="contact-trust-notes">
                <div className="contact-trust-note">
                  <span className="contact-trust-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  Phản hồi trong vòng 24 giờ làm việc
                </div>
                <div className="contact-trust-note">
                  <span className="contact-trust-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  Thông tin được bảo mật tuyệt đối
                </div>
              </div>
            </div>

            {/* ── Form Card ── */}
            <div className="contact-form-card">
              <h2 className="contact-form-title">Gửi tin nhắn</h2>
              <p className="contact-form-subtitle">Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại ngay.</p>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-form-label">Họ và tên <span>*</span></label>
                    <input
                      type="text"
                      name="name"
                      className="contact-form-input"
                      placeholder="Nhập họ và tên"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-form-label">Email <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="contact-form-input"
                      placeholder="name@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      className="contact-form-input"
                      placeholder="0xxx xxx xxx"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-form-label">Chủ đề <span>*</span></label>
                    <select
                      name="subject"
                      className="contact-form-select"
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
                </div>
                <div className="contact-form-group">
                  <label className="contact-form-label">Nội dung <span>*</span></label>
                  <textarea
                    name="message"
                    className="contact-form-textarea"
                    rows={5}
                    placeholder="Nhập nội dung tin nhắn..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="contact-submit-btn">
                  Gửi tin nhắn
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
