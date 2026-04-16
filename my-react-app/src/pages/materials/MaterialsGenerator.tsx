import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  Clock3,
  Download,
  Eye,
  FileSliders,
  Network,
  PenTool,
  Presentation,
  Search,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from '../../services/api/auth.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import '../../styles/module-refactor.css';
import type { Mindmap, MindmapNode } from '../../types';
import type { LessonSlideGeneratedFile } from '../../types/lessonSlide.types';
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

function mindmapStatusLabel(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): string {
  if (status === 'PUBLISHED') return 'Hoàn thành';
  if (status === 'DRAFT') return 'Đang xử lý';
  return 'Lưu trữ';
}

function mindmapStatusClass(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): string {
  if (status === 'PUBLISHED') return 'done';
  if (status === 'DRAFT') return 'processing';
  return 'archived';
}

type MindmapRenderNode = {
  id: string;
  parentId: string | null;
  content: string;
  color: string;
  icon: string;
  displayOrder: number;
  children: MindmapRenderNode[];
};

function normalizeMindmapColor(value?: string): string {
  const fallback = '#4f46e5';
  if (!value) return fallback;
  const color = value.trim();
  const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  return validHex.test(color) ? color : fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((part) => part + part)
          .join('')
      : cleaned;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function sortMindmapNodes(nodes: MindmapRenderNode[]): MindmapRenderNode[] {
  return [...nodes]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((node) => ({
      ...node,
      children: sortMindmapNodes(node.children || []),
    }));
}

function toMindmapTree(nodes: MindmapNode[]): MindmapRenderNode[] {
  const map = new Map<string, MindmapRenderNode>();

  nodes.forEach((node) => {
    map.set(node.id, {
      id: node.id,
      parentId: node.parentId,
      content: node.content || '',
      color: normalizeMindmapColor(node.color),
      icon: node.icon || '',
      displayOrder: node.displayOrder || 0,
      children: [],
    });
  });

  nodes.forEach((rawNode) => {
    const node = map.get(rawNode.id);
    if (!node) return;

    const parentId = rawNode.parentId ?? null;
    node.parentId = parentId;

    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    }
  });

  const roots = Array.from(map.values()).filter(
    (node) => !node.parentId || !map.has(node.parentId)
  );
  return sortMindmapNodes(roots);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ['Nút không có nội dung'];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) break;
    }
  }

  if (lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?\-\s]+$/, '')}...`;
  }

  return lines;
}

type MindmapPosition = {
  x: number;
  y: number;
  depth: number;
  node: MindmapRenderNode;
};

function layoutMindmap(root: MindmapRenderNode): MindmapPosition[] {
  const positions: MindmapPosition[] = [];
  let leafIndex = 0;
  const verticalGap = 120;
  const horizontalGap = 290;
  const margin = 90;

  const walk = (node: MindmapRenderNode, depth: number): number => {
    if (!node.children.length) {
      const y = margin + leafIndex * verticalGap;
      leafIndex += 1;
      positions.push({ x: margin + depth * horizontalGap, y, depth, node });
      return y;
    }

    const childYs = node.children.map((child) => walk(child, depth + 1));
    const y = childYs.reduce((sum, value) => sum + value, 0) / childYs.length;
    positions.push({ x: margin + depth * horizontalGap, y, depth, node });
    return y;
  };

  walk(root, 0);
  return positions;
}

function renderMindmapToCanvas(title: string, rawNodes: MindmapNode[]): HTMLCanvasElement | null {
  const roots = toMindmapTree(rawNodes);
  if (!roots.length) return null;

  const root = roots[0];
  const positions = layoutMindmap(root);
  if (!positions.length) return null;

  const nodeWidth = 220;
  const nodeHeight = 72;
  const padding = 40;

  const maxDepth = Math.max(...positions.map((item) => item.depth));
  const maxY = Math.max(...positions.map((item) => item.y));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(980, (maxDepth + 1) * 290 + nodeWidth + padding * 2);
  canvas.height = Math.max(540, maxY + nodeHeight + padding * 2);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#eef2ff');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 28px "Be Vietnam Pro", "Segoe UI", sans-serif';
  ctx.fillText(title || 'Mindmap', 40, 48);

  const byId = new Map(positions.map((item) => [item.node.id, item]));

  ctx.lineWidth = 2;
  positions.forEach((item) => {
    item.node.children.forEach((child) => {
      const childPos = byId.get(child.id);
      if (!childPos) return;

      const startX = item.x + nodeWidth;
      const startY = item.y + nodeHeight / 2;
      const endX = childPos.x;
      const endY = childPos.y + nodeHeight / 2;
      const midX = (startX + endX) / 2;

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
      ctx.stroke();
    });
  });

  positions.forEach((item) => {
    const nodeColor = normalizeMindmapColor(item.node.color);
    const x = item.x;
    const y = item.y;

    roundRectPath(ctx, x, y, nodeWidth, nodeHeight, 14);
    ctx.fillStyle = hexToRgba(nodeColor, 0.16);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(nodeColor, 0.48);
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 15px "Be Vietnam Pro", "Segoe UI", sans-serif';
    const iconPrefix = item.node.icon ? `${item.node.icon} ` : '';
    const lines = wrapCanvasText(ctx, `${iconPrefix}${item.node.content}`, nodeWidth - 24, 3);
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 12, y + 26 + index * 18);
    });
  });

  return canvas;
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
  const [loadingPreviewSlideId, setLoadingPreviewSlideId] = useState('');
  const [downloadingMindmapId, setDownloadingMindmapId] = useState('');

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

  const makeSafeFileName = (value: string, fallback: string) => {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return normalized || fallback;
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

    try {
      const response = await LessonSlideService.getGeneratedFilePreviewPdf(slideId);
      const blobUrl = window.URL.createObjectURL(response.blob);

      if (previewSlidePdfUrl) {
        window.URL.revokeObjectURL(previewSlidePdfUrl);
      }

      setPreviewSlidePdfUrl(blobUrl);
      setPreviewSlideId(slideId);
    } catch (err) {
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

  const handleDownloadMindmap = async (mindmapId: string, title: string) => {
    setDownloadingMindmapId(mindmapId);
    setError(null);

    try {
      const response = await MindmapService.getMindmapById(mindmapId);
      const fileName = `${makeSafeFileName(title, 'mindmap')}.json`;
      const nodes = (response.result?.nodes || []) as MindmapNode[];
      const canvas = renderMindmapToCanvas(title, nodes);
      if (!canvas) {
        throw new Error('Mindmap chưa sẵn sàng để tải PNG. Vui lòng thử lại sau.');
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('Không thể xuất ảnh mindmap.'));
            return;
          }
          resolve(result);
        }, 'image/png');
      });

      const pngFileName = fileName.replace(/\.json$/, '.png');
      triggerBlobDownload(blob, pngFileName);
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
    accentClass: string;
    tag: string;
  };

  const cards: ToolCard[] = [
    {
      Icon: Presentation,
      title: 'Slide Bài Giảng',
      desc: 'Tạo slide PowerPoint chuyên nghiệp từ nội dung bài giảng của bạn chỉ trong vài giây.',
      route: '/teacher/ai-slide-generator',
      accentClass: 'tool-accent-blue',
      tag: 'Khả dụng',
    },
    {
      Icon: BrainCircuit,
      title: 'Sơ Đồ Tư Duy',
      desc: 'Tạo mindmap trực quan tự động dựa trên các từ khoá và nội dung bài học.',
      route: '/teacher/mindmaps',
      accentClass: 'tool-accent-violet',
      tag: 'Khả dụng',
    },
    {
      Icon: PenTool,
      title: 'Hình Vẽ Toán Học',
      desc: 'Vẽ đồ thị hàm số và hình học không gian chính xác chỉ với mô tả ngôn ngữ tự nhiên.',
      route: null,
      accentClass: 'tool-accent-amber',
      tag: 'Sắp ra mắt',
    },
    {
      Icon: FileSliders,
      title: 'Phiếu Bài Tập',
      desc: 'Tạo đề bài tập in sẵn với các dạng toán đa dạng và lời giải chi tiết.',
      route: null,
      accentClass: 'tool-accent-emerald',
      tag: 'Sắp ra mắt',
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
    >
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header materials-header-row">
            <div className="header-stack">
              <div className="header-kicker">AI Content Studio</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Tạo Tài Liệu với AI</h2>
                <span className="materials-beta-badge">BETA</span>
              </div>
              <p className="header-sub">
                Sử dụng AI để tạo slide, sơ đồ tư duy, hình vẽ và tài liệu giảng dạy chuyên nghiệp.
              </p>
            </div>
            <button className="btn materials-history-btn">
              <Clock3 size={15} />
              Lịch sử tạo
            </button>
          </header>

          {/* ── Stats ── */}
          {!loading && (
            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <div className="stat-icon-wrap">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3>{stats.total}</h3>
                  <p>Tổng tài liệu</p>
                </div>
              </div>
              <div className="stat-card stat-indigo">
                <div className="stat-icon-wrap">
                  <Presentation size={20} />
                </div>
                <div>
                  <h3>{stats.slides}</h3>
                  <p>Slide bài giảng</p>
                </div>
              </div>
              <div className="stat-card stat-violet">
                <div className="stat-icon-wrap">
                  <Network size={20} />
                </div>
                <div>
                  <h3>{stats.mindmaps}</h3>
                  <p>Sơ đồ tư duy</p>
                </div>
              </div>
              <div className="stat-card stat-emerald">
                <div className="stat-icon-wrap">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3>4</h3>
                  <p>Công cụ AI</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tool cards ── */}
          <div className="materials-section-label">
            <Sparkles size={15} /> Công cụ tạo tài liệu
          </div>
          <div className="materials-tool-grid">
            {cards.map((card) => {
              const { Icon } = card;
              const available = card.route !== null;
              return (
                <article key={card.title} className={`materials-tool-card ${card.accentClass}`}>
                  <div className="materials-tool-card__head">
                    <div className="materials-tool-icon">
                      <Icon size={22} />
                    </div>
                    <span
                      className={`materials-tool-tag ${available ? 'available' : 'coming-soon'}`}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <button
                    className={`btn${available ? '' : ' secondary'} materials-tool-cta`}
                    onClick={() => available && navigate(card.route!)}
                    disabled={!available}
                    title={available ? undefined : 'Tính năng đang phát triển'}
                  >
                    {available ? 'Bắt đầu tạo' : 'Đang phát triển'}
                  </button>
                </article>
              );
            })}
          </div>

          {/* ── Recent materials ── */}
          <div className="toolbar" style={{ marginTop: '0.5rem' }}>
            <div className="materials-section-label" style={{ margin: 0 }}>
              <Clock3 size={15} /> Tài liệu đã tạo gần đây
            </div>
            <label className="search-box" style={{ marginLeft: 'auto' }}>
              <span className="search-box__icon">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </label>
          </div>

          <div className="table-wrap">
            {loading && (
              <div className="materials-table-placeholder">
                <div className="skeleton-card" style={{ height: 180 }} />
              </div>
            )}
            {!loading && error && (
              <div className="empty">
                <AlertCircle size={28} style={{ opacity: 0.5, color: 'var(--mod-danger)' }} />
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && rows.length === 0 && (
              <div className="empty">
                <Network size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
                <p>Chưa có tài liệu nào được tạo.</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Hãy chọn một công cụ AI ở trên để bắt đầu!
                </p>
              </div>
            )}
            {!loading && !error && rows.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên tệp</th>
                    <th>Công cụ</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.kind}-${row.id}`}>
                      <td>
                        <div className="materials-file-cell">
                          <span className="materials-file-icon">
                            {row.kind === 'slide' ? (
                              <Presentation size={14} />
                            ) : (
                              <BrainCircuit size={14} />
                            )}
                          </span>
                          <span className="materials-file-name">{row.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge materials-kind-badge ${row.kind}`}>
                          {row.kind === 'slide' ? 'SLIDE AI' : 'MINDMAP AI'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--mod-slate-500)', fontSize: '0.85rem' }}>
                        {new Date(row.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        {row.kind === 'slide' ? (
                          <span className="badge completed">Hoàn thành</span>
                        ) : (
                          <span className={`badge ${mindmapStatusClass(row.status)}`}>
                            {mindmapStatusLabel(row.status)}
                          </span>
                        )}
                      </td>
                      <td>
                        {row.kind === 'slide' ? (
                          <div className="materials-action-group">
                            <button
                              className="btn secondary materials-action-btn"
                              onClick={() => void handlePreviewSlide(row.id)}
                              disabled={loadingPreviewSlideId === row.id}
                            >
                              <Eye size={13} />
                              {loadingPreviewSlideId === row.id ? 'Đang tải...' : 'Xem thử'}
                            </button>
                            <a
                              className="btn secondary materials-action-btn"
                              href={`${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_DOWNLOAD(row.id)}`}
                              download
                            >
                              <Download size={13} /> Tải về
                            </a>
                          </div>
                        ) : (
                          <div className="materials-action-group">
                            <button
                              className="btn secondary materials-action-btn"
                              onClick={() => navigate(`/teacher/mindmaps/${row.id}`)}
                            >
                              <Eye size={13} /> Xem thử
                            </button>
                            <button
                              className="btn secondary materials-action-btn"
                              onClick={() => void handleDownloadMindmap(row.id, row.title)}
                              disabled={downloadingMindmapId === row.id}
                            >
                              <Download size={13} />
                              {downloadingMindmapId === row.id ? 'Đang tải...' : 'Tải về'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && !error && rows.length > 0 && (
              <div className="materials-table-footer">
                Hiển thị {rows.length} / {allRows.length} tài liệu AI
              </div>
            )}
          </div>

          {previewSlideId && (
            <div className="materials-preview-overlay" role="dialog" aria-modal="true">
              <div className="materials-preview-modal">
                <div className="materials-preview-header">
                  <h3>Xem thử slide</h3>
                  <button className="btn secondary" onClick={closePreviewSlide}>
                    Đóng
                  </button>
                </div>
                {previewSlidePdfUrl ? (
                  <iframe
                    src={previewSlidePdfUrl}
                    title="Slide preview"
                    className="materials-preview-frame"
                  />
                ) : (
                  <div className="empty">Không có dữ liệu xem thử.</div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MaterialsGenerator;
