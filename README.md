# TaskFlow — Smart Task Management System

TaskFlow is a single-user task management app with a React dashboard and a MongoDB-backed Express API. The repository includes a mock-data mode for frontend-only work and a Docker Compose development environment for the full stack.

## Requirements

- Node.js 22 or newer and npm.
- Docker Desktop with Docker Compose for the full local stack.
- No MongoDB or Redis host ports are published by Compose.

## Start the full stack with Docker Compose

From the repository root, optionally copy `.env.example` to `.env` to customize the frontend/API host ports and database name, then run:

```powershell
docker compose up --build
```

Open `http://localhost:5173`. The frontend uses API mode and calls `/api`; Vite forwards those requests to the backend inside the Compose network. The default API address in the browser never contains the Docker-only `backend` hostname. MongoDB data persists in the named `mongodb_data` volume. Redis starts and has a health check, but task reads and writes do not use a cache.

Stop the services with `Ctrl+C`, or from another repository-root terminal run:

```powershell
docker compose down
```

This leaves the MongoDB volume intact. Do not add `-v` if you want to keep local data.

## Run services directly with Node.js

Install each app's dependencies from the root:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
```

For the frontend in mock mode, run `npm run dev:frontend`. Mock tasks are held in memory and reset after a page refresh.

For the API, make MongoDB available on localhost, copy `backend/.env.example` to `backend/.env`, and start `npm run dev:backend`. Redis is optional. To connect the frontend to the local API, create `frontend/.env` from `frontend/.env.example` and set `VITE_TASKFLOW_DATA_MODE=api`; the Vite proxy sends `/api` to `http://localhost:5000`. Stop each native service with `Ctrl+C` in its terminal.

## API

The base path is `/api`. Main endpoints are:

- `GET /api/health`, `/api/health/live`, and `/api/health/ready`
- `GET /api/tasks` with optional `status`, `priority`, and title `search` filters
- `GET /api/tasks/stats`
- `POST /api/tasks` and `GET /api/tasks/:id`
- `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`

Successful responses use `{ success, message, data }`; errors use `{ success: false, message, errors? }`. Pagination is not enabled, and unsupported query parameters are rejected. Deletion is permanent. The app has no authentication or multi-user ownership; treat it as a trusted single-user development app.

Due dates represent calendar days. The API accepts `YYYY-MM-DD` or an ISO timestamp, interprets timestamps by their UTC calendar day, and stores the day at UTC midnight. A task is overdue when its due-date day is before the current UTC day and it is not completed.

## Checks

Run from the repository root:

```powershell
npm test
npm run build
```

`npm test` runs the backend Node test suite and frontend Vitest suite. Backend route tests inject an isolated service and do not require MongoDB. `npm run build` creates the frontend production bundle under `frontend/dist`.

Check Compose configuration without starting containers using `docker compose config`.

## Performance and horizontal scaling

The default stack runs one backend. Redis is health-checked but is not used for task caching. The task list is unpaginated, so use the bounded, read-only tests in [Performance Testing](docs/performance-testing.md) when measuring this development setup.

With Docker Desktop and the existing stack running, run the low-traffic k6 smoke profile from PowerShell:

```powershell
$scripts = (Resolve-Path .\tests\performance).Path
docker run --rm --network taskflow_default --mount "type=bind,source=$scripts,target=/scripts,readonly" -e TASKFLOW_BASE_URL=http://backend:5000/api -e TEST_PROFILE=smoke grafana/k6:latest run /scripts/taskflow.js
```

Run a bounded load profile (5 VUs maximum by default):

```powershell
docker run --rm --network taskflow_default --mount "type=bind,source=$scripts,target=/scripts,readonly" -e TASKFLOW_BASE_URL=http://backend:5000/api -e TEST_PROFILE=load -e MAX_VUS=5 -e STEP_DURATION=10s grafana/k6:latest run /scripts/taskflow.js
```

The optional horizontal-scaling setup uses a separate Compose project and MongoDB volume, leaving the default development project separate:

```powershell
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml up -d --build --scale backend=2 mongodb redis backend load-balancer
.\tests\scaling\verify-horizontal-scaling.ps1
```

See [Horizontal Scaling](docs/horizontal-scaling.md) for safe failure checks and stop instructions. Do not use `down -v` if you need to preserve database data.

**Verification status (2026-10-23):** 13 backend tests and 24 frontend tests passed; the frontend production build and both Compose configuration checks passed. Docker Hub DNS prevented downloading k6 and Nginx, so k6 load results and runtime scaling verification are still pending. The detailed findings and actual read-only API sample are in the [performance report](docs/performance-report.md).

## Implemented and deferred

- Implemented: responsive React UI, mock and API modes, task CRUD, validation, title search and filters, dashboard statistics, MongoDB persistence, backend health/readiness, Compose development services, persistent MongoDB volume, and GitHub Actions checks.
- Redis is included as an optional service and reported in health output; Redis caching and invalidation are deferred.
- The default Compose stack uses Vite as its proxy and one backend. An optional isolated Nginx scaling project is documented for local experiments; multi-instance behavior has not yet been verified in this environment. Production deployment, authentication, pagination, and end-to-end browser testing remain future work.

The design documents in `docs/` describe the requirements, architecture, data model, API, UI, implementation plan, testing, performance, and horizontal scaling.
