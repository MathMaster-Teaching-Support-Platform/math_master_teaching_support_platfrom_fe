import {
  AlertCircle,
  AtSign,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Hash,
  Info,
  Loader2,
  Lock,
  Phone,
  Shield,
  SlidersHorizontal,
  Star,
  User,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AuthService } from '../../services/api/auth.service';
import {
  UserService,
  type ChangePasswordRequest,
  type UpdateMyInfoRequest,
  type UserProfileResponse,
} from '../../services/api/user.service';
import './ProfileSettings.css';

type ActiveTab = 'profile' | 'account' | 'security' | 'preferences';
type ToastType = 'success' | 'error';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

interface ProfileForm {
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  avatar: string;
}

interface AccountForm {
  email: string;
  phoneNumber: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ADMIN: 'Quản trị viên',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang hoạt động', cls: 'ps-badge--green' },
  INACTIVE: { label: 'Tạm dừng', cls: 'ps-badge--gray' },
  BANNED: { label: 'Bị khóa', cls: 'ps-badge--red' },
  DELETED: { label: 'Bị xóa', cls: 'ps-badge--red' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();
}

const FeedbackToast: React.FC<{ toast: ToastState; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => (
  <div className={`ps-toast ps-toast--${toast.type}${toast.visible ? ' ps-toast--visible' : ''}`}>
    {toast.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
    <span>{toast.message}</span>
    <button className="ps-toast__close" onClick={onDismiss} aria-label="Đóng thông báo">
      <X size={14} />
    </button>
  </div>
);

const Skeleton: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '14px',
}) => <div className="ps-skeleton" style={{ width, height }} />;

const SettingsSection: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="ps-card">
    <div className="ps-card__header">
      <h3 className="ps-card__title">{title}</h3>
      <p className="ps-card__desc">{description}</p>
    </div>
    <div className="ps-card__body">{children}</div>
  </div>
);

const PremiumInput: React.FC<{
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  error,
  hint,
  icon,
  rightElement,
  required,
}) => (
  <div
    className={`ps-field${error ? ' ps-field--error' : ''}${readOnly ? ' ps-field--readonly' : ''}`}
  >
    <label className="ps-field__label" htmlFor={id}>
      {label}
      {required && (
        <span className="ps-field__required" aria-hidden="true">
          *
        </span>
      )}
    </label>
    <div className="ps-field__wrap">
      {icon && <span className="ps-field__icon">{icon}</span>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`ps-field__input${icon ? ' ps-field__input--icon' : ''}${rightElement ? ' ps-field__input--right' : ''}`}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {rightElement && <span className="ps-field__right-el">{rightElement}</span>}
    </div>
    {error && (
      <p className="ps-field__error" id={`${id}-error`} role="alert">
        <AlertCircle size={12} aria-hidden="true" />
        {error}
      </p>
    )}
    {hint && !error && (
      <p className="ps-field__hint" id={`${id}-hint`}>
        {hint}
      </p>
    )}
  </div>
);

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
}> = ({ checked, onChange, id, label }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`ps-toggle${checked ? ' ps-toggle--on' : ''}`}
    type="button"
  >
    <span className="ps-toggle__thumb" />
  </button>
);

