import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useFinalizePreview, useGeneratePreview } from '../../hooks/useExamMatrix';
import MathText from '../../components/common/MathText';
import { QuestionDifficulty } from '../../types/questionTemplate';
import type {
  CandidateQuestion,
  FinalizePreviewQuestionItem,
  TemplateMappingResponse,
} from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  matrixId: string;
  mapping: TemplateMappingResponse;
  onClose: () => void;
  onSuccess: () => void;
};

export function GeneratePreviewModal({ isOpen, matrixId, mapping, onClose, onSuccess }: Props) {
  const [count, setCount] = useState(mapping.questionCount);
  const [difficulty, setDifficulty] = useState('');
  const [candidates, setCandidates] = useState<CandidateQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'config' | 'preview' | 'result'>('config');
  const [savedCount, setSavedCount] = useState(0);

  const previewMutation = useGeneratePreview();
  const finalizeMutation = useFinalizePreview();

  if (!isOpen) return null;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    const response = await previewMutation.mutateAsync({
      matrixId,
      mappingId: mapping.id,
      request: {
        templateId: mapping.templateId,
        count,
        ...(difficulty ? { difficulty: difficulty as QuestionDifficulty } : {}),
      },
    });

    const rows = response.result?.candidates ?? [];
    setCandidates(rows);
    setSelected(new Set(rows.map((_item, index) => index)));
    setStep('preview');
  }

  async function finalize() {
    const questions: FinalizePreviewQuestionItem[] = candidates
      .filter((_item, index) => selected.has(index))
      .map((item) => ({
        questionText: item.questionText,
        questionType: 'MULTIPLE_CHOICE',
        options: item.options,
        correctAnswer: item.correctAnswerKey,
        explanation: item.explanation,
        difficulty: item.calculatedDifficulty,
        cognitiveLevel: mapping.cognitiveLevel,
      }));

    const result = await finalizeMutation.mutateAsync({
      matrixId,
      mappingId: mapping.id,
      request: {
        templateId: mapping.templateId,
        questions,
        pointsPerQuestion: mapping.pointsPerQuestion,
      },
    });

    setSavedCount(result.result?.savedCount ?? questions.length);
    setStep('result');
    onSuccess();
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Sinh câu hỏi xem trước</h3>
            <p className="muted" style={{ marginTop: 4 }}>Tạo danh sách câu hỏi ứng viên từ ánh xạ đã chọn.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {step === 'config' && (
          <form onSubmit={generate}>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Số lượng câu hỏi</p>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  />
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Độ khó (tùy chọn)</p>
                  <select
                    className="select"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                  >
                    <option value="">Tự động</option>
                    <option value={QuestionDifficulty.EASY}>EASY</option>
                    <option value={QuestionDifficulty.MEDIUM}>MEDIUM</option>
                    <option value={QuestionDifficulty.HARD}>HARD</option>
                    <option value={QuestionDifficulty.VERY_HARD}>VERY_HARD</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn" disabled={previewMutation.isPending}>
                <Sparkles size={14} />
                {previewMutation.isPending ? 'Đang sinh...' : 'Sinh câu hỏi'}
              </button>
            </div>
          </form>
        )}

        {step === 'preview' && (
          <>
            <div className="modal-body">
              {candidates.length === 0 && <div className="empty">Chưa có câu hỏi nào được sinh.</div>}
              {candidates.map((item, index) => (
                <label key={`${index}-${item.questionText}`} className="data-card" style={{ minHeight: 0 }}>
                  <div className="row" style={{ justifyContent: 'start' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(index);
                        else next.delete(index);
                        setSelected(next);
                      }}
                    />
                    <p><MathText text={item.questionText} /></p>
                  </div>
                  {item.explanation && <p className="muted">{item.explanation}</p>}
                </label>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={() => setStep('config')}>Quay lại</button>
              <button
                type="button"
                className="btn"
                onClick={() => void finalize()}
                disabled={selected.size === 0 || finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? 'Đang lưu...' : 'Lưu câu đã chọn'}
              </button>
            </div>
          </>
        )}

        {step === 'result' && (
          <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingBottom: 30 }}>
            <CheckCircle2 size={42} color="#0f766e" />
            <h3>Lưu thành công</h3>
            <p className="muted">Đã thêm {savedCount} câu hỏi vào ngân hàng câu hỏi.</p>
            <button className="btn" onClick={onClose}>Hoàn tất</button>
          </div>
        )}
      </div>
    </div>
  );
}
