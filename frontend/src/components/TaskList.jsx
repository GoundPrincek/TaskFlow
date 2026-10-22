import { ClipboardList, Plus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onCreate,
  isMutating = false,
}) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:py-16">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-brand">
          <ClipboardList className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">
          Your task list is ready to begin
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Create your first task to start organizing your day and keeping track
          of what matters.
        </p>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
          type="button"
          onClick={onCreate}
        >
          <Plus className="size-4" aria-hidden="true" />
          Create task
        </button>
      </section>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Tasks">
      {tasks.map((task) => (
        <li key={task._id}>
          <TaskCard
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            isMutating={isMutating}
          />
        </li>
      ))}
    </ul>
  );
}
