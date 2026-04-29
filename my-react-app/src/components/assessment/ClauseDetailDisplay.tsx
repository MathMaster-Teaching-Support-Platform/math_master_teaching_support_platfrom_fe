import type { ScoringDetail } from '../../types/question';

interface ClauseDetailDisplayProps {
  scoringDetail: ScoringDetail | Record<string, unknown>;
}

export function ClauseDetailDisplay({ scoringDetail }: ClauseDetailDisplayProps) {
  // Type guard to check if it's a valid ScoringDetail
  if (!scoringDetail || typeof scoringDetail !== 'object') {
    return null;
  }

  const questionType = (scoringDetail as any).questionType;
  if (questionType !== 'TRUE_FALSE') {
    return null;
  }

  const clauseResults = (scoringDetail as any).clauseResults || {};
  const correctCount = (scoringDetail as any).correctCount || 0;
  const earnedRatio = (scoringDetail as any).earnedRatio || 0;

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 6 }}>
      <h4 style={{ marginBottom: 8 }}>Chi tiết từng mệnh đề</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Mệnh đề</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Đáp án</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Học sinh</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(clauseResults).map(([key, result]: [string, any]) => (
            <tr key={key} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 8 }}>{key}</td>
              <td style={{ textAlign: 'center', padding: 8 }}>
                {result.expected ? '✓ Đúng' : '✗ Sai'}
              </td>
              <td style={{ textAlign: 'center', padding: 8 }}>
                {result.actual ? '✓ Đúng' : '✗ Sai'}
              </td>
              <td style={{ textAlign: 'center', padding: 8 }}>
                {result.correct ? (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Đúng</span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Sai</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#64748b' }}>
        Điểm: {correctCount}/4 → {earnedRatio} điểm
      </p>
    </div>
  );
}
