# Test Plan


# TaskFlow — Test Plan

## 1. Overview

This document defines the testing strategy for TaskFlow, a full-stack task management application built with React, Tailwind CSS, Node.js, Express.js, MongoDB, Redis, Docker, Nginx, and GitHub Actions.

Testing will be performed throughout development rather than only at the end. Each major feature must be validated before dependent features are introduced.

The test plan covers functional correctness, input validation, API behavior, database persistence, frontend usability, caching, containerization, load balancing, and continuous integration.

## 2. Testing Objectives

The objectives are to:

- Verify that all required features work as specified.
- Identify defects early in development.
- Confirm that invalid inputs are handled safely.
- Verify persistence and consistency of task data.
- Confirm that frontend and backend integration works correctly.
- Prevent stale Redis data after task mutations.
- Verify that the application runs in the documented Docker environment.
- Confirm that Nginx routes requests to the configured backend instances.
- Automate repeatable checks through GitHub Actions.
- Maintain a reliable, maintainable, and portfolio-ready codebase.

## 3. Scope of Testing

### In scope

- Task creation, retrieval, updating, and deletion.
- Task status and priority validation.
- Search and filtering.
- Deadline and overdue calculations.
- Dashboard statistics.
- API error handling.
- MongoDB persistence.
- Redis caching and invalidation.
- Frontend loading, empty, success, and error states.
- Responsive layout and accessibility.
- Docker and Docker Compose.
- Nginx routing and backend instance availability.
- Automated testing and CI workflows.
- Authentication and authorization tests if multi-user support is approved.

### Out of scope for the initial release

Unless separately approved, the initial test scope excludes:

- Large-scale distributed load testing.
- Formal third-party penetration testing.
- Multi-region deployment.
- Production disaster-recovery certification.
- Advanced team collaboration.
- Features that have not been included in the approved requirements.

## 4. Testing Levels

### 4.1 Unit testing

Tests individual functions and components in isolation.

Examples:

- Task validation rules.
- Overdue calculations.
- Completion percentage calculations.
- Service-layer business logic.
- React component rendering.
- Form validation behavior.

### 4.2 Integration testing

Tests how components work together.

Examples:

- Express routes and controllers.
- Controllers and services.
- Services and MongoDB.
- Redis and cache invalidation.
- Frontend API service and backend endpoints.

### 4.3 End-to-end testing

Tests complete user workflows from the browser perspective.

Examples:

- Create a task and confirm it appears in the task list.
- Update a task and verify the new status.
- Filter tasks and clear the filters.
- Delete a task after confirmation.
- Refresh the browser and verify persisted data.

### 4.4 Infrastructure testing

Tests the deployment and runtime environment.

Examples:

- Docker images build successfully.
- Docker Compose starts the required services.
- MongoDB data persists as configured.
- Nginx routes requests to multiple backend instances.
- A backend instance failure does not prevent all requests from succeeding when another healthy instance remains.
- GitHub Actions reports test and build failures correctly.

### 4.5 Manual testing

Manual checks supplement automated tests for:

- Visual consistency.
- Responsive layout.
- Keyboard navigation.
- Accessibility.
- Browser behavior.
- Error messages and recovery flows.

## 5. Proposed Testing Tools

The exact tooling should be selected during project setup and recorded in the README.

| Area | Proposed tool | Purpose |
|---|---|---|
| Backend unit tests | Node.js test runner or Jest | Test backend logic |
| API integration tests | Supertest with the selected test runner | Test HTTP endpoints |
| Database testing | Isolated MongoDB test database | Verify persistence and queries |
| Frontend component tests | Vitest and React Testing Library | Test React behavior |
| Browser automation | Playwright | Test complete user workflows |
| HTTP inspection | Browser DevTools or an HTTP client | Debug API requests |
| Infrastructure | Docker Compose and Nginx logs | Verify service behavior |
| Continuous integration | GitHub Actions | Automate repeatable checks |

Do not install all testing libraries automatically. Choose compatible tools that meet the requirements and avoid unnecessary duplication.

## 6. Test Environment

### Development environment

- Local React development server.
- Local Express API server.
- Development MongoDB database.
- Redis service when caching is being tested.

### Automated test environment

- Dedicated test configuration.
- Isolated test database or disposable database instance.
- Redis test instance or a suitable test double.
- Deterministic test data.
- Environment variables provided through the test runner or CI configuration.

