import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorMessage({
  message = "TaskFlow could not load this information.",
  onRetry,
  compact = false,
}) {
  return (
    <section
      className={
        "rounded-2xl border border-red-200 bg-red-50 text-red-900 " +
        (compact ? "p-4" : "p-6 sm:p-8")
      }
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-danger"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Something went wrong</h2>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
          {onRetry && (
            <button
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-semibold text-red-900 transition hover:bg-red-100 focus-visible:outline-red-700"
              type="button"
              onClick={onRetry}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
