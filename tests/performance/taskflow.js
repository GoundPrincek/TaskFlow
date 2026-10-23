import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const maxSupportedVus = 50;
const profile = (__ENV.TEST_PROFILE || "smoke").toLowerCase();
const endpoints = [
  { path: "/health/live", name: "health-live" },
  { path: "/health/ready", name: "health-ready" },
  { path: "/tasks", name: "tasks-list" },
  { path: "/tasks/stats", name: "tasks-stats" },
];
const statusCodes = [200, 400, 401, 403, 404, 408, 413, 429, 500, 502, 503, 504];
const statusCounters = new Map(statusCodes.map((status) => [status, new Counter(`taskflow_status_${status}`)]));
const otherStatusCounter = new Counter("taskflow_status_other");
const maxVus = Number(__ENV.MAX_VUS || (profile === "stress" || profile === "spike" ? 25 : 5));
const sleepSeconds = Number(__ENV.SLEEP_SECONDS || 2);
const baseUrl = (__ENV.TASKFLOW_BASE_URL || "http://host.docker.internal:5000/api").replace(/\/$/, "");

if (!Number.isInteger(maxVus) || maxVus < 1 || maxVus > maxSupportedVus) {
  throw new Error(`MAX_VUS must be an integer from 1 to ${maxSupportedVus}.`);
}
if (!Number.isFinite(sleepSeconds) || sleepSeconds < 0) {
  throw new Error("SLEEP_SECONDS must be a non-negative number.");
}

function profileScenario() {
  const stepDuration = __ENV.STEP_DURATION || "10s";
  switch (profile) {
    case "smoke":
      return { executor: "constant-vus", vus: 1, duration: __ENV.DURATION || "10s" };
    case "baseline":
      return { executor: "constant-vus", vus: 1, duration: __ENV.DURATION || "30s" };
    case "load": {
      const levels = [1, 5, 10, 25, 50].filter((level) => level <= maxVus);
      if (levels[levels.length - 1] !== maxVus) levels.push(maxVus);
      return {
        executor: "ramping-vus",
        startVUs: 1,
        stages: [
          ...levels.map((target) => ({ duration: stepDuration, target })),
          { duration: stepDuration, target: 0 },
        ],
        gracefulRampDown: "5s",
      };
    }
    case "stress":
      return {
        executor: "ramping-vus",
        startVUs: 1,
        stages: [1, 5, 10, 25, maxVus].map((target) => ({ duration: stepDuration, target: Math.min(target, maxVus) }))
          .filter((stage, index, list) => index === 0 || stage.target !== list[index - 1].target)
          .concat([{ duration: stepDuration, target: 0 }]),
        gracefulRampDown: "5s",
      };
    case "spike":
      return {
        executor: "ramping-vus",
        startVUs: 1,
        stages: [
          { duration: __ENV.SPIKE_RAMP || "10s", target: maxVus },
          { duration: __ENV.SPIKE_HOLD || "10s", target: maxVus },
          { duration: __ENV.SPIKE_RAMP || "10s", target: 1 },
        ],
        gracefulRampDown: "5s",
      };
    case "soak":
      return { executor: "constant-vus", vus: Math.min(maxVus, 5), duration: __ENV.DURATION || "30m" };
    default:
      throw new Error("TEST_PROFILE must be smoke, baseline, load, stress, spike, or soak.");
  }
}

export const options = {
  scenarios: { taskflow: profileScenario() },
  thresholds: {
    http_req_failed: [`rate<${Number(__ENV.MAX_ERROR_RATE ?? 0.01)}`],
    checks: [`rate>${Number(__ENV.MIN_CHECK_RATE ?? 0.99)}`],
    http_req_duration: [
      `p(50)<${Number(__ENV.P50_LIMIT_MS ?? 1000)}`,
      `p(90)<${Number(__ENV.P90_LIMIT_MS ?? 2000)}`,
      `p(95)<${Number(__ENV.P95_LIMIT_MS ?? 3000)}`,
    ],
    http_reqs: [`rate>${Number(__ENV.MIN_REQUEST_RATE ?? 0.1)}`],
  },
  summaryTrendStats: ["avg", "min", "med", "max", "p(50)", "p(90)", "p(95)"],
};

export default function () {
  const endpoint = endpoints[(__ITER + __VU - 1) % endpoints.length];
  const response = http.get(`${baseUrl}${endpoint.path}`, {
    timeout: __ENV.REQUEST_TIMEOUT || "5s",
    tags: { name: endpoint.name },
  });
  (statusCounters.get(response.status) || otherStatusCounter).add(1);

  let parsed;
  try {
    parsed = response.json();
  } catch {
    parsed = null;
  }
  check(response, {
    [`${endpoint.name} returns HTTP 200`]: (res) => res.status === 200,
    [`${endpoint.name} returns success envelope`]: () => parsed?.success === true,
  });
  sleep(sleepSeconds);
}

export function handleSummary(data) {
  const httpStatusDistribution = Object.fromEntries([
    ...statusCodes.map((status) => [String(status), data.metrics[`taskflow_status_${status}`]?.values?.count ?? 0]),
    ["other", data.metrics.taskflow_status_other?.values?.count ?? 0],
  ]);
  const thresholdResults = Object.fromEntries(Object.entries(data.metrics)
    .filter(([, metric]) => metric.thresholds)
    .map(([name, metric]) => [name, metric.thresholds]));
  const report = {
    profile,
    baseUrl,
    maximumConfiguredVus: maxVus,
    requestsPerSecond: data.metrics.http_reqs?.values?.rate ?? null,
    requestCount: data.metrics.http_reqs?.values?.count ?? 0,
    failedRequestRate: data.metrics.http_req_failed?.values?.rate ?? null,
    checkRate: data.metrics.checks?.values?.rate ?? null,
    responseTimeMs: data.metrics.http_req_duration?.values ?? {},
    httpStatusDistribution,
    thresholdResults,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  const resultFile = __ENV.RESULTS_FILE;
  const summaries = { stdout: output };
  if (resultFile) summaries[resultFile] = output;
  return {
    ...summaries,
  };
}