### Infrastructure test environment

- Docker and Docker Compose.
- Nginx.
- At least two backend instances for load-balancing tests.
- Shared MongoDB and Redis services as required by the architecture.

**Important:** Automated tests must never delete or overwrite production data. Test configuration should fail safely if it points to a production database.

## 7. Functional Test Cases

| ID | Test scenario | Expected result |
|---|---|---|
| TC-01 | Create a task with valid required fields | Task is created successfully |
| TC-02 | Create a task with a missing title | Request is rejected with a validation error |
| TC-03 | Create a task with a whitespace-only title | Request is rejected |
| TC-04 | Submit a title exceeding 120 characters | Request is rejected |
| TC-05 | Submit a description exceeding 2,000 characters | Request is rejected |
| TC-06 | Submit an unsupported status | Request is rejected |
| TC-07 | Submit an unsupported priority | Request is rejected |
| TC-08 | Retrieve the task list | A task array is returned |
| TC-09 | Retrieve tasks when no tasks exist | An empty array is returned |
| TC-10 | Retrieve an existing task by ID | The correct task is returned |
| TC-11 | Retrieve a task using a malformed ID | A validation error is returned |
| TC-12 | Retrieve a task that does not exist | A not-found response is returned |
| TC-13 | Update a task's status | The new status is persisted |
| TC-14 | Update one field while omitting others | Unspecified fields remain unchanged |
| TC-15 | Submit an invalid update | The update is rejected |
| TC-16 | Delete an existing task | The task is deleted according to the agreed policy |
| TC-17 | Delete a nonexistent task | A not-found response is returned |
| TC-18 | Filter by status | Only matching tasks are returned |
| TC-19 | Filter by priority | Only matching tasks are returned |
| TC-20 | Search for a task title | Matching tasks are returned |
| TC-21 | Search for a nonexistent title | An empty result is returned |
| TC-22 | Request dashboard statistics | Correct counts and percentage are returned |
| TC-23 | Calculate statistics with no tasks | Counts and percentage are zero |
| TC-24 | Calculate overdue tasks | Past-due incomplete tasks are counted |
| TC-25 | Check an overdue completed task | It is not counted as overdue |
| TC-26 | Send a request to an unknown API route | A consistent not-found error is returned |
| TC-27 | Trigger an unexpected server error | A safe error response is returned |
| TC-28 | Submit repeated requests beyond the configured rate limit | Rate limiting is applied according to configuration |

The test suite must verify both successful operations and relevant failure cases.

## 8. Database Test Cases

| ID | Test scenario | Expected result |
|---|---|---|
| DB-01 | Create a valid task | Task is stored in MongoDB |
| DB-02 | Update a task | Changes persist in MongoDB |
| DB-03 | Delete a task | Task is removed or archived according to the selected policy |
| DB-04 | Restart the backend | Existing tasks remain available |
| DB-05 | Supply invalid schema values | Invalid data is rejected |
| DB-06 | Connect with invalid database configuration | Startup or readiness fails safely |
| DB-07 | Disconnect MongoDB during a request | The API returns a controlled error |
| DB-08 | Run tests against an empty database | Tests execute without relying on existing records |

Indexes should be checked against actual query requirements. Tests should verify query correctness rather than assume that an index automatically improves performance.

## 9. API Contract Tests

Verify that every documented endpoint follows `docs/05-api-specification.md`.

Tests should confirm:

- Correct HTTP methods and paths.
- Correct success status codes.
- Consistent JSON response structure.
- Required fields are present.
- Error responses use the agreed format.
- Unsupported fields and query parameters are handled according to the specification.
- Invalid IDs do not trigger unhandled exceptions.
- Empty results are represented consistently.
- Dates use the documented format.
- Pagination metadata is returned if pagination is enabled.

The implementation and API documentation must remain aligned as the project evolves.

## 10. Frontend Test Cases

