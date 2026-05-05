import { MoreVertical } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import './OverflowMenu.css';

export interface OverflowMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface Props {
  items: OverflowMenuItem[];
  ariaLabel?: string;
  align?: 'left' | 'right';
}

/**
 * Compact ··· dropdown for card secondary actions. Click-outside to close,
 * Escape to close, stops propagation so it can sit inside a clickable card.
 */
export default function OverflowMenu({ items, ariaLabel = 'Mở menu', align = 'right' }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: globalThis.MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleItemClick = (event: MouseEvent<HTMLButtonElement>, item: OverflowMenuItem) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  };

  const handleWrapperKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="overflow-menu"
      onKeyDown={handleWrapperKeyDown}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="overflow-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={handleTriggerClick}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          className={`overflow-menu__panel overflow-menu__panel--${align}`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`overflow-menu__item${item.danger ? ' overflow-menu__item--danger' : ''}`}
              disabled={item.disabled}
              onClick={(event) => handleItemClick(event, item)}
            >
              {item.icon && <span className="overflow-menu__item-icon">{item.icon}</span>}
              <span className="overflow-menu__item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
