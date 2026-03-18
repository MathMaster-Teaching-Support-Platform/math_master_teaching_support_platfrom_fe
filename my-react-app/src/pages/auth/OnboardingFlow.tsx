import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, GraduationCap, Check, Upload, Globe, Mail,
  Building, Briefcase, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';
import { AuthService } from '../../services/api/auth.service';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import './onboarding-flow.css';

type Role = 'TEACHER' | 'STUDENT' | null;

const TEACHER_STEPS = ['Vai trò', 'Xác thực', 'Tài liệu', 'Trường học', 'Hoàn tất'];
const STUDENT_STEPS = ['Vai trò', 'Hồ sơ', 'Hoàn tất'];

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Teacher form data
  const [t1, setT1] = useState({ country: 'Vietnam', email: '' });
  const [t2, setT2] = useState({ documentType: 'Payslip', fileName: '', file: null as File | null, agreed: false });
  const [t3, setT3] = useState({ schoolName: '', schoolAddress: '', schoolWebsite: '', position: '' });

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

  const steps = role === 'TEACHER' ? TEACHER_STEPS : role === 'STUDENT' ? STUDENT_STEPS : ['Vai trò'];

  const goNext = () => {
    setError('');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setError('');
    if (step === 0) return;
    if (step === 1 && role !== null) { setRole(null); setStep(0); return; }
    setStep(s => s - 1);
  };

  const handleSchoolSearch = (value: string) => {
    setT3(prev => ({ ...prev, schoolName: value }));
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsSearching(true);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=Pqo1poLXDFAq43GqCePcCWJjPvTl4cB6y4jG0Ofr&input=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.status === 'OK' ? data.predictions || [] : []);
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 500);
  };

  const handleSelectSchool = (s: any) => {
    setT3(prev => ({
      ...prev,
      schoolName: s.structured_formatting?.main_text || s.description,
      schoolAddress: s.description,
    }));
    setShowSuggestions(false);
  };

  const handleFinishTeacher = async () => {
    if (!t2.file) { setError('Vui lòng chọn file xác thực'); return; }
    setIsLoading(true);
    setError('');
    try {
      await TeacherProfileService.submitProfile({
        schoolName: t3.schoolName,
        schoolAddress: t3.schoolAddress,
        schoolWebsite: t3.schoolWebsite,
        position: t3.position || 'Teacher',
        description: `Teacher at ${t3.schoolName}`,
      }, [t2.file]);
      goNext(); // step 4 = success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally { setIsLoading(false); }
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
        goNext(); // step 2 = success
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally { setIsLoading(false); }
  };

  /* ─── STEP RENDERS ─────────────────────────────────────── */

  const renderStep0 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Chào mừng đến với <span className="ob-gradient-text">MathMaster</span>!</h2>
      <p className="ob-step-sub">Bạn muốn tham gia với tư cách nào?</p>
      <div className="ob-role-grid">
        <button
          className="ob-role-card"
          onClick={() => { setRole('TEACHER'); goNext(); }}
        >
          <div className="ob-role-icon ob-role-icon--purple">
            <GraduationCap size={32} />
          </div>
          <h3>Giáo viên</h3>
          <p>Tạo bài giảng, quản lý lớp học và theo dõi tiến độ học sinh với AI.</p>
          <span className="ob-role-arrow"><ArrowRight size={18} /></span>
        </button>
        <button
          className="ob-role-card"
          onClick={() => { setRole('STUDENT'); goNext(); }}
        >
          <div className="ob-role-icon ob-role-icon--teal">
            <User size={32} />
          </div>
          <h3>Học sinh</h3>
          <p>Học tập thông minh, nhận hỗ trợ từ AI và kết nối với giáo viên.</p>
          <span className="ob-role-arrow"><ArrowRight size={18} /></span>
        </button>
      </div>
    </div>
  );

  /* Teacher step 1 */
  const renderTeacherStep1 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Xác thực quyền giảng dạy</h2>
      <p className="ob-step-sub">MathMaster cung cấp công cụ miễn phí cho giáo viên. Hãy xác thực để bắt đầu.</p>
      <div className="ob-form">
        <div className="ob-field">
          <label>Quốc gia</label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <select className="ob-input" value={t1.country} onChange={e => setT1({ ...t1, country: e.target.value })}>
              <option value="Vietnam">Việt Nam</option>
              <option value="USA">Hoa Kỳ</option>
              <option value="UK">Vương quốc Anh</option>
            </select>
          </div>
        </div>
        <div className="ob-field">
          <label>Email trường hoặc cá nhân</label>
          <div className="ob-input-wrap">
            <Mail className="ob-field-icon" size={16} />
            <input
              type="email" className="ob-input" placeholder="ten@truonghoc.edu.vn"
              value={t1.email} onChange={e => setT1({ ...t1, email: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}><ArrowLeft size={16} /> Quay lại</button>
        <button className="ob-btn ob-btn-primary" disabled={!t1.email} onClick={goNext}>
          Tiếp tục <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  /* Teacher step 2 */
  const renderTeacherStep2 = () => (
    <div className="ob-step-content fade-in">
      <h2 className="ob-step-title">Tài liệu xác thực</h2>
      <p className="ob-step-sub">Tải lên hợp đồng giảng dạy hoặc bảng lương có tên bạn và tên trường.</p>
      <div className="ob-form">
        <div className="ob-field">
          <label>Loại tài liệu</label>
          <div className="ob-doc-type-row">
            {['Payslip', 'Contract'].map(dt => (
              <button
                key={dt}
                className={`ob-doc-type-btn${t2.documentType === dt ? ' active' : ''}`}
                onClick={() => setT2({ ...t2, documentType: dt })}
              >
                {dt === 'Payslip' ? 'Bảng lương' : 'Hợp đồng'}
              </button>
            ))}
          </div>
        </div>
        <div className="ob-field">
          <label>File tài liệu</label>
          <div
            className={`ob-upload-zone${t2.fileName ? ' has-file' : ''}`}
            onClick={() => document.getElementById('ob-file-input')?.click()}
          >
            <input
              id="ob-file-input" type="file" style={{ display: 'none' }}
              onChange={e => {
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
          <input type="checkbox" checked={t2.agreed} onChange={e => setT2({ ...t2, agreed: e.target.checked })} />
          <span>Tôi đồng ý với chính sách bảo mật và xác nhận tài liệu là chính xác.</span>
        </label>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}><ArrowLeft size={16} /> Quay lại</button>
        <button className="ob-btn ob-btn-primary" disabled={!t2.fileName || !t2.agreed} onClick={goNext}>
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
        <div className="ob-field" ref={autocompleteRef} style={{ position: 'relative' }}>
          <label>Tên trường</label>
          <div className="ob-input-wrap">
            <Building className="ob-field-icon" size={16} />
            <input
              type="text" className="ob-input" placeholder="Trường THPT, Đại học…"
              value={t3.schoolName} onChange={e => handleSchoolSearch(e.target.value)}
              onFocus={() => { if (t3.schoolName.trim() && suggestions.length > 0) setShowSuggestions(true); }}
              autoComplete="off"
            />
          </div>
          {showSuggestions && t3.schoolName.trim() && (
            <div className="ob-suggestions">
              {isSearching ? <div className="ob-suggest-empty">Đang tìm&hellip;</div>
                : suggestions.length > 0 ? suggestions.map(s => (
                  <div key={s.place_id} className="ob-suggest-item" onClick={() => handleSelectSchool(s)}>
                    <span className="ob-suggest-main">{s.structured_formatting?.main_text || s.description}</span>
                    {s.structured_formatting?.secondary_text && (
                      <span className="ob-suggest-sub">{s.structured_formatting.secondary_text}</span>
                    )}
                  </div>
                )) : <div className="ob-suggest-empty">Không tìm thấy kết quả</div>}
            </div>
          )}
        </div>
        <div className="ob-field">
          <label>Địa chỉ trường</label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <input
              type="text" className="ob-input" placeholder="Địa chỉ đầy đủ"
              value={t3.schoolAddress} onChange={e => setT3({ ...t3, schoolAddress: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>Website trường <span className="ob-optional">(tuỳ chọn)</span></label>
          <div className="ob-input-wrap">
            <Globe className="ob-field-icon" size={16} />
            <input
              type="text" className="ob-input" placeholder="https://truong.edu.vn"
              value={t3.schoolWebsite} onChange={e => setT3({ ...t3, schoolWebsite: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>Chức vụ</label>
          <div className="ob-input-wrap">
            <Briefcase className="ob-field-icon" size={16} />
            <input
              type="text" className="ob-input" placeholder="Giáo viên Toán"
              value={t3.position} onChange={e => setT3({ ...t3, position: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}><ArrowLeft size={16} /> Quay lại</button>
        <button className="ob-btn ob-btn-primary" disabled={isLoading || !t3.schoolName || !t3.schoolAddress} onClick={handleFinishTeacher}>
          {isLoading ? <span className="ob-spinner" /> : <><Sparkles size={16} /> Hoàn thành</>}
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
        Chúng tôi đang xem xét thông tin của bạn. Bạn sẽ nhận được phản hồi trong vòng <strong>24 – 48 giờ</strong>. Trong thời gian đó, bạn hoàn toàn có thể khám phá và sử dụng MathMaster.
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
              type="text" className="ob-input" placeholder="Nguyễn Văn A"
              value={sd.fullName} onChange={e => setSd({ ...sd, fullName: e.target.value })}
            />
          </div>
        </div>
        <div className="ob-field">
          <label>Tên đăng nhập</label>
          <div className="ob-input-wrap">
            <User className="ob-field-icon" size={16} />
            <input
              type="text" className="ob-input" placeholder="nguyenvana123"
              value={sd.userName} onChange={e => setSd({ ...sd, userName: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" onClick={goBack}><ArrowLeft size={16} /> Quay lại</button>
        <button
          className="ob-btn ob-btn-primary"
          disabled={isLoading || !sd.fullName || !sd.userName}
          onClick={handleFinishStudent}
        >
          {isLoading ? <span className="ob-spinner" /> : <>Xác nhận <ArrowRight size={16} /></>}
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
        Tài khoản học sinh của bạn đã sẵn sàng. Hãy bắt đầu hành trình chinh phục toán học cùng <strong>MathMaster</strong>!
      </p>
      <button className="ob-btn ob-btn-teal ob-btn-lg" onClick={() => navigate('/student/dashboard')}>
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

  return (
    <div className="ob-page">
      {/* Floating math background */}
      <div className="ob-bg-symbols" aria-hidden="true">
        {['∑','π','∫','√','Δ','∞','±','÷','×','≈','∂','θ'].map((sym, i) => (
          <span key={i} className={`ob-sym ob-sym-${i + 1}`}>{sym}</span>
        ))}
      </div>
      {/* Geometric accents */}
      <div className="ob-geo ob-geo-1" aria-hidden="true" />
      <div className="ob-geo ob-geo-2" aria-hidden="true" />

      {/* Logo */}
      <a href="/" className="ob-logo">
        <span className="ob-logo-icon">∑π</span>
        <span className="ob-logo-text">MathMaster</span>
      </a>

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
        <div className="ob-card-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
