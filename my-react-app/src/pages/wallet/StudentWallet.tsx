import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Search,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockStudent, mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { WalletService } from '../../services/api/wallet.service';
import type { WalletSummary, WalletTransaction } from '../../types/wallet.types';
import './StudentWallet.css';

type TransactionStatusFilter = 'all' | 'completed' | 'pending' | 'failed';
type PaymentMethod = 'payos' | 'visa' | 'mastercard';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; sub: string }[] = [
  { id: 'payos', name: 'PayOS', sub: 'QR / Chuyển khoản' },
  { id: 'visa', name: 'Visa', sub: 'Thẻ quốc tế' },
  { id: 'mastercard', name: 'Mastercard', sub: 'Thẻ quốc tế' },
];

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

const VN_BANKS = [
  { id: 'vcb', name: 'Vietcombank', short: 'VCB', color: '#007A3D', bg: '#E8F5EC' },
  { id: 'bidv', name: 'BIDV', short: 'BIDV', color: '#1B4B9B', bg: '#E8EAF6' },
  { id: 'tcb', name: 'Techcombank', short: 'TCB', color: '#DC1D1D', bg: '#FFEBEE' },
  { id: 'vpb', name: 'VPBank', short: 'VPB', color: '#00854A', bg: '#E8F5EC' },
  { id: 'mbb', name: 'MB Bank', short: 'MB', color: '#B8272A', bg: '#FFEBEE' },
  { id: 'vba', name: 'Agribank', short: 'AGB', color: '#C8A500', bg: '#FFFDE7' },
  { id: 'acb', name: 'ACB', short: 'ACB', color: '#0066CC', bg: '#E3F2FD' },
  { id: 'stb', name: 'Sacombank', short: 'STB', color: '#EF3E32', bg: '#FFEBEE' },
  { id: 'tpb', name: 'TPBank', short: 'TPB', color: '#FF6600', bg: '#FFF3E0' },
  { id: 'vtb', name: 'VietinBank', short: 'VTB', color: '#1A3E7A', bg: '#E8EAF6' },
  { id: 'ocb', name: 'OCB', short: 'OCB', color: '#00A3D1', bg: '#E0F7FA' },
  { id: 'shb', name: 'SHB', short: 'SHB', color: '#DC0025', bg: '#FFEBEE' },
] as const;

