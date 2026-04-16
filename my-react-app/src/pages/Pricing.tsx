import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockStudent, mockTeacher } from '../data/mockData';
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

/* ── Trust stats shown in the hero (unauthenticated) ── */
const trustStats = [
  { icon: '👩‍🏫', value: '5,000+', label: 'Giáo viên' },
  { icon: '⭐', value: '4.9', label: 'Đánh giá' },
  { icon: '🎁', value: '30 ngày', label: 'Miễn phí' },
];

/* ── FAQ accordion data ── */
const faqItems = [
  {
    q: 'Có thể thay đổi gói sau khi đăng ký không?',
    a: 'Có, bạn có thể nâng cấp hoặc hạ cấp gói bất kỳ lúc nào. Thay đổi sẽ có hiệu lực ngay lập tức.',
  },
  {
    q: 'Có chính sách hoàn tiền không?',
    a: 'Chúng tôi có chính sách hoàn tiền trong vòng 14 ngày nếu bạn không hài lòng với dịch vụ.',
  },
  {
    q: 'Thanh toán như thế nào?',
    a: 'Chúng tôi chấp nhận thanh toán qua thẻ ngân hàng, chuyển khoản trực tiếp, hoặc ví điện tử (MoMo, ZaloPay…).',
  },
  {
    q: 'Có hỗ trợ đào tạo không?',
    a: 'Gói Trường học bao gồm buổi đào tạo chuyên biệt. Các gói còn lại có tài liệu hướng dẫn chi tiết và video hướng dẫn.',
  },
  {
    q: 'Token AI là gì?',
    a: 'Token AI là đơn vị tính cho các tính năng AI như sinh đề, chấm điểm tự động. Mỗi gói đăng ký đi kèm một quota token tương ứng.',
  },
  {
    q: 'Dữ liệu bài giảng của tôi có được bảo mật không?',
    a: 'Toàn bộ dữ liệu được mã hóa AES-256 và lưu trữ trên hạ tầng bảo mật chuẩn SOC 2. Chúng tôi không chia sẻ dữ liệu với bất kỳ bên thứ ba nào.',
  },
];

/* ── Plan icon mapping ── */
const planIcons: Record<string, string> = {
  free: '🌱',
  basic: '⚡',
  pro: '🚀',
  enterprise: '🏫',
  default: '📦',
};

const getPlanIcon = (name: string): string => {
  const lower = name.toLowerCase();
  // Free / starter tier
  if (lower.includes('miễn phí') || lower.includes('free') || lower.includes('khởi đầu') || lower.includes('khoi dau') || lower.includes('starter')) return planIcons.free;
  // Pro / teacher / standard tier
  if (lower.includes('pro') || lower.includes('giáo viên') || lower.includes('giao vien') || lower.includes('cơ bản') || lower.includes('co ban') || lower.includes('basic') || lower.includes('standard')) return planIcons.pro;
  // Enterprise / school / premium tier
  if (lower.includes('trường') || lower.includes('truong') || lower.includes('school') || lower.includes('enterprise') || lower.includes('cao cấp') || lower.includes('cao cap') || lower.includes('premium') || lower.includes('advanced')) return planIcons.enterprise;
  return planIcons.default;
};

