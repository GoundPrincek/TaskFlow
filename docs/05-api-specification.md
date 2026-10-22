# API Specification

TODO: Prepare the complete API specification before implementation.
# TaskFlow — API Specification

## 1. Overview

TaskFlow uses a RESTful API built with Node.js and Express.js. The frontend communicates with the backend using HTTP requests and JSON payloads.

The backend handles validation, business logic, database operations, and Redis caching. MongoDB remains the primary source of truth.

### API conventions

- Base path: `/api`
- Data format: JSON
- Character encoding: UTF-8
- API style: REST
- Resource name: `tasks`
- Date format: ISO 8601
- API versioning: Initial version without a separate version prefix
- Authentication: To be finalized before implementation

## 2. Base URL

Local development:

```text
http://localhost:5000/api
```

When the frontend accesses the application through Nginx, it should use the configured application API path rather than depend on a particular backend instance.

The actual production URL will depend on deployment configuration.

## 3. Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check API and dependency health |
| POST | `/tasks` | Create a task |
| GET | `/tasks` | Retrieve tasks with optional filters |
| GET | `/tasks/stats` | Retrieve dashboard statistics |
| GET | `/tasks/:id` | Retrieve a task by ID |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

All endpoints are under `/api`. For example, `GET /tasks` means `GET /api/tasks`.

## 4. Common Response Format

Successful responses should use a consistent JSON structure.

### Success example

```json
{
  "success": true,
  "message": "Task retrieved successfully",
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Complete project documentation",
    "description": "Finish the TaskFlow API specification",
    "status": "in-progress",
    "priority": "high",
    "dueDate": null,
    "createdAt": "2026-10-22T10:00:00.000Z",
    "updatedAt": "2026-10-22T10:00:00.000Z"
  }
}
```

The ID and timestamps above are illustrative examples.

## 5. Health Check

### `GET /api/health`

Purpose: Check whether the API process is running and whether its dependencies are available.

Example response:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "ok",
    "database": "connected",
    "redis": "connected"
  }
}
```

The implementation must distinguish between process liveness and dependency readiness.

- **Liveness:** The API process is running.
- **Readiness:** The API can serve requests according to its required dependencies.

If Redis is optional for request handling, a Redis outage should not necessarily make the application unready. The health response must reflect the actual dependency policy and must not expose connection strings, credentials, or other secrets.

## 6. Create a Task

### `POST /api/tasks`

Purpose: Create a new task.

### Request body

```json
{
  "title": "Complete project documentation",
  "description": "Write the remaining TaskFlow documents",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-10-30T18:00:00.000Z"
}
```

Only supported task fields should be accepted. The backend assigns the task ID and manages timestamps.

### Validation rules

- `title` is required and must contain 1–120 characters after trimming.
- `description` is optional and cannot exceed 2,000 characters.
- `status` must be `todo`, `in-progress`, or `completed`.
- `priority` must be `low`, `medium`, or `high`.
- `dueDate` is optional and must be a valid date if supplied.

### Success response

HTTP `201 Created`

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Complete project documentation",
    "description": "Write the remaining TaskFlow documents",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-10-30T18:00:00.000Z",
    "createdAt": "2026-10-22T10:00:00.000Z",
    "updatedAt": "2026-10-22T10:00:00.000Z"
  }
}
```

After a successful database write, the backend should invalidate affected task-list and dashboard-statistics cache entries.

## 7. Retrieve Tasks

### `GET /api/tasks`

Purpose: Retrieve tasks for display in the task list.

### Optional query parameters

| Parameter | Example | Description |
|---|---|---|
| `status` | `status=todo` | Filter by task status |
| `priority` | `priority=high` | Filter by priority |
| `search` | `search=documentation` | Search task titles |
| `page` | `page=1` | Page number, if pagination is enabled |
| `limit` | `limit=10` | Page size, if pagination is enabled |
| `sortBy` | `sortBy=createdAt` | Field used for sorting, if supported |
| `order` | `order=desc` | Sort direction, if supported |

Example:

```text
GET /api/tasks?status=todo&priority=high
```

The backend must validate query parameters and reject unsupported status or priority values. Pagination and sorting must be explicitly implemented before the frontend relies on them.

### Success response

HTTP `200 OK`

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "title": "Complete project documentation",
      "description": "Write the remaining TaskFlow documents",
      "status": "todo",
      "priority": "high",
      "dueDate": null,
      "createdAt": "2026-10-22T10:00:00.000Z",
      "updatedAt": "2026-10-22T10:00:00.000Z"
    }
  ]
}
```

An empty result should return HTTP `200 OK` with an empty array.

If pagination is enabled, the response should include pagination metadata, for example:

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

The final response format must be consistent across all list requests.

## 8. Retrieve a Single Task

### `GET /api/tasks/:id`

Purpose: Retrieve one task using its MongoDB ObjectId.

Example:

```text
GET /api/tasks/671234567890abcdef123456
```

### Success response

HTTP `200 OK`

```json
{
  "success": true,
  "message": "Task retrieved successfully",
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Complete project documentation",
    "description": "Write the remaining TaskFlow documents",
    "status": "in-progress",
    "priority": "high",
    "dueDate": null,
    "createdAt": "2026-10-22T10:00:00.000Z",
    "updatedAt": "2026-10-22T10:30:00.000Z"
  }
}
```

Return `400 Bad Request` for an invalid ID format and `404 Not Found` when no matching task exists.

## 9. Update a Task

### `PATCH /api/tasks/:id`

Purpose: Update one or more supported fields of an existing task.

### Request body

```json
{
  "status": "completed",
  "priority": "medium"
}
```

Only the supplied, permitted fields should be updated. Omitted fields should remain unchanged.

The backend must:

- Validate the task ID.
- Reject an empty update body.
- Validate every supplied field.
- Reject unsupported fields.
- Apply database update validators.
- Return the updated task.
- Invalidate affected Redis cache entries after a successful database update.

### Success response

HTTP `200 OK`

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Complete project documentation",
    "description": "Write the remaining TaskFlow documents",
    "status": "completed",
    "priority": "medium",
    "dueDate": null,
    "createdAt": "2026-10-22T10:00:00.000Z",
    "updatedAt": "2026-10-22T10:45:00.000Z"
  }
}
```

