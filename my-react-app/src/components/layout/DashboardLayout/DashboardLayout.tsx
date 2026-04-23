import React, { useEffect, useMemo, useState } from 'react';
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
  const collapsedStorageKey = useMemo(() => `mm.sidebar.collapsed.${role}`, [role]);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(collapsedStorageKey) === '1';
  });

  useEffect(() => {
    window.localStorage.setItem(collapsedStorageKey, collapsed ? '1' : '0');
  }, [collapsed, collapsedStorageKey]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(collapsedStorageKey) === '1');
  }, [collapsedStorageKey]);

  const sidebarW = collapsed ? '64px' : '248px';

  return (
    <div className="dashboard-layout" style={{ '--sidebar-w': sidebarW } as React.CSSProperties}>
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="dashboard-main">
        <Navbar user={user} notificationCount={notificationCount} />
        <main className={['dashboard-content', contentClassName].filter(Boolean).join(' ')}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
