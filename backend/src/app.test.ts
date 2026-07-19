import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("application routes", () => {
  it("returns backend health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
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