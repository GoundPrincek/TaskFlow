import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ListChecks, Plus } from "lucide-react";
import ErrorMessage from "../components/ErrorMessage";
import FilterBar from "../components/FilterBar";
import Loading from "../components/Loading";
import TaskList from "../components/TaskList";
import { useTasks } from "../hooks/useTasks";
import { filterTasks } from "../utils/taskUtils";

const initialFilters = { search: "", status: "", priority: "" };

function NoResults({ onClear }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:py-16">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
        <ListChecks className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">
        No tasks match these filters
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Try a different search or clear the filters to see all your tasks.
      </p>
      <button
        className="mt-5 min-h-10 rounded-lg border border-line px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        type="button"
        onClick={onClear}
      >
        Clear filters
      </button>
    </section>
  );
}

export default function Tasks() {
  const { tasks, isLoading, error, refresh, isMutating } = useTasks();
  const { onCreateTask, onEditTask, onDeleteTask } = useOutletContext();
  const [filters, setFilters] = useState(initialFilters);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters],
  );

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
            <ListChecks className="size-4" aria-hidden="true" />
            Task manager
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your tasks
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Search, sort through priorities, and keep each task moving.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
          type="button"
          onClick={onCreateTask}
        >
          <Plus className="size-4" aria-hidden="true" />
          Create task
        </button>
      </header>

      <FilterBar
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        resultCount={filteredTasks.length}
        totalCount={tasks.length}
      />

      {isLoading ? (
        <Loading label="Loading your tasks" />
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => refresh().catch(() => {})}
        />
      ) : tasks.length === 0 ? (
        <TaskList
          tasks={[]}
          onCreate={onCreateTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
        />
      ) : filteredTasks.length === 0 ? (
        <NoResults onClear={clearFilters} />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onCreate={onCreateTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          isMutating={isMutating}
        />
      )}
    </div>
  );
}
