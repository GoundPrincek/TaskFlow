const Task = require("../models/Task");
const { AppError } = require("../middleware/errorHandler");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function utcDayStart(now = new Date()) {
  const date = new Date(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function createTaskService({ TaskModel = Task, clock = () => new Date() } = {}) {
  return {
    async listTasks(filters = {}) {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.search) query.title = { $regex: escapeRegExp(filters.search), $options: "i" };
      return TaskModel.find(query).sort({ createdAt: -1, _id: -1 }).lean();
    },
    async getTask(id) {
      const task = await TaskModel.findById(id).lean();
      if (!task) throw new AppError(404, "Task not found.");
      return task;
    },
    createTask(values) {
      return TaskModel.create(values);
    },
    async updateTask(id, values) {
      const task = await TaskModel.findByIdAndUpdate(id, values, { new: true, runValidators: true });
      if (!task) throw new AppError(404, "Task not found.");
      return task;
    },
    async deleteTask(id) {
      const task = await TaskModel.findByIdAndDelete(id);
      if (!task) throw new AppError(404, "Task not found.");
      return null;
    },
    async getStats() {
      const [counts] = await TaskModel.aggregate([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            todoTasks: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
            inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            overdueTasks: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$status", "completed"] }, { $ne: ["$dueDate", null] }, { $lt: ["$dueDate", utcDayStart(clock())] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);
      const totalTasks = counts?.totalTasks || 0;
      const completedTasks = counts?.completedTasks || 0;
      return {
        totalTasks,
        todoTasks: counts?.todoTasks || 0,
        inProgressTasks: counts?.inProgressTasks || 0,
        completedTasks,
        overdueTasks: counts?.overdueTasks || 0,
        completionPercentage: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    },
  };
}

module.exports = { createTaskService, escapeRegExp, utcDayStart };
