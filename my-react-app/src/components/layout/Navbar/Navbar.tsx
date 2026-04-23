import { Bell, CircleHelp, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationsContext } from '../../../context/NotificationContext';
import { AuthService } from '../../../services/api/auth.service';
import {
  SUBSCRIPTION_UPDATED_EVENT,
  SubscriptionPlanService,
} from '../../../services/api/subscription-plan.service';
import './Navbar.css';

interface NavbarProps {
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  notificationCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [tokenRemaining, setTokenRemaining] = useState<number | null>(null);
  const { unreadCount, notifications, markAllAsRead } = useNotificationsContext();

  const roleLabel =
    user.role === 'teacher' ? 'Giao vien' : user.role === 'student' ? 'Hoc sinh' : 'Quan tri vien';

  const walletRoute = user.role === 'teacher' ? '/teacher/wallet' : '/student/wallet';

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    let mounted = true;

    const fetchToken = async () => {
      try {
        const res = await SubscriptionPlanService.getMySubscription();
        if (!mounted) return;
        setTokenRemaining(res.result?.tokenRemaining ?? null);
      } catch {
        if (!mounted) return;
        setTokenRemaining(null);
      }
    };

    void fetchToken();

    const handleRefresh = () => {
      void fetchToken();
    };

    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleRefresh);
    window.addEventListener('authChange', handleRefresh);

    const timer = window.setInterval(() => {
      void fetchToken();
    }, 60000);

    return () => {
      mounted = false;
      window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleRefresh);
      window.removeEventListener('authChange', handleRefresh);
      window.clearInterval(timer);
    };
  }, []);

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
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          <Link to={walletRoute} className="navbar-action-btn wallet-btn" aria-label="Ví của tôi">
            <Wallet size={18} className="action-icon" />
          </Link>

          {tokenRemaining !== null && (
            <Link to="/pricing" className="token-chip" aria-label="Token subscription còn lại">
              <span className="token-chip-label">Token</span>
              <strong>{tokenRemaining}</strong>
            </Link>
          )}

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
            <button className="mark-all-read" onClick={() => markAllAsRead()}>
              Đánh dấu đã đọc
            </button>
          </div>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                <div className="notification-icon">
                  {notif.type?.toLowerCase() === 'assignment'
                    ? '📘'
                    : notif.type?.toLowerCase() === 'grade'
                      ? '✅'
                      : notif.type?.toLowerCase() === 'course'
                        ? '📚'
                      : notif.type === 'PROFILE_VERIFICATION'
                        ? '🛡️'
                        : '🔔'}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.content}</div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                Chưa có thông báo nào
              </div>
            )}
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
