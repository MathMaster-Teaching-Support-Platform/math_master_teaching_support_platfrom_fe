import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, Plus, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockStudent, mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { WalletService } from '../../services/api/wallet.service';
import type { WalletSummary, WalletTransaction } from '../../types/wallet.types';
import './StudentWallet.css';

type TransactionStatusFilter = 'all' | 'completed' | 'pending' | 'failed';

const PAGE_SIZE = 4;

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

  const [amount, setAmount] = useState(100000);
  const [description, setDescription] = useState('Nạp tiền MathMaster');
  const [depositing, setDepositing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all');
  const [page, setPage] = useState(1);

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

  const formatDate = (raw?: string) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';

    const full = date.toLocaleString('vi-VN');
    const [day = '-', time = '-'] = full.split(' ');
    return { day, time };
  };

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
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTransactions = async (filter: TransactionStatusFilter) => {
    try {
      setTransactionsLoading(true);
      setError(null);

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
      return;
    }

    try {
      setDepositing(true);
      setError(null);

      const response = await WalletService.deposit({
        amount,
        description: description.trim() || 'Nạp tiền MathMaster',
      });

      const checkoutUrl = response.result.checkoutUrl;
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');

      await loadTransactions(statusFilter);
      await loadWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo thanh toán');
    } finally {
      setDepositing(false);
    }
  };

  const exportCsv = () => {
    const rows = filteredTransactions.map((tx) => {
      const status = normalizeStatus(tx.status);
      return [
        tx.createdAt || '',
        getTransactionCode(tx),
        normalizeType(tx) === 'deposit' ? 'Nạp tiền' : 'Thanh toán',
        tx.amount.toString(),
        status,
      ];
    });

    const csv = [['Ngay giao dich', 'Ma giao dich', 'Loai', 'So tien', 'Trang thai'], ...rows]
      .map((line) => line.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallet-transactions.csv';
    link.click();
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
        <header className="wallet-header">
          <div>
            <h1>Ví của tôi</h1>
            <p>Quản lý số dư và theo dõi lịch sử giao dịch của bạn</p>
          </div>
          <button className="btn-report" onClick={exportCsv}>
            <Download size={16} /> Xuất báo cáo
          </button>
        </header>

        {error && <div className="wallet-error">{error}</div>}

        <section className="wallet-overview">
          <article className="wallet-balance-card">
            <div className="label">Số dư khả dụng</div>
            <div className="value">
              {walletLoading ? '...' : formatCurrency(wallet?.balance || 0)}
            </div>
            <div className="currency">VND</div>
            <div className="updated">
              {lastUpdated ? `Cập nhật lúc: ${lastUpdated}` : 'Đồng bộ thời gian thực'}
            </div>
          </article>

          <article className="wallet-topup-card">
            <h2>
              <Plus size={18} /> Nạp tiền nhanh
            </h2>

            <div className="topup-grid">
              <div className="field-group">
                <label htmlFor="amount">Số tiền (VND)</label>
                <div className="amount-input-wrap">
                  <input
                    id="amount"
                    type="number"
                    min={10000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="VD: 100000"
                  />
                  <span>VND</span>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="description">Nội dung chuyển khoản</label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nạp tiền MathMaster"
                />
              </div>
            </div>

            <div className="topup-actions">
              <p>Giao dịch an toàn qua cổng thanh toán PayOS.</p>
              <button className="btn-topup" onClick={handleDeposit} disabled={depositing}>
                {depositing ? 'Đang tạo link...' : 'Nạp tiền ngay'} <ArrowRight size={16} />
              </button>
            </div>

            <div className="quick-values">
              {[100000, 200000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  className={amount === preset ? 'active' : ''}
                  onClick={() => setAmount(preset)}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </article>
        </section>

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
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã giao dịch"
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

          <div className="transactions-table-wrap">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Ngày giao dịch</th>
                  <th>Mã giao dịch</th>
                  <th>Loại giao dịch</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactionsLoading && (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Đang tải giao dịch...
                    </td>
                  </tr>
                )}

                {!transactionsLoading && paginatedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Không có giao dịch phù hợp.
                    </td>
                  </tr>
                )}

                {!transactionsLoading &&
                  paginatedTransactions.map((tx) => {
                    const status = normalizeStatus(tx.status);
                    const type = normalizeType(tx);
                    const date = formatDate(tx.transactionDate || tx.createdAt);

                    return (
                      <tr key={String(tx.transactionId || tx.id || tx.orderCode)}>
                        <td>
                          <div className="date-cell">
                            <strong>{typeof date === 'string' ? date : date.day}</strong>
                            <span>{typeof date === 'string' ? '-' : date.time}</span>
                          </div>
                        </td>
                        <td className="transaction-code">#{getTransactionCode(tx)}</td>
                        <td>
                          <div className={`type-cell ${type}`}>
                            <span>{type === 'deposit' ? '+' : '-'}</span>
                            {type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'}
                          </div>
                        </td>
                        <td className={tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                          {tx.amount > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(tx.amount))}đ
                        </td>
                        <td>
                          <span className={`status-chip ${status}`}>
                            {status === 'completed'
                              ? 'Thành công'
                              : status === 'pending'
                                ? 'Đang chờ'
                                : 'Thất bại'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <footer className="transactions-footer">
            <span>
              Hiển thị {displayStart}-{displayEnd} trên tổng số {filteredTransactions.length} giao
              dịch
            </span>

            <div className="pagination">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                {'<'}
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={pageNumber === safePage ? 'active' : ''}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                {'>'}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentWallet;
