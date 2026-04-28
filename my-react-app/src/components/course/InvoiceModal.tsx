import React from 'react';
import { CheckCircle, X, Download, BookOpen } from 'lucide-react';
import type { Order } from '../../types/order.types';
import { useNavigate } from 'react-router-dom';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToCourse?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose, onGoToCourse }) => {
  const navigate = useNavigate();

  if (!isOpen || !order) return null;

  const handleGoToCourse = () => {
    if (onGoToCourse) {
      onGoToCourse();
    } else if (order.enrollmentId) {
      navigate(`/student/courses/${order.enrollmentId}`);
    }
    onClose();
  };

  const handleDownloadPdf = () => {
    // Basic print for now
    window.print();
  };

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-container">
        <button className="invoice-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="invoice-header">
          <div className="success-icon-wrapper">
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2>Thanh toán thành công!</h2>
          <p>Cảm ơn bạn đã mua khóa học trên MathMaster.</p>
        </div>

        <div className="invoice-body">
          <div className="invoice-section">
            <h3>Chi tiết hóa đơn</h3>
            <div className="invoice-row">
              <span className="invoice-label">Mã hóa đơn:</span>
              <span className="invoice-value font-mono">{order.orderNumber}</span>
            </div>
            <div className="invoice-row">
              <span className="invoice-label">Ngày giao dịch:</span>
              <span className="invoice-value">
                {new Date(order.confirmedAt || order.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="invoice-section">
            <h3>Sản phẩm</h3>
            <div className="invoice-product">
              {order.courseThumbnailUrl && (
                <img src={order.courseThumbnailUrl} alt={order.courseTitle} className="invoice-product-img" />
              )}
              <div className="invoice-product-info">
                <h4>{order.courseTitle}</h4>
                <span className="invoice-product-type">Khóa học trực tuyến</span>
              </div>
            </div>
          </div>

          <div className="invoice-section invoice-summary">
            <div className="invoice-row">
              <span className="invoice-label">Giá gốc:</span>
              <span className="invoice-value">{order.originalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="invoice-row text-discount">
                <span className="invoice-label">Giảm giá:</span>
                <span className="invoice-value">- {order.discountAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="invoice-divider" />
            <div className="invoice-row invoice-total">
              <span className="invoice-label">Tổng cộng:</span>
              <span className="invoice-value text-primary">{order.finalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>

        <div className="invoice-footer">
          <button className="btn secondary" onClick={handleDownloadPdf}>
            <Download size={18} /> Tải / In hóa đơn
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
          border-radius: 20px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .invoice-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .invoice-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .invoice-header {
          text-align: center;
          padding: 2.5rem 2rem 1.5rem;
          background: linear-gradient(to bottom, #ecfdf5, white);
          border-bottom: 1px dashed #e2e8f0;
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .invoice-header h2 {
          color: #064e3b;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
        }

        .invoice-header p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        .invoice-body {
          padding: 1.5rem 2rem;
        }

        .invoice-section {
          margin-bottom: 1.5rem;
        }

        .invoice-section:last-child {
          margin-bottom: 0;
        }

        .invoice-section h3 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          font-weight: 700;
          margin: 0 0 1rem;
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
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: #f1f5f9;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .invoice-product {
          display: flex;
          gap: 1rem;
          align-items: center;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .invoice-product-img {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
        }

        .invoice-product-info h4 {
          margin: 0 0 0.25rem;
          font-size: 1rem;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.3;
        }

        .invoice-product-type {
          font-size: 0.8rem;
          color: #64748b;
          background: #e2e8f0;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          display: inline-block;
        }

        .invoice-summary {
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 12px;
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

        .invoice-total .invoice-value {
          font-weight: 800;
          color: #3b82f6;
        }

        .invoice-footer {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 1rem;
        }

        .invoice-footer .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invoice-footer .btn.secondary {
          background: white;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .invoice-footer .btn.secondary:hover {
          background: #f1f5f9;
        }

        .invoice-footer .btn.primary {
          background: #3b82f6;
          border: 1px solid #2563eb;
          color: white;
        }

        .invoice-footer .btn.primary:hover {
          background: #2563eb;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-modal-container, .invoice-modal-container * {
            visibility: visible;
          }
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
          .invoice-close-btn, .invoice-footer {
            display: none !important;
          }
          .invoice-header {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};
