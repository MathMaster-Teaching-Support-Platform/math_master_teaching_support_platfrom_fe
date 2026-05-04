import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSetClausePoints } from '../../hooks/useQuestion';
import type { SetClausePointsRequest } from '../../types/questionTemplate';

interface TFClausePointsGridProps {
  questionId: string;
  totalPoint: number;
  existingClausePoints?: Record<string, number>;
  onSaved?: () => void;
}

const CLAUSES = ['A', 'B', 'C', 'D'] as const;

export function TFClausePointsGrid({
  questionId,
  totalPoint,
  existingClausePoints,
  onSaved,
}: TFClausePointsGridProps) {
  const defaultSplit = totalPoint / 4;

  const [clausePoints, setClausePoints] = useState<Record<string, number>>(() => {
    if (existingClausePoints && Object.keys(existingClausePoints).length > 0) {
      return { ...existingClausePoints };
    }
    return { A: defaultSplit, B: defaultSplit, C: defaultSplit, D: defaultSplit };
  });
  const [savedOk, setSavedOk] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const saveClausePointsMutation = useSetClausePoints();

  // Keep in sync if totalPoint or existingClausePoints prop change
  useEffect(() => {
    if (existingClausePoints && Object.keys(existingClausePoints).length > 0) {
      setClausePoints({ ...existingClausePoints });
    }
  }, [existingClausePoints]);

  const currentSum = CLAUSES.reduce((acc, key) => acc + (clausePoints[key] ?? 0), 0);
  const isValid = Math.abs(currentSum - totalPoint) < 0.001;
  const isLoading = saveClausePointsMutation.isPending;

  const handleChange = (key: string, raw: string) => {
    const value = parseFloat(raw);
    setClausePoints((prev) => ({
      ...prev,
      [key]: isNaN(value) ? 0 : value,
    }));
    setSavedOk(false);
    setServerError(null);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setServerError(null);
    setSavedOk(false);

    const request: SetClausePointsRequest = {
      totalPoint,
      clausePoints,
    };

    try {
      await saveClausePointsMutation.mutateAsync({ questionId, request });
      setSavedOk(true);
      onSaved?.();
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu phân bổ điểm. Vui lòng thử lại.'
      );
    }
  };

  return (
    <div
      style={{
        border: '1px solid #fde68a',
        borderRadius: 10,
        background: '#fffbeb',
        padding: '14px 16px',
        marginTop: 14,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e', marginBottom: 2 }}>
          ⚖️ Phân bổ điểm theo mệnh đề
        </p>
        <p style={{ fontSize: '0.8rem', color: '#b45309' }}>
          Tổng điểm câu hỏi:{' '}
          <strong>{totalPoint}</strong> điểm — phân bổ cho từng mệnh đề A/B/C/D.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px 16px',
          marginBottom: 14,
        }}
      >
        {CLAUSES.map((key) => (
          <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
              Mệnh đề {key}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                className="input"
                step="0.01"
                min="0"
                max={String(totalPoint)}
                style={{ width: '100%', fontSize: '0.9rem' }}
                value={clausePoints[key] ?? 0}
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <span style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>điểm</span>
            </div>
          </label>
        ))}
      </div>

      {/* Sum indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 8,
          background: isValid ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${isValid ? '#bbf7d0' : '#fecaca'}`,
          marginBottom: 12,
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        <span style={{ color: isValid ? '#166534' : '#dc2626' }}>
          {isValid ? '✅' : '❌'} Tổng hiện tại: {currentSum.toFixed(2)}
        </span>
        {!isValid && (
          <span style={{ color: '#dc2626', fontWeight: 400, fontSize: '0.8rem' }}>
            Tổng điểm phải bằng {totalPoint}
          </span>
        )}
      </div>

      {/* Success / Error feedback */}
      {savedOk && (
        <div
          style={{
            padding: '8px 12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            fontSize: '0.85rem',
            color: '#166534',
            marginBottom: 10,
          }}
        >
          ✅ Phân bổ điểm đã được lưu thành công!
        </div>
      )}
      {serverError && (
        <div
          style={{
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: '0.85rem',
            color: '#dc2626',
            marginBottom: 10,
          }}
        >
          {serverError}
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        className="btn"
        style={{
          width: '100%',
          background: isValid ? '#d97706' : '#d1d5db',
          color: isValid ? '#fff' : '#9ca3af',
          cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
          fontSize: '0.88rem',
          fontWeight: 600,
        }}
        disabled={!isValid || isLoading}
        onClick={() => void handleSave()}
      >
        {isLoading ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
            Đang lưu...
          </>
        ) : (
          <>
            <Save size={14} style={{ marginRight: 6 }} />
            Lưu phân bổ điểm
          </>
        )}
      </button>
    </div>
  );
}
