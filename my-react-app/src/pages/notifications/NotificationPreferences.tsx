import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { AuthService } from '../../services/api/auth.service';
import type { NotificationPreferenceRequest } from '../../services/notification-preferences.service';
import { notificationPreferencesService } from '../../services/notification-preferences.service';

const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const rawRole = AuthService.getUserRole();
  let role: 'student' | 'teacher' | 'admin' = 'student';
  if (rawRole === 'admin') role = 'admin';
  else if (rawRole === 'teacher') role = 'teacher';

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationPreferencesService.getMyPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: notificationPreferencesService.updatePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      showToast({ message: 'Cài đặt thông báo đã được cập nhật', type: 'success' });
    },
    onError: (error: Error) => {
      showToast({ message: `Lỗi: ${error.message}`, type: 'error' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: notificationPreferencesService.resetToDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      showToast({ message: 'Đã khôi phục cài đặt mặc định', type: 'success' });
      setIsResetting(false);
    },
    onError: (error: Error) => {
      showToast({ message: `Lỗi: ${error.message}`, type: 'error' });
      setIsResetting(false);
    },
  });

  const handlePreferenceChange = (
    notificationType: string,
    field: 'emailEnabled' | 'pushEnabled' | 'inAppEnabled',
    value: boolean
  ) => {
    const preference = preferences.find((p) => p.notificationType === notificationType);
    if (!preference) return;

    const request: NotificationPreferenceRequest = {
      notificationType,
      emailEnabled: field === 'emailEnabled' ? value : preference.emailEnabled,
      pushEnabled: field === 'pushEnabled' ? value : preference.pushEnabled,
      inAppEnabled: field === 'inAppEnabled' ? value : preference.inAppEnabled,
    };

    updateMutation.mutate(request);
  };

  const handleResetToDefaults = () => {
    setIsResetting(true);
    resetMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COURSE':
        return BookOpen;
      case 'PROFILE_VERIFICATION':
        return ShieldCheck;
      case 'SYSTEM':
        return Settings;
      case 'ASSIGNMENT':
        return ClipboardList;
      case 'GRADE':
        return BarChart2;
      case 'PAYMENT':
        return CreditCard;
      case 'MESSAGE':
        return MessageSquare;
      default:
        return Bell;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'COURSE':
        return 'Khóa học';
      case 'PROFILE_VERIFICATION':
        return 'Xác minh hồ sơ';
      case 'SYSTEM':
        return 'Hệ thống';
      case 'ASSIGNMENT':
        return 'Bài tập';
      case 'GRADE':
        return 'Điểm số';
      case 'MESSAGE':
        return 'Tin nhắn';
      default:
        return type;
    }
  };

  const getNotificationTypeDescription = (type: string) => {
    switch (type) {
      case 'COURSE':
        return 'Thông báo về khóa học mới, phê duyệt, từ chối';
      case 'PROFILE_VERIFICATION':
        return 'Thông báo về trạng thái xác minh hồ sơ giáo viên';
      case 'SYSTEM':
        return 'Thông báo hệ thống, bảo trì, cập nhật';
      case 'ASSIGNMENT':
        return 'Thông báo về bài tập mới, deadline';
      case 'GRADE':
        return 'Thông báo về điểm số, kết quả bài thi';
      case 'MESSAGE':
        return 'Tin nhắn từ giáo viên, học sinh';
      default:
        return 'Các thông báo khác';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role={role} user={{ name: '', avatar: '', role }}>
        <div className="flex-1 min-h-screen bg-[#F5F4ED] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#C96442] animate-spin" />
            <p className="font-['Be_Vietnam_Pro'] text-[15px] text-[#87867F]">
              Đang tải cài đặt...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role} user={{ name: '', avatar: '', role }}>
      <div className="flex-1 min-h-screen bg-[#F5F4ED]">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-['Be_Vietnam_Pro'] text-[36px] font-bold leading-[1.2] tracking-[-0.01em] text-[#141413]">
                Cài đặt Thông báo
              </h1>
              <p className="font-['Be_Vietnam_Pro'] text-[15px] text-[#87867F] mt-1 leading-[1.6]">
                Quản lý các loại thông báo bạn muốn nhận
              </p>
            </div>
            <button
              className="flex items-center gap-2 bg-[#E8E6DC] text-[#4D4C48] rounded-xl px-4 py-2.5 font-['Be_Vietnam_Pro'] text-[14px] font-medium shadow-[#E8E6DC_0px_0px_0px_0px,#D1CFC5_0px_0px_0px_1px] hover:shadow-[#E8E6DC_0px_0px_0px_0px,#C2C0B6_0px_0px_0px_1px] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
              onClick={handleResetToDefaults}
              disabled={isResetting || resetMutation.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Đang khôi phục...' : 'Khôi phục mặc định'}
            </button>
          </div>

          {/* Preferences Table */}
          <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden mb-6">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-6 py-4 bg-[#F5F4ED] border-b border-[#F0EEE6]">
              <div className="font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px]">
                Loại thông báo
              </div>
              <div className="flex flex-col items-center gap-1 font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px]">
                <Mail className="w-3.5 h-3.5" />
                Email
              </div>
              <div className="flex flex-col items-center gap-1 font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px]">
                <Smartphone className="w-3.5 h-3.5" />
                Push
              </div>
              <div className="flex flex-col items-center gap-1 font-['Be_Vietnam_Pro'] text-[12px] font-medium text-[#87867F] uppercase tracking-[0.5px]">
                <Bell className="w-3.5 h-3.5" />
                Trong app
              </div>
            </div>

            {/* Preference Rows */}
            <div className="divide-y divide-[#F0EEE6]">
              {preferences.map((preference) => {
                const Icon = getTypeIcon(preference.notificationType);
                return (
                  <div
                    key={preference.id}
                    className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-6 py-5 items-center hover:bg-[#F5F4ED] transition-colors duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-['Be_Vietnam_Pro'] text-[15px] font-semibold text-[#141413] leading-[1.4]">
                          {getNotificationTypeLabel(preference.notificationType)}
                        </div>
                        <div className="font-['Be_Vietnam_Pro'] text-[13px] text-[#87867F] leading-[1.6] mt-0.5">
                          {getNotificationTypeDescription(preference.notificationType)}
                        </div>
                      </div>
                    </div>

                    {(
                      [
                        {
                          field: 'emailEnabled' as const,
                          checked: preference.emailEnabled,
                          ariaLabel: 'Email',
                        },
                        {
                          field: 'pushEnabled' as const,
                          checked: preference.pushEnabled,
                          ariaLabel: 'Push',
                        },
                        {
                          field: 'inAppEnabled' as const,
                          checked: preference.inAppEnabled,
                          ariaLabel: 'Trong app',
                        },
                      ] as const
                    ).map(({ field, checked, ariaLabel }) => (
                      <div key={field} className="flex justify-center">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          aria-label={ariaLabel}
                        >
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={checked}
                            onChange={(e) =>
                              handlePreferenceChange(
                                preference.notificationType,
                                field,
                                e.target.checked
                              )
                            }
                            disabled={updateMutation.isPending}
                          />
                          <div className="w-11 h-6 bg-[#E8E6DC] rounded-full peer peer-checked:bg-[#C96442] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl p-6 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-['Playfair_Display'] text-[18px] font-medium text-[#141413]">
                Thông tin
              </h3>
            </div>
            <ul className="space-y-2.5 mb-4">
              {[
                { label: 'Email', desc: 'Thông báo sẽ được gửi đến email đăng ký của bạn' },
                { label: 'Push', desc: 'Thông báo đẩy trên thiết bị di động và trình duyệt' },
                { label: 'Trong app', desc: 'Thông báo hiển thị trong ứng dụng' },
              ].map(({ label, desc }) => (
                <li
                  key={label}
                  className="flex gap-2 font-['Be_Vietnam_Pro'] text-[14px] text-[#5E5D59] leading-[1.6]"
                >
                  <span className="font-semibold text-[#141413] flex-shrink-0">{label}:</span>
                  {desc}
                </li>
              ))}
            </ul>
            <p className="font-['Be_Vietnam_Pro'] text-[13px] text-[#87867F] leading-[1.6] border-t border-[#F0EEE6] pt-4">
              <span className="font-semibold text-[#5E5D59]">Lưu ý:</span> Một số thông báo quan
              trọng về bảo mật và hệ thống sẽ luôn được gửi bất kể cài đặt của bạn.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationPreferences;
