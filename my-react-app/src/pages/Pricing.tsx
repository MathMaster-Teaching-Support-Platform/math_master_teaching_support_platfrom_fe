import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../constants/uiText';
import { mockAdmin, mockStudent, mockTeacher } from '../data/mockData';
import { AuthService } from '../services/api/auth.service';
import {
  SubscriptionPlanService,
  formatPrice,
  type MySubscriptionResponse,
  type SubscriptionPlan,
} from '../services/api/subscription-plan.service';
import { WalletService } from '../services/api/wallet.service';
import '../styles/module-refactor.css';
import type { WalletSummary } from '../types/wallet.types';
import './courses/TeacherCourses.css';
import './Homepage.css';
import './Pricing.css';
import './PricingModule.css';

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
    q: `Dữ liệu ${UI_TEXT.COURSE.toLowerCase()} của tôi có được bảo mật không?`,
    a: `Toàn bộ dữ liệu được mã hóa AES-256 và lưu trữ trên hạ tầng bảo mật chuẩn SOC 2. Chúng tôi không chia sẻ dữ liệu với bất kỳ bên thứ ba nào.`,
  },
];

type PlanTier = 'free' | 'basic' | 'pro' | 'enterprise';

/* Cover gradients (same palette as TeacherCourses) */
const planCoverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;
const planCoverAccents = [
  '#1d4ed8',
  '#0f766e',
  '#047857',
  '#c2410c',
  '#be185d',
  '#6d28d9',
] as const;

const getPlanTier = (name: string): PlanTier => {
  const lower = name.toLowerCase();
  if (
    lower.includes('miễn phí') ||
    lower.includes('free') ||
    lower.includes('khởi đầu') ||
    lower.includes('starter')
  )
    return 'free';
  if (
    lower.includes('pro') ||
    lower.includes('giáo viên') ||
    lower.includes('cơ bản') ||
    lower.includes('basic') ||
    lower.includes('standard')
  )
    return 'pro';
  if (
    lower.includes('trường') ||
    lower.includes('school') ||
    lower.includes('enterprise') ||
    lower.includes('cao cấp') ||
    lower.includes('premium')
  )
    return 'enterprise';
  return 'basic';
};

const PlanIcon: React.FC<{ tier: PlanTier }> = ({ tier }) => {
  if (tier === 'free')
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  if (tier === 'basic')
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  if (tier === 'pro')
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 20h20" />
        <polygon points="2 20 5 9 12 14 19 4 22 20" />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 22 9 18 20 6 20 2 9" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="6" y1="20" x2="9" y2="9" />
      <line x1="18" y1="20" x2="15" y2="9" />
      <line x1="12" y1="2" x2="12" y2="9" />
    </svg>
  );
};

/* Nổi bật gói cơ bản / Giáo viên — gradient warm, tách với gói phụ */
const PRICING_SPOTLIGHT_COVER: React.CSSProperties = {
  background: 'linear-gradient(165deg, #fffcf8 0%, #ffecd8 45%, #e0b38a 100%)',
  color: '#7a2b0a',
};

/* ── Plan card: TeacherCourses-style cover + body (module layout) ── */
type ModulePlanCardProps = {
  listIndex: number;
  displayIndex: number;
  tier: PlanTier;
  name: string;
  description: string;
  priceBlock: React.ReactNode;
  tokenLine: string | null;
  featured: boolean;
  isCurrent: boolean;
  cta: React.ReactNode;
  features?: React.ReactNode;
};

