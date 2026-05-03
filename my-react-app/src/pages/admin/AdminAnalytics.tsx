import {
  BookOpen,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  GraduationCap,
  LayoutGrid,
  RotateCcw,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFinancialService } from '../../services/admin-financial.service';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import './AdminAnalytics.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────



type Section = 'overview' | 'traffic' | 'revenue' | 'engagement' | 'teachers';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="ana-tooltip">
        <div className="ana-tooltip-label">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="ana-tooltip-row">
            <span className="ana-tooltip-name" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="ana-tooltip-value">
              {formatter ? formatter(entry.value) : entry.value.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminAnalytics: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const currentYear = new Date().getFullYear();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-full-analytics', currentYear],
    queryFn: () => adminFinancialService.getFullAnalytics(currentYear),
  });

  const fmtCurrency = (n: number): string => {
    if (n >= 1_000_000) return `₫${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₫${(n / 1_000).toFixed(0)}K`;
    return `₫${n.toLocaleString('vi-VN')}`;
  };

  // Map backend data to UI constants
  const KPI_CARDS = useMemo(() => {
    if (!analytics) return [];
    
    const totalStudents = analytics.userStats.reduce((a, b) => a + b.students, 0);
    const totalTeachers = analytics.userStats.reduce((a, b) => a + b.teachers, 0);
    const totalUsers = totalStudents + totalTeachers;
    const totalTransactions = analytics.revenueStats.reduce((a, b) => a + b.transactions, 0);
    const yearlyRevenue = analytics.revenueStats.reduce((a, b) => a + b.revenue, 0);
    const totalEnrollments = analytics.engagementStats.reduce((a, b) => a + b.enrollments, 0);

    return [
      {
        icon: Users,
        label: 'Tổng người dùng',
        value: totalUsers.toLocaleString('vi-VN'),
        sub: 'Cumulative',
        color: '#c96442',
        positive: true,
      },
      {
        icon: Zap,
        label: 'Giao dịch',
        value: totalTransactions.toLocaleString('vi-VN'),
        sub: 'Total count',
        color: '#16a34a',
        positive: true,
      },
      {
        icon: DollarSign,
        label: 'Doanh thu năm',
        value: fmtCurrency(yearlyRevenue),
        sub: 'Platform share',
        color: '#d97706',
        positive: true,
      },
      {
        icon: BookOpen,
        label: 'Đăng ký khoá',
        value: totalEnrollments.toLocaleString('vi-VN'),
        sub: 'Lifetime',
        color: '#ca8a04',
        positive: true,
      },
    ];
  }, [analytics]);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            {/* KPI Row (Secondary) */}
            <div className="ana-kpi-row">
              {[
                { 
                  label: 'Video Views', 
                  value: analytics ? analytics.engagementStats.reduce((a, b) => a + b.videoViews, 0).toLocaleString('vi-VN') : '0', 
                  icon: Zap, 
                  color: '#6366f1' 
                },
                { 
                  label: 'Quiz Attempts', 
                  value: analytics ? analytics.engagementStats.reduce((a, b) => a + b.assessments, 0).toLocaleString('vi-VN') : '0', 
                  icon: Trophy, 
                  color: '#f59e0b' 
                },
                { 
                  label: 'Completion Rate', 
                  value: analytics ? (() => {
                    const totalE = analytics.engagementStats.reduce((a, b) => a + b.enrollments, 0);
                    const totalC = analytics.engagementStats.reduce((a, b) => a + b.completions, 0);
                    return totalE > 0 ? Math.round((totalC / totalE) * 100) + '%' : '0%';
                  })() : '0%', 
                  icon: CheckCircle2, 
                  color: '#10b981' 
                },
                { 
                  label: 'Approved Teachers', 
                  value: analytics ? analytics.teacherStats.reduce((a, b) => a + b.approvedTeachers, 0).toLocaleString('vi-VN') : '0', 
                  icon: GraduationCap, 
                  color: '#ec4899' 
                },
              ].map((k, idx) => (
                <div key={idx} className="ana-inline-kpi">
                  <div className="ana-inline-kpi-icon" style={{ color: k.color, backgroundColor: `${k.color}10` }}>
                    <k.icon size={18} />
                  </div>
                  <div>
                    <div className="ana-inline-kpi-value">{k.value}</div>
                    <div className="ana-inline-kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="ana-two-col">
              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Tăng trưởng người dùng</h2>
                    <p className="ana-card-subtitle">Học sinh & Giáo viên mới hàng tháng</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.userStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ana-border)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--ana-text-muted)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--ana-text-muted)', fontSize: 12}} />
                      <Tooltip content={<ChartTooltip />} cursor={{fill: 'var(--ana-primary-soft)', opacity: 0.4}} />
                      <Legend iconType="circle" />
                      <Bar dataKey="students" name="Học sinh" fill="var(--ana-primary)" radius={[6, 6, 0, 0]} animationDuration={1000} />
                      <Bar dataKey="teachers" name="Giáo viên" fill="var(--ana-secondary)" radius={[6, 6, 0, 0]} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ana-card">
                <div className="ana-card-header">
                  <div>
                    <h2 className="ana-card-title">Doanh thu nền tảng</h2>
                    <p className="ana-card-subtitle">Dòng tiền thực nhận (₫) theo tháng</p>
                  </div>
                </div>
                <div className="ana-chart-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics?.revenueStats}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--ana-success)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--ana-success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ana-border)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--ana-text-muted)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--ana-text-muted)', fontSize: 12}} tickFormatter={fmtCurrency} />
                      <Tooltip content={<ChartTooltip formatter={fmtCurrency} />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Doanh thu" 
                        stroke="var(--ana-success)" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        );
      case 'revenue':
        return (
          <div className="ana-section-content">
            <div className="ana-kpi-row">
              {[
                { label: 'Giao dịch thành công', value: '94.2%', icon: CheckCircle2, color: 'var(--ana-success)' },
                { label: 'Giá trị đơn TB (AOV)', value: '₫425K', icon: DollarSign, color: 'var(--ana-primary)' },
                { label: 'Tỷ lệ hoàn tiền', value: '0.8%', icon: RotateCcw, color: 'var(--ana-error)' },
                { label: 'Giao dịch chờ', value: '12', icon: Clock3, color: 'var(--ana-secondary)' },
              ].map((k, idx) => (
                <div key={idx} className="ana-inline-kpi">
                  <div className="ana-inline-kpi-icon" style={{ color: k.color, backgroundColor: `${k.color}10` }}>
                    <k.icon size={18} />
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
                <h2 className="ana-card-title">Phân tích giao dịch chuyên sâu</h2>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analytics?.revenueStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ana-border)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="transactions" name="Số giao dịch" stroke="var(--ana-primary)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'engagement':
        return (
          <div className="ana-section-content">
             <div className="ana-card">
              <div className="ana-card-header">
                <h2 className="ana-card-title">Tương tác theo môn học</h2>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics?.subjectEngagement} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--ana-border)" />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="subject" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100} 
                      tick={{ fill: 'var(--ana-text-muted)', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--ana-primary-soft)', opacity: 0.3 }} />
                    <Bar dataKey="enrolled" name="Đăng ký" fill="var(--ana-primary)" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1000} />
                    <Bar dataKey="completed" name="Hoàn thành" fill="var(--ana-success)" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'teachers':
        return (
          <div className="ana-section-content">
            <div className="ana-card">
              <div className="ana-card-header">
                <h2 className="ana-card-title">Hiệu suất đội ngũ giáo viên</h2>
              </div>
              <div className="ana-chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analytics?.teacherStats}>
                    <defs>
                      <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ana-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--ana-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ana-border)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--ana-text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--ana-text-muted)', fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="approvedTeachers" 
                      name="Giáo viên mới" 
                      stroke="var(--ana-primary)" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTeachers)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" user={{ name: mockAdmin.name, avatar: 'A', role: 'admin' }}>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  const SECTIONS: {
    key: Section;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: 'overview', label: 'Tổng quan', icon: LayoutGrid },
    { key: 'revenue', label: 'Doanh thu', icon: DollarSign },
    { key: 'engagement', label: 'Học tập', icon: BookOpen },
    { key: 'teachers', label: 'Giáo viên', icon: GraduationCap },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={3}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="admin-analytics-page">
        <motion.div 
          className="ana-page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-stack">
            <span className="header-kicker">ADMIN ANALYTICS</span>
            <h1 className="ana-page-title">
              <span>Thống kê & Phân tích</span>
            </h1>
            <p className="ana-page-subtitle">
              Hoạt động nền tảng MathMaster — Năm {currentYear}
            </p>
          </div>
          <button className="ana-export-btn">
            <Download className="ana-export-btn-icon" size={18} />
            <span>Xuất báo cáo</span>
          </button>
        </motion.div>

        <motion.nav 
          className="ana-section-nav"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`ana-nav-btn${activeSection === key ? ' ana-nav-btn--active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <Icon className="ana-nav-btn-icon" />
              <span>{label}</span>
            </button>
          ))}
        </motion.nav>

        <motion.div 
          className="ana-kpi-grid"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {KPI_CARDS.map((card, idx) => (
            <motion.div 
              key={idx} 
              className="ana-kpi-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <div className="ana-kpi-header">
                <div className="ana-kpi-icon-wrapper" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                  <card.icon size={20} />
                </div>
                {card.positive && <span className="ana-kpi-trend">↑ 12.5%</span>}
              </div>
              <div className="ana-kpi-info">
                <span className="ana-kpi-label">{card.label}</span>
                <span className="ana-kpi-value">{card.value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
