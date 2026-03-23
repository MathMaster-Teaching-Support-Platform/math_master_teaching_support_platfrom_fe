import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  Play,
  Eye,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Flame,
  Trophy,
  Command,
  X,
  Target,
  ChevronDown,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './StudentAssignments.css';

// ─── Types ───────────────────────────────────────────────────────────────────
type AssignmentStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
type SubjectFilter = 'Tất cả' | 'Đại số' | 'Hình học' | 'Giải tích';
type DifficultyFilter = 'Tất cả' | 'Dễ' | 'Trung bình' | 'Khó';

interface EnhancedAssignment {
  id: string;
  title: string;
  subject: 'Đại số' | 'Hình học' | 'Giải tích';
  topic: string;
  courseName: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  estimatedMinutes: number;
  progress: number;
  dueDate: string;
  status: AssignmentStatus;
  type: 'homework' | 'quiz' | 'exam';
  totalQuestions: number;
  score: number | null;
}

// ─── Rich Mock Dataset ────────────────────────────────────────────────────────
const ASSIGNMENTS: EnhancedAssignment[] = [
  // --- TODAY ---
  {
    id: 'a1',
    title: 'Phương trình và hệ phương trình bậc hai',
    subject: 'Đại số',
    topic: 'Phương trình bậc 2',
    courseName: 'Đại số 11',
    difficulty: 'Trung bình',
    estimatedMinutes: 45,
    progress: 60,
    dueDate: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
    status: 'in-progress',
    type: 'homework',
    totalQuestions: 15,
    score: null,
  },
  {
    id: 'a2',
    title: 'Kiểm tra nhanh: Định lý Vieta',
    subject: 'Đại số',
    topic: 'Định lý Vieta',
    courseName: 'Đại số 11',
    difficulty: 'Dễ',
    estimatedMinutes: 15,
    progress: 0,
    dueDate: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    status: 'pending',
    type: 'quiz',
    totalQuestions: 10,
    score: null,
  },
  {
    id: 'a3',
    title: 'Bài tập hình học không gian — Quan hệ song song',
    subject: 'Hình học',
    topic: 'Đường thẳng song song',
    courseName: 'Hình học 11',
    difficulty: 'Khó',
    estimatedMinutes: 60,
    progress: 0,
    dueDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'overdue',
    type: 'homework',
    totalQuestions: 8,
    score: null,
  },
  // --- THIS WEEK ---
  {
    id: 'a4',
    title: 'Đạo hàm của hàm hợp — Quy tắc dây chuyền',
    subject: 'Giải tích',
    topic: 'Quy tắc dây chuyền',
    courseName: 'Giải tích 12',
    difficulty: 'Khó',
    estimatedMinutes: 90,
    progress: 25,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-progress',
    type: 'homework',
    totalQuestions: 20,
    score: null,
  },
  {
    id: 'a5',
    title: 'Tích phân bất định và ứng dụng diện tích',
    subject: 'Giải tích',
    topic: 'Tích phân bất định',
    courseName: 'Giải tích 12',
    difficulty: 'Khó',
    estimatedMinutes: 75,
    progress: 0,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'homework',
    totalQuestions: 12,
    score: null,
  },
  {
    id: 'a6',
    title: 'Hình học giải tích phẳng — Phương trình đường tròn',
    subject: 'Hình học',
    topic: 'Phương trình đường tròn',
    courseName: 'Hình học 11',
    difficulty: 'Trung bình',
    estimatedMinutes: 45,
    progress: 0,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'homework',
    totalQuestions: 10,
    score: null,
  },
  // --- COMPLETED ---
  {
    id: 'a7',
    title: 'Xác suất và thống kê cơ bản',
    subject: 'Đại số',
    topic: 'Xác suất cổ điển',
    courseName: 'Đại số 11',
    difficulty: 'Trung bình',
    estimatedMinutes: 30,
    progress: 100,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    type: 'homework',
    totalQuestions: 12,
    score: 88,
  },
  {
    id: 'a8',
    title: 'Giới hạn và liên tục của hàm số',
    subject: 'Giải tích',
    topic: 'Giới hạn hàm số',
    courseName: 'Giải tích 12',
    difficulty: 'Khó',
    estimatedMinutes: 60,
    progress: 100,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    type: 'homework',
    totalQuestions: 15,
    score: 95,
  },
  {
    id: 'a9',
    title: 'Hàm số mũ, logarit và phép biến đổi',
    subject: 'Giải tích',
    topic: 'Phép biến đổi lũy thừa',
    courseName: 'Giải tích 12',
    difficulty: 'Trung bình',
    estimatedMinutes: 40,
    progress: 100,
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    type: 'homework',
    totalQuestions: 10,
    score: 76,
  },
];

