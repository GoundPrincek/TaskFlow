require("dotenv").config();

const http = require("node:http");
const { app } = require("./src/app");
const { connectDatabase, closeDatabase } = require("./src/config/database");
const { connectRedis, closeRedis } = require("./src/config/redis");

async function startServer() {
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || "0.0.0.0";

  await connectDatabase();
  void connectRedis().catch(() => {});

  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close();
    server.closeAllConnections?.();
    await Promise.allSettled([closeDatabase(), closeRedis()]);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return { server, shutdown };
}

if (require.main === module) {
  startServer().then(
    () => process.stdout.write(`TaskFlow API listening on port ${process.env.PORT || 5000}\n`),
    async () => {
      process.stderr.write("TaskFlow API could not start because a required service is unavailable.\n");
      await Promise.allSettled([closeDatabase(), closeRedis()]);
      process.exitCode = 1;
    },
  );
}

module.exports = { startServer };