const ModulePlanCard: React.FC<ModulePlanCardProps> = ({
  listIndex,
  displayIndex,
  tier,
  name,
  description,
  priceBlock,
  tokenLine,
  featured,
  isCurrent,
  cta,
  features,
}) => {
  const gi = listIndex % planCoverGradients.length;
  const g = planCoverGradients[gi];
  const a = planCoverAccents[gi];
  return (
    <article
      className={`data-card course-card pricing-m-plan-card ${featured ? 'pricing-m-plan-card--featured' : 'pricing-m-plan-card--rest'} ${isCurrent ? 'pricing-m-plan-card--current' : ''}`}
    >
      <div
        className={`course-cover ${featured ? 'pricing-m-cover--spotlight' : 'pricing-m-cover--standard'}`}
        style={featured ? PRICING_SPOTLIGHT_COVER : { background: g, color: a }}
      >
        <div className={`cover-overlay ${featured ? 'cover-overlay--spotlight' : ''}`} />
        <div className="cover-index" aria-hidden>
          #{String(displayIndex + 1).padStart(2, '0')}
        </div>
        {isCurrent && <span className="course-badge badge-pricing-current">Đang dùng</span>}
        {featured && !isCurrent && (
          <span className="course-badge badge-pricing-popular">Phổ biến</span>
        )}
        <div className="pricing-m-plan-icon" aria-hidden>
          <PlanIcon tier={tier} />
        </div>
        <h3 className="cover-title">{name}</h3>
      </div>
      <div className="course-body">
        <p className="course-desc">{description}</p>
        {priceBlock}
        {tokenLine && (
          <div className="metric">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l2 2" />
            </svg>
            {tokenLine}
          </div>
        )}
        <div className="course-actions pricing-m-plan-actions">{cta}</div>
        {features}
      </div>
    </article>
  );
};

