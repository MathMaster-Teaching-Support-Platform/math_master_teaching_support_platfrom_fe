import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import './AdminAnalytics.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHLY_OVERVIEW = [
  { month: 'T1', students: 280, teachers: 38, revenue: 28500000, sessions: 3400, txn: 72 },
  { month: 'T2', students: 320, teachers: 44, revenue: 35200000, sessions: 4100, txn: 91 },
  { month: 'T3', students: 375, teachers: 52, revenue: 41800000, sessions: 4950, txn: 108 },
  { month: 'T4', students: 348, teachers: 49, revenue: 38900000, sessions: 4600, txn: 99 },
  { month: 'T5', students: 420, teachers: 63, revenue: 52300000, sessions: 5800, txn: 134 },
  { month: 'T6', students: 495, teachers: 71, revenue: 61700000, sessions: 6900, txn: 158 },
  { month: 'T7', students: 472, teachers: 68, revenue: 59100000, sessions: 6600, txn: 151 },
  { month: 'T8', students: 558, teachers: 79, revenue: 68400000, sessions: 7800, txn: 175 },
  { month: 'T9', students: 614, teachers: 88, revenue: 75200000, sessions: 8600, txn: 193 },
  { month: 'T10', students: 703, teachers: 95, revenue: 82600000, sessions: 9800, txn: 213 },
  { month: 'T11', students: 776, teachers: 108, revenue: 91300000, sessions: 10800, txn: 238 },
  { month: 'T12', students: 849, teachers: 118, revenue: 99800000, sessions: 11900, txn: 261 },
];

const DAILY_TRAFFIC = [
  { day: 'T2', visits: 1240, uniqueUsers: 890, avgDuration: 18 },
  { day: 'T3', visits: 1380, uniqueUsers: 970, avgDuration: 22 },
  { day: 'T4', visits: 1520, uniqueUsers: 1080, avgDuration: 21 },
  { day: 'T5', visits: 1450, uniqueUsers: 1010, avgDuration: 19 },
  { day: 'T6', visits: 1680, uniqueUsers: 1190, avgDuration: 25 },
  { day: 'T7', visits: 980, uniqueUsers: 710, avgDuration: 14 },
  { day: 'CN', visits: 720, uniqueUsers: 530, avgDuration: 11 },
];

const PLAN_SALES = [
  { name: 'Pro - 1 tháng', value: 510, revenue: 50490000, fill: '#667eea' },
  { name: 'Pro - 3 tháng', value: 283, revenue: 78957000, fill: '#43e97b' },
  { name: 'Pro - 6 tháng', value: 182, revenue: 99918000, fill: '#38f9d7' },
  { name: 'Premium - 6 tháng', value: 164, revenue: 221400000, fill: '#f093fb' },
  { name: 'Premium - 1 năm', value: 97, revenue: 96030000, fill: '#fbbf24' },
];

const TXN_STATUS = [
  { name: 'Thành công', value: 1058, fill: '#22c55e' },
  { name: 'Đang xử lý', value: 112, fill: '#fbbf24' },
  { name: 'Thất bại', value: 66, fill: '#ef4444' },
];

const STUDENT_ENGAGEMENT = [
  { month: 'T1', enrolled: 210, videoViews: 1850, assessments: 340, completions: 95 },
  { month: 'T2', enrolled: 255, videoViews: 2300, assessments: 420, completions: 130 },
  { month: 'T3', enrolled: 310, videoViews: 2900, assessments: 510, completions: 165 },
  { month: 'T4', enrolled: 288, videoViews: 2650, assessments: 475, completions: 148 },
  { month: 'T5', enrolled: 368, videoViews: 3400, assessments: 620, completions: 195 },
  { month: 'T6', enrolled: 435, videoViews: 4100, assessments: 740, completions: 230 },
  { month: 'T7', enrolled: 412, videoViews: 3850, assessments: 695, completions: 215 },
  { month: 'T8', enrolled: 490, videoViews: 4600, assessments: 830, completions: 260 },
  { month: 'T9', enrolled: 548, videoViews: 5200, assessments: 940, completions: 295 },
  { month: 'T10', enrolled: 635, videoViews: 6100, assessments: 1090, completions: 340 },
  { month: 'T11', enrolled: 704, videoViews: 6800, assessments: 1210, completions: 380 },
  { month: 'T12', enrolled: 778, videoViews: 7500, assessments: 1340, completions: 415 },
];

