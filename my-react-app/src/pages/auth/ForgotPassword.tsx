import React, { useState } from 'react';
import { ArrowLeft, Clock3, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import './Auth.css';

const MathLemniscateWarm = () => (
  <svg className="auth-graph" viewBox="0 0 520 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="260" cy="130" rx="118" ry="62" stroke="rgba(250,249,245,0.2)" strokeWidth="1" />
    <ellipse cx="260" cy="130" rx="86" ry="44" stroke="rgba(250,249,245,0.12)" strokeWidth="1" />
    <path
      d="M 260,130 C 298,94 368,94 368,130 C 368,166 298,166 260,130"
      stroke="#C96442"
      strokeWidth="2.7"
      fill="rgba(201,100,66,0.1)"
    />
    <path
      d="M 260,130 C 222,94 152,94 152,130 C 152,166 222,166 260,130"
      stroke="rgba(250,249,245,0.7)"
      strokeWidth="2.2"
      strokeDasharray="5 3"
      fill="rgba(250,249,245,0.08)"
    />
    <circle cx="260" cy="130" r="3.8" fill="rgba(250,249,245,0.75)" />
    <circle cx="368" cy="130" r="4.2" fill="#C96442" />
    <circle cx="152" cy="130" r="4.2" fill="#C96442" />
    <text x="64" y="74" fill="rgba(250,249,245,0.82)" fontSize="13" fontFamily="Georgia, serif" fontStyle="italic">
      (x² + y²)² = a²(x² − y²)
    </text>
  </svg>
);

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await AuthService.forgotPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container bg-[#F5F4ED] font-[Be_Vietnam_Pro]">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link" aria-label="Về trang chủ MathMaster">
            <span className="auth-logo-text-icon">∑π</span>
            <div>
              <h1
                className="font-medium text-[#141413]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                MathMaster
              </h1>
            </div>
          </Link>
          <p className="brand-tagline">Nền tảng hỗ trợ giảng dạy toán học</p>
        </div>

        <MathLemniscateWarm />

        <blockquote className="auth-quote">
          <p>"Không có vấn đề nào trong toán học không thể giải quyết được."</p>
          <footer>— David Hilbert</footer>
        </blockquote>

        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-number">1,200+</span>
            <span className="auth-stat-label">Giáo viên</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-number">50K+</span>
            <span className="auth-stat-label">Học sinh</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-number">200K+</span>
            <span className="auth-stat-label">Câu hỏi</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right flex-1 bg-[#F5F4ED]">
        <Link
          to="/login"
          className="auth-nav-link auth-nav inline-flex items-center gap-2 rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[#5E5D59] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
          aria-label="Quay lại đăng nhập"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="auth-card bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5]">
          <div className="auth-card-inner">
            {isSuccess ? (
              /* ── Success state ── */
              <div className="reg-success">
                <div className="reg-success__icon-wrap">
                  <div className="reg-success__icon">
                    <Mail className="h-12 w-12 text-[#5E5D59]" />
                  </div>
                </div>
                <h2
                  className="reg-success__title font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  Kiểm tra hộp thư!
                </h2>
                <p className="reg-success__body">
                  Nếu địa chỉ <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link
                  đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư mục spam).
                </p>
                <span className="reg-success__hint inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" /> Link có hiệu lực trong <strong>15 phút</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-block reg-success__btn bg-[#C96442] font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                >
                  Gửi lại email
                </button>
                <div
                  className="auth-footer"
                  style={{ marginTop: '1.25rem', width: '100%', maxWidth: '320px' }}
                >
                  <p>
                    <Link to="/login" className="link-primary">
                      Quay lại đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Request form ── */
              <>
                <div className="auth-header">
                  <h2
                    className="font-medium text-[#141413]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                  >
                    Quên mật khẩu
                  </h2>
                  <p>Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  {error && <div className="alert alert-error">{error}</div>}

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <div className="input-icon-wrap">
                      <span className="input-icon">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control with-icon font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block bg-[#C96442] font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                    disabled={isLoading}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="btn-spinner" /> Đang gửi...
                      </>
                    ) : (
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    Nhớ mật khẩu rồi?{' '}
                    <Link to="/login" className="link-primary">
                      Đăng nhập
                    </Link>
                  </p>
                  <p>
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="link-primary">
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
