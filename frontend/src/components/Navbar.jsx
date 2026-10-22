import { CheckSquare2, Menu, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({
  isMockMode,
  isNavigationOpen,
  onCreateTask,
  onToggleNavigation,
}) {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-ink lg:hidden"
          type="button"
          aria-label={isNavigationOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isNavigationOpen}
          aria-controls="primary-navigation"
          onClick={onToggleNavigation}
        >
          {isNavigationOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
        <Link className="flex min-w-0 items-center gap-2.5" to="/" aria-label="TaskFlow home">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <CheckSquare2 className="size-5" aria-hidden="true" />
          </span>
          <span className="truncate text-lg font-bold tracking-tight text-ink">
            TaskFlow
          </span>
        </Link>
        {isMockMode && (
          <span className="hidden items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 sm:inline-flex">
            Sample data
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="hidden text-sm text-muted md:block">Make room for focused work.</p>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-brand sm:px-4"
          type="button"
          aria-label="Create task"
          onClick={onCreateTask}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Create task</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
}
