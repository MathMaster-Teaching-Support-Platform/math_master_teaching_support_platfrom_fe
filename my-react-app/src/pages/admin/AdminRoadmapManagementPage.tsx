import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Loader2,
  Map,
  Pencil,
  Plus,
  Route,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminRoadmaps, useDeleteRoadmap } from '../../hooks/useRoadmaps';
import '../../styles/module-refactor.css';
import type { RoadmapCatalogItem } from '../../types';
import '../courses/TeacherCourses.css';
import './admin-roadmap-page.css';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Sẵn sàng',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
};

function normalizePage(result: unknown): {
  rows: RoadmapCatalogItem[];
  totalPages: number;
  totalElements: number;
  page: number;
} {
  if (!result) return { rows: [], totalPages: 0, totalElements: 0, page: 0 };
  const r = result as Record<string, unknown>;
  if (Array.isArray(r))
    return {
      rows: r as RoadmapCatalogItem[],
      totalPages: 1,
      totalElements: (r as unknown[]).length,
      page: 0,
    };
  const content = Array.isArray(r['content']) ? (r['content'] as RoadmapCatalogItem[]) : [];
  const totalPages = typeof r['totalPages'] === 'number' ? r['totalPages'] : 1;
  const totalElements =
    typeof r['totalElements'] === 'number' ? r['totalElements'] : content.length;
  const page = typeof r['number'] === 'number' ? r['number'] : 0;
  return { rows: content, totalPages, totalElements, page };
}

