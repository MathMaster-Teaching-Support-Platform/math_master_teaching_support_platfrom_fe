import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useState } from 'react';
import {
  useAddTemplateMapping,
  useAddTemplateMappingsBatch,
  useListMatchingTemplates,
} from '../../hooks/useExamMatrix';
import { CognitiveLevel } from '../../types/questionTemplate';
import type { AddTemplateMappingRequest, TemplateItem } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  matrixId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const levels = Object.values(CognitiveLevel);

export function TemplateMappingModal({ isOpen, matrixId, onClose, onSuccess }: Readonly<Props>) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [template, setTemplate] = useState<TemplateItem | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.REMEMBER);
  const [questionCount, setQuestionCount] = useState(5);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useListMatchingTemplates(
    matrixId,
    { q: search || undefined, page, size: 6 },
    isOpen && step === 1,
  );
  const addMutation = useAddTemplateMapping();
  const addBatchMutation = useAddTemplateMappingsBatch();

  if (!isOpen) return null;

  const templates = data?.result?.templates ?? [];
  const totalFound = data?.result?.totalTemplatesFound ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFound / 6));

  let stepOneList: React.ReactNode = null;
  if (isLoading) {
    stepOneList = <div className="empty">Đang tải danh sách mẫu...</div>;
  } else if (templates.length === 0) {
    stepOneList = <div className="empty">Không tìm thấy mẫu nào.</div>;
  } else {
    stepOneList = (
      <div className="grid-cards">
        {templates.map((item) => (
          <div key={item.templateId} className="data-card" style={{ minHeight: 0 }}>
            <label className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{item.name}</strong>
              <input
                type="checkbox"
                checked={selectedTemplateIds.has(item.templateId)}
                onChange={(event) =>
                  toggleTemplateSelection(item.templateId, event.target.checked)
                }
              />
            </label>
            <p className="muted" style={{ marginTop: 6 }}>{item.description || 'Không có mô tả'}</p>
            <p className="muted" style={{ marginTop: 4 }}>
              {item.templateType} | {item.cognitiveLevel || 'Không xác định'}
            </p>
            <button
              className="btn secondary"
              style={{ marginTop: 10 }}
              onClick={() => chooseTemplate(item)}
            >
              Cấu hình chi tiết
            </button>
          </div>
        ))}
      </div>
    );
  }

  function chooseTemplate(item: TemplateItem) {
    setTemplate(item);
    if (item.cognitiveLevel) {
      setCognitiveLevel(item.cognitiveLevel);
    }
    setStep(2);
  }

  function toggleTemplateSelection(templateId: string, checked: boolean) {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(templateId);
      else next.delete(templateId);
      return next;
    });
  }

  async function submitBatch() {
    if (selectedTemplateIds.size === 0) return;
    setError(null);
    try {
      await addBatchMutation.mutateAsync({
        matrixId,
        request: {
          templateIds: Array.from(selectedTemplateIds),
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm ánh xạ theo lô');
    }
  }

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);
    if (!template) return;

    const payload: AddTemplateMappingRequest = {
      templateId: template.templateId,
      cognitiveLevel,
      questionCount,
      pointsPerQuestion,
    };
    try {
      await addMutation.mutateAsync({ matrixId, request: payload });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm ánh xạ');
    }
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
            {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}
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

            {stepOneList}

            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span className="muted">Đã chọn: {selectedTemplateIds.size} template</span>
              <button
                className="btn"
                onClick={() => void submitBatch()}
                disabled={selectedTemplateIds.size === 0 || addBatchMutation.isPending}
              >
                {addBatchMutation.isPending ? 'Đang thêm theo lô...' : 'Thêm theo lô'}
              </button>
            </div>

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
              {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}
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
