const mongoose = require("mongoose");

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

module.exports = { connectDatabase, closeDatabase, getDatabaseStatus };
