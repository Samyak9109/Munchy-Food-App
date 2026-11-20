import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

describe("Health & Monitoring Suite (Railway / Render / Uptime Probes)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  it("GET /health responds with 200 and health diagnostic metadata", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Munchy API is running");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.rss).toBeDefined();
  });

  it("GET /api/health responds with 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /healthz responds with 200 (Kubernetes/Railway standard)", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /health/ping responds with 200 pong", async () => {
    const res = await request(app).get("/health/ping");
    expect(res.status).toBe(200);
    expect(res.text).toBe("pong");
  });

  it("GET /health/db verifies MongoDB readiness", async () => {
    const res = await request(app).get("/health/db");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.message).toBe("Database connected");
  });

  it("GET / (root) responds with 200 status ok", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("munchy-api");
  });
});