/* ── Vietnamese bank logo images from vietqr.io CDN ── */
const BANK_VIETQR_CODE: Record<string, string> = {
  vcb: 'VCB',
  bidv: 'BIDV',
  tcb: 'TCB',
  vpb: 'VPB',
  mbb: 'MB',
  vba: 'VBA',
  acb: 'ACB',
  stb: 'STB',
  tpb: 'TPB',
  vtb: 'ICB',
  ocb: 'OCB',
  shb: 'SHB',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BankLogoSVG = ({ id, color: _color }: { id: string; color: string }) => {
  const code = BANK_VIETQR_CODE[id] ?? id.toUpperCase();
  return (
    <img
      src={`https://cdn.vietqr.io/img/${code}.png`}
      alt={id}
      width="34"
      height="34"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
};

const PayOSLogo = () => (
  <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
    <rect width="42" height="22" rx="5" fill="#0052CC" />
    <text
      x="21"
      y="15"
      textAnchor="middle"
      fill="white"
      fontSize="9"
      fontWeight="800"
      fontFamily="system-ui,sans-serif"
    >
      PayOS
    </text>
  </svg>
);

const VisaLogo = () => (
  <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
    <rect width="42" height="22" rx="5" fill="#1A1F71" />
    <text
      x="21"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="13"
      fontWeight="800"
      fontFamily="serif"
      fontStyle="italic"
    >
      VISA
    </text>
  </svg>
);

const MastercardLogo = () => (
  <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
    <circle cx="16" cy="14" r="10" fill="#EB001B" />
    <circle cx="28" cy="14" r="10" fill="#F79E1B" />
    <path d="M 22 6 A 10 10 0 0 1 22 22 A 10 10 0 0 0 22 6 Z" fill="#FF5F00" />
  </svg>
);

const PAGE_SIZE = 5;

const STATUS_TO_API: Record<Exclude<TransactionStatusFilter, 'all'>, string> = {
  completed: 'COMPLETED',
  pending: 'PENDING',
  failed: 'FAILED',
};

const API_FETCH_SIZE = 10;

const StudentWallet: React.FC = () => {
  const currentRole = AuthService.getUserRole() || 'student';

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const [amount, setAmount] = useState(100_000);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('payos');
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all');
  const [page, setPage] = useState(1);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentUser =
    currentRole === 'teacher' ? mockTeacher : currentRole === 'admin' ? mockAdmin : mockStudent;

  const layoutRole: 'teacher' | 'student' | 'admin' =
    currentRole === 'teacher' ? 'teacher' : currentRole === 'admin' ? 'admin' : 'student';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const normalizeStatus = (status?: string): Exclude<TransactionStatusFilter, 'all'> => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('pending') || normalized.includes('wait')) return 'pending';
    if (normalized.includes('fail') || normalized.includes('cancel')) return 'failed';
    return 'completed';
  };

  const normalizeType = (tx: WalletTransaction): 'deposit' | 'payment' => {
    const type = (tx.type || '').toLowerCase();
    if (type.includes('deposit') || type.includes('topup') || type.includes('recharge')) {
      return 'deposit';
    }
    return tx.amount >= 0 ? 'deposit' : 'payment';
  };

  const formatDate = (raw?: string | null): { day: string; time: string } => {
    if (!raw) return { day: '-', time: '-' };
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { day: '-', time: '-' };
    const full = date.toLocaleString('vi-VN');
    const [day = '-', time = '-'] = full.split(' ');
    return { day, time };
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 12 });
  };

  const handleCardMouseLeave = () => setTilt({ x: 0, y: 0 });

  const getTransactionCode = (tx: WalletTransaction) => {
    if (tx.orderCode) return String(tx.orderCode);
    if (tx.transactionId) return tx.transactionId.slice(-8).toUpperCase();
    if (tx.transactionCode) return tx.transactionCode;
    if (tx.id) return `TXN-${String(tx.id).slice(-6)}`;
    return 'N/A';
  };

  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      const response = await WalletService.getMyWallet();
      setWallet(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ví');
      setErrorDismissed(false);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTransactions = async (filter: TransactionStatusFilter) => {
    try {
      setTransactionsLoading(true);
      setError(null);
      setErrorDismissed(false);

      const response =
        filter === 'all'
          ? await WalletService.getTransactions({ page: 0, size: API_FETCH_SIZE })
          : await WalletService.getTransactionsByStatus(STATUS_TO_API[filter], {
              page: 0,
              size: API_FETCH_SIZE,
            });

      const result = response.result;
      const list = Array.isArray(result)
        ? result
        : 'content' in result && Array.isArray(result.content)
          ? result.content
          : [];

      setTransactions(list);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải giao dịch');
      setErrorDismissed(false);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  useEffect(() => {
    void loadTransactions(statusFilter);
  }, [statusFilter]);

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return transactions;

    return transactions.filter((tx) => {
      const code = getTransactionCode(tx).toLowerCase();
      const text = `${tx.description || ''} ${tx.paymentMethod || ''}`.toLowerCase();
      return code.includes(keyword) || text.includes(keyword);
    });
  }, [searchTerm, transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedTransactions = filteredTransactions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const displayStart = filteredTransactions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(safePage * PAGE_SIZE, filteredTransactions.length);

  const totalDeposit = transactions
    .filter((tx) => normalizeType(tx) === 'deposit' && normalizeStatus(tx.status) === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const handleDeposit = async () => {
    if (amount < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000 VND');
      setErrorDismissed(false);
      return;
    }

    try {
      setDepositing(true);
      setError(null);

      const methodLabel = PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name ?? 'PayOS';

      const response = await WalletService.deposit({
        amount,
        description: `Nạp tiền MathMaster qua ${methodLabel}`,
      });

      window.open(response.result.checkoutUrl, '_blank', 'noopener,noreferrer');

      setDepositSuccess(true);
      setTimeout(() => setDepositSuccess(false), 3000);

      await loadTransactions(statusFilter);
      await loadWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo thanh toán');
      setErrorDismissed(false);
    } finally {
      setDepositing(false);
    }
  };

  const handleDepositClick = () => {
    if (amount < 10_000) {
      setError('Số tiền nạp tối thiểu là 10.000 VND');
      setErrorDismissed(false);
      return;
    }
    if (selectedMethod !== 'payos') {
      setError('Phương thức này đang được phát triển. Vui lòng sử dụng PayOS.');
      setErrorDismissed(false);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDeposit = () => {
    setShowConfirmModal(false);
    void handleDeposit();
  };

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const exportCsv = () => {
    const rows = filteredTransactions.map((tx) => [
      tx.createdAt || '',
      getTransactionCode(tx),
      normalizeType(tx) === 'deposit' ? 'Nạp tiền' : 'Thanh toán',
      tx.amount.toString(),
      normalizeStatus(tx.status),
    ]);

    const csv = [['Ngay giao dich', 'Ma giao dich', 'Loai', 'So tien', 'Trang thai'], ...rows]
      .map((line) => line.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lastUpdated = wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleString('vi-VN') : null;

  return (
    <>
      <DashboardLayout
        role={layoutRole}
        user={{ name: currentUser.name, avatar: currentUser.avatar!, role: layoutRole }}
        notificationCount={5}
      >
        <div className="wallet-page">
          {/* Header */}
          <header className="wallet-header">
            <div>
              <h1>Ví của tôi</h1>
              <p>Quản lý số dư và theo dõi lịch sử giao dịch</p>
            </div>
            <button className="btn-report" onClick={exportCsv}>
              <Download size={15} /> Xuất báo cáo
            </button>
          </header>

          {/* Error Banner */}
          {error && !errorDismissed && (
            <div className="wallet-error-banner" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>
              <button className="error-dismiss" onClick={() => setErrorDismissed(true)}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* Stat Strip */}
          <div className="wallet-stat-strip">
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Số dư hiện tại</span>
              <span className="wallet-stat-value wallet-stat-value--primary">
                {walletLoading ? '—' : `${formatCurrency(wallet?.balance ?? 0)} ₫`}
              </span>
            </div>
            <div className="wallet-stat-divider" />
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Tổng đã nạp</span>
              <span className="wallet-stat-value wallet-stat-value--green">
                {transactionsLoading ? '—' : `${formatCurrency(totalDeposit)} ₫`}
              </span>
            </div>
            <div className="wallet-stat-divider" />
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Số giao dịch</span>
              <span className="wallet-stat-value">
                {transactionsLoading ? '—' : transactions.length}
              </span>
            </div>
          </div>

          {/* Overview Grid */}
          <section className="wallet-overview">
            {/* Glassmorphism Balance Card */}
            <div
              ref={cardRef}
              className="balance-card"
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
              }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-noise" aria-hidden="true" />
              <div className="card-light" aria-hidden="true" />
              <div className="card-top-row">
                <div className="card-mc-rings" aria-hidden="true">
                  <span className="ring-left" />
                  <span className="ring-right" />
                </div>
                <div className="card-chip" aria-hidden="true" />
              </div>

              <div className="card-balance-section">
                <div className="card-balance-label">Số dư khả dụng</div>
                {walletLoading ? (
                  <div className="card-balance-skeleton" />
                ) : (
                  <div className="card-balance-value">
                    {formatCurrency(wallet?.balance ?? 0)}
                    <span className="card-balance-currency"> VND</span>
                  </div>
                )}
              </div>

              <div className="card-footer-row">
                <div>
                  <div className="card-number">**** **** **** 2048</div>
                  <div className="card-holder">
                    {(currentUser.name ?? 'MATHMASTER USER').toUpperCase()}
                  </div>
                </div>
                <div className="card-updated">{lastUpdated ?? 'Thời gian thực'}</div>
              </div>
            </div>

            {/* Top-up Action Card */}
            <article className="wallet-topup-card">
              <div className="topup-header">
                <Zap size={19} className="topup-zap" />
                <h2>Nạp tiền nhanh</h2>
              </div>

              {/* Payment Method Selector */}
              <div className="method-selector">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    className={`method-card${selectedMethod === m.id ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedMethod(m.id);
                      setSelectedBank(null);
                    }}
                  >
                    <div className="method-logo">
                      {m.id === 'payos' && <PayOSLogo />}
                      {m.id === 'visa' && <VisaLogo />}
                      {m.id === 'mastercard' && <MastercardLogo />}
                    </div>
                    <div className="method-name">{m.name}</div>
                    <div className="method-sub">{m.sub}</div>
                  </button>
                ))}
              </div>

              {/* ── PayOS: Bank selector ── */}
              {selectedMethod === 'payos' && (
                <div className="payos-section">
                  <div className="payos-section__header">
                    <svg
                      width="15"
                      height="15"
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
                    <span>
                      Ngân hàng của bạn <span className="payos-section__optional">(tùy chọn)</span>
                    </span>
                  </div>
                  <div className="bank-grid">
                    {VN_BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        className={`bank-chip${selectedBank === bank.id ? ' selected' : ''}`}
                        style={
                          selectedBank === bank.id
                            ? {
                                borderColor: bank.color,
                                boxShadow: `0 0 0 2px ${bank.color}30`,
                                background: `${bank.color}08`,
                              }
                            : {}
                        }
                        onClick={() => setSelectedBank(selectedBank === bank.id ? null : bank.id)}
                      >
                        <div
                          className="bank-chip__icon"
                          style={{ background: '#fff', border: `1.5px solid ${bank.color}25` }}
                        >
                          <BankLogoSVG id={bank.id} color={bank.color} />
                        </div>
                        <span className="bank-chip__name">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="payos-note">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Hỗ trợ thanh toán QR / chuyển khoản qua hơn 40 ngân hàng
                  </p>
                </div>
              )}

              {/* ── Visa / Mastercard: Real card preview ── */}
              {(selectedMethod === 'visa' || selectedMethod === 'mastercard') && (
                <div className="card-preview-section">
                  {/* Physical card mockup */}
                  <div className={`card-preview card-preview--${selectedMethod}`}>
                    {/* Decorative circles */}
                    <div className="cp-deco-circle cp-deco-circle--1" aria-hidden="true" />
                    <div className="cp-deco-circle cp-deco-circle--2" aria-hidden="true" />

                    {/* Top row: chip + contactless */}
                    <div className="cp-top-row">
                      <div className="cp-chip" aria-hidden="true">
                        <div className="cp-chip-h" />
                        <div className="cp-chip-v" />
                      </div>
                      {/* Contactless symbol */}
                      <svg
                        className="cp-contactless"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <circle cx="12" cy="20" r="1" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Card number */}
                    <div className="cp-number">
                      {cardNumber
                        ? cardNumber.padEnd(19, ' ').replace(/X/g, '•')
                        : '•••• •••• •••• ••••'}
                    </div>

                    {/* Bottom row */}
                    <div className="cp-bottom-row">
                      <div className="cp-field">
                        <span className="cp-field-label">Card Holder</span>
                        <span className="cp-field-value">{cardName || 'YOUR NAME'}</span>
                      </div>
                      <div className="cp-field">
                        <span className="cp-field-label">Expires</span>
                        <span className="cp-field-value cp-field-value--mono">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                      <div className="cp-logo-wrap">
                        {selectedMethod === 'visa' ? <VisaLogo /> : <MastercardLogo />}
                      </div>
                    </div>

                    {/* Coming-soon overlay ON the card */}
                    <div className="cp-overlay">
                      <span className="cs-badge">Sắp ra mắt</span>
                      <p>Thanh toán thẻ quốc tế đang được tích hợp</p>
                    </div>
                  </div>

                  {/* Input fields below card (blurred / disabled) */}
                  <div className="card-inputs-blur" aria-disabled="true">
                    <div className="card-form__field">
                      <label>Số thẻ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        disabled
                      />
                    </div>
                    <div className="card-form__field">
                      <label>Tên chủ thẻ</label>
                      <input
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        disabled
                      />
                    </div>
                    <div className="card-form__row">
                      <div className="card-form__field">
                        <label>Ngày hết hạn</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          disabled
                        />
                      </div>
                      <div className="card-form__field">
                        <label>CVV</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="amount-field">
                <label htmlFor="deposit-amount">Số tiền nạp</label>
                <div className="amount-input-wrap">
                  <input
                    id="deposit-amount"
                    type="text"
                    className="amount-input"
                    value={formatCurrency(amount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setAmount(raw ? Number(raw) : 0);
                    }}
                    placeholder="100.000"
                  />
                  <span className="amount-suffix">VND</span>
                </div>
              </div>

              {/* Quick-amount pills */}
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    className={`quick-pill${amount === preset ? ' active' : ''}`}
                    onClick={() => setAmount(preset)}
                  >
                    +{preset >= 1_000_000 ? `${preset / 1_000_000}M` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>

              {/* CTA */}
              {depositing ? (
                <div className="btn-deposit-processing">
                  <span className="btn-deposit-processing__text">Đang xử lý...</span>
                  <span className="btn-deposit-processing__bar" aria-hidden="true" />
                </div>
              ) : (
                <button
                  className={`btn-deposit${depositSuccess ? ' success' : ''}${selectedMethod !== 'payos' ? ' disabled-method' : ''}`}
                  onClick={selectedMethod === 'payos' ? handleDepositClick : undefined}
                  disabled={selectedMethod !== 'payos'}
                >
                  <span className="btn-shimmer" aria-hidden="true" />
                  {depositSuccess ? (
                    <>&#10003;&nbsp;Đã tạo liên kết!</>
                  ) : selectedMethod !== 'payos' ? (
                    <>Phương thức đang phát triển</>
                  ) : (
                    <>
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      Xem hóa đơn &amp; Thanh toán
                    </>
                  )}
                </button>
              )}

              {/* Trust Signal */}
              <div className="trust-badge">
                <Lock size={12} />
                <span>Thanh toán bảo mật bởi PayOS · Chuẩn mã hoá PCI DSS</span>
              </div>
            </article>
          </section>

          {/* Transaction Ledger */}
          <section className="transactions-panel">
            <div className="transactions-head">
              <div>
                <h2>Lịch sử giao dịch</h2>
                <p>
                  Tổng nạp thành công: <strong>{formatCurrency(totalDeposit)} VND</strong>
                </p>
              </div>

              <div className="transactions-controls">
                <div className="search-box">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Tìm theo mã giao dịch..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TransactionStatusFilter)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="completed">Thành công</option>
                  <option value="pending">Đang chờ</option>
                  <option value="failed">Thất bại</option>
                </select>
              </div>
            </div>

            {/* List Body */}
            <div className="transaction-list">
              {transactionsLoading &&
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="tx-skeleton" />)}

              {!transactionsLoading && paginatedTransactions.length === 0 && (
                <div className="empty-state">
                  <TrendingUp size={52} className="empty-icon" />
                  <h3>Chưa có giao dịch nào</h3>
                  <p>Nạp tiền lần đầu để bắt đầu hành trình học tập của bạn</p>
                  <button
                    className="btn-empty-cta"
                    onClick={() =>
                      document.querySelector<HTMLInputElement>('#deposit-amount')?.focus()
                    }
                  >
                    Nạp tiền lần đầu
                  </button>
                </div>
              )}

              {!transactionsLoading &&
                paginatedTransactions.map((tx) => {
                  const status = normalizeStatus(tx.status);
                  const type = normalizeType(tx);
                  const { day, time } = formatDate(tx.transactionDate ?? tx.createdAt);

                  return (
                    <div key={String(tx.transactionId ?? tx.id ?? tx.orderCode)} className="tx-row">
                      <div className={`tx-icon-wrap ${type}`}>
                        {type === 'deposit' ? (
                          <ArrowUpRight size={18} />
                        ) : (
                          <ArrowDownLeft size={18} />
                        )}
                      </div>

                      <div className="tx-info">
                        <div className="tx-title">
                          {type === 'deposit'
                            ? 'Nạp tiền vào ví'
                            : tx.description || 'Thanh toán khoá học'}
                        </div>
                        <div className="tx-meta">
                          <span className="tx-code">#{getTransactionCode(tx)}</span>
                          <span className="tx-sep">·</span>
                          <span className="tx-time">
                            {day} {time}
                          </span>
                        </div>
                      </div>

                      <div className="tx-right">
                        <div
                          className={`tx-amount ${type === 'deposit' ? 'positive' : 'negative'}`}
                        >
                          {type === 'deposit' ? '+' : '−'}
                          {formatCurrency(Math.abs(tx.amount))}đ
                        </div>
                        <span className={`tx-status-badge ${status}`}>
                          {status === 'completed'
                            ? 'Thành công'
                            : status === 'pending'
                              ? 'Đang chờ'
                              : 'Thất bại'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <footer className="transactions-footer">
              <span>
                Hiển thị {displayStart}–{displayEnd} / {filteredTransactions.length} giao dịch
              </span>

              <div className="pagination">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                  <button
                    key={n}
                    className={n === safePage ? 'active' : ''}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </DashboardLayout>

      {/* ── Confirmation Bill Modal ── */}
      {showConfirmModal && (
        <div className="sw-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="sw-confirm-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              className="sw-modal-close"
              onClick={() => setShowConfirmModal(false)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            {/* Gradient header with amount */}
            <div className="sw-modal-hero">
              <div className="sw-modal-hero__label">Tổng thanh toán</div>
              <div className="sw-modal-hero__amount">
                {formatCurrency(amount)}
                <span className="sw-modal-hero__currency">₫</span>
              </div>
              <div className="sw-modal-hero__sub">Nạp tiền vào ví MathMaster</div>
            </div>

            {/* Bill card */}
            <div className="sw-bill-card">
              {/* Method row */}
              <div className="sw-bill-row2">
                <span className="sw-bill-row2__label">Phương thức</span>
                <span className="sw-bill-row2__val">
                  <span className="sw-payos-badge">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <circle cx="5" cy="5" r="5" fill="#fff" opacity="0.3" />
                    </svg>
                    PayOS
                  </span>
                  <span className="sw-bill-row2__method-txt">QR / Chuyển khoản</span>
                </span>
              </div>

              {/* Bank row (only if selected) */}
              {selectedBank &&
                (() => {
                  const bank = VN_BANKS.find((b) => b.id === selectedBank);
                  return bank ? (
                    <div className="sw-bill-row2">
                      <span className="sw-bill-row2__label">Ngân hàng</span>
                      <span className="sw-bill-row2__val sw-bill-row2__val--bank">
                        <span
                          className="sw-bill-bank-icon"
                          style={{ borderColor: `${bank.color}30` }}
                        >
                          <BankLogoSVG id={bank.id} color={bank.color} />
                        </span>
                        {bank.name}
                      </span>
                    </div>
                  ) : null;
                })()}

              {/* Fee row */}
              <div className="sw-bill-row2">
                <span className="sw-bill-row2__label">Phí giao dịch</span>
                <span className="sw-bill-row2__val">
                  <span className="sw-free-badge">Miễn phí</span>
                </span>
              </div>

              <div className="sw-bill-sep" />

              {/* Total */}
              <div className="sw-bill-total-row">
                <span>Số tiền nhận được</span>
                <span className="sw-bill-total-val">{formatCurrency(amount)} ₫</span>
              </div>
            </div>

            {/* Security note */}
            <div className="sw-security-note">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Thanh toán bảo mật · Mã hoá PCI DSS
            </div>

            {/* Actions */}
            <div className="sw-modal-actions">
              <button
                className="sw-modal-btn sw-modal-btn--cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Huỷ bỏ
              </button>
              <button
                className="sw-modal-btn sw-modal-btn--confirm"
                onClick={handleConfirmDeposit}
                disabled={depositing}
              >
                {depositing ? (
                  <>
                    <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Xác nhận thanh toán
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentWallet;
