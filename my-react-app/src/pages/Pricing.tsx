import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { AuthService } from '../services/api/auth.service';
import {
  SubscriptionPlanService,
  formatPrice,
  type MySubscriptionResponse,
  type SubscriptionPlan,
} from '../services/api/subscription-plan.service';
import { WalletService } from '../services/api/wallet.service';
import type { WalletSummary } from '../types/wallet.types';
import './Homepage.css';
import './Pricing.css';

const Pricing: React.FC = () => {
  const isAuthenticated = AuthService.isAuthenticated();
  const [userPlans, setUserPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<MySubscriptionResponse | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loadingSubscriptionData, setLoadingSubscriptionData] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

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

  /* ── Comparison table data ── */
  const comparisonFeatures = [
    { name: 'Số bài giảng/tháng', free: '10', teacher: 'Không giới hạn', school: 'Không giới hạn' },
    { name: 'Lưu trữ', free: '100MB', teacher: '10GB', school: 'Không giới hạn' },
    { name: 'Số lớp học', free: '1', teacher: 'Không giới hạn', school: 'Không giới hạn' },
    { name: 'AI trợ lý', free: 'Cơ bản', teacher: 'Nâng cao', school: 'Nâng cao' },
    { name: 'Thư viện tài liệu cao cấp', free: false, teacher: true, school: true },
    { name: 'Xuất file không watermark', free: false, teacher: true, school: true },
    { name: 'Hỗ trợ ưu tiên', free: false, teacher: true, school: true },
    { name: 'Không giới hạn tài khoản', free: false, teacher: false, school: true },
    { name: 'Dashboard quản trị', free: false, teacher: false, school: true },
    { name: 'API tích hợp', free: false, teacher: false, school: true },
    { name: 'Đào tạo chuyên biệt', free: false, teacher: false, school: true },
    { name: 'Tùy chỉnh theo yêu cầu', free: false, teacher: false, school: true },
  ];

  /* ── Fade-in on scroll (IntersectionObserver) ── */
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pricing-animate-in');
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setLoadingSubscriptionData(true);
      setSubscriptionError('');

      try {
        const [plansRes, walletRes] = await Promise.all([
          SubscriptionPlanService.getUserPlans(),
          WalletService.getMyWallet(),
        ]);

        setUserPlans(plansRes.result || []);
        setWallet(walletRes.result || null);

        try {
          const subscriptionRes = await SubscriptionPlanService.getMySubscription();
          setActiveSubscription(subscriptionRes.result || null);
        } catch {
          setActiveSubscription(null);
        }
      } catch (error) {
        setSubscriptionError(
          error instanceof Error ? error.message : 'Khong the tai du lieu goi dang ky.'
        );
      } finally {
        setLoadingSubscriptionData(false);
      }
    };

    void loadData();
  }, [isAuthenticated]);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!plan.price || plan.price <= 0) {
      setSubscriptionError('Goi nay khong ho tro mua truc tiep.');
      return;
    }

    if ((wallet?.balance ?? 0) < plan.price) {
      setSubscriptionError('So du khong du de mua goi nay.');
      return;
    }

    setPurchasingPlanId(plan.id);
    setSubscriptionError('');
    setSubscriptionSuccess('');

    try {
      await SubscriptionPlanService.purchasePlan(plan.id);
      const [walletRes, subscriptionRes] = await Promise.all([
        WalletService.getMyWallet(),
        SubscriptionPlanService.getMySubscription(),
      ]);
      setWallet(walletRes.result || null);
      setActiveSubscription(subscriptionRes.result || null);
      setSubscriptionSuccess('Mua goi thanh cong. Token da duoc cap nhat.');
    } catch (error) {
      const apiError = error as Error & { code?: number };
      if (apiError.code === 1029) {
        setSubscriptionError('So du khong du');
      } else if (apiError.code === 1163) {
        setSubscriptionError('Goi khong ho tro mua truc tiep');
      } else {
        setSubscriptionError(apiError.message || 'Mua goi that bai, vui long thu lai.');
      }
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const addSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionsRef.current[index] = el;
  };

  /* ── Helper: render comparison cell value ── */
  const renderCellValue = (value: boolean | string, isFeaturedCol: boolean) => {
    if (typeof value === 'string') {
      return (
        <span className={`pricing-ct-text ${isFeaturedCol ? 'pricing-ct-text--featured' : ''}`}>
          {value}
        </span>
      );
    }
    if (value === true) {
      return (
        <span className={`pricing-ct-check ${isFeaturedCol ? 'pricing-ct-check--primary' : ''}`}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    }
    return <span className="pricing-ct-cross">—</span>;
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
            <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>
              Bảng giá
            </span>
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
      {isAuthenticated && (
        <section className="pricing-cards-section">
          <div className="container">
            <div className="pricing-comparison-header" style={{ marginBottom: '1.2rem' }}>
              <span className="ft-badge ft-badge--green" style={{ marginBottom: '1rem' }}>
                Subscription + Token
              </span>
              <h2 className="pricing-comparison-title">Mua gói bằng ví</h2>
              {wallet && (
                <p className="pricing-hero-desc" style={{ marginTop: '0.4rem' }}>
                  So du vi: <strong>{formatPrice(wallet.balance)}</strong>
                  {activeSubscription && (
                    <>
                      {' '}
                      | Goi active: <strong>{activeSubscription.planName}</strong> | Token con lai:{' '}
                      <strong>{activeSubscription.tokenRemaining}</strong>
                    </>
                  )}
                </p>
              )}
            </div>

            {loadingSubscriptionData && <p>Dang tai du lieu goi...</p>}
            {subscriptionError && (
              <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '1rem' }}>
                {subscriptionError}
              </p>
            )}
            {subscriptionSuccess && (
              <p style={{ color: '#16a34a', fontWeight: 600, marginBottom: '1rem' }}>
                {subscriptionSuccess}
              </p>
            )}

            {!loadingSubscriptionData && userPlans.length > 0 && (
              <div className="pricing-cards-grid">
                {userPlans.map((plan) => {
                  const price = plan.price ?? 0;
                  const walletBalance = wallet?.balance ?? 0;
                  const isInsufficientBalance = price > 0 && walletBalance < price;
                  const isCurrentPlan = activeSubscription?.planId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`pricing-plan-card ${plan.featured ? 'pricing-plan-card--featured' : ''}`}
                    >
                      <div className="pricing-plan-header">
                        <h3 className="pricing-plan-name">{plan.name}</h3>
                        <p className="pricing-plan-desc">
                          {plan.description || 'Goi dang ky cho nguoi dung'}
                        </p>
                      </div>
                      <div className="pricing-plan-price-block">
                        <span className="pricing-plan-price">{formatPrice(plan.price)}</span>
                        <span className="pricing-plan-period">
                          /{plan.billingCycle.toLowerCase()}
                        </span>
                      </div>
                      <p className="pricing-plan-desc" style={{ marginBottom: '0.75rem' }}>
                        Token quota: <strong>{plan.tokenQuota}</strong>
                      </p>
                      <button
                        type="button"
                        className={`pricing-plan-btn ${plan.featured ? 'pricing-plan-btn--primary' : 'pricing-plan-btn--outline'}`}
                        onClick={() => void handlePurchase(plan)}
                        disabled={
                          !!purchasingPlanId || isCurrentPlan || isInsufficientBalance || !price
                        }
                        title={isInsufficientBalance ? 'So du vi khong du' : undefined}
                      >
                        {isCurrentPlan
                          ? 'Dang su dung'
                          : purchasingPlanId === plan.id
                            ? 'Dang mua...'
                            : isInsufficientBalance
                              ? 'So du khong du'
                              : !price
                                ? 'Khong mua truc tiep'
                                : 'Mua bang vi'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="pricing-cards-section" ref={addSectionRef(0)}>
        <div className="container">
          <div className="pricing-cards-grid">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-plan-card ${plan.highlighted ? 'pricing-plan-card--featured' : ''}`}
              >
                {plan.highlighted && (
                  <div className="pricing-popular-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
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
                      <span
                        className={`pricing-check ${plan.highlighted ? 'pricing-check--primary' : ''}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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

      {/* ── Comparison Table ── */}
      <section className="pricing-comparison-section" ref={addSectionRef(1)}>
        <div className="container">
          <div className="pricing-comparison-header">
            <span className="ft-badge ft-badge--orange" style={{ marginBottom: '1rem' }}>
              So sánh
            </span>
            <h2 className="pricing-comparison-title">
              So sánh chi tiết <span className="gradient-text">các gói</span>
            </h2>
          </div>
          <div className="pricing-comparison-table-wrap">
            <div className="pricing-comparison-table">
              {/* Header */}
              <div className="pricing-ct-header">
                <div className="pricing-ct-header-cell">Tính năng</div>
                <div className="pricing-ct-header-cell">Miễn phí</div>
                <div className="pricing-ct-header-cell pricing-ct-header-cell--featured">
                  Giáo viên
                </div>
                <div className="pricing-ct-header-cell">Trường học</div>
              </div>
              {/* Rows */}
              {comparisonFeatures.map((row, idx) => (
                <div className="pricing-ct-row" key={idx}>
                  <div className="pricing-ct-cell">{row.name}</div>
                  <div className="pricing-ct-cell">{renderCellValue(row.free, false)}</div>
                  <div className="pricing-ct-cell pricing-ct-cell--featured">
                    {renderCellValue(row.teacher, true)}
                  </div>
                  <div className="pricing-ct-cell">{renderCellValue(row.school, false)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pricing-faq-section" ref={addSectionRef(2)}>
        <div className="features-bg-dots" aria-hidden="true" />
        <div className="container">
          <div className="pricing-faq-header">
            <span className="ft-badge ft-badge--blue" style={{ marginBottom: '1rem' }}>
              FAQ
            </span>
            <h2 className="pricing-faq-title">
              Câu hỏi <span className="gradient-text">thường gặp</span>
            </h2>
          </div>
          <div className="pricing-faq-grid">
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có thể thay đổi gói sau khi đăng ký không?</h4>
              <p className="pricing-faq-a">
                Có, bạn có thể nâng cấp hoặc hạ cấp gói bất kỳ lúc nào.
              </p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có chính sách hoàn tiền không?</h4>
              <p className="pricing-faq-a">
                Chúng tôi có chính sách hoàn tiền trong vòng 14 ngày nếu không hài lòng.
              </p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Thanh toán như thế nào?</h4>
              <p className="pricing-faq-a">
                Chấp nhận thanh toán qua thẻ, chuyển khoản, hoặc ví điện tử.
              </p>
            </div>
            <div className="pricing-faq-card">
              <h4 className="pricing-faq-q">Có hỗ trợ đào tạo không?</h4>
              <p className="pricing-faq-a">
                Gói Trường học có đào tạo chuyên biệt. Các gói khác có tài liệu hướng dẫn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pricing-cta-section" ref={addSectionRef(3)}>
        <div className="container">
          <div className="pricing-cta-card">
            <div className="pricing-cta-glow" aria-hidden="true" />
            <span className="ft-badge ft-badge--green" style={{ marginBottom: '1rem' }}>
              Bắt đầu ngay
            </span>
            <h2 className="pricing-cta-title">
              Sẵn sàng tối ưu hóa <span className="gradient-text">bài giảng</span> của bạn?
            </h2>
            <p className="pricing-cta-desc">
              Tham gia cùng hàng nghìn giáo viên đã lựa chọn MathMaster. Dùng thử miễn phí, không
              cần thẻ tín dụng.
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
