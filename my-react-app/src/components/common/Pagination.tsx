import './Pagination.css';

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
}

/** Build a windowed list: numbers are page indices (0-based), strings are unique ellipsis keys. */
function buildPageWindows(current: number, total: number): Array<number | string> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: Array<number | string> = [];
  const delta = 2; // pages around current
  const left = current - delta;
  const right = current + delta;

  let prev: number | null = null;
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= left && i <= right)) {
      if (prev !== null && i - prev > 1) {
        pages.push(`ellipsis-after-${prev}`); // unique key based on predecessor
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
  pageSizeOptions = [10, 20, 50],
}: Readonly<PaginationProps>) {
  if (totalPages <= 0) return null;

  const start = totalElements === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);
  const windows = buildPageWindows(page, totalPages);

  return (
    <div className="pg-root">
      <span className="pg-info">
        Hiển thị <strong>{start}–{end}</strong> trên <strong>{totalElements}</strong> kết quả
      </span>

      <div className="pg-controls">
        <button
          className="pg-btn"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>

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

        <button
          className="pg-btn"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>

        {onPageSizeChange && (
          <>
            <span className="pg-size-label">/ trang</span>
            <select
              className="pg-size-select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              aria-label="Số mục mỗi trang"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
