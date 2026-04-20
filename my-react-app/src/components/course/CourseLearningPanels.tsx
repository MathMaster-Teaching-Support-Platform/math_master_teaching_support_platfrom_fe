import type { FC } from 'react';

interface CourseLearningPanelsProps {
  whatYouWillLearn?: string | null;
  requirements?: string | null;
  targetAudience?: string | null;
  className?: string;
}

const splitLines = (value?: string | null): string[] =>
  (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const CourseLearningPanels: FC<CourseLearningPanelsProps> = ({
  whatYouWillLearn,
  requirements,
  targetAudience,
  className,
}) => {
  const outcomes = splitLines(whatYouWillLearn);
  const reqs = splitLines(requirements);
  const audiences = splitLines(targetAudience);

  if (outcomes.length === 0 && reqs.length === 0 && audiences.length === 0) {
    return null;
  }

  return (
    <div className={className} style={{ display: 'grid', gap: '1rem' }}>
      {outcomes.length > 0 && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.8rem', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
            Bạn sẽ học được gì
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.6 }}>
            {outcomes.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {reqs.length > 0 && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.8rem', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
            Yêu cầu
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.6 }}>
            {reqs.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {audiences.length > 0 && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.8rem', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
            Khóa học này dành cho ai?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.6 }}>
            {audiences.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