export default function AdminRoadmapManagementPage() {
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const searchDebounced = useDebounce(searchInput, 300);

  const { data, isLoading, error, isFetching } = useAdminRoadmaps(
    searchDebounced,
    currentPage,
    PAGE_SIZE
  );
  const deleteRoadmap = useDeleteRoadmap();

  const { rows: roadmaps, totalPages, totalElements, page } = normalizePage(data?.result);

  const filteredRoadmaps = statusFilter
    ? roadmaps.filter((r) => r.status === statusFilter)
    : roadmaps;

  const pageStatusStats = useMemo(() => {
    const c = (s: string) => roadmaps.filter((r) => r.status === s).length;
    return {
      ready: c('GENERATED'),
      inProgress: c('IN_PROGRESS'),
      done: c('COMPLETED'),
      archived: c('ARCHIVED'),
    };
  }, [roadmaps]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(0);
  }, []);

  const startItem = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE + filteredRoadmaps.length, totalElements);

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-roadmap-mgmt-page">
        <div className="admin-roadmap-mgmt-page__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page admin-roadmap-mgmt-page__content">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="header-kicker">Admin</div>
              <div className="row" style={{ gap: '0.6rem', alignItems: 'center' }}>
                <h2>Quản lý lộ trình</h2>
                {!isLoading && !error && (
                  <span className="count-chip">{totalElements}</span>
                )}
              </div>
              <p className="header-sub admin-roadmap-mgmt-header-sub">
                Tìm kiếm, lọc và quản lý lộ trình. Thống kê theo bản ghi trên{' '}
                <strong>trang phân trang hiện tại</strong>.
              </p>
            </div>
            <Link
              to="/admin/roadmaps/create"
              className="btn btn--feat-indigo"
            >
              <Plus size={16} aria-hidden="true" />
              Tạo lộ trình
            </Link>
          </header>

          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Route size={20} />
              </div>
              <div>
                <h3>{isLoading ? '…' : totalElements}</h3>
                <p>Tổng bản ghi</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{isLoading ? '…' : pageStatusStats.ready}</h3>
                <p>Sẵn sàng (trang)</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <Clock3 size={20} />
              </div>
              <div>
                <h3>{isLoading ? '…' : pageStatusStats.inProgress}</h3>
                <p>Đang học (trang)</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Trophy size={20} />
              </div>
              <div>
                <h3>{isLoading ? '…' : pageStatusStats.done}</h3>
                <p>Hoàn thành (trang)</p>
              </div>
            </div>
          </div>

          <div className="toolbar admin-roadmap-mgmt-toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                type="search"
                placeholder="Tìm theo tên lộ trình..."
                value={searchInput}
                onChange={handleSearch}
                aria-label="Tìm theo tên lộ trình"
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => {
                    setSearchInput('');
                    setCurrentPage(0);
                  }}
                >
                  <X size={14} />
                </button>
              )}
              {isFetching && (
                <span className="admin-roadmap-mgmt-search-pending" aria-hidden="true">
                  <Loader2 size={16} className="admin-roadmap-mgmt-spin" />
                </span>
              )}
            </label>

            <div className="pill-group">
              {(['', 'GENERATED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const).map(
                (id) => {
                  const key = id || 'all';
                  const n =
                    id === ''
                      ? roadmaps.length
                      : roadmaps.filter((r) => r.status === id).length;
                  const label =
                    id === ''
                      ? `Tất cả (${n})`
                      : `${STATUS_LABELS[id] ?? id} (${n})`;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`pill-btn${statusFilter === id ? ' active' : ''}`}
                      onClick={() => {
                        setStatusFilter(id);
                        setCurrentPage(0);
                      }}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {!isLoading && !error && roadmaps.length > 0 && (
            <div className="assessment-summary-bar admin-roadmap-mgmt-summary">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị (sau lọc)</span>
                <strong className="summary-value">
                  {filteredRoadmaps.length} / {roadmaps.length}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Trang</span>
                <strong className="summary-value">
                  {page + 1} / {Math.max(1, totalPages)}
                </strong>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {error && (
            <div className="empty admin-roadmap-mgmt-empty">
              <AlertCircle
                size={32}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger, #c63f4d)' }}
                aria-hidden
              />
              <p>Không thể tải danh sách lộ trình. Vui lòng thử lại.</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <article className="admin-roadmap-page__table admin-roadmap-mgmt-table-shell">
                <div className="admin-roadmap-page__row admin-roadmap-page__row--head">
                  <span>Tên lộ trình</span>
                  <span>Trạng thái</span>
                  <span>Chủ đề</span>
                  <span>Thao tác</span>
                </div>
                {filteredRoadmaps.length === 0 && (
                  <div className="empty admin-roadmap-mgmt-empty" style={{ padding: '1.5rem' }}>
                    {searchDebounced || statusFilter ? (
                      <>
                        <Search size={32} style={{ opacity: 0.35 }} aria-hidden />
                        <p>
                          Không tìm thấy lộ trình
                          {searchDebounced ? ` cho “${searchDebounced}”` : ''} với bộ lọc này.
                        </p>
                      </>
                    ) : (
                      <>
                        <Map size={32} style={{ opacity: 0.35 }} aria-hidden />
                        <p>Chưa có lộ trình nào. Tạo lộ trình mới để bắt đầu.</p>
                        <Link to="/admin/roadmaps/create" className="btn btn--feat-indigo">
                          <Plus size={16} />
                          Tạo lộ trình đầu tiên
                        </Link>
                      </>
                    )}
                  </div>
                )}
                {filteredRoadmaps.map((roadmap) => (
                  <div key={roadmap.id} className="admin-roadmap-page__row">
                    <span className="admin-roadmap-mgmt-cell-name">{roadmap.name}</span>
                    <span>
                      <span
                        className={`admin-roadmap-page__status admin-roadmap-page__status--${roadmap.status.toLowerCase()}`}
                      >
                        <Circle className="admin-roadmap-page__status-dot" aria-hidden="true" />
                        {STATUS_LABELS[roadmap.status] ?? roadmap.status}
                      </span>
                    </span>
                    <span>{roadmap.totalTopicsCount}</span>
                    <span className="admin-roadmap-page__row-actions">
                      <Link
                        to={`/admin/roadmaps/edit/${roadmap.id}`}
                        className="admin-roadmap-page__inline-action"
                      >
                        <Pencil className="admin-roadmap-page__inline-icon" aria-hidden="true" />
                        Sửa
                      </Link>
                      <button
                        type="button"
                        className="admin-roadmap-page__inline-danger"
                        disabled={deleteRoadmap.isPending}
                        onClick={() => {
                          if (!globalThis.confirm(`Lưu trữ lộ trình "${roadmap.name}"?`)) return;
                          deleteRoadmap.mutate(roadmap.id);
                        }}
                      >
                        <Archive className="admin-roadmap-page__inline-icon" aria-hidden="true" />
                        Lưu trữ
                      </button>
                    </span>
                  </div>
                ))}
              </article>

              {totalPages > 0 && (
                <div className="admin-roadmap-page__pagination">
                  <span className="admin-roadmap-page__pagination-info">
                    Hiển thị {startItem}–{endItem} trong số {totalElements} lộ trình
                  </span>
                  <div className="admin-roadmap-page__pagination-controls">
                    <button
                      type="button"
                      className="admin-roadmap-page__page-btn"
                      disabled={currentPage <= 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="admin-roadmap-page__page-icon" aria-hidden="true" />
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pageIdx =
                        totalPages <= 7
                          ? i
                          : Math.max(0, Math.min(totalPages - 7, currentPage - 3)) + i;
                      return (
                        <button
                          key={pageIdx}
                          type="button"
                          className={`admin-roadmap-page__page-btn ${currentPage === pageIdx ? 'admin-roadmap-page__page-btn--active' : ''}`}
                          onClick={() => setCurrentPage(pageIdx)}
                        >
                          {pageIdx + 1}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="admin-roadmap-page__page-btn"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Sau
                      <ChevronRight className="admin-roadmap-page__page-icon" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {deleteRoadmap.error && (
            <div
              className="admin-roadmap-mgmt-alert"
              role="alert"
            >
              <AlertCircle size={16} aria-hidden="true" />
              {deleteRoadmap.error.message || 'Không thể lưu trữ lộ trình.'}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
