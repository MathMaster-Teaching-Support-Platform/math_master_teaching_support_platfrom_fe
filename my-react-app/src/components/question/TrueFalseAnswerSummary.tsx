import MathText from '../common/MathText';
import { extractOptionText } from '../../utils/optionText';
import { tfAnswerToBooleans, tfBooleansToDSString } from '../../utils/questionHelpers';

interface TrueFalseAnswerSummaryProps {
  // Answer string in storage format, e.g. "A, C"
  answer: string | undefined | null;
  // Clause map keyed by A/B/C/D. Values may be raw strings or option objects.
  clauses?: Record<string, unknown>;
}

// Renders a TF correct-answer in two layers:
// (1) compact "Đ, S, Đ, S" summary line
// (2) per-clause list with content + Đ/S badge
//
// Used in the review queue and anywhere a teacher needs to see what the
// stored answer string actually means clause-by-clause.
export function TrueFalseAnswerSummary({ answer, clauses }: TrueFalseAnswerSummaryProps) {
  const keys = ['A', 'B', 'C', 'D'];
  const values = tfAnswerToBooleans(answer, keys);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="muted">Đáp án đúng:</span>
        <strong style={{ letterSpacing: '0.05em' }}>{tfBooleansToDSString(values)}</strong>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {keys.map((key, idx) => {
          const isTrue = values[idx];
          const text = clauses?.[key] != null ? extractOptionText(clauses[key]) : '';
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: '#fff',
              }}
            >
              <span style={{ fontWeight: 700, minWidth: 20 }}>{key}.</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <MathText text={text} />
              </span>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  background: isTrue ? '#dcfce7' : '#fee2e2',
                  color: isTrue ? '#166534' : '#991b1b',
                  border: `1px solid ${isTrue ? '#86efac' : '#fca5a5'}`,
                }}
              >
                {isTrue ? 'Đ' : 'S'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrueFalseAnswerSummary;
