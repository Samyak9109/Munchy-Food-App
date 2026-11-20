import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

/**
 * Fast liveness check for Railway, Render, UptimeRobot, and Docker health checks.
 * Responds immediately with status 200, uptime, and system info.
 * Placed before rate limiters so periodic health pings are never blocked.
 */
router.get("/", (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: "ok",
    message: "Munchy API is running",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
  });
});

/**
 * Ultra-lightweight ping probe (plain text response)
 */
router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

/**
 * Deep readiness probe (verifies database connectivity)
 * Returns 200 if MongoDB is healthy, 503 if unavailable.
 */
router.get("/db", async (req, res) => {
  const state = mongoose.connection.readyState;
  // Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

  if (state !== 1) {
    return res.status(503).json({
      status: "error",
      message: "Database unavailable",
      dbState: state,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({
      status: "ok",
      message: "Database connected",
      dbState: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      message: "Database ping failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
