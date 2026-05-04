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
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [tokenRemaining, setTokenRemaining] = useState<number | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const { unreadCount, notifications, markAllAsRead } = useNotificationsContext();
  const notificationsPreview = notifications.slice(0, 3);
  const unreadCountLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  const roleLabelByRole: Record<string, string> = {
    teacher: 'Giáo viên',
    student: 'Học sinh',
    admin: 'Quản trị viên',
  };
  const roleLabel = roleLabelByRole[user.role] ?? 'Quản trị viên';

  const avatarValue = user.avatar?.trim() || '';
  const hasAvatarImage = /^https?:\/\//i.test(avatarValue) && failedAvatarUrl !== avatarValue;
  const fallbackAvatar = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(-2)
    .toUpperCase();

  let walletRoute = '/student/wallet';
  if (user.role === 'teacher') walletRoute = '/teacher/wallet';
  const showWalletAction = user.role !== 'admin';

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

    globalThis.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleRefresh);
    globalThis.addEventListener('authChange', handleRefresh);

    const timer = globalThis.setInterval(() => {
      void fetchToken();
    }, 60000);

    return () => {
      mounted = false;
      globalThis.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleRefresh);
      globalThis.removeEventListener('authChange', handleRefresh);
      globalThis.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!showNotifications) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    const closeOnClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedInsideDropdown = target.closest('.notifications-dropdown');
      const clickedToggle = target.closest('.notifications-toggle');
      if (clickedInsideDropdown || clickedToggle) return;
      setShowNotifications(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnClickOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnClickOutside);
    };
  }, [showNotifications]);

  const getNotificationIcon = (notificationType?: string) => {
    const normalizedType = notificationType?.toLowerCase();
    if (normalizedType === 'assignment') return '📘';
    if (normalizedType === 'grade') return '✅';
    if (normalizedType === 'course') return '📚';
    if (notificationType === 'PROFILE_VERIFICATION') return '🛡️';
    return '🔔';
  };

  return (
    <nav className="navbar-top">
      <div className="navbar-content">
        <div className="navbar-actions">
          <button
            className="navbar-action-btn notifications-toggle"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Thông báo"
            aria-expanded={showNotifications}
            aria-haspopup="dialog"
          >
            <Bell size={18} className="action-icon" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCountLabel}</span>}
          </button>

          {showWalletAction && (
            <Link to={walletRoute} className="navbar-action-btn wallet-btn" aria-label="Ví của tôi">
              <Wallet size={18} className="action-icon" />
            </Link>
          )}

          {tokenRemaining !== null && (
            <Link
              to="/pricing"
              className="token-chip"
              aria-label={`Token subscription còn lại ${tokenRemaining}`}
            >
              <span className="token-chip-label">Token</span>
              <strong>{tokenRemaining}</strong>
            </Link>
          )}

          <Link to="/help" className="navbar-action-btn help-btn" aria-label="Trợ giúp">
            <CircleHelp size={18} className="action-icon" />
          </Link>

          <div className="navbar-user-badge" aria-label="Thông tin người dùng">
            <div className="navbar-user-avatar" aria-hidden="true">
              {hasAvatarImage ? (
                <img
                  src={avatarValue}
                  alt=""
                  className="navbar-user-avatar-image"
                  onError={() => setFailedAvatarUrl(avatarValue)}
                />
              ) : (
                fallbackAvatar || 'ND'
              )}
            </div>
            <div className="navbar-user-meta">
              <div className="navbar-user-name">{user.name}</div>
              <div className="navbar-user-role">{roleLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="notifications-dropdown" aria-label="Danh sách thông báo">
          <div className="notifications-header">
            <h3>Thông báo</h3>
            <button className="mark-all-read" onClick={() => markAllAsRead()}>
              Đánh dấu đã đọc
            </button>
          </div>
          <div className="notifications-list">
            {notificationsPreview.map((notif) => (
              <div key={notif.id} className={`notification-item${notif.read ? '' : ' unread'}`}>
                <div className="notification-icon">{getNotificationIcon(notif.type)}</div>
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
              <div className="notification-empty-state">Chưa có thông báo nào</div>
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
