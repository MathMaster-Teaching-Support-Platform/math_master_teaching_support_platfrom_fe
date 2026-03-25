import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

type Status = 'loading' | 'success' | 'error';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(() => (token ? 'loading' : 'error'));
  const [errorMessage, setErrorMessage] = useState<string>(() =>
    token ? '' : 'Liên kết xác nhận không hợp lệ.'
  );
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) return;

    AuthService.confirmEmail(token)
      .then((res) => {
        if (res.code === 1000) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setErrorMessage('Xác nhận email thất bại. Vui lòng thử lại.');
          setStatus('error');
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === 1006) {
          setErrorMessage(
            'Liên kết xác nhận này không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.'
          );
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : 'Xác nhận email thất bại. Vui lòng thử lại.'
          );
        }
        setStatus('error');
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-math-bg" aria-hidden="true">
          <span className="auth-math-sym ms1">∑</span>
          <span className="auth-math-sym ms2">∫</span>
          <span className="auth-math-sym ms3">√</span>
          <span className="auth-math-sym ms4">π</span>
          <span className="auth-math-sym ms5">∞</span>
          <span className="auth-math-sym ms6">Δ</span>
          <span className="auth-math-sym ms7">θ</span>
          <span className="auth-math-sym ms8">α</span>
        </div>
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link" aria-label="Về trang chủ MathMaster">
            <div className="auth-logo-mark">M</div>
            <div>
              <h1>MathMaster</h1>
            </div>
          </Link>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>
      </div>

      <div className="auth-right">
        <Link to="/" className="auth-nav-link auth-nav" aria-label="Về trang chủ">
          ← Trang chủ
        </Link>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Xác nhận email</h2>
          </div>

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p>Đang xác nhận tài khoản của bạn...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              <p>Tài khoản của bạn đã được kích hoạt! Bạn có thể đăng nhập ngay bây giờ.</p>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                Đang chuyển đến trang đăng nhập...{' '}
                <Link to="/login" className="link-primary">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ marginTop: '1rem' }}>
              <div className="alert alert-error">{errorMessage}</div>
              <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                <p>
                  <Link to="/register" className="link-primary">
                    Đăng ký lại
                  </Link>
                  {' · '}
                  <Link to="/login" className="link-primary">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
