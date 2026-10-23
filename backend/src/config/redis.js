const { createClient } = require("redis");

let client = null;
let connectionState = "not-configured";

async function connectRedis(url = process.env.REDIS_URL) {
  if (!url) return null;
  client = createClient({
    url,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: (retries) => (retries > 2 ? new Error("Redis unavailable") : retries * 250),
    },
  });
  client.on("error", () => {
    connectionState = "disconnected";
  });
  client.on("ready", () => {
    connectionState = "connected";
  });
  try {
    await client.connect();
    connectionState = "connected";
    return client;
  } catch {
    connectionState = "disconnected";
    client = null;
    return null;
  }
}

async function closeRedis() {
  const current = client;
  client = null;
  if (current?.isOpen) await current.quit().catch(() => current.disconnect());
  connectionState = process.env.REDIS_URL ? "disconnected" : "not-configured";
}

function getRedisStatus() {
  return connectionState;
}

module.exports = { connectRedis, closeRedis, getRedisStatus };
