import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  counter,
  children,
}: Readonly<Props>) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={htmlFor}>
        <span>
          {label}
          {required && (
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {counter !== undefined && (
          <span className="form-field__counter">
            {counter.value}/{counter.max}
          </span>
        )}
      </label>
      {children}
      {error ? (
        <span className="form-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
