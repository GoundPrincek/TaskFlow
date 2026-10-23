# TaskFlow Scalability and Reliability Report

**Run date:** 2026-10-23  
**Repository before work:** clean at `337298a` (`Refactor Redis connection handling and improve error management`).  
**Test target:** the existing local Docker Compose development stack. No production system was contacted.

## Findings

- The regular stack had four healthy containers: frontend, one backend, MongoDB, and Redis. API readiness reported MongoDB and Redis connected.
- MongoDB and Redis responded to read-only health checks. Redis returned `PONG`. The live task collection exposed only MongoDB's default `_id_` index.
- Task routes read and write MongoDB. Redis is connected and reported but is not used for task caching.
- The task list is unpaginated, list results are sorted by `createdAt` and `_id`, and dashboard statistics aggregate the collection. There are no additional indexes for the list filters or sort.
- The backend has no task records in process memory, local file writes, or scheduled jobs. The optional scale configuration therefore shares MongoDB between replicas. Its Nginx routing and replica behavior could not be exercised because Docker could not resolve Docker Hub.
- The default per-process rate limit is 100 requests per 15 minutes. That limit can shape higher k6 profiles before they measure backend capacity.

## Results

| Check | Result |
|---|---|
| Baseline backend tests | 7 passed. The first sandbox attempt had 3 loopback `EACCES` failures; rerunning with the needed socket access passed all tests. |
| Baseline frontend tests | 24 passed. |
| Baseline frontend production build | Passed. |
| Final backend tests | 13 passed, 0 failed. |
| Final frontend tests | 24 passed, 0 failed. |
| Final frontend production build | Passed. Vite produced a 305.77 kB JavaScript bundle (93.99 kB gzip) and 27.48 kB CSS (6.36 kB gzip). |
| Default and optional scaling Compose config | Both `docker compose ... config --quiet` checks passed. |
| PowerShell scaling verification script syntax | Parsed successfully. |
| Manual API endpoint sanity sweep | 20 sequential GETs across liveness, readiness, tasks, and stats; 20 HTTP 200, 0 failed checks. Client-side p50 4.40 ms, p90 7.46 ms, p95 9.32 ms; elapsed 0.247 s, or 80.815 sequential requests/s. This is not a concurrency or k6 load test and is not a capacity claim. |
| k6 smoke | Attempted, but no request was sent. k6 is not installed locally and Docker could not download `grafana/k6:latest` because it could not resolve `production.cloudfront.docker.com`. |
| Bounded k6 load test | Not run because the k6 image could not be obtained. |
| Nginx scaling image | Pull attempted, but Docker could not resolve `auth.docker.io`; the two-replica project and Nginx tests were not started. |
| Failure/recovery and MongoDB restart persistence | Not run. The isolated scale environment could not be started; the active development services were left running. |
| GitHub Actions | Workflow edited to validate both Compose files. It was not run on GitHub. |

The initial one-time `docker compose stats --no-stream` snapshot (before any load test) reported frontend 120.6 MiB, backend 64.94 MiB, Redis 4.93 MiB, and MongoDB 178.5 MiB. CPU percentages in that snapshot were frontend 1.58%, backend 15.23%, Redis 0.92%, and MongoDB 0.49%. This was a point-in-time sample, not a controlled idle or load measurement; it does not identify a bottleneck.

## Safety and limitations

- No task records were created, updated, or deleted during the executed checks.
- No container was stopped, restarted, rebuilt, or recreated. No Docker volume was removed.
- The 20-request sweep was read-only and below the configured rate limit. It does not replace the required k6 profiles.
- The scaling configuration and `tests/scaling/verify-horizontal-scaling.ps1` are prepared but remain unverified at runtime. Do not describe multi-instance distribution or failover as passed until that script and the isolated failure checks complete.
- The local performance sample reflects a small dataset and one developer machine. It does not predict production capacity.

## Next steps

1. Install k6 locally or restore Docker Desktop's DNS/proxy access, then run the smoke and bounded load commands in [Performance Testing](performance-testing.md).
2. Restore Docker Hub access, start the isolated project in [Horizontal Scaling](horizontal-scaling.md), and verify instance distribution, cross-instance MongoDB visibility, and one-replica failure.
3. Run isolated MongoDB and Redis loss/recovery checks and verify persistent data across an ordinary restart of the isolated MongoDB container.
4. Use representative task volumes and MongoDB query plans before adding indexes or pagination; compare repeated baselines before making performance claims.