/* ── FAQ Accordion Item ── */
const FaqItem: React.FC<{ q: string; a: string; index: number }> = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
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
        aria-controls={panelId}
        id={`${panelId}-trigger`}
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
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className="pricing-faq-answer"
        id={panelId}
        aria-labelledby={`${panelId}-trigger`}
        aria-hidden={!open}
      >
        <p>{a}</p>
      </div>
    </div>
  );
};

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  const currentRole = AuthService.getUserRole() || 'student';
  const layoutRole: 'teacher' | 'student' | 'admin' =
    currentRole === 'teacher' ? 'teacher' : currentRole === 'admin' ? 'admin' : 'student';
  const currentUser =
    layoutRole === 'teacher' ? mockTeacher : layoutRole === 'admin' ? mockAdmin : mockStudent;
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('');
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const userPlansQuery = useQuery({
    queryKey: ['pricing', 'user-plans'],
    queryFn: () => SubscriptionPlanService.getUserPlans(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const walletQuery = useQuery({
    queryKey: ['pricing', 'wallet-summary'],
    queryFn: () => WalletService.getMyWallet(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const mySubscriptionQuery = useQuery({
    queryKey: ['pricing', 'my-subscription'],
    queryFn: () => SubscriptionPlanService.getMySubscription(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  const userPlans: SubscriptionPlan[] = userPlansQuery.data?.result || [];
  const activeSubscription: MySubscriptionResponse | null =
    mySubscriptionQuery.data?.result || null;
  const wallet: WalletSummary | null = walletQuery.data?.result || null;
  const loadingSubscriptionData = userPlansQuery.isLoading || walletQuery.isLoading;

  const scrollToPricingSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const plans = [
    {
      name: 'Miễn phí',
      price: '0đ',
      period: '/tháng',
      tokenLine: '50 token / kỳ',
      description: 'Phù hợp để trải nghiệm',
      features: [
        `Tạo tối đa 10 ${UI_TEXT.COURSE.toLowerCase()}/tháng`,
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
      tokenLine: '150 token / kỳ',
      description: 'Dành cho giáo viên cá nhân',
      features: [
        `Tạo không giới hạn ${UI_TEXT.COURSE.toLowerCase()}`,
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
      tokenLine: '400 token / kỳ',
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
    {
      name: `Số ${UI_TEXT.COURSE.toLowerCase()}/tháng`,
      free: '10',
      teacher: 'Không giới hạn',
      school: 'Không giới hạn',
    },
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

  /* ── Fade-in on scroll (public marketing page only) ── */
  useEffect(() => {
    if (isAuthenticated) return;

    const nodes = document.querySelectorAll<HTMLElement>('[data-pricing-reveal]');
    if (nodes.length === 0) return;

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

    nodes.forEach((el) => {
      el.style.opacity = '0';
      observer.observe(el);
    });

    return () => observer.disconnect();
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
      await Promise.all([walletQuery.refetch(), mySubscriptionQuery.refetch()]);
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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (userPlansQuery.error || walletQuery.error) {
      setSubscriptionError('Không thể tải dữ liệu gói đăng ký.');
    }
  }, [isAuthenticated, userPlansQuery.error, walletQuery.error]);

  useEffect(() => {
    if (!showWalletModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowWalletModal(false);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [showWalletModal]);

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
    <div className="pricing-modal-root">
      <button
        type="button"
        className="pricing-modal-backdrop"
        onClick={() => setShowWalletModal(false)}
        tabIndex={-1}
        aria-label="Đóng hộp thoại (nhấn Escape)"
      />
      <dialog
        open
        className="pricing-modal"
        aria-labelledby="wallet-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
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
              navigate(`/${layoutRole}/wallet`);
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
          contentClassName="dashboard-content--flush-bleed"
        >
          <div className="module-layout-container pricing-module-page-wrap">
            <section className="module-page pricing-subscription-page teacher-courses-page teacher-courses-index-page">
              <header className="page-header courses-header-row">
                <div className="header-stack">
                  <div className="row" style={{ gap: '0.6rem' }}>
                    <h2 id="pricing-dashboard-heading">Bảng giá &amp; token</h2>
                    {!loadingSubscriptionData && userPlans.length > 0 && (
                      <span className="count-chip">{userPlans.length}</span>
                    )}
                  </div>
                  <p className="header-sub">
                    {wallet
                      ? `${formatPrice(wallet.balance)} trong ví${
                          activeSubscription
                            ? ` · ${activeSubscription.tokenRemaining}/${activeSubscription.tokenQuota} token`
                            : ''
                        }`
                      : 'Mua gói bằng số dư ví, theo dõi hạn mức token theo gói đang hoạt động'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigate(`/${layoutRole}/wallet`)}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Nạp tiền
                </button>
              </header>

              <div className="stats-grid stats-grid--pricing-two">
                <div className="stat-card stat-blue">
                  <div className="stat-icon-wrap">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h3>{wallet ? formatPrice(wallet.balance) : '—'}</h3>
                    <p>Số dư ví</p>
                  </div>
                </div>
                <div className="stat-card stat-emerald">
                  <div className="stat-icon-wrap">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l2 2" />
                    </svg>
                  </div>
                  <div>
                    <h3>
                      {activeSubscription
                        ? `${activeSubscription.tokenRemaining} / ${activeSubscription.tokenQuota}`
                        : '—'}
                    </h3>
                    <p>Token còn lại</p>
                  </div>
                </div>
              </div>

              {activeSubscription && tokenPercent !== null && (
                <div className="pricing-m-token-block">
                  <div className="pricing-m-token-meta">
                    <span>Tiến độ token (kỳ hiện tại)</span>
                    <strong>{tokenPercent}%</strong>
                  </div>
                  <div className="pricing-m-token-bar" aria-hidden>
                    <div
                      className="pricing-m-token-bar__fill"
                      style={{ width: `${tokenPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status messages + plans */}
              {subscriptionError && (
                <div className="pricing-alert pricing-alert--error" role="alert">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="pricing-alert__text">{subscriptionError}</span>
                  <button
                    type="button"
                    className="pricing-alert-dismiss"
                    onClick={() => setSubscriptionError('')}
                    aria-label="Đóng thông báo lỗi"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              {subscriptionSuccess && (
                <div className="pricing-alert pricing-alert--success" role="status">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="pricing-alert__text">{subscriptionSuccess}</span>
                  <button
                    type="button"
                    className="pricing-alert-dismiss"
                    onClick={() => setSubscriptionSuccess('')}
                    aria-label="Đóng thông báo thành công"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="grid-cards pricing-m-plan-grid">
                {loadingSubscriptionData ? (
                  <div className="pricing-skeleton-mesh" style={{ gridColumn: '1 / -1' }}>
                    <div className="skeleton-grid">
                      <div className="skeleton-card" />
                      <div className="skeleton-card" />
                      <div className="skeleton-card" />
                    </div>
                  </div>
                ) : userPlans.length === 0 ? (
                  <div className="empty pricing-m-empty" style={{ gridColumn: '1 / -1' }}>
                    <p>Chưa có gói để hiển thị.</p>
                    <p style={{ color: 'var(--mod-slate-500)', fontSize: '0.9rem' }}>
                      Không tìm thấy gói đăng ký từ máy chủ. Bạn có thể thử tải lại.
                    </p>
                    <button
                      type="button"
                      className="btn"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => {
                        void Promise.all([
                          userPlansQuery.refetch(),
                          walletQuery.refetch(),
                          mySubscriptionQuery.refetch(),
                        ]);
                      }}
                    >
                      Tải lại
                    </button>
                  </div>
                ) : (
                  [...userPlans]
                    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
                    .map((plan, idx) => {
                      const price = plan.price ?? 0;
                      const walletBalance = wallet?.balance ?? 0;
                      const isInsufficientBalance = price > 0 && walletBalance < price;
                      const isCurrentPlan = activeSubscription?.planId === plan.id;
                      const tier = getPlanTier(plan.name);
                      const spotlight = Boolean(plan.featured) || getPlanTier(plan.name) === 'pro';
                      const ctaPrimary = spotlight;

                      const btn = (
                        <button
                          type="button"
                          className={ctaPrimary ? 'action-primary' : 'action-toggle'}
                          onClick={() => void handlePurchase(plan)}
                          disabled={!!purchasingPlanId || isCurrentPlan || !price}
                          title={isInsufficientBalance ? 'Số dư ví không đủ' : undefined}
                        >
                          {purchasingPlanId === plan.id ? (
                            <>
                              <span className="pricing-btn-spinner" />
                              Đang mua...
                            </>
                          ) : isCurrentPlan ? (
                            'Đang sử dụng'
                          ) : !price ? (
                            'Không mua trực tiếp'
                          ) : (
                            'Mua ngay'
                          )}
                        </button>
                      );

                      return (
                        <ModulePlanCard
                          key={plan.id}
                          listIndex={idx}
                          displayIndex={idx}
                          tier={tier}
                          name={plan.name}
                          description={plan.description || 'Gói đăng ký cho người dùng'}
                          priceBlock={
                            <div className="pricing-m-price-block">
                              <span className="pricing-m-price">{formatPrice(plan.price)}</span>
                              <span className="pricing-m-period">
                                /{plan.billingCycle.toLowerCase()}
                              </span>
                            </div>
                          }
                          tokenLine={`${plan.tokenQuota.toLocaleString()} token / kỳ`}
                          featured={spotlight}
                          isCurrent={isCurrentPlan}
                          cta={btn}
                        />
                      );
                    })
                )}
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

      <main id="pricing-main">
        {/* ── Hero ── */}
        <section className="pricing-hero" aria-labelledby="pricing-public-heading">
          <div className="pricing-hero-dots" aria-hidden="true" />
          <div className="container">
            <div className="pricing-hero-content">
              <span className="ft-badge ft-badge--purple" style={{ marginBottom: '1.25rem' }}>
                Bảng giá
              </span>
              <h1 className="pricing-hero-title" id="pricing-public-heading">
                Chọn gói <span className="gradient-text">phù hợp với bạn</span>
              </h1>
              <p className="pricing-hero-desc">
                Dùng thử miễn phí 30 ngày. Nâng cấp hoặc hạ cấp bất kỳ lúc nào. Không cần thẻ tín
                dụng.
              </p>

              <nav className="pricing-subnav" aria-label="Mục lục nội dung bảng giá">
                <a
                  href="#pricing-plans"
                  className="pricing-subnav__link"
                  onClick={(e) => scrollToPricingSection(e, 'pricing-plans')}
                >
                  Các gói
                </a>
                <a
                  href="#pricing-compare"
                  className="pricing-subnav__link"
                  onClick={(e) => scrollToPricingSection(e, 'pricing-compare')}
                >
                  So sánh
                </a>
                <a
                  href="#pricing-faq"
                  className="pricing-subnav__link"
                  onClick={(e) => scrollToPricingSection(e, 'pricing-faq')}
                >
                  Câu hỏi thường gặp
                </a>
              </nav>

              {/* Trust stats bar */}
              <div className="pricing-trust-bar">
                {trustStats.map((stat, i) => (
                  <div
                    className="pricing-trust-pill"
                    key={i}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
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
        <section
          className="pricing-cards-section pricing-cards-section--module pricing-section-anchor"
          id="pricing-plans"
          data-pricing-reveal
          aria-label="Bảng giá các gói"
        >
          <div className="container">
            <div className="module-layout-container pricing-public-plans">
              <div className="grid-cards pricing-m-plan-grid">
                {plans.map((plan, index) => {
                  const tier = getPlanTier(plan.name);
                  const spotlight = plan.highlighted;
                  const ctaPrimary = spotlight;
                  return (
                    <ModulePlanCard
                      key={plan.name}
                      listIndex={index}
                      displayIndex={index}
                      tier={tier}
                      name={plan.name}
                      description={plan.description}
                      priceBlock={
                        <div className="pricing-m-price-block">
                          <span className="pricing-m-price">{plan.price}</span>
                          {plan.period ? (
                            <span className="pricing-m-period">{plan.period}</span>
                          ) : null}
                        </div>
                      }
                      tokenLine={plan.tokenLine}
                      featured={spotlight}
                      isCurrent={false}
                      cta={
                        <Link
                          to="/register"
                          className={ctaPrimary ? 'action-primary' : 'action-toggle'}
                        >
                          {plan.buttonText}
                        </Link>
                      }
                      features={
                        <ul className="pricing-m-features">
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>
                              <span
                                className={`pricing-m-check ${plan.highlighted ? 'pricing-m-check--primary' : ''}`}
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
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison Table ── */}
        <section
          className="pricing-comparison-section pricing-section-anchor"
          id="pricing-compare"
          data-pricing-reveal
          aria-labelledby="compare-heading"
        >
          <div className="container">
            <div className="pricing-comparison-header">
              <span className="ft-badge ft-badge--orange" style={{ marginBottom: '1rem' }}>
                So sánh
              </span>
              <h2 className="pricing-comparison-title" id="compare-heading">
                So sánh chi tiết <span className="gradient-text">các gói</span>
              </h2>
            </div>
            <div
              className="pricing-comparison-table-wrap"
              aria-label="Bảng so sánh tính năng theo gói"
            >
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
        <section
          className="pricing-faq-section pricing-section-anchor"
          id="pricing-faq"
          data-pricing-reveal
          aria-labelledby="faq-heading"
        >
          <div className="features-bg-dots" aria-hidden="true" />
          <div className="container">
            <div className="pricing-faq-header">
              <span className="ft-badge ft-badge--blue" style={{ marginBottom: '1rem' }}>
                FAQ
              </span>
              <h2 className="pricing-faq-title" id="faq-heading">
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
        <section className="pricing-cta-section pricing-section-anchor" data-pricing-reveal>
          <div className="container">
            <div className="pricing-cta-card">
              <div className="pricing-cta-glow" aria-hidden="true" />
              <span className="ft-badge ft-badge--green" style={{ marginBottom: '1rem' }}>
                Bắt đầu ngay
              </span>
              <h2 className="pricing-cta-title">
                Sẵn sàng tối ưu hóa{' '}
                <span className="gradient-text">{UI_TEXT.COURSE.toLowerCase()}</span> của bạn?
              </h2>
              <p className="pricing-cta-desc">
                Tham gia cùng <strong>5,000+</strong> giáo viên đã lựa chọn MathMaster. Dùng thử
                miễn phí, không cần thẻ tín dụng.
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
      </main>
    </div>
  );
};

export default Pricing;
