const express = require("express");
const { createTaskController } = require("../controllers/taskController");
const { validateTaskBody, validateTaskQuery, validateTaskId } = require("../middleware/validateTask");

function createTaskRoutes({ taskService }) {
  const router = express.Router();
  const controller = createTaskController(taskService);
  router.get("/stats", controller.stats);
  router.route("/")
    .get(validateTaskQuery, controller.list)
    .post(validateTaskBody("create"), controller.create);
  router.route("/:id")
    .all(validateTaskId)
    .get(controller.get)
    .patch(validateTaskBody("patch"), controller.update)
    .delete(controller.remove);
  return router;
}

module.exports = { createTaskRoutes };
