import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  ListTodo,
  TrendingUp,
} from "lucide-react";

const cards = [
  {
    label: "Total tasks",
    key: "totalTasks",
    detail: "Across your task list",
    icon: ListTodo,
    iconStyle: "bg-indigo-50 text-brand",
  },
  {
    label: "To do",
    key: "todoTasks",
    detail: "Ready when you are",
    icon: CircleDashed,
    iconStyle: "bg-slate-100 text-slate-600",
  },
  {
    label: "In progress",
    key: "inProgressTasks",
    detail: "Currently underway",
    icon: ArrowUpRight,
    iconStyle: "bg-blue-50 text-info",
  },
  {
    label: "Completed",
    key: "completedTasks",
    detail: "Nice work so far",
    icon: CheckCircle2,
    iconStyle: "bg-emerald-50 text-success",
  },
];

export default function DashboardStats({ stats }) {
  return (
    <section aria-label="Task statistics">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, key, detail, icon: Icon, iconStyle }) => (
          <article
            className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
            key={key}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {stats[key]}
                </p>
              </div>
              <span className={"grid size-10 place-items-center rounded-xl " + iconStyle}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-brand">
                <TrendingUp className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Completion rate</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Progress across all tasks
                </p>
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {stats.completionPercentage}%
            </p>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Task completion"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={stats.completionPercentage}
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: stats.completionPercentage + "%" }}
            />
          </div>
        </article>

        <article
          className={
            "flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-card sm:p-5 " +
            (stats.overdueTasks > 0
              ? "border-red-200 bg-red-50"
              : "border-line bg-white")
          }
        >
          <div className="flex items-center gap-3">
            <span
              className={
                "grid size-10 place-items-center rounded-xl " +
                (stats.overdueTasks > 0
                  ? "bg-white text-danger"
                  : "bg-slate-100 text-muted")
              }
            >
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Overdue tasks</h2>
              <p className="mt-0.5 text-xs text-muted">
                Completed tasks are excluded
              </p>
            </div>
          </div>
          <p
            className={
              "text-2xl font-semibold tracking-tight " +
              (stats.overdueTasks > 0 ? "text-danger" : "text-ink")
            }
          >
            {stats.overdueTasks}
          </p>
        </article>
      </div>
    </section>
  );
}
