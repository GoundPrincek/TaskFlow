function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

function createTaskController(taskService) {
  return {
    list: asyncRoute(async (req, res) => {
      const data = await taskService.listTasks(req.validatedQuery);
      res.json({ success: true, message: "Tasks retrieved successfully.", data });
    }),
    get: asyncRoute(async (req, res) => {
      const data = await taskService.getTask(req.params.id);
      res.json({ success: true, message: "Task retrieved successfully.", data });
    }),
    create: asyncRoute(async (req, res) => {
      const data = await taskService.createTask(req.validatedBody);
      res.status(201).json({ success: true, message: "Task created successfully.", data });
    }),
    update: asyncRoute(async (req, res) => {
      const data = await taskService.updateTask(req.params.id, req.validatedBody);
      res.json({ success: true, message: "Task updated successfully.", data });
    }),
    remove: asyncRoute(async (req, res) => {
      await taskService.deleteTask(req.params.id);
      res.json({ success: true, message: "Task deleted successfully.", data: null });
    }),
    stats: asyncRoute(async (_req, res) => {
      const data = await taskService.getStats();
      res.json({ success: true, message: "Dashboard statistics retrieved successfully.", data });
    }),
  };
}

module.exports = { createTaskController, asyncRoute };
