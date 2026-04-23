import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { notificationPreferencesService } from '../../services/notification-preferences.service';
import type { NotificationPreferenceRequest } from '../../services/notification-preferences.service';
import { useToast } from '../../context/ToastContext';
import './NotificationPreferences.css';

const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

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
    const preference = preferences.find(p => p.notificationType === notificationType);
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

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'COURSE': return '📚 Khóa học';
      case 'PROFILE_VERIFICATION': return '🛡️ Xác minh hồ sơ';
      case 'SYSTEM': return '⚙️ Hệ thống';
      case 'ASSIGNMENT': return '📝 Bài tập';
      case 'GRADE': return '📊 Điểm số';
      case 'MESSAGE': return '💬 Tin nhắn';
      default: return type;
    }
  };

  const getNotificationTypeDescription = (type: string) => {
    switch (type) {
      case 'COURSE': return 'Thông báo về khóa học mới, phê duyệt, từ chối';
      case 'PROFILE_VERIFICATION': return 'Thông báo về trạng thái xác minh hồ sơ giáo viên';
      case 'SYSTEM': return 'Thông báo hệ thống, bảo trì, cập nhật';
      case 'ASSIGNMENT': return 'Thông báo về bài tập mới, deadline';
      case 'GRADE': return 'Thông báo về điểm số, kết quả bài thi';
      case 'MESSAGE': return 'Tin nhắn từ giáo viên, học sinh';
      default: return 'Các thông báo khác';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      >
        <div className="notification-preferences-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải cài đặt...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
    >
      <div className="notification-preferences-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">⚙️ Cài đặt Thông báo</h1>
            <p className="page-subtitle">Quản lý các loại thông báo bạn muốn nhận</p>
          </div>
          <button 
            className="btn btn-outline"
            onClick={handleResetToDefaults}
            disabled={isResetting || resetMutation.isPending}
          >
            {isResetting ? 'Đang khôi phục...' : '🔄 Khôi phục mặc định'}
          </button>
        </div>

        <div className="preferences-container">
          <div className="preferences-header">
            <div className="preference-type">Loại thông báo</div>
            <div className="preference-channels">
              <div className="channel-header">📧 Email</div>
              <div className="channel-header">📱 Push</div>
              <div className="channel-header">🔔 Trong app</div>
            </div>
          </div>

          {preferences.map((preference) => (
            <div key={preference.id} className="preference-row">
              <div className="preference-info">
                <div className="preference-title">
                  {getNotificationTypeLabel(preference.notificationType)}
                </div>
                <div className="preference-description">
                  {getNotificationTypeDescription(preference.notificationType)}
                </div>
              </div>
              
              <div className="preference-toggles">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preference.emailEnabled}
                    onChange={(e) => handlePreferenceChange(
                      preference.notificationType,
                      'emailEnabled',
                      e.target.checked
                    )}
                    disabled={updateMutation.isPending}
                  />
                  <span className="toggle-slider"></span>
                </label>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preference.pushEnabled}
                    onChange={(e) => handlePreferenceChange(
                      preference.notificationType,
                      'pushEnabled',
                      e.target.checked
                    )}
                    disabled={updateMutation.isPending}
                  />
                  <span className="toggle-slider"></span>
                </label>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preference.inAppEnabled}
                    onChange={(e) => handlePreferenceChange(
                      preference.notificationType,
                      'inAppEnabled',
                      e.target.checked
                    )}
                    disabled={updateMutation.isPending}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="preferences-info">
          <h3>ℹ️ Thông tin</h3>
          <ul>
            <li><strong>Email:</strong> Thông báo sẽ được gửi đến email đăng ký của bạn</li>
            <li><strong>Push:</strong> Thông báo đẩy trên thiết bị di động và trình duyệt</li>
            <li><strong>Trong app:</strong> Thông báo hiển thị trong ứng dụng</li>
          </ul>
          <p className="note">
            <strong>Lưu ý:</strong> Một số thông báo quan trọng về bảo mật và hệ thống sẽ luôn được gửi bất kể cài đặt của bạn.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationPreferences;