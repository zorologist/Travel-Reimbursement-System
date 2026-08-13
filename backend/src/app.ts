// Express middleware and API routes are assembled here separately from starting the HTTP server.
import cors from "cors";
import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ApiError } from "./errors/ApiError.js";
import { csrfProtection } from "./middleware/csrfProtection.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestRouter } from "./routes/requestRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { workflowRouter } from "./routes/workflowRoutes.js";
import { databasePool } from "./database/databasePool.js";
import { requireFrontendBuild } from "./config/runtimeValidation.js";
import { requestLogging } from "./middleware/requestLogging.js";

export const app = express();

// Node only ever binds to loopback (enforced in production - see runtimeValidation.ts),
// so the only thing that can connect directly is IIS/ARR on the same machine. Trusting
// the X-Forwarded-* headers from loopback lets rate-limiting and logging see the real
// client IP instead of treating every request as coming from IIS itself.
app.set("trust proxy", "loopback");

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

function loginAccountKey(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  const accountName = normalized.split(/[\\/]/).at(-1) ?? normalized;
  return accountName.split("@")[0] ?? accountName;
}

app.use(requestLogging);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // IIS has no HTTPS binding until the real certificate is installed;
        // this directive otherwise makes browsers rewrite every asset
        // request to https:// and the connection gets reset.
        upgradeInsecureRequests: process.env.TLS_ENABLED === "true" ? [] : null,
      },
    },
  }),
);
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
  windowMs: 5 * 60 * 1000,
  limit: 5,
  keyGenerator(request) {
    const account = loginAccountKey(request.body?.employeeNumber);
    return account ? `login:${account}` : `invalid:${ipKeyGenerator(request.ip ?? "")}`;
  },
  skipSuccessfulRequests: true,
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
app.get("/api/health", async (_request, response) => {
  if (!databasePool) {
    response.json({ status: "ok", storage: "memory" });
    return;
  }
  try {
    const schema = await databasePool.query(
      "SELECT filename AS version FROM schema_migrations ORDER BY filename DESC LIMIT 1",
    );
    response.json({
      status: "ok",
      storage: "postgres",
      schemaVersion: schema.rows[0]?.version ?? null,
    });
  } catch {
    response.status(503).json({
      status: "unavailable",
      storage: "postgres",
      error: { code: "DATABASE_UNAVAILABLE", message: "The database is unavailable." },
    });
  }
});
app.use("/api", authRouter);
app.use("/api", requestRouter);
app.use("/api", workflowRouter);
app.use("/api", notFoundHandler);

const frontendDist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
const frontendIndex = fileURLToPath(new URL("../../frontend/dist/index.html", import.meta.url));
const serveFrontend = process.env.SERVE_FRONTEND === "true" || process.env.NODE_ENV === "production";
requireFrontendBuild(frontendIndex);

if (serveFrontend && existsSync(frontendIndex)) {
  app.use(express.static(frontendDist, {
    index: false,
    setHeaders(response, path) {
      response.setHeader(
        "Cache-Control",
        path.includes(`${frontendDist}\\assets\\`) || path.includes(`${frontendDist}/assets/`)
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
    },
  }));
  app.use((request, response, next) => {
    if (request.method === "GET" && request.accepts("html")) {
      response.setHeader("Cache-Control", "no-cache");
      response.sendFile(frontendIndex);
      return;
    }
    next();
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
