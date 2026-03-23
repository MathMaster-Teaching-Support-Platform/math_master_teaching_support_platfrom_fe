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
                  onClick={() => setSelectedMethod(m.id)}
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
            <button
              className={`btn-deposit${depositing ? ' loading' : ''}${depositSuccess ? ' success' : ''}`}
              onClick={handleDeposit}
              disabled={depositing}
            >
              <span className="btn-shimmer" aria-hidden="true" />
              {depositing ? (
                <>
                  <span className="spinner" /> Đang xử lý...
                </>
              ) : depositSuccess ? (
                <>&#10003;&nbsp;Đã tạo liên kết!</>
              ) : (
                <>Nạp tiền ngay</>
              )}
            </button>

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
                      <div className={`tx-amount ${type === 'deposit' ? 'positive' : 'negative'}`}>
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
  );
};

export default StudentWallet;
