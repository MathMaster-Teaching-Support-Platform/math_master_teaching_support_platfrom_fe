import type { ReactNode } from 'react';
import './QbBadges.css';

export type QbStatusTone = 'neutral' | 'info' | 'success' | 'warn' | 'danger';

const STATUS_TONE: Record<QbStatusTone, string> = {
  neutral: 'qb-badge--neutral',
  info: 'qb-badge--info',
  success: 'qb-badge--success',
  warn: 'qb-badge--warn',
  danger: 'qb-badge--danger',
};

interface QbBadgeProps {
  tone?: QbStatusTone;
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function QbBadge({ tone = 'neutral', size = 'md', children, className }: QbBadgeProps) {
  return (
    <span
      className={`qb-badge ${STATUS_TONE[tone]} ${size === 'sm' ? 'qb-badge--sm' : ''} ${className ?? ''}`.trim()}
    >
      {children}
    </span>
  );
}

/* ─── Question status ──────────────────────────────────── */
type QuestionStatus = 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED' | string;

const STATUS_META: Record<string, { label: string; tone: QbStatusTone }> = {
  AI_DRAFT: { label: 'Nháp AI', tone: 'neutral' },
  UNDER_REVIEW: { label: 'Chờ duyệt', tone: 'warn' },
  APPROVED: { label: 'Đã duyệt', tone: 'success' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'danger' },
};

export function QbQuestionStatusBadge({ status }: { status?: QuestionStatus | null }) {
  if (!status) return <span className="qb-text-muted">—</span>;
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' as QbStatusTone };
  return <QbBadge tone={meta.tone}>{meta.label}</QbBadge>;
}

/* ─── Visibility badge ─────────────────────────────────── */
export function QbVisibilityBadge({ isPublic }: { isPublic?: boolean }) {
  return (
    <QbBadge tone={isPublic ? 'success' : 'neutral'}>
      {isPublic ? 'Công khai' : 'Riêng tư'}
    </QbBadge>
  );
}

/* ─── Cognitive level ──────────────────────────────────── */
export type CognitiveKey = 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';

const COG_META: Record<CognitiveKey, { short: string; long: string; cls: string }> = {
  NHAN_BIET: { short: 'NB', long: 'Nhận biết', cls: 'qb-cog--nb' },
  THONG_HIEU: { short: 'TH', long: 'Thông hiểu', cls: 'qb-cog--th' },
  VAN_DUNG: { short: 'VD', long: 'Vận dụng', cls: 'qb-cog--vd' },
  VAN_DUNG_CAO: { short: 'VDC', long: 'Vận dụng cao', cls: 'qb-cog--vdc' },
};

const ENGLISH_TO_VI: Record<string, CognitiveKey> = {
  REMEMBER: 'NHAN_BIET',
  UNDERSTAND: 'THONG_HIEU',
  APPLY: 'VAN_DUNG',
  ANALYZE: 'VAN_DUNG_CAO',
  EVALUATE: 'VAN_DUNG_CAO',
  CREATE: 'VAN_DUNG_CAO',
};

function toVi(level?: string | null): CognitiveKey | null {
  if (!level) return null;
  if (level in COG_META) return level as CognitiveKey;
  if (level in ENGLISH_TO_VI) return ENGLISH_TO_VI[level];
  return null;
}

export function QbCognitiveBadge({
  level,
  variant = 'short',
}: {
  level?: string | null;
  variant?: 'short' | 'long';
}) {
  const key = toVi(level);
  if (!key) return <span className="qb-text-muted">—</span>;
  const meta = COG_META[key];
  return (
    <span className={`qb-badge qb-badge--cog ${meta.cls}`}>
      {variant === 'long' ? meta.long : meta.short}
    </span>
  );
}

export const QB_COGNITIVE_OPTIONS: Array<{ value: CognitiveKey; label: string; short: string }> =
  (Object.keys(COG_META) as CognitiveKey[]).map((k) => ({
    value: k,
    label: COG_META[k].long,
    short: COG_META[k].short,
  }));

/* ─── Cognitive distribution mini-bar ──────────────────── */
interface DistributionProps {
  stats?: Record<string, number> | null;
  total?: number;
}

const DISTRIBUTION_ORDER: CognitiveKey[] = [
  'NHAN_BIET',
  'THONG_HIEU',
  'VAN_DUNG',
  'VAN_DUNG_CAO',
];

export function QbCognitiveDistribution({ stats, total }: DistributionProps) {
  if (!stats || Object.keys(stats).length === 0) {
    return <div className="qb-cog-dist qb-cog-dist--empty">Chưa có phân bố mức độ</div>;
  }

  const merged = { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 } as Record<
    CognitiveKey,
    number
  >;
  for (const [key, value] of Object.entries(stats)) {
    const vi = toVi(key);
    if (vi) merged[vi] += value;
  }
  const totalCount = total ?? Object.values(merged).reduce((a, b) => a + b, 0);
  if (totalCount === 0) {
    return <div className="qb-cog-dist qb-cog-dist--empty">Chưa có câu hỏi</div>;
  }

  return (
    <div className="qb-cog-dist" role="img" aria-label="Phân bố mức độ nhận thức">
      <div className="qb-cog-dist__bar">
        {DISTRIBUTION_ORDER.map((key) => {
          const count = merged[key];
          if (count === 0) return null;
          const pct = (count / totalCount) * 100;
          return (
            <span
              key={key}
              className={`qb-cog-dist__seg ${COG_META[key].cls}`}
              style={{ width: `${pct}%` }}
              title={`${COG_META[key].long}: ${count} câu`}
            />
          );
        })}
      </div>
      <div className="qb-cog-dist__legend">
        {DISTRIBUTION_ORDER.map((key) => (
          <span key={key} className="qb-cog-dist__legend-item">
            <span className={`qb-cog-dist__dot ${COG_META[key].cls}`} />
            {COG_META[key].short}
            <strong>{merged[key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
