import React, { useEffect, useMemo, useState } from 'react';
import { AuthService } from '../../../services/api/auth.service';
import { UserService } from '../../../services/api/user.service';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'teacher' | 'student' | 'admin';
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  notificationCount?: number;
  /** Extra class on the scrollable <main> (e.g. full-bleed / zero padding) */
  contentClassName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  user,
  notificationCount,
  contentClassName,
}) => {
  const profileCacheKey = useMemo(() => 'mm.user.profile', []);
  const collapsedStorageKey = useMemo(() => `mm.sidebar.collapsed.${role}`, [role]);
  const getInitials = (fullName: string) =>
    fullName
      .trim()
      .split(/\s+/)
      .map((part) => part[0] || '')
      .join('')
      .slice(-2)
      .toUpperCase();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (globalThis.window === undefined) return false;
    return globalThis.localStorage.getItem(collapsedStorageKey) === '1';
  });

  useEffect(() => {
    globalThis.localStorage.setItem(collapsedStorageKey, collapsed ? '1' : '0');
  }, [collapsed, collapsedStorageKey]);

  useEffect(() => {
    const nextCollapsed = globalThis.localStorage.getItem(collapsedStorageKey) === '1';
    if (nextCollapsed === collapsed) return;
    const syncTimer = globalThis.setTimeout(() => {
      setCollapsed(nextCollapsed);
    }, 0);
    return () => globalThis.clearTimeout(syncTimer);
  }, [collapsed, collapsedStorageKey]);

  const [resolvedUser, setResolvedUser] = useState(() => {
    if (!AuthService.isAuthenticated()) return user;
    const cached = globalThis.localStorage.getItem(profileCacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { name?: string; avatar?: string };
        const cachedName = parsed.name?.trim() || 'Người dùng';
        const cachedAvatar = parsed.avatar?.trim() || getInitials(cachedName);
        return { ...user, name: cachedName, avatar: cachedAvatar, role };
      } catch {
        // Fall through to stable default when cache is invalid.
      }
    }
    return { ...user, name: 'Người dùng', avatar: 'ND', role };
  });

  useEffect(() => {
    if (!AuthService.isAuthenticated()) return;

    let mounted = true;

    const loadUser = async () => {
      try {
        const profile = await UserService.getMyInfo();
        if (!mounted) return;
        const profileName = profile.fullName?.trim() || 'Người dùng';
        const profileAvatar = profile.avatar?.trim() || getInitials(profileName);
        globalThis.localStorage.setItem(
          profileCacheKey,
          JSON.stringify({ name: profileName, avatar: profileAvatar })
        );

        setResolvedUser((prev) => ({
          ...prev,
          name: profileName,
          avatar: profileAvatar,
          role,
        }));
      } catch {
        // Keep cached/stable value if API is unavailable.
      }
    };

    void loadUser();
    const handleAuthRefresh = () => {
      void loadUser();
    };
    globalThis.addEventListener('authChange', handleAuthRefresh);

    return () => {
      mounted = false;
      globalThis.removeEventListener('authChange', handleAuthRefresh);
    };
  }, [profileCacheKey, role]);

  const sidebarW = collapsed ? '64px' : '248px';

  return (
    <div
      className="dashboard-layout"
      data-notification-count={notificationCount ?? undefined}
      style={{ '--sidebar-w': sidebarW } as React.CSSProperties}
    >
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="dashboard-main">
        <Navbar user={resolvedUser} />
        <main className={['dashboard-content', contentClassName].filter(Boolean).join(' ')}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
