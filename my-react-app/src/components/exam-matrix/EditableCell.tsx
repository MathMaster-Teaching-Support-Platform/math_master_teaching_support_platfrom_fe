import { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: number;
  editable: boolean;
  onChange: (value: number) => void;
}

export function EditableCell({ value, editable, onChange }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(localValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue !== value) {
      onChange(numValue);
    } else {
      setLocalValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(String(value));
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      // Allow default tab behavior
      handleBlur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow numbers
    if (newValue === '' || /^\d+$/.test(newValue)) {
      setLocalValue(newValue);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="matrix-cell-input"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        maxLength={3}
      />
    );
  }

  return (
    <div
      className={`matrix-cell-value ${editable ? 'matrix-cell-value--editable' : ''}`}
      onClick={handleClick}
      title={editable ? 'Click để chỉnh sửa' : undefined}
    >
      {value}
    </div>
  );
}
