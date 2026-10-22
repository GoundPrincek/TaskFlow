import { Search, X } from "lucide-react";

export default function FilterBar({
  filters,
  onChange,
  onClear,
  resultCount,
  totalCount,
}) {
  const hasFilters = Boolean(
    filters.search || filters.status || filters.priority,
  );

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5" aria-label="Task search and filters">
      <div className="grid gap-3 lg:grid-cols-[minmax(15rem,1fr)_12rem_12rem_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="task-search">
            Search tasks by title
          </label>
          <input
            className="min-h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
            id="task-search"
            name="search"
            type="search"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search tasks"
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="task-status-filter">
            Filter by status
          </label>
          <select
            className="min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
            id="task-status-filter"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="task-priority-filter">
            Filter by priority
          </label>
          <select
            className="min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
            id="task-priority-filter"
            value={filters.priority}
            onChange={(event) => onChange("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
        </div>

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </button>
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Showing <span className="font-semibold text-ink">{resultCount}</span> of{" "}
        {totalCount} tasks
      </p>
    </section>
  );
}
