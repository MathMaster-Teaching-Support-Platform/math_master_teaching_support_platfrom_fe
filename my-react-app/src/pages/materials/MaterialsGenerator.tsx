import { Clock3, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from '../../services/api/auth.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap } from '../../types';
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

  // User / layout state
  const [userInfo, setUserInfo] = useState<MyInfo | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Table data
  const [slides, setSlides] = useState<LessonSlideGeneratedFile[]>([]);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const cards = [
    {
      icon: '📊',
      title: 'Slide Bài Giảng',
      desc: 'Tạo slide PowerPoint chuyên nghiệp từ nội dung bài giảng của bạn.',
      route: '/teacher/ai-slide-generator',
    },
    {
      icon: '🧠',
      title: 'Sơ Đồ Tư Duy',
      desc: 'Tạo mindmap trực quan tự động dựa trên các từ khóa bài học.',
      route: '/teacher/mindmaps',
    },
    {
      icon: '📐',
      title: 'Hình Vẽ Toán Học',
      desc: 'Vẽ đồ thị hàm số và hình học không gian chính xác chỉ với mô tả.',
      route: null, // pending BE implementation
    },
    {
      icon: '🧾',
      title: 'Phiếu Bài Tập',
      desc: 'Tạo đề bài tập in sẵn với các dạng toán đa dạng và lời giải chi tiết.',
      route: null, // pending BE implementation
    },
  ];

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
      <div className="materials-page">
        <header className="materials-header">
          <div>
            <h1>
              Tạo Tài Liệu với AI <span className="beta-badge">BETA</span>
            </h1>
            <p>
              Sử dụng AI để tạo slide, sơ đồ tư duy, hình vẽ và tài liệu giảng dạy chuyên nghiệp.
            </p>
          </div>
          <button className="history-btn">
            <Clock3 size={16} /> Lịch sử tạo
          </button>
        </header>

        <section className="tool-grid">
          {cards.map((card) => (
            <article key={card.title} className="tool-card">
              <div className="tool-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <button
                onClick={() => card.route && navigate(card.route)}
                disabled={card.route === null}
                title={card.route === null ? 'Tính năng đang phát triển' : undefined}
              >
                Bắt đầu tạo
              </button>
            </article>
          ))}
        </section>

        <section className="recent-section">
          <div className="recent-head">
            <h2>Tài liệu đã tạo gần đây</h2>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            {loading && <div className="table-loading">Đang tải...</div>}
            {!loading && error && <div className="table-error">{error}</div>}
            {!loading && !error && rows.length === 0 && (
              <div className="table-empty">Chưa có tài liệu nào được tạo.</div>
            )}
            {!loading && !error && rows.length > 0 && (
              <table>
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
                      <td className="file-cell">
                        <span className="file-dot">{row.kind === 'slide' ? '📊' : '🧠'}</span>
                        {row.title}
                      </td>
                      <td>
                        <span className="tool-tag">
                          {row.kind === 'slide' ? 'SLIDE' : 'MINDMAP'} AI
                        </span>
                      </td>
                      <td>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        {row.kind === 'slide' ? (
                          <span className="status-tag done">Hoàn thành</span>
                        ) : (
                          <span className={`status-tag ${mindmapStatusClass(row.status)}`}>
                            {mindmapStatusLabel(row.status)}
                          </span>
                        )}
                      </td>
                      <td className="action-cell">
                        {row.kind === 'slide' ? (
                          <a
                            href={`${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_DOWNLOAD(row.id)}`}
                            download
                          >
                            Tải về
                          </a>
                        ) : (
                          <button
                            className="action-link"
                            onClick={() => navigate(`/teacher/mindmaps/${row.id}`)}
                          >
                            Xem thử
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && !error && rows.length > 0 && (
              <div className="table-footer">
                Hiển thị 1 - {rows.length} của {allRows.length} tài liệu AI
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MaterialsGenerator;
