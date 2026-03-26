import { CheckCircle2, Play, X } from 'lucide-react';
import { useState } from 'react';
import { useTestTemplate } from '../../hooks/useQuestionTemplate';
import type { QuestionTemplateResponse } from '../../types/questionTemplate';
import { MathText } from '../../components/common/MathText';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  template: QuestionTemplateResponse;
};

export function TemplateTestModal({ isOpen, onClose, template }: Props) {
  const [sampleCount, setSampleCount] = useState(5);
  const [useAI, setUseAI] = useState(true);
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading, isError, error, refetch } = useTestTemplate(template.id, sampleCount, useAI, enabled);

  if (!isOpen) return null;

  const result = data?.result;

  function trigger() {
    if (!enabled) {
      setEnabled(true);
      return;
    }
    void refetch();
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Kiểm thử mẫu câu hỏi</h3>
            <p className="muted" style={{ marginTop: 4 }}>{template.name}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Số lượng câu sinh thử</p>
              <input
                className="input"
                type="number"
                min={1}
                max={20}
                value={sampleCount}
                onChange={(event) => setSampleCount(Number(event.target.value))}
              />
            </label>

            <label className="row" style={{ justifyContent: 'start', marginTop: 24 }}>
              <input type="checkbox" checked={useAI} onChange={(event) => setUseAI(event.target.checked)} />
              Sử dụng AI để nâng cao chất lượng
            </label>
          </div>

          {!enabled && <div className="empty">Bấm chạy thử để sinh câu hỏi mẫu.</div>}
          {isLoading && <div className="empty">Đang sinh câu hỏi mẫu...</div>}
          {isError && <div className="empty">{(error as Error)?.message || 'Không thể sinh câu hỏi mẫu'}</div>}

          {result && !isLoading && (
            <>
              <div className="data-card" style={{ minHeight: 0 }}>
                <div className="row" style={{ justifyContent: 'start' }}>
                  <CheckCircle2 size={18} color={result.isValid ? '#0f766e' : '#b45309'} />
                  <h3>{result.isValid ? 'Mẫu hợp lệ' : 'Mẫu cần xem lại'}</h3>
                </div>
                {result.validationErrors && result.validationErrors.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.validationErrors.map((entry) => (
                      <li key={entry} className="muted" style={{ color: '#9f1239' }}>{entry}</li>
                    ))}
                  </ul>
                )}
              </div>

              {result.samples?.map((sample, index) => (
                <article key={`${index}-${sample.questionText}`} className="data-card" style={{ minHeight: 0 }}>
                  <p className="muted">Mẫu {index + 1}</p>
                  <p><MathText text={sample.questionText || ''} /></p>

                  {sample.options && (
                    <div className="table-wrap">
                      <table className="table">
                        <tbody>
                          {Object.entries(sample.options).map(([key, value]) => (
                            <tr key={key}>
                              <td style={{ width: 70 }}>{key}</td>
                               <td><MathText text={typeof value === 'string' ? value : String(value)} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sample.explanation && <p className="muted">{sample.explanation}</p>}
                </article>
              ))}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Đóng</button>
          <button className="btn" onClick={trigger} disabled={isLoading}>
            <Play size={14} />
            {isLoading ? 'Đang chạy...' : 'Chạy thử'}
          </button>
        </div>
      </div>
    </div>
  );
}
