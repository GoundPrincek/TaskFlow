import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import DashboardStats from "../components/DashboardStats";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import TaskCard from "../components/TaskCard";
import TaskList from "../components/TaskList";
import { useTasks } from "../hooks/useTasks";
import { getUpcomingTasks } from "../utils/taskUtils";

export default function Dashboard() {
  const { tasks, stats, isLoading, error, refresh, isMutating } = useTasks();
  const { onCreateTask, onEditTask, onDeleteTask } = useOutletContext();
  const upcomingTasks = getUpcomingTasks(tasks);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
            <Sparkles className="size-4" aria-hidden="true" />
            Your workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Good work starts with a clear plan.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            See what needs your attention and keep your progress moving.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
          type="button"
          onClick={onCreateTask}
        >
          Create task
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </header>

      {isLoading ? (
        <Loading label="Loading your dashboard" />
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => refresh().catch(() => {})}
        />
      ) : (
        <>
          <DashboardStats stats={stats} />

          {tasks.length === 0 ? (
            <TaskList
              tasks={[]}
              onCreate={onCreateTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ) : (
            <section aria-labelledby="upcoming-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      className="size-[18px] text-brand"
                      aria-hidden="true"
                    />
                    <h2
                      id="upcoming-title"
                      className="text-lg font-semibold text-ink"
                    >
                      Coming up
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Keep the next few priorities in view.
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-brand transition hover:bg-indigo-50"
                  to="/tasks"
                >
                  View all tasks
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              {upcomingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <li key={task._id}>
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        isMutating={isMutating}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
                  Everything is complete. Add another task whenever you are
                  ready.
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
