$ErrorActionPreference = "Stop"

$baseUrl = $env:TASKFLOW_SCALE_BASE_URL
if (-not $baseUrl) { $baseUrl = "http://localhost:8081/api" }
$baseUrl = $baseUrl.TrimEnd("/")
$instanceIds = [System.Collections.Generic.HashSet[string]]::new()
$createdId = $null
$createdTitle = "taskflow-scaling-probe-$([guid]::NewGuid())"

try {
  $ready = Invoke-RestMethod -Uri "$baseUrl/health/ready" -TimeoutSec 5
  if (-not $ready.success) { throw "The scaling endpoint is not ready." }

  1..20 | ForEach-Object {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/health/live" -TimeoutSec 5
    $instanceId = [string]$response.Headers["X-TaskFlow-Instance"]
    if ($instanceId) { [void]$instanceIds.Add($instanceId) }
  }

  if ($instanceIds.Count -lt 2) {
    throw "Only $($instanceIds.Count) backend instance(s) served requests. Check the scaling override and load-balancer DNS configuration."
  }

  $createResponse = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$baseUrl/tasks" -ContentType "application/json" -Body (@{ title = $createdTitle } | ConvertTo-Json) -TimeoutSec 5
  $created = $createResponse.Content | ConvertFrom-Json
  $createdId = [string]$created.data._id
  $writeInstance = [string]$createResponse.Headers["X-TaskFlow-Instance"]
  if (-not $created.success -or -not $createdId) { throw "The isolated probe task was not created." }

  $crossInstanceRead = $null
  for ($attempt = 0; $attempt -lt 20 -and -not $crossInstanceRead; $attempt++) {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/tasks/$createdId" -TimeoutSec 5
    if ([string]$response.Headers["X-TaskFlow-Instance"] -ne $writeInstance) {
      $crossInstanceRead = $response
    }
  }

  if (-not $crossInstanceRead) { throw "No different backend served the task read; shared MongoDB visibility was not verified." }
  $read = $crossInstanceRead.Content | ConvertFrom-Json
  if ($read.data.title -ne $createdTitle) { throw "The task created through one instance was not visible through the other." }

  [pscustomobject]@{
    readiness = "passed"
    distinctBackendInstances = @($instanceIds | Sort-Object)
    writeInstance = $writeInstance
    readInstance = [string]$crossInstanceRead.Headers["X-TaskFlow-Instance"]
    sharedMongoRead = "passed"
  } | ConvertTo-Json -Depth 4
} finally {
  if ($createdId) {
    try {
      Invoke-RestMethod -Method Delete -Uri "$baseUrl/tasks/$createdId" -TimeoutSec 5 | Out-Null
      Write-Output "Deleted isolated probe task $createdId."
    } catch {
      Write-Warning "Could not clean up isolated probe task $createdId. Verify that task title '$createdTitle' is the probe before removing it manually."
    }
  }
}
