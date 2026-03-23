import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Lock,
  Play,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockCourses, mockStudent } from '../../data/mockData';
import './StudentCourses.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const FIXED_TIMESTAMP = 1738713600000;
const WEEKLY_STUDY_DATA = [2.5, 3.5, 1.5, 4, 3, 5.5, 2];

// Course visual themes — gradient + symbol for thumbnail art
const COURSE_THEMES = [
  {
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #A855F7 100%)',
    symbol: '∑',
    symbolSub: 'ALGEBRA',
    accentColor: '#818CF8',
    orb1: 'rgba(99,102,241,0.35)',
    orb2: 'rgba(168,85,247,0.25)',
  },
  {
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 55%, #06B6D4 100%)',
    symbol: '△',
    symbolSub: 'GEOMETRY',
    accentColor: '#38BDF8',
    orb1: 'rgba(14,165,233,0.35)',
    orb2: 'rgba(6,182,212,0.25)',
  },
  {
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #EF4444 100%)',
    symbol: '∫',
    symbolSub: 'CALCULUS',
    accentColor: '#FB923C',
    orb1: 'rgba(245,158,11,0.40)',
    orb2: 'rgba(239,68,68,0.25)',
  },
];

// ─── Utility Components ────────────────────────────────────────────────────────

/** SVG Sparkline */
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const W = 80,
    H = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 4 - ((v - min) / range) * (H - 8),
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const last = pts.at(-1)!;
  const areaPath =
    `M${pts[0].x},${H} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${last.x},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="3" fill={color} />
    </svg>
  );
};

/** Animated progress bar — animates from 0→value on mount */
const AnimatedProgressBar: React.FC<{ value: number; color?: string }> = ({
  value,
  color = 'var(--sc-indigo)',
}) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="sc-prog-track">
      <div
        className="sc-prog-fill"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, #3B82F6)` }}
      />
    </div>
  );
};

/** Abstract SVG math watermark for hero */
const MathWatermark: React.FC = () => (
  <svg
    className="sc-hero-watermark"
    viewBox="0 0 600 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Fibonacci-inspired arcs */}
    <circle cx="480" cy="60" r="80" stroke="rgba(79,70,229,0.08)" strokeWidth="1.5" fill="none" />
    <circle cx="480" cy="60" r="50" stroke="rgba(79,70,229,0.06)" strokeWidth="1.5" fill="none" />
    <circle cx="410" cy="130" r="30" stroke="rgba(59,130,246,0.07)" strokeWidth="1.5" fill="none" />
    <circle cx="440" cy="100" r="18" stroke="rgba(59,130,246,0.05)" strokeWidth="1.5" fill="none" />
    {/* Grid dots */}
    {Array.from({ length: 8 }, (_, col) =>
      Array.from({ length: 4 }, (__, row) => (
        <circle
          key={`dot-${col}-${row}`}
          cx={col * 70 + 20}
          cy={row * 70 + 20}
          r="1.5"
          fill="rgba(99,102,241,0.12)"
        />
      ))
    )}
    {/* Sine wave */}
    <path
      d="M0,200 Q60,160 120,200 Q180,240 240,200 Q300,160 360,200 Q420,240 480,200 Q540,160 600,200"
      stroke="rgba(99,102,241,0.07)"
      strokeWidth="2"
      fill="none"
    />
    {/* Integration symbol */}
    <text x="520" y="200" fontSize="120" fill="rgba(79,70,229,0.05)" fontFamily="serif">
      ∫
    </text>
  </svg>
);

/** Course thumbnail — gradient art + math symbol */
const CourseThumbnail: React.FC<{ themeIndex: number; name: string }> = ({ themeIndex, name }) => {
  const theme = COURSE_THEMES[themeIndex % COURSE_THEMES.length];
  return (
    <div className="sc-thumb" style={{ background: theme.gradient }} aria-label={name}>
      {/* Decorative orbs */}
      <div className="sc-thumb-orb sc-thumb-orb-1" style={{ background: theme.orb1 }} />
      <div className="sc-thumb-orb sc-thumb-orb-2" style={{ background: theme.orb2 }} />
      {/* Math symbol */}
      <div className="sc-thumb-symbol">
        <span className="sc-thumb-glyph">{theme.symbol}</span>
        <span className="sc-thumb-sub">{theme.symbolSub}</span>
      </div>
      {/* Grid overlay */}
      <svg className="sc-thumb-grid" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`vline-x${i * 54}`}
            x1={i * 54}
            y1="0"
            x2={i * 54}
            y2="180"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={`hline-y${i * 45}`}
            x1="0"
            y1={i * 45}
            x2="320"
            y2={i * 45}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};

