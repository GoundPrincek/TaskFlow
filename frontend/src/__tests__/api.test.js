import { afterEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../services/api";

describe("documented API service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps the documented success envelope", async () => {
    const tasks = [{ _id: "task-1", title: "Read the API contract" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Tasks retrieved successfully",
          data: tasks,
        }),
      }),
    );

    await expect(apiService.listTasks()).resolves.toEqual(tasks);
  });

  it("surfaces API connection errors instead of silently substituting mock data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(apiService.listTasks()).rejects.toThrow(
      "TaskFlow could not reach the API.",
    );
  });

  it("converts API validation errors to field-level form errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Validation failed",
          errors: [{ field: "title", message: "Task title is required" }],
        }),
      }),
    );

    await expect(
      apiService.createTask({ title: "" }),
    ).rejects.toMatchObject({
      message: "Validation failed",
      fieldErrors: { title: "Task title is required" },
    });
  });

  it("hides internal details in server error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: "Mongo connection string leaked",
        }),
      }),
    );

    await expect(apiService.listTasks()).rejects.toThrow(
      "The API could not complete that request.",
    );
  });
});
