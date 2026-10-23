const mongoose = require("mongoose");
const { AppError } = require("./errorHandler");

const STATUSES = new Set(["todo", "in-progress", "completed"]);
const PRIORITIES = new Set(["low", "medium", "high"]);
const TASK_FIELDS = new Set(["title", "description", "status", "priority", "dueDate"]);
const QUERY_FIELDS = new Set(["status", "priority", "search"]);

function validDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function normalizeDueDate(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  let dateOnly = value;
  if (value.length !== 10) {
    if (!validDateOnly(value.slice(0, 10)) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
      return undefined;
    }
    dateOnly = new Date(value).toISOString().slice(0, 10);
  }
  if (!validDateOnly(dateOnly)) return undefined;
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function validateTaskBody(mode = "create") {
  return (req, _res, next) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return next(new AppError(400, "Request body must be a JSON object."));
    }

    const errors = [];
    for (const field of Object.keys(body)) {
      if (!TASK_FIELDS.has(field)) errors.push({ field, message: "This field is not supported." });
    }
    if (mode === "patch" && Object.keys(body).length === 0) {
      errors.push({ field: "body", message: "Provide at least one field to update." });
    }

    const values = {};
    if (mode === "create" || Object.hasOwn(body, "title")) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        errors.push({ field: "title", message: "Task title is required." });
      } else if (body.title.trim().length > 120) {
        errors.push({ field: "title", message: "Task title cannot exceed 120 characters." });
      } else {
        values.title = body.title.trim();
      }
    }

    if (Object.hasOwn(body, "description")) {
      if (typeof body.description !== "string") {
        errors.push({ field: "description", message: "Description must be a string." });
      } else if (body.description.trim().length > 2000) {
        errors.push({ field: "description", message: "Description cannot exceed 2000 characters." });
      } else {
        values.description = body.description.trim();
      }
    }
    if (Object.hasOwn(body, "status")) {
      if (!STATUSES.has(body.status)) errors.push({ field: "status", message: "Status must be todo, in-progress, or completed." });
      else values.status = body.status;
    }
    if (Object.hasOwn(body, "priority")) {
      if (!PRIORITIES.has(body.priority)) errors.push({ field: "priority", message: "Priority must be low, medium, or high." });
      else values.priority = body.priority;
    }
    if (Object.hasOwn(body, "dueDate")) {
      const dueDate = normalizeDueDate(body.dueDate);
      if (dueDate === undefined) errors.push({ field: "dueDate", message: "Due date must be a valid ISO date or null." });
      else values.dueDate = dueDate;
    }

    if (errors.length) return next(new AppError(400, "Validation failed.", errors));
    req.validatedBody = values;
    return next();
  };
}

function validateTaskQuery(req, _res, next) {
  const errors = [];
  for (const field of Object.keys(req.query)) {
    if (!QUERY_FIELDS.has(field)) errors.push({ field, message: "This query parameter is not supported." });
  }
  if (req.query.status && !STATUSES.has(req.query.status)) errors.push({ field: "status", message: "Status is not supported." });
  if (req.query.priority && !PRIORITIES.has(req.query.priority)) errors.push({ field: "priority", message: "Priority is not supported." });
  if (req.query.search !== undefined && (typeof req.query.search !== "string" || req.query.search.length > 120)) {
    errors.push({ field: "search", message: "Search must be at most 120 characters." });
  }
  if (errors.length) return next(new AppError(400, "Validation failed.", errors));
  req.validatedQuery = {
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.priority ? { priority: req.query.priority } : {}),
    ...(req.query.search?.trim() ? { search: req.query.search.trim() } : {}),
  };
  return next();
}

function validateTaskId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError(400, "Task ID must be a valid MongoDB ObjectId.", [{ field: "id", message: "Task ID must be a valid MongoDB ObjectId." }]));
  }
  return next();
}

module.exports = { validateTaskBody, validateTaskQuery, validateTaskId, normalizeDueDate };
