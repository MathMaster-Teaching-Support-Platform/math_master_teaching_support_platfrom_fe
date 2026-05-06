import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { QbModal } from './QbModal';
import './QbConfirmDialog.css';

interface QbConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: ReactNode;
  /** "danger" turns the confirm button red (delete/destructive). */
  tone?: 'primary' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function QbConfirmDialog({
  isOpen,
  title,
  message,
  tone = 'primary',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  busy = false,
  onConfirm,
  onCancel,
}: QbConfirmDialogProps) {
  return (
    <QbModal
      isOpen={isOpen}
      onClose={busy ? () => {} : onCancel}
      size="sm"
      blockBackdropClose={busy}
    >
      <div className="qb-confirm">
        <div className={`qb-confirm__icon qb-confirm__icon--${tone}`}>
          <AlertTriangle size={22} />
        </div>
        <div className="qb-confirm__body">
          <h3 className="qb-confirm__title">{title}</h3>
          {message && <div className="qb-confirm__msg">{message}</div>}
        </div>
      </div>
      <div className="qb-confirm__actions">
        <button
          type="button"
          className="qb-btn qb-btn--secondary"
          onClick={onCancel}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`qb-btn ${tone === 'danger' ? 'qb-btn--danger' : 'qb-btn--primary'}`}
          onClick={() => {
            void onConfirm();
          }}
          disabled={busy}
        >
          {busy ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </QbModal>
  );
}

