import { Settings, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import ProfileSettings from '../settings/ProfileSettings';
import MyTeacherProfile from '../teacher-profile/MyTeacherProfile';
import SubmitTeacherProfile from '../teacher-profile/SubmitTeacherProfile';
import './Profile.css';

type ProfileTab = 'account' | 'teacher-profile';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [hasTeacherProfile, setHasTeacherProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeacherProfile();

    // Hide sidebar when component mounts
    document.body.classList.add('profile-active');

    // Show sidebar when component unmounts
    return () => {
      document.body.classList.remove('profile-active');
    };
  }, []);

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

  const handleProfileSuccess = () => {
    // Reload profile status and switch to view mode
    checkTeacherProfile();
  };

  const handleProfileDelete = () => {
    // Reload profile status and stay on teacher-profile tab
    checkTeacherProfile();
  };

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Simple navbar */}
      <nav className="profile-navbar">
        <div className="profile-navbar-content">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Profile Settings</h1>
          <div></div> {/* Spacer for flex layout */}
        </div>
      </nav>

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-sidebar">
            <h2>Cài đặt</h2>
            <nav className="profile-nav">
              <button
                className={`profile-nav-item ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => handleTabChange('account')}
              >
                <span className="nav-icon">
                  <Settings size={16} strokeWidth={2} />
                </span>
                Tài khoản
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'teacher-profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('teacher-profile')}
              >
                <span className="nav-icon">
                  <ShieldCheck size={16} strokeWidth={2} />
                </span>
                Hồ sơ Giáo viên
              </button>
            </nav>
          </div>

          <div className="profile-content">
            {activeTab === 'account' && <ProfileSettings />}
            {activeTab === 'teacher-profile' &&
              (hasTeacherProfile ? (
                <MyTeacherProfile onDelete={handleProfileDelete} />
              ) : (
                <SubmitTeacherProfile onSuccess={handleProfileSuccess} />
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
