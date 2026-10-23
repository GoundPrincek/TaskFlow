// Reserved for the later Redis caching phase. Redis is health-checked but no
// API response is cached until a measurable baseline and invalidation tests exist.
const taskCacheKeys = {
  list: (filterKey = "all") => `taskflow:tasks:${filterKey}`,
  stats: () => "taskflow:dashboard:stats",
  task: (id) => `taskflow:task:${id}`,
};

module.exports = { taskCacheKeys };
