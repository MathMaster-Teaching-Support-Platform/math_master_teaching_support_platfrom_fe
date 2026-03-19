import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import { 
    Upload, 
    ArrowLeft, 
    GraduationCap, 
    Mail, 
    Globe, 
    Briefcase,
    Building as BuildingIcon
} from 'lucide-react';
import './TeacherVerification.css';

const TeacherVerification: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [step1Data, setStep1Data] = useState({
        country: 'Vietnam',
        email: '',
    });

    const [step2Data, setStep2Data] = useState({
        documentType: 'Payslip',
        fileName: '',
        selectedFile: null as File | null,
        agreed: false,
    });

    const [step3Data, setStep3Data] = useState({
        schoolName: '',
        schoolAddress: '',
        schoolWebsite: '',
        position: '',
    });

    // Goong API States
    const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingSchool, setIsSearchingSchool] = useState(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const setup = async () => {
        };
        setup();
    }, []);

    const handleFinish = async () => {
        if (!step2Data.selectedFile) {
            setError('Vui lòng chọn file xác thực');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await TeacherProfileService.submitProfile({
                schoolName: step3Data.schoolName,
                schoolAddress: step3Data.schoolAddress,
                schoolWebsite: step3Data.schoolWebsite,
                position: step3Data.position || 'Teacher',
                description: `Teacher at ${step3Data.schoolName}`,
            }, [step2Data.selectedFile]);

            setStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSchoolSearch = (value: string) => {
        setStep3Data(prev => ({ ...prev, schoolName: value }));

        if (!value.trim()) {
            setSchoolSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearchingSchool(true);
        setShowSuggestions(true);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=Pqo1poLXDFAq43GqCePcCWJjPvTl4cB6y4jG0Ofr&input=${encodeURIComponent(value)}`);
                const data = await res.json();
                if (data.status === 'OK') {
                    setSchoolSuggestions(data.predictions || []);
                } else {
                    setSchoolSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching schools:', error);
                setSchoolSuggestions([]);
            } finally {
                setIsSearchingSchool(false);
            }
        }, 500);
    };

    const handleSelectSchool = (suggestion: any) => {
        setStep3Data(prev => ({ 
            ...prev, 
            schoolName: suggestion.structured_formatting?.main_text || suggestion.description,
            schoolAddress: suggestion.description 
        }));
        setShowSuggestions(false);
    };

    const renderStep1 = () => (
        <div className="verification-step">
            <h2 className="step-title">Xác thực quyền lợi giảng dạy của bạn</h2>
            <p className="step-desc">MathMaster cung cấp các công cụ và tài nguyên miễn phí cho giáo viên. Hãy xác thực để bắt đầu.</p>
            
            <div className="form-group">
                <label>Quốc gia</label>
                <div className="input-with-icon">
                    <Globe className="field-icon" size={18} />
                    <select 
                        className="form-control"
                        value={step1Data.country}
                        onChange={(e) => setStep1Data({...step1Data, country: e.target.value})}
                    >
                        <option value="Vietnam">Vietnam</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Email trường hoặc cá nhân</label>
                <div className="input-with-icon">
                    <Mail className="field-icon" size={18} />
                    <input 
                        type="email" 
                        className="form-control" 
                        placeholder="ten@truonghoc.edu.vn"
                        value={step1Data.email}
                        onChange={(e) => setStep1Data({...step1Data, email: e.target.value})}
                    />
                </div>
            </div>

            <button 
                className="btn btn-primary btn-block" 
                style={{ marginTop: '2.5rem' }}
                onClick={() => setStep(2)}
                disabled={!step1Data.email}
            >
                Tiếp tục
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="verification-step">
            <div className="step-header">
                <button className="back-btn" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="step-title" style={{ marginLeft: '1rem', display: 'inline' }}>Tải lên tài liệu xác thực</h2>
            </div>
            <p className="step-desc" style={{ marginTop: '1rem' }}>Sử dụng hợp đồng giảng dạy hoặc bảng lương có tên bạn và tên trường.</p>

            <div className="form-group" style={{ marginTop: '2rem' }}>
                <label>Loại tài liệu</label>
                <div className="doc-type-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div 
                        className={`doc-type-item ${step2Data.documentType === 'Payslip' ? 'active' : ''}`}
                        onClick={() => setStep2Data({...step2Data, documentType: 'Payslip'})}
                        style={{ 
                            padding: '1rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '0.5rem', 
                            textAlign: 'center', 
                            cursor: 'pointer',
                            background: step2Data.documentType === 'Payslip' ? '#f0f4ff' : 'white',
                            borderColor: step2Data.documentType === 'Payslip' ? '#667eea' : '#e2e8f0'
                        }}
                    >
                        Bảng lương
                    </div>
                    <div 
                        className={`doc-type-item ${step2Data.documentType === 'Contract' ? 'active' : ''}`}
                        onClick={() => setStep2Data({...step2Data, documentType: 'Contract'})}
                        style={{ 
                            padding: '1rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '0.5rem', 
                            textAlign: 'center', 
                            cursor: 'pointer',
                            background: step2Data.documentType === 'Contract' ? '#f0f4ff' : 'white',
                            borderColor: step2Data.documentType === 'Contract' ? '#667eea' : '#e2e8f0'
                        }}
                    >
                        Hợp đồng
                    </div>
                </div>
            </div>

            <div className="file-upload-zone" style={{ 
                marginTop: '1.5rem', 
                border: '2px dashed #e2e8f0', 
                borderRadius: '1rem',
                padding: '3rem',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
            }} onClick={() => document.getElementById('file-input')?.click()}>
                <input 
                    type="file" 
                    id="file-input" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setStep2Data({...step2Data, fileName: file.name, selectedFile: file});
                        }
                    }}
                />
                <Upload size={40} style={{ color: '#cbd5e0', marginBottom: '1rem' }} />
                <p style={{ color: '#718096' }}>{step2Data.fileName || 'Kéo thả hoặc nhấp để tải lên'}</p>
                {step2Data.fileName && <p style={{ color: '#667eea', fontWeight: 'bold', marginTop: '0.5rem' }}>Đã chọn: {step2Data.fileName}</p>}
            </div>

            <div className="checkbox-group" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input 
                    type="checkbox" 
                    id="policy-agree" 
                    checked={step2Data.agreed}
                    onChange={(e) => setStep2Data({...step2Data, agreed: e.target.checked})}
                />
                <label htmlFor="policy-agree" style={{ fontSize: '0.85rem', color: '#718096' }}>
                    Tôi đồng ý với chính sách bảo mật và xác nhận tài liệu là chính xác.
                </label>
            </div>

            <button 
                className="btn btn-primary btn-block" 
                style={{ marginTop: '2rem' }}
                onClick={() => setStep(3)}
                disabled={!step2Data.fileName || !step2Data.agreed}
            >
                Tiếp tục
            </button>
        </div>
    );

    const renderStep3 = () => (
        <div className="verification-step">
            <div className="step-header">
                <button className="back-btn" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="step-title" style={{ marginLeft: '1rem', display: 'inline' }}>Thông tin trường học</h2>
            </div>
            
            <div className="form-group autocomplete-wrapper" ref={autocompleteRef} style={{ marginTop: '2rem' }}>
                <label>Tên trường</label>
                <div className="input-with-icon">
                    <BuildingIcon className="field-icon" size={18} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Đại học FPT"
                        value={step3Data.schoolName}
                        onChange={(e) => handleSchoolSearch(e.target.value)}
                        onFocus={() => {
                            if (step3Data.schoolName.trim() && schoolSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        autoComplete="off"
                    />
                </div>
                {showSuggestions && step3Data.schoolName.trim() && (
                    <div className="autocomplete-dropdown">
                        {isSearchingSchool ? (
                            <div className="autocomplete-loading">Đang tìm kiếm...</div>
                        ) : schoolSuggestions.length > 0 ? (
                            schoolSuggestions.map((suggestion) => (
                                <div 
                                    key={suggestion.place_id} 
                                    className="autocomplete-item"
                                    onClick={() => handleSelectSchool(suggestion)}
                                >
                                    <span className="autocomplete-item-main">
                                        {suggestion.structured_formatting?.main_text || suggestion.description}
                                    </span>
                                    {suggestion.structured_formatting?.secondary_text && (
                                        <span className="autocomplete-item-sub">
                                            {suggestion.structured_formatting.secondary_text}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="autocomplete-loading">Không tìm thấy kết quả</div>
                        )}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label>Địa chỉ trường</label>
                <div className="input-with-icon">
                    <Globe className="field-icon" size={18} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Khu CNC Hòa Lạc, Thạch Thất, Hà Nội"
                        value={step3Data.schoolAddress}
                        onChange={(e) => setStep3Data({...step3Data, schoolAddress: e.target.value})}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Website trường (không bắt buộc)</label>
                <div className="input-with-icon">
                    <Globe className="field-icon" size={18} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="https://truongcua-ban.edu.vn"
                        value={step3Data.schoolWebsite}
                        onChange={(e) => setStep3Data({...step3Data, schoolWebsite: e.target.value})}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Chức vụ</label>
                <div className="input-with-icon">
                    <Briefcase className="field-icon" size={18} />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Giáo viên Toán"
                        value={step3Data.position}
                        onChange={(e) => setStep3Data({...step3Data, position: e.target.value})}
                    />
                </div>
            </div>

            <button 
                className="btn btn-primary btn-block" 
                style={{ marginTop: '2.5rem' }}
                onClick={handleFinish}
                disabled={isLoading || !step3Data.schoolName || !step3Data.schoolAddress}
            >
                {isLoading ? 'Đang gửi hồ sơ...' : 'Hoàn thành'}
            </button>
        </div>
    );

    const renderStep4 = () => (
        <div className="verification-success" style={{ display: 'flex', gap: '3rem', height: '100%', alignItems: 'center' }}>
            <div className="v-content" style={{ flex: 1 }}>
                <h1 style={{ fontSize: '2.2rem', lineHeight: '1.2', fontWeight: 'bold', color: '#1a202c' }}>
                    Chúng tôi đang <span style={{ color: '#667eea' }}>xem xét thông tin</span> của bạn, nhưng bạn có thể <span style={{ color: '#667eea' }}>bắt đầu ngay</span> bây giờ.
                </h1>
                <p style={{ color: '#4a5568', marginTop: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    Bạn có thể tiếp tục khám phá, thiết kế và sáng tạo nội dung trên MathMaster trong khi chúng tôi xem xét hồ sơ của bạn.
                </p>
                <p style={{ color: '#718096', marginTop: '1rem', fontSize: '1rem', lineHeight: '1.6' }}>
                    Bạn sẽ nhận được phản hồi từ chúng tôi trong vòng <b>24 giờ</b>, nhưng trong giai đoạn cao điểm có thể mất đến 7 ngày.
                </p>
                
                <button 
                    className="btn btn-primary" 
                    style={{ 
                        marginTop: '3rem', 
                        padding: '1rem 3.5rem', 
                        background: '#667eea', 
                        borderRadius: '0.5rem', 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    Hoàn tất
                </button>
            </div>
            <div className="v-illustration" style={{ flex: 1.2, textAlign: 'center' }}>
                <img 
                    src="/home/huy/.gemini/antigravity/brain/27c13b4e-961d-4d9c-a72b-4bd04c89cf72/teacher_verification_success_illustration_1773582446379.png" 
                    alt="Verification in progress" 
                    style={{ 
                        maxWidth: '100%', 
                        borderRadius: '2rem', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' 
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="auth-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {step !== 4 && (
                <div className="auth-left" style={{ 
                    flex: '0 0 400px', 
                    background: '#f0f4ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            background: '#667eea', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            color: 'white',
                            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                        }}>
                            <GraduationCap size={60} />
                        </div>
                        <h2 style={{ color: '#2d3748', fontSize: '1.8rem' }}>MathMaster for Education</h2>
                        <p style={{ color: '#718096', marginTop: '1rem', maxWidth: '300px' }}>
                            Hỗ trợ giáo viên trong việc giảng dạy và quản lý học sinh hiệu quả hơn.
                        </p>
                        
                        <div className="stepper" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            {[1, 2, 3].map(s => (
                                <div key={s} style={{ 
                                    width: '40px', 
                                    height: '8px', 
                                    borderRadius: '4px',
                                    background: s <= step ? '#667eea' : '#cbd5e0'
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="auth-right" style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div className="auth-card" style={{ 
                    maxWidth: step === 4 ? '1100px' : '500px', 
                    width: '100%',
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '1.5rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    transition: 'all 0.4s ease-in-out'
                }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff5f5', color: '#c53030', borderRadius: '0.5rem' }}>{error}</div>}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>
            </div>

            <style>{`
                .input-with-icon {
                    position: relative;
                    margin-top: 0.5rem;
                }
                .field-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #a0aec0;
                }
                .form-control {
                    width: 100%;
                    padding: 0.8rem 1rem 0.8rem 3rem;
                    border: 1px solid #e2e8f0;
                    borderRadius: 0.5rem;
                    font-size: 1rem;
                }
                .form-control:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                .btn {
                    padding: 0.8rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #5a67d8;
                }
                .btn-primary:disabled {
                    background: #cbd5e0;
                    cursor: not-allowed;
                }
                .btn-block {
                    width: 100%;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    font-weight: 600;
                    color: #4a5568;
                    margin-bottom: 0.5rem;
                }
                .step-title {
                    font-size: 1.5rem;
                    color: #1a202c;
                    font-weight: 700;
                }
                .step-desc {
                    color: #718096;
                    margin-top: 0.5rem;
                }
                .autocomplete-wrapper {
                    position: relative;
                }
                .autocomplete-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    margin-top: 4px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 100;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .autocomplete-item {
                    padding: 0.8rem 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-bottom: 1px solid #f7fafc;
                }
                .autocomplete-item:hover {
                    background-color: #f8fafc;
                }
                .autocomplete-item-main {
                    font-weight: 600;
                    display: block;
                    font-size: 0.95rem;
                    color: #2d3748;
                    margin-bottom: 2px;
                }
                .autocomplete-item-sub {
                    font-size: 0.8rem;
                    color: #718096;
                    display: block;
                }
                .autocomplete-loading {
                    padding: 1.5rem;
                    color: #a0aec0;
                    font-size: 0.9rem;
                    text-align: center;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default TeacherVerification;