// ─── Design Tokens ────────────────────────────────────────────────────────────
const SUBJECT_STYLE: Record<string, { bg: string; color: string; accent: string }> = {
  'Đại số': { bg: 'rgba(79,70,229,0.09)', color: '#4F46E5', accent: '#4F46E5' },
  'Hình học': { bg: 'rgba(124,58,237,0.09)', color: '#7C3AED', accent: '#7C3AED' },
  'Giải tích': { bg: 'rgba(14,165,233,0.09)', color: '#0EA5E9', accent: '#0EA5E9' },
};

const STATUS_CFG: Record<AssignmentStatus, { color: string; bg: string; label: string }> = {
  pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.09)', label: 'Chưa làm' },
  'in-progress': { color: '#3B82F6', bg: 'rgba(59,130,246,0.09)', label: 'Đang làm' },
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.09)', label: 'Đã xong' },
  overdue: { color: '#E11D48', bg: 'rgba(225,29,72,0.09)', label: 'Quá hạn' },
};

const DIFF_CFG: Record<string, { color: string; bg: string }> = {
  Dễ: { color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  'Trung bình': { color: '#B45309', bg: 'rgba(180,83,9,0.08)' },
  Khó: { color: '#E11D48', bg: 'rgba(225,29,72,0.08)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDeadlineInfo(dueDateStr: string) {
  const now = Date.now();
  const due = new Date(dueDateStr).getTime();
  const diffMs = due - now;
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0) {
    const absH = Math.abs(diffH);
    if (absH < 24) return { text: `Quá ${Math.round(absH)}h`, isOverdue: true, isUrgent: false };
    return { text: `Quá ${Math.ceil(Math.abs(diffD))} ngày`, isOverdue: true, isUrgent: false };
  }
  if (diffH < 24) {
    const h = Math.floor(diffH);
    const m = Math.round((diffH - h) * 60);
    return { text: `${h}h ${m}m còn lại`, isOverdue: false, isUrgent: true };
  }
  if (diffD < 7)
    return { text: `${Math.ceil(diffD)} ngày còn lại`, isOverdue: false, isUrgent: false };
  return {
    text: new Date(dueDateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    isOverdue: false,
    isUrgent: false,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'buổi sáng';
  if (h < 18) return 'buổi chiều';
  return 'buổi tối';
}

function groupByTimeline(list: EnhancedAssignment[]) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    today: list.filter((a) => {
      const due = new Date(a.dueDate);
      return a.status !== 'completed' && due <= todayEnd;
    }),
    thisWeek: list.filter((a) => {
      const due = new Date(a.dueDate);
      return a.status !== 'completed' && due > todayEnd && due <= weekEnd;
    }),
    completed: list.filter((a) => a.status === 'completed'),
  };
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number }> = ({
  pct,
  size = 100,
  stroke = 7,
}) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className="sa-ring-svg"
      aria-label={`Hoàn thành ${pct}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#fff"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
      />
    </svg>
  );
};

// ─── Task Item ────────────────────────────────────────────────────────────────
const TaskItem: React.FC<{ assignment: EnhancedAssignment }> = ({ assignment }) => {
  const dl = getDeadlineInfo(assignment.dueDate);
  const subj = SUBJECT_STYLE[assignment.subject] ?? SUBJECT_STYLE['Đại số'];
  const st = STATUS_CFG[assignment.status];
  const diff = DIFF_CFG[assignment.difficulty] ?? DIFF_CFG['Trung bình'];

  const typeLabel: Record<string, string> = {
    homework: 'Bài tập',
    quiz: 'Kiểm tra nhanh',
    exam: 'Bài thi',
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className={`sa-task sa-task--${assignment.status}`}
      tabIndex={0}
      aria-label={`${assignment.title} — ${st.label}`}
    >
      {/* Left accent bar */}
      <div className="sa-task-bar" style={{ backgroundColor: st.color }} aria-hidden="true" />

      {/* Body */}
      <div className="sa-task-body">
        {/* Row 1: chips + right actions */}
        <div className="sa-task-row1">
          <div className="sa-task-chips">
            <span className="sa-chip sa-chip--subject" style={{ background: subj.bg, color: subj.color }}>
              {assignment.subject}
            </span>
            <span className="sa-chip sa-chip--diff" style={{ background: diff.bg, color: diff.color }}>
              {assignment.difficulty}
            </span>
            <span className="sa-chip sa-chip--type">{typeLabel[assignment.type]}</span>
          </div>

          <div className="sa-task-right">
            {/* Deadline */}
            {assignment.status !== 'completed' && (
              <span
                className={`sa-deadline${dl.isUrgent ? ' sa-deadline--urgent' : ''}${dl.isOverdue ? ' sa-deadline--overdue' : ''}`}
                aria-label={`Hạn: ${dl.text}`}
              >
                <Calendar size={10} aria-hidden="true" />
                {dl.text}
              </span>
            )}

            {/* Score (completed) */}
            {assignment.status === 'completed' && assignment.score !== null && (() => {
              const s = assignment.score ?? 0;
              let scoreCls = 'sa-score--low';
              if (s >= 80) scoreCls = 'sa-score--high';
              else if (s >= 60) scoreCls = 'sa-score--mid';
              return (
                <span className={`sa-score ${scoreCls}`}>
                  <Trophy size={10} aria-hidden="true" />
                  {s}/100
                </span>
              );
            })()}

            {/* Quick actions — revealed on hover */}
            <div className="sa-quick-actions" aria-label="Thao tác nhanh">
              {assignment.status === 'in-progress' && (
                <button className="sa-qa sa-qa--primary" aria-label="Tiếp tục làm bài">
                  <Play size={11} aria-hidden="true" />
                  Tiếp tục
                </button>
              )}
              {assignment.status === 'pending' && (
                <>
                  <button className="sa-qa sa-qa--primary" aria-label="Bắt đầu làm bài">
                    <ArrowRight size={11} aria-hidden="true" />
                    Làm bài
                  </button>
                  <button className="sa-qa sa-qa--ghost" aria-label="Xem đề bài">
                    <Eye size={11} aria-hidden="true" />
                    Xem đề
                  </button>
                </>
              )}
              {assignment.status === 'overdue' && (
                <>
                  <button className="sa-qa sa-qa--danger" aria-label="Nộp bài muộn">
                    <Send size={11} aria-hidden="true" />
                    Nộp muộn
                  </button>
                  <button className="sa-qa sa-qa--ghost" aria-label="Xem đề bài">
                    <Eye size={11} aria-hidden="true" />
                    Xem đề
                  </button>
                </>
              )}
              {assignment.status === 'completed' && (
                <>
                  <button className="sa-qa sa-qa--ghost" aria-label="Xem kết quả">
                    <BarChart2 size={11} aria-hidden="true" />
                    Kết quả
                  </button>
                  <button className="sa-qa sa-qa--ghost" aria-label="Xem chi tiết">
                    <Eye size={11} aria-hidden="true" />
                    Chi tiết
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Title */}
        <h3 className="sa-task-title">{assignment.title}</h3>

        {/* Row 3: Meta */}
        <div className="sa-task-meta">
          <span className="sa-meta-subject" style={{ color: subj.color }}>
            <BookOpen size={11} aria-hidden="true" />
            {assignment.topic}
          </span>
          <span className="sa-meta-dot" aria-hidden="true">·</span>
          <span className="sa-meta-course">{assignment.courseName}</span>
          <span className="sa-meta-dot" aria-hidden="true">·</span>
          <span className="sa-meta-time">
            <Clock size={11} aria-hidden="true" />~{assignment.estimatedMinutes} phút
          </span>
          <span className="sa-meta-dot" aria-hidden="true">·</span>
          <span className="sa-meta-q">
            <Target size={11} aria-hidden="true" />
            {assignment.totalQuestions} câu
          </span>
        </div>
      </div>

      {/* Micro progress bar — in-progress only */}
      {assignment.status === 'in-progress' && (
        <div
          className="sa-task-prog"
          aria-label={`Tiến độ: ${assignment.progress}%`}
        >
          <motion.div
            className="sa-task-prog-fill"
            initial={{ width: 0 }}
            animate={{ width: `${assignment.progress}%` }}
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
            style={{ backgroundColor: STATUS_CFG['in-progress'].color }}
          />
        </div>
      )}
    </motion.article>
  );
};

// ─── Task Group (Accordion) ───────────────────────────────────────────────────
const TaskGroup: React.FC<{
  title: string;
  items: EnhancedAssignment[];
  defaultOpen?: boolean;
  icon: React.ReactNode;
  accentColor: string;
}> = ({ title, items, defaultOpen = true, icon, accentColor }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <motion.section layout className="sa-group" aria-label={`Nhóm: ${title}`}>
      <button
        className="sa-group-hd"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`grp-${title}`}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="sa-group-chevron"
          aria-hidden="true"
        >
          <ChevronRight size={14} />
        </motion.span>
        <span className="sa-group-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="sa-group-title">{title}</span>
        <span
          className="sa-group-count"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {items.length}
        </span>
        <span className="sa-group-rule" aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`grp-${title}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="sa-group-items">
              <AnimatePresence>
                {items.map((a) => (
                  <TaskItem key={a.id} assignment={a} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

// ─── Status Tab Bar ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chưa làm' },
  { id: 'in-progress', label: 'Đang làm' },
  { id: 'completed', label: 'Đã xong' },
  { id: 'overdue', label: 'Quá hạn' },
] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────
const StudentAssignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('Tất cả');
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>('Tất cả');

  const stats = useMemo(() => {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return {
      total: ASSIGNMENTS.length,
      pending: ASSIGNMENTS.filter((a) => a.status === 'pending').length,
      inProgress: ASSIGNMENTS.filter((a) => a.status === 'in-progress').length,
      completed: ASSIGNMENTS.filter((a) => a.status === 'completed').length,
      overdue: ASSIGNMENTS.filter((a) => a.status === 'overdue').length,
      completionPct: Math.round(
        (ASSIGNMENTS.filter((a) => a.status === 'completed').length / ASSIGNMENTS.length) * 100,
      ),
      todayDue: ASSIGNMENTS.filter(
        (a) => a.status !== 'completed' && new Date(a.dueDate) <= todayEnd,
      ).length,
    };
  }, []);

  const tabCounts: Record<string, number> = {
    all: stats.total,
    pending: stats.pending,
    'in-progress': stats.inProgress,
    completed: stats.completed,
    overdue: stats.overdue,
  };

  const filtered = useMemo(() => {
    return ASSIGNMENTS.filter((a) => {
      if (activeTab !== 'all' && a.status !== activeTab) return false;
      if (subjectFilter !== 'Tất cả' && a.subject !== subjectFilter) return false;
      if (diffFilter !== 'Tất cả' && a.difficulty !== diffFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.subject.toLowerCase().includes(q) &&
          !a.topic.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [activeTab, subjectFilter, diffFilter, search]);

  const groups = useMemo(() => groupByTimeline(filtered), [filtered]);
  const isEmpty = groups.today.length + groups.thisWeek.length + groups.completed.length === 0;

  const clearFilters = () => {
    setSearch('');
    setActiveTab('all');
    setSubjectFilter('Tất cả');
    setDiffFilter('Tất cả');
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="sa-page">
        {/* ── Control Hub ── */}
        <header className="sa-hub" aria-label="Trung tâm điều khiển bài tập">
          {/* Top: Greeting + Progress Ring */}
          <div className="sa-hub-top">
            <div className="sa-greeting">
              <span className="sa-wave" aria-hidden="true">
                👋
              </span>
              <div>
                <p className="sa-greet-main">
                  Chào {getGreeting()},{' '}
                  <strong>{mockStudent.name.split(' ').pop()}</strong>.
                </p>
                <p className="sa-greet-sub">
                  Bạn có{' '}
                  <strong style={{ color: '#FDE68A' }}>{stats.todayDue}</strong> bài tập cần
                  hoàn thành hôm nay.
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="sa-stats" aria-label="Thống kê bài tập">
              <div className="sa-stat">
                <span className="sa-stat-n">{stats.total}</span>
                <span className="sa-stat-l">Tổng cộng</span>
              </div>
              <span className="sa-stat-sep" aria-hidden="true" />
              <div className="sa-stat">
                <span className="sa-stat-n" style={{ color: '#FDE68A' }}>
                  {stats.pending + stats.inProgress}
                </span>
                <span className="sa-stat-l">Chưa xong</span>
              </div>
              <span className="sa-stat-sep" aria-hidden="true" />
              <div className="sa-stat">
                <span className="sa-stat-n" style={{ color: '#FCA5A5' }}>
                  {stats.overdue}
                </span>
                <span className="sa-stat-l">Quá hạn</span>
              </div>
              <span className="sa-stat-sep" aria-hidden="true" />
              <div className="sa-stat">
                <span className="sa-stat-n" style={{ color: '#6EE7B7' }}>
                  {stats.completionPct}%
                </span>
                <span className="sa-stat-l">Hoàn thành</span>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="sa-ring-wrap" aria-label={`Tỷ lệ hoàn thành: ${stats.completionPct}%`}>
              <ProgressRing pct={stats.completionPct} size={100} stroke={7} />
              <div className="sa-ring-center" aria-hidden="true">
                <motion.span
                  className="sa-ring-pct"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {stats.completionPct}%
                </motion.span>
                <span className="sa-ring-lbl">xong</span>
              </div>
              <div className="sa-ring-info">
                <span className="sa-ring-detail">
                  <CheckCircle2 size={12} style={{ color: '#6EE7B7' }} aria-hidden="true" />
                  {stats.completed}/{stats.total}
                </span>
                {stats.overdue > 0 && (
                  <span className="sa-ring-detail sa-ring-detail--warn">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {stats.overdue} quá hạn
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Command Bar */}
          <div className="sa-cmdbar" role="search">
            <div className="sa-search">
              <Command size={14} className="sa-search-ico" aria-hidden="true" />
              <input
                type="search"
                className="sa-search-inp"
                placeholder="Tìm bài tập, môn học, chủ đề... (⌘K)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm bài tập"
              />
              {search && (
                <button
                  className="sa-search-clr"
                  onClick={() => setSearch('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="sa-filters" aria-label="Bộ lọc">
              <div className="sa-sel-wrap">
                <select
                  className="sa-sel"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value as SubjectFilter)}
                  aria-label="Lọc theo môn học"
                >
                  <option value="Tất cả">Môn học</option>
                  <option value="Đại số">Đại số</option>
                  <option value="Hình học">Hình học</option>
                  <option value="Giải tích">Giải tích</option>
                </select>
                <ChevronDown size={12} className="sa-sel-ico" aria-hidden="true" />
              </div>
              <div className="sa-sel-wrap">
                <select
                  className="sa-sel"
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value as DifficultyFilter)}
                  aria-label="Lọc theo độ khó"
                >
                  <option value="Tất cả">Độ khó</option>
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
                <ChevronDown size={12} className="sa-sel-ico" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <LayoutGroup id="sa-tabs">
            <div className="sa-tabs" role="tablist" aria-label="Lọc theo trạng thái">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`sa-tab${activeTab === tab.id ? ' sa-tab--on' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-pill"
                      className="sa-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="sa-tab-txt">
                    {tab.label}
                    <span className="sa-tab-n">{tabCounts[tab.id]}</span>
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </header>

        {/* ── Task Engine ── */}
        <main className="sa-engine" aria-label="Danh sách bài tập">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="sa-empty"
              role="status"
            >
              <div className="sa-empty-ico" aria-hidden="true">
                🔍
              </div>
              <p className="sa-empty-h">Không tìm thấy bài tập nào</p>
              <p className="sa-empty-p">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button className="sa-empty-btn" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </motion.div>
          ) : (
            <LayoutGroup>
              <TaskGroup
                title="Hôm nay"
                items={groups.today}
                defaultOpen={true}
                icon={<Flame size={13} />}
                accentColor="#E11D48"
              />
              <TaskGroup
                title="Tuần này"
                items={groups.thisWeek}
                defaultOpen={true}
                icon={<Calendar size={13} />}
                accentColor="#3B82F6"
              />
              <TaskGroup
                title="Đã hoàn thành"
                items={groups.completed}
                defaultOpen={false}
                icon={<Trophy size={13} />}
                accentColor="#10B981"
              />
            </LayoutGroup>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;