const ProfileSettings: React.FC = () => {
  const rawRole = AuthService.getUserRole();
  const role: 'teacher' | 'student' | 'admin' =
    rawRole === 'teacher' ? 'teacher' : rawRole === 'admin' ? 'admin' : 'student';

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [pageLoading, setPageLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfileResponse | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', message: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: '',
    dob: '',
    gender: '',
    avatar: '',
  });
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileForm, string>>>(
    {}
  );
  const [avatarEditMode, setAvatarEditMode] = useState(false);

  const [accountForm, setAccountForm] = useState<AccountForm>({ email: '', phoneNumber: '' });
  const [accountDirty, setAccountDirty] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountErrors, setAccountErrors] = useState<Partial<Record<keyof AccountForm, string>>>(
    {}
  );

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({ current: false, new_: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>(
    {}
  );

  const [prefs, setPrefs] = useState({
    language: localStorage.getItem('mf_pref_language') || 'vi',
    theme: localStorage.getItem('mf_pref_theme') || 'light',
    showProgress: localStorage.getItem('mf_pref_showProgress') !== 'false',
    showRankings: localStorage.getItem('mf_pref_showRankings') !== 'false',
  });

  const showToast = useCallback((type: ToastType, message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, message });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const user = await UserService.getMyInfo();
        setUserData(user);
        setProfileForm({
          fullName: user.fullName,
          dob: user.dob || '',
          gender: (user.gender as 'MALE' | 'FEMALE' | 'OTHER' | '') || '',
          avatar: user.avatar || '',
        });
        setAccountForm({ email: user.email, phoneNumber: user.phoneNumber || '' });
      } catch {
        showToast('error', 'Không thể tải thông tin tài khoản. Vui lòng thử lại.');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [showToast]);

  const validateProfile = (): boolean => {
    const errs: typeof profileErrors = {};
    const name = profileForm.fullName.trim();
    if (!name) errs.fullName = 'Họ và tên không được để trống';
    else if (name.length < 2) errs.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    else if (name.length > 50) errs.fullName = 'Họ và tên không được vượt quá 50 ký tự';
    if (profileForm.dob) {
      const dobYear = new Date(profileForm.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (dobYear < currentYear - 100) errs.dob = 'Ngày sinh không hợp lệ (tối đa 100 tuổi)';
      else if (dobYear > currentYear - 3) errs.dob = 'Ngày sinh không hợp lệ (tối thiểu 3 tuổi)';
    }
    if (profileForm.avatar && profileForm.avatar.length > 2048)
      errs.avatar = 'URL ảnh quá dài (tối đa 2048 ký tự)';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfile() || !userData) return;
    setProfileLoading(true);
    try {
      const payload: UpdateMyInfoRequest = {
        fullName: profileForm.fullName.trim(),
        email: userData.email,
        phoneNumber: userData.phoneNumber || undefined,
        gender: (profileForm.gender as 'MALE' | 'FEMALE' | 'OTHER') || undefined,
        avatar: profileForm.avatar || undefined,
        dob: profileForm.dob || undefined,
      };
      const updated = await UserService.updateMyInfo(payload);
      setUserData(updated);
      setProfileForm({
        fullName: updated.fullName,
        dob: updated.dob || '',
        gender: (updated.gender as 'MALE' | 'FEMALE' | 'OTHER' | '') || '',
        avatar: updated.avatar || '',
      });
      setProfileDirty(false);
      setAvatarEditMode(false);
      showToast('success', 'Hồ sơ cá nhân đã được cập nhật thành công');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setProfileLoading(false);
    }
  };

  const resetProfileForm = () => {
    if (!userData) return;
    setProfileForm({
      fullName: userData.fullName,
      dob: userData.dob || '',
      gender: (userData.gender as 'MALE' | 'FEMALE' | 'OTHER' | '') || '',
      avatar: userData.avatar || '',
    });
    setProfileDirty(false);
    setProfileErrors({});
    setAvatarEditMode(false);
  };

  const validateAccount = (): boolean => {
    const errs: typeof accountErrors = {};
    const email = accountForm.email.trim();
    if (!email) errs.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Địa chỉ email không hợp lệ!';
    else if (email.length > 50) errs.email = 'Email không được vượt quá 50 ký tự';
    if (accountForm.phoneNumber && !/^(\+84|0)[0-9]{9}$/.test(accountForm.phoneNumber))
      errs.phoneNumber = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    setAccountErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAccountSave = async () => {
    if (!validateAccount() || !userData) return;
    setAccountLoading(true);
    try {
      const payload: UpdateMyInfoRequest = {
        fullName: userData.fullName,
        email: accountForm.email.trim(),
        phoneNumber: accountForm.phoneNumber || undefined,
        gender: (userData.gender as 'MALE' | 'FEMALE' | 'OTHER') || undefined,
        avatar: userData.avatar || undefined,
        dob: userData.dob || undefined,
      };
      const updated = await UserService.updateMyInfo(payload);
      setUserData(updated);
      setAccountForm({ email: updated.email, phoneNumber: updated.phoneNumber || '' });
      setAccountDirty(false);
      showToast('success', 'Thông tin tài khoản đã được cập nhật');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      if (msg.includes('1013') || msg.toLowerCase().includes('email'))
        setAccountErrors({ email: 'Email này đã được sử dụng bởi tài khoản khác' });
      else showToast('error', msg);
    } finally {
      setAccountLoading(false);
    }
  };

  const resetAccountForm = () => {
    if (!userData) return;
    setAccountForm({ email: userData.email, phoneNumber: userData.phoneNumber || '' });
    setAccountDirty(false);
    setAccountErrors({});
  };

  const validatePassword = (): boolean => {
    const errs: typeof passwordErrors = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwordForm.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordForm.newPassword.length < 8)
      errs.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(passwordForm.newPassword))
      errs.newPassword = 'Mật khẩu phải có chữ hoa, chữ thường, chữ số và ký tự đặc biệt';
    if (!passwordForm.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) return;
    setPasswordLoading(true);
    try {
      const payload: ChangePasswordRequest = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      };
      await UserService.changePassword(payload);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      showToast('success', 'Mật khẩu đã được thay đổi thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại';
      if (msg.includes('1014') || msg.toLowerCase().includes('current'))
        setPasswordErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' });
      else if (msg.includes('1015'))
        setPasswordErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      else showToast('error', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePrefsSave = () => {
    localStorage.setItem('mf_pref_language', prefs.language);
    localStorage.setItem('mf_pref_theme', prefs.theme);
    localStorage.setItem('mf_pref_showProgress', String(prefs.showProgress));
    localStorage.setItem('mf_pref_showRankings', String(prefs.showRankings));
    showToast('success', 'Tùy chọn đã được lưu thành công');
  };

  const pwStrength = (() => {
    let s = 0;
    const p = passwordForm.newPassword;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[!@#$%^&*]/.test(p)) s++;
    return s;
  })();

  const pwStrengthMeta = [
    { label: '', cls: '' },
    { label: 'Rất yếu', cls: 'ps-strength--1' },
    { label: 'Yếu', cls: 'ps-strength--2' },
    { label: 'Trung bình', cls: 'ps-strength--3' },
    { label: 'Mạnh', cls: 'ps-strength--4' },
    { label: 'Rất mạnh', cls: 'ps-strength--5' },
  ][pwStrength];

  const displayAvatar = profileForm.avatar || userData?.avatar || '';
  const displayName = userData?.fullName || 'Người dùng';
  const statusMeta = STATUS_META[userData?.status || ''] || {
    label: userData?.status || '',
    cls: '',
  };

  const navItems = [
    {
      id: 'profile' as ActiveTab,
      label: 'Hồ sơ cá nhân',
      icon: <User size={17} strokeWidth={1.8} />,
    },
    {
      id: 'account' as ActiveTab,
      label: 'Thông tin tài khoản',
      icon: <AtSign size={17} strokeWidth={1.8} />,
    },
    {
      id: 'security' as ActiveTab,
      label: 'Bảo mật',
      icon: <Shield size={17} strokeWidth={1.8} />,
    },
    {
      id: 'preferences' as ActiveTab,
      label: 'Tùy chọn',
      icon: <SlidersHorizontal size={17} strokeWidth={1.8} />,
    },
  ];

  return (
    <DashboardLayout
      role={role}
      user={{ name: displayName, avatar: displayAvatar, role }}
      notificationCount={0}
    >
      <FeedbackToast toast={toast} onDismiss={() => setToast((t) => ({ ...t, visible: false }))} />

      <div className="ps-page">
        {/* Page header */}
        <div className="ps-header">
          <div className="ps-header__text">
            <h1 className="ps-header__title">Cài đặt tài khoản</h1>
            <p className="ps-header__subtitle">
              Quản lý thông tin và tùy chỉnh trải nghiệm của bạn trên MathFlow
            </p>
          </div>
          {userData && (
            <div className="ps-header__meta">
              <span className={`ps-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
              <span className="ps-header__joined">
                <Clock size={13} aria-hidden="true" />
                Tham gia{' '}
                {new Date(userData.createdDate).toLocaleDateString('vi-VN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        <div className="ps-layout">
          {/* Sidebar */}
          <nav className="ps-nav" aria-label="Settings navigation">
            <div className="ps-nav__items">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`ps-nav__btn${activeTab === item.id ? ' ps-nav__btn--active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  type="button"
                >
                  <span className="ps-nav__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="ps-nav__label">{item.label}</span>
                  {activeTab === item.id && <span className="ps-nav__dot" aria-hidden="true" />}
                </button>
              ))}
            </div>

            {!pageLoading && userData && (
              <div className="ps-nav__id-card">
                <div className="ps-mini-avatar">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className="ps-nav__id-info">
                  <span className="ps-nav__id-name">{displayName}</span>
                  <span className="ps-nav__id-roles">
                    {userData.roles.map((r) => ROLE_LABELS[r] || r).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </nav>

          {/* Content */}
          <main className="ps-main">
            {pageLoading ? (
              <div className="ps-card">
                <div className="ps-card__header">
                  <div>
                    <Skeleton width="200px" height="18px" />
                    <div style={{ marginTop: 8 }}>
                      <Skeleton width="320px" height="13px" />
                    </div>
                  </div>
                </div>
                <div className="ps-card__body">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="ps-skeleton-field">
                      <Skeleton width="100px" height="11px" />
                      <Skeleton width="100%" height="44px" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* 
                    TAB: Hồ sơ cá nhân
                 */}
                {activeTab === 'profile' && (
                  <div className="ps-tab">
                    <SettingsSection
                      title="Hồ sơ cá nhân"
                      description="Thông tin hiển thị công khai với học viên và giáo viên trên nền tảng"
                    >
                      {/* Avatar row */}
                      <div className="ps-avatar-row">
                        <button
                          className="ps-avatar"
                          onClick={() => setAvatarEditMode((v) => !v)}
                          title="Đổi ảnh đại diện"
                          aria-label="Đổi ảnh đại diện"
                          type="button"
                        >
                          {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="ps-avatar__img" />
                          ) : (
                            <span className="ps-avatar__initials">{getInitials(displayName)}</span>
                          )}
                          <span className="ps-avatar__overlay" aria-hidden="true">
                            <Camera size={20} />
                            <span>Đổi ảnh</span>
                          </span>
                        </button>
                        <div className="ps-avatar-meta">
                          <p className="ps-avatar-meta__name">{displayName}</p>
                          <p className="ps-avatar-meta__username">@{userData?.userName}</p>
                          <p className="ps-avatar-meta__hint">
                            <Info size={12} aria-hidden="true" />
                            Hiển thị công khai trong các khóa học và thảo luận
                          </p>
                        </div>
                      </div>

                      {/* Avatar URL editor */}
                      {avatarEditMode && (
                        <div className="ps-avatar-edit">
                          <PremiumInput
                            label="URL ảnh đại diện"
                            id="avatar-url"
                            value={profileForm.avatar}
                            onChange={(v) => {
                              setProfileForm((f) => ({ ...f, avatar: v }));
                              setProfileDirty(true);
                            }}
                            placeholder="https://example.com/your-photo.jpg"
                            error={profileErrors.avatar}
                            hint="Dán URL ảnh từ internet (JPG, PNG, WebP tối đa 2048 ký tự)"
                          />
                          <button
                            className="ps-btn ps-btn--ghost ps-btn--sm"
                            onClick={() => setAvatarEditMode(false)}
                            type="button"
                          >
                            <X size={13} aria-hidden="true" />
                            Hủy
                          </button>
                        </div>
                      )}

                      {/* Main fields */}
                      <div className="ps-form-grid">
                        <PremiumInput
                          label="Họ và tên"
                          id="fullName"
                          value={profileForm.fullName}
                          onChange={(v) => {
                            setProfileForm((f) => ({ ...f, fullName: v }));
                            setProfileDirty(true);
                            setProfileErrors((e) => ({ ...e, fullName: undefined }));
                          }}
                          placeholder="Nguyễn Văn A"
                          error={profileErrors.fullName}
                          required
                        />

                        <div className="ps-field">
                          <label className="ps-field__label" htmlFor="gender">
                            Giới tính
                          </label>
                          <div className="ps-field__wrap">
                            <select
                              id="gender"
                              className="ps-field__select"
                              value={profileForm.gender}
                              onChange={(e) => {
                                setProfileForm((f) => ({
                                  ...f,
                                  gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' | '',
                                }));
                                setProfileDirty(true);
                              }}
                            >
                              <option value="">Chọn giới tính</option>
                              {GENDER_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <PremiumInput
                          label="Ngày sinh"
                          id="dob"
                          type="date"
                          value={profileForm.dob}
                          onChange={(v) => {
                            setProfileForm((f) => ({ ...f, dob: v }));
                            setProfileErrors((e) => ({ ...e, dob: undefined }));
                            setProfileDirty(true);
                          }}
                          icon={<Calendar size={15} aria-hidden="true" />}
                          hint="Không hiển thị công khai với người dùng khác"
                          error={profileErrors.dob}
                        />

                        {userData?.code && (
                          <PremiumInput
                            label="Mã học viên / giáo viên"
                            id="code"
                            value={userData.code}
                            readOnly
                            icon={<Hash size={15} aria-hidden="true" />}
                            hint="Mã hệ thống — không thể thay đổi"
                          />
                        )}
                      </div>

                      {/* Role chips */}
                      <div className="ps-role-section">
                        <span className="ps-field__label">Vai trò trong hệ thống</span>
                        <div className="ps-roles">
                          {userData?.roles.map((r) => (
                            <span key={r} className="ps-role-chip">
                              <Star size={11} aria-hidden="true" />
                              {ROLE_LABELS[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </SettingsSection>

                    {/* Pending changes bar */}
                    <div className={`ps-save-bar${profileDirty ? ' ps-save-bar--visible' : ''}`}>
                      <p className="ps-save-bar__msg">
                        <AlertCircle size={14} aria-hidden="true" />
                        Bạn có thay đổi chưa được lưu
                      </p>
                      <div className="ps-save-bar__actions">
                        <button
                          className="ps-btn ps-btn--ghost"
                          onClick={resetProfileForm}
                          type="button"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          className="ps-btn ps-btn--primary"
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                          type="button"
                        >
                          {profileLoading ? (
                            <>
                              <Loader2 size={14} className="ps-spin" aria-hidden="true" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Check size={14} aria-hidden="true" />
                              Lưu thay đổi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Thông tin tài khoản */}
                {activeTab === 'account' && (
                  <div className="ps-tab">
                    <SettingsSection
                      title="Thông tin tài khoản"
                      description="Quản lý thông tin đăng nhập và liên hệ của bạn."
                    >
                      <div className="ps-form-grid">
                        <PremiumInput
                          label="Tên đăng nhập"
                          id="userName"
                          value={userData?.userName || ''}
                          readOnly
                          icon={<AtSign size={15} aria-hidden="true" />}
                          hint="Tên đăng nhập không thể thay đổi sau khi tạo"
                        />

                        <PremiumInput
                          label="Địa chỉ email"
                          id="email"
                          type="email"
                          value={accountForm.email}
                          onChange={(v) => {
                            setAccountForm((f) => ({ ...f, email: v }));
                            setAccountDirty(true);
                            setAccountErrors((e) => ({ ...e, email: undefined }));
                          }}
                          placeholder="ten@example.com"
                          error={accountErrors.email}
                          required
                          hint="Dùng để đăng nhập và nhận thông báo quan trọng"
                        />

                        <PremiumInput
                          label="Số điện thoại"
                          id="phoneNumber"
                          type="tel"
                          value={accountForm.phoneNumber}
                          onChange={(v) => {
                            setAccountForm((f) => ({ ...f, phoneNumber: v }));
                            setAccountDirty(true);
                            setAccountErrors((e) => ({ ...e, phoneNumber: undefined }));
                          }}
                          placeholder="0912 345 678"
                          error={accountErrors.phoneNumber}
                          icon={<Phone size={15} aria-hidden="true" />}
                          hint="Định dạng Việt Nam: 0912345678 hoặc +84912345678"
                        />
                      </div>

                      {/* Read-only account metadata */}
                      <div className="ps-info-table">
                        <div className="ps-info-row">
                          <span className="ps-info-row__key">Trạng thái tài khoản</span>
                          <span className={`ps-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
                        </div>

                        <div className="ps-info-row">
                          <span className="ps-info-row__key">Ngày tham gia</span>
                          <span className="ps-info-row__val">
                            {userData?.createdDate
                              ? new Date(userData.createdDate).toLocaleDateString('vi-VN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '--'}
                          </span>
                        </div>

                        {userData?.updatedDate && (
                          <div className="ps-info-row">
                            <span className="ps-info-row__key">Cập nhật lần cuối</span>
                            <span className="ps-info-row__val">
                              {new Date(userData.updatedDate).toLocaleDateString('vi-VN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </SettingsSection>

                    <div className={`ps-save-bar${accountDirty ? ' ps-save-bar--visible' : ''}`}>
                      <p className="ps-save-bar__msg">
                        <AlertCircle size={14} aria-hidden="true" />
                        Bạn có thay đổi chưa được lưu
                      </p>
                      <div className="ps-save-bar__actions">
                        <button
                          className="ps-btn ps-btn--ghost"
                          onClick={resetAccountForm}
                          type="button"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          className="ps-btn ps-btn--primary"
                          onClick={handleAccountSave}
                          disabled={accountLoading}
                          type="button"
                        >
                          {accountLoading ? (
                            <>
                              <Loader2 size={14} className="ps-spin" aria-hidden="true" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Check size={14} aria-hidden="true" />
                              Lưu thay đổi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Bảo mật */}
                {activeTab === 'security' && (
                  <div className="ps-tab">
                    <SettingsSection
                      title="Đổi mật khẩu"
                      description="Sử dụng mật khẩu mạnh và duy nhất để bảo vệ tài khoản của bạn"
                    >
                      <div className="ps-form-stack">
                        <PremiumInput
                          label="Mật khẩu hiện tại"
                          id="currentPassword"
                          type={showPw.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(v) => {
                            setPasswordForm((f) => ({ ...f, currentPassword: v }));
                            setPasswordErrors((e) => ({ ...e, currentPassword: undefined }));
                          }}
                          placeholder="Nhập mật khẩu hiện tại"
                          error={passwordErrors.currentPassword}
                          required
                          rightElement={
                            <button
                              type="button"
                              className="ps-eye-btn"
                              onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                              aria-label={showPw.current ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                            >
                              {showPw.current ? (
                                <EyeOff size={16} aria-hidden="true" />
                              ) : (
                                <Eye size={16} aria-hidden="true" />
                              )}
                            </button>
                          }
                        />

                        <PremiumInput
                          label="Mật khẩu mới"
                          id="newPassword"
                          type={showPw.new_ ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(v) => {
                            setPasswordForm((f) => ({ ...f, newPassword: v }));
                            setPasswordErrors((e) => ({ ...e, newPassword: undefined }));
                          }}
                          placeholder="Nhập mật khẩu mới"
                          error={passwordErrors.newPassword}
                          required
                          rightElement={
                            <button
                              type="button"
                              className="ps-eye-btn"
                              onClick={() => setShowPw((s) => ({ ...s, new_: !s.new_ }))}
                              aria-label={showPw.new_ ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                            >
                              {showPw.new_ ? (
                                <EyeOff size={16} aria-hidden="true" />
                              ) : (
                                <Eye size={16} aria-hidden="true" />
                              )}
                            </button>
                          }
                        />

                        {/* Strength meter */}
                        {passwordForm.newPassword.length > 0 && (
                          <div className="ps-pw-strength" role="status" aria-live="polite">
                            <div className="ps-pw-meter">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`ps-pw-seg${i <= pwStrength ? ` ${pwStrengthMeta.cls}` : ''}`}
                                />
                              ))}
                            </div>
                            <span className={`ps-pw-label ${pwStrengthMeta.cls}`}>
                              {pwStrengthMeta.label}
                            </span>
                          </div>
                        )}

                        <PremiumInput
                          label="Xác nhận mật khẩu mới"
                          id="confirmPassword"
                          type={showPw.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(v) => {
                            setPasswordForm((f) => ({ ...f, confirmPassword: v }));
                            setPasswordErrors((e) => ({ ...e, confirmPassword: undefined }));
                          }}
                          placeholder="Nhập lại mật khẩu mới"
                          error={passwordErrors.confirmPassword}
                          required
                          rightElement={
                            <button
                              type="button"
                              className="ps-eye-btn"
                              onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                              aria-label={showPw.confirm ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                            >
                              {showPw.confirm ? (
                                <EyeOff size={16} aria-hidden="true" />
                              ) : (
                                <Eye size={16} aria-hidden="true" />
                              )}
                            </button>
                          }
                        />

                        {/* Password rule checklist */}
                        <div className="ps-pw-rules">
                          <p className="ps-pw-rules__title">Yêu cầu mật khẩu:</p>
                          <ul>
                            {[
                              {
                                ok: passwordForm.newPassword.length >= 8,
                                text: 'Ít nhất 8 ký tự',
                              },
                              {
                                ok: /[A-Z]/.test(passwordForm.newPassword),
                                text: 'Ít nhất 1 chữ hoa (A–Z)',
                              },
                              {
                                ok: /[a-z]/.test(passwordForm.newPassword),
                                text: 'Ít nhất 1 chữ thường (a–z)',
                              },
                              {
                                ok: /\d/.test(passwordForm.newPassword),
                                text: 'Ít nhất 1 chữ số (0–9)',
                              },
                              {
                                ok: /[!@#$%^&*]/.test(passwordForm.newPassword),
                                text: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*)',
                              },
                            ].map(({ ok, text }) => (
                              <li key={text} className={ok ? 'ps-pw-rule--ok' : ''}>
                                <Check size={11} />
                                {text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="ps-card__actions">
                        <button
                          className="ps-btn ps-btn--primary"
                          onClick={handlePasswordSave}
                          disabled={
                            passwordLoading ||
                            !passwordForm.currentPassword ||
                            !passwordForm.newPassword ||
                            !passwordForm.confirmPassword
                          }
                          type="button"
                        >
                          {passwordLoading ? (
                            <>
                              <Loader2 size={14} className="ps-spin" aria-hidden="true" />
                              Đang cập nhật...
                            </>
                          ) : (
                            <>
                              <Lock size={14} aria-hidden="true" />
                              Cập nhật mật khẩu
                            </>
                          )}
                        </button>
                      </div>
                    </SettingsSection>

                    <SettingsSection
                      title="Phiên đăng nhập"
                      description="Thông tin về phiên làm việc hiện tại của bạn"
                    >
                      <div className="ps-session">
                        <div className="ps-session__icon">
                          <Shield size={20} aria-hidden="true" />
                        </div>
                        <div className="ps-session__info">
                          <p className="ps-session__title">Phiên hiện tại</p>
                          <p className="ps-session__meta">
                            Đang hoạt động &mdash;{' '}
                            {new Date().toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className="ps-badge ps-badge--green">Đang hoạt động</span>
                      </div>
                    </SettingsSection>
                  </div>
                )}

                {/* ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
                    TAB: Tùy chọn
                ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"? */}
                {activeTab === 'preferences' && (
                  <div className="ps-tab">
                    <SettingsSection
                      title="Ngôn ngữ & Giao diện"
                      description="Tùy chỉnh ngôn ngữ và giao diện của nền tảng"
                    >
                      <div className="ps-pref-row">
                        <div className="ps-pref-text">
                          <p className="ps-pref-text__title">Ngôn ngữ hiển thị</p>
                          <p className="ps-pref-text__desc">Áp dụng cho toàn bộ giao diện</p>
                        </div>
                        <select
                          className="ps-field__select ps-field__select--inline"
                          value={prefs.language}
                          onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                          aria-label="Chọn ngôn ngữ"
                        >
                          <option value="vi">🇻🇳 Tiếng Việt</option>
                          <option value="en">🇺🇸 English</option>
                        </select>
                      </div>

                      <div className="ps-divider" />

                      <div className="ps-pref-row">
                        <div className="ps-pref-text">
                          <p className="ps-pref-text__title">Chế độ giao diện</p>
                          <p className="ps-pref-text__desc">Chọn chế độ phù hợp với bạn</p>
                        </div>
                        <div className="ps-theme-group" role="group" aria-label="Chọn chế độ">
                          {(['light', 'dark'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`ps-theme-btn${prefs.theme === t ? ' ps-theme-btn--active' : ''}`}
                              onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                              aria-pressed={prefs.theme === t}
                            >
                              {t === 'light' ? '☀️ Sáng' : '🌙 Tối'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </SettingsSection>

                    <SettingsSection
                      title="Bảng điều khiển"
                      description="Kiểm soát thông tin hiển thị trên trang tổng quan"
                    >
                      <div className="ps-toggles">
                        <div className="ps-toggle-row">
                          <div>
                            <p className="ps-toggle-row__title">Thanh tiến độ học tập</p>
                            <p className="ps-toggle-row__desc">
                              Hiển thị tiến trình hoàn thành khóa học
                            </p>
                          </div>
                          <ToggleSwitch
                            id="toggle-progress"
                            checked={prefs.showProgress}
                            onChange={(v) => setPrefs((p) => ({ ...p, showProgress: v }))}
                            label="Bật/tắt hiển thị tiến độ học tập"
                          />
                        </div>
                        <div className="ps-toggle-row">
                          <div>
                            <p className="ps-toggle-row__title">Bảng xếp hạng</p>
                            <p className="ps-toggle-row__desc">
                              Vị trí của bạn so với các học viên khác
                            </p>
                          </div>
                          <ToggleSwitch
                            id="toggle-rankings"
                            checked={prefs.showRankings}
                            onChange={(v) => setPrefs((p) => ({ ...p, showRankings: v }))}
                            label="Bật/tắt hiển thị bảng xếp hạng"
                          />
                        </div>
                      </div>
                    </SettingsSection>

                    <div className="ps-prefs-footer">
                      <button
                        className="ps-btn ps-btn--primary"
                        onClick={handlePrefsSave}
                        type="button"
                      >
                        <Check size={14} aria-hidden="true" />
                        Lưu tùy chọn
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
