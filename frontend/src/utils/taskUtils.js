export const TASK_STATUSES = ["todo", "in-progress", "completed"];
export const TASK_PRIORITIES = ["low", "medium", "high"];

export function toDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function isTaskOverdue(task, now = new Date()) {
  if (task.status === "completed" || !task.dueDate) return false;
  const dueDate = toDateOnly(task.dueDate);
  return isValidDateOnly(dueDate) && dueDate < getLocalDateString(now);
}

export function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function formatDueDate(value) {
  const dateOnly = toDateOnly(value);
  if (!isValidDateOnly(dateOnly)) return "";
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function validateTaskInput(input) {
  const values = {
    title: String(input.title ?? "").trim(),
    description: String(input.description ?? "").trim(),
    status: input.status || "todo",
    priority: input.priority || "medium",
    dueDate: toDateOnly(input.dueDate),
  };
  const errors = {};

  if (!values.title) {
    errors.title = "Enter a task title.";
  } else if (values.title.length > 120) {
    errors.title = "Task titles can be up to 120 characters.";
  }

  if (values.description.length > 2000) {
    errors.description = "Descriptions can be up to 2,000 characters.";
  }

  if (!TASK_STATUSES.includes(values.status)) {
    errors.status = "Choose a valid task status.";
  }

  if (!TASK_PRIORITIES.includes(values.priority)) {
    errors.priority = "Choose a valid priority.";
  }

  if (values.dueDate && !isValidDateOnly(values.dueDate)) {
    errors.dueDate = "Enter a valid due date.";
  }

  return { errors, values, isValid: Object.keys(errors).length === 0 };
}

export function calculateDashboardStats(tasks, now = new Date()) {
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((task) => task.status === "todo").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress",
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    totalTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks: tasks.filter((task) => isTaskOverdue(task, now)).length,
    completionPercentage:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  };
}

export function filterTasks(tasks, filters) {
  const query = filters.search.trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    const matchesSearch = !query || task.title.toLocaleLowerCase().includes(query);
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority =
      !filters.priority || task.priority === filters.priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}

export function getUpcomingTasks(tasks, limit = 4) {
  return [...tasks]
    .filter((task) => task.status !== "completed")
    .sort((first, second) => {
      const firstDue = toDateOnly(first.dueDate);
      const secondDue = toDateOnly(second.dueDate);

      if (firstDue && secondDue) return firstDue.localeCompare(secondDue);
      if (firstDue) return -1;
      if (secondDue) return 1;
      return String(second.createdAt ?? "").localeCompare(
        String(first.createdAt ?? ""),
      );
    })
    .slice(0, limit);
}
