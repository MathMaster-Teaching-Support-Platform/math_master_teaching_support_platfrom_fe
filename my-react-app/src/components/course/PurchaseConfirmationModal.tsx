import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShoppingCart,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import { WalletService } from '../../services/api/wallet.service';
import { getEffectivePrice, hasActiveDiscount, getDiscountPercentage } from '../../utils/pricing';
import type { CourseResponse } from '../../types/course.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseConfirmationModalProps {
  course: CourseResponse | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPurchasing?: boolean;
  purchaseError?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n === 0
    ? 'Miễn phí'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtBalance = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  course,
  isOpen,
  onConfirm,
  onCancel,
  isPurchasing = false,
  purchaseError = null,
}) => {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Fetch wallet balance each time the modal opens
  useEffect(() => {
    if (!isOpen || !course) return;
    setWalletBalance(null);
    setWalletError(null);
    setWalletLoading(true);
    WalletService.getMyWallet()
      .then((res) => setWalletBalance(res.result?.balance ?? 0))
      .catch(() => setWalletError('Không thể tải số dư ví. Vui lòng thử lại.'))
      .finally(() => setWalletLoading(false));
  }, [isOpen, course]);

  if (!course) return null;

  const effectivePrice = getEffectivePrice(course);
  const originalPrice = course.originalPrice ?? 0;
  const isFree = effectivePrice === 0;
  const discountActive = hasActiveDiscount(course);
  const discountPct = discountActive ? getDiscountPercentage(course) : 0;
  const savings = discountActive ? originalPrice - effectivePrice : 0;

  const postBalance = walletBalance !== null ? walletBalance - effectivePrice : null;
  const hasEnoughBalance = walletBalance !== null && walletBalance >= effectivePrice;
  const shortage = walletBalance !== null && !isFree ? Math.max(0, effectivePrice - walletBalance) : 0;

  const canConfirm = !isPurchasing && (isFree || hasEnoughBalance);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pcm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 1200,
            }}
          />

          {/* Panel */}
          <motion.div
            key="pcm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pcm-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1201,
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              overflow: 'hidden',
              fontFamily: 'inherit',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: isFree
                    ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)'
                    : 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isFree ? (
                  <CheckCircle2 size={18} color="#059669" />
                ) : (
                  <ShoppingCart size={18} color="#2563eb" />
                )}
              </div>
              <h2
                id="pcm-title"
                style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}
              >
                {isFree ? 'Đăng ký miễn phí' : 'Xác nhận thanh toán'}
              </h2>
              <button
                onClick={onCancel}
                disabled={isPurchasing}
                aria-label="Đóng"
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: isPurchasing ? 'not-allowed' : 'pointer',
                  color: '#94a3b8',
                  padding: 4,
                  display: 'flex',
                  borderRadius: 8,
                  transition: 'color 0.15s',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Course summary */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  marginBottom: '1.25rem',
                  padding: '0.85rem',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}
              >
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    style={{
                      width: 64,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 48,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={20} color="#93c5fd" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: '0 0 0.2rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {course.title}
                  </p>
                  {course.teacherName && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Giảng viên: {course.teacherName}
                    </p>
                  )}
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {course.lessonsCount ?? 0} bài học • {course.subjectName ?? ''}{' '}
                    {course.gradeLevel ? `• Khối ${course.gradeLevel}` : ''}
                  </p>
                </div>
              </div>

              {/* Pricing breakdown — only for paid courses */}
              {!isFree && (
                <div
                  style={{
                    marginBottom: '1.1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.6rem 1rem',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#475569',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Tag size={13} /> Chi tiết thanh toán
                  </div>
                  <div style={{ padding: '0.75rem 1rem' }}>
                    {/* Original price */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.88rem',
                        color: '#475569',
                        marginBottom: '0.45rem',
                      }}
                    >
                      <span>Giá gốc</span>
                      <span>{fmtBalance(originalPrice)}</span>
                    </div>
                    {/* Discount row */}
                    {discountActive && savings > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.88rem',
                          color: '#10b981',
                          marginBottom: '0.45rem',
                        }}
                      >
                        <span>Giảm giá ({discountPct}%)</span>
                        <span>-{fmtBalance(savings)}</span>
                      </div>
                    )}
                    {/* Divider */}
                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0.6rem 0' }} />
                    {/* Total */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      <span>Tổng thanh toán</span>
                      <span style={{ color: '#2563eb' }}>{fmtBalance(effectivePrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet section */}
              {!isFree && (
                <div
                  style={{
                    border: `1px solid ${
                      walletError
                        ? '#fca5a5'
                        : shortage > 0
                        ? '#fde68a'
                        : '#bbf7d0'
                    }`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.6rem 1rem',
                      background: walletError
                        ? '#fff1f2'
                        : shortage > 0
                        ? '#fffbeb'
                        : '#f0fdf4',
                      borderBottom: `1px solid ${
                        walletError ? '#fca5a5' : shortage > 0 ? '#fde68a' : '#bbf7d0'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: walletError ? '#dc2626' : shortage > 0 ? '#b45309' : '#166534',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Wallet size={13} />
                    Số dư ví của bạn
                  </div>

                  <div style={{ padding: '0.75rem 1rem' }}>
                    {walletLoading ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#64748b',
                          fontSize: '0.88rem',
                        }}
                      >
                        <Loader2 size={15} className="animate-spin" />
                        Đang tải số dư...
                      </div>
                    ) : walletError ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#dc2626',
                          fontSize: '0.88rem',
                        }}
                      >
                        <AlertCircle size={15} />
                        {walletError}
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.88rem',
                            color: '#475569',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <span>Trước thanh toán</span>
                          <span style={{ fontWeight: 600 }}>
                            {walletBalance !== null ? fmtBalance(walletBalance) : '—'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.88rem',
                            color: '#475569',
                            marginBottom: shortage > 0 ? '0.75rem' : 0,
                          }}
                        >
                          <span>Sau thanh toán</span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: shortage > 0 ? '#dc2626' : '#166534',
                            }}
                          >
                            {postBalance !== null ? fmtBalance(postBalance) : '—'}
                          </span>
                        </div>

                        {/* Insufficient balance warning */}
                        {shortage > 0 && (
                          <div
                            style={{
                              background: '#fef9c3',
                              border: '1px solid #fde68a',
                              borderRadius: 8,
                              padding: '0.6rem 0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                color: '#92400e',
                              }}
                            >
                              <AlertCircle size={14} />
                              <span>
                                Thiếu{' '}
                                <strong style={{ color: '#dc2626' }}>
                                  {fmtBalance(shortage)}
                                </strong>
                              </span>
                            </div>
                            <a
                              href="/wallet"
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#2563eb',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                padding: '3px 8px',
                                background: '#dbeafe',
                                borderRadius: 6,
                              }}
                            >
                              Nạp tiền →
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Free course message */}
              {isFree && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 12,
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534', fontWeight: 600 }}>
                    Khóa học này hoàn toàn miễn phí. Bạn có thể đăng ký ngay!
                  </p>
                </div>
              )}

              {/* Purchase error */}
              {purchaseError && (
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fca5a5',
                    borderRadius: 10,
                    padding: '0.7rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.9rem',
                    fontSize: '0.88rem',
                    color: '#dc2626',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {purchaseError}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <button
                onClick={onCancel}
                disabled={isPurchasing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: isPurchasing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm}
                id="pcm-confirm-btn"
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: 12,
                  border: 'none',
                  background:
                    !canConfirm
                      ? '#94a3b8'
                      : isFree
                      ? 'linear-gradient(135deg,#059669,#10b981)'
                      : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: !canConfirm ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.15s',
                  opacity: !canConfirm ? 0.7 : 1,
                }}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : shortage > 0 ? (
                  <>
                    <AlertCircle size={16} />
                    Số dư không đủ
                  </>
                ) : isFree ? (
                  <>
                    <CheckCircle2 size={16} />
                    Đăng ký ngay
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Xác nhận thanh toán {fmt(effectivePrice)}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseConfirmationModal;
