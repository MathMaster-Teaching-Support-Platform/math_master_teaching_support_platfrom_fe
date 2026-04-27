import {
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Lock,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useCreateWithdrawal, useVerifyWithdrawalOtp } from '../../hooks/useWithdrawals';
import type { WithdrawalRequestResponse } from '../../types/wallet.types';
import './WithdrawModal.css';

const BANKS = [
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'MB Bank',
  'VPBank',
  'Agribank',
  'BIDV',
  'VietinBank',
  'ACB',
  'Sacombank',
  'TPBank',
  'HDBank',
  'OCB',
  'SHB',
  'Khác',
];

interface Props {
  walletBalance: number;
  userEmail?: string;
  onClose: () => void;
  onSuccess?: (req: WithdrawalRequestResponse) => void;
}

type Step = 'form' | 'otp' | 'success';

const OTP_SECONDS = 10 * 60; // 10 minutes

export default function WithdrawModal({ walletBalance, userEmail, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('form');

  // Form state
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCustom, setBankCustom] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(OTP_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Created request (used when verifying OTP)
  const [pendingRequest, setPendingRequest] = useState<WithdrawalRequestResponse | null>(null);
  const [successRequest, setSuccessRequest] = useState<WithdrawalRequestResponse | null>(null);

  const createMutation = useCreateWithdrawal();
  const verifyMutation = useVerifyWithdrawalOtp();

  // OTP countdown
  useEffect(() => {
    if (step !== 'otp') return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  // ── Step 1 submit ──────────────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const num = Number(amount.replace(/[^\d]/g, ''));
    const finalBank = bankName === 'Khác' ? bankCustom.trim() : bankName;

    if (!num || num < 10_000) {
      setFormError('Số tiền tối thiểu là 10,000 VND.');
      return;
    }
    if (num > walletBalance) {
      setFormError('Số tiền rút không được vượt quá số dư ví.');
      return;
    }
    if (!finalBank) {
      setFormError('Vui lòng chọn hoặc nhập tên ngân hàng.');
      return;
    }
    if (!accountNumber.trim() || !/^\d+$/.test(accountNumber.trim())) {
      setFormError('Số tài khoản không hợp lệ (chỉ chứa chữ số).');
      return;
    }
    if (!accountHolder.trim()) {
      setFormError('Vui lòng nhập tên chủ tài khoản.');
      return;
    }
    if (!password) {
      setFormError('Vui lòng nhập mật khẩu để xác nhận.');
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        amount: num,
        bankName: finalBank,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountHolder.trim().toUpperCase(),
        password,
      });
      setPendingRequest(res.result);
      setStep('otp');
      setCountdown(OTP_SECONDS);
      setResendCooldown(60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.';
      if (msg.includes('1014') || msg.toLowerCase().includes('password')) {
        setFormError('Mật khẩu không đúng. Vui lòng kiểm tra lại.');
      } else if (msg.includes('1029') || msg.toLowerCase().includes('balance')) {
        setFormError('Số dư ví không đủ để thực hiện giao dịch này.');
      } else if (msg.includes('1209') || msg.toLowerCase().includes('already')) {
        setFormError('Bạn đang có một yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi hoàn tất.');
      } else if (msg.includes('1212') || msg.toLowerCase().includes('small')) {
        setFormError('Số tiền rút tối thiểu là 10,000 VND.');
      } else {
        setFormError(msg);
      }
    }
  };

  // ── Step 2: OTP input helpers ──────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  // ── Step 2 submit ──────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!pendingRequest) return;

    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }

    try {
      const res = await verifyMutation.mutateAsync({
        withdrawalRequestId: pendingRequest.withdrawalRequestId,
        otpCode: code,
      });
      setSuccessRequest(res.result);
      setStep('success');
      onSuccess?.(res.result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP không hợp lệ.';
      if (msg.includes('1210') || msg.toLowerCase().includes('expired')) {
        setOtpError('Mã OTP đã hết hạn. Vui lòng tạo yêu cầu mới.');
      } else if (msg.includes('1211') || msg.toLowerCase().includes('invalid')) {
        setOtpError('Mã xác nhận không đúng. Vui lòng kiểm tra lại.');
      } else {
        setOtpError(msg);
      }
    }
  };

  const handleResend = async () => {
    if (!resendCooldown || resendCooldown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setOtpError(null);
    // Re-submit original form data isn't available here; guide user to restart
    setFormError('Vui lòng quay lại và gửi lại yêu cầu nếu OTP hết hạn.');
    setStep('form');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="wd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wd-modal" role="dialog" aria-modal="true" aria-label="Rút tiền">
        {/* Header */}
        <div className="wd-header">
          <div className="wd-header__title">
            <ArrowDownLeft size={20} className="wd-header__icon" />
            <span>Rút tiền</span>
          </div>
          <button className="wd-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="wd-steps">
          {(['form', 'otp', 'success'] as Step[]).map((s, idx) => (
            <React.Fragment key={s}>
              <div
                className={`wd-step ${step === s ? 'active' : ''} ${
                  ['form', 'otp', 'success'].indexOf(step) > idx ? 'done' : ''
                }`}
              >
                <span className="wd-step__num">{idx + 1}</span>
                <span className="wd-step__label">
                  {s === 'form' ? 'Thông tin' : s === 'otp' ? 'Xác nhận OTP' : 'Hoàn tất'}
                </span>
              </div>
              {idx < 2 && <div className="wd-step__line" />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Form ───────────────────────────────────────────────── */}
        {step === 'form' && (
          <form className="wd-body" onSubmit={handleFormSubmit} noValidate>
            <div className="wd-balance-chip">
              <span className="wd-balance-chip__label">Số dư khả dụng</span>
              <span className="wd-balance-chip__value">{formatCurrency(walletBalance)} đ</span>
            </div>

            <div className="wd-field">
              <label className="wd-label">
                Số tiền rút <span className="wd-required">*</span>
              </label>
              <div className="wd-input-wrap">
                <input
                  className="wd-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Tối thiểu 10,000 VND"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAmount(raw ? formatCurrency(Number(raw)) : '');
                  }}
                />
                <span className="wd-input-suffix">VND</span>
              </div>
            </div>

            <div className="wd-field">
              <label className="wd-label">
                Ngân hàng <span className="wd-required">*</span>
              </label>
              <div className="wd-select-wrap">
                <select
                  className="wd-select"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="wd-select-icon" />
              </div>
            </div>

            {bankName === 'Khác' && (
              <div className="wd-field">
                <label className="wd-label">Tên ngân hàng (nhập tay)</label>
                <input
                  className="wd-input"
                  type="text"
                  placeholder="Ví dụ: Eximbank"
                  value={bankCustom}
                  onChange={(e) => setBankCustom(e.target.value)}
                />
              </div>
            )}

            <div className="wd-field">
              <label className="wd-label">
                Số tài khoản <span className="wd-required">*</span>
              </label>
              <input
                className="wd-input"
                type="text"
                inputMode="numeric"
                placeholder="Chỉ chứa chữ số"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="wd-field">
              <label className="wd-label">
                Tên chủ tài khoản <span className="wd-required">*</span>
              </label>
              <input
                className="wd-input"
                type="text"
                placeholder="NGUYEN VAN A"
                style={{ textTransform: 'uppercase' }}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
            </div>

            <div className="wd-field">
              <label className="wd-label">
                <Lock size={13} style={{ marginRight: 4 }} />
                Mật khẩu hiện tại <span className="wd-required">*</span>
              </label>
              <div className="wd-input-wrap">
                <input
                  className="wd-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Xác nhận bằng mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="wd-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {formError && (
              <div className="wd-error-msg">
                <AlertTriangle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <button className="wd-btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang gửi...' : 'Tiếp tục'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ─────────────────────────────────────────────────── */}
        {step === 'otp' && pendingRequest && (
          <form className="wd-body" onSubmit={handleOtpSubmit} noValidate>
            <div className="wd-otp-intro">
              <div className="wd-otp-icon">
                <Clock size={28} />
              </div>
              <p>
                Mã xác nhận đã được gửi đến <strong>{userEmail ?? 'email của bạn'}</strong>
              </p>
              <p className="wd-otp-sub">Nhập mã 6 chữ số trong vòng:</p>
              <div className={`wd-countdown ${countdown < 60 ? 'urgent' : ''}`}>
                {formatTime(countdown)}
              </div>
            </div>

            <div className="wd-otp-boxes" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  className="wd-otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            {otpError && (
              <div className="wd-error-msg">
                <AlertTriangle size={14} />
                <span>{otpError}</span>
              </div>
            )}

            <button
              className="wd-btn-primary"
              type="submit"
              disabled={verifyMutation.isPending || countdown === 0}
            >
              {verifyMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>

            <button
              type="button"
              className="wd-btn-ghost"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã'}
            </button>
          </form>
        )}

        {/* ── Step 3: Success ─────────────────────────────────────────────── */}
        {step === 'success' && successRequest && (
          <div className="wd-body wd-success">
            <CheckCircle2 size={52} className="wd-success__icon" />
            <h3 className="wd-success__title">Yêu cầu đã được gửi!</h3>
            <p className="wd-success__desc">
              Yêu cầu rút tiền của bạn đang chờ admin xử lý. Chúng tôi sẽ thông báo qua email khi
              hoàn tất.
            </p>

            <div className="wd-summary">
              <div className="wd-summary__row">
                <span>Số tiền</span>
                <strong>{formatCurrency(successRequest.amount)} VND</strong>
              </div>
              <div className="wd-summary__row">
                <span>Ngân hàng</span>
                <strong>{successRequest.bankName}</strong>
              </div>
              <div className="wd-summary__row">
                <span>Số tài khoản</span>
                <strong>{successRequest.bankAccountNumber}</strong>
              </div>
              <div className="wd-summary__row">
                <span>Tên TK</span>
                <strong>{successRequest.bankAccountName}</strong>
              </div>
              <div className="wd-summary__row">
                <span>Trạng thái</span>
                <span className="wd-badge wd-badge--pending">Chờ xử lý</span>
              </div>
            </div>

            <button className="wd-btn-primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
