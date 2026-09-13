interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className = "",
  name,
  ...props
}: SelectProps) {
  const selectId = id ?? name;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className={`focus-visible:ring-primary rounded-lg border bg-white px-4 py-2.5 text-base text-gray-900 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${error ? "border-red-500" : "border-gray-300"} ${className}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
