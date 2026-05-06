import {
  ArrowLeft,
  Facebook,
  Globe,
  Linkedin,
  MessageSquare,
  PlayCircle,
  Star,
  Users,
  Youtube,
} from 'lucide-react';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CourseCard } from '../../components/course/CourseCard';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useInstructorCourses, useTeacherProfile } from '../../hooks/useCourses';
import type { CourseResponse } from '../../types';

const InstructorPublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profileResponse, isLoading: isProfileLoading } = useTeacherProfile(id!);
  const { data: coursesResponse, isLoading: isCoursesLoading } = useInstructorCourses(id!);

  const profile = profileResponse?.result;
  const courses = coursesResponse?.result;

  if (isProfileLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Đang tải hồ sơ giảng viên...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
        <div className="error-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Không tìm thấy giảng viên</h2>
          <Link
            to="/student/courses"
            className="btn secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
            }}
          >
            <ArrowLeft size={18} />
            Quay lại danh sách khóa học
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
      <div className="instructor-profile-page">
        {/* ── Top Header ── */}
        <header className="profile-header-premium">
          <div className="header-content">
            <div className="profile-identity-large">
              <div className="avatar-wrapper">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.fullName} className="avatar-large-img" />
                ) : (
                  <div className="avatar-placeholder-xl">{profile.fullName.charAt(0)}</div>
                )}
              </div>
              <div className="identity-text">
                <span className="badge-instructor">GIẢNG VIÊN</span>
                <h1 className="instructor-name-xl">{profile.fullName}</h1>
                <p className="instructor-position-xl">
                  {profile.position || 'Giảng viên chuyên nghiệp'}
                </p>

                <div className="instructor-social-links">
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Website"
                    >
                      <Globe size={20} />
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="LinkedIn"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                  {profile.youtubeUrl && (
                    <a
                      href={profile.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="YouTube"
                    >
                      <Youtube size={20} />
                    </a>
                  )}
                  {profile.facebookUrl && (
                    <a
                      href={profile.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Facebook"
                    >
                      <Facebook size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="stat-card-premium">
                <Users className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{profile.totalStudents.toLocaleString()}</span>
                  <span className="stat-label">Học viên</span>
                </div>
              </div>
              <div className="stat-card-premium">
                <MessageSquare className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{profile.totalRatings.toLocaleString()}</span>
                  <span className="stat-label">Đánh giá</span>
                </div>
              </div>
              <div className="stat-card-premium">
                <Star className="stat-icon" fill="#FBBF24" color="#FBBF24" />
                <div className="stat-info">
                  <span className="stat-value">{profile.averageRating.toFixed(1)}</span>
                  <span className="stat-label">Xếp hạng</span>
                </div>
              </div>
              <div className="stat-card-premium">
                <PlayCircle className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{profile.totalCourses}</span>
                  <span className="stat-label">Khóa học</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="profile-body">
          <div className="profile-container">
            {/* ── Biography ── */}
            <section className="profile-section">
              <h2 className="section-title-premium">Giới thiệu</h2>
              <div className="bio-content-premium">
                {profile.description ? (
                  <p>{profile.description}</p>
                ) : (
                  <p className="no-data" style={{ opacity: 0.5, fontStyle: 'italic' }}>
                    Giảng viên này chưa cập nhật tiểu sử.
                  </p>
                )}
              </div>
            </section>

            {/* ── Courses ── */}
            <section className="profile-section">
              <div className="section-header-row">
                <h2 className="section-title-premium">
                  Khóa học của {profile.fullName} ({courses?.length || 0})
                </h2>
              </div>

              {isCoursesLoading ? (
                <div className="loading-mini">Đang tải danh sách khóa học...</div>
              ) : courses && courses.length > 0 ? (
                <div className="courses-grid-premium">
                  {courses.map((course: CourseResponse, idx: number) => (
                    <CourseCard key={course.id} course={course} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="no-courses-card">
                  <PlayCircle size={48} className="empty-icon" />
                  <p>Giảng viên hiện chưa có khóa học nào được công khai.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <style>{`
        .instructor-profile-page {
          margin: -1.5rem;
          background: #f8fafc;
          min-height: 100vh;
        }

        .profile-header-premium {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          padding: 4rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 3rem;
          position: relative;
          z-index: 10;
        }

        .profile-identity-large {
          display: flex;
          gap: 2.5rem;
          align-items: center;
          flex: 1;
        }

        .avatar-large-img {
          width: 180px;
          height: 180px;
          border-radius: 24px;
          object-fit: cover;
          border: 4px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .avatar-placeholder-xl {
          width: 180px;
          height: 180px;
          background: #4f46e5;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 5rem;
          font-weight: 800;
          color: white;
          border: 4px solid rgba(255, 255, 255, 0.1);
        }

        .badge-instructor {
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .instructor-name-xl {
          font-size: 3rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .instructor-position-xl {
          font-size: 1.25rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .instructor-social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .social-link:hover {
          color: white;
          background: #4f46e5;
          transform: translateY(-2px);
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          min-width: 320px;
        }

        .stat-card-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          color: #6366f1;
          width: 24px;
          height: 24px;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .profile-body {
          padding: 3rem 2rem;
        }

        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-section {
          margin-bottom: 4rem;
        }

        .section-title-premium {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .bio-content-premium {
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          color: #334155;
          line-height: 1.8;
          font-size: 1.05rem;
          white-space: pre-wrap;
        }

        .courses-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .no-courses-card {
          background: white;
          border-radius: 20px;
          border: 2px dashed #e2e8f0;
          padding: 4rem;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          margin: 0 auto 1rem;
          opacity: 0.2;
        }

        @media (max-width: 1024px) {
          .header-content { flex-direction: column; }
          .profile-stats-grid { width: 100%; grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 768px) {
          .profile-identity-large { flex-direction: column; text-align: center; }
          .profile-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .instructor-name-xl { font-size: 2.25rem; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default InstructorPublicProfile;
