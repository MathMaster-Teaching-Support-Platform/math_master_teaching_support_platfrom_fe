import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import MathText from '../../components/common/MathText';
import type {
  CanonicalCognitiveLevel,
  CanonicalQuestionRequest,
  CanonicalQuestionResponse,
} from '../../types/canonicalQuestion';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: CanonicalQuestionResponse | null;
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
  mode,
  initialData,
  onClose,
  onSubmit,
  submitting,
}: Readonly<Props>) {
  const [title, setTitle] = useState('');
  const [problemText, setProblemText] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');
  const [cognitiveLevel, setCognitiveLevel] = useState<CanonicalCognitiveLevel>('THONG_HIEU');
  const [error, setError] = useState<string | null>(null);

  let submitLabel = 'Lưu bài toán';
  if (mode === 'create') submitLabel = 'Tạo bài toán gốc';
  if (submitting) submitLabel = 'Đang lưu...';

  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setProblemText(initialData.problemText || '');
      setSolutionSteps(initialData.solutionSteps || '');
      setCognitiveLevel(initialData.cognitiveLevel || 'THONG_HIEU');
      return;
    }

    setTitle('');
    setProblemText('');
    setSolutionSteps('');
    setCognitiveLevel('THONG_HIEU');
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !problemText.trim()) {
      setError('Tiêu đề và nội dung bài toán là bắt buộc.');
      return;
    }

    if (!solutionSteps.trim()) {
      setError('Lời giải là bắt buộc.');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        problemText: problemText.trim(),
        solutionSteps: solutionSteps.trim(),
        cognitiveLevel,
      });

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể lưu bài toán gốc. Vui lòng thử lại.'
      );
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(900px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? 'Thêm bài toán gốc' : 'Cập nhật bài toán gốc'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Bài toán gốc là nền tảng để AI tạo ra nhiều câu hỏi ngẫu nhiên cùng chủ đề.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && (
              <div className="empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tiêu đề
                </p>
                <input
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Mức độ nhận thức
                </p>
                <select
                  className="select"
                  value={cognitiveLevel}
                  onChange={(event) =>
                    setCognitiveLevel(event.target.value as CanonicalCognitiveLevel)
                  }
                >
                  {cognitiveLevels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Nội dung bài toán
              </p>
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
              <p className="muted" style={{ marginBottom: 6 }}>
                Lời giải / Các bước giải *
              </p>
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

