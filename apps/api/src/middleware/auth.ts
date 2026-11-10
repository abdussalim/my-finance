import { Context, Next } from "hono";
import { verifyJwt } from "../lib/jwt";
import { Env } from "../types";

export const DEV_FALLBACK_SECRET = "fallback-secret-for-dev-32-chars-minimum!!";

export async function authMiddleware(c: Context<Env>, next: Next) {
  const path = c.req.path;
  if (path === "/api/auth/setup" || path === "/api/auth/login" || path === "/api/auth/logout" || path === "/api/auth/status") {
    return next();
  }

  const cookieHeader = c.req.header("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const secret = c.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  const payload = await verifyJwt(token, secret);
  if (!payload) {
    return c.json({ success: false, error: "Session expired or invalid" }, 401);
  }

  c.set("userId", payload.sub as string);
  return next();
}