/* ── FAQ Accordion Item ── */
const FaqItem: React.FC<{ q: string; a: string; index: number }> = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`pricing-faq-item ${open ? 'pricing-faq-item--open' : ''}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <button
        type="button"
        className="pricing-faq-question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg
          className="pricing-faq-chevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="pricing-faq-answer">
        <p>{a}</p>
      </div>
    </div>
  );
};

/* ── Skeleton Card ── */
const PlanCardSkeleton: React.FC = () => (
  <div className="pricing-plan-card pricing-skeleton-card">
    <div className="pricing-skeleton pricing-skeleton--icon" />
    <div className="pricing-skeleton pricing-skeleton--title" />
    <div className="pricing-skeleton pricing-skeleton--subtitle" />
    <div className="pricing-skeleton pricing-skeleton--price" />
    <div className="pricing-skeleton pricing-skeleton--btn" />
  </div>
);

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  const currentRole = AuthService.getUserRole() || 'student';
  const layoutRole: 'teacher' | 'student' | 'admin' =
    currentRole === 'teacher' ? 'teacher' : currentRole === 'admin' ? 'admin' : 'student';
  const currentUser =
    layoutRole === 'teacher' ? mockTeacher : layoutRole === 'admin' ? mockAdmin : mockStudent;
  const [userPlans, setUserPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<MySubscriptionResponse | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loadingSubscriptionData, setLoadingSubscriptionData] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

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
      { threshold: 0.08 }
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
          error instanceof Error ? error.message : 'Không thể tải dữ liệu gói đăng ký.'
        );
      } finally {
        setLoadingSubscriptionData(false);
      }
    };

    void loadData();
  }, [isAuthenticated]);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!plan.price || plan.price <= 0) {
      setSubscriptionError('Gói này không hỗ trợ mua trực tiếp.');
      return;
    }

    if ((wallet?.balance ?? 0) < plan.price) {
      setSubscriptionError('Số dư ví không đủ để mua gói này.');
      setShowWalletModal(true);
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
      setSubscriptionSuccess('🎉 Mua gói thành công! Token đã được cập nhật vào tài khoản.');
    } catch (error) {
      const apiError = error as Error & { code?: number };
      if (apiError.code === 1029) {
        setSubscriptionError('Số dư ví không đủ.');
        setShowWalletModal(true);
      } else if (apiError.code === 1163) {
        setSubscriptionError('Gói không hỗ trợ mua trực tiếp.');
      } else {
        setSubscriptionError(apiError.message || 'Mua gói thất bại, vui lòng thử lại.');
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

  /* ── Token progress percentage ── */
  const tokenPercent =
    activeSubscription && activeSubscription.tokenQuota > 0
      ? Math.round((activeSubscription.tokenRemaining / activeSubscription.tokenQuota) * 100)
      : null;

  /* ── Wallet Modal ── */
  const walletModal = showWalletModal ? (
    <div className="pricing-modal-overlay">
      <dialog open className="pricing-modal" aria-labelledby="wallet-modal-title">
        <div className="pricing-modal-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <h3 className="pricing-modal-title" id="wallet-modal-title">
          Số dư ví không đủ
        </h3>
        <p className="pricing-modal-desc">
          Số dư trong ví của bạn không đủ để mua gói này. Bạn có muốn chuyển đến trang nạp tiền
          không?
        </p>
        <div className="pricing-modal-actions">
          <button
            type="button"
            className="pricing-modal-btn pricing-modal-btn--outline"
            onClick={() => setShowWalletModal(false)}
          >
            Để sau
          </button>
          <button
            type="button"
            className="pricing-modal-btn pricing-modal-btn--primary"
            onClick={() => {
              setShowWalletModal(false);
              navigate('/student/wallet');
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Nạp tiền ngay
          </button>
        </div>
      </dialog>
    </div>
  ) : null;

  /* ════════════════════════════════════
     AUTHENTICATED VIEW
     ════════════════════════════════════ */
  if (isAuthenticated) {
    return (
      <>
        <DashboardLayout
          role={layoutRole}
          user={{ name: currentUser.name, avatar: currentUser.avatar!, role: layoutRole }}
          notificationCount={5}
        >
          <div className="homepage">
            {/* Hero */}
            <section className="pricing-hero pricing-hero--dashboard">
              <div className="pricing-hero-dots" aria-hidden="true" />
              <div className="container">
                <div className="pricing-hero-content">
                  <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>
                    Bảng giá
                  </span>
                  <h1 className="pricing-hero-title">Subscription &amp; Token</h1>
                  <p className="pricing-hero-desc">
                    Mua gói bằng ví và theo dõi token còn lại theo subscription active.
                  </p>

                  {/* Trust stats for dashboard view too */}
                  <div className="pricing-trust-bar">
                    {trustStats.map((stat, i) => (
                      <div className="pricing-trust-pill" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                        <span className="pricing-trust-pill__icon">{stat.icon}</span>
                        <strong className="pricing-trust-pill__value">{stat.value}</strong>
                        <span className="pricing-trust-pill__label">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Wallet Banner + Plan Cards */}
            <section className="pricing-cards-section">
              <div className="container">
                {/* Premium wallet / subscription banner */}
                <div className="pricing-wallet-banner">
                  <div className="pricing-wallet-banner__glow" aria-hidden="true" />
                  <div className="pricing-wallet-banner__col">
                    <span className="pricing-wallet-banner__label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Số dư ví
                    </span>
                    <span className="pricing-wallet-banner__value">
                      {wallet ? formatPrice(wallet.balance) : '—'}
                    </span>
                  </div>

                  <div className="pricing-wallet-banner__divider" />

                  <div className="pricing-wallet-banner__col">
                    <span className="pricing-wallet-banner__label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Gói hiện tại
                    </span>
                    <span className="pricing-wallet-banner__value">
                      {activeSubscription ? (
                        <span className="pricing-active-plan-badge">{activeSubscription.planName}</span>
                      ) : (
                        <span style={{ color: 'var(--c-text-3)' }}>Chưa có gói</span>
                      )}
                    </span>
                  </div>

                  {activeSubscription && tokenPercent !== null && (
                    <>
                      <div className="pricing-wallet-banner__divider" />
                      <div className="pricing-wallet-banner__col pricing-wallet-banner__col--token">
                        <span className="pricing-wallet-banner__label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
                          </svg>
                          Token còn lại
                        </span>
                        <span className="pricing-wallet-banner__value">
                          {activeSubscription.tokenRemaining}
                          <span className="pricing-wallet-banner__quota"> / {activeSubscription.tokenQuota}</span>
                        </span>
                        <div className="pricing-token-bar">
                          <div
                            className="pricing-token-bar__fill"
                            style={{ width: `${tokenPercent}%` }}
                          />
                        </div>
                        <span className="pricing-token-percent">{tokenPercent}% còn lại</span>
                      </div>
                    </>
                  )}

                  <div className="pricing-wallet-banner__action">
                    <button
                      type="button"
                      className="pricing-wallet-topup-btn"
                      onClick={() => navigate('/student/wallet')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Nạp tiền
                    </button>
                  </div>
                </div>

                {/* Status messages */}
                {subscriptionError && (
                  <div className="pricing-alert pricing-alert--error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {subscriptionError}
                  </div>
                )}
                {subscriptionSuccess && (
                  <div className="pricing-alert pricing-alert--success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {subscriptionSuccess}
                  </div>
                )}

                {/* Plan cards */}
                <div className="pricing-cards-grid">
                  {loadingSubscriptionData ? (
                    <>
                      <PlanCardSkeleton />
                      <PlanCardSkeleton />
                      <PlanCardSkeleton />
                    </>
                  ) : (
                    userPlans.map((plan) => {
                      const price = plan.price ?? 0;
                      const walletBalance = wallet?.balance ?? 0;
                      const isInsufficientBalance = price > 0 && walletBalance < price;
                      const isCurrentPlan = activeSubscription?.planId === plan.id;
                      const icon = getPlanIcon(plan.name);

                      return (
                        <div
                          key={plan.id}
                          className={`pricing-plan-card ${plan.featured ? 'pricing-plan-card--featured' : ''} ${isCurrentPlan ? 'pricing-plan-card--active' : ''}`}
                        >
                          {isCurrentPlan && (
                            <div className="pricing-current-plan-badge">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Đang dùng
                            </div>
                          )}
                          {plan.featured && !isCurrentPlan && (
                            <div className="pricing-popular-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              Phổ biến nhất
                            </div>
                          )}

                          <div className="pricing-plan-icon">{icon}</div>

                          <div className="pricing-plan-header">
                            <h3 className="pricing-plan-name">{plan.name}</h3>
                            <p className="pricing-plan-desc">
                              {plan.description || 'Gói đăng ký cho người dùng'}
                            </p>
                          </div>

                          <div className="pricing-plan-price-block">
                            <span className="pricing-plan-price">{formatPrice(plan.price)}</span>
                            <span className="pricing-plan-period">
                              /{plan.billingCycle.toLowerCase()}
                            </span>
                          </div>

                          <div className="pricing-token-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
                            </svg>
                            {plan.tokenQuota.toLocaleString()} token / kỳ
                          </div>

                          <button
                            type="button"
                            className={`pricing-plan-btn ${plan.featured ? 'pricing-plan-btn--primary' : 'pricing-plan-btn--outline'}`}
                            onClick={() => void handlePurchase(plan)}
                            disabled={!!purchasingPlanId || isCurrentPlan || !price}
                            title={isInsufficientBalance ? 'Số dư ví không đủ' : undefined}
                          >
                            {purchasingPlanId === plan.id ? (
                              <><span className="pricing-btn-spinner" />Đang mua...</>
                            ) : isCurrentPlan ? (
                              'Đang sử dụng'
                            ) : !price ? (
                              'Không mua trực tiếp'
                            ) : isInsufficientBalance ? (
                              '⚠️ Số dư không đủ'
                            ) : (
                              'Mua ngay'
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        </DashboardLayout>
        {walletModal}
      </>
    );
  }

  /* ════════════════════════════════════
     UNAUTHENTICATED VIEW
     ════════════════════════════════════ */
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
              Dùng thử miễn phí 30 ngày. Nâng cấp hoặc hạ cấp bất kỳ lúc nào. Không cần thẻ tín
              dụng.
            </p>

            {/* Trust stats bar */}
            <div className="pricing-trust-bar">
              {trustStats.map((stat, i) => (
                <div className="pricing-trust-pill" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                  <span className="pricing-trust-pill__icon">{stat.icon}</span>
                  <strong className="pricing-trust-pill__value">{stat.value}</strong>
                  <span className="pricing-trust-pill__label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
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

                <div className="pricing-plan-icon">{getPlanIcon(plan.name)}</div>

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

      {/* ── FAQ Accordion ── */}
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
            <p className="pricing-hero-desc" style={{ marginTop: '0.75rem' }}>
              Không tìm được câu trả lời?{' '}
              <Link to="/contact" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>
                Liên hệ chúng tôi
              </Link>
            </p>
          </div>
          <div className="pricing-faq-accordion">
            {faqItems.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} index={i} />
            ))}
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
              Tham gia cùng <strong>5,000+</strong> giáo viên đã lựa chọn MathMaster. Dùng thử miễn
              phí, không cần thẻ tín dụng.
            </p>

            {/* Social proof avatars */}
            <div className="pricing-cta-avatars">
              {['👩‍🏫', '👨‍🏫', '👩‍💻', '👨‍🎓', '👩‍🔬'].map((emoji, i) => (
                <span key={i} className="pricing-cta-avatar" style={{ zIndex: 5 - i }}>
                  {emoji}
                </span>
              ))}
              <span className="pricing-cta-avatar-label">+5,000 giáo viên</span>
            </div>

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
      {walletModal}
    </div>
  );
};

export default Pricing;
