import { Router } from "express";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";
import { verifyTwentyUser } from "../db/twenty-pg.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const log = createLogger('auth');

/**
 * Login — verifies credentials against Twenty's own `core."user"` table.
 * Twenty is the source of truth for who can log in.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    log.info(`Login attempt for: ${email} — body JSON:`, JSON.stringify({ email, password: password ? `***${password.length} chars` : null }));
    console.log(`[auth] raw body:`, JSON.stringify(req.body, null, 2));

    let twentyUser;
    try {
      twentyUser = await verifyTwentyUser(email, password);
      console.log(`[auth] verifyTwentyUser result:`, JSON.stringify(twentyUser, null, 2));
    } catch (err: any) {
      log.error("Authentication service error:", err.message);
      console.error(`[auth] verify error stack:`, err.stack);
      res.status(503).json({
        error: err.message ?? "Authentication service unavailable",
        code: "AUTH_SERVICE_UNAVAILABLE",
      });
      return;
    }

    if (!twentyUser) {
      log.warn(`Failed login attempt for: ${email}`);
      console.warn(`[auth] failed — will return 401 JSON:`, JSON.stringify({ error: "Invalid credentials" }));
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    log.info(`Successful login for: ${twentyUser.email} — user JSON:`, JSON.stringify(twentyUser, null, 2));

    const fullName = [twentyUser.firstName, twentyUser.lastName]
      .filter(Boolean)
      .join(" ") || twentyUser.email;

    const token = generateToken({
      userId: twentyUser.id,
      twentyUserId: twentyUser.id,
      email: twentyUser.email,
      fullName,
    });

    res.json({
      user: {
        id: twentyUser.id,
        email: twentyUser.email,
        fullName,
        role: "agent",
      },
      token,
    });
  } catch (err: any) {
    log.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Signup is disabled — members are created in Twenty, not in the dialer.
 */
router.post("/signup", (_req, res) => {
  res.status(403).json({
    error:
      "Sign up is disabled. Create the member in Twenty, then log in with their Twenty credentials.",
  });
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  // User info is stored in the JWT token payload
  const user = {
    id: req.userId!,
    email: req.userEmail || "",
    fullName: req.userFullName || "",
    role: "agent",
    twentyUserId: req.twentyUserId,
  };

  log.info(`GET /me: ${user.email}`);
  res.json(user);
});

export default router;
