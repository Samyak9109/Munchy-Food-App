import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Auth Route Mounting", () => {
  it("POST /api/auth/user/register does not return 404 Route Not Found", async () => {
    const res = await request(app).post("/api/auth/user/register").send({});
    // Should hit validation (400) or rate limiter, NOT 404 Route Not Found
    expect(res.status).not.toBe(404);
    expect(res.body.message).not.toContain("not found");
  });

  it("POST /auth/user/register does not return 404 Route Not Found", async () => {
    const res = await request(app).post("/auth/user/register").send({});
    // Should hit validation (400) or rate limiter, NOT 404 Route Not Found
    expect(res.status).not.toBe(404);
    expect(res.body.message).not.toContain("not found");
  });

  it("POST /auth/user/login does not return 404 Route Not Found", async () => {
    const res = await request(app).post("/auth/user/login").send({});
    expect(res.status).not.toBe(404);
    expect(res.body.message).not.toContain("not found");
  });
});
