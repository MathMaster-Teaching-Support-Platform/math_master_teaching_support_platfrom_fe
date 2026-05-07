import type { AnswerGradeResponse } from '../../types/grading.types';
import type { ScoringDetail } from '../../types/question';
import MathText from '../common/MathText';
import { ResultVerdictIcon } from './ResultVerdict';

interface TrueFalseResultProps {
  answer: AnswerGradeResponse;
  questionText?: string;
  options?: Record<string, string>;
}

export function TrueFalseResult({ answer, questionText, options }: TrueFalseResultProps) {
  const detail = answer.scoringDetail as ScoringDetail | undefined;
  const clauses = detail?.clauseResults ?? {};
  const totalClauses = detail?.totalClauses ?? 4;
  const pointsPerClause = totalClauses > 0 ? answer.maxPoints / totalClauses : 0;

  // Parse student answer from "A,C" format to boolean map
  const studentAnswerStr = answer.answerText || '';
  const studentTrueKeys = new Set(
    studentAnswerStr
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k)
  );

  // Parse correct answer from "A,B" format to boolean map
  const correctAnswerStr = typeof answer.correctAnswer === 'string' ? answer.correctAnswer : '';
  const correctTrueKeys = new Set(
    correctAnswerStr
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k)
  );

  return (
    <div className="tf-result" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questionText && (
        <div
          className="question-text"
          style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 8 }}
        >
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
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              ></th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              >
                Mệnh đề
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              >
                Đáp án đúng
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              >
                Bạn chọn
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              >
                Kết quả
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  borderBottom: '2px solid #d1d5db',
                }}
              >
                Điểm
              </th>
            </tr>
          </thead>
          <tbody>
            {['A', 'B', 'C', 'D'].map((key) => {
              const c = clauses[key];
              // Fallback: if no scoringDetail, compute from answer strings
              const expected = c?.expected ?? correctTrueKeys.has(key);
              const actual = c?.actual ?? studentTrueKeys.has(key);
              const isCorrect = c?.correct ?? expected === actual;

              return (
                <tr
                  key={key}
                  style={{
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '1rem' }}>{key}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <MathText text={options?.[key] || ''} />
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
                  <td
                    style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ResultVerdictIcon correct={isCorrect} />
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: isCorrect ? '#16a34a' : '#9ca3af',
                    }}
                  >
                    {isCorrect ? `+${pointsPerClause.toFixed(2)}` : '0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 600 }}>
              <td colSpan={7} style={{ padding: '16px', borderTop: '2px solid #d1d5db' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
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
                {(() => {
                  const total = detail?.totalClauses ?? 4;
                  const perClause = total > 0 ? answer.maxPoints / total : 0;
                  return (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: 8,
                        border: '1px solid #bae6fd',
                        fontSize: '0.9rem',
                        color: '#0369a1',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Cách tính điểm:</div>
                      <div style={{ lineHeight: 1.6 }}>
                        Mỗi mệnh đề đúng = <strong>{answer.maxPoints} ÷ {total}</strong>
                        {' '}= <strong>{perClause.toFixed(2)}đ</strong>. Tổng điểm câu = số mệnh đề
                        đúng × {perClause.toFixed(2)}đ.
                      </div>
                    </div>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
