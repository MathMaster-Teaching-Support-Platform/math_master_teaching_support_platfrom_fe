import { Sparkles, Wand2, X } from 'lucide-react';

/**
 * Lightweight chooser shown when the teacher clicks "Tạo mẫu mới" on the
 * dashboard. Both options end at the same Blueprint shape; the difference is
 * who fills in the placeholders and constraints.
 *
 * Layout:
 *   - Desktop (≥ 720px): two cards side by side, equal width.
 *   - Mobile (< 720px):  single column, cards stack.
 *
 * The side-by-side layout makes the trade-off easier to compare at a glance —
 * teachers wanted to see both options at the same time before committing.
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPickReal: () => void;
  onPickManual: () => void;
};

export function TemplateMethodPicker({
  isOpen,
  onClose,
  onPickReal,
  onPickManual,
}: Readonly<Props>) {
  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(880px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Bạn muốn tạo mẫu theo cách nào?</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Cả hai cách đều tạo ra cùng một Blueprint. Hãy chọn cách phù hợp
              với bạn.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div
          className="modal-body method-picker-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          <button
            type="button"
            onClick={onPickReal}
            className="method-picker-card"
            style={{
              minHeight: 0,
              border: '2px solid #c4b5fd',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '1.25rem 1.3rem',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(124, 58, 237, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#7c3aed',
              }}
            >
              <div
                style={{
                  background: '#ddd6fe',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <strong
                style={{
                  color: '#5b21b6',
                  fontSize: '1rem',
                  lineHeight: 1.35,
                }}
              >
                Tôi viết câu hỏi thật
                <br />
                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#7c3aed' }}>
                  AI tự tạo template
                </span>
              </strong>
            </div>
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: '0.86rem',
                lineHeight: 1.55,
                color: '#5b21b6',
              }}
            >
              Bạn nhập đề bài, đáp án, lời giải với <em>số thật</em>. AI sẽ tự
              xác định hệ số (a, b, c…) và ràng buộc tương ứng. Đây là cách dễ
              nhất — không cần biết về <code>{'{{'}placeholder{'}}'}</code>.
            </p>
            <span
              style={{
                marginTop: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#7c3aed',
                letterSpacing: '0.02em',
              }}
            >
              Phù hợp với giáo viên mới →
            </span>
          </button>

          <button
            type="button"
            onClick={onPickManual}
            className="method-picker-card"
            style={{
              minHeight: 0,
              border: '2px solid #bfdbfe',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '1.25rem 1.3rem',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(29, 78, 216, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1d4ed8',
              }}
            >
              <div
                style={{
                  background: '#bfdbfe',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Wand2 size={18} />
              </div>
              <strong
                style={{
                  color: '#1e3a8a',
                  fontSize: '1rem',
                  lineHeight: 1.35,
                }}
              >
                Tôi tự định nghĩa template
                <br />
                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#1d4ed8' }}>
                  Với <code>{'{{a}}'}</code>, <code>{'{{b}}'}</code>
                </span>
              </strong>
            </div>
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: '0.86rem',
                lineHeight: 1.55,
                color: '#1e3a8a',
              }}
            >
              Bạn tự viết template với placeholder và mô tả ràng buộc. Phù hợp
              khi bạn muốn kiểm soát chính xác từng chi tiết — không gọi AI.
            </p>
            <span
              style={{
                marginTop: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#1d4ed8',
                letterSpacing: '0.02em',
              }}
            >
              Phù hợp với người dùng nâng cao →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
