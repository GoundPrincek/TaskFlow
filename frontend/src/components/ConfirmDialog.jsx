import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Delete this task?",
  description,
  confirmLabel = "Delete task",
  isPending = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      setError("");
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  async function handleConfirm() {
    setError("");
    try {
      await onConfirm();
    } catch (cause) {
      setError(
        cause?.message || "The task could not be deleted. Please try again.",
      );
    }
  }

  return (
    <dialog
      className="w-[min(100%-2rem,30rem)] rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-slate-950/40"
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) onCancel();
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p
              id="confirm-description"
              className="mt-1 text-sm leading-6 text-muted"
            >
              {description ||
                "This action permanently removes the task from your list."}
            </p>
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            className="min-h-11 rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
