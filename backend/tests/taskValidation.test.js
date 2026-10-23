const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeDueDate, validateTaskBody, validateTaskQuery } = require("../src/middleware/validateTask");

test("normalizes date-only and ISO timestamps to UTC calendar-day midnight", () => {
  assert.equal(normalizeDueDate("2026-10-23").toISOString(), "2026-10-23T00:00:00.000Z");
  assert.equal(normalizeDueDate("2026-10-23T18:00:00.000Z").toISOString(), "2026-10-23T00:00:00.000Z");
  assert.equal(normalizeDueDate("2026-10-23T00:30:00+02:00").toISOString(), "2026-10-22T00:00:00.000Z");
  assert.equal(normalizeDueDate("2026-02-30"), undefined);
  assert.equal(normalizeDueDate("not-a-date"), undefined);
  assert.equal(normalizeDueDate(null), null);
});

test("validates and trims supported task fields", async () => {
  const req = { body: { title: "  Write tests  ", description: " details ", dueDate: "2026-10-23" } };
  await new Promise((resolve, reject) => validateTaskBody("create")(req, {}, (error) => error ? reject(error) : resolve()));
  assert.equal(req.validatedBody.title, "Write tests");
  assert.equal(req.validatedBody.description, "details");
  assert.equal(req.validatedBody.status, undefined);
  assert.equal(req.validatedBody.dueDate.toISOString(), "2026-10-23T00:00:00.000Z");
});

test("reports invalid fields and rejects unsupported update keys", async () => {
  const req = { body: { title: " ", priority: "urgent", owner: "someone" } };
  const error = await new Promise((resolve) => validateTaskBody("create")(req, {}, resolve));
  assert.equal(error.status, 400);
  assert.deepEqual(error.errors.map((item) => item.field), ["owner", "title", "priority"]);
});

test("rejects empty updates and unknown query parameters", async () => {
  const patchError = await new Promise((resolve) => validateTaskBody("patch")({ body: {} }, {}, resolve));
  assert.equal(patchError.status, 400);
  const queryError = await new Promise((resolve) => validateTaskQuery({ query: { page: "1" } }, {}, resolve));
  assert.equal(queryError.status, 400);
  assert.equal(queryError.errors[0].field, "page");
});
