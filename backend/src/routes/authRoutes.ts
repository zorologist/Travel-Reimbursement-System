import { Router } from "express";

import { ApiError } from "../errors/ApiError.js";
import { authMiddleware, SESSION_COOKIE } from "../middleware/authMiddleware.js";
import {
  authenticateCredentials,
  createSession,
  csrfTokenForSession,
  deleteOtherSessions,
  deleteSession,
} from "../services/authService.js";
import { LoginInputSchema } from "../validation/authSchemas.js";

export const authRouter = Router();

function sessionCookie(token: string, remember: boolean): string {
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/"];
  if (remember) parts.push(`Max-Age=${7 * 24 * 60 * 60}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function clearCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function requestToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

authRouter.post("/auth/login", async (request, response, next) => {
  try {
    const input = LoginInputSchema.parse(request.body);
    const user = await authenticateCredentials(input.employeeNumber, input.password);
    if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "The employee number or password is incorrect.");
    const session = createSession(user, input.remember);
    response.setHeader("Set-Cookie", sessionCookie(session.token, input.remember));
    response.json({ user, csrfToken: session.csrfToken });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/auth/me", authMiddleware, (request, response) => {
  response.json({
    user: request.currentUser,
    csrfToken: csrfTokenForSession(request.sessionToken!),
  });
});

authRouter.post("/auth/logout", authMiddleware, (request, response) => {
  const token = requestToken(request.header("cookie"));
  if (token) deleteSession(decodeURIComponent(token));
  response.setHeader("Set-Cookie", clearCookie());
  response.status(204).end();
});

authRouter.post("/auth/logout-others", authMiddleware, (request, response) => {
  deleteOtherSessions(request.currentUser!.id, request.sessionToken!);
  response.status(204).end();
});