| ID | Test scenario | Expected result |
|---|---|---|
| UI-01 | Open the dashboard | Dashboard content is displayed |
| UI-02 | Load dashboard statistics | Correct values are displayed |
| UI-03 | Open the task list | Tasks are rendered correctly |
| UI-04 | Create a valid task | The task appears after success |
| UI-05 | Submit an invalid task form | Field-level errors are displayed |
| UI-06 | Edit a task | Updated values are displayed |
| UI-07 | Click Delete | Confirmation is shown if required by the design |
| UI-08 | Cancel deletion | The task remains unchanged |
| UI-09 | Confirm deletion | The task disappears after successful deletion |
| UI-10 | Search for a task | Results reflect the search |
| UI-11 | Apply filters | Only matching tasks are displayed |
| UI-12 | Clear filters | The unfiltered list is restored |
| UI-13 | Load data from a slow API | A loading state is shown |
| UI-14 | Make the API unavailable | A useful error state is shown |
| UI-15 | Load an empty task list | A helpful empty state is displayed |
| UI-16 | Resize to mobile width | Layout adapts without normal-content overflow |
| UI-17 | Navigate using a keyboard | Controls remain accessible |
| UI-18 | Submit a form repeatedly | Duplicate submissions are prevented where applicable |

Tests should check visible behavior and user outcomes rather than relying only on internal component implementation details.

## 11. End-to-End Test Scenarios

### Scenario 1: Complete task lifecycle

1. Open the application.
2. Create a task.
3. Verify it appears in the task list.
4. Edit the title or description.
5. Change its status to `in-progress`.
6. Verify the changes.
7. Mark the task as completed.
8. Verify the dashboard statistics.
9. Delete the task if the test requires cleanup.
10. Verify the final state.

**Expected result:** All operations complete successfully and persisted data matches the UI.

### Scenario 2: Search and filtering

1. Create tasks with different statuses and priorities.
2. Filter by status.
3. Filter by priority.
4. Search for a known title.
5. Clear the filters.
6. Verify the complete expected list.

**Expected result:** Search and filters return the correct tasks and can be reset.

### Scenario 3: Error recovery

1. Make the backend unavailable in the test environment.
2. Open or refresh the task list.
3. Verify that the application displays a useful error state.
4. Restore the backend.
5. Retry the request.
6. Verify that data loads successfully.

**Expected result:** The application recovers without requiring a complete restart of the frontend.

## 12. Redis Cache Tests

| ID | Test scenario | Expected result |
|---|---|---|
| RC-01 | Request an uncached task list | MongoDB is queried and eligible data is cached |
| RC-02 | Repeat the same request before expiry | Cached data is returned |
| RC-03 | Create a task after caching the list | Stale list data is invalidated |
| RC-04 | Update a task after caching statistics | Statistics cache is invalidated |
| RC-05 | Delete a task after caching the list | List and statistics reflect the deletion |
| RC-06 | Allow a cache entry to expire | A later request refreshes the entry |
| RC-07 | Make Redis unavailable | Behavior matches the documented fallback policy |
| RC-08 | Restart one backend instance | Other instances continue using the shared cache service |
| RC-09 | Use multiple users if authentication is enabled | Cache keys do not leak data between users |

The tests should verify observable correctness and, where practical, confirm cache behavior through controlled test instrumentation.

A cache hit alone is not proof of correctness. Tests must also verify that successful writes do not leave stale results.

## 13. Docker and Infrastructure Tests

| ID | Test scenario | Expected result |
|---|---|---|
| INF-01 | Build frontend and backend images | Images build successfully |
| INF-02 | Start the Compose environment | Required services start according to configuration |
| INF-03 | Check backend health | The health endpoint responds correctly |
| INF-04 | Restart the backend container | The service recovers as configured |
| INF-05 | Restart MongoDB with a persistent volume | Persisted test data remains available |
| INF-06 | Send API requests through Nginx | Requests reach the configured backend |
| INF-07 | Run two backend instances | Both instances can serve requests |
| INF-08 | Stop one backend instance | Requests continue through a healthy remaining instance when configured to do so |
| INF-09 | Make Redis unavailable | The documented Redis failure policy is followed |
| INF-10 | Check container configuration | Secrets are not embedded in images or committed files |

Infrastructure behavior should be verified using health checks, logs, controlled failures, and repeatable requests.

## 14. GitHub Actions CI Tests

The CI workflow should verify the code whenever the configured push or pull-request events occur.

### Required checks

1. Dependency installation from lockfiles.
2. Backend tests.
3. Frontend tests.
4. Frontend production build.
5. Linting, if configured.
6. Additional integration tests when the required test services are available.

### CI acceptance criteria

