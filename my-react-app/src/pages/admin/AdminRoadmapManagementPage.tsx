import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAdminRoadmaps, useDeleteRoadmap } from '../../hooks/useRoadmaps';
import { useDebounce } from '../../hooks/useDebounce';
import { mockAdmin } from '../../data/mockData';
import type { RoadmapCatalogItem } from '../../types';
import './admin-roadmap-page.css';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Sẵn sàng',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
};

function normalizePage(result: unknown): { rows: RoadmapCatalogItem[]; totalPages: number; totalElements: number; page: number } {
  if (!result) return { rows: [], totalPages: 0, totalElements: 0, page: 0 };
  const r = result as Record<string, unknown>;
  if (Array.isArray(r)) return { rows: r as RoadmapCatalogItem[], totalPages: 1, totalElements: (r as unknown[]).length, page: 0 };
  const content = Array.isArray(r['content']) ? (r['content'] as RoadmapCatalogItem[]) : [];
  const totalPages = typeof r['totalPages'] === 'number' ? r['totalPages'] : 1;
  const totalElements = typeof r['totalElements'] === 'number' ? r['totalElements'] : content.length;
  const page = typeof r['number'] === 'number' ? r['number'] : 0;
  return { rows: content, totalPages, totalElements, page };
}

export default function AdminRoadmapManagementPage() {
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const searchDebounced = useDebounce(searchInput, 300);

  const { data, isLoading, error, isFetching } = useAdminRoadmaps(searchDebounced, currentPage, PAGE_SIZE);
  const deleteRoadmap = useDeleteRoadmap();

  const { rows: roadmaps, totalPages, totalElements, page } = normalizePage(data?.result);

  const filteredRoadmaps = statusFilter
    ? roadmaps.filter((r) => r.status === statusFilter)
    : roadmaps;

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
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Quản lý lộ trình</h1>
            <p>Tìm kiếm, lọc và quản lý tất cả lộ trình học tập.</p>
          </div>
          <Link to="/admin/roadmaps/create" className="admin-roadmap-page__action">
            + Tạo lộ trình
          </Link>
        </header>

        {/* ── Search & Filter bar ── */}
        <div className="admin-roadmap-page__toolbar">
          <div className="admin-roadmap-page__search-wrap">
            <input
              type="search"
              className="admin-roadmap-page__search"
              placeholder="Tìm theo tên lộ trình..."
              value={searchInput}
              onChange={handleSearch}
            />
            {isFetching && <span className="admin-roadmap-page__search-loading">⟳</span>}
          </div>
          <select
            className="admin-roadmap-page__filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {isLoading && <p className="admin-roadmap-page__state">Đang tải lộ trình...</p>}
        {error && <p className="admin-roadmap-page__state">Không thể tải lộ trình.</p>}

        {!isLoading && !error && (
          <>
            <div className="admin-roadmap-page__table">
              <div className="admin-roadmap-page__row admin-roadmap-page__row--head">
                <span>Tên lộ trình</span>
                <span>Trạng thái</span>
                <span>Chủ đề</span>
                <span>Thao tác</span>
              </div>
              {filteredRoadmaps.length === 0 && (
                <p className="admin-roadmap-page__state" style={{ padding: '1rem' }}>
                  {searchDebounced ? `Không tìm thấy kết quả cho "${searchDebounced}"` : 'Chưa có lộ trình nào.'}
                </p>
              )}
              {filteredRoadmaps.map((roadmap) => (
                <div key={roadmap.id} className="admin-roadmap-page__row">
                  <span>{roadmap.name}</span>
                  <span>
                    <span className={`admin-roadmap-page__status admin-roadmap-page__status--${roadmap.status.toLowerCase()}`}>
                      {STATUS_LABELS[roadmap.status] ?? roadmap.status}
                    </span>
                  </span>
                  <span>{roadmap.totalTopicsCount}</span>
                  <span>
                    <Link to={`/admin/roadmaps/edit/${roadmap.id}`}>Sửa</Link>
                    {' | '}
                    <button
                      type="button"
                      className="admin-roadmap-page__inline-danger"
                      disabled={deleteRoadmap.isPending}
                      onClick={() => {
                        if (!globalThis.confirm(`Lưu trữ lộ trình "${roadmap.name}"?`)) return;
                        deleteRoadmap.mutate(roadmap.id);
                      }}
                    >
                      Lưu trữ
                    </button>
                  </span>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
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
                    ← Trước
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageIdx = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, currentPage - 3)) + i;
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
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {deleteRoadmap.error && (
          <p className="admin-roadmap-page__state">
            {deleteRoadmap.error.message || 'Không thể lưu trữ lộ trình.'}
          </p>
        )}
      </section>
    </DashboardLayout>
  );
}
