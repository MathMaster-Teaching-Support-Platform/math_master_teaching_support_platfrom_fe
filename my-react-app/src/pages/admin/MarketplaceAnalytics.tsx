import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  Search, 
  RefreshCw,
  Star,
  Trophy,
  Info
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { adminFinancialService, formatCurrency } from '../../services/admin-financial.service';
import type { MarketplaceTopCourse, MarketplaceTopInstructor } from '../../services/admin-financial.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './admin-finance-studio.css';
import './MarketplaceAnalytics.css';

/**
 * Robust asset URL resolver for courses and instructors.
 * Handles both relative storage paths and absolute URLs.
 */
const getAssetUrl = (path: string | null | undefined, fallbackName: string) => {
  if (!path) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random&size=512`;
  }
  if (path.startsWith('http')) return path;
  
  // If it's a relative path, we could prefix with API_BASE_URL + /storage/
  // However, based on codebase patterns, thumbnailUrl usually comes as a full URL 
  // or a key that is handled by the backend. If it's just a key:
  // return `${API_BASE_URL}/storage/${path}`;
  
  return path;
};

const MarketplaceAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [grade, setGrade] = useState('all');
  const [activeTab, setActiveTab] = useState<'courses' | 'instructors'>('courses');
  const [searchQuery, setSearchQuery] = useState('');

  // Individual queries for real data
  const topCoursesQuery = useQuery({
    queryKey: ['admin-financial', 'top-courses', period, grade],
    queryFn: () => adminFinancialService.getTopCourses(12),
  });

  const topInstructorsQuery = useQuery({
    queryKey: ['admin-financial', 'top-instructors', period],
    queryFn: () => adminFinancialService.getTopInstructors(12),
  });

  const overviewQuery = useQuery({
    queryKey: ['admin-financial', 'overview', period],
    queryFn: () => adminFinancialService.getFinancialOverview(),
  });

  const loading = topCoursesQuery.isLoading || topInstructorsQuery.isLoading || overviewQuery.isLoading;
  const isFetching = topCoursesQuery.isFetching || topInstructorsQuery.isFetching || overviewQuery.isFetching;

  // Extract data
  const topCourses = topCoursesQuery.data || [];
  const topInstructors = topInstructorsQuery.data || [];
  const overview = overviewQuery.data || null;

  // Derived Top 3 for Spotlight
  const spotlightCourses = useMemo(() => topCourses.slice(0, 3), [topCourses]);
  const spotlightInstructors = useMemo(() => topInstructors.slice(0, 3), [topInstructors]);

  // Filtered lists for the tables
  const filteredCourses = useMemo(() => {
    return topCourses.filter(c => 
      c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topCourses, searchQuery]);

  const filteredInstructors = useMemo(() => {
    return topInstructors.filter(i => 
      i.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topInstructors, searchQuery]);

  const shell = (body: React.ReactNode) => (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="marketplace-analytics">{body}</div>
      </AdminFinanceStudioShell>
    </DashboardLayout>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  } as const;

  const COLORS = ['#c96442', '#d97757', '#87867f', '#5e5d59', '#141413'];

  if (loading && !topCourses.length) {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="skeleton-box" style={{ height: '140px', borderRadius: '24px' }} />
        <div className="bento-kpi-grid">
          <div className="featured-kpi skeleton-box" style={{ height: '350px' }} />
          <div className="kpi-sidebar">
            {[1, 2].map(i => <div key={i} className="kpi-card skeleton-box" style={{ height: '120px' }} />)}
          </div>
        </div>
        <div className="spotlight-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: '400px', borderRadius: '28px' }} />)}
        </div>
      </div>
    );
  }

  return shell(
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <header className="analytics-header">
        <div className="header-stack">
          <div className="header-kicker">MathMaster Intelligence</div>
          <h2>Báo cáo Thị trường</h2>
          <p className="header-sub">Phân tích xu hướng khóa học và hiệu suất giảng viên dẫn đầu</p>
        </div>
        <div className="header-controls">
          <div className="filter-group">
            <button className={`filter-btn ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>7 ngày</button>
            <button className={`filter-btn ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>Tháng</button>
            <button className={`filter-btn ${period === '90d' ? 'active' : ''}`} onClick={() => setPeriod('90d')}>Quý</button>
          </div>
          <div className="filter-group">
            <button className={`filter-btn ${grade === 'all' ? 'active' : ''}`} onClick={() => setGrade('all')}>Tất cả lớp</button>
            <button className={`filter-btn ${grade === '10' ? 'active' : ''}`} onClick={() => setGrade('10')}>Lớp 10</button>
            <button className={`filter-btn ${grade === '11' ? 'active' : ''}`} onClick={() => setGrade('11')}>Lớp 11</button>
            <button className={`filter-btn ${grade === '12' ? 'active' : ''}`} onClick={() => setGrade('12')}>Lớp 12</button>
          </div>
          <button className="refresh-button" onClick={() => {
            topCoursesQuery.refetch();
            topInstructorsQuery.refetch();
            overviewQuery.refetch();
          }}>
            <RefreshCw size={18} className={isFetching ? 'admin-finance-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="bento-kpi-grid">
        <motion.div className="featured-kpi" variants={itemVariants}>
          <div className="featured-kpi-icon-bg">
            <TrendingUp size={180} strokeWidth={1} />
          </div>
          <div className="featured-kpi-content">
            <div className="kpi-label-large">Doanh số khóa học tổng quát</div>
            <p className="kpi-value-large">{formatCurrency(overview?.totalRevenue || 0)}</p>
            <div className="metric-trend positive" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800 }}>
              <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '8px' }}>
                <TrendingUp size={20} />
              </div>
              <span style={{ fontSize: '1.05rem' }}>+12.4% so với chu kỳ trước</span>
            </div>
          </div>
        </motion.div>

        <div className="kpi-sidebar">
          <motion.div className="kpi-card" variants={itemVariants}>
            <div className="kpi-icon"><BookOpen size={28} /></div>
            <div className="kpi-content">
              <h3>Đầu mục khóa học</h3>
              <p>{topCourses.length} Khóa học Top</p>
            </div>
          </motion.div>
          <motion.div className="kpi-card" variants={itemVariants}>
            <div className="kpi-icon"><Users size={28} /></div>
            <div className="kpi-content">
              <h3>Giảng viên tích cực</h3>
              <p>{overview?.totalInstructors || 0} Đối tác</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Spotlight Podium Section */}
      <div className="spotlight-section">
        <div className="section-title-row">
          <Trophy size={32} color="var(--ana-terracotta)" strokeWidth={2.5} />
          <h2>Vinh danh dẫn đầu</h2>
        </div>
        
        <div className="spotlight-grid">
          {(activeTab === 'courses' ? spotlightCourses : spotlightInstructors).map((item: any, idx) => (
            <motion.div 
              key={idx} 
              className={`spotlight-card rank-${idx + 1}`}
              variants={itemVariants}
            >
              <div className="spotlight-badge">{idx + 1}</div>
              <div className="spotlight-image-container">
                <img 
                  src={getAssetUrl(
                    activeTab === 'courses' ? (item as MarketplaceTopCourse).thumbnailUrl : (item as MarketplaceTopInstructor).avatarUrl,
                    activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName
                  )} 
                  alt="" 
                  className="spotlight-image"
                  onError={(e) => {
                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName)}&background=random&size=512`;
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
                <div className="spotlight-overlay">
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.35rem' }}>
                    {activeTab === 'courses' ? 'Top Performance' : 'Elite Instructor'}
                  </div>
                  <h3>{activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName}</h3>
                </div>
              </div>
              <div className="spotlight-content">
                <div className="spotlight-metrics">
                  <div className="s-metric">
                    <label>{activeTab === 'courses' ? 'Sinh viên' : 'Khóa học'}</label>
                    <span>{activeTab === 'courses' ? (item as MarketplaceTopCourse).salesCount.toLocaleString() : (item as MarketplaceTopInstructor).courseCount}</span>
                  </div>
                  <div className="s-metric">
                    <label>Doanh thu</label>
                    <span>{formatCurrency(item.totalRevenue)}</span>
                  </div>
                </div>
                <div className="spotlight-footer">
                  <div className="rating-display">
                    <Star size={16} fill="#b45309" stroke="none" />
                    <span>{(item as any).avgRating.toFixed(1)} Rating</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ana-stone-gray)' }}>
                    {activeTab === 'courses' ? 'Khóa học phổ biến' : 'Chuyên gia hàng đầu'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabbed Ledger Section */}
      <div className="performers-ledger">
        <div className="ledger-header">
          <div className="analytics-tabs">
            <button className={`tab-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>Top Khóa học</button>
            <button className={`tab-item ${activeTab === 'instructors' ? 'active' : ''}`} onClick={() => setActiveTab('instructors')}>Top Giảng viên</button>
          </div>
          <div className="search-box">
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ana-stone-gray)', zIndex: 1 }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              {activeTab === 'courses' ? (
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th>Sinh viên</th>
                  <th>Doanh thu</th>
                  <th>Đánh giá</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Giảng viên</th>
                  <th>Khóa học</th>
                  <th>Sinh viên</th>
                  <th>Doanh thu</th>
                  <th>Đánh giá</th>
                </tr>
              )}
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {(activeTab === 'courses' ? filteredCourses : filteredInstructors).map((item: any, idx) => (
                  <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                    <td><span className="rank-text">#{idx + 1}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <img 
                          src={getAssetUrl(
                            activeTab === 'courses' ? (item as MarketplaceTopCourse).thumbnailUrl : (item as MarketplaceTopInstructor).avatarUrl,
                            activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName
                          )} 
                          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--ana-border-cream)' }}
                          alt=""
                          onError={(e) => {
                            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName)}&background=random&size=128`;
                            if ((e.target as HTMLImageElement).src !== fallback) {
                              (e.target as HTMLImageElement).src = fallback;
                            }
                          }}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--ana-near-black)' }}>{activeTab === 'courses' ? (item as MarketplaceTopCourse).courseTitle : (item as MarketplaceTopInstructor).instructorName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ana-olive-gray)', fontWeight: 500 }}>{activeTab === 'courses' ? (item as MarketplaceTopCourse).instructorName : (item as MarketplaceTopInstructor).courseCount}</td>
                    <td style={{ fontWeight: 600 }}>{activeTab === 'courses' ? (item as MarketplaceTopCourse).salesCount.toLocaleString() : (item as MarketplaceTopInstructor).totalStudents.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: 'var(--ana-terracotta)' }}>{formatCurrency(item.totalRevenue)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 800 }}>
                        <Star size={16} fill="#b45309" stroke="none" />
                        {item.avgRating.toFixed(1)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Insights Grid */}
      <div className="insights-grid">
        <motion.div className="chart-card" variants={itemVariants}>
          <h3>Cơ cấu Doanh thu</h3>
          <p>Phân bổ doanh thu của Top 5 sản phẩm dẫn đầu</p>
          <div style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCourses.slice(0, 5)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="courseTitle" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="totalRevenue" radius={[0, 10, 10, 0]} barSize={30}>
                  {topCourses.slice(0, 5).map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="chart-card" variants={itemVariants}>
          <h3>Tỷ trọng Sinh viên</h3>
          <p>Phân bổ thị phần sinh viên theo khóa học</p>
          <div style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCourses.slice(0, 5)}
                  dataKey="salesCount"
                  nameKey="courseTitle"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                >
                  {topCourses.slice(0, 5).map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div className="insight-footer" variants={itemVariants}>
        <div className="section-title-row">
          <Info size={24} color="var(--ana-terracotta)" />
          <h4>Phân tích & Định nghĩa Chỉ số</h4>
        </div>
        <div className="insight-grid">
          <div className="insight-item">
            <strong>Phân tích thị trường</strong>
            <p>Dữ liệu được tổng hợp dựa trên các giao dịch thực tế trong chu kỳ được chọn. Thứ hạng "Spotlight" phản ánh độ hiệu quả kinh doanh và uy tín của nội dung.</p>
          </div>
          <div className="insight-item">
            <strong>Chu kỳ báo cáo</strong>
            <p>Các chỉ số được cập nhật theo thời gian thực. Để so sánh dữ liệu lịch sử, vui lòng chọn bộ lọc thời gian tương ứng ở đầu trang.</p>
          </div>
          <div className="insight-item">
            <strong>Chỉ số Rating</strong>
            <p>Được tính dựa trên đánh giá trung bình của học viên và tỷ lệ hoàn thành khóa học trong chu kỳ báo cáo.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MarketplaceAnalytics;
