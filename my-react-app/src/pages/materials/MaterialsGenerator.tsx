import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  Network,
  Presentation,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from '../../services/api/auth.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import '../../styles/module-refactor.css';
import type { Mindmap } from '../../types';
import type { LessonSlideGeneratedFile } from '../../types/lessonSlide.types';
import '../courses/TeacherCourses.css';
import './MaterialsGenerator.css';

// ─── Unified row type for the recent-materials table ─────────────────────────

type MaterialRow =
  | {
      kind: 'slide';
      id: string;
      title: string;
      createdAt: string;
      fileSizeBytes: number;
      isPublic: boolean;
      contentType: string;
    }
  | {
      kind: 'mindmap';
      id: string;
      title: string;
      createdAt: string;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── User info type from GET /users/my-info ───────────────────────────────────

interface MyInfo {
  id: string;
  fullName: string;
  avatar: string | null;
  roles: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const MaterialsGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [previewSlideId, setPreviewSlideId] = useState('');
  const [previewSlidePdfUrl, setPreviewSlidePdfUrl] = useState('');
  const [previewMindmapId, setPreviewMindmapId] = useState('');
  const [previewMindmapFrameLoading, setPreviewMindmapFrameLoading] = useState(false);
  const [loadingPreviewSlideId, setLoadingPreviewSlideId] = useState('');
  const [downloadingSlideId, setDownloadingSlideId] = useState('');
  const [downloadingMindmapId, setDownloadingMindmapId] = useState('');
  const isDownloadingAny = Boolean(downloadingSlideId || downloadingMindmapId);

  // User / layout state
  const [userInfo, setUserInfo] = useState<MyInfo | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Table data
  const [slides, setSlides] = useState<LessonSlideGeneratedFile[]>([]);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  };

  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) return;

    // Fetch user info from GET /users/my-info
    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/my-info`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        if (res.ok) {
          const json = await res.json();
          const result = (json as { result: MyInfo }).result;
          setUserInfo(result);
        }
      } catch {
        // fallback: user info stays null, layout will show empty
      }
    };

    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        // BE returns { "unreadCount": N } — plain JSON, no ApiResponse wrapper
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        if (res.ok) {
          const json = await res.json();
          const count =
            (json as { unreadCount?: number; count?: number }).unreadCount ??
            (json as { unreadCount?: number; count?: number }).count ??
            0;
          setNotificationCount(count);
        }
      } catch {
        // fallback to 0
      }
    };

    // Fetch slides (GET /lesson-slides/generated)
    const fetchSlides = async () => {
      try {
        const envelope = await LessonSlideService.getGeneratedFiles();
        setSlides(Array.isArray(envelope.result) ? envelope.result : []);
      } catch {
        // Non-blocking: empty slides
      }
    };

    // Fetch mindmaps (GET /mindmaps/my-mindmaps) — page 0-indexed, size 10
    const fetchMindmaps = async () => {
      try {
        const res = await MindmapService.getMyMindmaps({
          page: 0,
          size: 10,
          sortBy: 'createdAt',
          direction: 'DESC',
        });
        const content = (res as { result?: { content?: Mindmap[] } }).result?.content ?? [];
        setMindmaps(content);
      } catch {
        // Non-blocking: empty mindmaps
      }
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUserInfo(), fetchUnreadCount(), fetchSlides(), fetchMindmaps()]);
      } catch {
        setError('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    return () => {
      if (previewSlidePdfUrl) {
        window.URL.revokeObjectURL(previewSlidePdfUrl);
      }
    };
  }, [previewSlidePdfUrl]);

  const handlePreviewSlide = async (slideId: string) => {
    setLoadingPreviewSlideId(slideId);
    setError(null);
    setPreviewSlideId(slideId);
    setPreviewSlidePdfUrl('');

    try {
      const response = await LessonSlideService.getGeneratedFilePreviewPdf(slideId);
      const blobUrl = window.URL.createObjectURL(response.blob);

      if (previewSlidePdfUrl) {
        window.URL.revokeObjectURL(previewSlidePdfUrl);
      }

      setPreviewSlidePdfUrl(blobUrl);
    } catch (err) {
      setPreviewSlideId('');
      setError(err instanceof Error ? err.message : 'Không thể xem thử slide');
    } finally {
      setLoadingPreviewSlideId('');
    }
  };

  const closePreviewSlide = () => {
    setPreviewSlideId('');
    if (previewSlidePdfUrl) {
      window.URL.revokeObjectURL(previewSlidePdfUrl);
      setPreviewSlidePdfUrl('');
    }
  };

  const handlePreviewMindmap = (mindmapId: string) => {
    setPreviewMindmapId(mindmapId);
    setPreviewMindmapFrameLoading(true);
    setError(null);
  };

  const closePreviewMindmap = () => {
    setPreviewMindmapId('');
    setPreviewMindmapFrameLoading(false);
  };

  const handleDownloadSlide = async (slideId: string) => {
    setDownloadingSlideId(slideId);
    setError(null);

    try {
      const response = await LessonSlideService.downloadGeneratedFile(slideId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải xuống slide');
    } finally {
      setDownloadingSlideId('');
    }
  };

  const handleDownloadMindmap = async (mindmapId: string, title: string) => {
    setDownloadingMindmapId(mindmapId);
    setError(null);

    try {
      const response = await MindmapService.exportMindmap(mindmapId, 'png');
      triggerBlobDownload(response.blob, response.filename || `${title}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải xuống mindmap');
    } finally {
      setDownloadingMindmapId('');
    }
  };

  // Merge and sort slides + mindmaps into one unified list, newest first
  const allRows = useMemo<MaterialRow[]>(() => {
    const slideRows: MaterialRow[] = slides.map((s) => ({
      kind: 'slide',
      id: s.id,
      title: s.fileName,
      createdAt: s.createdAt,
      fileSizeBytes: s.fileSizeBytes,
      isPublic: s.isPublic,
      contentType: s.contentType,
    }));

    const mindmapRows: MaterialRow[] = mindmaps
      .filter((m) => m.status !== 'ARCHIVED')
      .map((m) => ({
        kind: 'mindmap',
        id: m.id,
        title: m.title,
        createdAt: m.createdAt,
        status: m.status,
      }));

    return [...slideRows, ...mindmapRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [slides, mindmaps]);

  const rows = useMemo(() => {
    const q = searchValue.toLowerCase();
    return allRows.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 12);
  }, [allRows, searchValue]);

  type ToolCard = {
    Icon: React.FC<{ size?: number }>;
    title: string;
    desc: string;
    route: string | null;
  };

  const cards: ToolCard[] = [
    {
      Icon: Presentation,
      title: 'Slide Bài Giảng',
      desc: 'Tạo slide PowerPoint chuyên nghiệp từ nội dung bài giảng của bạn chỉ trong vài giây.',
      route: '/teacher/ai-slide-generator',
    },
    {
      Icon: BrainCircuit,
      title: 'Sơ Đồ Tư Duy',
      desc: 'Tạo mindmap trực quan tự động dựa trên các từ khoá và nội dung bài học.',
      route: '/teacher/mindmaps',
    },
  ];

  const stats = useMemo(
    () => ({
      slides: slides.length,
      mindmaps: mindmaps.length,
      total: slides.length + mindmaps.length,
    }),
    [slides, mindmaps]
  );

  const userName = userInfo?.fullName ?? '';
  const userAvatar = userInfo?.avatar?.startsWith('http')
    ? userInfo.avatar
    : getInitials(userName) || 'GV';

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: userName, avatar: userAvatar, role: 'teacher' }}
      notificationCount={notificationCount}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Tài liệu
                  </h1>
                  {!loading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {stats.total}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {stats.slides} slide • {stats.mindmaps} mindmap
                </p>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  {
                    label: 'Tổng tài liệu',
                    value: stats.total,
                    Icon: Presentation,
                    bg: 'bg-[#FFF7ED]',
                    color: 'text-[#E07B39]',
                  },
                  {
                    label: 'Slide bài giảng',
                    value: stats.slides,
                    Icon: Presentation,
                    bg: 'bg-[#FFF7ED]',
                    color: 'text-[#E07B39]',
                  },
                  {
                    label: 'Sơ đồ tư duy',
                    value: stats.mindmaps,
                    Icon: Network,
                    bg: 'bg-[#F5F3FF]',
                    color: 'text-[#9B6FE0]',
                  },
                  {
                    label: 'Công cụ AI',
                    value: cards.length,
                    Icon: Sparkles,
                    bg: 'bg-[#F5F3FF]',
                    color: 'text-[#9B6FE0]',
                  },
                ] as const
              ).map(({ label, value, Icon, bg, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={color} size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                      {value}
                    </div>
                    <div className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tool cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.map((card) => {
              const { Icon } = card;
              return (
                <article
                  key={card.title}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                        <Icon size={20} />
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                        Khả dụng
                      </span>
                    </div>
                    <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] mb-1">
                      {card.title}
                    </h3>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-auto">
                      {card.desc}
                    </p>
                    <button
                      type="button"
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                      onClick={() => navigate(card.route!)}
                    >
                      Bắt đầu <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                placeholder="Tìm kiếm tài liệu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearchValue('')}
                  className="text-[#87867F] hover:text-[#141413] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>

          {/* ── Summary bar ── */}
          {!loading && !error && allRows.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                {rows.length} / {allRows.length}
              </strong>
              <div className="w-px h-4 bg-[#E8E6DC]" />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Slide <strong className="text-[#141413] font-semibold">{slides.length}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                Mindmap <strong className="text-[#141413] font-semibold">{mindmaps.length}</strong>
              </span>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333]">{error}</p>
            </div>
          )}

          {/* ── Materials Grid ── */}
          {!loading && !error && rows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((row, idx) => (
                <article
                  key={`${row.kind}-${row.id}`}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="h-[120px] relative flex items-end p-4 overflow-hidden bg-gradient-to-br from-[#FFF7ED] to-[#FFE8D6]">
                    <span className="absolute top-3 left-3 font-[Playfair_Display] text-[12px] font-medium opacity-40 text-[#E07B39]">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute top-3 right-3">
                      {row.kind === 'slide' ? (
                        <>
                          {row.isPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                              <Eye className="w-3 h-3" /> Công khai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]">
                              <EyeOff className="w-3 h-3" /> Nháp
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {row.status === 'PUBLISHED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                              <Eye className="w-3 h-3" /> Công khai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]">
                              <EyeOff className="w-3 h-3" /> Nháp
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <h3 className="relative font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2 text-[#E07B39]">
                      {row.title}
                    </h3>
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                        {row.kind === 'slide' ? (
                          <>
                            <Presentation className="w-3.5 h-3.5" /> SLIDE
                          </>
                        ) : (
                          <>
                            <Network className="w-3.5 h-3.5" /> MINDMAP
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6] mt-1">
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                        {new Date(row.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex gap-2">
                        {row.kind === 'slide' ? (
                          <>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                              onClick={() => handlePreviewSlide(row.id)}
                              disabled={loadingPreviewSlideId === row.id}
                            >
                              {loadingPreviewSlideId === row.id ? 'Tải...' : 'Xem'}
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                              onClick={() => handleDownloadSlide(row.id)}
                              disabled={downloadingSlideId === row.id}
                            >
                              {downloadingSlideId === row.id ? 'Tải...' : 'Tải'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                              onClick={() => handlePreviewMindmap(row.id)}
                            >
                              Xem
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                              onClick={() => handleDownloadMindmap(row.id, row.title)}
                              disabled={downloadingMindmapId === row.id}
                            >
                              {downloadingMindmapId === row.id ? 'Tải...' : 'Tải'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!loading && !error && rows.length === 0 && allRows.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                Không tìm thấy tài liệu nào phù hợp.
              </p>
            </div>
          )}

          {/* ── Empty: no materials ── */}
          {!loading && !error && allRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Presentation className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] mb-2">
                  Bạn chưa tạo tài liệu nào. Hãy bắt đầu từ các công cụ AI ở trên.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {previewSlideId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div
            className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.25)_0px_24px_80px] w-full max-w-6xl h-[86vh] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6DC] flex-shrink-0">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
                Xem thử slide
              </h3>
              <button
                className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                onClick={closePreviewSlide}
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {loadingPreviewSlideId === previewSlideId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin mx-auto mb-3" />
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                      Đang tải slide...
                    </p>
                  </div>
                </div>
              ) : previewSlidePdfUrl ? (
                <iframe src={previewSlidePdfUrl} title="Slide preview" className="w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                    Không có dữ liệu xem thử.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewMindmapId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div
            className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.25)_0px_24px_80px] w-full max-w-5xl h-[86vh] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6DC] flex-shrink-0">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
                Xem thử mindmap
              </h3>
              <button
                className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                onClick={closePreviewMindmap}
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden relative">
              {previewMindmapFrameLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FAF9F5] z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin mx-auto mb-3" />
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                      Đang tải mindmap...
                    </p>
                  </div>
                </div>
              )}
              <iframe
                src={`/teacher/mindmaps/${previewMindmapId}?embedPreview=1`}
                title="Mindmap preview"
                className="w-full h-full"
                onLoad={() => setPreviewMindmapFrameLoading(false)}
              />
            </div>
          </div>
        </div>
      )}

      {isDownloadingAny && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] p-8 flex flex-col items-center gap-4 w-full max-w-sm"
            role="status"
            aria-live="polite"
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin" />
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
              {downloadingSlideId ? 'Đang tải slide xuống...' : 'Đang tải mindmap xuống...'}
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MaterialsGenerator;
