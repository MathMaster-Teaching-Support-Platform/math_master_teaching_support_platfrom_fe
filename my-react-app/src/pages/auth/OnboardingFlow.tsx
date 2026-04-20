import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  Check,
  Globe,
  GraduationCap,
  Mail,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import './onboarding-flow.css';

type Role = 'TEACHER' | 'STUDENT' | null;

const TEACHER_STEPS = ['Vai trò', 'Xác thực', 'Tài liệu', 'Trường học', 'Hoàn tất'];
const STUDENT_STEPS = ['Vai trò', 'Hồ sơ', 'Hoàn tất'];

const MASCOT_MESSAGES: Record<string, string> = {
  step0: 'Xin chào! Mình là Max 🦉 Bạn muốn tham gia với vai trò nào?',
  step0_teacher: '👩‍🏫 Giáo viên — tạo bài giảng, quản lý lớp học với AI siêu xịn!',
  step0_student: '🎓 Học sinh — học thông minh hơn mỗi ngày cùng AI!',
  teacher_1: 'Hãy nhập email để xác thực quyền giảng dạy nhé!',
  teacher_2: 'Tải lên thẻ giáo viên — chỉ mất vài giây thôi!',
  teacher_3: 'Bước cuối rồi! Thêm thông tin trường là xong!',
  teacher_4: 'Hồ sơ đã gửi! Chờ chúng tôi xét duyệt nhé! 🎉',
  student_1: 'Điền tên của bạn để bắt đầu hành trình toán học!',
  student_2: 'Chúc mừng! Bạn đã sẵn sàng chinh phục toán học! 🎉',
};

