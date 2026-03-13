import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './NotificationCenter.css';

interface Notification {
  id: number;
  type: 'assignment' | 'grade' | 'course' | 'system' | 'payment' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
  actionUrl?: string;
}

const NotificationCenter: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const allNotifications: Notification[] = [
    {
      id: 1,
      type: 'assignment',
      title: 'Bài tập mới',
      message: 'Giáo viên Nguyễn Văn A đã giao bài tập "Phương trình bậc 2"',
      time: '2 phút trước',
      read: false,
      priority: 'high',
    },
    {
      id: 2,
      type: 'grade',
      title: 'Điểm mới',
      message: 'Bạn đã nhận điểm 9.5 cho bài kiểm tra Toán học',
      time: '15 phút trước',
      read: false,
      priority: 'normal',
    },
    {
      id: 3,
      type: 'course',
      title: 'Bài học mới',
      message: 'Bài học "Đạo hàm hàm số" đã được thêm vào Giáo Trình Toán 11',
      time: '1 giờ trước',
      read: true,
      priority: 'normal',
    },
    {
      id: 4,
      type: 'system',
      title: 'Cập nhật hệ thống',
      message: 'Hệ thống sẽ bảo trì từ 23:00 - 01:00 đêm nay',
      time: '2 giờ trước',
      read: false,
      priority: 'high',
    },
    {
      id: 5,
      type: 'payment',
      title: 'Thanh toán thành công',
      message: 'Bạn đã nạp thành công 500,000đ vào ví',
      time: '3 giờ trước',
      read: true,
      priority: 'normal',
    },
    {
      id: 6,
      type: 'message',
      title: 'Tin nhắn mới',
      message: 'Giáo viên Trần Thị B đã gửi tin nhắn cho bạn',
      time: '5 giờ trước',
      read: false,
      priority: 'normal',
    },
    {
      id: 7,
      type: 'assignment',
      title: 'Sắp đến hạn',
      message: 'Bài tập "Phương trình logarit" sẽ hết hạn trong 2 ngày',
      time: '1 ngày trước',
      read: true,
      priority: 'high',
    },
    {
      id: 8,
      type: 'grade',
      title: 'Bài đã chấm',
      message: 'Giáo viên đã chấm xong bài tập "Hình học không gian"',
      time: '1 ngày trước',
      read: true,
      priority: 'normal',
    },
    {
      id: 9,
      type: 'course',
      title: 'Giáo Trình mới',
      message: 'Bạn đã được thêm vào Giáo Trình "Toán nâng cao lớp 12"',
      time: '2 ngày trước',
      read: true,
      priority: 'normal',
    },
    {
      id: 10,
      type: 'system',
      title: 'Tính năng mới',
      message: 'Khám phá tính năng AI trợ giảng 24/7',
      time: '3 ngày trước',
      read: true,
      priority: 'low',
    },
    {
      id: 11,
      type: 'payment',
      title: 'Hóa đơn',
      message: 'Hóa đơn tháng 1 đã sẵn sàng để xem',
      time: '4 ngày trước',
      read: true,
      priority: 'low',
    },
    {
      id: 12,
      type: 'message',
      title: 'Phản hồi',
      message: 'Admin đã phản hồi yêu cầu hỗ trợ của bạn',
      time: '5 ngày trước',
      read: true,
      priority: 'normal',
    },
  ];

  const filteredNotifications = allNotifications.filter((notif) => {
    const matchReadStatus =
      filter === 'all' ? true : filter === 'unread' ? !notif.read : notif.read;

    const matchType = typeFilter === 'all' ? true : notif.type === typeFilter;

    return matchReadStatus && matchType;
  });

  const stats = {
    total: allNotifications.length,
    unread: allNotifications.filter((n) => !n.read).length,
    high: allNotifications.filter((n) => n.priority === 'high' && !n.read).length,
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
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
      default:
        return '🔔';
    }
  };

  const markAsRead = (id: number) => {
    const notif = allNotifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  };

  const markAllAsRead = () => {
    allNotifications.forEach((n) => (n.read = true));
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
                  className={`notification-item ${notif.read ? 'read' : 'unread'} priority-${notif.priority}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.read && <div className="unread-indicator"></div>}

                  <div className="notification-icon">{getNotificationIcon(notif.type)}</div>

                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 className="notification-title">{notif.title}</h4>
                      {notif.priority === 'high' && (
                        <span className="priority-badge">⚠️ Quan trọng</span>
                      )}
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    <div className="notification-footer">
                      <span className="notification-time">⏱️ {notif.time}</span>
                      <span className={`notification-type type-${notif.type}`}>
                        {notif.type === 'assignment'
                          ? '📝 Bài tập'
                          : notif.type === 'grade'
                            ? '📊 Điểm số'
                            : notif.type === 'course'
                              ? '📚 Giáo Trình'
                              : notif.type === 'system'
                                ? '⚙️ Hệ thống'
                                : notif.type === 'payment'
                                  ? '💰 Thanh toán'
                                  : '💬 Tin nhắn'}
                      </span>
                    </div>
                  </div>

                  {notif.actionUrl && (
                    <button className="notification-action">Xem chi tiết →</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 &&
          filteredNotifications.length < allNotifications.length && (
            <div className="load-more-container">
              <button className="btn btn-outline">Xem thêm thông báo</button>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationCenter;
