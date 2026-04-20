import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import './Auth.css';

const StudentOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    fullName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pre-fill from token if available
    const token = AuthService.getToken();
    if (token) {
      const decoded = AuthService.decodeToken(token);
      if (decoded) {
        // We might need an endpoint to get full user details here if token doesn't have name
        // For now, let's assume we might have it or just let user fill.
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.selectRole({
        role: 'STUDENT',
        userName: formData.userName,
        fullName: formData.fullName,
      });

      if (response.code === 1000) {
        // Save new token with STUDENT role
        AuthService.saveToken(response.result.token, response.result.expiryTime);
        navigate('/student/courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Hoàn tất thông tin</h2>
            <p>Vui lòng cập nhật thông tin để bắt đầu học tập</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-control"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userName" className="form-label">
                Tên đăng nhập (Username)
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                className="form-control"
                placeholder="nguenvana123"
                value={formData.userName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Xác nhận và tiếp tục'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
