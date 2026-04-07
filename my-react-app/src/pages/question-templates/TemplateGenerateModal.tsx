import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGenerateQuestions } from '../../hooks/useQuestionTemplate';
import { useGetCanonicalQuestionById, useGetMyCanonicalQuestions } from '../../hooks/useCanonicalQuestion';
import {
  QuestionGenerationMode,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import MathText from '../../components/common/MathText';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  template: QuestionTemplateResponse;
  onGenerated: (message: string) => void;
};

export function TemplateGenerateModal({
  isOpen,
  onClose,
  template,
  onGenerated,
}: Readonly<Props>) {
  const [count, setCount] = useState(5);
  const [easy, setEasy] = useState(2);
  const [medium, setMedium] = useState(2);
  const [hard, setHard] = useState(1);
  const [generationMode, setGenerationMode] = useState<
    (typeof QuestionGenerationMode)[keyof typeof QuestionGenerationMode]
  >(
    template.generationMode || QuestionGenerationMode.PARAMETRIC
  );
  const [canonicalQuestionId, setCanonicalQuestionId] = useState(template.canonicalQuestionId || '');
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateQuestions();
  const canonicalQuery = useGetMyCanonicalQuestions(0, 100, 'createdAt', 'DESC');
  const canonicalDetailQuery = useGetCanonicalQuestionById(
    canonicalQuestionId,
    Boolean(canonicalQuestionId) && generationMode === QuestionGenerationMode.AI_FROM_CANONICAL
  );

  const distributionSum = useMemo(() => easy + medium + hard, [easy, medium, hard]);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (distributionSum !== count) {
      setError('Tổng difficultyDistribution phải bằng count.');
      return;
    }

    if (generationMode === QuestionGenerationMode.AI_FROM_CANONICAL && !canonicalQuestionId) {
      setError('Vui lòng chọn canonical question khi dùng AI_FROM_CANONICAL.');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        id: template.id,
        count,
        difficultyDistribution: {
          EASY: easy,
          MEDIUM: medium,
          HARD: hard,
        },
        generationMode,
        canonicalQuestionId:
          generationMode === QuestionGenerationMode.AI_FROM_CANONICAL
            ? canonicalQuestionId
            : undefined,
      });

      const totalGenerated = response.result?.totalGenerated ?? 0;
      onGenerated(`Đã sinh ${totalGenerated} câu hỏi từ template.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể sinh câu hỏi từ template.');
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Generate Questions From Template</h3>
            <p className="muted" style={{ marginTop: 4 }}>{template.name}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="empty" style={{ color: '#b91c1c' }}>{error}</div>}

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Generation Mode</p>
              <select
                className="select"
                value={generationMode}
                onChange={(event) =>
                  setGenerationMode(
                    event.target.value as (typeof QuestionGenerationMode)[keyof typeof QuestionGenerationMode]
                  )
                }
              >
                <option value={QuestionGenerationMode.PARAMETRIC}>Parametric</option>
                <option value={QuestionGenerationMode.AI_FROM_CANONICAL}>AI from Canonical</option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Count</p>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>EASY</p>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={easy}
                  onChange={(event) => setEasy(Number(event.target.value))}
                />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>MEDIUM</p>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={medium}
                  onChange={(event) => setMedium(Number(event.target.value))}
                />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>HARD</p>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={hard}
                  onChange={(event) => setHard(Number(event.target.value))}
                />
              </label>
            </div>

            <p className="muted">Tổng phân phối hiện tại: {distributionSum} / {count}</p>

            {generationMode === QuestionGenerationMode.AI_FROM_CANONICAL && (
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Canonical Question</p>
                <select
                  className="select"
                  value={canonicalQuestionId}
                  onChange={(event) => setCanonicalQuestionId(event.target.value)}
                >
                  <option value="">Chọn canonical question</option>
                  {(canonicalQuery.data?.result?.content || []).map((canonical) => (
                    <option key={canonical.id} value={canonical.id}>
                      {canonical.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {generationMode === QuestionGenerationMode.AI_FROM_CANONICAL && canonicalDetailQuery.data?.result && (
              <div className="data-card" style={{ minHeight: 0 }}>
                <h3>Preview canonical question</h3>
                <p><MathText text={canonicalDetailQuery.data.result.problemText} /></p>
                <p className="muted" style={{ marginTop: 8 }}>Solution:</p>
                <div className="preview-box">
                  <MathText text={canonicalDetailQuery.data.result.solutionSteps} />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Đóng</button>
            <button type="submit" className="btn" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Đang sinh...' : 'Sinh câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
