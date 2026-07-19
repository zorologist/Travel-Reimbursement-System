// Express middleware and API routes are assembled here separately from starting the HTTP server.
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use(notFoundHandler);
app.use(errorHandler);
