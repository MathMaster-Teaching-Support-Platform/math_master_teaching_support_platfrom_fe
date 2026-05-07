interface TFClause {
  text: string;
  truthValue: boolean;
}

interface TFQuestionEditorProps {
  stem: string;
  clauses: TFClause[];
  onStemChange: (stem: string) => void;
  onClauseChange: (index: number, clause: TFClause) => void;
}

export function TFQuestionEditor({
  stem,
  clauses,
  onStemChange,
  onClauseChange,
}: TFQuestionEditorProps) {
  return (
    <div style={{ padding: '12px 14px', background: '#f0f9ff', borderRadius: 8 }}>
      <h4>Chỉnh sửa câu Đúng/Sai</h4>
      
      {/* Stem input */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
          Mệnh đề chính (Stem)
        </label>
        <textarea
          value={stem}
          onChange={(e) => onStemChange(e.target.value)}
          placeholder="Cho hàm số f(x) = x³ - 3x + 1. Xét các mệnh đề:"
          style={{ width: '100%', minHeight: 60, marginTop: 4 }}
        />
      </div>

      {/* Clause editors */}
      {clauses.map((clause, index) => (
        <div key={index} style={{ marginBottom: 12, padding: 10, background: '#fff', borderRadius: 6 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            Mệnh đề {String.fromCharCode(65 + index)}
          </label>
          
          <textarea
            value={clause.text}
            onChange={(e) => onClauseChange(index, { ...clause, text: e.target.value })}
            placeholder={`Mệnh đề ${String.fromCharCode(65 + index)}`}
            style={{ width: '100%', minHeight: 40, marginTop: 4, marginBottom: 8 }}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {/* True/False toggle */}
            <button
              type="button"
              onClick={() => onClauseChange(index, { ...clause, truthValue: !clause.truthValue })}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 6,
                border: '2px solid',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: clause.truthValue ? '#10b981' : '#ef4444',
                borderColor: clause.truthValue ? '#059669' : '#dc2626',
                color: '#fff',
              }}
            >
              {clause.truthValue ? 'Đúng' : 'Sai'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
