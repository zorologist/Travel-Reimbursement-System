// Express middleware and API routes are assembled here separately from starting the HTTP server.
import express, { type Express } from "express";
import { attachUser } from "./middleware/authorizeRole.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  // Both mounted at the same base path: requestRoutes owns "/", "/:id" (GET/PATCH);
  // workflowRoutes owns "/:id/approve", "/:id/reject", "/:id/review", "/:id/finalize".
  // Express matches these as distinct patterns, so there's no route collision.
  app.use("/api/requests", requestRoutes);
  app.use("/api/requests", workflowRoutes);

  // Must be registered last — Express treats any 4-arg middleware as an error handler.
  app.use(errorHandler);

  return app;
}
