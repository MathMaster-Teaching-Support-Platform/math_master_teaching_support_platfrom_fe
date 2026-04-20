import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../../data/mockData';
import { useRoadmaps } from '../../../hooks/useRoadmaps';
import { AuthService } from '../../../services/api/auth.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import type { RoadmapCatalogItem } from '../../../types';
import './StudentDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────
function normalizeRoadmaps(
  result:
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

const TODAY = new Date('2026-04-01');

function getDaysRemaining(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - TODAY.getTime()) / 86_400_000);
}

function getUrgencyInfo(days: number): { color: string; label: string } {
  if (days <= 3) return { color: '#f87171', label: `${days}d` };
  if (days <= 7) return { color: '#fbbf24', label: `${days}d` };
  return { color: '#34d399', label: `${days}d` };
}

// ─── SVG Icons ────────────────────────────────────────────────
const IBook = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const ICheck = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ITarget = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IBrain = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.5 2A2.5 2.5 0 007 4.5v0A2.5 2.5 0 004.5 7h0a2.5 2.5 0 000 5h0A2.5 2.5 0 007 14.5v0A2.5 2.5 0 009.5 17" />
    <path d="M14.5 2A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0119.5 7h0a2.5 2.5 0 000 5h0A2.5 2.5 0 0117 14.5v0A2.5 2.5 0 0114.5 17" />
    <path d="M12 17v5M9 22h6" />
  </svg>
);
const IMap = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);
const IWallet = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
    <circle cx="16" cy="13" r="2" fill="currentColor" stroke="none" />
  </svg>
);
const IGrade = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);
const ITrophy = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
const IClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IChevron = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IArrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IEdit = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IFire = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z" />
  </svg>
);

// ─── AnimatedCounter ──────────────────────────────────────────
interface CounterProps {
  target: number;
  decimals?: number;
  duration?: number;
}

const AnimatedCounter: React.FC<CounterProps> = ({ target, decimals = 0, duration = 1400 }) => {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);

  useEffect(() => {
    let started = false;
    const tick = (ts: number) => {
      if (!started) {
        t0Ref.current = ts;
        started = true;
      }
      const p = Math.min((ts - t0Ref.current) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Number.parseFloat((e * target).toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, decimals, duration]);

  return <>{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}</>;
};

// ─── ProgressRing ─────────────────────────────────────────────
interface RingProps {
  percent: number;
  color: string;
  size?: number;
  sw?: number;
}

const ProgressRing: React.FC<RingProps> = ({ percent, color, size = 58, sw = 4 }) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={sw}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
};

// ─── Skeleton line ────────────────────────────────────────────
const Skel: React.FC<{ w?: string; h?: string; r?: string }> = ({
  w = '100%',
  h = '14px',
  r = '8px',
}) => <div className="sd-skel" style={{ width: w, height: h, borderRadius: r }} />;

// ─── Static mock data ─────────────────────────────────────────
const STAT_CARDS = [
  {
    icon: <IBook />,
    label: 'Giáo trình đang học',
    value: mockStudent.enrolledCourses,
    decimals: 0,
    ring: 83,
    change: '+1 tháng này',
    pos: true,
    color: '#818cf8',
    bg: 'rgba(99,102,241,.18)',
    glow: 'rgba(99,102,241,.35)',
  },
  {
    icon: <ICheck />,
    label: 'Bài tập hoàn thành',
    value: mockStudent.completedAssignments,
    decimals: 0,
    ring: 75,
    change: '+12% tuần này',
    pos: true,
    color: '#34d399',
    bg: 'rgba(52,211,153,.18)',
    glow: 'rgba(52,211,153,.30)',
  },
  {
    icon: <IStar />,
    label: 'Điểm trung bình',
    value: mockStudent.averageScore,
    decimals: 1,
    ring: 85,
    change: '+0.3 tháng này',
    pos: true,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,.18)',
    glow: 'rgba(251,191,36,.30)',
  },
  {
    icon: <ITarget />,
    label: 'Bài tập cần làm',
    value: 3,
    decimals: 0,
    ring: 30,
    change: '3 chưa nộp',
    pos: false,
    color: '#f87171',
    bg: 'rgba(248,113,113,.18)',
    glow: 'rgba(248,113,113,.30)',
  },
];

