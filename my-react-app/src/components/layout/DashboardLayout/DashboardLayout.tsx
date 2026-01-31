import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
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
  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">
        <Navbar user={user} notificationCount={notificationCount} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