// ─── KPI Stat Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  delta?: string;
  deltaUp?: boolean;
  sparkline?: boolean;
  index: number;
}
const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBg,
  value,
  label,
  delta,
  deltaUp,
  sparkline,
  index,
}) => (
  <motion.div
    className="sc-stat-card"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, boxShadow: '0 16px 40px -8px rgba(79,70,229,0.18)' }}
  >
    <div className="sc-stat-top">
      <div className="sc-stat-icon-wrap" style={{ background: iconBg }}>
        {icon}
      </div>
      {sparkline && (
        <div className="sc-stat-spark">
          <Sparkline data={WEEKLY_STUDY_DATA} color="#4F46E5" />
        </div>
      )}
    </div>
    <div className="sc-stat-value">{value}</div>
    <div className="sc-stat-label">{label}</div>
    {delta && (
      <div className={`sc-stat-delta ${deltaUp ? 'sc-delta-up' : 'sc-delta-dn'}`}>
        {deltaUp ? '↑' : '↓'} {delta}
      </div>
    )}
  </motion.div>
);

// ─── Course Card ───────────────────────────────────────────────────────────────
interface EnrolledCourse {
  id: string;
  name: string;
  teacher: string;
  rating: number;
  lessonsCount: number;
  studentsEnrolled: number;
  description: string;
  progress: number;
  lastAccessed: string;
}
const CourseCard: React.FC<{
  course: EnrolledCourse;
  index: number;
  onSelect: (id: string) => void;
}> = ({ course, index, onSelect }) => (
  <motion.div
    className="sc-course-card"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 + index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -5 }}
    onClick={() => onSelect(course.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(course.id)}
  >
    {/* Thumbnail */}
    <div className="sc-card-thumb-wrap">
      <CourseThumbnail themeIndex={index} name={course.name} />
      {/* Hover CTA */}
      <div className="sc-card-hover-cta">
        <motion.button
          className="sc-cta-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(course.id);
          }}
        >
          <Play size={14} strokeWidth={2.5} />
          Tiếp tục học
        </motion.button>
      </div>
      {/* Progress badge on thumb */}
      <div className="sc-prog-badge">{course.progress}%</div>
    </div>

    {/* Body */}
    <div className="sc-card-body">
      <h3 className="sc-card-title">{course.name}</h3>
      <p className="sc-card-teacher">
        <span className="sc-teacher-dot" />
        {course.teacher}
      </p>

      {/* Badges row */}
      <div className="sc-card-badges">
        <span className="sc-badge sc-badge-lessons">
          <BookOpen size={11} strokeWidth={2.5} />
          {course.lessonsCount} bài học
        </span>
        <span className="sc-badge sc-badge-rating">
          <Star size={11} strokeWidth={2.5} fill="currentColor" />
          {course.rating.toFixed(1)}
        </span>
      </div>

      {/* Progress */}
      <div className="sc-card-prog-section">
        <div className="sc-card-prog-header">
          <span className="sc-prog-label">Tiến độ</span>
          <span className="sc-prog-pct">{course.progress}%</span>
        </div>
        <AnimatedProgressBar value={course.progress} />
      </div>

      {/* Footer */}
      <div className="sc-card-footer">
        <span className="sc-last-accessed">
          {new Date(course.lastAccessed).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
        <span className="sc-continue-hint">
          Xem chi tiết <ChevronRight size={12} strokeWidth={2.5} />
        </span>
      </div>
    </div>
  </motion.div>
);