const MascotOwl: React.FC = () => (
  <svg
    width="72"
    height="80"
    viewBox="0 0 72 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Graduation cap */}
    <polygon points="36,4 14,14 58,14" fill="#4f46e5" />
    <rect x="14" y="13" width="44" height="5" rx="2.5" fill="#4338ca" />
    <line x1="55" y1="14" x2="60" y2="26" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" />
    <circle cx="61" cy="28" r="3.5" fill="#a78bfa" />
    {/* Ear tufts */}
    <ellipse cx="22" cy="27" rx="5" ry="7" fill="#fbbf24" transform="rotate(-15 22 27)" />
    <ellipse cx="50" cy="27" rx="5" ry="7" fill="#fbbf24" transform="rotate(15 50 27)" />
    {/* Body */}
    <ellipse cx="36" cy="54" rx="20" ry="22" fill="#fde68a" />
    {/* Chest */}
    <ellipse cx="36" cy="58" rx="12" ry="14" fill="#fef3c7" />
    {/* Eyes */}
    <circle cx="27" cy="46" r="8.5" fill="white" />
    <circle cx="45" cy="46" r="8.5" fill="white" />
    <circle cx="27" cy="46" r="5" fill="#1e1b4b" />
    <circle cx="45" cy="46" r="5" fill="#1e1b4b" />
    <circle cx="28.5" cy="44.5" r="1.8" fill="white" />
    <circle cx="46.5" cy="44.5" r="1.8" fill="white" />
    {/* Beak */}
    <ellipse cx="36" cy="53" rx="3.5" ry="2.5" fill="#f59e0b" />
    {/* Wings */}
    <ellipse cx="14" cy="58" rx="8" ry="12" fill="#fbbf24" transform="rotate(-18 14 58)" />
    <ellipse cx="58" cy="58" rx="8" ry="12" fill="#fbbf24" transform="rotate(18 58 58)" />
    {/* Feet */}
    <path
      d="M27 75 L23 80 M27 75 L27 80 M27 75 L31 80"
      stroke="#f59e0b"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M45 75 L41 80 M45 75 L45 80 M45 75 L49 80"
      stroke="#f59e0b"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRole, setHoveredRole] = useState<'TEACHER' | 'STUDENT' | null>(null);

  // Teacher form data
  const [t1, setT1] = useState({ country: 'Vietnam', email: '' });
  const [emailError, setEmailError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateEmail = (val: string): string => {
    if (!val.trim()) return 'Email không được để trống';
    if (val.length > 50) return 'Email không được vượt quá 50 ký tự';
    if (!EMAIL_REGEX.test(val)) return 'Email không hợp lệ';
    return '';
  };
  const [t2, setT2] = useState({
    documentType: 'StaffCard',
    fileName: '',
    file: null as File | null,
    agreed: false,
  });
  const [t3, setT3] = useState({
    fullName: '',
    schoolName: '',
    schoolAddress: '',
    schoolWebsite: '',
    position: '',
  });

  // Student form data
  const [sd, setSd] = useState({ fullName: '', userName: '' });

  // Autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const steps =
    role === 'TEACHER' ? TEACHER_STEPS : role === 'STUDENT' ? STUDENT_STEPS : ['Vai trò'];

  const goNext = () => {
    setError('');
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError('');
    if (step === 0) return;
    if (step === 1 && role !== null) {
      setRole(null);
      setStep(0);
      return;
    }
    setStep((s) => s - 1);
  };

  const handleSchoolSearch = (value: string) => {
    setT3((prev) => ({ ...prev, schoolName: value }));
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=Pqo1poLXDFAq43GqCePcCWJjPvTl4cB6y4jG0Ofr&input=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setSuggestions(data.status === 'OK' ? data.predictions || [] : []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectSchool = (s: any) => {
    setT3((prev) => ({
      ...prev,
      schoolName: s.structured_formatting?.main_text || s.description,
      schoolAddress: s.description,
    }));
    setShowSuggestions(false);
  };

  const handleFinishTeacher = async () => {
    if (!t2.file) {
      setError('Vui lòng chọn file xác thực');
      return;
    }
    if (!t3.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await TeacherProfileService.submitProfile(
        {
          fullName: t3.fullName,
          schoolName: t3.schoolName,
          schoolAddress: t3.schoolAddress,
          schoolWebsite: t3.schoolWebsite,
          position: t3.position || 'Teacher',
          description: `Teacher at ${t3.schoolName}`,
        },
        [t2.file]
      );
      localStorage.removeItem('pendingRoleSelection');
      goNext(); // step 4 = success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishStudent = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await AuthService.selectRole({
        role: 'STUDENT',
        userName: sd.userName,
        fullName: sd.fullName,
      });
      if (response.code === 1000) {
        AuthService.saveToken(response.result.token, response.result.expiryTime);
        localStorage.removeItem('pendingRoleSelection');
        goNext(); // step 2 = success
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── STEP RENDERS ─────────────────────────────────────── */

  const renderStep0 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">
        Chào mừng đến với <span className="ob-gradient-text">MathMaster</span>!
      </h2>
      <p className="ob-step-sub">Bạn muốn tham gia với tư cách nào?</p>
      <div className="ob-role-grid">
        <button
          className="ob-role-card ob-role-card--teacher"
          onClick={() => {
            setRole('TEACHER');
            goNext();
          }}
          onMouseEnter={() => setHoveredRole('TEACHER')}
          onMouseLeave={() => setHoveredRole(null)}
        >
          <div className="ob-role-icon ob-role-icon--purple">
            <GraduationCap size={32} />
          </div>
          <h3>Giáo viên</h3>
          <p>Tạo bài giảng, quản lý lớp học và theo dõi tiến độ học sinh với AI.</p>
          <span className="ob-role-arrow ob-role-arrow--purple">
            Chọn vai trò này <ArrowRight size={16} />
          </span>
        </button>
        <button
          className="ob-role-card ob-role-card--student"
          onClick={() => {
            setRole('STUDENT');
            goNext();
          }}
          onMouseEnter={() => setHoveredRole('STUDENT')}
          onMouseLeave={() => setHoveredRole(null)}
        >
          <div className="ob-role-icon ob-role-icon--teal">
            <User size={32} />
          </div>
          <h3>Học sinh</h3>
          <p>Học tập thông minh, nhận hỗ trợ từ AI và kết nối với giáo viên.</p>
          <span className="ob-role-arrow ob-role-arrow--teal">
            Chọn vai trò này <ArrowRight size={16} />
          </span>
        </button>
      </div>
    </div>
  );

  /* Teacher step 1 */
  const renderTeacherStep1 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Xác thực quyền giảng dạy</h2>
      <p className="ob-step-sub">
        MathMaster cung cấp công cụ miễn phí cho giáo viên. Hãy xác thực để bắt đầu.
      </p>
      <div className="ob-form">
        <div className="ob-field">
          <label>Quốc gia</label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <select
              className="ob-input"
              value={t1.country}
              onChange={(e) => setT1({ ...t1, country: e.target.value })}
            >
              <option value="Vietnam">Việt Nam</option>
              <option value="USA">Hoa Kỳ</option>
              <option value="UK">Vương quốc Anh</option>
            </select>
          </div>
        </div>
        <div className="ob-field">
          <label>Email trường hoặc cá nhân</label>
          <div className={`ob-input-wrap${emailError ? ' ob-input-wrap--error' : ''}`}>
            <Mail className="ob-field-icon" size={16} />
            <input
              type="email"
              className={`ob-input${emailError ? ' ob-input--error' : ''}`}
              placeholder="ten@truonghoc.edu.vn"
              maxLength={50}
              value={t1.email}
              onChange={(e) => {
                const val = e.target.value;
                setT1({ ...t1, email: val });
                if (emailError) setEmailError(validateEmail(val));
              }}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))}
            />
          </div>
          <div className="ob-field-footer">
            {emailError ? <span className="ob-field-error">{emailError}</span> : <span />}
            <span className={`ob-char-count${t1.email.length > 45 ? ' ob-char-count--warn' : ''}`}>
              {t1.email.length}/50
            </span>
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          className="ob-btn ob-btn-primary"
          disabled={!t1.email || !!validateEmail(t1.email)}
          onClick={() => {
            const err = validateEmail(t1.email);
            if (err) {
              setEmailError(err);
              return;
            }
            goNext();
          }}
        >
          Tiếp tục <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  /* Teacher step 2 */
  const renderTeacherStep2 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Tài liệu xác thực</h2>
      <p className="ob-step-sub">
        Tải lên Thẻ Cán bộ, Công chức, Viên chức (Giáo Viên) có tên bạn và tên trường.
      </p>
      <div className="ob-form">
        <div className="ob-field">
          <label>Loại tài liệu</label>
          <div className="ob-doc-type-row">
            <button
              className="ob-doc-type-btn active"
              onClick={() => setT2({ ...t2, documentType: 'StaffCard' })}
              style={{ width: '100%' }}
            >
              Thẻ Cán bộ, Công chức, Viên chức (Giáo Viên)
            </button>
          </div>
        </div>
        <div className="ob-field">
          <label>File tài liệu</label>
          <div
            className={`ob-upload-zone${t2.fileName ? ' has-file' : ''}`}
            onClick={() => document.getElementById('ob-file-input')?.click()}
          >
            <input
              id="ob-file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setT2({ ...t2, fileName: file.name, file });
              }}
            />
            <Upload size={28} />
            <span>{t2.fileName || 'Kéo thả hoặc nhấp để tải lên'}</span>
            {t2.fileName && <span className="ob-upload-name">{t2.fileName}</span>}
          </div>
        </div>
        <label className="ob-checkbox-row">
          <input
            type="checkbox"
            checked={t2.agreed}
            onChange={(e) => setT2({ ...t2, agreed: e.target.checked })}
          />
          <span>Tôi đồng ý với chính sách bảo mật và xác nhận tài liệu là chính xác.</span>
        </label>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          className="ob-btn ob-btn-primary"
          disabled={!t2.fileName || !t2.agreed}
          onClick={goNext}
        >
          Tiếp tục <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  /* Teacher step 3 */
  const renderTeacherStep3 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Thông tin trường học</h2>
      <p className="ob-step-sub">Cho chúng tôi biết bạn đang công tác ở đâu.</p>
      <div className="ob-form ob-form--two-col">
        <div className="ob-field" style={{ gridColumn: '1 / -1' }}>
          <label>Họ và tên</label>
          <div className="ob-input-wrap">
            <User className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="Nguyễn Văn A"
              value={t3.fullName}
              onChange={(e) => setT3({ ...t3, fullName: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field" ref={autocompleteRef} style={{ position: 'relative' }}>
          <label>Tên trường</label>
          <div className="ob-input-wrap">
            <Building className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="Trường THPT, Đại học…"
              value={t3.schoolName}
              onChange={(e) => handleSchoolSearch(e.target.value)}
              onFocus={() => {
                if (t3.schoolName.trim() && suggestions.length > 0) setShowSuggestions(true);
              }}
              autoComplete="off"
            />
          </div>
          {showSuggestions && t3.schoolName.trim() && (
            <div className="ob-suggestions">
              {isSearching ? (
                <div className="ob-suggest-empty">Đang tìm&hellip;</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <div
                    key={s.place_id}
                    className="ob-suggest-item"
                    onClick={() => handleSelectSchool(s)}
                  >
                    <span className="ob-suggest-main">
                      {s.structured_formatting?.main_text || s.description}
                    </span>
                    {s.structured_formatting?.secondary_text && (
                      <span className="ob-suggest-sub">
                        {s.structured_formatting.secondary_text}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="ob-suggest-empty">Không tìm thấy kết quả</div>
              )}
            </div>
          )}
        </div>
        <div className="ob-field">
          <label>Địa chỉ trường</label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="Địa chỉ đầy đủ"
              value={t3.schoolAddress}
              onChange={(e) => setT3({ ...t3, schoolAddress: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>
            Website trường <span className="ob-optional">(tuỳ chọn)</span>
          </label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="https://truong.edu.vn"
              value={t3.schoolWebsite}
              onChange={(e) => setT3({ ...t3, schoolWebsite: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>Chức vụ</label>
          <div className="ob-input-wrap">
            <Briefcase className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="Giáo viên Toán"
              value={t3.position}
              onChange={(e) => setT3({ ...t3, position: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          className="ob-btn ob-btn-primary"
          disabled={isLoading || !t3.fullName || !t3.schoolName || !t3.schoolAddress}
          onClick={handleFinishTeacher}
        >
          {isLoading ? (
            <span className="ob-spinner" />
          ) : (
            <>
              <Sparkles size={16} /> Hoàn thành
            </>
          )}
        </button>
      </div>
    </div>
  );

  /* Teacher step 4 – success */
  const renderTeacherSuccess = () => (
    <div className="ob-step-content ob-success fade-in">
      <div className="ob-success-icon">
        <Check size={40} strokeWidth={3} />
      </div>
      <h2 className="ob-step-title">Hồ sơ đã được gửi!</h2>
      <p className="ob-step-sub ob-success-p">
        Chúng tôi đang xem xét thông tin của bạn. Bạn sẽ nhận được phản hồi trong vòng{' '}
        <strong>24 – 48 giờ</strong>. Trong thời gian đó, bạn hoàn toàn có thể khám phá và sử dụng
        MathMaster.
      </p>
      <button className="ob-btn ob-btn-primary ob-btn-lg" onClick={() => navigate('/dashboard')}>
        Bắt đầu khám phá <ArrowRight size={18} />
      </button>
    </div>
  );

  /* Student step 1 */
  const renderStudentStep1 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Hoàn tất hồ sơ học sinh</h2>
      <p className="ob-step-sub">Thêm thông tin để bắt đầu hành trình học tập.</p>
      <div className="ob-form">
        <div className="ob-field">
          <label>Họ và tên</label>
          <div className="ob-input-wrap">
            <User className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="Nguyễn Văn A"
              value={sd.fullName}
              onChange={(e) => setSd({ ...sd, fullName: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>Tên đăng nhập</label>
          <div className="ob-input-wrap">
            <User className="ob-field-icon" size={16} />
            <input
              type="text"
              className="ob-input"
              placeholder="nguyenvana123"
              value={sd.userName}
              onChange={(e) => setSd({ ...sd, userName: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          className="ob-btn ob-btn-primary"
          disabled={isLoading || !sd.fullName || !sd.userName}
          onClick={handleFinishStudent}
        >
          {isLoading ? (
            <span className="ob-spinner" />
          ) : (
            <>
              Xác nhận <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  /* Student step 2 – success */
  const renderStudentSuccess = () => (
    <div className="ob-step-content ob-success fade-in">
      <div className="ob-success-icon ob-success-icon--teal">
        <Check size={40} strokeWidth={3} />
      </div>
      <h2 className="ob-step-title">Chào mừng, {sd.fullName}!</h2>
      <p className="ob-step-sub ob-success-p">
        Tài khoản học sinh của bạn đã sẵn sàng. Hãy bắt đầu hành trình chinh phục toán học cùng{' '}
        <strong>MathMaster</strong>!
      </p>
      <button className="ob-btn ob-btn-teal ob-btn-lg" onClick={() => navigate('/student/courses')}>
        Bắt đầu học ngay <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderContent = () => {
    if (step === 0) return renderStep0();
    if (role === 'TEACHER') {
      if (step === 1) return renderTeacherStep1();
      if (step === 2) return renderTeacherStep2();
      if (step === 3) return renderTeacherStep3();
      if (step === 4) return renderTeacherSuccess();
    }
    if (role === 'STUDENT') {
      if (step === 1) return renderStudentStep1();
      if (step === 2) return renderStudentSuccess();
    }
    return null;
  };

  const isSuccess = (role === 'TEACHER' && step === 4) || (role === 'STUDENT' && step === 2);

  const getMascotMessage = (): string => {
    if (step === 0) {
      if (hoveredRole === 'TEACHER') return MASCOT_MESSAGES.step0_teacher;
      if (hoveredRole === 'STUDENT') return MASCOT_MESSAGES.step0_student;
      return MASCOT_MESSAGES.step0;
    }
    if (role === 'TEACHER') return MASCOT_MESSAGES[`teacher_${step}`] ?? '';
    if (role === 'STUDENT') return MASCOT_MESSAGES[`student_${step}`] ?? '';
    return '';
  };
  const mascotMsg = getMascotMessage();
  // key changes only on step/role transitions, not on hover (to avoid full remount flashes)
  const mascotStepKey = `${role}-${step}`;

  return (
    <div className="ob-page">
      {/* Floating math background */}
      <div className="ob-bg-symbols" aria-hidden="true">
        {['∑', 'π', '∫', '√', 'Δ', '∞', '±', '÷', '×', '≈', '∂', 'θ'].map((sym, i) => (
          <span key={i} className={`ob-sym ob-sym-${i + 1}`}>
            {sym}
          </span>
        ))}
      </div>
      {/* Geometric accents */}
      <div className="ob-geo ob-geo-1" aria-hidden="true" />
      <div className="ob-geo ob-geo-2" aria-hidden="true" />
      <div className="ob-geo ob-geo-3" aria-hidden="true" />

      {/* Logo */}
      <a href="/" className="ob-logo">
        <span className="ob-logo-icon">∑π</span>
        <span className="ob-logo-text">MathMaster</span>
      </a>

      {/* Mascot guide */}
      {mascotMsg && (
        <div className="ob-mascot" key={mascotStepKey}>
          <div className="ob-mascot-bubble">
            <span className="ob-mascot-text" key={mascotMsg}>
              {mascotMsg}
            </span>
          </div>
          <div className="ob-mascot-avatar">
            <MascotOwl />
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="ob-card">
        {/* Stepper */}
        {!isSuccess && (
          <div className="ob-stepper">
            {steps.map((label, idx) => {
              const isDone = idx < step;
              const isActive = idx === step;
              return (
                <React.Fragment key={idx}>
                  <div className={`ob-step-node${isDone ? ' done' : isActive ? ' active' : ''}`}>
                    <div className="ob-step-circle">
                      {isDone ? <Check size={14} strokeWidth={3} /> : <span>{idx + 1}</span>}
                    </div>
                    <span className="ob-step-label">{label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`ob-step-line${idx < step ? ' done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && <div className="ob-error">{error}</div>}

        {/* Content */}
        <div className="ob-card-body">{renderContent()}</div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
