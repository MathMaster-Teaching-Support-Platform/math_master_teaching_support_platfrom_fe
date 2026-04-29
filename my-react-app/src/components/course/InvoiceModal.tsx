import React from 'react';
import { CheckCircle, X, Download, BookOpen, User, Mail, CreditCard } from 'lucide-react';
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
            <CheckCircle size={56} color="#10b981" />
          </div>
          <h2>Thanh toán thành công!</h2>
          <p>Khóa học đã được thêm vào thư viện của bạn.</p>
        </div>

        <div className="invoice-body">
          {/* Buyer Info Section */}
          <div className="invoice-section invoice-meta">
            <h3>Thông tin khách hàng</h3>
            <div className="invoice-meta-grid">
              <div className="invoice-meta-item">
                <User size={14} className="invoice-meta-icon" />
                <span className="invoice-label">Người mua:</span>
                <span className="invoice-value">{user?.fullName || order.studentName || 'N/A'}</span>
              </div>
              <div className="invoice-meta-item">
                <Mail size={14} className="invoice-meta-icon" />
                <span className="invoice-label">Email:</span>
                <span className="invoice-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="invoice-meta-item">
                <CreditCard size={14} className="invoice-meta-icon" />
                <span className="invoice-label">Phương thức:</span>
                <span className="invoice-value">{isFree ? 'Miễn phí' : 'Số dư ví MathMaster'}</span>
              </div>
            </div>
          </div>

          <div className="invoice-section">
            <h3>Chi tiết giao dịch</h3>
            <div className="invoice-row">
              <span className="invoice-label">Mã hóa đơn:</span>
              <span className="invoice-value font-mono">{order.orderNumber}</span>
            </div>
            <div className="invoice-row">
              <span className="invoice-label">Thời gian:</span>
              <span className="invoice-value">
                {formatDate(order.confirmedAt || order.createdAt)}
              </span>
            </div>
          </div>

          <div className="invoice-section">
            <h3>KHÓA HỌC</h3>
            <div className="invoice-product">
              <img
                src={order.courseThumbnailUrl || "/images/default-course.png"}
                alt={order.courseTitle}
                className="invoice-product-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Course+Thumbnail";
                }}
              />
              <div className="invoice-product-info">
                <h4>{order.courseTitle}</h4>
                <span className="invoice-product-type">Khóa học online</span>
              </div>
            </div>
          </div>

          <div className="invoice-section invoice-summary">
            <h3>Chi tiết thanh toán</h3>
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
          top: 1.25rem;
          right: 1.25rem;
          background: #f1f5f9;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .invoice-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .invoice-header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          background: linear-gradient(to bottom, #f0fdf4, white);
          border-bottom: 1px dashed #e2e8f0;
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
          filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.2));
        }

        .invoice-header h2 {
          color: #064e3b;
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .invoice-header p {
          color: #64748b;
          margin: 0;
          font-size: 1rem;
        }

        .invoice-body {
          padding: 2rem;
          max-height: 70vh;
          overflow-y: auto;
        }

        .invoice-section {
          margin-bottom: 2rem;
        }

        .invoice-section:last-child {
          margin-bottom: 0;
        }

        .invoice-section h3 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          font-weight: 800;
          margin: 0 0 1rem;
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
          gap: 1.25rem;
          align-items: center;
          background: #ffffff;
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .invoice-product-img {
          width: 128px;
          height: 72px;
          border-radius: 8px;
          object-fit: cover;
          background: #f1f5f9;
        }

        .invoice-product-info h4 {
          margin: 0 0 0.4rem;
          font-size: 1.1rem;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.4;
        }

        .invoice-product-type {
          font-size: 0.75rem;
          color: #3b82f6;
          background: #eff6ff;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          display: inline-block;
          font-weight: 600;
        }

        .invoice-summary {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
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
          color: #2563eb;
        }

        .invoice-footer {
          padding: 1.5rem 2rem;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 1rem;
        }

        .invoice-footer .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.875rem 1rem;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.95rem;
        }

        .invoice-footer .btn.secondary {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #475569;
        }

        .invoice-footer .btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .invoice-footer .btn.primary {
          background: #2563eb;
          border: 1.5px solid #2563eb;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
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
