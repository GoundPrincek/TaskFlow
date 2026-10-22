import { CheckCircle2, X } from "lucide-react";

export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-ink shadow-card sm:bottom-6 sm:right-6"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2
        className="mt-0.5 size-4 shrink-0 text-success"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
        type="button"
        aria-label="Dismiss message"
        onClick={onClose}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
