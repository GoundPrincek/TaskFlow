import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { createDemoTasks, createMockTaskService } from "../services/mockTaskService";
import { calculateDashboardStats } from "../utils/taskUtils";

function renderApp({
  tasks = createDemoTasks(),
  service: serviceOverride,
  initialEntry = "/",
} = {}) {
  const service = serviceOverride || createMockTaskService(tasks);
  const result = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App service={service} mode="mock" />
    </MemoryRouter>,
  );
  return { ...result, service };
}

async function openTasks(user) {
  await user.click(screen.getByRole("link", { name: "Tasks" }));
  return screen.findByRole("heading", { name: "Your tasks" });
}

function getCreateButton() {
  return screen
    .getAllByRole("button")
    .find((button) => button.textContent.includes("Create task"));
}

describe("TaskFlow application", () => {
  it("renders dashboard statistics and excludes completed overdue tasks", async () => {
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });

    expect(screen.getByText("Total tasks").closest("article")).toHaveTextContent("5");
    expect(screen.getByText("Completion rate").closest("article")).toHaveTextContent(
      "20%",
    );
    expect(screen.getByText("Overdue tasks").closest("article")).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Sample data")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Publish release notes" }),
    ).not.toBeInTheDocument();
  });

  it("creates a task and updates the visible dashboard counts", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    await user.click(getCreateButton());

    const dialog = screen.getByRole("dialog", { name: "Create a task" });
    await user.type(
      within(dialog).getByRole("textbox", { name: /Title/ }),
      "Draft launch checklist",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );

    expect(await screen.findByText("Draft launch checklist")).toBeInTheDocument();
    expect(screen.getByText("Task created successfully.")).toBeInTheDocument();
    expect(screen.getByText("Total tasks").closest("article")).toHaveTextContent("6");
  });

  it("shows inline validation and does not submit a blank title", async () => {
    const user = userEvent.setup();
    const service = createMockTaskService();
    const createTask = vi.spyOn(service, "createTask");
    renderApp({ service });
    await screen.findByRole("heading", { name: /Good work starts/ });
    await user.click(getCreateButton());
    const dialog = screen.getByRole("dialog", { name: "Create a task" });
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );

    expect(within(dialog).getByText("Enter a task title.")).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  it("edits a task and refreshes its status in the list", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    await openTasks(user);
    await user.click(
      screen.getByRole("button", { name: "Edit Prepare the product brief" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Edit task" });
    const title = within(dialog).getByRole("textbox", { name: /Title/ });
    await user.clear(title);
    await user.type(title, "Prepare the revised product brief");
    await user.selectOptions(
      within(dialog).getByLabelText("Status"),
      "completed",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByText("Prepare the revised product brief"),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Prepare the revised product brief")
        .closest("article"),
    ).toHaveTextContent("Completed");
    expect(screen.getByText("Task updated successfully.")).toBeInTheDocument();
  });

  it("requires confirmation before deleting a task", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    await openTasks(user);

    await user.click(
      screen.getByRole("button", { name: "Delete Finish competitor research" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete this task?" });
    expect(dialog).toHaveTextContent("will be permanently removed");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByText("Finish competitor research"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete Finish competitor research" }),
    );
    const confirmDialog = screen.getByRole("dialog", {
      name: "Delete this task?",
    });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Delete task" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Finish competitor research"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Task deleted successfully.")).toBeInTheDocument();
  });

  it("searches by title, applies combined filters, and clears them", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    await openTasks(user);

    await user.type(
      screen.getByRole("searchbox", { name: "Search tasks by title" }),
      "research",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "todo",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by priority" }),
      "high",
    );
    expect(screen.getByText("Finish competitor research")).toBeInTheDocument();
    expect(screen.queryByText("Review design feedback")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear filters" }),
    );
    expect(screen.getByText("Review design feedback")).toBeInTheDocument();
  });

  it("shows a no-results state with a clear-filters action", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    await openTasks(user);
    await user.type(
      screen.getByRole("searchbox", { name: "Search tasks by title" }),
      "not a real task",
    );

    expect(
      await screen.findByRole("heading", { name: "No tasks match these filters" }),
    ).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", {
      name: "Clear filters",
    });
    await user.click(clearButtons[clearButtons.length - 1]);
    expect(screen.getByText("Review design feedback")).toBeInTheDocument();
  });

  it("shows a create action when the task list is empty", async () => {
    const user = userEvent.setup();
    renderApp({ tasks: [] });
    await openTasks(user);

    expect(
      screen.getByRole("heading", { name: "Your task list is ready to begin" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Create task/ }).length,
    ).toBeGreaterThan(0);
  });

  it("displays a loading state while the task request is pending", async () => {
    let resolveTasks;
    const tasksPromise = new Promise((resolve) => {
      resolveTasks = resolve;
    });
    const tasks = createDemoTasks();
    const service = {
      listTasks: vi.fn(() => tasksPromise),
      getStats: vi.fn().mockResolvedValue(calculateDashboardStats(tasks)),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    };
    renderApp({ service });

    expect(screen.getByRole("status")).toHaveTextContent("Loading your dashboard");
    resolveTasks(tasks);
    expect(await screen.findByRole("heading", { name: "Coming up" })).toBeInTheDocument();
  });

  it("shows an error and allows retry without substituting mock success", async () => {
    const user = userEvent.setup();
    const tasks = createDemoTasks();
    const service = {
      listTasks: vi
        .fn()
        .mockRejectedValueOnce(
          new Error("TaskFlow could not reach the API. Check that the backend is running and try again."),
        )
        .mockResolvedValue(tasks),
      getStats: vi.fn().mockResolvedValue(calculateDashboardStats(tasks)),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    };
    renderApp({ service });

    expect(
      await screen.findByText(/could not reach the API/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Finish competitor research")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Finish competitor research")).toBeInTheDocument();
  });

  it("provides accessible names for navigation, search, and form fields", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /Good work starts/ });
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("aria-current", "page");
    await openTasks(user);
    expect(
      screen.getByRole("searchbox", { name: "Search tasks by title" }),
    ).toBeInTheDocument();
    const createButtons = screen.getAllByRole("button", {
      name: "Create task",
    });
    expect(createButtons.length).toBeGreaterThan(0);
    await user.click(createButtons[0]);
    expect(
      screen.getByRole("textbox", { name: /Title/ }),
    ).toHaveAttribute("aria-required", "true");
  });

  it("renders a not-found page with a dashboard link", async () => {
    renderApp({ initialEntry: "/missing-page" });
    expect(
      await screen.findByRole("heading", { name: "This page wandered off." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveAttribute("href", "/");
  });

  it("does not mark an overdue completed task with an overdue badge", async () => {
    const tasks = createDemoTasks();
    renderApp({ tasks: [tasks.find((task) => task._id === "demo-release")] });
    await screen.findByRole("heading", { name: /Good work starts/ });
    expect(
      screen.queryByText("Overdue", { selector: "span" }),
    ).not.toBeInTheDocument();
  });
});
