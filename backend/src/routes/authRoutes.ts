import { Router } from "express";

import { authenticationConfig } from "../auth/authConfig.js";
import { clearSessionCookie, sessionCookie, SESSION_COOKIE } from "../auth/sessionCookies.js";
import { ApiError } from "../errors/ApiError.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  authenticateCredentials,
  createSession,
  csrfTokenForSession,
  deleteOtherSessions,
  deleteSession,
} from "../services/authService.js";
import { LoginInputSchema } from "../validation/authSchemas.js";

export const authRouter = Router();

function requestToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

authRouter.post("/auth/login", async (request, response, next) => {
  try {
    if (authenticationConfig().mode !== "development") {
      throw new ApiError(404, "DEVELOPMENT_LOGIN_DISABLED", "Password login is disabled on this deployment.");
    }
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
  response.setHeader("Set-Cookie", clearSessionCookie());
  response.status(204).end();
});

authRouter.post("/auth/logout-others", authMiddleware, (request, response) => {
  deleteOtherSessions(request.currentUser!.id, request.sessionToken!);
  response.status(204).end();
});
