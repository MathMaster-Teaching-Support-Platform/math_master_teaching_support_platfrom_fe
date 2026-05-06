import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import './QbStates.css';

interface QbEmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function QbEmptyState({ icon, title, description, action }: QbEmptyStateProps) {
  return (
    <div className="qb-empty">
      {icon && <div className="qb-empty__icon">{icon}</div>}
      {title && <p className="qb-empty__title">{title}</p>}
      {description && <p className="qb-empty__desc">{description}</p>}
      {action && <div className="qb-empty__action">{action}</div>}
    </div>
  );
}

interface QbErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function QbErrorState({ message, onRetry, retryLabel = 'Thử lại' }: QbErrorStateProps) {
  return (
    <div className="qb-empty qb-empty--error">
      <div className="qb-empty__icon">
        <AlertCircle size={28} />
      </div>
      <p className="qb-empty__title">Không thể tải dữ liệu</p>
      <p className="qb-empty__desc">{message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}</p>
      {onRetry && (
        <div className="qb-empty__action">
          <button type="button" className="qb-btn qb-btn--secondary" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

interface QbInlineNoticeProps {
  tone: 'info' | 'success' | 'warn' | 'danger';
  children: ReactNode;
  onDismiss?: () => void;
}

const NOTICE_ICONS = {
  info: <Info size={16} />,
  success: <CheckCircle2 size={16} />,
  warn: <AlertTriangle size={16} />,
  danger: <AlertCircle size={16} />,
};

export function QbInlineNotice({ tone, children, onDismiss }: QbInlineNoticeProps) {
  return (
    <div className={`qb-notice qb-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="qb-notice__icon">{NOTICE_ICONS[tone]}</span>
      <div className="qb-notice__body">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="qb-notice__close"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function QbSkeletonCard() {
  return (
    <div className="qb-skeleton-card">
      <div className="qb-skeleton qb-skeleton--cover" />
      <div className="qb-skeleton-card__body">
        <div className="qb-skeleton qb-skeleton--line qb-skeleton--line-w-70" />
        <div className="qb-skeleton qb-skeleton--line qb-skeleton--line-w-40" />
        <div className="qb-skeleton qb-skeleton--bar" />
      </div>
    </div>
  );
}

export function QbSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="qb-skeleton-list">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="qb-skeleton qb-skeleton--row" />
      ))}
    </div>
  );
}
