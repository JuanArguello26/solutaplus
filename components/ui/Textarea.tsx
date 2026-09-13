interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className = "",
  name,
  ...props
}: TextareaProps) {
  const textareaId = id ?? name;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        name={name}
        rows={4}
        className={`focus-visible:ring-primary resize-none rounded-lg border px-4 py-2.5 text-base text-gray-900 focus:outline-none focus-visible:ring-2 ${error ? "border-red-500" : "border-gray-300"} ${className}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
