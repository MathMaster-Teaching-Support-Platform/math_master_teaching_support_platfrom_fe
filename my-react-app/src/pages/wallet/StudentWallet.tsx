import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './StudentWallet.css';

interface Transaction {
  id: number;
  date: string;
  type: 'topup' | 'payment' | 'refund';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
}

const StudentWallet: React.FC = () => {
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100000);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const balance = 850000;
  const pendingAmount = 50000;

  const transactions: Transaction[] = [
    {
      id: 1,
      date: '2026-01-28',
      type: 'payment',
      description: 'Gói Pro - 1 tháng',
      amount: -199000,
      status: 'completed',
      method: 'Ví',
    },
    {
      id: 2,
      date: '2026-01-25',
      type: 'topup',
      description: 'Nạp tiền qua MoMo',
      amount: 500000,
      status: 'completed',
      method: 'MoMo',
    },
    {
      id: 3,
      date: '2026-01-22',
      type: 'payment',
      description: 'Khóa học Toán nâng cao',
      amount: -299000,
      status: 'completed',
      method: 'Ví',
    },
    {
      id: 4,
      date: '2026-01-20',
      type: 'topup',
      description: 'Nạp tiền qua Banking',
      amount: 1000000,
      status: 'completed',
      method: 'Banking',
    },
    {
      id: 5,
      date: '2026-01-18',
      type: 'refund',
      description: 'Hoàn tiền khóa học',
      amount: 150000,
      status: 'completed',
      method: 'Ví',
    },
    {
      id: 6,
      date: '2026-01-15',
      type: 'payment',
      description: 'Tài liệu học tập',
      amount: -49000,
      status: 'completed',
      method: 'Ví',
    },
    {
      id: 7,
      date: '2026-01-12',
      type: 'topup',
      description: 'Nạp tiền qua ZaloPay',
      amount: 200000,
      status: 'completed',
      method: 'ZaloPay',
    },
    {
      id: 8,
      date: '2026-01-10',
      type: 'payment',
      description: 'Gói Free - Gia hạn',
      amount: 0,
      status: 'completed',
      method: 'Miễn phí',
    },
    {
      id: 9,
      date: '2026-01-08',
      type: 'payment',
      description: 'Bài kiểm tra nâng cao',
      amount: -99000,
      status: 'pending',
      method: 'Ví',
    },
    {
      id: 10,
      date: '2026-01-05',
      type: 'topup',
      description: 'Nạp tiền qua Visa',
      amount: 500000,
      status: 'completed',
      method: 'Visa',
    },
  ];

  const topUpAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const stats = {
    totalTopUp: transactions
      .filter((t) => t.type === 'topup' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalSpent: Math.abs(
      transactions
        .filter((t) => t.type === 'payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    transactionCount: transactions.filter((t) => t.status === 'completed').length,
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="wallet-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💳 Ví Của Tôi</h1>
            <p className="page-subtitle">Quản lý số dư và lịch sử giao dịch</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowTopUpModal(true)}>
            <span>💰</span> Nạp tiền
          </button>
        </div>

        {/* Balance Card */}
        <div className="balance-section">
          <div className="balance-card main">
            <div className="balance-header">
              <h3>Số dư khả dụng</h3>
              <span className="balance-icon">💰</span>
            </div>
            <div className="balance-amount">{formatCurrency(balance)}</div>
            <div className="balance-pending">Đang chờ: {formatCurrency(pendingAmount)}</div>
            <div className="balance-actions">
              <button className="btn btn-primary" onClick={() => setShowTopUpModal(true)}>
                ➕ Nạp tiền
              </button>
              <button className="btn btn-outline">📤 Rút tiền</button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
              >
                📥
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.totalTopUp)}</div>
                <div className="stat-label">Tổng nạp</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              >
                📤
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.totalSpent)}</div>
                <div className="stat-label">Đã chi tiêu</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                📊
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.transactionCount}</div>
                <div className="stat-label">Giao dịch</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods-section">
          <h2 className="section-title">Phương thức thanh toán</h2>
          <div className="payment-methods-grid">
            <div className="payment-method-card">
              <div className="payment-icon">🏦</div>
              <div className="payment-info">
                <div className="payment-name">Chuyển khoản ngân hàng</div>
                <div className="payment-desc">Miễn phí • Xử lý tức thì</div>
              </div>
            </div>
            <div className="payment-method-card">
              <div className="payment-icon">📱</div>
              <div className="payment-info">
                <div className="payment-name">Ví điện tử</div>
                <div className="payment-desc">MoMo, ZaloPay, VNPay</div>
              </div>
            </div>
            <div className="payment-method-card">
              <div className="payment-icon">💳</div>
              <div className="payment-info">
                <div className="payment-name">Thẻ quốc tế</div>
                <div className="payment-desc">Visa, Mastercard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="transactions-section">
          <h2 className="section-title">Lịch sử giao dịch</h2>
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="transaction-item"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="transaction-icon-wrapper">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'topup'
                      ? '📥'
                      : transaction.type === 'payment'
                        ? '📤'
                        : '🔄'}
                  </div>
                </div>
                <div className="transaction-content">
                  <div className="transaction-description">{transaction.description}</div>
                  <div className="transaction-meta">
                    <span className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="transaction-method">{transaction.method}</span>
                  </div>
                </div>
                <div className="transaction-right">
                  <div
                    className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </div>
                  <span className={`transaction-status ${transaction.status}`}>
                    {transaction.status === 'completed'
                      ? '✅ Thành công'
                      : transaction.status === 'pending'
                        ? '⏳ Đang xử lý'
                        : '❌ Thất bại'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">💰 Nạp tiền vào ví</h2>
                <button className="modal-close" onClick={() => setShowTopUpModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="current-balance">
                  <span>Số dư hiện tại:</span>
                  <span className="balance-value">{formatCurrency(balance)}</span>
                </div>

                <div className="form-group">
                  <label>Chọn số tiền</label>
                  <div className="amount-grid">
                    {topUpAmounts.map((amount) => (
                      <button
                        key={amount}
                        className={`amount-btn ${selectedAmount === amount ? 'active' : ''}`}
                        onClick={() => setSelectedAmount(amount)}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Hoặc nhập số tiền khác</label>
                  <input
                    type="number"
                    placeholder="Nhập số tiền"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Phương thức thanh toán</label>
                  <select>
                    <option>🏦 Chuyển khoản ngân hàng</option>
                    <option>📱 MoMo</option>
                    <option>📱 ZaloPay</option>
                    <option>📱 VNPay</option>
                    <option>💳 Thẻ Visa/Mastercard</option>
                  </select>
                </div>

                <div className="summary-box">
                  <div className="summary-row">
                    <span>Số tiền nạp:</span>
                    <span className="summary-value">{formatCurrency(selectedAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Phí giao dịch:</span>
                    <span className="summary-value">Miễn phí</span>
                  </div>
                  <div className="summary-row total">
                    <span>Tổng thanh toán:</span>
                    <span className="summary-value">{formatCurrency(selectedAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowTopUpModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Xác nhận nạp tiền</button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Chi tiết giao dịch</h2>
                <button className="modal-close" onClick={() => setSelectedTransaction(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="transaction-detail-header">
                  <div className={`detail-icon ${selectedTransaction.type}`}>
                    {selectedTransaction.type === 'topup'
                      ? '📥'
                      : selectedTransaction.type === 'payment'
                        ? '📤'
                        : '🔄'}
                  </div>
                  <div
                    className={`detail-amount ${selectedTransaction.amount > 0 ? 'positive' : 'negative'}`}
                  >
                    {selectedTransaction.amount > 0 ? '+' : ''}
                    {formatCurrency(selectedTransaction.amount)}
                  </div>
                  <span className={`status-badge ${selectedTransaction.status}`}>
                    {selectedTransaction.status === 'completed'
                      ? '✅ Thành công'
                      : selectedTransaction.status === 'pending'
                        ? '⏳ Đang xử lý'
                        : '❌ Thất bại'}
                  </span>
                </div>

                <div className="transaction-detail-info">
                  <div className="info-row">
                    <span className="info-label">Mã giao dịch:</span>
                    <span className="info-value">
                      TXN{selectedTransaction.id.toString().padStart(8, '0')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mô tả:</span>
                    <span className="info-value">{selectedTransaction.description}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ngày giao dịch:</span>
                    <span className="info-value">
                      {new Date(selectedTransaction.date).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phương thức:</span>
                    <span className="info-value">{selectedTransaction.method}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Loại:</span>
                    <span className="info-value">
                      {selectedTransaction.type === 'topup'
                        ? 'Nạp tiền'
                        : selectedTransaction.type === 'payment'
                          ? 'Thanh toán'
                          : 'Hoàn tiền'}
                    </span>
                  </div>
                </div>

                {selectedTransaction.status === 'completed' && (
                  <div className="detail-actions">
                    <button className="btn btn-outline">📧 Gửi hóa đơn</button>
                    <button className="btn btn-outline">📥 Tải xuống</button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedTransaction(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentWallet;
