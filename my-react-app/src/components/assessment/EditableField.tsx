interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  placeholder,
  disabled = false,
}: EditableFieldProps) {
  return (
    <div className="editable-field">
      <label className="editable-field__label">{label}</label>
      <input
        className="editable-field__input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
