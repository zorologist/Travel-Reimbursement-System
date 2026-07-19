import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { attachUser, requireAuth } from "../middleware/authorizeRole.js";
import { findUserById, listUsers } from "../storage/memoryStore.js";

const router = Router();

const LoginSchema = z.object({ userId: z.string() });

/**
 * Development-only sign-in: picks one of the seeded dev accounts by id and
 * returns it as a bearer token equal to the user's id. Replace entirely once
 * Active Directory integration is confirmed (README "Company Integration Later").
 */
router.post("/login", (req: Request, res: Response) => {
  const { userId } = LoginSchema.parse(req.body);
  const user = findUserById(userId);

  if (!user) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Unknown development user id.",
        details: {
          availableUsers: listUsers().map((u) => ({ id: u.id, displayName: u.displayName, roles: u.roles })),
        },
      },
    });
    return;
  }

  res.json({ token: user.id, user });
});

router.get("/me", attachUser, requireAuth, (req: Request, res: Response) => {
  res.json(req.user);
});

export default router;