- The workflow starts for the configured events.
- A passing code change produces a successful result.
- A failing test causes the workflow to fail.
- A failed frontend build causes the workflow to fail.
- Required test services use isolated configuration.
- Production credentials are not required for ordinary test runs.

Docker image builds can be added after basic CI is stable.

## 15. Security and Authorization Tests

Security tests should include:

- Invalid request bodies are rejected.
- Unexpected fields cannot modify protected properties.
- Secrets are not returned in API responses.
- Error responses do not expose stack traces in production.
- Rate limiting works as configured.
- CORS allows only intended origins.
- Request-size limits are enforced.
- Database queries cannot be controlled through arbitrary client-supplied query objects.

If multi-user authentication is implemented, also verify:

- Unauthenticated requests cannot access protected endpoints.
- Users cannot read other users' tasks.
- Users cannot update or delete tasks they do not own.
- Dashboard statistics are scoped to the authenticated user.
- Redis keys are scoped correctly.
- Session or token validation follows the approved authentication design.

## 16. Performance Testing

Performance testing should begin after the core API is correct.

### Initial measurements

Measure:

- Task-list response time.
- Dashboard-statistics response time.
- Task creation and update response times.
- Behavior with a larger task dataset.
- Cache hit and miss response times.
- Performance with one versus multiple backend instances.

Record the test environment, dataset size, request volume, and observed results.

### Performance acceptance

Do not claim a performance improvement based only on adding Redis or multiple backend instances. Compare repeatable measurements before and after the change.

Specific response-time targets should be established after the initial baseline is measured.

## 17. Test Data and Cleanup

- Use deterministic test records.
- Use a separate test database.
- Clean up only records created by the current test.
- Avoid tests that depend on execution order.
- Avoid fixed IDs that may collide with other test runs.
- Control time-dependent tests, especially overdue calculations.
- Do not use real user information or production credentials.
- Ensure concurrent test runs do not interfere with each other.

## 18. Bug Reporting and Regression Testing

When a defect is discovered:

1. Record the steps needed to reproduce it.
2. Record the expected and actual behavior.
3. Capture relevant safe logs or error messages.
4. Identify the affected component.
5. Fix the root cause.
6. Add a regression test where practical.
7. Rerun the relevant test suite.
8. Verify that related features still work.

A bug should not be considered resolved merely because the error message disappears. The underlying behavior must be verified.

## 19. Entry and Exit Criteria

### Entry criteria

Testing can begin when:

- The feature requirements are understood.
- The required code is available.
- The test environment is configured.
- Test data is prepared.
- Relevant dependencies are available.

### Exit criteria

A feature or phase is ready to proceed when:

- All required tests for that phase pass.
- No known critical defects remain unresolved.
- Relevant error paths have been checked.
- Integration behavior is verified.
- Documentation is updated.
- Any deferred defects or limitations are recorded.

## 20. Test Execution Checklist

Use this checklist during development:

- [ ] Backend unit tests pass.
- [ ] API integration tests pass.
- [ ] Frontend component tests pass.
- [ ] Core end-to-end workflows pass.
- [ ] Validation and error cases pass.
- [ ] Database persistence is verified.
- [ ] Dashboard statistics are correct.
- [ ] Redis invalidation and fallback are verified.
- [ ] Docker build and startup succeed.
- [ ] Nginx routes requests to the configured backend pool.
- [ ] Backend instance failure behavior is verified.
- [ ] GitHub Actions CI passes.
- [ ] Responsive layout and keyboard accessibility are checked.
- [ ] Security and configuration checks are complete.
- [ ] Known limitations are documented.

Only mark a checkbox complete after performing and verifying the corresponding test.

## 21. Conclusion

This test plan establishes a repeatable approach to verifying TaskFlow from individual functions through the complete application and infrastructure.

Testing will proceed alongside implementation, with particular attention to input validation, data persistence, cache invalidation, failure recovery, and multi-instance behavior.

The project is ready for final verification when the agreed acceptance criteria are satisfied and the test results are documented.

### Current automated coverage (2026-10-23)

Backend tests use Node's built-in test runner and Supertest with injected task services, so route validation and response behavior do not require a live database. Frontend component, utility, and API-client tests run with Vitest. Compose startup, persistent database behavior, responsive browser layout, Redis caching, and Nginx behavior remain separate verification work and must not be marked complete without running those checks.

