import { calculateDashboardStats, validateTaskInput } from "../utils/taskUtils";

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function timestampOffset(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function createDemoTasks() {
  return [
    {
      _id: "demo-brief",
      title: "Prepare the product brief",
      description: "Summarize the goals and scope for the next project review.",
      status: "in-progress",
      priority: "high",
      dueDate: dateOffset(2),
      createdAt: timestampOffset(3),
      updatedAt: timestampOffset(1),
    },
    {
      _id: "demo-feedback",
      title: "Review design feedback",
      description: "Collect the latest notes and turn them into clear next steps.",
      status: "todo",
      priority: "medium",
      dueDate: dateOffset(5),
      createdAt: timestampOffset(2),
      updatedAt: timestampOffset(2),
    },
    {
      _id: "demo-release",
      title: "Publish release notes",
      description: "Share the improvements included in the latest release.",
      status: "completed",
      priority: "low",
      dueDate: dateOffset(-2),
      createdAt: timestampOffset(8),
      updatedAt: timestampOffset(1),
    },
    {
      _id: "demo-research",
      title: "Finish competitor research",
      description: "Compare onboarding flows and summarize the main findings.",
      status: "todo",
      priority: "high",
      dueDate: dateOffset(-1),
      createdAt: timestampOffset(5),
      updatedAt: timestampOffset(4),
    },
    {
      _id: "demo-notes",
      title: "Organize project notes",
      description: "",
      status: "todo",
      priority: "low",
      dueDate: null,
      createdAt: timestampOffset(1),
      updatedAt: timestampOffset(1),
    },
  ];
}

function cloneTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function createMockTaskService(initialTasks = createDemoTasks()) {
  let tasks = cloneTasks(initialTasks);
  let nextId = 1;

  return {
    async listTasks() {
      return cloneTasks(tasks);
    },

    async getStats() {
      return calculateDashboardStats(tasks);
    },

    async getTask(id) {
      const task = tasks.find((item) => item._id === id);
      if (!task) throw new Error("This task could not be found.");
      return { ...task };
    },

    async createTask(input) {
      const result = validateTaskInput(input);
      if (!result.isValid) {
        const error = new Error("Check the task details and try again.");
        error.fieldErrors = result.errors;
        throw error;
      }
      const now = new Date().toISOString();
      const id =
        globalThis.crypto?.randomUUID?.() ||
        "mock-" + Date.now() + "-" + nextId++;
      const task = {
        _id: id,
        ...result.values,
        dueDate: result.values.dueDate || null,
        createdAt: now,
        updatedAt: now,
      };
      tasks = [task, ...tasks];
      return { ...task };
    },

    async updateTask(id, input) {
      const index = tasks.findIndex((item) => item._id === id);
      if (index < 0) throw new Error("This task could not be found.");

      const result = validateTaskInput({ ...tasks[index], ...input });
      if (!result.isValid) {
        const error = new Error("Check the task details and try again.");
        error.fieldErrors = result.errors;
        throw error;
      }
      const updated = {
        ...tasks[index],
        ...result.values,
        dueDate: result.values.dueDate || null,
        updatedAt: new Date().toISOString(),
      };
      tasks = tasks.map((task, taskIndex) =>
        taskIndex === index ? updated : task,
      );
      return { ...updated };
    },

    async deleteTask(id) {
      const exists = tasks.some((task) => task._id === id);
      if (!exists) throw new Error("This task could not be found.");
      tasks = tasks.filter((task) => task._id !== id);
      return null;
    },

    reset(tasksToRestore = createDemoTasks()) {
      tasks = cloneTasks(tasksToRestore);
      nextId = 1;
    },
  };
}

export const mockTaskService = createMockTaskService();
