const test = require("node:test");
const assert = require("node:assert/strict");
const { createTaskService, escapeRegExp } = require("../src/services/taskService");

test("builds bounded, validated list filters and stable ordering", async () => {
  const search = "plan.*[draft]";
  const query = { status: "todo", priority: "high", search };
  const records = [{ _id: "task-1" }];
  let findQuery;
  let sortSpec;
  const chain = {
    sort(value) { sortSpec = value; return chain; },
    lean: async () => records,
  };
  const service = createTaskService({
    TaskModel: { find(value) { findQuery = value; return chain; } },
  });

  assert.deepEqual(await service.listTasks(query), records);
  assert.deepEqual(findQuery.status, "todo");
  assert.deepEqual(findQuery.priority, "high");
  assert.equal(findQuery.title.$regex, escapeRegExp(search));
  assert.equal(findQuery.title.$options, "i");
  assert.deepEqual(sortSpec, { createdAt: -1, _id: -1 });
});

test("calculates dashboard values and compares overdue dates at UTC day start", async () => {
  const now = new Date("2026-10-23T15:42:00.000Z");
  let pipeline;
  const service = createTaskService({
    TaskModel: {
      aggregate(value) {
        pipeline = value;
        return Promise.resolve([{ totalTasks: 4, todoTasks: 1, inProgressTasks: 1, completedTasks: 2, overdueTasks: 1 }]);
      },
    },
    clock: () => now,
  });

  assert.deepEqual(await service.getStats(), {
    totalTasks: 4,
    todoTasks: 1,
    inProgressTasks: 1,
    completedTasks: 2,
    overdueTasks: 1,
    completionPercentage: 50,
  });
  const overdueCondition = pipeline[0].$group.overdueTasks.$sum.$cond[0].$and;
  assert.deepEqual(overdueCondition[0], { $ne: ["$status", "completed"] });
  assert.deepEqual(overdueCondition[1], { $ne: ["$dueDate", null] });
  assert.deepEqual(overdueCondition[2], { $lt: ["$dueDate", new Date("2026-10-23T00:00:00.000Z")] });
});

test("returns zeroed dashboard values for an empty collection", async () => {
  const service = createTaskService({ TaskModel: { aggregate: async () => [] } });
  assert.deepEqual(await service.getStats(), {
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionPercentage: 0,
  });
});
