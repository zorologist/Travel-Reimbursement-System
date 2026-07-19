import { afterEach, describe, expect, it, vi } from "vitest";

import api from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("returns parsed JSON data and sends session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await api.get<{ status: string }>("/api/health");

    expect(response.data).toEqual({ status: "ok" });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("preserves the backend error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "INVALID_TRANSITION",
              message: "The request is at the wrong stage.",
              details: null,
            },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(api.post("/api/requests/TR-1/approve", {})).rejects.toMatchObject({
      name: "ApiClientError",
      status: 409,
      code: "INVALID_TRANSITION",
      message: "The request is at the wrong stage.",
      details: null,
    });
  });

  it("normalizes network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(api.get("/api/health")).rejects.toEqual(
      expect.objectContaining({
        status: 0,
        code: "NETWORK_ERROR",
      }),
    );
  });
});