const UPCOMING_TASKS = [
  {
    id: 'u1',
    title: 'Bài tập về Mệnh đề logic',
    subject: 'Đại số 10',
    dueDate: '2026-04-08',
    type: 'homework',
    progress: 60,
    color: '#818cf8',
  },
  {
    id: 'u2',
    title: 'Đề thi giữa kỳ - Hình học không gian',
    subject: 'Hình học 11',
    dueDate: '2026-04-15',
    type: 'exam',
    progress: 0,
    color: '#34d399',
  },
  {
    id: 'u3',
    title: 'Quiz nhanh - Đạo hàm cơ bản',
    subject: 'Giải tích 12',
    dueDate: '2026-04-06',
    type: 'quiz',
    progress: 30,
    color: '#fbbf24',
  },
];

const RECENT_GRADES = [
  {
    id: 1,
    title: 'Kiểm tra 15 phút - Tập hợp',
    subject: 'Đại số 10',
    score: 8.5,
    date: '28/03/2026',
  },
  { id: 2, title: 'Bài tập Mệnh đề', subject: 'Đại số 10', score: 7.8, date: '25/03/2026' },
  { id: 3, title: 'Đề thi giữa kỳ T1', subject: 'Hình học 11', score: 9, date: '20/03/2026' },
  { id: 4, title: 'Quiz - Hàm số', subject: 'Giải tích 12', score: 8.2, date: '15/03/2026' },
];

const LEARN_PROGRESS = [
  { subject: 'Đại số 10', percent: 75, color: '#818cf8', done: 9, total: 12 },
  { subject: 'Hình học 11', percent: 60, color: '#34d399', done: 9, total: 15 },
  { subject: 'Giải tích 12', percent: 45, color: '#fbbf24', done: 9, total: 20 },
];

const WEEKLY = [
  { day: 'T2', h: 2.5 },
  { day: 'T3', h: 1.8 },
  { day: 'T4', h: 3.2 },
  { day: 'T5', h: 2.1 },
  { day: 'T6', h: 4 },
  { day: 'T7', h: 1.5 },
  { day: 'CN', h: 0 },
];

const STREAK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const STREAK_ON = [true, true, true, true, true, false, false];

const QUICK_ACTIONS = [
  { icon: <IBook />, label: 'Học bài mới', path: '/student/courses', color: '#818cf8' },
  { icon: <IEdit />, label: 'Bài tập', path: '/student/assignments', color: '#34d399' },
  { icon: <IGrade />, label: 'Xem điểm', path: '/student/grades', color: '#fbbf24' },
  { icon: <IBrain />, label: 'Hỏi AI', path: '/ai/chat', color: '#f9a8d4' },
  { icon: <IMap />, label: 'Lộ trình', path: '/student/roadmap', color: '#67e8f9' },
  { icon: <IWallet />, label: 'Ví của tôi', path: '/student/wallet', color: '#a78bfa' },
];

