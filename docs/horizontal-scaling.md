# Optional Horizontal Scaling

The default development stack runs one backend and publishes port 5000 directly. It is not load balanced. The optional `docker-compose.scaling.yml` override removes that published backend port and puts an Nginx proxy in front of one or more backend replicas.

## Safety and backend state

The inspected API keeps task records in MongoDB. It has no task data in process memory, local file writes, or scheduled task jobs. Each process has its own Mongoose connection and an optional Redis connection. The task routes do not use Redis; no shared in-memory session state is required. Therefore, the current API can serve multiple instances for this single-user product, with the shared MongoDB service remaining the source of truth.

Each backend process still has its own in-memory rate-limit counter. With more instances, that limit is per instance rather than global. The default scaled test allowance remains 100 requests per 15 minutes per instance. Do not treat scaling as a way to bypass rate limits; a production deployment should choose an intentional shared limiter policy if the limit is security-critical.

## Start a separate test project

The following commands use a distinct Compose project name (`taskflow-scale`) and therefore a distinct network and MongoDB named volume. They do not recreate, stop, or reuse the normal `taskflow` services or database. The proxy binds only to localhost on port 8081.

```powershell
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml up -d --build --scale backend=2 mongodb redis backend load-balancer
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml ps
```

The Compose merge uses `!reset []` to remove the fixed host port from backend replicas. Each replica reaches the same project-local MongoDB and Redis by Compose service name. The load balancer resolves the backend service through Docker's embedded DNS and refreshes the answer. Compose service discovery provides stable service names for containers; Nginx's open-source upstream `resolve` support is available from version 1.27.3. This config pins Nginx 1.30.6 and uses round-robin distribution with failure retries. [Docker Compose networking docs](https://docs.docker.com/compose/how-tos/networking/) · [Nginx upstream module docs](https://nginx.org/en/docs/http/ngx_http_upstream_module.html).

Check API readiness through the proxy:

```powershell
Invoke-RestMethod http://localhost:8081/api/health/ready
```

The optional `X-TaskFlow-Instance` response header is enabled only in this scaling config. Sample repeated requests to verify that more than one replica serves traffic:

```powershell
1..12 | ForEach-Object { (Invoke-WebRequest -UseBasicParsing http://localhost:8081/api/health/live).Headers['X-TaskFlow-Instance'] }
```

Seeing two distinct instance IDs confirms requests reached both backends. Merely seeing two running containers does not confirm load balancing.

## Verify shared MongoDB data across instances

Run `.\tests\scaling\verify-horizontal-scaling.ps1` to sample 20 requests, assert that at least two backend IDs served traffic, create an isolated unique probe task, read it through a different backend, and delete only that probe in a `finally` block. The script fails if it cannot prove distribution or shared MongoDB visibility.

For a manual one-off probe, use an isolated, uniquely named task and delete only that probe:

```powershell
$title = "scaling-probe-$([guid]::NewGuid())"
$createResponse = Invoke-WebRequest -UseBasicParsing -Method Post -Uri http://localhost:8081/api/tasks -ContentType 'application/json' -Body (@{ title = $title } | ConvertTo-Json)
$created = $createResponse.Content | ConvertFrom-Json
$createdOn = $createResponse.Headers['X-TaskFlow-Instance']
$read = Invoke-WebRequest -UseBasicParsing "http://localhost:8081/api/tasks/$($created.data._id)"
$readOn = $read.Headers['X-TaskFlow-Instance']
if ($createdOn -eq $readOn) { throw 'Repeat the read until the proxy reports a different backend instance.' }
if (($read.Content | ConvertFrom-Json).data.title -ne $title) { throw 'The task was not visible through the second backend.' }
Invoke-RestMethod -Method Delete -Uri "http://localhost:8081/api/tasks/$($created.data._id)"
```

If the read is routed back to the same replica, repeat the read until the instance header differs. The shared test database is separate from the regular development project.

## Bounded failure checks

To check a single backend failure, first verify there are two healthy backend containers. Stop one container in this isolated project, make several readiness requests through port 8081, then restart that same container:

```powershell
docker stop taskflow-scale-backend-2
Invoke-RestMethod http://localhost:8081/api/health/ready
docker start taskflow-scale-backend-2
```

For an optional Redis outage check, stop and restart `taskflow-scale-redis-1` only in this isolated project. Task API readiness should continue to depend on MongoDB, while the health response reports Redis state. For a MongoDB loss/recovery check, stop and start only `taskflow-scale-mongodb-1`, poll `/api/health/ready`, and confirm that the API recovers when MongoDB is healthy again. These commands interrupt only the separate disposable test services and should never be run against the regular project or production.

## Monitor and stop the isolated project

```powershell
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml stats --no-stream
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml logs --tail 50 backend load-balancer mongodb redis
docker compose -p taskflow-scale -f docker-compose.yml -f docker-compose.scaling.yml down
```

`down` removes this project's containers and network while preserving the dedicated `taskflow-scale_mongodb_data` volume. No volume-removal command is part of this guide.

## Known limits

- This is a local development demonstration, not a production deployment recipe. The backend image still runs the development command and bind mounts source code.
- A single MongoDB container and local Docker resources remain shared bottlenecks.
- The unpaginated task list and collection-wide statistics aggregation can become expensive as data grows. Search uses a case-insensitive regular expression and has no text-search index.
- The Compose stack does not configure MongoDB replication, backups, TLS, secrets management, or a globally shared rate limiter.
- Add indexes, pagination, query-plan measurements, and production deployment settings only after requirements and representative data justify them.
