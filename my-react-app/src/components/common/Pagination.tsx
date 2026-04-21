import { useState } from 'react';
import './Pagination.css';

const PAGE_SIZE_STORAGE_KEY = 'pg_preferred_size';

interface PaginationProps {
  /** 0-indexed current page */
  page: number;
  totalPages: number;
  /** Total number of items across all pages */
  totalElements: number;
  pageSize: number;
  onChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  /** Show jump-to-page input. Defaults to true when totalPages > 5. */
  showJumpToPage?: boolean;
}

/** Build a windowed list: numbers are page indices (0-based), strings are unique ellipsis keys. */
function buildPageWindows(current: number, total: number): Array<number | string> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: Array<number | string> = [];
  const delta = 1; // show current ±1
  const left = current - delta;
  const right = current + delta;

  let prev: number | null = null;
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= left && i <= right)) {
      if (prev !== null && i - prev > 1) {
        pages.push(`ellipsis-after-${prev}`);
      }
      pages.push(i);
      prev = i;
    }
  }
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showJumpToPage,
}: Readonly<PaginationProps>) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalElements === 0) return null;

  // Guard: if backend count query misfires, treat as 1 page so UI still shows
  const safeTotalPages = totalPages > 0 ? totalPages : 1;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);
  const windows = buildPageWindows(page, safeTotalPages);
  const shouldShowJump = showJumpToPage ?? safeTotalPages > 5;

  function handleSizeChange(newSize: number) {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(newSize));
    onPageSizeChange?.(newSize);
  }

  function handleJumpSubmit() {
    if (!jumpValue.trim()) return;
    const num = Number.parseInt(jumpValue, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= safeTotalPages) {
      onChange(num - 1); // convert to 0-indexed
    }
    setJumpValue('');
  }

  return (
    <div className="pg-root">
      {/* Left: result summary */}
      <span className="pg-info">
        Hiển thị <strong>{start}–{end}</strong> / <strong>{totalElements}</strong> kết quả
      </span>

      {/* Desktop controls */}
      <div className="pg-controls">
        {/* Previous */}
        <button
          className="pg-btn pg-nav"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>

        {/* Page number buttons */}
        {windows.map((w) =>
          typeof w === 'string' ? (
            <span key={w} className="pg-ellipsis">…</span>
          ) : (
            <button
              key={w}
              className={`pg-btn${w === page ? ' active' : ''}`}
              onClick={() => onChange(w)}
              aria-current={w === page ? 'page' : undefined}
            >
              {w + 1}
            </button>
          )
        )}

        {/* Next */}
        <button
          className="pg-btn pg-nav"
          disabled={page >= safeTotalPages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>

        {/* Jump to page */}
        {shouldShowJump && (
          <div className="pg-jump">
            <span className="pg-jump-label">Trang</span>
            <input
              className="pg-jump-input"
              type="number"
              min={1}
              max={safeTotalPages}
              value={jumpValue}
              placeholder={String(page + 1)}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJumpSubmit(); }}
              onBlur={handleJumpSubmit}
              aria-label="Nhảy đến trang"
            />
            <span className="pg-jump-label">/ {safeTotalPages}</span>
          </div>
        )}

        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="pg-size-wrapper">
            <span className="pg-size-label">Hiển thị:</span>
            <select
              className="pg-size-select"
              value={pageSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              aria-label="Số mục mỗi trang"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="pg-size-label">/ trang</span>
          </div>
        )}
      </div>

      {/* Mobile compact view */}
      <div className="pg-mobile">
        <button
          className="pg-btn pg-nav"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>
        <span className="pg-mobile-info">
          Trang <strong>{page + 1}</strong> / {safeTotalPages}
        </span>
        <button
          className="pg-btn pg-nav"
          disabled={page >= safeTotalPages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </div>
  );
}
