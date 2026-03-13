import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Workflow,
  FileQuestion,
  Ruler,
  ClipboardCheck,
  FileCheck2,
  Users,
  LineChart,
  Bot,
  Library,
  GraduationCap,
  NotebookTabs,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  FileStack,
  Settings,
  LogOut,
} from 'lucide-react';
import { AuthService } from '../../../services/api/auth.service';
import './Sidebar.css';

interface SidebarProps {
  role: 'teacher' | 'student' | 'admin';
}

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.removeToken();
    navigate('/login');
  };

<<<<<<< Updated upstream
  const teacherMenuItems: MenuItem[] = [
    { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/teacher/courses', icon: BookOpen, label: 'Khóa học' },
    { path: '/teacher/materials', icon: FolderKanban, label: 'Tài liệu' },
    { path: '/teacher/mindmaps', icon: Workflow, label: 'Mindmap' },
    { path: '/teacher/question-templates', icon: FileQuestion, label: 'Mẫu câu hỏi' },
    { path: '/teacher/exam-matrices', icon: Ruler, label: 'Ma trận đề' },
    { path: '/teacher/assignments', icon: ClipboardCheck, label: 'Bài tập' },
    { path: '/teacher/assessments', icon: FileCheck2, label: 'Kiểm tra' },
    { path: '/teacher/students', icon: Users, label: 'Học sinh' },
    { path: '/teacher/analytics', icon: LineChart, label: 'Phân tích' },
    { path: '/teacher/ai-assistant', icon: Bot, label: 'AI Trợ lý' },
    { path: '/teacher/resources', icon: Library, label: 'Tài nguyên' },
=======
  const teacherMenuItems = [
    { path: '/teacher/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/teacher/courses', icon: '📚', label: 'Khóa học' },
    { path: '/teacher/materials', icon: '📝', label: 'Tài liệu' },
    { path: '/teacher/mindmaps', icon: '🗺️', label: 'Mindmap' },
    { path: '/teacher/question-templates', icon: '📄', label: 'Mẫu câu hỏi' },
    { path: '/teacher/exam-matrices', icon: '🧩', label: 'Ma trận đề' },
    { path: '/teacher/assignments', icon: '✍️', label: 'Bài tập' },
    { path: '/teacher/assessments', icon: '📝', label: 'Kiểm tra' },
    { path: '/teacher/students', icon: '👥', label: 'Học sinh' },
    { path: '/teacher/analytics', icon: '📈', label: 'Phân tích' },
    { path: '/teacher/ai-assistant', icon: '🤖', label: 'AI Trợ lý' },
    { path: '/teacher/resources', icon: '🗂️', label: 'Tài nguyên' },
>>>>>>> Stashed changes
  ];

  const studentMenuItems: MenuItem[] = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/courses', icon: GraduationCap, label: 'Khóa học' },
    { path: '/student/assignments', icon: NotebookTabs, label: 'Bài tập' },
    { path: '/student/grades', icon: FileCheck2, label: 'Điểm số' },
    { path: '/student/roadmap', icon: Workflow, label: 'Lộ trình' },
    { path: '/student/ai-assistant', icon: Bot, label: 'AI Trợ lý' },
    { path: '/student/wallet', icon: Wallet, label: 'Ví của tôi' },
  ];

  const adminMenuItems: MenuItem[] = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
    { path: '/admin/subscriptions', icon: CreditCard, label: 'Gói đăng ký' },
    { path: '/admin/transactions', icon: ArrowLeftRight, label: 'Giao dịch' },
    { path: '/admin/templates', icon: FileStack, label: 'Mẫu' },
    { path: '/admin/analytics', icon: LineChart, label: 'Thống kê' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const menuItems =
    role === 'teacher' ? teacherMenuItems : role === 'student' ? studentMenuItems : adminMenuItems;

  const settingsPath = role === 'teacher' ? '/teacher/settings' : `/${role}/settings`;

  const isActivePath = (itemPath: string) => {
    if (itemPath.endsWith('/dashboard')) {
      return location.pathname === itemPath;
    }

    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to={AuthService.getDashboardUrl()} className="sidebar-logo">
          <span className="logo-icon">∑π</span>
          <span className="logo-text">MathMaster</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
<<<<<<< Updated upstream
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActivePath(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">
              <item.icon size={18} strokeWidth={2.2} />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
=======
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/teacher/dashboard' && location.pathname.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
>>>>>>> Stashed changes
      </nav>

      <div className="sidebar-footer">
        <Link
          to={settingsPath}
          className={`sidebar-item ${isActivePath(settingsPath) ? 'active' : ''}`}
        >
          <span className="sidebar-icon">
            <Settings size={18} strokeWidth={2.2} />
          </span>
          <span className="sidebar-label">Cài đặt</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-item">
          <span className="sidebar-icon">
            <LogOut size={18} strokeWidth={2.2} />
          </span>
          <span className="sidebar-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
