"use client";

import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "@/types";

// ─── Per-type visual config ───────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle,
    container: "bg-green-500/10 border-green-500/30 text-green-300",
    icon: "text-green-400",
  },
  error: {
    Icon: XCircle,
    container: "bg-red-500/10 border-red-500/30 text-red-300",
    icon: "text-red-400",
  },
  warning: {
    Icon: AlertTriangle,
    container: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    icon: "text-amber-400",
  },
  info: {
    Icon: Info,
    container: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    icon: "text-blue-400",
  },
} as const;

// ─── Single toast item ────────────────────────────────────────────────────────
interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = TOAST_CONFIG[toast.type];
  const { Icon } = config;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl",
        "transition-all duration-300",
        config.container
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.icon)} aria-hidden="true" />
      <p className="text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Toast container (fixed overlay) ─────────────────────────────────────────
interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
