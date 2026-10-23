import { describe, expect, it } from "vitest";
import {
  calculateDashboardStats,
  filterTasks,
  getUpcomingTasks,
  isTaskOverdue,
  validateTaskInput,
} from "../utils/taskUtils";

const testToday = new Date(2026, 9, 22, 12);

describe("task utilities", () => {
  it("returns zeroed dashboard statistics for an empty list", () => {
    expect(calculateDashboardStats([], testToday)).toEqual({
      totalTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      completionPercentage: 0,
    });
  });

  it("calculates status counts, overdue count, and completion percentage", () => {
    const tasks = [
      { status: "todo", dueDate: "2026-10-21" },
      { status: "in-progress", dueDate: "2026-10-22" },
      { status: "completed", dueDate: "2026-10-01" },
      { status: "completed", dueDate: null },
    ];

    expect(calculateDashboardStats(tasks, testToday)).toEqual({
      totalTasks: 4,
      todoTasks: 1,
      inProgressTasks: 1,
      completedTasks: 2,
      overdueTasks: 1,
      completionPercentage: 50,
    });
  });

  it("does not treat a completed task as overdue", () => {
    expect(
      isTaskOverdue(
        { status: "completed", dueDate: "2026-10-01" },
        testToday,
      ),
    ).toBe(false);
  });

  it("uses UTC calendar days for overdue calculations", () => {
    const afterUtcMidnight = new Date("2026-10-22T23:30:00-02:00");
    expect(isTaskOverdue({ status: "todo", dueDate: "2026-10-22" }, afterUtcMidnight)).toBe(true);
    expect(isTaskOverdue({ status: "todo", dueDate: "2026-10-23" }, afterUtcMidnight)).toBe(false);
  });

  it("combines title search, status, and priority filters", () => {
    const tasks = [
      {
        title: "Finish competitor research",
        status: "todo",
        priority: "high",
      },
      { title: "Prepare product brief", status: "todo", priority: "high" },
      {
        title: "Review research notes",
        status: "in-progress",
        priority: "medium",
      },
    ];

    expect(
      filterTasks(tasks, {
        search: "RESEARCH",
        status: "todo",
        priority: "high",
      }),
    ).toEqual([tasks[0]]);
  });

  it("validates required title, length limits, and enum values", () => {
    expect(
      validateTaskInput({
        title: " ",
        description: "x".repeat(2001),
        status: "blocked",
        priority: "urgent",
      }).errors,
    ).toEqual({
      title: "Enter a task title.",
      description: "Descriptions can be up to 2,000 characters.",
      status: "Choose a valid task status.",
      priority: "Choose a valid priority.",
    });
  });

  it("excludes completed work from upcoming tasks", () => {
    const tasks = [
      { _id: "completed", status: "completed", dueDate: "2026-10-23" },
      { _id: "later", status: "todo", dueDate: "2026-10-25" },
      { _id: "soon", status: "in-progress", dueDate: "2026-10-23" },
    ];

    expect(getUpcomingTasks(tasks).map((task) => task._id)).toEqual([
      "soon",
      "later",
    ]);
  });
});
