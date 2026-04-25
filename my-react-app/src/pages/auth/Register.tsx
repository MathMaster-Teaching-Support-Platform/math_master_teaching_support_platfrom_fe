import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import type { RegisterRequest } from '../../types/auth.types';
import { ApiError } from '../../types/auth.types';
import './Auth.css';

const MathRoseWarm = () => (
  <svg className="auth-graph" viewBox="0 0 520 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="260" cy="130" r="96" stroke="rgba(250,249,245,0.2)" strokeWidth="1" />
    <circle cx="260" cy="130" r="64" stroke="rgba(250,249,245,0.14)" strokeWidth="1" />
    <circle cx="260" cy="130" r="36" stroke="rgba(250,249,245,0.12)" strokeWidth="1" />
    <path
      d="M 260,130 C 295,96 356,96 356,130 C 356,164 295,164 260,130"
      stroke="#C96442"
      strokeWidth="2.6"
      fill="rgba(201,100,66,0.12)"
    />
    <path
      d="M 260,130 C 225,96 164,96 164,130 C 164,164 225,164 260,130"
      stroke="rgba(250,249,245,0.7)"
      strokeWidth="2.4"
      fill="rgba(250,249,245,0.08)"
    />
    <path
      d="M 260,130 C 228,164 228,225 260,225 C 292,225 292,164 260,130"
      stroke="#C96442"
      strokeWidth="2.6"
      fill="rgba(201,100,66,0.08)"
    />
    <path
      d="M 260,130 C 228,96 228,35 260,35 C 292,35 292,96 260,130"
      stroke="rgba(250,249,245,0.7)"
      strokeWidth="2.4"
      fill="rgba(250,249,245,0.08)"
    />
    <circle cx="356" cy="130" r="4.4" fill="#C96442" />
    <circle cx="164" cy="130" r="4.4" fill="#C96442" />
    <text x="378" y="114" fill="rgba(250,249,245,0.8)" fontSize="13" fontFamily="Georgia, serif" fontStyle="italic">
      r = cos 2θ
    </text>
  </svg>
);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Vui lòng nhập tên người dùng';
    } else if (formData.userName.trim().length < 3 || formData.userName.trim().length > 50) {
      newErrors.userName = 'Tên người dùng phải từ 3 đến 50 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    } else if (formData.email.length > 50) {
      newErrors.email = 'Email không được vượt quá 50 ký tự';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8 || formData.password.length > 128) {
      newErrors.password = 'Mật khẩu phải từ 8 đến 128 ký tự';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ hoa';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ thường';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ số';
    } else if (!/[!@#$%^&*()_+\-={}[\];':"\\|,.<>/?]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const registerData: RegisterRequest = {
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await AuthService.register(registerData);

      if (response.code === 1000) {
        setSuccessMessage(
          'Đăng ký thành công! Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác nhận để kích hoạt tài khoản.'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 1002) {
          setErrors({ userName: 'Tên người dùng này đã được sử dụng' });
        } else if (error.code === 1013) {
          setErrors({ email: 'Email này đã được đăng ký' });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        setErrors({
          submit: error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setIsLoading(true);
    setErrors({});
    try {
      const authResponse = await AuthService.googleLogin(response.credential);
      if (authResponse.code === 1000 && authResponse.result.token) {
        AuthService.saveToken(authResponse.result.token, authResponse.result.expiryTime);
        if (authResponse.result.newRegistration) {
          localStorage.setItem('pendingRoleSelection', 'true');
          navigate('/select-role');
        } else {
          navigate(AuthService.getDashboardUrl());
        }
      }
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Đăng ký Google thất bại. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: 'Đăng ký Google thất bại. Vui lòng thử lại.' });
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

        <MathRoseWarm />

        <blockquote className="auth-quote">
          <p>"Toán học là ngôn ngữ mà Chúa dùng để viết nên vũ trụ."</p>
          <footer>— Galileo Galilei</footer>
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
          to="/"
          className="auth-nav-link auth-nav inline-flex items-center gap-2 rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[#5E5D59] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
          aria-label="Về trang chủ"
        >
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>
        <div className="auth-card bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#D1CFC5]">
          <div className="auth-card-inner">
            <div className="auth-header">
              <h2
                className="font-medium text-[#141413]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                Tạo tài khoản
              </h2>
              <p>Bắt đầu hành trình học toán với MathMaster</p>
            </div>

            {successMessage ? (
              <div className="reg-success">
                <div className="reg-success__icon-wrap">
                  <CheckCircle2 className="reg-success__icon h-12 w-12 text-[#5E5D59]" />
                </div>
                <h3
                  className="reg-success__title font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  Đăng ký thành công!
                </h3>
                <p className="reg-success__body">
                  Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác nhận để kích hoạt tài khoản.
                </p>
                <div className="reg-success__hint">
                  <Mail className="h-4 w-4" />
                  Không thấy email? Kiểm tra thư mục <strong>Spam / Junk</strong>.
                </div>
                <Link
                  to="/login"
                  className="btn btn-primary btn-block reg-success__btn bg-[#C96442] font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                >
                  Đến trang đăng nhập
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

                <div className="form-group">
                  <label htmlFor="userName" className="form-label">
                    Tên người dùng
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="userName"
                      name="userName"
                      className={`form-control with-icon font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2${errors.userName ? ' error' : ''}`}
                      placeholder="username"
                      value={formData.userName}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                  {errors.userName && <span className="form-error">{errors.userName}</span>}
                </div>

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
                      className={`form-control with-icon font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2${errors.email ? ' error' : ''}`}
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Mật khẩu
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`form-control with-icon with-toggle font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2${errors.password ? ' error' : ''}`}
                      placeholder="Mật khẩu"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pwd-toggle transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Xác nhận mật khẩu
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-control with-icon with-toggle font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2${errors.confirmPassword ? ' error' : ''}`}
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pwd-toggle transition-all duration-150 hover:text-[#141413] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="form-error">{errors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block bg-[#C96442] font-[Be_Vietnam_Pro] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:brightness-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
                  disabled={isLoading}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" /> Đang tạo tài khoản...
                    </>
                  ) : (
                    <>Tạo tài khoản →</>
                  )}
                </button>

                <div className="divider">
                  <span>hoặc</span>
                </div>

                <div className="google-btn-wrapper">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    shape="pill"
                    text="signup_with"
                    size="large"
                  />
                </div>
              </form>
            )}

            {!successMessage && (
              <div className="auth-footer">
                <p>
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="link-primary">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            )}
          </div>
          {/* end auth-card-inner */}
        </div>
      </div>
    </div>
  );
};

export default Register;
