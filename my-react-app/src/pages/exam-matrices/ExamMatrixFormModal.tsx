import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExamMatrixRequest, ExamMatrixResponse } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ExamMatrixResponse | null;
  onClose: () => void;
  onSubmit: (data: ExamMatrixRequest) => Promise<void>;
};

export function ExamMatrixFormModal({ isOpen, mode, initialData, onClose, onSubmit }: Readonly<Props>) {
  const [formData, setFormData] = useState<ExamMatrixRequest>({
    name: '',
    description: '',
    isReusable: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      isReusable: initialData?.isReusable ?? false,
      totalQuestionsTarget: initialData?.totalQuestionsTarget,
      totalPointsTarget: initialData?.totalPointsTarget,
    });
    setError(null);
    setSaving(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  let submitLabel = 'Cập nhật';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo mới';

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu ma trận');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(640px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? 'Tạo ma trận đề' : 'Chỉnh sửa ma trận đề'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>Cấu hình ma trận dùng để tạo đề kiểm tra.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <p style={{ color: '#be123c', fontSize: 13 }}>{error}</p>}

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Tên ma trận</p>
              <input
                className="input"
                required
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
              <textarea
                className="textarea"
                rows={3}
                value={formData.description ?? ''}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />
            </label>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tổng số câu mục tiêu</p>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={formData.totalQuestionsTarget ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      totalQuestionsTarget: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tổng điểm mục tiêu</p>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={formData.totalPointsTarget ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      totalPointsTarget: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>
            </div>

            <label className="row" style={{ justifyContent: 'start' }}>
              <input
                type="checkbox"
                checked={formData.isReusable ?? false}
                onChange={(event) => setFormData({ ...formData, isReusable: event.target.checked })}
              />{' '}
              Cho phép tái sử dụng
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
