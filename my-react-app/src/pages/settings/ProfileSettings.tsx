import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import './ProfileSettings.css';

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'preferences' | 'notifications'
  >('profile');
  const [profileData, setProfileData] = useState({
    name: mockTeacher.name,
    email: mockTeacher.email,
    phone: '0912345678',
    bio: 'Giáo viên Toán với 10 năm kinh nghiệm giảng dạy',
    school: 'THPT Lê Quý Đôn',
    subject: 'Toán học',
    education: 'Thạc sĩ Toán học - ĐH Sư Phạm TP.HCM',
  });

  const [notifications, setNotifications] = useState({
    emailNewAssignment: true,
    emailGrade: true,
    emailAnnouncement: true,
    pushNewMessage: true,
    pushDeadline: true,
    weeklyReport: false,
  });

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="profile-settings-page">
        <div className="settings-header">
          <h1 className="page-title">⚙️ Cài đặt tài khoản</h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm</p>
        </div>

        <div className="settings-container">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="tab-icon">👤</span>
              <span className="tab-text">Thông tin cá nhân</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="tab-icon">🔒</span>
              <span className="tab-text">Bảo mật</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="tab-icon">🎨</span>
              <span className="tab-text">Giao diện</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="tab-icon">🔔</span>
              <span className="tab-text">Thông báo</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2 className="section-title">Thông tin cá nhân</h2>
                <p className="section-subtitle">
                  Cập nhật thông tin của bạn để mọi người biết bạn hơn
                </p>

                <div className="avatar-section">
                  <div className="avatar-preview">{mockTeacher.avatar}</div>
                  <div className="avatar-actions">
                    <button className="btn btn-outline btn-sm">📷 Đổi ảnh</button>
                    <button className="btn btn-outline btn-sm">🗑️ Xóa</button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Trường</label>
                    <input
                      type="text"
                      value={profileData.school}
                      onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Giới thiệu bản thân</label>
                    <textarea
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Môn giảng dạy</label>
                    <input
                      type="text"
                      value={profileData.subject}
                      onChange={(e) => setProfileData({ ...profileData, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Trình độ học vấn</label>
                    <input
                      type="text"
                      value={profileData.education}
                      onChange={(e) =>
                        setProfileData({ ...profileData, education: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-outline">Hủy thay đổi</button>
                  <button className="btn btn-primary">💾 Lưu thay đổi</button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="section-title">Bảo mật tài khoản</h2>
                <p className="section-subtitle">Quản lý mật khẩu và thiết lập bảo mật</p>

                <div className="security-card">
                  <h3 className="card-title">🔑 Đổi mật khẩu</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Mật khẩu hiện tại</label>
                      <input type="password" placeholder="Nhập mật khẩu hiện tại" />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input type="password" placeholder="Nhập mật khẩu mới" />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input type="password" placeholder="Nhập lại mật khẩu mới" />
                    </div>
                  </div>
                  <button className="btn btn-primary">Cập nhật mật khẩu</button>
                </div>

                <div className="security-card">
                  <h3 className="card-title">🔐 Xác thực 2 bước</h3>
                  <p className="card-description">
                    Tăng cường bảo mật bằng cách yêu cầu mã xác thực khi đăng nhập
                  </p>
                  <button className="btn btn-outline">Bật xác thực 2 bước</button>
                </div>

                <div className="security-card">
                  <h3 className="card-title">📱 Thiết bị đăng nhập</h3>
                  <div className="device-list">
                    <div className="device-item">
                      <div className="device-info">
                        <span className="device-icon">💻</span>
                        <div>
                          <div className="device-name">Chrome on Windows</div>
                          <div className="device-time">Hiện tại - TP.HCM, Việt Nam</div>
                        </div>
                      </div>
                      <span className="device-badge active">Đang hoạt động</span>
                    </div>
                    <div className="device-item">
                      <div className="device-info">
                        <span className="device-icon">📱</span>
                        <div>
                          <div className="device-name">Safari on iPhone</div>
                          <div className="device-time">2 ngày trước - TP.HCM, Việt Nam</div>
                        </div>
                      </div>
                      <button className="btn btn-outline btn-sm">Đăng xuất</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="settings-section">
                <h2 className="section-title">Tùy chỉnh giao diện</h2>
                <p className="section-subtitle">Cá nhân hóa trải nghiệm sử dụng của bạn</p>

                <div className="preference-card">
                  <h3 className="card-title">🌓 Chế độ hiển thị</h3>
                  <div className="theme-options">
                    <div className="theme-option active">
                      <div className="theme-preview light">☀️</div>
                      <span>Sáng</span>
                    </div>
                    <div className="theme-option">
                      <div className="theme-preview dark">🌙</div>
                      <span>Tối</span>
                    </div>
                    <div className="theme-option">
                      <div className="theme-preview auto">🔄</div>
                      <span>Tự động</span>
                    </div>
                  </div>
                </div>

                <div className="preference-card">
                  <h3 className="card-title">🌍 Ngôn ngữ</h3>
                  <select className="form-select">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="preference-card">
                  <h3 className="card-title">📊 Hiển thị thống kê</h3>
                  <div className="toggle-list">
                    <label className="toggle-item">
                      <span>Hiển thị tiến độ học tập</span>
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label className="toggle-item">
                      <span>Hiển thị xếp hạng</span>
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label className="toggle-item">
                      <span>Hiển thị biểu đồ phân tích</span>
                      <input type="checkbox" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="section-title">Cài đặt thông báo</h2>
                <p className="section-subtitle">Chọn loại thông báo bạn muốn nhận</p>

                <div className="notification-card">
                  <h3 className="card-title">📧 Thông báo Email</h3>
                  <div className="toggle-list">
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Bài tập mới</div>
                        <div className="toggle-description">Nhận email khi có bài tập mới</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailNewAssignment}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            emailNewAssignment: e.target.checked,
                          })
                        }
                      />
                    </label>
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Điểm số</div>
                        <div className="toggle-description">Nhận email khi có điểm mới</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailGrade}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailGrade: e.target.checked })
                        }
                      />
                    </label>
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Thông báo chung</div>
                        <div className="toggle-description">
                          Nhận các thông báo quan trọng từ hệ thống
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailAnnouncement}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            emailAnnouncement: e.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="notification-card">
                  <h3 className="card-title">🔔 Thông báo Push</h3>
                  <div className="toggle-list">
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Tin nhắn mới</div>
                        <div className="toggle-description">Nhận thông báo khi có tin nhắn</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewMessage}
                        onChange={(e) =>
                          setNotifications({ ...notifications, pushNewMessage: e.target.checked })
                        }
                      />
                    </label>
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Nhắc deadline</div>
                        <div className="toggle-description">Nhắc nhở trước 24h khi sắp hết hạn</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.pushDeadline}
                        onChange={(e) =>
                          setNotifications({ ...notifications, pushDeadline: e.target.checked })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="notification-card">
                  <h3 className="card-title">📈 Báo cáo</h3>
                  <div className="toggle-list">
                    <label className="toggle-item">
                      <div>
                        <div className="toggle-label">Báo cáo tuần</div>
                        <div className="toggle-description">Nhận báo cáo tổng hợp hàng tuần</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReport}
                        onChange={(e) =>
                          setNotifications({ ...notifications, weeklyReport: e.target.checked })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary">💾 Lưu cài đặt</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
