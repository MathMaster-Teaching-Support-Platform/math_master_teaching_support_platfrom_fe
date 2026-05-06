import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import './QbPageHeader.css';

interface QbPageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  /** Optional small chip rendered next to the title (e.g. visibility badge) */
  titleChip?: ReactNode;
  /** Right-side primary actions */
  actions?: ReactNode;
  /** When set, renders a back button on the left of the title */
  onBack?: () => void;
  backLabel?: string;
}

export function QbPageHeader({
  title,
  subtitle,
  count,
  countLabel,
  titleChip,
  actions,
  onBack,
  backLabel = 'Quay lại',
}: QbPageHeaderProps) {
  return (
    <header className="qb-page-header">
      {onBack && (
        <button type="button" className="qb-page-header__back" onClick={onBack}>
          <ChevronLeft size={16} />
          <span>{backLabel}</span>
        </button>
      )}
      <div className="qb-page-header__row">
        <div className="qb-page-header__main">
          <div className="qb-page-header__title-row">
            <h1 className="qb-page-header__title">{title}</h1>
            {typeof count === 'number' && (
              <span className="qb-page-header__count" title={countLabel ?? `${count} mục`}>
                {count.toLocaleString('vi-VN')}
              </span>
            )}
            {titleChip}
          </div>
          {subtitle && <p className="qb-page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="qb-page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
