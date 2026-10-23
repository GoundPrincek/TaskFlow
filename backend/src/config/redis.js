const { createClient } = require("redis");

let client = null;
let connectionState = "not-configured";
let reconnectTimer = null;

function scheduleReconnect(url) {
  if (reconnectTimer || !url) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectRedis(url).catch(() => {});
  }, 5000);
  reconnectTimer.unref?.();
}

async function connectRedis(url = process.env.REDIS_URL) {
  if (!url) return null;
  if (client?.isReady || client?.isOpen) return client;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const current = createClient({
    url,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: (retries) => (retries > 2 ? new Error("Redis unavailable") : retries * 250),
    },
  });
  client = current;
  connectionState = "connecting";
  current.on("error", () => {
    if (client === current && !current.isReady) connectionState = "disconnected";
  });
  current.on("ready", () => {
    if (client === current) connectionState = "connected";
  });
  current.on("end", () => {
    if (client !== current) return;
    client = null;
    connectionState = "disconnected";
    scheduleReconnect(url);
  });

  try {
    await current.connect();
    if (client !== current) return null;
    connectionState = "connected";
    return current;
  } catch {
    if (client === current) {
      client = null;
      connectionState = "disconnected";
      current.removeAllListeners();
      if (current.isOpen) await current.disconnect().catch(() => {});
      scheduleReconnect(url);
    }
    return null;
  }
}

async function closeRedis() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const current = client;
  client = null;
  if (current?.isOpen) {
    await current.quit().catch(() => current.disconnect().catch(() => {}));
  }
  connectionState = process.env.REDIS_URL ? "disconnected" : "not-configured";
}

function getRedisStatus() {
  return connectionState;
}

module.exports = { connectRedis, closeRedis, getRedisStatus };
