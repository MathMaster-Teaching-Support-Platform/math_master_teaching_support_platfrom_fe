import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck2,
  FileQuestion,
  FileStack,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LineChart,
  LogOut,
  NotebookTabs,
  Presentation,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthService } from '../../../services/api/auth.service';
import './Sidebar.css';

interface SidebarProps {
  role: 'teacher' | 'student' | 'admin';
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface MenuGroup {
  label: string | null;
  items: MenuItem[];
}

const teacherGroups: MenuGroup[] = [
  {
    label: null,
    items: [{ path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Nội dung',
    items: [
      { path: '/teacher/courses', icon: BookOpen, label: 'Giáo Trình' },
      { path: '/teacher/lesson-plans', icon: ClipboardList, label: 'Giáo Án' },
      { path: '/teacher/materials', icon: FolderKanban, label: 'Tài liệu' },
      { path: '/teacher/mindmaps', icon: Workflow, label: 'Mindmap' },
      { path: '/teacher/exam-matrices', icon: Ruler, label: 'Ma trận đề' },
      { path: '/teacher/question-templates', icon: FileQuestion, label: 'Mẫu câu hỏi' },
      { path: '/teacher/question-banks', icon: Database, label: 'Ngân hàng câu hỏi' },
      { path: '/teacher/questions', icon: ClipboardList, label: 'Câu hỏi của tôi' },
      { path: '/teacher/assessment-builder', icon: Sparkles, label: 'Trình tạo đề' },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { path: '/teacher/assignments', icon: ClipboardCheck, label: 'Bài tập' },
      { path: '/teacher/assessments', icon: FileCheck2, label: 'Kiểm tra' },
      { path: '/teacher/grading', icon: FileStack, label: 'Chấm bài' },
      { path: '/teacher/students', icon: Users, label: 'Học sinh' },
      { path: '/pricing', icon: CreditCard, label: 'Gói đăng ký' },
      { path: '/teacher/analytics', icon: LineChart, label: 'Phân tích' },
    ],
  },
  {
    label: 'Công cụ',
    items: [
      { path: '/teacher/ai-assistant', icon: Bot, label: 'AI Trợ lý' },
      { path: '/teacher/ai-slide-generator', icon: Presentation, label: 'AI Slide Gen' },
      { path: '/teacher/resources', icon: Library, label: 'Tài nguyên' },
    ],
  },
];

const studentGroups: MenuGroup[] = [
  {
    label: null,
    items: [
      { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/student/courses', icon: GraduationCap, label: 'Giáo Trình' },
      { path: '/student/assignments', icon: NotebookTabs, label: 'Bài tập' },
      { path: '/student/assessments', icon: FileCheck2, label: 'Bài kiểm tra' },
      { path: '/student/grades', icon: LineChart, label: 'Điểm số' },
      { path: '/student/roadmap', icon: Workflow, label: 'Lộ trình' },
      { path: '/pricing', icon: CreditCard, label: 'Gói đăng ký' },
    ],
  },
  {
    label: 'Giáo viên',
    items: [{ path: '/submit-teacher-profile', icon: ShieldCheck, label: 'Đăng ký Giáo viên' }],
  },
];

const adminGroups: MenuGroup[] = [
  {
    label: null,
    items: [{ path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Người dùng',
    items: [
      { path: '/admin/users', icon: Users, label: 'Người dùng' },
      { path: '/admin/review-profiles', icon: FileCheck2, label: 'Duyệt Profile' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/admin/subscriptions', icon: CreditCard, label: 'Gói đăng ký' },
      { path: '/admin/transactions', icon: ArrowLeftRight, label: 'Giao dịch' },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { path: '/admin/roadmaps', icon: Workflow, label: 'Lộ trình' },
      { path: '/admin/templates', icon: FileStack, label: 'Mẫu' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [{ path: '/admin/analytics', icon: LineChart, label: 'Thống kê' }],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ role, collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.removeToken();
    navigate('/login');
  };

  let groups: MenuGroup[];
  if (role === 'teacher') groups = teacherGroups;
  else if (role === 'student') groups = studentGroups;
  else groups = adminGroups;

  const settingsPath = `/${role}/settings`;

  const isActive = (path: string) => {
    if (path.endsWith('/dashboard')) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <Link to={AuthService.getDashboardUrl()} className="sidebar-logo">
          <span className="sb-logo-icon">∑π</span>
          {!collapsed && <span className="sb-logo-text">MathMaster</span>}
        </Link>
      </div>

      {/* Collapse toggle — floating on right edge */}
      <button className="sb-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <ChevronLeft size={13} strokeWidth={2.5} />
        <ChevronLeft size={13} strokeWidth={2.5} />
      </button>

      {/* Role Switcher */}
      {role !== 'admin' && AuthService.hasRole('teacher') && (
        <div
          className="sb-group sb-role-switcher"
          style={{
            marginTop: '0',
            borderBottom: '1px solid var(--gray-200)',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <Link
            to={role === 'student' ? '/teacher/dashboard' : '/student/dashboard'}
            className="sb-item sb-item--switch"
            style={{ color: 'var(--primary-color)', fontWeight: '600' }}
          >
            <span className="sb-icon">
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </span>
            {!collapsed && (
              <span className="sb-label">
                {role === 'student' ? 'Giao diện Giáo viên' : 'Giao diện Học sinh'}
              </span>
            )}
            {collapsed && (
              <span className="sb-tooltip">
                {role === 'student' ? 'Giao diện Giáo viên' : 'Giao diện Học sinh'}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.label ?? '__root'} className="sb-group">
            {group.label && !collapsed && <p className="sb-group-label">{group.label}</p>}
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sb-item${isActive(item.path) ? ' active' : ''}`}
              >
                <span className="sb-icon">
                  <item.icon size={16} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sb-label">{item.label}</span>}
                {collapsed && <span className="sb-tooltip">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link to={settingsPath} className={`sb-item${isActive(settingsPath) ? ' active' : ''}`}>
          <span className="sb-icon">
            <Settings size={16} strokeWidth={2} />
          </span>
          {!collapsed && <span className="sb-label">Cài đặt</span>}
          {collapsed && <span className="sb-tooltip">Cài đặt</span>}
        </Link>
        <button onClick={handleLogout} className="sb-item sb-item--logout">
          <span className="sb-icon">
            <LogOut size={16} strokeWidth={2} />
          </span>
          {!collapsed && <span className="sb-label">Đăng xuất</span>}
          {collapsed && <span className="sb-tooltip">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