// ─── WeeklyChart ──────────────────────────────────────────────
const WeeklyChart: React.FC = () => {
  const max = Math.max(...WEEKLY.map((d) => d.h), 1);
  return (
    <div className="sd-weekly-wrap">
      <div className="sd-weekly-bars" role="img" aria-label="Biểu đồ hoạt động tuần">
        {WEEKLY.map((d, i) => {
          const pct = (d.h / max) * 100;
          const isToday = i === 4;
          return (
            <div key={d.day} className="sd-wcol">
              {d.h > 0 && <span className="sd-wval">{d.h}h</span>}
              <div className="sd-wtrack">
                <div
                  className={`sd-wfill${isToday ? ' sd-wtoday' : ''}`}
                  style={{ height: `${pct}%` }}
                  title={`${d.day}: ${d.h}h`}
                />
              </div>
              <span className="sd-wlbl">{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="sd-wsummary">
        <span className="sd-wsnum">15.1h</span>
        <span className="sd-wslbl">
          tổng tuần này &nbsp;·&nbsp; <strong>+18%</strong> so tuần trước
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const roadmapsQuery = useRoadmaps();
  const [isTeacherApproved, setIsTeacherApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const check = async () => {
      if (AuthService.hasRole('teacher')) {
        setIsTeacherApproved(true);
        return;
      }
      try {
        const res = await TeacherProfileService.getMyProfile();
        if (res.result.status === 'APPROVED') setIsTeacherApproved(true);
      } catch {
        /* silent */
      }
    };
    check();
  }, []);

  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmapList = normalizeRoadmaps(roadmapResult);

  const hour = new Date().getHours();
  let greeting = 'Chào buổi tối';
  if (hour < 12) greeting = 'Chào buổi sáng';
  else if (hour < 18) greeting = 'Chào buổi chiều';

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="sd-page">
        {/* ── Teacher Banner ── */}
        {isTeacherApproved && (
          <div className="sd-card sd-banner-teacher sd-anim-0">
            <div className="sd-banner-left">
              <div className="sd-banner-icon">
                <ITrophy />
              </div>
              <div>
                <h3>Bạn đã được duyệt làm Giáo viên!</h3>
                <p>Bắt đầu tạo nội dung và quản lý lớp học ngay hôm nay.</p>
              </div>
            </div>
            <button
              className="sd-btn sd-btn-gradient"
              onClick={() => navigate('/teacher/dashboard')}
              aria-label="Chuyển sang giao diện Giáo viên"
            >
              Chuyển vai trò <IArrow />
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="sd-header">
          <div className="sd-header-text">
            <div className="sd-greeting-badge">{greeting} ☀️</div>
            <h1 className="sd-title">
              {mockStudent.name}! <span className="sd-wave">👋</span>
            </h1>
            <p className="sd-subtitle">
              Hôm nay bạn có <strong>3 bài tập</strong> cần hoàn thành. Hãy cùng chinh phục nào!
            </p>
          </div>
          <div className="sd-header-actions">
            <button
              className="sd-btn sd-btn-ai"
              onClick={() => navigate('/ai/chat')}
              aria-label="Chat với AI"
            >
              <IBrain /> <span>Hỏi AI</span>
            </button>
            <button
              className="sd-btn sd-btn-outline"
              onClick={() => navigate('/student/courses')}
              aria-label="Học bài mới"
            >
              <IBook /> <span>Học bài mới</span>
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <ul
          className="sd-stats-grid"
          aria-label="Thống kê học tập"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="sd-card sd-stat-skel">
                  <Skel w="44px" h="44px" r="12px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Skel w="65%" h="11px" />
                    <Skel w="40%" h="28px" />
                    <Skel w="55%" h="10px" />
                  </div>
                </div>
              ))
            : STAT_CARDS.map((s, i) => (
                <li
                  key={s.label}
                  className={`sd-card sd-stat-card sd-anim-${i}`}
                  aria-label={`${s.label}: ${s.value}`}
                  style={{ '--card-glow': s.glow } as React.CSSProperties}
                >
                  <div className="sd-stat-top">
                    <div className="sd-stat-icon" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <ProgressRing percent={s.ring} color={s.color} />
                  </div>
                  <div className="sd-stat-num" style={{ color: s.color }}>
                    <AnimatedCounter target={s.value} decimals={s.decimals} />
                  </div>
                  <div className="sd-stat-label">{s.label}</div>
                  <div className={`sd-stat-change ${s.pos ? 'sd-pos' : 'sd-neg'}`}>
                    {s.pos ? '▲' : '●'} {s.change}
                  </div>
                </li>
              ))}
        </ul>

        {/* ── Main 2-col Grid ── */}
        <div className="sd-main-grid">
          {/* Left column */}
          <div className="sd-col">
            {/* Upcoming Tasks */}
            <div className="sd-card sd-anim-1">
              <div className="sd-card-header">
                <h2 className="sd-card-title">
                  <IEdit /> Bài tập sắp tới
                </h2>
                <Link to="/student/assignments" className="sd-link" aria-label="Xem tất cả bài tập">
                  Xem tất cả <IChevron />
                </Link>
              </div>
              <div className="sd-tasks-list">
                {UPCOMING_TASKS.map((task) => {
                  const days = getDaysRemaining(task.dueDate);
                  const urg = getUrgencyInfo(days);
                  return (
                    <div key={task.id} className="sd-task-item">
                      <div className="sd-task-line" style={{ background: task.color }} />
                      <div className="sd-task-body">
                        <div className="sd-task-head">
                          <span className="sd-task-title">{task.title}</span>
                          <span
                            className="sd-days-badge"
                            style={{ background: `${urg.color}20`, color: urg.color }}
                            aria-label={`Còn ${urg.label} nữa`}
                          >
                            <IClock /> {urg.label}
                          </span>
                        </div>
                        <div className="sd-task-meta">
                          <span
                            className="sd-subject-tag"
                            style={{ background: `${task.color}20`, color: task.color }}
                          >
                            {task.subject}
                          </span>
                          <span className="sd-task-due">
                            Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {task.progress > 0 && (
                          <div className="sd-task-prog-row">
                            <div className="sd-task-prog-track">
                              <div
                                className="sd-task-prog-fill"
                                style={{ width: `${task.progress}%`, background: task.color }}
                              />
                            </div>
                            <span className="sd-task-prog-num">{task.progress}%</span>
                          </div>
                        )}
                      </div>
                      <button
                        className="sd-btn sd-btn-sm"
                        style={{ borderColor: task.color, color: task.color }}
                        onClick={() => navigate('/student/assignments')}
                        aria-label={`Làm bài: ${task.title}`}
                      >
                        Làm bài
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Learning Progress */}
            <div className="sd-card sd-anim-2">
              <div className="sd-card-header">
                <h2 className="sd-card-title">
                  <IGrade /> Tiến độ học tập
                </h2>
              </div>
              <div className="sd-prog-list">
                {LEARN_PROGRESS.map((lp) => (
                  <div key={lp.subject} className="sd-prog-item">
                    <div className="sd-prog-info">
                      <span className="sd-prog-label" style={{ color: lp.color }}>
                        {lp.subject}
                      </span>
                      <span className="sd-prog-meta">
                        {lp.done}/{lp.total} bài · <strong>{lp.percent}%</strong>
                      </span>
                    </div>
                    <div className="sd-prog-track">
                      <div
                        className="sd-prog-fill"
                        style={{
                          width: `${lp.percent}%`,
                          background: `linear-gradient(90deg,${lp.color}88,${lp.color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="sd-col">
            {/* Motivational Widget */}
            <div className="sd-card sd-card-motivate sd-anim-1">
              <div className="sd-motivate-icon">
                <ITrophy />
              </div>
              <p className="sd-motivate-main">
                Còn <strong>5 bài</strong> nữa là đạt mục tiêu tháng! 🎯
              </p>
              <div className="sd-motivate-track">
                <div className="sd-motivate-fill" style={{ width: '90%' }} />
                <span className="sd-motivate-pct">90%</span>
              </div>
              <p className="sd-motivate-sub">
                Mục tiêu: 50 bài tập · Đã hoàn thành: {mockStudent.completedAssignments}
              </p>
            </div>

            {/* Recent Grades */}
            <div className="sd-card sd-anim-2">
              <div className="sd-card-header">
                <h2 className="sd-card-title">
                  <IStar /> Điểm số gần đây
                </h2>
                <Link to="/student/grades" className="sd-link" aria-label="Xem tất cả điểm số">
                  Xem tất cả <IChevron />
                </Link>
              </div>
              <div className="sd-grades-list">
                {RECENT_GRADES.map((g) => {
                  let gc = '#f87171';
                  if (g.score >= 8.5) gc = '#34d399';
                  else if (g.score >= 7) gc = '#fbbf24';
                  return (
                    <div key={g.id} className="sd-grade-row">
                      <div className="sd-grade-info">
                        <p className="sd-grade-title">{g.title}</p>
                        <p className="sd-grade-date">
                          {g.subject} · {g.date}
                        </p>
                      </div>
                      <div
                        className="sd-grade-badge"
                        style={{ background: `${gc}20`, color: gc }}
                        aria-label={`Điểm: ${g.score}`}
                      >
                        {g.score.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Study Streak */}
            <div className="sd-card sd-anim-3">
              <div className="sd-card-header">
                <h2 className="sd-card-title">
                  <span style={{ color: '#f97316' }}>
                    <IFire />
                  </span>{' '}
                  Chuỗi học tập
                </h2>
                <span className="sd-streak-count" aria-label="7 ngày liên tiếp">
                  🔥 <strong>7</strong> ngày
                </span>
              </div>
              <ul
                className="sd-streak-days"
                aria-label="Lịch học tuần này"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {STREAK.map((day, i) => (
                  <li
                    key={day}
                    className={`sd-streak-day${STREAK_ON[i] ? ' sd-streak-active' : ''}`}
                    aria-label={`${day}: ${STREAK_ON[i] ? 'đã học' : 'chưa học'}`}
                  >
                    <div className="sd-streak-dot" />
                    <span className="sd-streak-lbl">{day}</span>
                  </li>
                ))}
              </ul>
              <p className="sd-streak-msg">Tuyệt vời! Hãy duy trì chuỗi ngày học của bạn 💪</p>
            </div>
          </div>
        </div>

        {/* ── Weekly Activity Chart ── */}
        <div className="sd-card sd-anim-2">
          <div className="sd-card-header">
            <h2 className="sd-card-title">📊 Hoạt động học tập tuần này</h2>
            <span className="sd-week-range">01/04 – 07/04/2026</span>
          </div>
          <WeeklyChart />
        </div>

        {/* ── Quick Actions ── */}
        <div className="sd-card sd-anim-3">
          <div className="sd-card-header">
            <h2 className="sd-card-title">⚡ Truy cập nhanh</h2>
          </div>
          <ul className="sd-quick-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {QUICK_ACTIONS.map((qa) => (
              <li key={qa.label}>
                <button
                  className="sd-qa-btn sd-qa-btn-full"
                  style={{ '--qa-color': qa.color } as React.CSSProperties}
                  onClick={() => navigate(qa.path)}
                  aria-label={qa.label}
                >
                  <span className="sd-qa-icon" style={{ color: qa.color }}>
                    {qa.icon}
                  </span>
                  <span className="sd-qa-label">{qa.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Roadmap List ── */}
        <div className="sd-card sd-anim-4">
          <div className="sd-card-header">
            <h2 className="sd-card-title">
              <IMap /> Lộ trình học tập
            </h2>
            <Link to="/roadmaps" className="sd-link" aria-label="Xem tất cả lộ trình">
              Xem tất cả <IChevron />
            </Link>
          </div>

          {roadmapsQuery.isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="sd-roadmap-skel">
                  <Skel w="60%" h="13px" />
                  <Skel w="35%" h="11px" />
                </div>
              ))}
            </div>
          )}
          {roadmapsQuery.error && <p className="sd-empty-msg">Không thể tải danh sách lộ trình.</p>}
          {!roadmapsQuery.isLoading && !roadmapsQuery.error && (
            <div className="sd-roadmap-list">
              {roadmapList.slice(0, 5).map((rm) => (
                <Link
                  key={rm.id}
                  to={`/roadmaps/${rm.id}`}
                  className="sd-roadmap-item"
                  aria-label={rm.name}
                >
                  <div>
                    <strong className="sd-rm-name">{rm.name}</strong>
                    <span className="sd-rm-sub">{rm.subject}</span>
                  </div>
                  <span className="sd-rm-topics">{rm.totalTopicsCount} chủ đề</span>
                </Link>
              ))}
              {roadmapList.length === 0 && <p className="sd-empty-msg">Chưa có lộ trình nào.</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
