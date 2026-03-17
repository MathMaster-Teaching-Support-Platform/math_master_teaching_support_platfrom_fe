import React, { useState } from 'react';
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
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  user,
  notificationCount,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? '64px' : '248px';

  return (
    <div className="dashboard-layout" style={{ '--sidebar-w': sidebarW } as React.CSSProperties}>
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="dashboard-main">
        <Navbar user={user} notificationCount={notificationCount} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
