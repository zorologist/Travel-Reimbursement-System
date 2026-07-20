// Express middleware and API routes are assembled here separately from starting the HTTP server.
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestRouter } from "./routes/requestRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { workflowRouter } from "./routes/workflowRoutes.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "7mb" }));
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api", authRouter);
app.use("/api", requestRouter);
app.use("/api", workflowRouter);
app.use(notFoundHandler);
app.use(errorHandler);
