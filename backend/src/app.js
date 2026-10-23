const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Task = require("./models/Task");
const { createTaskService } = require("./services/taskService");
const { createTaskRoutes } = require("./routes/taskRoutes");
const { createHealthRoutes } = require("./routes/healthRoutes");
const { AppError, errorHandler, notFound } = require("./middleware/errorHandler");
const { getDatabaseStatus } = require("./config/database");
const { getRedisStatus } = require("./config/redis");

function allowedOrigins() {
  return (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createApp({ taskService = createTaskService({ TaskModel: Task }), healthProvider } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error("Origin is not allowed."), { status: 403 }));
    },
  }));
  app.use(express.json({ limit: "32kb", strict: true }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
  }));

  const getHealth = healthProvider || (() => ({
    database: getDatabaseStatus(),
    redis: getRedisStatus(),
  }));
  app.use("/api/health", createHealthRoutes({ getHealth }));
  app.use("/api/tasks", (req, _res, next) => {
    if (getHealth().database !== "connected") {
      return next(new AppError(503, "The database is unavailable."));
    }
    return next();
  }, createTaskRoutes({ taskService }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const app = createApp();

module.exports = { app, createApp };
