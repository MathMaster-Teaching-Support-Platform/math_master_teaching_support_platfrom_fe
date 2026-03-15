import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap } from 'lucide-react';
import './Auth.css';

const SelectRole: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectRole = async (role: 'TEACHER' | 'STUDENT') => {
    setIsLoading(true);
    setError('');
    
    try {
        // If it's a student, we might want to redirect them to a page to fill username/fullname first
        // or just auto-assign if they already have it from Google.
        // Actually, let's redirect to specific onboarding pages.
        
        if (role === 'STUDENT') {
            navigate('/onboarding/student');
        } else {
            navigate('/onboarding/teacher');
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-right" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div className="auth-card" style={{ padding: '3rem' }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Chào mừng bạn đến với MathMaster!</h2>
            <p style={{ fontSize: '1.2rem' }}>Để bắt đầu, vui lòng chọn vai trò của bạn trên hệ thống.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="role-selection-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            marginTop: '2rem'
          }}>
            <div 
              className="role-card" 
              onClick={() => !isLoading && handleSelectRole('TEACHER')}
              style={{
                border: '2px solid #e2e8f0',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="role-icon" style={{ 
                width: '80px', 
                height: '80px', 
                background: 'rgba(102, 126, 234, 0.1)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#667eea'
              }}>
                <GraduationCap size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2d3748' }}>Giáo viên</h3>
              <p style={{ color: '#718096', lineHeight: '1.6' }}>
                Tạo bài giảng, quản lý lớp học và theo dõi tiến độ học tập của học sinh.
              </p>
            </div>

            <div 
              className="role-card" 
              onClick={() => !isLoading && handleSelectRole('STUDENT')}
              style={{
                border: '2px solid #e2e8f0',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="role-icon" style={{ 
                width: '80px', 
                height: '80px', 
                background: 'rgba(102, 126, 234, 0.1)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#667eea'
              }}>
                <User size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2d3748' }}>Học sinh</h3>
              <p style={{ color: '#718096', lineHeight: '1.6' }}>
                Tham gia các khóa học, làm bài tập và nhận hỗ trợ từ AI cùng giáo viên.
              </p>
            </div>
          </div>
          
          {isLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p>Đang chuẩn bị...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
