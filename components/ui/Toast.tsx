import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  variant: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, variant, onClose }: ToastProps) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
        variant === "success" ? "bg-secondary" : "bg-red-600"
      } text-white`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="text-sm">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="ml-2 shrink-0 rounded-full p-1 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
