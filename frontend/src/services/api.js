const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function getFieldErrors(errors) {
  if (!Array.isArray(errors)) return {};
  return errors.reduce((result, error) => {
    if (error?.field && error?.message) result[error.field] = error.message;
    return result;
  }, {});
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "TaskFlow could not reach the API. Check that the backend is running and try again.",
    );
  }

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const isServerError = response.status >= 500;
    const message = isServerError
      ? "The API could not complete that request. Please try again."
      : payload?.message || "The request could not be completed.";
    throw new ApiError(message, {
      status: response.status,
      fieldErrors: getFieldErrors(payload?.errors),
    });
  }

  return payload?.data ?? payload;
}

export const apiService = {
  async listTasks() {
    const data = await request("/tasks");
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.tasks)) return data.tasks;
    throw new ApiError("The API returned an unexpected task list.");
  },

  async getStats() {
    const data = await request("/tasks/stats");
    if (!data || typeof data !== "object") {
      throw new ApiError("The API returned unexpected dashboard statistics.");
    }
    return data;
  },

  getTask(id) {
    return request("/tasks/" + encodeURIComponent(id));
  },

  createTask(task) {
    return request("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  updateTask(id, updates) {
    return request("/tasks/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteTask(id) {
    return request("/tasks/" + encodeURIComponent(id), {
      method: "DELETE",
    });
  },
};

export { API_BASE_URL };
