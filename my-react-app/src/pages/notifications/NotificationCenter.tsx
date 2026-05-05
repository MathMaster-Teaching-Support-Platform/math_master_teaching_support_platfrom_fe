import {
  AlertTriangle,
  BarChart2,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Inbox,
  Mail,
  MessageSquare,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useNotificationsContext } from '../../context/NotificationContext';
import { AuthService } from '../../services/api/auth.service';

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useNotificationsContext();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Derive role from auth token so any role gets the correct sidebar
  const rawRole = AuthService.getUserRole();
  let role: 'student' | 'teacher' | 'admin' = 'student';
  if (rawRole === 'admin') role = 'admin';
  else if (rawRole === 'teacher') role = 'teacher';

  const normalizeType = (type: string) => type.toLowerCase();

  const filteredNotifications = notifications.filter((notif) => {
    let matchReadStatus = true;
    if (filter === 'unread') matchReadStatus = !notif.read;
    else if (filter === 'read') matchReadStatus = notif.read;

    const matchType =
      typeFilter === 'all' ? true : normalizeType(notif.type) === normalizeType(typeFilter);

    return matchReadStatus && matchType;
  });

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    high: notifications.filter((n) => n.metadata?.priority === 'high' && !n.read).length,
  };

  const getNotificationIcon = (type: string) => {
    switch (normalizeType(type)) {
      case 'assignment':
        return ClipboardList;
      case 'grade':
        return BarChart2;
      case 'course':
        return BookOpen;
      case 'system':
        return Settings;
      case 'payment':
        return CreditCard;
      case 'message':
        return MessageSquare;
      case 'profile_verification':
        return ShieldCheck;
      default:
        return Bell;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (normalizeType(type)) {
      case 'assignment':
        return 'Bài tập';
      case 'grade':
        return 'Điểm số';
      case 'course':
        return UI_TEXT.COURSE;
      case 'system':
        return 'Hệ thống';
      case 'payment':
        return 'Thanh toán';
      case 'message':
        return 'Tin nhắn';
      case 'profile_verification':
        return 'Kiểm duyệt';
      default:
        return 'Thông báo';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (normalizeType(type)) {
      case 'assignment':
        return 'bg-[#F0EEE6] text-[#4D4C48]';
      case 'grade':
        return 'bg-[#E8E6DC] text-[#3D3D3A]';
      case 'course':
        return 'bg-[#F0EEE6] text-[#4D4C48]';
      case 'payment':
        return 'bg-[#E8E6DC] text-[#3D3D3A]';
      case 'message':
        return 'bg-[#F0EEE6] text-[#4D4C48]';
      case 'profile_verification':
        return 'bg-[#FAF9F5] text-[#5E5D59] border border-[#E8E6DC]';
      default:
        return 'bg-[#FAF9F5] text-[#87867F] border border-[#E8E6DC]';
    }
  };

  return (
    <DashboardLayout
      role={role}
      user={{ name: '', avatar: '', role }}
      notificationCount={stats.unread}
    >
      <div className="flex-1 min-h-screen bg-[#F5F4ED]">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-['Be_Vietnam_Pro'] text-[36px] font-bold leading-[1.2] tracking-[-0.01em] text-[#141413]">
                Trung Tâm Thông Báo
              </h1>
              <p className="font-['Be_Vietnam_Pro'] text-[15px] text-[#87867F] mt-1 leading-[1.6]">
                Quản lý tất cả thông báo của bạn
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/notifications/preferences"
                className="flex items-center gap-2 bg-[#E8E6DC] text-[#4D4C48] rounded-xl px-4 py-2.5 font-['Be_Vietnam_Pro'] text-[14px] font-medium shadow-[#E8E6DC_0px_0px_0px_0px,#D1CFC5_0px_0px_0px_1px] hover:shadow-[#E8E6DC_0px_0px_0px_0px,#C2C0B6_0px_0px_0px_1px] active:scale-[0.98] transition-all duration-150"
              >
                <Settings className="w-3.5 h-3.5" />
                Cài đặt
              </Link>
              <button
                className="flex items-center gap-2 bg-[#141413] text-[#B0AEA5] rounded-xl px-4 py-2.5 border border-[#30302E] font-['Be_Vietnam_Pro'] text-[14px] font-medium hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đánh dấu đã đọc tất cả
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex items-start gap-4 hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.05)_0px_4px_24px] transition-shadow duration-200">
              <div className="w-11 h-11 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="font-['Be_Vietnam_Pro'] text-[32px] font-bold tabular-nums text-[#141413] leading-[1.1]">
                  {stats.total}
                </div>
                <div className="font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px] mt-1">
                  Tổng thông báo
                </div>
              </div>
            </div>

            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex items-start gap-4 hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.05)_0px_4px_24px] transition-shadow duration-200">
              <div className="w-11 h-11 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#C96442] flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="font-['Be_Vietnam_Pro'] text-[32px] font-bold tabular-nums text-[#141413] leading-[1.1]">
                  {stats.unread}
                </div>
                <div className="font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px] mt-1">
                  Chưa đọc
                </div>
              </div>
            </div>

            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex items-start gap-4 hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.05)_0px_4px_24px] transition-shadow duration-200">
              <div className="w-11 h-11 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#B53333] flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-['Be_Vietnam_Pro'] text-[32px] font-bold tabular-nums text-[#141413] leading-[1.1]">
                  {stats.high}
                </div>
                <div className="font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px] mt-1">
                  Ưu tiên cao
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-4 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: 'all', label: `Tất cả (${stats.total})` },
                  { key: 'unread', label: `Chưa đọc (${stats.unread})` },
                  { key: 'read', label: `Đã đọc (${stats.total - stats.unread})` },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  className={`rounded-lg px-3.5 py-1.5 font-['Be_Vietnam_Pro'] text-[13px] transition-colors duration-150 ${
                    filter === key
                      ? 'bg-[#141413] text-[#FAF9F5] font-semibold'
                      : 'bg-transparent text-[#5E5D59] font-medium hover:bg-[#E8E6DC] hover:text-[#141413]'
                  }`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              className="bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-3 py-2 font-['Be_Vietnam_Pro'] text-[13px] text-[#141413] shadow-[0px_0px_0px_1px_#E8E6DC] focus:border-[#3898EC] focus:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] outline-none transition-all duration-150 min-w-[180px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="assignment">Bài tập</option>
              <option value="grade">Điểm số</option>
              <option value="course">{UI_TEXT.COURSE}</option>
              <option value="system">Hệ thống</option>
              <option value="payment">Thanh toán</option>
              <option value="message">Tin nhắn</option>
              <option value="PROFILE_VERIFICATION">Kiểm duyệt hồ sơ</option>
            </select>
          </div>

          {/* Notifications List */}
          <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="w-14 h-14 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#87867F] mb-4">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="font-['Playfair_Display'] text-[20px] font-medium text-[#141413] mb-2">
                  Không có thông báo
                </h3>
                <p className="font-['Be_Vietnam_Pro'] text-[15px] text-[#87867F] leading-[1.6]">
                  Bạn đã xem hết tất cả thông báo
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0EEE6]">
                {filteredNotifications.map((notif) => {
                  const Icon = getNotificationIcon(notif.type);
                  const isPriorityHigh = notif.metadata?.priority === 'high';

                  return (
                    <button
                      key={notif.id}
                      type="button"
                      className={`relative w-full text-left flex items-start gap-4 px-6 py-5 cursor-pointer transition-colors duration-150 ${
                        notif.read ? 'hover:bg-[#F5F4ED]' : 'bg-[#FDFCF8] hover:bg-[#F5F4ED]'
                      } ${isPriorityHigh ? 'border-l-2 border-[#B53333]' : ''}`}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.actionUrl) navigate(notif.actionUrl);
                      }}
                    >
                      {!notif.read && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C96442] rounded-r-full" />
                      )}

                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notif.read ? 'bg-[#F0EEE6] text-[#87867F]' : 'bg-[#E8E6DC] text-[#5E5D59]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-['Be_Vietnam_Pro'] text-[15px] leading-[1.4] ${
                              notif.read
                                ? 'font-normal text-[#5E5D59]'
                                : 'font-semibold text-[#141413]'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {isPriorityHigh && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] font-['Be_Vietnam_Pro'] text-[11px] font-semibold text-[#B53333]">
                              Ưu tiên cao
                            </span>
                          )}
                        </div>
                        <p className="font-['Be_Vietnam_Pro'] text-[14px] text-[#5E5D59] leading-[1.6] mb-2.5 line-clamp-2">
                          {notif.content}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5 font-['Be_Vietnam_Pro'] text-[12px] text-[#87867F]">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-['Be_Vietnam_Pro'] text-[11px] font-medium ${getTypeBadgeClass(notif.type)}`}
                          >
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredNotifications.length > 0 && hasNextPage && (
            <div className="flex justify-center mt-6">
              <button
                className="flex items-center gap-2 bg-[#E8E6DC] text-[#4D4C48] rounded-xl px-6 py-2.5 font-['Be_Vietnam_Pro'] text-[14px] font-medium shadow-[#E8E6DC_0px_0px_0px_0px,#D1CFC5_0px_0px_0px_1px] hover:shadow-[#E8E6DC_0px_0px_0px_0px,#C2C0B6_0px_0px_0px_1px] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                onClick={loadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  'Đang tải...'
                ) : (
                  <>
                    Xem thêm thông báo
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationCenter;
