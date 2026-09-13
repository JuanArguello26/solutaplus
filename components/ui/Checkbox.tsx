interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: React.ReactNode;
  error?: string;
}

export function Checkbox({
  label,
  error,
  id,
  className = "",
  name,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? name;
  const errorId = error ? `${checkboxId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          className={`text-primary focus-visible:ring-primary mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 focus:outline-none focus-visible:ring-2 ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
        <label htmlFor={checkboxId} className="text-sm text-gray-700">
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
