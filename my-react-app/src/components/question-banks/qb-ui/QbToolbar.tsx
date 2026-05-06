import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import './QbToolbar.css';

interface QbToolbarProps {
  children?: ReactNode;
  /** Right-side actions slot (refresh button, view toggle, etc.) */
  actions?: ReactNode;
  className?: string;
}

export function QbToolbar({ children, actions, className }: QbToolbarProps) {
  return (
    <div className={`qb-toolbar ${className ?? ''}`.trim()}>
      <div className="qb-toolbar__main">{children}</div>
      {actions && <div className="qb-toolbar__actions">{actions}</div>}
    </div>
  );
}

interface QbSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
}

export function QbSearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  ariaLabel,
  size = 'md',
}: QbSearchInputProps) {
  return (
    <label className={`qb-search ${size === 'sm' ? 'qb-search--sm' : ''}`}>
      <span className="qb-search__icon" aria-hidden="true">
        <Search size={15} />
      </span>
      <input
        className="qb-search__input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
      {value && (
        <button
          type="button"
          className="qb-search__clear"
          onClick={() => onChange('')}
          aria-label="Xóa tìm kiếm"
        >
          <X size={13} />
        </button>
      )}
    </label>
  );
}

interface QbFilterPillsProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
}

export function QbFilterPills<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: QbFilterPillsProps<T>) {
  return (
    <div className="qb-pills" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`qb-pill ${value === option.value ? 'qb-pill--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface QbViewToggleProps {
  value: 'grid' | 'list';
  onChange: (next: 'grid' | 'list') => void;
  gridIcon: ReactNode;
  listIcon: ReactNode;
}

export function QbViewToggle({ value, onChange, gridIcon, listIcon }: QbViewToggleProps) {
  return (
    <div className="qb-view-toggle" role="group" aria-label="Chế độ hiển thị">
      <button
        type="button"
        className={`qb-view-toggle__btn ${value === 'grid' ? 'qb-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-label="Hiển thị dạng lưới"
        aria-pressed={value === 'grid'}
      >
        {gridIcon}
      </button>
      <button
        type="button"
        className={`qb-view-toggle__btn ${value === 'list' ? 'qb-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-label="Hiển thị dạng danh sách"
        aria-pressed={value === 'list'}
      >
        {listIcon}
      </button>
    </div>
  );
}