// ─── Detail View ───────────────────────────────────────────────────────────────
const DetailView: React.FC<{
  course: EnrolledCourse;
  courseIndex: number;
  onBack: () => void;
}> = ({ course, courseIndex, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Nội dung', 'Bài tập', 'Điểm số', 'Thảo luận'];
  const tabIcons = [BookOpen, Award, TrendingUp, Users];

  return (
    <motion.div
      className="sc-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Back */}
      <button className="sc-back-btn" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Quay lại danh sách
      </button>

      {/* Detail header */}
      <div className="sc-detail-header">
        <div className="sc-detail-thumb-wrap">
          <CourseThumbnail themeIndex={courseIndex} name={course.name} />
        </div>
        <div className="sc-detail-info">
          <h2 className="sc-detail-title">{course.name}</h2>
          <p className="sc-detail-teacher">
            <Users size={14} /> Giảng viên: <strong>{course.teacher}</strong>
          </p>
          <p className="sc-detail-desc">{course.description}</p>
          <div className="sc-detail-badges">
            <span className="sc-badge sc-badge-rating">
              <Star size={12} fill="currentColor" /> {course.rating.toFixed(1)}
            </span>
            <span className="sc-badge sc-badge-lessons">
              <BookOpen size={12} /> {course.lessonsCount} bài học
            </span>
            <span className="sc-badge sc-badge-students">
              <Users size={12} /> {course.studentsEnrolled} học viên
            </span>
          </div>
          <div className="sc-detail-prog-wrap">
            <div className="sc-detail-prog-header">
              <span>Tiến độ của bạn</span>
              <strong>{course.progress}%</strong>
            </div>
            <AnimatedProgressBar value={course.progress} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sc-tabs">
        {tabs.map((t, i) => {
          const Icon = tabIcons[i];
          return (
            <button
              key={t}
              className={`sc-tab-btn ${activeTab === i ? 'sc-tab-active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <Icon size={14} strokeWidth={2} />
              {t}
            </button>
          );
        })}
      </div>

      {/* Lesson list (tab 0) */}
      {activeTab === 0 && (
        <div className="sc-lessons">
          <div className="sc-chapter">
            <div className="sc-chapter-header">
              <h4 className="sc-chapter-title">Chương 1: Căn bản</h4>
              <span className="sc-chapter-badge">3/5 bài học</span>
            </div>
            {[
              { status: 'done', title: 'Bài 1: Giới thiệu về phương trình', dur: '15 phút' },
              { status: 'done', title: 'Bài 2: Phương trình bậc nhất', dur: '20 phút' },
              { status: 'current', title: 'Bài 3: Giải phương trình bậc nhất', dur: '25 phút' },
              { status: 'locked', title: 'Bài 4: Bài tập thực hành', dur: '30 phút' },
              { status: 'locked', title: 'Bài 5: Kiểm tra chương 1', dur: '45 phút' },
            ].map((l) => (
              <div key={l.title} className={`sc-lesson-row sc-lesson-${l.status}`}>
                <div className="sc-lesson-icon">
                  {l.status === 'done' && <CheckCircle size={18} strokeWidth={2} />}
                  {l.status === 'current' && <Play size={18} strokeWidth={2} />}
                  {l.status === 'locked' && <Lock size={18} strokeWidth={2} />}
                </div>
                <div className="sc-lesson-info">
                  <span className="sc-lesson-title">{l.title}</span>
                  <span className="sc-lesson-dur">⏱ {l.dur} • Video</span>
                </div>
                <button
                  className={`sc-lesson-btn ${l.status === 'current' ? 'sc-lesson-btn-primary' : ''}`}
                  disabled={l.status === 'locked'}
                >
                  {l.status === 'done' && 'Xem lại'}
                  {l.status === 'current' && 'Tiếp tục'}
                  {l.status === 'locked' && 'Chưa mở'}
                </button>
              </div>
            ))}
          </div>

          <div className="sc-chapter">
            <div className="sc-chapter-header">
              <h4 className="sc-chapter-title">Chương 2: Nâng cao</h4>
              <span className="sc-chapter-badge">0/4 bài học</span>
            </div>
            <div className="sc-lesson-row sc-lesson-locked">
              <div className="sc-lesson-icon">
                <Lock size={18} strokeWidth={2} />
              </div>
              <div className="sc-lesson-info">
                <span className="sc-lesson-title">Bài 6: Phương trình bậc hai</span>
                <span className="sc-lesson-dur">⏱ 30 phút • Video</span>
              </div>
              <button className="sc-lesson-btn" disabled>
                Chưa mở
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 0 && (
        <div className="sc-tab-placeholder">
          <Award size={40} strokeWidth={1.5} />
          <p>Tính năng đang được phát triển</p>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StudentCourses: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const enrolledCourses = useMemo(
    () =>
      mockCourses.map((course, index) => {
        const seed = index * 13 + 27;
        return {
          ...course,
          progress: 10 + (seed % 90),
          lastAccessed: new Date(FIXED_TIMESTAMP - (seed % 7) * 24 * 60 * 60 * 1000).toISOString(),
        };
      }),
    []
  );

  const filteredCourses = useMemo(
    () => enrolledCourses.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [enrolledCourses, searchQuery]
  );

  const avgProgress = Math.round(
    enrolledCourses.reduce((s, c) => s + c.progress, 0) / (enrolledCourses.length || 1)
  );

  const activeIndex = selectedCourse
    ? enrolledCourses.findIndex((c) => c.id === selectedCourse)
    : -1;
  const activeCourse = activeIndex >= 0 ? enrolledCourses[activeIndex] : null;

  // Get greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="sc-page">
        <AnimatePresence mode="wait">
          {selectedCourse ? (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeCourse && (
                <DetailView
                  course={activeCourse}
                  courseIndex={activeIndex}
                  onBack={() => setSelectedCourse(null)}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Hero ─────────────────────────────────────────── */}
              <div className="sc-hero">
                <MathWatermark />
                <div className="sc-hero-glass">
                  <div className="sc-hero-left">
                    <p className="sc-greeting-time">{getGreeting()},</p>
                    <h1 className="sc-greeting-name">
                      {mockStudent.name.split(' ').pop()}
                      <span className="sc-greeting-wave" aria-hidden="true">
                        👋
                      </span>
                    </h1>
                    <p className="sc-greeting-sub">
                      Sẵn sàng chinh phục <span className="sc-highlight">Giải tích</span> hôm nay?
                    </p>
                  </div>
                  <div className="sc-hero-right">
                    <div className="sc-searchbar">
                      <Search className="sc-search-icon" size={16} strokeWidth={2} />
                      <input
                        className="sc-search-input"
                        type="text"
                        placeholder="Tìm kiếm giáo trình..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Tìm kiếm giáo trình"
                      />
                      <kbd className="sc-kbd">⌘K</kbd>
                    </div>
                    <motion.button
                      className="sc-explore-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Khám phá thêm
                      <ChevronRight size={15} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ── KPI Row ──────────────────────────────────────── */}
              <div className="sc-kpi-row">
                <StatCard
                  index={0}
                  icon={<BookOpen size={20} strokeWidth={2} style={{ color: '#4F46E5' }} />}
                  iconBg="rgba(79,70,229,0.12)"
                  value={`${enrolledCourses.length}`}
                  label="Giáo trình đang học"
                  delta="1 mới tháng này"
                  deltaUp
                />
                <StatCard
                  index={1}
                  icon={<TrendingUp size={20} strokeWidth={2} style={{ color: '#10B981' }} />}
                  iconBg="rgba(16,185,129,0.12)"
                  value={`${avgProgress}%`}
                  label="Tiến độ trung bình"
                  delta="8% so với tuần trước"
                  deltaUp
                />
                <StatCard
                  index={2}
                  icon={<Award size={20} strokeWidth={2} style={{ color: '#F59E0B' }} />}
                  iconBg="rgba(245,158,11,0.12)"
                  value="12"
                  label="Bài học hoàn thành"
                  delta="3 bài tuần này"
                  deltaUp
                />
                <StatCard
                  index={3}
                  icon={<Clock size={20} strokeWidth={2} style={{ color: '#3B82F6' }} />}
                  iconBg="rgba(59,130,246,0.12)"
                  value="18.5h"
                  label="Tổng thời gian học"
                  sparkline
                />
              </div>

              {/* ── Section Header ───────────────────────────────── */}
              <motion.div
                className="sc-section-header"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
              >
                <div>
                  <h2 className="sc-section-title">Giáo trình của tôi</h2>
                  <p className="sc-section-sub">
                    {filteredCourses.length} giáo trình{' '}
                    {searchQuery ? `khớp với "${searchQuery}"` : 'đã đăng ký'}
                  </p>
                </div>
              </motion.div>

              {/* ── Course Grid ──────────────────────────────────── */}
              <div className="sc-course-grid">
                {filteredCourses.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={i}
                    onSelect={setSelectedCourse}
                  />
                ))}
                {filteredCourses.length === 0 && (
                  <div className="sc-empty">
                    <Search size={40} strokeWidth={1.5} />
                    <p>Không tìm thấy giáo trình</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
