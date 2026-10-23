# TaskFlow Performance and Reliability Testing

This guide uses k6 against TaskFlow's real API. The supplied workload is read-only: it requests liveness, readiness, task-list, and dashboard-statistics endpoints. It does not create, update, or delete tasks and does not clear data.

## Baseline audit

The audit on 2026-10-23 found:

- `GET /api/health/live` is process liveness and does not require MongoDB.
- `GET /api/health/ready` is ready when MongoDB is connected; Redis is reported but is optional.
- `GET /api/tasks` returns every matching task. Pagination is not implemented.
- `GET /api/tasks/stats` runs an aggregation over the task collection.
- The live `tasks` collection had only MongoDB's default `_id` index when inspected. The list sort and filters do not have additional indexes.
- Task reads and writes use MongoDB directly. Redis is connected by the server but is not used by the task service for caching.
- The existing rate limiter allows 100 requests per 15-minute window per backend process by default. A larger load run can therefore measure rate limiting (HTTP 429), rather than backend capacity.

These are observations about this checkout and local database at the time of the audit. They are not production-capacity claims.

## Prerequisites

- Start the regular stack only if it is not already running: `docker compose up -d --build`.
- Check it with `docker compose ps` and verify `http://localhost:5000/api/health/ready` returns HTTP 200.
- Docker Desktop and Compose are required for the containerized k6 commands. A local k6 installation can run the same script.
- The tests use the existing API and database but do not modify task records.

Do not restart or rebuild a running development stack just to run these read-only checks.

## k6 profiles

The reusable script is `tests/performance/taskflow.js`. Select a profile with `TEST_PROFILE`:

| Profile | Default workload | Use |
|---|---:|---|
| `smoke` | 1 VU for 10 seconds | Verify routes, response envelopes, and test connectivity. |
| `baseline` | 1 VU for 30 seconds | Record a low-traffic reference. |
| `load` | Ramps through 1 and 5 VUs by default | Controlled ramp. Set `MAX_VUS` to a value up to 50 to add higher stages. |
| `stress` | Ramps through 1, 5, 10, 25, and up to `MAX_VUS` (default 25) | Opt-in, bounded stress profile. Use an isolated stack and adjust rate limiting there if needed. |
| `spike` | 1 VU to `MAX_VUS` (default 25), then back to 1 | Short burst test. |
| `soak` | Up to 5 VUs for 30 minutes | Optional endurance test; set a shorter `DURATION` for a first trial. |

Every iteration makes one GET request, rotating among the four listed endpoints, then sleeps for two seconds by default. `MAX_VUS` is hard-capped at 50; `DURATION`, `STEP_DURATION`, `SLEEP_SECONDS`, and timeout settings can be changed. Higher concurrency and longer runs are opt-in. A rate limit response is a test finding; do not raise the limit on the normal development stack to force a result.

Thresholds are initial local guardrails, not service guarantees: request failures below 1%, check success above 99%, p50 below 1,000 ms, p90 below 2,000 ms, p95 below 3,000 ms, and throughput above 0.1 requests/second. Tune them after collecting repeatable baselines on the same machine and dataset. Override with `MAX_ERROR_RATE`, `MIN_CHECK_RATE`, `P50_LIMIT_MS`, `P90_LIMIT_MS`, `P95_LIMIT_MS`, and `MIN_REQUEST_RATE`.

The summary reports total requests, requests per second, status-code counts, check rate, failed-request rate, p50/p90/p95 latency, and threshold outcomes. k6 also prints its regular metric summary. Set `RESULTS_FILE` to a path inside a mounted directory to save a JSON report.

## Run with Docker Desktop on Windows PowerShell

This route starts a disposable k6 runner on the already-running Compose network and addresses the backend by service name. It does not start, stop, or recreate TaskFlow services.

```powershell
$scripts = (Resolve-Path .\tests\performance).Path
docker run --rm --network taskflow_default --mount "type=bind,source=$scripts,target=/scripts,readonly" -e TASKFLOW_BASE_URL=http://backend:5000/api -e TEST_PROFILE=smoke grafana/k6:latest run /scripts/taskflow.js
```

Run a bounded load profile (five VUs maximum by default):

```powershell
docker run --rm --network taskflow_default --mount "type=bind,source=$scripts,target=/scripts,readonly" -e TASKFLOW_BASE_URL=http://backend:5000/api -e TEST_PROFILE=load -e MAX_VUS=5 -e STEP_DURATION=10s grafana/k6:latest run /scripts/taskflow.js
```

Run a higher level only against a separate test stack and expect to configure a higher rate-limit allowance there:

```powershell
docker run --rm --network taskflow-scale_default --mount "type=bind,source=$scripts,target=/scripts,readonly" -e TASKFLOW_BASE_URL=http://load-balancer:8080/api -e TEST_PROFILE=stress -e MAX_VUS=25 -e STEP_DURATION=10s grafana/k6:latest run /scripts/taskflow.js
```

If using an installed k6 executable instead, use `k6 run --env TASKFLOW_BASE_URL=http://localhost:5000/api --env TEST_PROFILE=smoke tests/performance/taskflow.js`. In Command Prompt, replace the PowerShell mount variable with `--mount "type=bind,source=%cd%\tests\performance,target=/scripts,readonly"`; in Git Bash, use `--mount "type=bind,source=$(pwd)/tests/performance,target=/scripts,readonly"`.

To save JSON output in PowerShell, make a local results directory and add a second mount such as `--mount "type=bind,source=$((New-Item -ItemType Directory -Force .\tests\performance\results).FullName),target=/results" -e RESULTS_FILE=/results/smoke.json`. Result files are local test artifacts; inspect them before sharing.

## MongoDB, Redis, and reliability checks

Read-only checks against the regular stack:

```powershell
docker compose exec -T mongodb mongosh taskflow --quiet --eval 'db.adminCommand({ping:1}).ok; JSON.stringify(db.tasks.getIndexes().map(i => ({name:i.name, key:i.key})))'
docker compose exec -T redis redis-cli PING
docker compose logs --tail 50 backend mongodb redis
docker compose stats --no-stream
```

The first command reports MongoDB reachability and index names/keys only; it does not print task records. The Redis command should return `PONG`. These checks do not simulate an outage. Restart, persistence, MongoDB-loss, and Redis-loss checks should be run only in the isolated scaling project described in [Horizontal Scaling](horizontal-scaling.md).

## Metrics and troubleshooting

- `http_req_duration` is end-to-end request latency. Compare p50 (typical), p90, and p95; a rising p95 can indicate a small set of slow requests even when the median looks healthy.
- `http_reqs` gives total requests and request rate. Compare rates only when the endpoint mix, VUs, sleep, duration, machine, and data are comparable.
- `http_req_failed` is the failed-request ratio. `taskflow_status_*` counts help distinguish HTTP 429 rate limiting from 5xx service errors.
- `checks` measures whether each HTTP response and JSON envelope met the script's assertions.
- `docker compose stats --no-stream` is a point-in-time CPU and memory sample, not a time-series profile. Capture it before and during a test for context.

If tests report 429, check the effective per-process limit before interpreting latency as capacity. If the script cannot connect, verify `docker compose ps`, the selected Docker network, and `TASKFLOW_BASE_URL`. If thresholds fail, first compare the detailed status distribution and latency summary; do not raise limits or increase traffic on the default stack to hide a failure.

## Cleanup

The k6 container uses `--rm` and the profile only issues GET requests. No application data cleanup is needed. Do not run `docker compose down -v` against the normal project. For the isolated scaling project, `docker compose down` removes its containers and network but keeps its dedicated MongoDB volume.
