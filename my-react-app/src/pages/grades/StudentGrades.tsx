import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import './StudentGrades.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Assignment {
  name: string;
  date: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface CourseGrade {
  courseId: string;
  courseName: string;
  teacher: string;
  subjectColor: string;
  assignments: Assignment[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_GRADES: CourseGrade[] = [
  {
    courseId: '1',
    courseName: 'Đại số 10 — Mệnh đề và Tập hợp',
    teacher: 'Nguyễn Văn An',
    subjectColor: '#818cf8',
    assignments: [
      {
        name: 'Bài kiểm tra 15 phút - Chương 1',
        date: '2026-01-15',
        score: 8.5,
        maxScore: 10,
        weight: 10,
      },
      { name: 'Bài tập về nhà số 1', date: '2026-01-18', score: 9, maxScore: 10, weight: 5 },
      { name: 'Kiểm tra giữa kỳ', date: '2026-01-22', score: 7.8, maxScore: 10, weight: 30 },
      { name: 'Thuyết trình nhóm', date: '2026-01-25', score: 8.2, maxScore: 10, weight: 15 },
    ],
  },
  {
    courseId: '2',
    courseName: 'Hình học 11 — Quan hệ vuông góc',
    teacher: 'Nguyễn Văn An',
    subjectColor: '#34d399',
    assignments: [
      {
        name: 'Bài kiểm tra 15 phút - Chương 1',
        date: '2026-01-15',
        score: 8.5,
        maxScore: 10,
        weight: 10,
      },
      { name: 'Bài tập về nhà số 1', date: '2026-01-18', score: 9, maxScore: 10, weight: 5 },
      { name: 'Kiểm tra giữa kỳ', date: '2026-01-22', score: 7.8, maxScore: 10, weight: 30 },
      { name: 'Thuyết trình nhóm', date: '2026-01-25', score: 8.2, maxScore: 10, weight: 15 },
    ],
  },
  {
    courseId: '3',
    courseName: 'Giải tích 12 — Hàm số và Đạo hàm',
    teacher: 'Trần Thị Mai',
    subjectColor: '#fbbf24',
    assignments: [
      {
        name: 'Bài kiểm tra 15 phút - Chương 1',
        date: '2026-01-15',
        score: 8.5,
        maxScore: 10,
        weight: 10,
      },
      { name: 'Bài tập về nhà số 1', date: '2026-01-18', score: 9, maxScore: 10, weight: 5 },
      { name: 'Kiểm tra giữa kỳ', date: '2026-01-22', score: 7.8, maxScore: 10, weight: 30 },
      { name: 'Thuyết trình nhóm', date: '2026-01-25', score: 8.2, maxScore: 10, weight: 15 },
    ],
  },
];

const STUDENT = { name: 'Trần Thị Bình', avatar: 'TB', rank: 3, classSize: 30 };

// ─── Utilities ────────────────────────────────────────────────────────────────
function calcAvg(assignments: Assignment[]): number {
  const totalW = assignments.reduce((s, a) => s + a.weight, 0);
  const weighted = assignments.reduce((s, a) => s + (a.score / a.maxScore) * a.weight, 0);
  return (weighted / totalW) * 10;
}

function scoreColor(s: number): string {
  if (s >= 9) return '#34d399';
  if (s >= 8) return '#818cf8';
  if (s >= 6.5) return '#fbbf24';
  return '#f87171';
}

function scoreLabel(s: number): string {
  if (s >= 9) return 'Xuất sắc';
  if (s >= 8) return 'Giỏi';
  if (s >= 6.5) return 'Khá';
  return 'Trung bình';
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── useCountUp ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, delay = 500): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const tid = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Number.parseFloat((eased * target).toFixed(2)));
        if (p < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(tid);
  }, [target, duration, delay]);
  return val;
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const IconDiploma = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.08 12.08 0 01.665 6.479A11.95 11.95 0 0012 20.055a11.95 11.95 0 00-6.824-2.998 12.08 12.08 0 01.665-6.479L12 14z" />
  </svg>
);

const IconBook = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconStar = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconDownload = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const IconTrophy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

// ─── Arc Progress SVG ─────────────────────────────────────────────────────────
interface ArcProps {
  value: number;
  max?: number;
  color: string;
  animate: boolean;
}
const ArcProgress: React.FC<ArcProps> = ({ value, max = 10, color, animate }) => {
  const r = 72;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const pct = value / max;
  const offset = animate ? circ * (1 - pct) : circ;
  return (
    <svg width="180" height="180" className="gp-arc-svg" aria-hidden="true">
      <defs>
        <filter id="arcGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        filter="url(#arcGlow)"
        style={{
          transition: animate ? 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1) 0.4s' : 'none',
        }}
      />
    </svg>
  );
};

