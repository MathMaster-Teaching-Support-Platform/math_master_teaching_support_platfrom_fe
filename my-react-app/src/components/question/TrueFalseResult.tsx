import type { AnswerGradeResponse } from '../../types/grading.types';
import type { ScoringDetail } from '../../types/question';
import MathText from '../common/MathText';

interface TrueFalseResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
  options?: Record<string, string>;
}

export function TrueFalseResult({ answer, questionText, options }: TrueFalseResultProps) {
  const detail = answer.scoringDetail as ScoringDetail | undefined;
  const clauses = detail?.clauseResults ?? {};

  // Parse student answer from "A,C" format to boolean map
  const studentAnswerStr = answer.answerText || '';
  const studentTrueKeys = new Set(
    studentAnswerStr.split(',').map((k: string) => k.trim()).filter((k: string) => k)
  );

  // Parse correct answer from "A,B" format to boolean map
  const correctAnswerStr = typeof answer.correctAnswer === 'string' ? answer.correctAnswer : '';
  const correctTrueKeys = new Set(
    correctAnswerStr.split(',').map((k: string) => k.trim()).filter((k: string) => k)
  );

  return (
    <div className="tf-result" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questionText && (
        <div className="question-text" style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 8 }}>
          <MathText text={questionText} />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table
          className="tf-result-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '2px solid #d1d5db',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                Mệnh đề
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                Mức độ
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                Đáp án đúng
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                Bạn chọn
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #d1d5db' }}>
                Kết quả
              </th>
            </tr>
          </thead>
          <tbody>
            {['A', 'B', 'C', 'D'].map(key => {
              const c = clauses[key];
              // Fallback: if no scoringDetail, compute from answer strings
              const expected = c?.expected ?? correctTrueKeys.has(key);
              const actual = c?.actual ?? studentTrueKeys.has(key);
              const isCorrect = c?.correct ?? (expected === actual);
              
              // Get cognitive level from scoringDetail if available
              const cognitiveLevel = c?.cognitiveLevel || '';
              const cognitiveLevelLabel = cognitiveLevel ? 
                (cognitiveLevel === 'NHAN_BIET' || cognitiveLevel === 'NB' ? 'NB' :
                 cognitiveLevel === 'THONG_HIEU' || cognitiveLevel === 'TH' ? 'TH' :
                 cognitiveLevel === 'VAN_DUNG' || cognitiveLevel === 'VD' ? 'VD' :
                 cognitiveLevel === 'VAN_DUNG_CAO' || cognitiveLevel === 'VDC' ? 'VDC' : '') : '';

              return (
                <tr
                  key={key}
                  style={{
                    backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '1rem' }}>
                    {key}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <MathText text={options?.[key] || ''} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {cognitiveLevelLabel && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {cognitiveLevelLabel}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        backgroundColor: expected ? '#dcfce7' : '#fee2e2',
                        color: expected ? '#166534' : '#991b1b',
                      }}
                    >
                      {expected ? 'Đúng' : 'Sai'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        backgroundColor: actual ? '#dcfce7' : '#fee2e2',
                        color: actual ? '#166534' : '#991b1b',
                      }}
                    >
                      {actual ? 'Đúng' : 'Sai'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '1.5rem' }}>
                    {isCorrect ? '✅' : '❌'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 600 }}>
              <td colSpan={6} style={{ padding: '16px', borderTop: '2px solid #d1d5db' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#374151' }}>Kết quả:</span>
                    <span style={{ color: '#16a34a', fontSize: '1.125rem' }}>
                      {detail?.correctCount ?? 0}/{detail?.totalClauses ?? 4} đúng
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#374151' }}>Điểm:</span>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: answer.pointsEarned === answer.maxPoints ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {answer.pointsEarned}/{answer.maxPoints}
                    </span>
                  </div>
                </div>
                {detail?.scoringRule && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      backgroundColor: '#eff6ff',
                      borderRadius: 6,
                      fontSize: '0.875rem',
                      color: '#1e40af',
                    }}
                  >
                    💡 Quy tắc chấm: {detail.scoringRule === 'VIET_THPT' ? '4/4 đúng → 100%, 3/4 đúng → 25%, 0-2/4 đúng → 0%' : detail.scoringRule}
                  </div>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
