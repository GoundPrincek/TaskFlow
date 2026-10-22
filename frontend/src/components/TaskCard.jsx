import { CalendarDays, Check, Pencil, Trash2 } from "lucide-react";
import { formatDueDate, isTaskOverdue } from "../utils/taskUtils";

const statusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};

const statusStyles = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-50 text-blue-800",
  completed: "bg-emerald-50 text-emerald-800",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-rose-50 text-rose-800",
};

function humanize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  isMutating = false,
}) {
  const overdue = isTaskOverdue(task);
  const dueDate = formatDueDate(task.dueDate);

  return (
    <article className="group rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-slate-300 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={
                "break-words text-base font-semibold leading-6 " +
                (task.status === "completed"
                  ? "text-slate-500 line-through decoration-slate-300"
                  : "text-ink")
              }
            >
              {task.title}
            </h3>
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-danger">
                Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1.5 max-w-3xl whitespace-pre-line break-words text-sm leading-6 text-muted">
              {task.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
                statusStyles[task.status]
              }
            >
              {task.status === "completed" && (
                <Check className="size-3.5" aria-hidden="true" />
              )}
              {statusLabels[task.status]}
            </span>
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs font-semibold " +
                priorityStyles[task.priority]
              }
            >
              {humanize(task.priority)} priority
            </span>
            {dueDate && (
              <span
                className={
                  "inline-flex items-center gap-1.5 text-xs font-medium " +
                  (overdue ? "text-danger" : "text-muted")
                }
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                <span>{overdue ? "Due " + dueDate : "Due " + dueDate}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <button
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-ink focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            aria-label={"Edit " + task.title}
            onClick={() => onEdit(task)}
            disabled={isMutating}
          >
            <Pencil className="size-4" aria-hidden="true" />
            <span>Edit</span>
          </button>
          <button
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-danger transition hover:bg-red-50 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            aria-label={"Delete " + task.title}
            onClick={() => onDelete(task)}
            disabled={isMutating}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
