import { useState } from 'react';
import { Sparkles, RefreshCw, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useGenerateParameters, useUpdateParameters } from '../../hooks/useQuestionTemplate';
import type {
  GenerateParametersRequest,
  GenerateParametersResponse,
  UpdateParametersRequest,
} from '../../types/questionTemplate';

interface AIParameterPanelProps {
  templateId: string;
  templateText: string;
  answerFormula?: string;
  solutionSteps?: string;
  diagramLatex?: string;
  options?: Record<string, string>;
  clauses?: Record<string, string>;
  parameters: string[];
  sampleQuestions?: Array<Record<string, unknown>>;
  onAccept: (params: Record<string, number | string>) => void;
}

export function AIParameterPanel({
  templateId,
  templateText,
  answerFormula,
  solutionSteps,
  diagramLatex,
  options,
  clauses,
  parameters,
  sampleQuestions,
  onAccept,
}: AIParameterPanelProps) {
  const [result, setResult] = useState<GenerateParametersResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinementCommand, setRefinementCommand] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const generateMutation = useGenerateParameters();
  const updateMutation = useUpdateParameters();

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (parameters.length === 0) return;
    setError(null);
    setUpdateError(null);
    setResult(null);

    const request: GenerateParametersRequest = {
      templateText,
      answerFormula,
      solutionSteps,
      diagramLatex,
      options,
      clauses,
      parameters,
      sampleQuestions,
    };

    try {
      const res = await generateMutation.mutateAsync({ templateId, request });
      const data = (res.result ?? res) as GenerateParametersResponse;
      setResult(data);
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI không thể tạo tham số. Vui lòng thử lại.'
      );
    }
  };

  // ── Refine via teacher command ───────────────────────────────────────────────
  const handleRefine = async () => {
    if (!result || !refinementCommand.trim()) return;
    setUpdateError(null);

    const request: UpdateParametersRequest = {
      currentParameters: result.parameters,
      currentConstraintText: result.constraintText,
      teacherCommand: refinementCommand.trim(),
      answerFormula,
    };

    try {
      const res = await updateMutation.mutateAsync({ templateId, request });
      const data = (res.result ?? res) as GenerateParametersResponse;
      setResult(data);
      setRefinementCommand('');
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : 'Không thể áp dụng yêu cầu. Vui lòng thử lại.'
      );
    }
  };

  // ── Accept ──────────────────────────────────────────────────────────────────
  const handleAccept = () => {
    if (!result) return;
    onAccept(result.parameters);
    setOpen(false);
    setResult(null);
    setRefinementCommand('');
  };

  const isGenerating = generateMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const hasParams = parameters.length > 0;

  return (
    <div
      style={{
        border: '1px solid #bfdbfe',
        borderRadius: 10,
        background: '#eff6ff',
        padding: '14px 16px',
        marginTop: 12,
      }}
    >
      {/* Trigger row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#2563eb" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d4ed8' }}>
            AI Tạo tham số
          </span>
          {hasParams && (
            <span
              style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '1px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {parameters.join(', ')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ fontSize: '0.82rem', padding: '5px 12px' }}
            disabled={isGenerating || !hasParams || !templateText.trim()}
            onClick={() => void handleGenerate()}
          >
            {isGenerating ? (
              <>
                <span className="spinner" style={{ width: 13, height: 13, marginRight: 6 }} />
                AI đang tạo...
              </>
            ) : result ? (
              <>
                <RefreshCw size={13} style={{ marginRight: 5 }} />
                Tạo lại
              </>
            ) : (
              <>
                <Sparkles size={13} style={{ marginRight: 5 }} />
                Tạo tham số
              </>
            )}
          </button>
          {result && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: '0.82rem', padding: '5px 8px' }}
              onClick={() => setOpen((p) => !p)}
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Hint when no parameters defined */}
      {!hasParams && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 8 }}>
          {'Khai báo ít nhất một hệ số ({{a}}) trước khi dùng AI tạo tham số.'}
        </p>
      )}

      {/* Error */}
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
          {/* Parameter cards */}
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 10 }}>
            🤖 Tham số AI đề xuất
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}
          >
            {Object.entries(result.parameters).map(([name, value]) => (
              <div
                key={name}
                style={{
                  background: '#fff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <code
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1d4ed8',
                    }}
                  >
                    {name} = {String(value)}
                  </code>
                </div>
                {result.constraintText[name] && (
                  <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: 0 }}>
                    {result.constraintText[name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Combined constraints */}
          {result.combinedConstraints.length > 0 && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
                fontSize: '0.83rem',
              }}
            >
              <strong style={{ color: '#0369a1' }}>Ràng buộc toán học:</strong>
              <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18 }}>
                {result.combinedConstraints.map((c, i) => (
                  <li key={i} style={{ color: '#0c4a6e' }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Filled preview */}
          {result.filledTextPreview && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: '0.88rem',
                fontStyle: 'italic',
                color: '#374151',
              }}
            >
              <strong style={{ fontStyle: 'normal', color: '#111827' }}>Preview: </strong>
              {result.filledTextPreview}
            </div>
          )}

          {/* Refinement input */}
          <div
            style={{
              borderTop: '1px solid #bfdbfe',
              paddingTop: 12,
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Yêu cầu thêm (tùy chọn):
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                className="textarea"
                rows={2}
                style={{ flex: 1, fontSize: '0.85rem' }}
                placeholder="Ví dụ: nghiệm phải là số nguyên, a phải dương..."
                value={refinementCommand}
                onChange={(e) => setRefinementCommand(e.target.value)}
              />
              <button
                type="button"
                className="btn secondary"
                style={{ alignSelf: 'flex-end', fontSize: '0.82rem', padding: '6px 12px' }}
                disabled={isUpdating || !refinementCommand.trim()}
                onClick={() => void handleRefine()}
              >
                {isUpdating ? (
                  <span className="spinner" style={{ width: 13, height: 13 }} />
                ) : (
                  <>
                    <RefreshCw size={13} style={{ marginRight: 4 }} />
                    Áp dụng
                  </>
                )}
              </button>
            </div>
            {updateError && (
              <p style={{ fontSize: '0.82rem', color: '#dc2626', marginTop: 6 }}>{updateError}</p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: '0.85rem' }}
              disabled={isGenerating}
              onClick={() => void handleGenerate()}
            >
              <RefreshCw size={13} style={{ marginRight: 4 }} />
              Tạo lại
            </button>
            <button
              type="button"
              className="btn"
              style={{ fontSize: '0.85rem', background: '#2563eb', color: '#fff' }}
              onClick={handleAccept}
            >
              <Check size={13} style={{ marginRight: 4 }} />
              Chấp nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
