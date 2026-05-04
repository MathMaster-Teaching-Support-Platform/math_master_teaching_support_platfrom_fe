import { Sparkles, Wand2, X } from 'lucide-react';

/**
 * Lightweight chooser shown when the teacher clicks "Tạo mẫu mới" on the
 * dashboard. Both options end at the same Blueprint shape; the difference is
 * who fills in the placeholders and constraints.
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPickReal: () => void;
  onPickManual: () => void;
};

export function TemplateMethodPicker({ isOpen, onClose, onPickReal, onPickManual }: Readonly<Props>) {
  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(640px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Bạn muốn tạo mẫu theo cách nào?</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Cả hai cách đều tạo ra cùng một Blueprint. Hãy chọn cách phù hợp với
              bạn.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
          <button
            type="button"
            onClick={onPickReal}
            className="data-card"
            style={{
              minHeight: 0,
              border: '1px solid #c4b5fd',
              background: '#f5f3ff',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '1rem 1.1rem',
            }}
          >
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <Sparkles size={18} color="#7c3aed" />
              <strong style={{ color: '#5b21b6', fontSize: '1.05rem' }}>
                Tôi viết câu hỏi thật (AI tự tạo template)
              </strong>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Bạn nhập đề bài, đáp án, lời giải với <em>số thật</em>. AI sẽ tự xác
              định biến số (a, b, c…) và ràng buộc tương ứng. Đây là cách dễ nhất —
              không cần biết về <code>{'{{'}placeholder{'}}'}</code>.
            </p>
          </button>

          <button
            type="button"
            onClick={onPickManual}
            className="data-card"
            style={{
              minHeight: 0,
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '1rem 1.1rem',
            }}
          >
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <Wand2 size={18} color="#1d4ed8" />
              <strong style={{ color: '#1e3a8a', fontSize: '1.05rem' }}>
                Tôi tự định nghĩa template với{' '}
                <code>{'{{a}}'}</code>, <code>{'{{b}}'}</code>
              </strong>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Bạn tự viết template với placeholder và mô tả ràng buộc. Phù hợp khi
              bạn muốn kiểm soát chính xác từng chi tiết — không gọi AI.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
