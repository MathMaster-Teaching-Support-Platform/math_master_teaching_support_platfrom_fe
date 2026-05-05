import { useQuery } from '@tanstack/react-query';
import { Lock, Shield, X } from 'lucide-react';
import React, { useEffect } from 'react';
import {
  SystemConfigService,
  type PrivacyPolicySection,
} from '../../services/api/systemConfig.service';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

// â”€â”€ Fallback sections shown on error / while loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FALLBACK_SECTIONS: PrivacyPolicySection[] = [
  {
    title: '1. Giới thiệu',
    paragraphs: [
      'MathMaster cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn.',
      'Bằng cách hoàn tất quy trình xác thực, bạn xác nhận đã đọc và đồng ý với các điều khoản trong Chính sách này.',
    ],
    bulletPoints: [],
  },
];

const FALLBACK_INTRO_BANNER =
  'MathMaster chỉ yêu cầu tài liệu xác thực duy nhất một lần. Thông tin của bạn được bảo vệ nghiêm ngặt và không bao giờ được chia sẻ với bên thứ ba vì mục đích thương mại.';

const PolicySection: React.FC<{ section: PrivacyPolicySection; isLast: boolean }> = ({
  section,
  isLast,
}) => (
  <section>
    <h3 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] leading-[1.3] mb-3">
      {section.title}
    </h3>
    <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-[1.7]">
      {section.paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-3' : undefined}>
          {p}
        </p>
      ))}
      {section.bulletPoints.length > 0 && (
        <ul className="mt-3 space-y-2">
          {section.bulletPoints.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C96442] flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.footer && <p className="mt-4 text-[13px] text-[#87867F]">{section.footer}</p>}
    </div>
    {!isLast && <div className="mt-7 border-t border-[#F0EEE6]" />}
  </section>
);

const SECTIONS_LEGACY: { title: string; content: React.ReactNode }[] = [];

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  const { data: policy, isLoading } = useQuery({
    queryKey: ['privacy-policy'],
    queryFn: () => SystemConfigService.getPrivacyPolicy(),
    staleTime: 10 * 60 * 1000,
  });

  const sections = policy?.sections ?? (isLoading ? [] : FALLBACK_SECTIONS);
  const introBanner = policy?.introBanner ?? FALLBACK_INTRO_BANNER;
  const lastUpdated = policy?.lastUpdated ?? '';

  // Suppress unused-variable warning on legacy constant
  void SECTIONS_LEGACY;

  // Trap focus & close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#141413]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.18)_0px_20px_60px] border border-[#E8E6DC] overflow-hidden">
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-5 border-b border-[#F0EEE6] bg-[#FAF9F5]">
          <div className="w-9 h-9 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="privacy-modal-title"
              className="font-[Playfair_Display] text-[20px] font-medium leading-[1.2] text-[#141413]"
            >
              Chính sách Bảo mật
            </h2>
            {lastUpdated && (
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                Cập nhật lần cuối: {lastUpdated}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87867F] hover:text-[#141413] hover:bg-[#E8E6DC] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/*  Scrollable body  */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Intro banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F5F4ED] border border-[#E8E6DC]">
            <Lock className="w-4 h-4 text-[#C96442] mt-0.5 flex-shrink-0" />
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] leading-[1.6]">
              {introBanner}
            </p>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-2/5 rounded bg-[#E8E6DC]" />
                  <div className="h-3 w-full rounded bg-[#F0EEE6]" />
                  <div className="h-3 w-4/5 rounded bg-[#F0EEE6]" />
                </div>
              ))}
            </div>
          )}

          {/* Dynamic sections */}
          {!isLoading &&
            sections.map((section, idx) => (
              <PolicySection key={idx} section={section} isLast={idx === sections.length - 1} />
            ))}
        </div>

        {/*  Sticky footer  */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#F0EEE6] bg-[#FAF9F5] flex items-center justify-between gap-3">
          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] leading-[1.5]">
            Bằng cách đóng, bạn xác nhận đã đọc chính sách này.
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 bg-[#141413] text-[#FAF9F5] rounded-xl px-5 py-2.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
