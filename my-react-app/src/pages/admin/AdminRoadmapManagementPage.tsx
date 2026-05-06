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
  Workflow,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminRoadmaps, useDeleteRoadmap } from '../../hooks/useRoadmaps';
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

  const endItem = Math.min(page * PAGE_SIZE + filteredRoadmaps.length, totalElements);

  const createBtnCls =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3B6D4] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#96AAC8] active:scale-[0.98] transition-all duration-150 shadow-[rgba(110,130,165,0.22)_0px_8px_22px]';

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
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            {/* Header — TeacherMindmaps / CashFlow pattern */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                  <Workflow className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0 leading-tight">
                      Lộ trình
                    </h1>
                    {!isLoading && !error && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                        {totalElements}
                      </span>
                    )}
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 m-0">
                    Tìm kiếm, lọc và quản lý. Thống kê nhanh theo{' '}
                    <strong className="font-semibold text-[#5E5D59]">trang hiện tại</strong>.
                  </p>
                </div>
              </div>
              <Link to="/admin/roadmaps/create" className={createBtnCls}>
                <Plus className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                Tạo lộ trình
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  {
                    label: 'Tổng bản ghi',
                    value: isLoading ? '…' : totalElements,
                    Icon: Route,
                    bg: 'bg-[#EEF2FF]',
                    color: 'text-[#4F7EF7]',
                  },
                  {
                    label: 'Sẵn sàng (trang)',
                    value: isLoading ? '…' : pageStatusStats.ready,
                    Icon: CheckCircle2,
                    bg: 'bg-[#ECFDF5]',
                    color: 'text-[#2EAD7A]',
                  },
                  {
                    label: 'Đang học (trang)',
                    value: isLoading ? '…' : pageStatusStats.inProgress,
                    Icon: Clock3,
                    bg: 'bg-[#FFF7ED]',
                    color: 'text-[#E07B39]',
                  },
                  {
                    label: 'Hoàn thành (trang)',
                    value: isLoading ? '…' : pageStatusStats.done,
                    Icon: Trophy,
                    bg: 'bg-[#F5F3FF]',
                    color: 'text-[#9B6FE0]',
                  },
                ] as const
              ).map(({ label, value, Icon, bg, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.06)_0px_8px_28px] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                      {value}
                    </p>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 leading-snug">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <label className="relative flex w-full lg:max-w-xl items-center gap-3 bg-white border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#A3B6D4] focus-within:ring-1 focus-within:ring-[rgba(163,182,212,0.38)] transition-all duration-150 shadow-[rgba(0,0,0,0.03)_0px_2px_12px]">
                <Search className="text-[#87867F] w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                  placeholder="Tìm theo tên lộ trình..."
                  value={searchInput}
                  onChange={handleSearch}
                  aria-label="Tìm theo tên lộ trình"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Xóa nội dung tìm kiếm"
                    onClick={() => {
                      setSearchInput('');
                      setCurrentPage(0);
                    }}
                    className="text-[#87867F] hover:text-[#141413] transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
                {isFetching && (
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 text-[#87867F] pointer-events-none flex items-center ${searchInput ? 'right-10' : 'right-3'}`}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  </span>
                )}
              </label>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl self-start w-full lg:w-auto">
                {(['', 'GENERATED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const).map((id) => {
                  const key = id || 'all';
                  const n =
                    id === '' ? roadmaps.length : roadmaps.filter((r) => r.status === id).length;
                  const label = id === '' ? `Tất cả (${n})` : `${STATUS_LABELS[id] ?? id} (${n})`;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        statusFilter === id
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                      onClick={() => {
                        setStatusFilter(id);
                        setCurrentPage(0);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isLoading && !error && roadmaps.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                  Hiển thị
                </span>
                <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                  {filteredRoadmaps.length} / {roadmaps.length}
                </strong>
                <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" aria-hidden />
                <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F7EF7] inline-block" aria-hidden />
                  Trang{' '}
                  <strong className="text-[#141413] font-semibold">
                    {page + 1} / {Math.max(1, totalPages)}
                  </strong>
                </span>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-14 px-4 rounded-2xl border border-[#F0EEE6] bg-[#FAF9F5]">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 mb-3">
                  <AlertCircle className="w-6 h-6" strokeWidth={2} aria-hidden />
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center m-0">
                  Không thể tải danh sách lộ trình. Vui lòng thử lại.
                </p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="rounded-2xl border border-[#E8E6DC] bg-white shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
                  <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413] m-0">
                    Danh sách lộ trình
                  </h2>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 mt-0.5">
                    Chỉnh sửa hoặc lưu trữ từng lộ trình trên hệ thống
                  </p>
                </div>
                <article className="admin-roadmap-page__table admin-roadmap-mgmt-table-shell !border-0 !shadow-none !rounded-none !bg-transparent">
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
                        <Link to="/admin/roadmaps/create" className={createBtnCls}>
                          <Plus className="w-4 h-4 shrink-0" strokeWidth={2} />
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
                  <div className="admin-roadmap-page__pagination admin-roadmap-mgmt-pagination bg-[#FAF9F5]/90 border-t border-[#F0EEE6]">
                    <span className="admin-roadmap-page__pagination-info font-[Be_Vietnam_Pro]">
                      Hiển thị {endItem}/{totalElements} lộ trình
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
              </div>
            )}

            {deleteRoadmap.error && (
              <div
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] font-semibold text-red-700"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
                {deleteRoadmap.error.message || 'Không thể lưu trữ lộ trình.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
