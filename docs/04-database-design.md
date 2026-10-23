# Database Design
# TaskFlow — Database Design

## 1. Overview

TaskFlow uses **MongoDB** as its primary database and **Mongoose** as the object data modeling (ODM) library.

MongoDB stores task records and their metadata. Redis is planned as a caching layer to improve read performance and reduce repeated database queries.

This document defines the proposed data model, schema validation, indexes, relationships, and caching strategy.

## 2. Database Technology

| Component | Technology | Purpose |
|---|---|---|
| Primary database | MongoDB | Persistent task storage |
| ODM | Mongoose | Schema definition and database operations |
| Cache | Redis | Cache frequently requested task data and statistics |
| Database testing | Test database or isolated test environment | Verify data operations and validation |

## 3. Database Collections

The initial version requires one primary collection:

- `tasks` — stores task details, status, priority, and timestamps.

Additional collections may be introduced if authentication, users, teams, or collaboration features are approved.

## 4. Task Schema

### Proposed fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Automatically generated | MongoDB-generated | Unique task identifier |
| `title` | String | Yes | None | Task title |
| `description` | String | No | Empty string | Additional task details |
| `status` | String | No | `todo` | Current task status |
| `priority` | String | No | `medium` | Task priority |
| `dueDate` | Date | No | `null` | Optional task deadline |
| `createdAt` | Date | Automatically managed | Current timestamp | Record creation time |
| `updatedAt` | Date | Automatically managed | Current timestamp | Last modification time |

### Status values

The `status` field accepts only:

- `todo`
- `in-progress`
- `completed`

### Priority values

The `priority` field accepts only:

- `low`
- `medium`
- `high`

### Proposed Mongoose model

File: `backend/src/models/Task.js`

```javascript
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [1, "Task title cannot be empty"],
      maxlength: [120, "Task title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
```

**Important:** This is the proposed model code, not an implemented or tested feature yet. It assumes the initial application is single-user. If multi-user authentication is selected, the schema must be extended before implementation.

## 5. Validation Rules

Validation must be enforced by the backend. Frontend validation improves usability but must not be treated as a security boundary.

| Field | Validation |
|---|---|
| `title` | Required, trimmed, 1–120 characters |
| `description` | Optional, maximum 2,000 characters |
| `status` | Must match an allowed status |
| `priority` | Must match an allowed priority |
| `dueDate` | Optional; must be a valid date when supplied |
| `id` | Must be a valid MongoDB ObjectId before querying by ID |

Additional rules:

- Reject empty or whitespace-only titles.
- Reject invalid enum values.
- Reject malformed dates rather than silently accepting them.
- Validate update requests so invalid fields cannot bypass schema validation.
- Do not allow clients to set `createdAt` or `updatedAt` directly.
- Apply consistent error responses for validation failures.

A task may be overdue when its due date is in the past and its status is not `completed`. Overdue status can be calculated when reading tasks; it does not need to be stored as a separate database field.

## 6. Relationships and Ownership

### Initial single-user design

The initial model has no user relationship. Each task is stored as an independent document.

This keeps the first implementation simple, but it is suitable only when the application is intentionally single-user or otherwise access-controlled at the application level.

### Future multi-user design

If user accounts are required, add a field such as:

```javascript
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
}
```

The `User` model and authentication system would also need to be designed.

For a multi-user application, every task read, update, and delete must verify ownership. A valid task ID alone must never grant access to another user's task.

**Decision required before implementation:** Single-user application or multi-user application with authentication?

## 7. Indexing Strategy

MongoDB indexes can improve query performance, but each index also consumes storage and adds work to writes.

Initial recommendations:

- Use the automatically created `_id` index for task lookup by ID.
- Consider a `status` index if status filtering becomes frequent.
- Consider a `priority` index if priority filtering becomes frequent.
- If multi-user support is approved, evaluate a compound index such as `{ userId: 1, status: 1 }`.

Do not add every possible index immediately. Confirm the actual query patterns and inspect query performance before introducing additional indexes.

Search by title may use a simple case-insensitive regular expression for the initial small dataset. For larger datasets, evaluate MongoDB text search or a dedicated search strategy rather than assuming a normal index will accelerate every regular-expression query.

## 8. Query and Data Access Strategy

The backend service layer should be responsible for database operations.

Typical operations include:

- Create a task with validated input.
- Retrieve tasks with optional status, priority, and search filters.
- Retrieve one task by ID.
- Update permitted task fields.
- Delete a task by ID.
- Calculate dashboard statistics.

The service layer should return consistent results and let centralized error handling manage unexpected failures.

For update operations, enable Mongoose update validators where appropriate. Validate incoming IDs and request bodies before executing database operations.

Pagination should be introduced before task lists become large. The API specification should define the pagination format if it is included in the initial release.

## 9. Dashboard Statistics

The dashboard may display:

- Total number of tasks.
- Number of tasks in `todo`.
- Number of tasks in `in-progress`.
- Number of completed tasks.
- Completion percentage.
- Number of overdue tasks.

Proposed calculations:

- Total tasks = count of all tasks in the applicable scope.
- Completed tasks = count where `status` is `completed`.
- Completion percentage = completed tasks divided by total tasks, multiplied by 100.
- Overdue tasks = tasks with a due-date UTC calendar day earlier than the current UTC day whose status is not `completed`.

When there are no tasks, completion percentage should be `0`, not `NaN` or an error.

If authentication is added, all statistics must be calculated only from the authenticated user's tasks.

## 10. Redis Caching Strategy

Redis is planned as a performance optimization, not the primary data store.

### Cache-aside pattern

1. The backend receives a read request.
2. It checks Redis for the requested cached value.
3. If the value exists, the backend returns the cached result.
4. If the value is missing, the backend reads MongoDB.
5. The backend stores the result in Redis with a time-to-live (TTL).
6. The backend returns the result to the client.

### Proposed cache entries

| Cache entry | Purpose | Initial TTL proposal |
|---|---|---|
| Task list | Avoid repeated list queries | 60 seconds |
| Dashboard statistics | Avoid repeated aggregation or count queries | 60 seconds |
| Individual task | Optional optimization for frequent detail reads | 60 seconds |

These TTLs are starting values and should be adjusted based on observed usage and performance.

### Cache invalidation

After a successful task creation, update, or deletion:

- Invalidate the affected task detail entry.
- Invalidate task-list cache entries.
- Invalidate dashboard statistics.
- Ensure all backend instances use the same Redis service so they share cache state.

A stale cache must not override successful database writes. Cache failures should be handled according to the chosen availability policy; a temporary Redis outage should not automatically make otherwise healthy MongoDB-backed operations fail.

If multi-user support is added, cache keys must include the user's scope to prevent one user's data from being returned to another.

## 11. Data Consistency and Reliability

- MongoDB remains the source of truth.
- Write operations must succeed in MongoDB before reporting success.
- Cache invalidation should occur after successful writes.
- Redis should use TTLs to limit stale data.
- Database connection errors must be logged without exposing credentials.
- API responses must not reveal database connection strings or internal stack traces.
- Tests must verify that cache invalidation occurs after successful mutations.

For stronger consistency guarantees, consider how cache invalidation failures will be retried or reconciled. Simple deletion-based invalidation is a reasonable initial strategy.

## 12. Environment Configuration

Sensitive connection details must be stored in environment variables, not hardcoded in source code.

Example variable names:

```env
MONGODB_URI=
REDIS_URL=
```

These are placeholders. Real credentials must not be committed to Git or included in public documentation.

The backend should validate required environment variables at startup and provide clear, non-sensitive error messages when configuration is missing or invalid.

## 13. Testing Strategy

Database-related tests should verify:

- A task can be created with valid input.
- Missing or blank titles are rejected.
- Title and description length limits are enforced.
- Invalid statuses and priorities are rejected.
- Invalid task IDs are handled correctly.
- Task updates persist correctly.
- Task deletion removes the intended task.
- Dashboard statistics are correct for empty and populated datasets.
- Overdue calculations exclude completed tasks.
- Cache entries are invalidated after task mutations.
- Redis unavailability follows the documented fallback policy.
- If authentication is introduced, users cannot access or modify tasks belonging to other users.

Tests should use an isolated test database and must not delete or modify production data.

## 14. Future Database Improvements

Potential future enhancements include:

- User and profile collections.
- Task labels and categories.
- Recurring tasks.
- Task activity history.
- Comments and collaboration.
- Team and project relationships.
- Archiving instead of permanent deletion.
- Audit logs.
- Pagination and more advanced search.
- Data export and backup procedures.

These enhancements should be introduced only when the requirements justify their complexity.

## 15. Initial Design Decisions

The first release uses these decisions:

1. **Authentication:** single-user with no authentication or ownership field.
2. **Pagination:** deferred; the initial API returns the filtered task array.
3. **Task deletion:** permanent deletion.
4. **Redis behavior:** optional; MongoDB remains authoritative and handles all task reads/writes.
5. **Search:** case-insensitive title search, with status and priority filters.
6. **Deployment:** local development uses Docker Compose; Nginx and production deployment are deferred.

Due dates are calendar dates. The API accepts `YYYY-MM-DD` or an ISO timestamp, interprets the timestamp's UTC calendar day, and stores that day at UTC midnight. Overdue calculations compare the stored value with the start of the current UTC day and exclude completed tasks.

## 16. Conclusion

This design provides a straightforward MongoDB model for TaskFlow while preparing the application for Redis caching and horizontally scaled backend instances.

Database schema and tests follow these first-release decisions. The cache-key helper is reserved for a later caching phase; no cached data is currently served.

