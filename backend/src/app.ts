// Express middleware and API routes are assembled here separately from starting the HTTP server.
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ApiError } from "./errors/ApiError.js";
import { csrfProtection } from "./middleware/csrfProtection.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestRouter } from "./routes/requestRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { workflowRouter } from "./routes/workflowRoutes.js";

export const app = express();

const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(
  configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
);

app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new ApiError(403, "CORS_ORIGIN_DENIED", "The request origin is not allowed."));
  },
}));
// Up to four 5 MB ticket images are carried as data URLs in the current
// in-memory implementation; base64 overhead requires a larger JSON envelope.
app.use(express.json({ limit: "30mb" }));
app.use("/api", (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Try again later.",
      details: null,
    },
  },
}));
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many login attempts. Try again later.",
      details: null,
    },
  },
}));
app.use("/api", csrfProtection);
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api", authRouter);
app.use("/api", requestRouter);
app.use("/api", workflowRouter);
app.use(notFoundHandler);
app.use(errorHandler);
