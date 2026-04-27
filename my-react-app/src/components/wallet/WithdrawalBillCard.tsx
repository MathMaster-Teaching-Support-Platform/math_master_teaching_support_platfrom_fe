import { Building2, CheckCircle2, FileText, User, X } from 'lucide-react';
import type { WithdrawalRequestResponse } from '../../types/wallet.types';
import './WithdrawalBillCard.css';

interface Props {
  request: WithdrawalRequestResponse;
  onClose: () => void;
}

const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' VND';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function WithdrawalBillCard({ request, onClose }: Props) {
  return (
    <div className="wbc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wbc-card" role="dialog" aria-modal="true" aria-label="Phiếu rút tiền">
        {/* Header */}
        <div className="wbc-header">
          <div className="wbc-header__left">
            <FileText size={18} className="wbc-header__icon" />
            <div>
              <div className="wbc-header__title">MATHMASTER — PHIẾU RÚT TIỀN</div>
              <div className="wbc-header__sub">
                Mã phiếu: <span>{request.withdrawalRequestId.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button className="wbc-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        {/* Status banner */}
        <div className="wbc-status-banner">
          <CheckCircle2 size={18} />
          <span>THÀNH CÔNG</span>
        </div>

        {/* Bill rows */}
        <div className="wbc-body">
          <div className="wbc-section">
            <div className="wbc-section__label">
              <User size={13} />
              Thông tin giao dịch
            </div>
            <div className="wbc-rows">
              <div className="wbc-row">
                <span>Số tiền rút</span>
                <strong className="wbc-amount">{formatCurrency(request.amount)}</strong>
              </div>
              <div className="wbc-row">
                <span>Ngày xử lý</span>
                <span>{request.processedAt ? formatDate(request.processedAt) : '—'}</span>
              </div>
              <div className="wbc-row">
                <span>Mã giao dịch</span>
                <span className="wbc-mono">{request.transactionId?.slice(0, 12) ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="wbc-divider" />

          <div className="wbc-section">
            <div className="wbc-section__label">
              <Building2 size={13} />
              Tài khoản ngân hàng nhận
            </div>
            <div className="wbc-rows">
              <div className="wbc-row">
                <span>Ngân hàng</span>
                <span>{request.bankName}</span>
              </div>
              <div className="wbc-row">
                <span>Số tài khoản</span>
                <span className="wbc-mono">{request.bankAccountNumber}</span>
              </div>
              <div className="wbc-row">
                <span>Chủ tài khoản</span>
                <strong>{request.bankAccountName}</strong>
              </div>
            </div>
          </div>

          {request.proofImageUrl && (
            <>
              <div className="wbc-divider" />
              <div className="wbc-section">
                <div className="wbc-section__label">Ảnh chứng minh chuyển khoản</div>
                <a
                  href={request.proofImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wbc-proof-link"
                >
                  <img
                    src={request.proofImageUrl}
                    alt="Proof of transfer"
                    className="wbc-proof-img"
                  />
                </a>
              </div>
            </>
          )}

          {request.adminNote && (
            <>
              <div className="wbc-divider" />
              <div className="wbc-section">
                <div className="wbc-section__label">Ghi chú</div>
                <p className="wbc-note">{request.adminNote}</p>
              </div>
            </>
          )}
        </div>

        <button className="wbc-close-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
