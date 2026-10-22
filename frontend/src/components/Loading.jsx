export default function Loading({ label = "Loading tasks" }) {
  return (
    <div
      className="grid min-h-48 place-items-center rounded-2xl border border-line bg-white p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-muted">
        <span
          className="size-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand motion-reduce:animate-none"
          aria-hidden="true"
        />
        {label}
      </div>
    </div>
  );
}
