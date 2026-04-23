import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './NotificationCenter.css';

import { useNotificationsContext } from '../../context/NotificationContext';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsContext();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const normalizeType = (type: string) => type.toLowerCase();

  const filteredNotifications = notifications.filter((notif) => {
    const matchReadStatus =
      filter === 'all' ? true : filter === 'unread' ? !notif.read : notif.read;

    const matchType =
      typeFilter === 'all' ? true : normalizeType(notif.type) === normalizeType(typeFilter);

    return matchReadStatus && matchType;
  });

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    high: notifications.filter((n) => n.metadata && n.metadata.priority === 'high' && !n.read).length,
  };

  const getNotificationIcon = (type: string) => {
    switch (normalizeType(type)) {
      case 'assignment':
        return '📝';
      case 'grade':
        return '📊';
      case 'course':
        return '📚';
      case 'system':
        return '⚙️';
      case 'payment':
        return '💰';
      case 'message':
        return '💬';
      case 'PROFILE_VERIFICATION':
        return '🛡️';
      default:
        return '🔔';
    }
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={stats.unread}
    >
      <div className="notification-center-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔔 Trung Tâm Thông Báo</h1>
            <p className="page-subtitle">Quản lý tất cả thông báo của bạn</p>
          </div>
          <button className="btn btn-outline" onClick={markAllAsRead}>
            ✅ Đánh dấu đã đọc tất cả
          </button>
        </div>

        {/* Stats */}
        <div className="notification-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              🔔
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng thông báo</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              ✉️
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.unread}</div>
              <div className="stat-label">Chưa đọc</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              ⚠️
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.high}</div>
              <div className="stat-label">Ưu tiên cao</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="notification-filters">
          <div className="filter-group">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Chưa đọc ({stats.unread})
            </button>
            <button
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Đã đọc ({stats.total - stats.unread})
            </button>
          </div>

          <select
            className="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value="assignment">📝 Bài tập</option>
            <option value="grade">📊 Điểm số</option>
            <option value="course">📚 Giáo Trình</option>
            <option value="system">⚙️ Hệ thống</option>
            <option value="payment">💰 Thanh toán</option>
            <option value="message">💬 Tin nhắn</option>
            <option value="PROFILE_VERIFICATION">🛡️ Hệ thống kiểm duyệt</option>
          </select>
        </div>

        {/* Notifications List */}
        <div className="notifications-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Không có thông báo</h3>
              <p>Bạn đã xem hết tất cả thông báo</p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'} priority-${(notif.metadata && notif.metadata.priority) ? notif.metadata.priority : 'normal'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.read && <div className="unread-indicator"></div>}

                  <div className="notification-icon">{getNotificationIcon(notif.type)}</div>

                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 className="notification-title">{notif.title}</h4>
                      {/* notif.priority === 'high' could be extracted from metadata if needed */}
                    </div>
                    <p className="notification-message">{notif.content}</p>
                    <div className="notification-footer">
                      <span className="notification-time">⏱️ {new Date(notif.createdAt).toLocaleString()}</span>
                      <span className={`notification-type type-${notif.type}`}>
                        {normalizeType(notif.type) === 'assignment'
                          ? '📝 Bài tập'
                          : normalizeType(notif.type) === 'grade'
                            ? '📊 Điểm số'
                            : normalizeType(notif.type) === 'course'
                              ? '📚 Giáo Trình'
                              : normalizeType(notif.type) === 'system'
                                ? '⚙️ Hệ thống'
                                : normalizeType(notif.type) === 'payment'
                                  ? '💰 Thanh toán'
                                  : normalizeType(notif.type) === 'profile_verification'
                                    ? '🛡️ Kiểm duyệt'
                                    : '💬 Tin nhắn'}
                      </span>
                    </div>
                  </div>

                  {/* actionUrl could be retrieved from metadata */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 &&
          filteredNotifications.length < notifications.length && (
            <div className="load-more-container">
              <button className="btn btn-outline">Xem thêm thông báo</button>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationCenter;