Return `404 Not Found` if the task does not exist.

## 10. Delete a Task

### `DELETE /api/tasks/:id`

Purpose: Delete a task.

The initial proposal uses permanent deletion. If soft deletion is selected, this contract must be updated to define archive and restore behavior.

### Success response

HTTP `200 OK`

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": null
}
```

Return `400 Bad Request` for an invalid ID and `404 Not Found` if the task does not exist.

After a successful deletion, invalidate affected task-detail, task-list, and dashboard-statistics cache entries.

## 11. Dashboard Statistics

### `GET /api/tasks/stats`

Purpose: Retrieve statistics used by the TaskFlow dashboard.

### Success response

HTTP `200 OK`

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalTasks": 20,
    "todoTasks": 8,
    "inProgressTasks": 5,
    "completedTasks": 7,
    "overdueTasks": 2,
    "completionPercentage": 35
  }
}
```

The values are illustrative.

### Calculation rules

- `totalTasks`: total tasks in the applicable data scope.
- `todoTasks`: tasks with status `todo`.
- `inProgressTasks`: tasks with status `in-progress`.
- `completedTasks`: tasks with status `completed`.
- `overdueTasks`: tasks whose due date is earlier than the current time and whose status is not `completed`.
- `completionPercentage`: completed tasks divided by total tasks, multiplied by 100.

When `totalTasks` is zero, `completionPercentage` must be zero.

Statistics must be recalculated or have their cache invalidated after successful task mutations.

## 12. Error Response Format

Errors should use a consistent response structure.

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Task title is required"
    }
  ]
}
```

The `errors` property may be omitted when there are no field-level details.

### HTTP status codes

| Status | Meaning | Example |
|---|---|---|
| `200` | OK | Task retrieved or updated |
| `201` | Created | Task created |
| `400` | Bad Request | Invalid ID or request fields |
| `404` | Not Found | Task does not exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server failure |
| `503` | Service Unavailable | API cannot serve requests because a required dependency is unavailable |

Do not expose stack traces, database internals, secrets, or connection strings in production error responses. Detailed diagnostic information should be handled through secure server-side logging.

## 13. Validation and Security

- Validate request bodies and query parameters on the backend.
- Accept JSON only where appropriate.
- Enforce request-size limits.
- Use rate limiting and suitable HTTP security headers.
- Configure CORS for the intended frontend origins.
- Keep secrets in environment variables.
- Do not accept arbitrary MongoDB query objects from clients.
- Allow only explicitly supported update fields.
- Return consistent errors without leaking internal details.

### Authentication and authorization

The authentication model is still a design decision.

If TaskFlow supports multiple users:

- Define authentication endpoints and token/session behavior.
- Require authentication on private task endpoints.
- Scope all task queries and dashboard statistics to the authenticated user.
- Verify ownership on reads, updates, and deletions.
- Include the user's identity in relevant Redis cache keys.

Authentication endpoints must be added to this specification before implementing a multi-user API.

## 14. Redis Cache Behavior

Redis is an internal implementation detail and should not require separate public task endpoints.

Proposed behavior:

- Cache eligible task-list reads and dashboard statistics.
- Use a configurable TTL.
- Invalidate affected cached values after successful writes.
- Share cache state across backend instances.
- Use appropriately scoped keys if multiple users are supported.
- Handle cache failures according to the documented fallback policy.

Cache hits and misses must not change the public response format.

## 15. API Testing Plan

The API test suite should verify:

1. Health endpoint returns the expected status.
2. Valid task creation returns `201`.
3. Invalid task creation returns `400`.
4. Task listing returns an array.
5. Filtering and search return matching tasks.
6. Empty task lists return `200` with an empty array.
7. Valid task IDs retrieve the correct task.
8. Invalid task IDs return `400`.
9. Missing tasks return `404`.
10. Partial updates preserve unspecified fields.
11. Invalid update fields are rejected.
12. Successful deletion removes the intended task.
13. Dashboard statistics are correct for empty and populated datasets.
14. Cache entries are invalidated after task mutations.
15. Redis outages follow the documented fallback behavior.
16. Rate limiting and centralized error handling work as configured.
17. If authentication is implemented, unauthorized access and cross-user access are rejected.

Tests must use isolated test data and must not modify production records.

## 16. Implementation Notes

The following implementation order is recommended:

1. Configure the Express application and centralized error handling.
2. Implement the health endpoint.
3. Implement the Task model and request validation.
4. Implement task creation and retrieval.
5. Implement task updates and deletion.
6. Implement dashboard statistics.
7. Test all API contracts.
8. Add Redis caching and invalidation.
9. Verify consistent behavior across multiple backend instances.
10. Integrate the React frontend with the documented API.

## 17. Conclusion

This API specification defines the proposed communication contract between the TaskFlow frontend and backend.

Before implementation, finalize the authentication model, pagination behavior, deletion policy, and Redis fallback policy. Keep the code, automated tests, and frontend expectations aligned with the final contract.
