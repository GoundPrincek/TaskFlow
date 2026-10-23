const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");
const { AppError } = require("../src/middleware/errorHandler");

function buildApp() {
  const tasks = [];
  const taskService = {
    listTasks: async (filters) => {
      taskService.lastFilters = filters;
      return tasks;
    },
    getTask: async (id) => {
      const task = tasks.find((item) => item._id === id);
      if (!task) throw new AppError(404, "Task not found.");
      return task;
    },
    createTask: async (values) => {
      const task = { _id: "671234567890abcdef123456", ...values, createdAt: new Date("2026-10-22T00:00:00.000Z"), updatedAt: new Date("2026-10-22T00:00:00.000Z") };
      tasks.push(task);
      return task;
    },
    updateTask: async (id, values) => {
      const index = tasks.findIndex((item) => item._id === id);
      if (index === -1) throw new AppError(404, "Task not found.");
      tasks[index] = { ...tasks[index], ...values };
      return tasks[index];
    },
    deleteTask: async (id) => {
      const index = tasks.findIndex((item) => item._id === id);
      if (index === -1) throw new AppError(404, "Task not found.");
      tasks.splice(index, 1);
      return null;
    },
    getStats: async () => ({ totalTasks: tasks.length, todoTasks: tasks.length, inProgressTasks: 0, completedTasks: 0, overdueTasks: 0, completionPercentage: 0 }),
  };
  const app = createApp({ taskService, healthProvider: () => ({ database: "connected", redis: "not-configured" }) });
  return { app, taskService };
}

test("health separates liveness from readiness and reports optional Redis", async () => {
  const live = await request(createApp({ healthProvider: () => ({ database: "disconnected", redis: "not-configured" }) })).get("/api/health/live");
  assert.equal(live.status, 200);
  const ready = await request(createApp({ healthProvider: () => ({ database: "disconnected", redis: "not-configured" }) })).get("/api/health/ready");
  assert.equal(ready.status, 503);
  assert.equal(ready.body.data.redis, "not-configured");
});

test("serves task CRUD with the documented response envelope", async () => {
  const { app, taskService } = buildApp();
  const created = await request(app).post("/api/tasks").send({ title: "  Prepare release  ", dueDate: "2026-10-23" });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.title, "Prepare release");
  assert.equal(created.body.data.dueDate, "2026-10-23T00:00:00.000Z");

  const id = created.body.data._id;
  const listed = await request(app).get("/api/tasks?status=todo&search=release");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.success, true);
  assert.equal(listed.body.data.length, 1);
  assert.deepEqual(taskService.lastFilters, { status: "todo", search: "release" });
  assert.deepEqual((await request(app).get(`/api/tasks/${id}`)).body.data, created.body.data);

  const updated = await request(app).patch(`/api/tasks/${id}`).send({ status: "completed" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.status, "completed");

  const stats = await request(app).get("/api/tasks/stats");
  assert.equal(stats.status, 200);
  assert.equal(stats.body.data.totalTasks, 1);

  const removed = await request(app).delete(`/api/tasks/${id}`);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.data, null);
  assert.deepEqual((await request(app).get("/api/tasks")).body.data, []);
});

test("rejects invalid bodies, IDs, unsupported pagination, malformed JSON, and missing tasks", async () => {
  const { app } = buildApp();
  const invalidTask = await request(app).post("/api/tasks").send({ title: " ", status: "blocked" });
  assert.equal(invalidTask.status, 400);
  assert.equal(invalidTask.body.success, false);
  assert.ok(Array.isArray(invalidTask.body.errors));

  assert.equal((await request(app).get("/api/tasks?page=1")).status, 400);
  assert.equal((await request(app).get("/api/tasks?status=blocked")).status, 400);
  assert.equal((await request(app).get("/api/tasks?priority=urgent")).status, 400);
  assert.equal((await request(app).get("/api/tasks/not-an-id")).status, 400);
  assert.equal((await request(app).get("/api/tasks/671234567890abcdef123456")).status, 404);

  const malformed = await request(app).post("/api/tasks").set("Content-Type", "application/json").send("{bad json");
  assert.equal(malformed.status, 400);
  assert.match(malformed.body.message, /valid JSON/);
});

test("hides database error details from API clients", async () => {
  const errorApp = createApp({
    taskService: { listTasks: async () => { throw new Error("MongoNetworkError mongodb://private-user:private-password@db"); } },
    healthProvider: () => ({ database: "connected", redis: "connected" }),
  });

  const response = await request(errorApp).get("/api/tasks");
  assert.equal(response.status, 500);
  assert.equal(response.body.message, "The server could not complete that request.");
  assert.doesNotMatch(JSON.stringify(response.body), /MongoNetworkError|mongodb|private-password|stack/i);
});

test("adds an instance identity header only when explicitly enabled", async () => {
  const previous = process.env.TASKFLOW_INSTANCE_HEADER;
  process.env.TASKFLOW_INSTANCE_HEADER = "true";
  try {
    const { app } = buildApp();
    const response = await request(app).get("/api/health/live");
    assert.equal(response.status, 200);
    assert.ok(response.headers["x-taskflow-instance"]);
  } finally {
    if (previous === undefined) delete process.env.TASKFLOW_INSTANCE_HEADER;
    else process.env.TASKFLOW_INSTANCE_HEADER = previous;
  }
});

test("applies security headers to API responses", async () => {
  const { app } = buildApp();
  const response = await request(app).get("/api/health/live");
  assert.equal(response.status, 200);
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
});
