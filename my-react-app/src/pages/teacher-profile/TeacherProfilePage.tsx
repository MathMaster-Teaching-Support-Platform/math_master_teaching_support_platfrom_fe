import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import MyTeacherProfile from './MyTeacherProfile';
import SubmitTeacherProfile from './SubmitTeacherProfile';

function getLayoutRole(role: string): 'teacher' | 'student' | 'admin' {
  if (role === 'teacher') return 'teacher';
  if (role === 'admin') return 'admin';
  return 'student';
}

const TeacherProfilePage: React.FC = () => {
  const currentRole = AuthService.getUserRole() || 'student';
  const layoutRole = getLayoutRole(currentRole);

  const [hasTeacherProfile, setHasTeacherProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkTeacherProfile = async () => {
    try {
      await TeacherProfileService.getMyProfile();
      setHasTeacherProfile(true);
    } catch {
      setHasTeacherProfile(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkTeacherProfile();
  }, []);

  const handleProfileSuccess = () => {
    void checkTeacherProfile();
  };

  const handleProfileDelete = () => {
    void checkTeacherProfile();
  };

  let content: React.ReactNode;
  if (loading) {
    content = <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  } else if (hasTeacherProfile) {
    content = <MyTeacherProfile onDelete={handleProfileDelete} />;
  } else {
    content = <SubmitTeacherProfile onSuccess={handleProfileSuccess} />;
  }

  return (
    <DashboardLayout
      role={layoutRole}
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: layoutRole }}
      notificationCount={5}
    >
      {content}
    </DashboardLayout>
  );
};

export default TeacherProfilePage;
