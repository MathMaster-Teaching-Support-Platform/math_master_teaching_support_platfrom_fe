import React from 'react';
import { Link } from 'react-router-dom';
import {
  SphereSVG,
  TriangleSVG,
  FormulaSVG,
  DiagramSVG,
  QuestionBubbleSVG,
  CheckBubbleSVG,
} from '../components/common/SVGDecorations';
import './Homepage.css';

const Homepage: React.FC = () => {
  return (
    <div className="homepage">
      {/* Header / Navigation */}
      <header className="homepage-header">
        <div className="container">
          <nav className="navbar">
            <div className="navbar-brand">
              <Link to="/" className="logo">
                <span className="logo-icon">fx</span>
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
              <Link to="/contact" className="nav-link">
                Liên hệ
              </Link>
            </div>
            <div className="navbar-actions">
              <Link to="/login" className="btn btn-outline-primary">
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
          <SphereSVG className="hero-decoration sphere" />
          <TriangleSVG className="hero-decoration triangle" />
          <FormulaSVG className="hero-decoration formula" />
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-main">MATH MADE </span>
              <span className="hero-title-highlight">EASY</span>
            </h1>
            <p className="hero-subtitle">
              Try supreme math solver enhanced by expert help from{' '}
              <span className="hero-subtitle-highlight">best math tutors online</span>
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-hero btn-hero-primary">
                APPLE STORE
              </Link>
              <Link to="/login" className="btn-hero btn-hero-primary">
                GOOGLE PLAY
              </Link>
              <button className="btn-hero btn-hero-secondary">TRY ON WEB</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          {/* Feature 1 */}
          <div className="feature-row">
            <div className="feature-content">
              <h2 className="feature-title">Advanced math-solving algorithm.</h2>
              <p className="feature-description">
                It recognizes your task and gives an answer with steps within seconds.
              </p>
            </div>
            <div className="feature-illustration">
              <QuestionBubbleSVG />
              <CheckBubbleSVG />
              <div className="illustration-shape blue"></div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-row">
            <div className="feature-content">
              <h2 className="feature-title">Expert help in real-time.</h2>
              <p className="feature-description">
                Best math tutor assigned to you in online chat whenever you need.
              </p>
            </div>
            <div className="feature-illustration">
              <DiagramSVG />
              <div className="illustration-shape pink"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">10M+</span>
              <span className="stat-label">users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10k+</span>
              <span className="stat-label">tasks solved daily</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1k+</span>
              <span className="stat-label">math experts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">online support</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to make math easy?</h2>
            <p className="cta-description">
              Join millions of students and teachers who trust MathMaster for their math needs.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn-hero btn-hero-primary">
                Get Started Free
              </Link>
              <Link to="/pricing" className="btn-hero btn-hero-secondary">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <span className="logo-icon">fx</span>
                <span className="logo-text">MathMaster</span>
              </Link>
              <p className="footer-description">
                Supreme math solver enhanced by expert help from best math tutors online. Making
                math easy for everyone.
              </p>
            </div>
            <div className="footer-section">
              <h4>Follow us</h4>
              <div className="footer-links">
                <a href="https://facebook.com" className="footer-link">
                  Facebook
                </a>
                <a href="https://instagram.com" className="footer-link">
                  Instagram
                </a>
                <a href="https://twitter.com" className="footer-link">
                  Twitter
                </a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <div className="footer-links">
                <Link to="/qa" className="footer-link">
                  Q & A
                </Link>
                <Link to="/blog" className="footer-link">
                  BLOG
                </Link>
                <Link to="/tutorials" className="footer-link">
                  TUTORIALS
                </Link>
                <Link to="/calculators" className="footer-link">
                  CALCULATORS
                </Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>Download App</h4>
              <div className="footer-links">
                <a href="#" className="footer-link">
                  TRY ON WEB
                </a>
                <a href="#" className="footer-link">
                  APPLE STORE
                </a>
                <a href="#" className="footer-link">
                  GOOGLE PLAY
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">2023 © Appslux Media Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
