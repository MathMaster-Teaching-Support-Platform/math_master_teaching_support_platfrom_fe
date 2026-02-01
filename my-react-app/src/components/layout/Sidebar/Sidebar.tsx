import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthService } from '../../../services/api/auth.service';
import './Sidebar.css';

interface SidebarProps {
  role: 'teacher' | 'student' | 'admin';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.removeToken();
    navigate('/login');
  };

  const teacherMenuItems = [
    { path: '/teacher/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/teacher/courses', icon: '📚', label: 'Khóa học' },
    { path: '/teacher/materials', icon: '📝', label: 'Tài liệu' },
    { path: '/teacher/assignments', icon: '✍️', label: 'Bài tập' },
    { path: '/teacher/students', icon: '👥', label: 'Học sinh' },
    { path: '/teacher/analytics', icon: '📈', label: 'Phân tích' },
    { path: '/teacher/ai-assistant', icon: '🤖', label: 'AI Trợ lý' },
    { path: '/teacher/resources', icon: '🗂️', label: 'Tài nguyên' },
  ];

  const studentMenuItems = [
    { path: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/student/courses', icon: '📚', label: 'Khóa học' },
    { path: '/student/assignments', icon: '✍️', label: 'Bài tập' },
    { path: '/student/grades', icon: '📝', label: 'Điểm số' },
    { path: '/student/roadmap', icon: '🗺️', label: 'Lộ trình' },
    { path: '/student/ai-assistant', icon: '🤖', label: 'AI Trợ lý' },
    { path: '/student/wallet', icon: '💰', label: 'Ví của tôi' },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Người dùng' },
    { path: '/admin/subscriptions', icon: '💳', label: 'Gói đăng ký' },
    { path: '/admin/transactions', icon: '💰', label: 'Giao dịch' },
    { path: '/admin/templates', icon: '📄', label: 'Mẫu' },
    { path: '/admin/analytics', icon: '📈', label: 'Thống kê' },
    { path: '/admin/settings', icon: '⚙️', label: 'Cài đặt' },
  ];

  const menuItems =
    role === 'teacher' ? teacherMenuItems : role === 'student' ? studentMenuItems : adminMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="logo-icon">∑π</span>
          <span className="logo-text">MathMaster</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className="sidebar-item">
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">Cài đặt</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-item">
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