const TEACHER_STATS = [
  { month: 'T1', newTeachers: 38, approved: 30, contentCreated: 124 },
  { month: 'T2', newTeachers: 44, approved: 37, contentCreated: 158 },
  { month: 'T3', newTeachers: 52, approved: 45, contentCreated: 193 },
  { month: 'T4', newTeachers: 49, approved: 41, contentCreated: 178 },
  { month: 'T5', newTeachers: 63, approved: 55, contentCreated: 235 },
  { month: 'T6', newTeachers: 71, approved: 63, contentCreated: 278 },
  { month: 'T7', newTeachers: 68, approved: 60, contentCreated: 261 },
  { month: 'T8', newTeachers: 79, approved: 72, contentCreated: 312 },
  { month: 'T9', newTeachers: 88, approved: 80, contentCreated: 348 },
  { month: 'T10', newTeachers: 95, approved: 87, contentCreated: 390 },
  { month: 'T11', newTeachers: 108, approved: 99, contentCreated: 435 },
  { month: 'T12', newTeachers: 118, approved: 109, contentCreated: 480 },
];

const COURSE_ENGAGEMENT = [
  { subject: 'Đại số', enrolled: 2240, videoViews: 8900, completed: 1450 },
  { subject: 'Hình học', enrolled: 1870, videoViews: 7200, completed: 1180 },
  { subject: 'Giải tích', enrolled: 1540, videoViews: 6100, completed: 940 },
  { subject: 'Xác suất', enrolled: 980, videoViews: 3800, completed: 610 },
  { subject: 'Số học', enrolled: 760, videoViews: 2900, completed: 490 },
  { subject: 'Tổ hợp', enrolled: 620, videoViews: 2300, completed: 380 },
];

const RETENTION_RADIAL = [
  { name: 'Ngày 1', value: 100, fill: '#667eea' },
  { name: 'Ngày 7', value: 68, fill: '#43e97b' },
  { name: 'Ngày 30', value: 44, fill: '#fbbf24' },
  { name: 'Ngày 90', value: 29, fill: '#f093fb' },
];

const KPI_CARDS = [
  {
    icon: '👥',
    label: 'Tổng người dùng',
    value: '2.530',
    sub: '+14.2% YoY',
    color: '#667eea',
    positive: true,
  },
  {
    icon: '⚡',
    label: 'DAU trung bình',
    value: '1.840',
    sub: '72.7% tổng users',
    color: '#43e97b',
    positive: true,
  },
  {
    icon: '💰',
    label: 'Doanh thu năm',
    value: '₫734.8M',
    sub: '+18.5% YoY',
    color: '#38f9d7',
    positive: true,
  },
  {
    icon: '🎯',
    label: 'Tỷ lệ chuyển đổi',
    value: '22.4%',
    sub: '+3.1pp',
    color: '#f093fb',
    positive: true,
  },
  {
    icon: '📚',
    label: 'Khóa học đã đăng ký',
    value: '6.484',
    sub: '+25.3% YoY',
    color: '#fbbf24',
    positive: true,
  },
  {
    icon: '🎬',
    label: 'Lượt xem video',
    value: '55.200',
    sub: '+31.7% YoY',
    color: '#fc8181',
    positive: true,
  },
  {
    icon: '✅',
    label: 'Bài kiểm tra hoàn thành',
    value: '8.214',
    sub: '+27.8% YoY',
    color: '#a78bfa',
    positive: true,
  },
  {
    icon: '🍎',
    label: 'Giáo viên đã duyệt',
    value: '778',
    sub: '93.5% approval rate',
    color: '#34d399',
    positive: true,
  },
];

