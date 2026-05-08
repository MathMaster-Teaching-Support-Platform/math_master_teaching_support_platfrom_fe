import React from 'react';
import { CircleCheckBig, X, Download, BookOpen, User, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Order } from '../../types/order.types';
import { formatCurrency } from '../../types/order.types';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../../services/api/user.service';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToCourse?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose, onGoToCourse }) => {
  const navigate = useNavigate();

  // Fetch current user info for invoice meta
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['users', 'my-info', 'invoice'],
    queryFn: () => UserService.getMyInfo(),
    enabled: isOpen && !!order,
  });

  if (!isOpen || !order) return null;

  // Defensive check: order and course info
  if (!order.id || !order.courseId) {
    console.error('InvoiceModal: Missing critical order or course information');
    return null;
  }

  const isFree = order.finalPrice === 0;

  const handleGoToCourse = () => {
    if (onGoToCourse) {
      onGoToCourse();
    } else if (order.enrollmentId) {
      navigate(`/student/courses/${order.enrollmentId}`);
    } else {
      navigate(`/course/${order.courseId}`);
    }
    onClose();
  };

  const handleDownloadPdf = () => {
    // Basic print functionality for now, could be enhanced with jspdf
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    const D = pad(date.getDate());
    const M = pad(date.getMonth() + 1);
    const Y = date.getFullYear();

    return `${h}:${m}:${s} - ${D}/${M}/${Y}`;
  };

  if (userLoading) {
    return (
      <div className="invoice-modal-overlay">
        <div className="invoice-modal-container loading">
          <div className="invoice-skeleton-header" />
          <div className="invoice-skeleton-body" />
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-container">
        <button className="invoice-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={24} />
        </button>

        <div className="invoice-header">
          <div className="success-icon-wrapper">
            <CircleCheckBig size={56} strokeWidth={2} />
          </div>
          <h2>Thanh toán thành công!</h2>
          <div className="invoice-header-id-pill">
            <span className="invoice-header-id-label">Mã đơn hàng:</span>
            <span className="invoice-header-id-value">{order.orderNumber}</span>
          </div>
        </div>

        <div className="invoice-body">
          {/* 1. COURSE Section (Primary) */}
          <div className="invoice-section">
            <div className="invoice-section-header">
              <ShoppingBag size={14} />
              <h3>KHÓA HỌC</h3>
            </div>
            <div className="invoice-product">
              <div className="invoice-product-image-container">
                {order.courseThumbnailUrl ? (
                  <img
                    src={order.courseThumbnailUrl}
                    alt={order.courseTitle}
                    className="invoice-product-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.classList.add('has-error');
                    }}
                  />
                ) : null}
                <div className="invoice-product-fallback">
                  <BookOpen size={24} strokeWidth={1.5} />
                </div>
              </div>
              <div className="invoice-product-info">
                <h4>{order.courseTitle}</h4>
                <div className="invoice-product-type-row">
                  <span className="invoice-product-type">Khóa học online</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. BUYER Section */}
          <div className="invoice-section">
            <div className="invoice-section-header">
              <User size={14} />
              <h3>THÔNG TIN NGƯỜI MUA</h3>
            </div>
            <div className="invoice-meta-grid">
              <div className="invoice-meta-item">
                <span className="invoice-label">Người mua:</span>
                <span className="invoice-value">{user?.fullName || order.studentName || 'N/A'}</span>
              </div>
              <div className="invoice-meta-item">
                <span className="invoice-label">Email:</span>
                <span className="invoice-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="invoice-meta-item">
                <span className="invoice-label">Phương thức:</span>
                <span className="invoice-value">{isFree ? 'Miễn phí' : 'Số dư ví MathMaster'}</span>
              </div>
            </div>
          </div>

          {/* 3. PAYMENT Section */}
          <div className="invoice-section invoice-summary">
            <div className="invoice-row">
              <span className="invoice-label">Giá gốc:</span>
              <span className="invoice-value">
                {formatCurrency(order.originalPrice ?? 0)}
              </span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="invoice-row text-discount">
                <span className="invoice-label">Giảm giá:</span>
                <span className="invoice-value">
                  - {formatCurrency(order.discountAmount ?? 0)}
                </span>
              </div>
            )}
            <div className="invoice-divider" />
            <div className="invoice-row invoice-total">
              <span className="invoice-label">Tổng thanh toán:</span>
              <span className="invoice-value text-primary">
                {isFree ? "Miễn phí" : formatCurrency(order.finalPrice ?? 0)}
              </span>
            </div>
          </div>

          <div className="invoice-meta-hint">
             Ghi nhận lúc: {formatDate(order.confirmedAt || order.createdAt)}
          </div>
        </div>

        <div className="invoice-footer">
          <button className="btn secondary" onClick={handleDownloadPdf}>
            <Download size={18} /> Tải hóa đơn (PDF)
          </button>
          <button className="btn primary" onClick={handleGoToCourse}>
            <BookOpen size={18} /> Vào học ngay
          </button>
        </div>
      </div>

      <style>{`
        .invoice-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .invoice-modal-container {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 24px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          /* Flex-column layout: header + scrollable body + sticky footer */
          display: flex;
          flex-direction: column;
          max-height: calc(100dvh - 2rem);
        }

        .invoice-modal-container.loading {
          height: 400px;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 1.5rem;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .invoice-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(15, 23, 42, 0.05);
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 20;
        }

        .invoice-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .invoice-header {
          text-align: center;
          padding: 2.75rem 1.5rem 1.5rem;
          background: linear-gradient(to bottom, #f0fdf4, white);
          border-bottom: 1px dashed #e2e8f0;
          position: relative;
          flex-shrink: 0;  /* never compress the header */
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          color: #10b981;
          filter: drop-shadow(0 8px 20px rgba(16, 185, 129, 0.28));
        }

        .invoice-header h2 {
          color: #0f172a;
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0 0 0.75rem;
          letter-spacing: -0.03em;
        }

        .invoice-header-id-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .invoice-header-id-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .invoice-header-id-value {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
        }

        .invoice-body {
          padding: 1.5rem 1.75rem;
          flex: 1;           /* body takes all remaining space */
          overflow-y: auto;  /* ONLY the body scrolls, if needed */
          max-height: none;  /* no artificial cap — container controls height */
        }

        .invoice-section {
          margin-bottom: 1.1rem;
        }

        .invoice-section:last-child {
          margin-bottom: 0;
        }

        .invoice-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #94a3b8;
        }

        .invoice-section h3 {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: inherit;
          font-weight: 700;
          margin: 0;
        }

        /* Meta Section Styles */
        .invoice-meta-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .invoice-meta-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .invoice-meta-icon {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .invoice-label {
          color: #64748b;
        }

        .invoice-value {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          background: #f1f5f9;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #475569;
        }

        .invoice-product {
          display: flex;
          gap: 1rem;
          align-items: center;
          background: #ffffff;
          padding: 0.75rem;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
        }

        .invoice-product-image-container {
          position: relative;
          width: 100px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .invoice-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 2;
        }

        .invoice-product-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #3b82f6;
          z-index: 1;
        }

        .invoice-product-info h4 {
          margin: 0 0 0.15rem;
          font-size: 0.95rem;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.3;
        }

        .invoice-product-type-row {
          display: flex;
        }

        .invoice-product-type {
          font-size: 0.65rem;
          color: #3b82f6;
          background: #eff6ff;
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .invoice-summary {
          background: #f8fafc;
          padding: 1.15rem 1.25rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .invoice-meta-hint {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .text-discount {
          color: #ef4444;
        }

        .text-discount .invoice-value {
          color: #ef4444;
        }

        .invoice-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 1rem 0;
        }

        .invoice-total {
          font-size: 1.25rem;
          margin-bottom: 0;
        }

        .invoice-total .invoice-label {
          font-weight: 700;
          color: #0f172a;
        }

        .invoice-total .invoice-value {
          font-weight: 800;
          color: #0f172a;
        }

        .text-primary {
          color: #2563eb !important;
        }

        .invoice-footer {
          padding: 1rem 1.5rem 1.25rem;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;  /* always pinned at the bottom, never squeezed out */
        }

        .invoice-footer .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
        }

        .invoice-footer .btn.secondary {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-weight: 600;
        }

        .invoice-footer .btn.secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .invoice-footer .btn.primary {
          flex: 1.8;
          background: #2563eb;
          border: none;
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .invoice-footer .btn.primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }

        /* Skeletons */
        .invoice-skeleton-header {
          height: 100px;
          background: #f1f5f9;
          border-radius: 12px;
          animation: pulse 1.5s infinite;
        }
        .invoice-skeleton-body {
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          animation: pulse 1.5s infinite 0.2s;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media print {
          body * { visibility: hidden; }
          .invoice-modal-container, .invoice-modal-container * { visibility: visible; }
          .invoice-modal-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            animation: none;
          }
          .invoice-close-btn, .invoice-footer { display: none !important; }
          .invoice-header { background: white !important; padding-top: 0; }
          .invoice-body { max-height: none; overflow: visible; }
        }
      `}</style>
    </div>
  );
};
