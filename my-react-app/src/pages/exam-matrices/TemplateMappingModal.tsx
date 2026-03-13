import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useAddTemplateMapping, useListMatchingTemplates } from '../../hooks/useExamMatrix';
import { CognitiveLevel } from '../../types/questionTemplate';
import type { AddTemplateMappingRequest, TemplateItem } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  matrixId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const levels = Object.values(CognitiveLevel);

export function TemplateMappingModal({ isOpen, matrixId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [template, setTemplate] = useState<TemplateItem | null>(null);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.REMEMBER);
  const [questionCount, setQuestionCount] = useState(5);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);

  const { data, isLoading } = useListMatchingTemplates(
    matrixId,
    { q: search || undefined, page, size: 6 },
    isOpen && step === 1,
  );
  const addMutation = useAddTemplateMapping();

  if (!isOpen) return null;

  const templates = data?.result?.templates ?? [];
  const totalFound = data?.result?.totalTemplatesFound ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFound / 6));

  function chooseTemplate(item: TemplateItem) {
    setTemplate(item);
    if (item.cognitiveLevel) {
      setCognitiveLevel(item.cognitiveLevel);
    }
    setStep(2);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!template) return;

    const payload: AddTemplateMappingRequest = {
      templateId: template.templateId,
      cognitiveLevel,
      questionCount,
      pointsPerQuestion,
    };
    await addMutation.mutateAsync({ matrixId, request: payload });
    onSuccess();
    onClose();
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(860px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>{step === 1 ? 'Chọn mẫu câu hỏi' : 'Cấu hình ánh xạ'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>Liên kết mẫu câu hỏi vào ma trận hiện tại.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {step === 1 ? (
          <div className="modal-body">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm mẫu câu hỏi"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </label>

            {isLoading ? (
                <div className="empty">Đang tải danh sách mẫu...</div>
            ) : templates.length === 0 ? (
                <div className="empty">Không tìm thấy mẫu nào.</div>
            ) : (
              <div className="grid-cards">
                {templates.map((item) => (
                  <button
                    key={item.templateId}
                    className="data-card"
                    style={{ textAlign: 'left', minHeight: 0, cursor: 'pointer' }}
                    onClick={() => chooseTemplate(item)}
                  >
                    <h3>{item.name}</h3>
                    <p className="muted" style={{ marginTop: 6 }}>{item.description || 'Không có mô tả'}</p>
                    <p className="muted" style={{ marginTop: 4 }}>
                      {item.templateType} | {item.cognitiveLevel || 'Không xác định'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn secondary" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                <ChevronLeft size={14} />
              </button>
              <span className="muted">Trang {page + 1} / {totalPages}</span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="data-card" style={{ minHeight: 0 }}>
                <h3>{template?.name}</h3>
                <p className="muted" style={{ marginTop: 6 }}>{template?.description || 'Không có mô tả'}</p>
              </div>

              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Mức độ nhận thức</p>
                  <select
                    className="select"
                    value={cognitiveLevel}
                    onChange={(event) => setCognitiveLevel(event.target.value as CognitiveLevel)}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Số câu hỏi</p>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={questionCount}
                    onChange={(event) => setQuestionCount(Number(event.target.value))}
                  />
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Điểm mỗi câu</p>
                  <input
                    className="input"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={pointsPerQuestion}
                    onChange={(event) => setPointsPerQuestion(Number(event.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={() => setStep(1)}>Quay lại</button>
              <button type="submit" className="btn" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Đang thêm...' : 'Thêm ánh xạ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
