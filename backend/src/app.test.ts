import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("application routes", () => {
  it("returns backend health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", storage: "memory" });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("allows configured development origins and rejects unknown origins", async () => {
    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");
    expect(allowed.status).toBe(200);
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const rejected = await request(app)
      .get("/api/health")
      .set("Origin", "https://untrusted.example");
    expect(rejected.status).toBe(403);
    expect(rejected.body.error.code).toBe("CORS_ORIGIN_DENIED");
  });

  it("returns normalized JSON for an unknown route", async () => {
    const response = await request(app).get("/api/route-that-does-not-exist");
    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "The requested API route was not found.",
        details: null,
      },
    });
  });
});
