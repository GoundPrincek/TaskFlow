import { apiService } from "./api";
import { mockTaskService } from "./mockTaskService";

const configuredMode = (
  import.meta.env.VITE_TASKFLOW_DATA_MODE || "mock"
).trim().toLowerCase();

if (!["mock", "api"].includes(configuredMode)) {
  throw new Error("VITE_TASKFLOW_DATA_MODE must be either mock or api.");
}

export const dataMode = configuredMode;
export const taskService =
  dataMode === "api" ? apiService : mockTaskService;
