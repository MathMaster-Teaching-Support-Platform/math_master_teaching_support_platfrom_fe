import { Bell, CircleHelp, MessageSquare, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [showNotifications, setShowNotifications] = useState(false);

  const roleLabel =
    user.role === 'teacher' ? 'Giao vien' : user.role === 'student' ? 'Hoc sinh' : 'Quan tri vien';

  const walletRoute = '/student/wallet';

  return (
    <nav className="navbar-top">
      <div className="navbar-content">
        <div className="navbar-actions">
          <button
            className="navbar-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Thông báo"
          >
            <Bell size={18} className="action-icon" />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <Link to={walletRoute} className="navbar-action-btn wallet-btn" aria-label="Ví của tôi">
            <Wallet size={18} className="action-icon" />
          </Link>

          <Link to="/messages" className="navbar-action-btn message-btn" aria-label="Tin nhắn">
            <MessageSquare size={18} className="action-icon" />
          </Link>

          <Link to="/help" className="navbar-action-btn help-btn" aria-label="Trợ giúp">
            <CircleHelp size={18} className="action-icon" />
          </Link>

          <div className="navbar-user-badge" aria-label="Thông tin người dùng">
            <div className="navbar-user-avatar">{user.avatar}</div>
            <div className="navbar-user-meta">
              <div className="navbar-user-name">{user.name}</div>
              <div className="navbar-user-role">{roleLabel}</div>
            </div>
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
              <div className="notification-icon">📘</div>
              <div className="notification-content">
                <div className="notification-title">Bài tập mới</div>
                <div className="notification-message">Bài tập về Mệnh đề đã được giao</div>
                <div className="notification-time">5 phút trước</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">✅</div>
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
