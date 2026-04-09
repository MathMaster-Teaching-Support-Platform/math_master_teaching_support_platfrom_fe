import { X } from 'lucide-react';
import { useState } from 'react';
import MathText from '../../components/common/MathText';
import type {
  CanonicalCognitiveLevel,
  CanonicalQuestionRequest,
} from '../../types/canonicalQuestion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CanonicalQuestionRequest) => Promise<void>;
  submitting: boolean;
};

const cognitiveLevels: CanonicalCognitiveLevel[] = [
  'NHAN_BIET',
  'THONG_HIEU',
  'VAN_DUNG',
  'VAN_DUNG_CAO',
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

export function CanonicalQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
}: Readonly<Props>) {
  const [title, setTitle] = useState('');
  const [problemText, setProblemText] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');
  const [diagramDefinitionRaw, setDiagramDefinitionRaw] = useState('');
  const [problemType, setProblemType] = useState('SHORT_ANSWER');
  const [cognitiveLevel, setCognitiveLevel] = useState<CanonicalCognitiveLevel>('THONG_HIEU');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !problemText.trim()) {
      setError('Tiêu đề và nội dung bài toán là bắt buộc.');
      return;
    }

    if (!solutionSteps.trim()) {
      setError('solutionSteps là bắt buộc cho canonical question.');
      return;
    }

    const diagramDefinition = diagramDefinitionRaw.trim() || undefined;

    try {
      await onSubmit({
        title: title.trim(),
        problemText: problemText.trim(),
        solutionSteps: solutionSteps.trim(),
        diagramDefinition,
        problemType: problemType.trim(),
        cognitiveLevel,
      });

      setTitle('');
      setProblemText('');
      setSolutionSteps('');
      setDiagramDefinitionRaw('');
      setProblemType('SHORT_ANSWER');
      setCognitiveLevel('THONG_HIEU');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo canonical question.');
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(900px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Tạo Canonical Question</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Canonical Question = bài toán gốc do giáo viên định nghĩa.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="empty" style={{ color: '#b91c1c' }}>{error}</div>}

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tiêu đề</p>
                <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Problem Type</p>
                <input className="input" value={problemType} onChange={(event) => setProblemType(event.target.value)} />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Muc do nhan thuc</p>
                <select
                  className="select"
                  value={cognitiveLevel}
                  onChange={(event) => setCognitiveLevel(event.target.value as CanonicalCognitiveLevel)}
                >
                  {cognitiveLevels.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Problem Text (LaTeX hỗ trợ)</p>
              <textarea
                className="textarea"
                rows={4}
                value={problemText}
                onChange={(event) => setProblemText(event.target.value)}
              />
              {problemText && (
                <div className="preview-box">
                  <MathText text={problemText} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Solution Steps (LaTeX) *</p>
              <textarea
                className="textarea"
                rows={4}
                value={solutionSteps}
                onChange={(event) => setSolutionSteps(event.target.value)}
              />
              {solutionSteps && (
                <div className="preview-box">
                  <MathText text={solutionSteps} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Diagram Definition (LaTeX text)</p>
              <textarea
                className="textarea"
                rows={4}
                value={diagramDefinitionRaw}
                onChange={(event) => setDiagramDefinitionRaw(event.target.value)}
                placeholder="Vi du: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
              />
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Canonical'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
