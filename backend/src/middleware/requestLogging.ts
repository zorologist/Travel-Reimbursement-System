import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

import { log } from "../observability/logger.js";

export const requestLogging: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();
  request.requestId = randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  response.on("finish", () => {
    log(response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info", "http_request", {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl.split("?")[0],
      status: response.statusCode,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      actorId: request.currentUser?.id,
    });
  });
  next();
};
