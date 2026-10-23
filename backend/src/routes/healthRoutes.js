const express = require("express");

function createHealthRoutes({ getHealth }) {
  const router = express.Router();
  const report = () => {
    const dependencies = getHealth();
    const ready = dependencies.database === "connected";
    return {
      ready,
      data: {
        status: ready ? "ok" : "not-ready",
        database: dependencies.database,
        redis: dependencies.redis,
      },
    };
  };

  router.get("/live", (_req, res) => {
    res.json({ success: true, message: "API process is live.", data: { status: "ok" } });
  });
  router.get("/ready", (_req, res) => {
    const health = report();
    res.status(health.ready ? 200 : 503).json({
      success: health.ready,
      message: health.ready ? "API is ready." : "A required service is unavailable.",
      data: health.data,
    });
  });
  router.get("/", (_req, res) => {
    const health = report();
    res.status(health.ready ? 200 : 503).json({
      success: health.ready,
      message: health.ready ? "API is healthy." : "A required service is unavailable.",
      data: health.data,
    });
  });
  return router;
}

module.exports = { createHealthRoutes };