type Section = 'overview' | 'traffic' | 'revenue' | 'engagement' | 'teachers';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (val: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ana-tooltip">
      <div className="ana-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="ana-tooltip-row">
          <span className="ana-tooltip-dot" style={{ background: p.color }} />
          <span className="ana-tooltip-name">{p.name}:</span>
          <span className="ana-tooltip-value">
            {formatter ? formatter(p.value) : p.value.toLocaleString('vi-VN')}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminAnalytics: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const fmtCurrency = (n: number): string => {
    if (n >= 1_000_000) return `₫${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₫${(n / 1_000).toFixed(0)}K`;
    return `₫${n.toLocaleString('vi-VN')}`;
  };

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: 'overview', label: 'Tổng quan', icon: '🏠' },
    { key: 'traffic', label: 'Lưu lượng', icon: '📡' },
    { key: 'revenue', label: 'Doanh thu & Giao dịch', icon: '💰' },
    { key: 'engagement', label: 'Học sinh & Học tập', icon: '📚' },
    { key: 'teachers', label: 'Giáo viên', icon: '🍎' },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={3}
    >
      <div className="admin-analytics-page">
        {/* Page Header */}
        <div className="ana-page-header">
          <div>
            <h1 className="ana-page-title">📈 Thống kê & Phân tích</h1>
            <p className="ana-page-subtitle">
              Dữ liệu hoạt động chi tiết của nền tảng MathMaster — năm 2026
            </p>
          </div>
          <button className="ana-export-btn">📥 Xuất báo cáo</button>
        </div>

        {/* Section Nav */}
        <div className="ana-section-nav">
          {SECTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`ana-nav-btn${activeSection === key ? ' ana-nav-btn--active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION: OVERVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <>
            {/* KPI Grid */}
            <div className="ana-kpi-grid">
              {KPI_CARDS.map((k) => (
                <div key={k.label} className="ana-kpi-card" style={{ borderTopColor: k.color }}>
                  <div
                    className="ana-kpi-icon"
                    style={{ background: `${k.color}18`, color: k.color }}
                  >
                    {k.icon}
                  </div>
                  <div className="ana-kpi-info">
                    <div className="ana-kpi-label">{k.label}</div>
                    <div className="ana-kpi-value">{k.value}</div>
                    <div className={`ana-kpi-sub ${k.positive ? 'positive' : 'neutral'}`}>
                      {k.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User Registration Trend */}
            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Đăng ký người dùng theo tháng</h2>
                  <p className="ana-card-subtitle">
                    Phân tách học sinh và giáo viên mới — 12 tháng
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={MONTHLY_OVERVIEW} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar dataKey="students" name="Học sinh" fill="#667eea" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="teachers" name="Giáo viên" fill="#43e97b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Trend + Plan Distribution */}
            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Doanh thu & Phiên học theo tháng</h2>
                    <p className="ana-card-subtitle">Tương quan doanh thu (₫) và lưu lượng học</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={MONTHLY_OVERVIEW}>
                      <defs>
                        <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad-ses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#43e97b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#43e97b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="rev"
                        orientation="left"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => fmtCurrency(v)}
                      />
                      <YAxis
                        yAxisId="ses"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip formatter={(v) => v.toLocaleString('vi-VN')} />}
                      />
                      <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                      <Area
                        yAxisId="rev"
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu"
                        stroke="#667eea"
                        strokeWidth={2}
                        fill="url(#grad-rev)"
                      />
                      <Area
                        yAxisId="ses"
                        type="monotone"
                        dataKey="sessions"
                        name="Phiên học"
                        stroke="#43e97b"
                        strokeWidth={2}
                        fill="url(#grad-ses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Phân bổ gói đăng ký</h2>
                    <p className="ana-card-subtitle">Số lượng đăng ký theo từng gói</p>
                  </div>
                </div>
                <div className="ana-chart-body ana-chart-body--center">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={PLAN_SALES}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={55}
                        paddingAngle={3}
                      >
                        {PLAN_SALES.map((p) => (
                          <Cell key={p.name} fill={p.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toLocaleString('vi-VN')} đăng ký`, ''] as [string, string]; }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION: TRAFFIC
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'traffic' && (
          <>
            <div className="ana-kpi-row">
              {[
                {
                  label: 'Lượt truy cập / ngày (TB)',
                  value: '1.424',
                  icon: '🌐',
                  color: '#667eea',
                },
                {
                  label: 'Người dùng độc lập / ngày',
                  value: '1.026',
                  icon: '👤',
                  color: '#43e97b',
                },
                { label: 'Thời gian phiên TB', value: '18.6 phút', icon: '⏱️', color: '#fbbf24' },
                {
                  label: 'Tỷ lệ thoát (Bounce rate)',
                  value: '28.4%',
                  icon: '↩️',
                  color: '#f093fb',
                },
              ].map((k) => (
                <div key={k.label} className="ana-inline-kpi" style={{ borderLeftColor: k.color }}>
                  <div className="ana-inline-kpi-icon" style={{ color: k.color }}>
                    {k.icon}
                  </div>
                  <div>
                    <div className="ana-inline-kpi-value">{k.value}</div>
                    <div className="ana-inline-kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Lưu lượng truy cập trong tuần</h2>
                  <p className="ana-card-subtitle">
                    Lượt truy cập và người dùng độc lập theo ngày trong tuần
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={DAILY_TRAFFIC} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 13, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar
                      dataKey="visits"
                      name="Lượt truy cập"
                      fill="#667eea"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="uniqueUsers"
                      name="Người dùng độc lập"
                      fill="#38f9d7"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Thời gian phiên học trung bình</h2>
                    <p className="ana-card-subtitle">Phút / phiên theo ngày trong tuần</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={DAILY_TRAFFIC}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        unit=" ph"
                      />
                      <Tooltip content={<ChartTooltip formatter={(v) => `${v} phút`} />} />
                      <Line
                        type="monotone"
                        dataKey="avgDuration"
                        name="Thời gian TB"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        dot={{ fill: '#fbbf24', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Tỷ lệ giữ chân (User Retention)</h2>
                    <p className="ana-card-subtitle">% người dùng quay lại sau N ngày</p>
                  </div>
                </div>
                <div className="ana-chart-body ana-chart-body--center">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="20%"
                      outerRadius="90%"
                      data={RETENTION_RADIAL}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        background={{ fill: '#f1f5f9' }}
                        cornerRadius={6}
                        label={{
                          position: 'insideStart',
                          fill: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                      <Legend
                        iconSize={10}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'Retention'] as [string, string]; }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Xu hướng truy cập theo tháng</h2>
                  <p className="ana-card-subtitle">
                    Tổng phiên học (session) tích lũy theo thời gian
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={MONTHLY_OVERVIEW}>
                    <defs>
                      <linearGradient id="grad-sess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      name="Phiên học"
                      stroke="#667eea"
                      strokeWidth={2.5}
                      fill="url(#grad-sess)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION: REVENUE & TRANSACTIONS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'revenue' && (
          <>
            <div className="ana-kpi-row">
              {[
                { label: 'Tổng doanh thu năm', value: '₫734.8M', icon: '💰', color: '#43e97b' },
                { label: 'Doanh thu tháng này', value: '₫99.8M', icon: '📅', color: '#667eea' },
                { label: 'Tổng giao dịch', value: '1.236', icon: '📊', color: '#fbbf24' },
                { label: 'Tỷ lệ thành công', value: '85.6%', icon: '✅', color: '#22c55e' },
              ].map((k) => (
                <div key={k.label} className="ana-inline-kpi" style={{ borderLeftColor: k.color }}>
                  <div className="ana-inline-kpi-icon" style={{ color: k.color }}>
                    {k.icon}
                  </div>
                  <div>
                    <div className="ana-inline-kpi-value">{k.value}</div>
                    <div className="ana-inline-kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Doanh thu theo tháng</h2>
                  <p className="ana-card-subtitle">Tổng doanh thu từ gói đăng ký (triệu ₫)</p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={MONTHLY_OVERVIEW}>
                    <defs>
                      <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#43e97b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#43e97b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtCurrency}
                    />
                    <Tooltip content={<ChartTooltip formatter={fmtCurrency} />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#43e97b"
                      strokeWidth={2.5}
                      fill="url(#grad-revenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Số giao dịch theo tháng</h2>
                    <p className="ana-card-subtitle">Tổng số giao dịch PayOS phát sinh</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={MONTHLY_OVERVIEW}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="txn" name="Giao dịch" radius={[4, 4, 0, 0]}>
                        {MONTHLY_OVERVIEW.map((_, idx) => (
                          <Cell key={idx} fill={`hsl(${220 + idx * 8}, 65%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Trạng thái giao dịch</h2>
                    <p className="ana-card-subtitle">Phân bổ kết quả thanh toán (tổng cộng)</p>
                  </div>
                </div>
                <div className="ana-chart-body ana-chart-body--center">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={TXN_STATUS}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={48}
                        paddingAngle={4}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {TXN_STATUS.map((t) => (
                          <Cell key={t.name} fill={t.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [n.toLocaleString('vi-VN'), 'Giao dịch'] as [string, string]; }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Doanh thu theo gói đăng ký</h2>
                  <p className="ana-card-subtitle">
                    So sánh doanh thu (₫) và lượng người mua của từng gói
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={PLAN_SALES} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtCurrency}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [fmtCurrency(n), 'Doanh thu'] as [string, string]; }} />
                    <Bar dataKey="revenue" name="Doanh thu" radius={[0, 6, 6, 0]}>
                      {PLAN_SALES.map((p) => (
                        <Cell key={p.name} fill={p.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION: STUDENT ENGAGEMENT
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'engagement' && (
          <>
            <div className="ana-kpi-row">
              {[
                { label: 'Tổng lượt đăng ký khoá', value: '6.484', icon: '📚', color: '#667eea' },
                { label: 'Lượt xem video', value: '55.200', icon: '🎬', color: '#f093fb' },
                { label: 'Bài kiểm tra hoàn thành', value: '8.214', icon: '✅', color: '#43e97b' },
                { label: 'Tỷ lệ hoàn thành khoá', value: '63.4%', icon: '🏆', color: '#fbbf24' },
              ].map((k) => (
                <div key={k.label} className="ana-inline-kpi" style={{ borderLeftColor: k.color }}>
                  <div className="ana-inline-kpi-icon" style={{ color: k.color }}>
                    {k.icon}
                  </div>
                  <div>
                    <div className="ana-inline-kpi-value">{k.value}</div>
                    <div className="ana-inline-kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Tương tác học sinh theo tháng</h2>
                  <p className="ana-card-subtitle">
                    Đăng ký khoá học, lượt xem video, bài kiểm tra hoàn thành
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={STUDENT_ENGAGEMENT}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="enrolled"
                      name="Đăng ký khoá"
                      stroke="#667eea"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="videoViews"
                      name="Lượt xem video"
                      stroke="#f093fb"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="assessments"
                      name="Bài kiểm tra"
                      stroke="#fbbf24"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completions"
                      name="Hoàn thành khoá"
                      stroke="#43e97b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Đăng ký & Hoàn thành khoá học</h2>
                    <p className="ana-card-subtitle">
                      So sánh đăng ký mới vs hoàn thành theo tháng
                    </p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={STUDENT_ENGAGEMENT} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar
                        dataKey="enrolled"
                        name="Đăng ký mới"
                        fill="#667eea"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="completions"
                        name="Hoàn thành"
                        fill="#43e97b"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Lượt xem video theo tháng</h2>
                    <p className="ana-card-subtitle">Xu hướng tương tác nội dung video</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={STUDENT_ENGAGEMENT}>
                      <defs>
                        <linearGradient id="grad-vid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f093fb" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f093fb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="videoViews"
                        name="Lượt xem video"
                        stroke="#f093fb"
                        strokeWidth={2.5}
                        fill="url(#grad-vid)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Tương tác theo môn học</h2>
                  <p className="ana-card-subtitle">
                    Đăng ký khoá học, lượt xem video và hoàn thành theo từng môn
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={COURSE_ENGAGEMENT} barGap={4} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="subject"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar dataKey="enrolled" name="Đăng ký" fill="#667eea" radius={[3, 3, 0, 0]} />
                    <Bar
                      dataKey="videoViews"
                      name="Lượt xem video"
                      fill="#f093fb"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Hoàn thành"
                      fill="#43e97b"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION: TEACHERS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'teachers' && (
          <>
            <div className="ana-kpi-row">
              {[
                { label: 'Giáo viên đã đăng ký', value: '832', icon: '🍎', color: '#667eea' },
                { label: 'Đã duyệt (Approved)', value: '778', icon: '✅', color: '#43e97b' },
                { label: 'Tỷ lệ duyệt', value: '93.5%', icon: '📋', color: '#fbbf24' },
                { label: 'Nội dung được tạo', value: '3.192', icon: '📝', color: '#f093fb' },
              ].map((k) => (
                <div key={k.label} className="ana-inline-kpi" style={{ borderLeftColor: k.color }}>
                  <div className="ana-inline-kpi-icon" style={{ color: k.color }}>
                    {k.icon}
                  </div>
                  <div>
                    <div className="ana-inline-kpi-value">{k.value}</div>
                    <div className="ana-inline-kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Giáo viên đăng ký & Duyệt theo tháng</h2>
                  <p className="ana-card-subtitle">Số giáo viên mới đăng ký và số được phê duyệt</p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={TEACHER_STATS} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar
                      dataKey="newTeachers"
                      name="Đăng ký mới"
                      fill="#667eea"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="approved"
                      name="Được duyệt"
                      fill="#43e97b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Nội dung được tạo theo tháng</h2>
                    <p className="ana-card-subtitle">
                      Tổng tài liệu, bài giảng, đề thi giáo viên tạo ra
                    </p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={TEACHER_STATS}>
                      <defs>
                        <linearGradient id="grad-content" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="contentCreated"
                        name="Nội dung tạo mới"
                        stroke="#fbbf24"
                        strokeWidth={2.5}
                        fill="url(#grad-content)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Tỷ lệ duyệt profile giáo viên</h2>
                    <p className="ana-card-subtitle">Approved vs Pending theo tháng</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={TEACHER_STATS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Line
                        type="monotone"
                        dataKey="newTeachers"
                        name="Nộp hồ sơ"
                        stroke="#667eea"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="approved"
                        name="Được duyệt"
                        stroke="#43e97b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h2 className="ana-card-title">Đóng góp nội dung theo môn học</h2>
                  <p className="ana-card-subtitle">
                    Số khoá học & tài liệu phân bổ theo chủ đề toán
                  </p>
                </div>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={COURSE_ENGAGEMENT} layout="vertical" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="subject"
                      width={120}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar
                      dataKey="enrolled"
                      name="Học sinh đăng ký"
                      fill="#667eea"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Hoàn thành"
                      fill="#43e97b"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
