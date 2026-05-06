import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './QbModal.css';

interface QbModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Width preset, defaults to md (640px). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Set to true to disable the click-outside-to-close behaviour. */
  blockBackdropClose?: boolean;
}

const SIZE_CLASS: Record<NonNullable<QbModalProps['size']>, string> = {
  sm: 'qb-modal--sm',
  md: 'qb-modal--md',
  lg: 'qb-modal--lg',
  xl: 'qb-modal--xl',
};

export function QbModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  blockBackdropClose = false,
}: QbModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="qb-modal-backdrop"
      onClick={() => {
        if (!blockBackdropClose) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`qb-modal ${SIZE_CLASS[size]}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {(title || description) && (
          <header className="qb-modal__header">
            <div className="qb-modal__header-text">
              {title && <h3 className="qb-modal__title">{title}</h3>}
              {description && <p className="qb-modal__desc">{description}</p>}
            </div>
            <button
              type="button"
              className="qb-modal__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </header>
        )}
        <div className="qb-modal__body">{children}</div>
        {footer && <footer className="qb-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
