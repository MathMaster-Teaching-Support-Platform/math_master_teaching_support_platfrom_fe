import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './Certificates.css';

interface Certificate {
  id: number;
  title: string;
  course: string;
  issueDate: string;
  score: number;
  certificateId: string;
  image: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  progress: number;
  total: number;
  category: string;
}

const Certificates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'certificates' | 'achievements'>('certificates');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const certificates: Certificate[] = [
    {
      id: 1,
      title: 'Chứng chỉ Hoàn thành Khóa học Đại số',
      course: 'Toán 11 - Đại số',
      issueDate: '15/01/2026',
      score: 9.2,
      certificateId: 'CERT-2026-001234',
      image: '📜',
    },
    {
      id: 2,
      title: 'Chứng chỉ Hoàn thành Khóa học Hình học',
      course: 'Toán 10 - Hình học',
      issueDate: '20/12/2025',
      score: 8.8,
      certificateId: 'CERT-2025-005678',
      image: '📜',
    },
    {
      id: 3,
      title: 'Chứng chỉ Xuất sắc - Giải tích',
      course: 'Toán 12 - Giải tích',
      issueDate: '10/11/2025',
      score: 9.5,
      certificateId: 'CERT-2025-009012',
      image: '🏆',
    },
  ];

  const achievements: Achievement[] = [
    {
      id: 1,
      title: 'Người Mới Bắt Đầu',
      description: 'Hoàn thành bài học đầu tiên',
      icon: '🎯',
      earnedDate: '05/01/2026',
      progress: 1,
      total: 1,
      category: 'milestone',
    },
    {
      id: 2,
      title: 'Học Sinh Chăm Chỉ',
      description: 'Học 7 ngày liên tiếp',
      icon: '🔥',
      earnedDate: '12/01/2026',
      progress: 7,
      total: 7,
      category: 'streak',
    },
    {
      id: 3,
      title: 'Thợ Săn Điểm Số',
      description: 'Đạt điểm 10 trong 5 bài kiểm tra',
      icon: '⭐',
      earnedDate: '18/01/2026',
      progress: 5,
      total: 5,
      category: 'score',
    },
    {
      id: 4,
      title: 'Người Giải Quyết Vấn Đề',
      description: 'Giải 50 bài tập',
      icon: '🧩',
      earnedDate: '25/01/2026',
      progress: 50,
      total: 50,
      category: 'practice',
    },
    {
      id: 5,
      title: 'Chuyên Gia Đại Số',
      description: 'Hoàn thành tất cả bài học Đại số',
      icon: '📐',
      earnedDate: '15/01/2026',
      progress: 20,
      total: 20,
      category: 'subject',
    },
    {
      id: 6,
      title: 'Chiến Binh 30 Ngày',
      description: 'Học 30 ngày liên tiếp',
      icon: '🏅',
      earnedDate: '',
      progress: 22,
      total: 30,
      category: 'streak',
    },
    {
      id: 7,
      title: 'Bậc Thầy Hình Học',
      description: 'Hoàn thành tất cả bài học Hình học',
      icon: '📏',
      earnedDate: '',
      progress: 15,
      total: 25,
      category: 'subject',
    },
    {
      id: 8,
      title: 'Nhà Vô Địch Quiz',
      description: 'Đạt điểm cao nhất trong quiz',
      icon: '🥇',
      earnedDate: '',
      progress: 8,
      total: 10,
      category: 'score',
    },
  ];

  const filteredAchievements = achievements.filter((ach) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'earned') return ach.earnedDate !== '';
    if (categoryFilter === 'locked') return ach.earnedDate === '';
    return ach.category === categoryFilter;
  });

  const stats = {
    certificates: certificates.length,
    achievements: achievements.filter((a) => a.earnedDate !== '').length,
    avgScore: (certificates.reduce((sum, c) => sum + c.score, 0) / certificates.length).toFixed(1),
    totalPoints: achievements.filter((a) => a.earnedDate !== '').length * 100,
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="certificates-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 Chứng Chỉ & Thành Tích</h1>
            <p className="page-subtitle">Thành tựu học tập và chứng nhận của bạn</p>
          </div>
        </div>

        {/* Stats */}
        <div className="certs-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              📜
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.certificates}</div>
              <div className="stat-label">Chứng chỉ</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              🏅
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.achievements}</div>
              <div className="stat-label">Thành tích</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              ⭐
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.avgScore}</div>
              <div className="stat-label">Điểm TB</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              💎
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalPoints}</div>
              <div className="stat-label">Điểm thưởng</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="certs-tabs">
          <button
            className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            📜 Chứng chỉ ({certificates.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🏅 Thành tích ({achievements.filter((a) => a.earnedDate).length}/{achievements.length})
          </button>
        </div>

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="certificates-grid">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="certificate-card"
                onClick={() => setSelectedCertificate(cert)}
              >
                <div className="cert-badge">{cert.image}</div>
                <div className="cert-content">
                  <h3 className="cert-title">{cert.title}</h3>
                  <p className="cert-course">{cert.course}</p>
                  <div className="cert-details">
                    <div className="cert-detail-item">
                      <span className="detail-label">Ngày cấp:</span>
                      <span className="detail-value">{cert.issueDate}</span>
                    </div>
                    <div className="cert-detail-item">
                      <span className="detail-label">Điểm số:</span>
                      <span className="detail-value score">{cert.score}/10</span>
                    </div>
                    <div className="cert-detail-item">
                      <span className="detail-label">Mã số:</span>
                      <span className="detail-value">{cert.certificateId}</span>
                    </div>
                  </div>
                  <div className="cert-actions">
                    <button className="action-btn primary">📥 Tải xuống</button>
                    <button className="action-btn secondary">🔗 Chia sẻ</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <>
            <div className="achievement-filters">
              <button
                className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`filter-btn ${categoryFilter === 'earned' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('earned')}
              >
                ✅ Đã đạt
              </button>
              <button
                className={`filter-btn ${categoryFilter === 'locked' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('locked')}
              >
                🔒 Chưa đạt
              </button>
            </div>

            <div className="achievements-grid">
              {filteredAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`achievement-card ${ach.earnedDate ? 'earned' : 'locked'}`}
                >
                  {!ach.earnedDate && <div className="locked-overlay">🔒</div>}
                  <div className="ach-icon">{ach.icon}</div>
                  <h3 className="ach-title">{ach.title}</h3>
                  <p className="ach-description">{ach.description}</p>

                  <div className="ach-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(ach.progress / ach.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {ach.progress}/{ach.total}
                    </div>
                  </div>

                  {ach.earnedDate && (
                    <div className="earned-date">✅ Đạt được: {ach.earnedDate}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Certificate Detail Modal */}
        {selectedCertificate && (
          <div className="modal-overlay" onClick={() => setSelectedCertificate(null)}>
            <div className="modal certificate-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedCertificate(null)}>
                ✕
              </button>

              <div className="certificate-preview">
                <div className="cert-frame">
                  <div className="cert-header">
                    <div className="cert-logo">🎓</div>
                    <h2>MathMaster Education</h2>
                  </div>

                  <div className="cert-body">
                    <p className="cert-label">CHỨNG NHẬn</p>
                    <h1 className="cert-main-title">{selectedCertificate.title}</h1>

                    <p className="cert-recipient">Chứng nhận rằng</p>
                    <h2 className="cert-name">{mockStudent.name}</h2>

                    <p className="cert-achievement">
                      Đã hoàn thành xuất sắc khóa học
                      <br />
                      <strong>{selectedCertificate.course}</strong>
                      <br />
                      với số điểm <strong>{selectedCertificate.score}/10</strong>
                    </p>

                    <div className="cert-footer-info">
                      <div className="cert-date">
                        <div className="info-label">Ngày cấp</div>
                        <div className="info-value">{selectedCertificate.issueDate}</div>
                      </div>
                      <div className="cert-id">
                        <div className="info-label">Mã chứng chỉ</div>
                        <div className="info-value">{selectedCertificate.certificateId}</div>
                      </div>
                    </div>

                    <div className="cert-signature">
                      <div className="signature-line"></div>
                      <div className="signature-name">Giám đốc MathMaster</div>
                    </div>
                  </div>

                  <div className="cert-decoration">
                    <div className="decoration-corner tl"></div>
                    <div className="decoration-corner tr"></div>
                    <div className="decoration-corner bl"></div>
                    <div className="decoration-corner br"></div>
                  </div>
                </div>

                <div className="cert-modal-actions">
                  <button className="btn btn-primary">📥 Tải xuống PDF</button>
                  <button className="btn btn-outline">🔗 Sao chép link</button>
                  <button className="btn btn-outline">📧 Gửi email</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Certificates;
