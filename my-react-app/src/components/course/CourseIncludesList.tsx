import { Clock, Download, FileText, Infinity as InfinityIcon, Smartphone } from 'lucide-react';
import type { FC } from 'react';

interface CourseIncludesListProps {
  totalVideoHours?: number | null;
  articlesCount?: number | null;
  resourcesCount?: number | null;
  mobileText?: string;
  className?: string;
  title?: string;
}

export const CourseIncludesList: FC<CourseIncludesListProps> = ({
  totalVideoHours,
  articlesCount,
  resourcesCount,
  mobileText = 'Truy cập trên thiết bị di động',
  className,
  title = 'Khóa học này bao gồm',
}) => {
  return (
    <section
      className={className}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
      }}
    >
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{title}</h3>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.8rem 1rem',
        }}
      >
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155', fontSize: '0.9rem' }}>
          <Clock size={16} />
          <span>{totalVideoHours || '--'} giờ video theo yêu cầu</span>
        </li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155', fontSize: '0.9rem' }}>
          <FileText size={16} />
          <span>{articlesCount || 0} bài báo/tài liệu</span>
        </li>
        {(resourcesCount ?? 0) > 0 && (
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155', fontSize: '0.9rem' }}>
            <Download size={16} />
            <span>{resourcesCount} tài nguyên tải xuống</span>
          </li>
        )}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155', fontSize: '0.9rem' }}>
          <InfinityIcon size={16} />
          <span>Quyền truy cập trọn đời</span>
        </li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155', fontSize: '0.9rem' }}>
          <Smartphone size={16} />
          <span>{mobileText}</span>
        </li>
      </ul>
    </section>
  );
};
