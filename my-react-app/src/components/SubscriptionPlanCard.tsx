import { CheckCircle2, Sparkles } from 'lucide-react';
import type React from 'react';
import type { SubscriptionPlan } from '../services/api/subscription-plan.service';
import { formatPrice } from '../services/api/subscription-plan.service';

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const COVER_ACCENTS = [
  '#1d4ed8',
  '#0f766e',
  '#047857',
  '#c2410c',
  '#be185d',
  '#6d28d9',
] as const;

const FEATURED_COVER: React.CSSProperties = {
  background: 'linear-gradient(165deg, #fffcf8 0%, #ffecd8 45%, #e0b38a 100%)',
};

const billingPeriod = (cycle: string) => {
  if (cycle === 'YEAR') return '/năm';
  if (cycle === 'THREE_MONTHS') return '/3 tháng';
  if (cycle === 'SIX_MONTHS') return '/6 tháng';
  if (cycle === 'FOREVER' || cycle === 'CUSTOM') return '';
  return '/tháng';
};

type SubscriptionPlanCardProps = {
  plan: SubscriptionPlan;
  featured: boolean;
  isCurrent?: boolean;
  index: number;
  actions: React.ReactNode;
  meta?: React.ReactNode;
};

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  featured,
  isCurrent = false,
  index,
  actions,
  meta,
}) => {
  const gi = index % COVER_GRADIENTS.length;
  const accent = COVER_ACCENTS[gi];
  const period = billingPeriod(plan.billingCycle);

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl overflow-hidden bg-white transition-all duration-200',
        featured
          ? 'border-2 border-[#C96442] shadow-[rgba(201,100,66,0.22)_0px_8px_36px] hover:shadow-[rgba(201,100,66,0.34)_0px_16px_56px]'
          : 'border border-[#E8E6DC] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5',
      ].join(' ')}
    >
      {/* Cover */}
      <div
        className="relative h-[148px] flex flex-col justify-end p-5 overflow-hidden"
        style={featured ? FEATURED_COVER : { background: COVER_GRADIENTS[gi], color: accent }}
      >
        <span
          className="absolute top-3.5 left-4 font-[Playfair_Display] text-[12px] font-medium opacity-40"
          style={{ color: featured ? '#7a2b0a' : accent }}
          aria-hidden="true"
        >
          #{String(index + 1).padStart(2, '0')}
        </span>

        {featured && !isCurrent && (
          <span className="absolute top-3.5 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C96442] font-[Be_Vietnam_Pro] text-[11px] font-bold text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            Nổi bật
          </span>
        )}
        {isCurrent && (
          <span className="absolute top-3.5 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 font-[Be_Vietnam_Pro] text-[11px] font-bold text-white shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            Đang dùng
          </span>
        )}

        <h3
          className="font-[Playfair_Display] text-[18px] font-semibold leading-[1.3]"
          style={{ color: featured ? '#5c1a00' : accent }}
        >
          {plan.name}
        </h3>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2 min-h-[40px]">
          {plan.description || 'Gói đăng ký dịch vụ'}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={[
              'font-[Playfair_Display] font-bold leading-none',
              featured ? 'text-[30px] text-[#C96442]' : 'text-[24px] text-[#141413]',
            ].join(' ')}
          >
            {formatPrice(plan.price)}
          </span>
          {period && (
            <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">{period}</span>
          )}
        </div>

        {/* Token */}
        <div className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l2 2" />
          </svg>
          {plan.tokenQuota.toLocaleString()} token / kỳ
        </div>

        {/* Features */}
        {plan.features.length > 0 && (
          <ul className="flex flex-col gap-1.5 mt-1">
            {plan.features.slice(0, 5).map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className={[
                    'mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center',
                    featured ? 'bg-[#C96442]' : 'bg-[#E8E6DC]',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={featured ? 'white' : '#5E5D59'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] leading-[1.4]">
                  {feature}
                </span>
              </li>
            ))}
            {plan.features.length > 5 && (
              <li className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5] pl-[26px]">
                +{plan.features.length - 5} tính năng khác
              </li>
            )}
          </ul>
        )}

        {meta && <div className="pt-1">{meta}</div>}

        <div className="mt-auto pt-3 border-t border-[#F0EEE6]">{actions}</div>
      </div>
    </article>
  );
};
