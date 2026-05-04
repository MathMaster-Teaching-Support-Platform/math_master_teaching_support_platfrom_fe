import { useState } from 'react';
import { Sparkles, X, Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useExtractParameters } from '../../hooks/useQuestionTemplate';
import type {
  ExtractParametersRequest,
  SuggestedParam,
  FixedValue,
  ExtractParametersResponse,
} from '../../types/questionTemplate';

interface AIExtractPanelProps {
  templateId: string;
  templateText: string;
  answerFormula?: string;
  solutionSteps?: string;
  diagramLatex?: string;
  options?: Record<string, string>;
  clauses?: Record<string, string>;
  onApply: (newTemplateText: string) => void;
}

export function AIExtractPanel({
  templateId,
  templateText,
  answerFormula,
  solutionSteps,
  diagramLatex,
  options,
  clauses,
  onApply,
}: AIExtractPanelProps) {
  const [result, setResult] = useState<ExtractParametersResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMutation = useExtractParameters();

  const handleExtract = async () => {
    if (!templateText.trim()) return;
    setError(null);
    setResult(null);

    const request: ExtractParametersRequest = {
      templateText,
      answerFormula,
      solutionSteps,
      diagramLatex,
      options,
      clauses,
    };

    try {
      const res = await extractMutation.mutateAsync({ templateId, request });
      const data = res.result ?? (res as unknown as ExtractParametersResponse);
      setResult(data);
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI không thể phân tích văn bản. Vui lòng thử lại.'
      );
    }
  };

  const handleApply = () => {
    if (result?.templateResult) {
      onApply(result.templateResult);
      setOpen(false);
      setResult(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError(null);
  };

  const isLoading = extractMutation.isPending;

  return (
    <div
      style={{
        border: '1px solid #e0e7ff',
        borderRadius: 10,
        background: '#f5f3ff',
        padding: '14px 16px',
        marginTop: 12,
      }}
    >
      {/* Trigger row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7c3aed" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#5b21b6' }}>
            AI Gợi ý biến số từ văn bản
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ fontSize: '0.82rem', padding: '5px 12px' }}
            disabled={isLoading || !templateText.trim()}
            onClick={() => void handleExtract()}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: 13, height: 13, marginRight: 6 }} />
                AI đang phân tích...
              </>
            ) : (
              <>
                <Sparkles size={13} style={{ marginRight: 5 }} />
                Phân tích ngay
              </>
            )}
          </button>
          {result && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: '0.82rem', padding: '5px 8px' }}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: '0.85rem',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Results panel */}
      {result && open && (
        <div style={{ marginTop: 14 }}>
          {/* Changeable suggestions */}
          {result.suggestedParams.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  marginBottom: 8,
                }}
              >
                🟢 Biến số có thể thay đổi ({result.suggestedParams.length})
              </p>
              {result.suggestedParams.map((param: SuggestedParam, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Check size={13} color="#16a34a" />
                    <strong>"{param.originalValue}"</strong>
                    <span style={{ color: '#6b7280' }}>tại</span>
                    <em style={{ color: '#374151' }}>{param.location}</em>
                  </div>
                  <div style={{ paddingLeft: 20, color: '#374151' }}>
                    → đề xuất:{' '}
                    <code
                      style={{
                        background: '#dcfce7',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        color: '#166534',
                      }}
                    >
                      {'{{'}{param.suggestedName}{'}}'}
                    </code>
                  </div>
                  {param.reason && (
                    <div style={{ paddingLeft: 20, marginTop: 4, color: '#6b7280', fontSize: '0.8rem' }}>
                      {param.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fixed values */}
          {result.fixedValues.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#7c3aed',
                  marginBottom: 8,
                }}
              >
                🔒 Giá trị cố định (không thay đổi)
              </p>
              {result.fixedValues.map((fv: FixedValue, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Lock size={13} color="#7c3aed" />
                    <strong>"{fv.originalValue}"</strong>
                    <span style={{ color: '#6b7280' }}>tại</span>
                    <em style={{ color: '#374151' }}>{fv.location}</em>
                  </div>
                  {fv.reason && (
                    <div style={{ paddingLeft: 20, color: '#6b7280', fontSize: '0.8rem' }}>
                      {fv.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {result.suggestedParams.length === 0 && result.fixedValues.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 12px',
                color: '#6b7280',
                fontSize: '0.85rem',
              }}
            >
              AI không tìm thấy biến số nào có thể thay đổi trong văn bản này.
            </div>
          )}

          {/* Actions */}
          {result.suggestedParams.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 8,
                paddingTop: 12,
                borderTop: '1px solid #e0e7ff',
              }}
            >
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: '0.85rem' }}
                onClick={handleClose}
              >
                <X size={13} style={{ marginRight: 4 }} />
                Đóng
              </button>
              <button
                type="button"
                className="btn"
                style={{ fontSize: '0.85rem', background: '#7c3aed', color: '#fff' }}
                onClick={handleApply}
              >
                <Check size={13} style={{ marginRight: 4 }} />
                Áp dụng tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
