import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../../services/api/auth.service';
import './Navbar.css';

interface NavbarProps {
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  notificationCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, notificationCount = 0 }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    AuthService.removeToken();
    setShowProfileMenu(false);
    navigate('/login');
  };

  return (
    <nav className="navbar-top">
      <div className="navbar-content">
        <div className="navbar-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học, tài liệu, bài tập..."
            className="search-input"
          />
        </div>

        <div className="navbar-actions">
          <button
            className="navbar-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="action-icon">🔔</span>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <Link to="/messages" className="navbar-action-btn">
            <span className="action-icon">💬</span>
          </Link>

          <Link to="/help" className="navbar-action-btn">
            <span className="action-icon">❓</span>
          </Link>

          <div className="navbar-profile">
            <button
              className="profile-trigger"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar">{user.avatar}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">
                  {user.role === 'teacher'
                    ? 'Giáo viên'
                    : user.role === 'student'
                      ? 'Học sinh'
                      : 'Quản trị viên'}
                </div>
              </div>
              <span className="profile-arrow">▼</span>
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <Link to="/profile" className="profile-menu-item">
                  <span>👤</span> Hồ sơ
                </Link>
                <Link to="/settings" className="profile-menu-item">
                  <span>⚙️</span> Cài đặt
                </Link>
                <Link to="/help" className="profile-menu-item">
                  <span>❓</span> Trợ giúp
                </Link>
                <hr className="menu-divider" />
                <button onClick={handleLogout} className="profile-menu-item danger">
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Thông báo</h3>
            <button className="mark-all-read">Đánh dấu đã đọc</button>
          </div>
          <div className="notifications-list">
            <div className="notification-item unread">
              <div className="notification-icon">📝</div>
              <div className="notification-content">
                <div className="notification-title">Bài tập mới</div>
                <div className="notification-message">Bài tập về Mệnh đề đã được giao</div>
                <div className="notification-time">5 phút trước</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">⭐</div>
              <div className="notification-content">
                <div className="notification-title">Điểm số mới</div>
                <div className="notification-message">
                  Bài kiểm tra của bạn đã được chấm: 8.5/10
                </div>
                <div className="notification-time">1 giờ trước</div>
              </div>
            </div>
          </div>
          <Link to="/notifications" className="view-all-notifications">
            Xem tất cả
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
