import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  QuestionTag,
  QuestionType,
  type BlueprintFromRealQuestionRequest,
  type BlueprintFromRealQuestionResponse,
  type BlueprintParameter,
  type QuestionTemplateRequest,
} from '../../types/questionTemplate';
import { TagSelector } from '../../components/common/TagSelector';

/**
 * Renders the AI's Blueprint draft for the teacher to review. The teacher can
 * edit the constraintText / sampleValue per parameter, the global constraints,
 * and any of the templated artifacts. On confirm the parent calls
 * POST /question-templates with the resulting QuestionTemplateRequest.
 */
type Props = {
  isOpen: boolean;
  request: BlueprintFromRealQuestionRequest | null;
  blueprint: BlueprintFromRealQuestionResponse | null;
  onCancel: () => void;
  onConfirm: (payload: QuestionTemplateRequest) => Promise<void>;
};

export function BlueprintConfirmModal({
  isOpen,
  request,
  blueprint,
  onCancel,
  onConfirm,
}: Readonly<Props>) {
  const [name, setName] = useState('');
  const [params, setParams] = useState<BlueprintParameter[]>([]);
  const [globals, setGlobals] = useState<string[]>([]);
  const [templateText, setTemplateText] = useState('');
  const [answerFormula, setAnswerFormula] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');
  const [diagram, setDiagram] = useState('');
  const [optionsState, setOptionsState] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<QuestionTag[]>([
    QuestionTag.LINEAR_EQUATIONS,
    QuestionTag.PROBLEM_SOLVING,
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !blueprint || !request) return;
    setName(`[${request.questionType}] ${request.questionText.slice(0, 50)}`);
    setParams(blueprint.parameters ?? []);
    setGlobals(blueprint.globalConstraints ?? []);
    setTemplateText(blueprint.templateText ?? '');
    setAnswerFormula(blueprint.answerFormula ?? '');
    setSolutionSteps(blueprint.solutionStepsTemplate ?? '');
    setDiagram(blueprint.diagramTemplate ?? '');
    setOptionsState(blueprint.optionsGenerator ?? {});
    setError(null);
  }, [isOpen, blueprint, request]);

  if (!isOpen || !blueprint || !request) return null;

  function updateParam(index: number, field: keyof BlueprintParameter, value: string) {
    setParams((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]:
                field === 'sampleValue' && value !== '' && !Number.isNaN(Number(value))
                  ? Number(value)
                  : value,
            }
          : p
      )
    );
  }

  function removeParam(index: number) {
    setParams((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirm() {
    // Narrow nullables so the closure body sees non-null types. We early-return
    // null at the top of the component when these are absent, so reaching this
    // function with a null request/blueprint would be a bug — bail loudly.
    const req = request;
    const bp = blueprint;
    if (!req || !bp) {
      setError('Mất dữ liệu Blueprint, vui lòng thử lại.');
      return;
    }
    if (!templateText.trim()) {
      setError('Template text trống — vui lòng kiểm tra.');
      return;
    }
    if (tags.length === 0) {
      setError('Chọn ít nhất 1 tag cho template.');
      return;
    }
    setSaving(true);
    try {
      const parameters: Record<string, unknown> = {};
      for (const p of params) {
        if (!p.name.trim()) continue;
        parameters[p.name.trim()] = {
          constraintText: p.constraintText,
          sampleValue: p.sampleValue,
          occurrences: p.occurrences ?? [],
        };
      }
      const cleanGlobals = globals.map((g) => g.trim()).filter(Boolean);
      const optionsOut: Record<string, unknown> = {};
      Object.entries(optionsState).forEach(([k, v]) => {
        if (v.trim()) optionsOut[k] = v;
      });

      const payload: QuestionTemplateRequest = {
        name: name.trim() || `[${req.questionType}] Untitled`,
        description: 'Auto-generated from Method 1',
        gradeLevel: req.gradeLevel,
        subjectId: req.subjectId,
        chapterId: req.chapterId,
        templateType: req.questionType,
        templateVariant: 'AI_REVERSE_TEMPLATED',
        templateText: { vi: templateText },
        parameters,
        answerFormula: answerFormula || '',
        constraints: cleanGlobals.length ? cleanGlobals : undefined,
        cognitiveLevel: req.cognitiveLevel,
        tags,
        isPublic: false,
        questionBankId: req.questionBankId ?? null,
        diagramTemplate: diagram || undefined,
        solutionStepsTemplate: solutionSteps || undefined,
        optionsGenerator:
          req.questionType === QuestionType.MULTIPLE_CHOICE && Object.keys(optionsOut).length
            ? optionsOut
            : undefined,
      };

      if (
        req.questionType === QuestionType.TRUE_FALSE &&
        bp.clauseTemplates &&
        bp.clauseTemplates.length > 0
      ) {
        payload.statementMutations = {
          clauseTemplates: bp.clauseTemplates.map((c) => ({
            text: c.text,
            truthValue: c.truthValue,
            chapterId: req.chapterId,
            cognitiveLevel: req.cognitiveLevel,
          })),
        };
      }

      await onConfirm(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(1080px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Xác nhận Blueprint</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              AI đã chuyển câu hỏi thật của bạn thành template. Hãy xem lại và chỉnh
              sửa nếu cần. Độ tin cậy:{' '}
              <strong>{Math.round((blueprint.confidence ?? 0) * 100)}%</strong>
            </p>
          </div>
          <button className="icon-btn" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
          {blueprint.warnings && blueprint.warnings.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: '#92400e',
              }}
            >
              <strong>Cảnh báo từ AI:</strong>
              <ul style={{ margin: '6px 0 0 16px' }}>
                {blueprint.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Tên template <span style={{ color: '#ef4444' }}>*</span>
            </p>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <TagSelector selectedTags={tags} onChange={setTags} maxTags={5} required />

          {/* DIFF table */}
          <section className="data-card" style={{ minHeight: 0 }}>
            <h4 style={{ marginTop: 0, color: '#1e3a8a' }}>So sánh trước &amp; sau</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {blueprint.diff.map((d, i) => (
                <div
                  key={`${d.field}-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 1fr',
                    gap: 8,
                    fontSize: '0.85rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                    {d.field}
                  </code>
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      padding: '6px 8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {d.before}
                  </div>
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 6,
                      padding: '6px 8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {d.after}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Parameters table */}
          <section className="data-card" style={{ minHeight: 0 }}>
            <h4 style={{ marginTop: 0, color: '#1e40af' }}>Hệ số &amp; ràng buộc</h4>
            {params.length === 0 && (
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                AI không tìm thấy hệ số nào. Bạn có thể tiếp tục — Blueprint sẽ
                tạo ra các câu hỏi giống hệt nhau.
              </p>
            )}
            {params.map((p, idx) => (
              <div
                key={`${p.name}-${idx}`}
                className="form-grid"
                style={{
                  gridTemplateColumns: '0.6fr 0.8fr 2fr 40px',
                  alignItems: 'start',
                  gap: 8,
                }}
              >
                <input
                  className="input"
                  value={p.name}
                  onChange={(e) => updateParam(idx, 'name', e.target.value)}
                  placeholder="Tên"
                />
                <input
                  className="input"
                  value={String(p.sampleValue ?? '')}
                  onChange={(e) => updateParam(idx, 'sampleValue', e.target.value)}
                  placeholder="Giá trị mẫu"
                />
                <textarea
                  className="textarea"
                  rows={2}
                  value={p.constraintText}
                  onChange={(e) => updateParam(idx, 'constraintText', e.target.value)}
                  placeholder="Ràng buộc dạng văn bản"
                />
                <button
                  type="button"
                  className="btn danger"
                  style={{ height: 38, width: 38, padding: '0.4rem' }}
                  onClick={() => removeParam(idx)}
                  aria-label="Bỏ biến này"
                >
                  ×
                </button>
              </div>
            ))}
          </section>

          {/* Editable templated artifacts */}
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Template text
            </p>
            <textarea
              className="textarea"
              rows={3}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
            />
          </label>

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Công thức tính đáp án
            </p>
            <input
              className="input"
              value={answerFormula}
              onChange={(e) => setAnswerFormula(e.target.value)}
            />
          </label>

          {request.questionType === QuestionType.MULTIPLE_CHOICE &&
            Object.keys(optionsState).length > 0 && (
              <section className="data-card" style={{ minHeight: 0 }}>
                <h4 style={{ marginTop: 0, color: '#92400e' }}>Đáp án có placeholder</h4>
                {Object.entries(optionsState).map(([k, v]) => (
                  <div
                    key={k}
                    className="form-grid"
                    style={{ gridTemplateColumns: '60px 1fr', alignItems: 'center', gap: 8 }}
                  >
                    <strong>{k}</strong>
                    <input
                      className="input"
                      value={v}
                      onChange={(e) =>
                        setOptionsState((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </section>
            )}

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Lời giải template
            </p>
            <textarea
              className="textarea"
              rows={3}
              value={solutionSteps}
              onChange={(e) => setSolutionSteps(e.target.value)}
            />
          </label>

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Sơ đồ template (LaTeX)
            </p>
            <textarea
              className="textarea"
              rows={3}
              value={diagram}
              onChange={(e) => setDiagram(e.target.value)}
            />
          </label>

          {/* Global constraints */}
          <section className="data-card" style={{ minHeight: 0 }}>
            <h4 style={{ marginTop: 0, color: '#1e3a8a' }}>
              Ràng buộc giữa các biến
            </h4>
            {globals.length === 0 && (
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                Không có ràng buộc nào.
              </p>
            )}
            {globals.map((g, i) => (
              <input
                key={i}
                className="input"
                style={{ marginBottom: 6 }}
                value={g}
                onChange={(e) =>
                  setGlobals((prev) =>
                    prev.map((row, idx) => (idx === i ? e.target.value : row))
                  )
                }
              />
            ))}
            <button
              type="button"
              className="btn secondary"
              onClick={() => setGlobals((prev) => [...prev, ''])}
            >
              + Thêm ràng buộc
            </button>
          </section>

          {error && <div className="empty" style={{ color: '#b91c1c' }}>{error}</div>}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="btn" disabled={saving} onClick={confirm}>
            {saving ? (
              'Đang lưu…'
            ) : (
              <>
                <Check size={14} style={{ marginRight: 6 }} />
                Xác nhận tạo template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