// ─── Custom Recharts Tooltip ───────────────────────────────────────────────────
interface ChartRow {
  name: string;
  score: number;
  weight: number;
  contribution: number;
}
const ChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="gp-chart-tooltip">
      <p className="gp-tt-name">{d.name}</p>
      <p className="gp-tt-score" style={{ color: scoreColor(d.score) }}>
        Điểm: <strong>{d.score}/10</strong>
      </p>
      <p className="gp-tt-weight">Trọng số: {d.weight}%</p>
      <p className="gp-tt-contrib">
        Đóng góp: <strong>+{d.contribution}</strong>
      </p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const GradesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const overallAvg =
    MOCK_GRADES.reduce((s, c) => s + calcAvg(c.assignments), 0) / MOCK_GRADES.length;
  const totalAssignments = MOCK_GRADES.reduce((s, c) => s + c.assignments.length, 0);
  const rankPercent = Math.round((STUDENT.rank / STUDENT.classSize) * 100);
  const gpaDisplay = useCountUp(Number.parseFloat(overallAvg.toFixed(2)));
  const heroColor = scoreColor(overallAvg);
  const heroLabel = scoreLabel(overallAvg);

  const filtered =
    activeTab === 'all' ? MOCK_GRADES : MOCK_GRADES.filter((g) => g.courseId === activeTab);

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }, 1600);
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: STUDENT.name, avatar: STUDENT.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className={`gp-page${mounted ? ' gp-mounted' : ''}`}>
        {/* ── Hero Banner ──────────────────────────────────────── */}
        <section className="gp-hero">
          <div className="gp-hero-noise" aria-hidden="true" />
          <div className="gp-hero-glow" aria-hidden="true" />

          <div className="gp-hero-inner">
            {/* Arc + GPA */}
            <div className="gp-arc-wrapper">
              <ArcProgress
                value={Number.parseFloat(overallAvg.toFixed(2))}
                color={heroColor}
                animate={mounted}
              />
              <div className="gp-arc-center">
                <span className="gp-gpa-num" style={{ color: heroColor }}>
                  {gpaDisplay.toFixed(2)}
                </span>
                <span className="gp-gpa-denom">/10</span>
              </div>
            </div>

            {/* Hero text */}
            <div className="gp-hero-text">
              <p className="gp-hero-eyebrow">Năm học 2025 – 2026 · Học kỳ II</p>
              <h1 className="gp-hero-title">Bảng Điểm</h1>
              <div className="gp-hero-chips">
                <span
                  className="gp-grade-chip"
                  style={{ '--chip-color': heroColor } as React.CSSProperties}
                >
                  {heroLabel}
                </span>
                <span className="gp-rank-chip">
                  <IconTrophy />
                  Top {rankPercent}%&nbsp;&nbsp;·&nbsp;&nbsp;{STUDENT.rank}/{STUDENT.classSize}
                </span>
              </div>
            </div>

            {/* Export */}
            <div className="gp-hero-actions">
              <button
                className={`gp-export-btn${exporting ? ' gp-exporting' : ''}`}
                onClick={handleExport}
                disabled={exporting}
              >
                <span className="gp-btn-shimmer" />
                {exporting ? (
                  <>
                    <span className="gp-spinner" /> Đang xuất...
                  </>
                ) : (
                  <>
                    <IconDownload /> Xuất báo cáo
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats Row ─────────────────────────────────────────── */}
        <div className="gp-stats">
          {(
            [
              {
                icon: <IconDiploma />,
                label: 'Điểm TB Chung',
                value: overallAvg.toFixed(2),
                sub: heroLabel,
                color: heroColor,
              },
              {
                icon: <IconBook />,
                label: 'Số Môn Học',
                value: String(MOCK_GRADES.length),
                sub: 'môn đang học',
                color: '#60a5fa',
              },
              {
                icon: <IconCheck />,
                label: 'Bài Đã Chấm',
                value: String(totalAssignments),
                sub: 'bài kiểm tra',
                color: '#a78bfa',
              },
              {
                icon: <IconStar />,
                label: 'Hạng Trong Lớp',
                value: `${STUDENT.rank}/${STUDENT.classSize}`,
                sub: `Top ${rankPercent}%`,
                color: '#fb923c',
              },
            ] as const
          ).map((card, i) => (
            <div
              key={card.label}
              className="gp-stat-card"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="gp-stat-icon" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div className="gp-stat-body">
                <p className="gp-stat-label">{card.label}</p>
                <p className="gp-stat-value" style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className="gp-stat-sub">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Tabs ───────────────────────────────────────── */}
        <div className="gp-tabs">
          <button
            className={`gp-tab${activeTab === 'all' ? ' gp-tab-active' : ''}`}
            style={
              activeTab === 'all' ? ({ '--tab-c': '#64748b' } as React.CSSProperties) : undefined
            }
            onClick={() => setActiveTab('all')}
          >
            Tất cả môn
          </button>
          {MOCK_GRADES.map((g) => (
            <button
              key={g.courseId}
              className={`gp-tab${activeTab === g.courseId ? ' gp-tab-active' : ''}`}
              style={
                activeTab === g.courseId
                  ? ({ '--tab-c': g.subjectColor } as React.CSSProperties)
                  : undefined
              }
              onClick={() => setActiveTab(g.courseId)}
            >
              {g.courseName.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {/* ── Grade Cards ───────────────────────────────────────── */}
        <div className="gp-cards">
          {filtered.map((course, ci) => {
            const avg = calcAvg(course.assignments);
            const avgColor = scoreColor(avg);
            const avgLabel = scoreLabel(avg);
            const totalWt = course.assignments.reduce((s, a) => s + a.weight, 0);
            const initials = course.teacher
              .split(' ')
              .slice(-2)
              .map((w) => w[0])
              .join('');

            const chartData: ChartRow[] = course.assignments.map((a) => ({
              name: a.name.split(' - ')[0],
              score: a.score,
              weight: a.weight,
              contribution: Number.parseFloat(
                ((a.score / a.maxScore) * (a.weight / totalWt) * 10).toFixed(2)
              ),
            }));

            return (
              <div
                key={course.courseId}
                className="gp-card"
                style={
                  {
                    '--sc': course.subjectColor,
                    animationDelay: `${ci * 0.12}s`,
                  } as React.CSSProperties
                }
              >
                {/* Card header */}
                <div className="gp-card-head">
                  <div className="gp-card-title-block">
                    <h2 className="gp-card-title">{course.courseName}</h2>
                    <div className="gp-teacher-chip">
                      <span
                        className="gp-teacher-avatar"
                        style={{ background: course.subjectColor }}
                      >
                        {initials}
                      </span>
                      <span className="gp-teacher-name">{course.teacher}</span>
                    </div>
                  </div>
                  <div className="gp-avg-badge" style={{ '--ac': avgColor } as React.CSSProperties}>
                    <span className="gp-avg-lbl">Điểm TB</span>
                    <span className="gp-avg-val">{avg.toFixed(2)}</span>
                    <span className="gp-avg-grade">{avgLabel}</span>
                  </div>
                </div>

                {/* Assignments table */}
                <div className="gp-table-wrap">
                  <table className="gp-table">
                    <thead>
                      <tr>
                        <th>Tên bài tập</th>
                        <th>Ngày nộp</th>
                        <th>Hệ số</th>
                        <th>Điểm</th>
                        <th>Đóng góp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.assignments.map((a) => {
                        const pct = (a.score / a.maxScore) * 100;
                        const sc = scoreColor(a.score);
                        const contrib = (
                          (a.score / a.maxScore) *
                          (a.weight / totalWt) *
                          10
                        ).toFixed(2);
                        return (
                          <tr
                            key={a.name}
                            className="gp-row"
                            style={{ '--rc': course.subjectColor } as React.CSSProperties}
                          >
                            <td className="gp-assn-name">{a.name}</td>
                            <td className="gp-date">{fmtDate(a.date)}</td>
                            <td>
                              <span className="gp-weight-pill">{a.weight}%</span>
                            </td>
                            <td>
                              <div className="gp-score-cell">
                                <span className="gp-score-num" style={{ color: sc }}>
                                  {a.score}/{a.maxScore}
                                </span>
                                <div className="gp-score-track">
                                  <div
                                    className="gp-score-bar"
                                    style={{
                                      width: mounted ? `${pct}%` : '0%',
                                      background: `linear-gradient(90deg, ${sc}cc, ${sc})`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="gp-contrib" style={{ color: sc }}>
                                +{contrib}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bar Chart */}
                <div className="gp-chart-section">
                  <h3 className="gp-chart-title">Phân tích điểm số</h3>
                  <div className="gp-chart-wrap">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={chartData}
                        barCategoryGap="32%"
                        margin={{ top: 10, right: 48, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Be Vietnam Pro' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 10]}
                          ticks={[0, 2, 4, 6, 8, 10]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          content={<ChartTooltip />}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <ReferenceLine
                          y={avg}
                          stroke={avgColor}
                          strokeDasharray="6 3"
                          strokeWidth={1.5}
                          label={{
                            value: `TB: ${avg.toFixed(2)}`,
                            fill: avgColor,
                            fontSize: 11,
                            position: 'right',
                          }}
                        />
                        <Bar
                          dataKey="score"
                          radius={[5, 5, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={900}
                          animationBegin={300}
                          fill={course.subjectColor}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Grade Legend ──────────────────────────────────────── */}
        <div className="gp-legend">
          <h4 className="gp-legend-title">Thang điểm xếp loại</h4>
          <div className="gp-legend-items">
            {[
              { color: '#34d399', range: '9.0 – 10', grade: 'Xuất sắc' },
              { color: '#818cf8', range: '8.0 – 8.9', grade: 'Giỏi' },
              { color: '#fbbf24', range: '6.5 – 7.9', grade: 'Khá' },
              { color: '#f87171', range: '0 – 6.4', grade: 'Trung bình' },
            ].map((item) => (
              <div key={item.grade} className="gp-legend-item">
                <span
                  className="gp-legend-dot"
                  style={{ background: item.color, boxShadow: `0 0 8px ${item.color}88` }}
                />
                <span className="gp-legend-range">{item.range}</span>
                <span className="gp-legend-grade" style={{ color: item.color }}>
                  {item.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Export Toast ──────────────────────────────────────── */}
      {showToast && (
        <output className="gp-toast">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Đã xuất báo cáo thành công
        </output>
      )}
    </DashboardLayout>
  );
};

export default GradesPage;
