type Props = {
  optKey: string;
  text: string;
  isCorrect: boolean;
  radioName?: string;
  placeholder?: string;
  onMarkCorrect: () => void;
  onChange: (text: string) => void;
};

export function McqOptionRow({
  optKey,
  text,
  isCorrect,
  radioName = 'mcq-correct',
  placeholder,
  onMarkCorrect,
  onChange,
}: Readonly<Props>) {
  return (
    <label
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        border: isCorrect ? '1px solid #10b981' : '1px solid #e5e7eb',
        background: isCorrect ? '#ecfdf5' : '#fff',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={radioName}
        checked={isCorrect}
        onChange={onMarkCorrect}
        title="Đánh dấu là đáp án đúng"
      />
      <strong style={{ width: 16, color: isCorrect ? '#047857' : '#475569' }}>
        {optKey}
      </strong>
      <input
        className="input"
        placeholder={placeholder ?? `Nội dung phương án ${optKey}`}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
