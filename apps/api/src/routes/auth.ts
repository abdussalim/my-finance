import { Hono } from "hono";
import { Env } from "../types";
import { generateSalt, hashPin, verifyPin } from "../lib/crypto";
import { signJwt, verifyJwt } from "../lib/jwt";
import { DEV_FALLBACK_SECRET } from "../middleware/auth";
import { pinSchema } from "@my-finance/shared";

export const authRoutes = new Hono<Env>();

function buildSessionCookie(url: string, token: string, maxAge: number): string {
  const isHttps = url.startsWith("https://");
  const secureFlag = isHttps ? "Secure; " : "";
  return `session=${token}; Path=/; HttpOnly; SameSite=Strict; ${secureFlag}Max-Age=${maxAge}`;
}

authRoutes.get("/status", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT pin_hash, failed_attempts, locked_until FROM auth_config WHERE id = 'main'"
  ).first<{ pin_hash: string; failed_attempts: number; locked_until: string | null }>();

  const isSetup = Boolean(row && row.pin_hash);
  let isLoggedIn = false;

  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (match) {
    const secret = c.env.JWT_SECRET || DEV_FALLBACK_SECRET;
    const payload = await verifyJwt(match[1], secret);
    isLoggedIn = Boolean(payload);
  }

  let lockedUntil = row?.locked_until ?? null;
  if (lockedUntil && new Date(lockedUntil).getTime() < Date.now()) {
    lockedUntil = null;
  }

  return c.json({
    success: true,
    data: {
      isSetup,
      isLoggedIn,
      lockedUntil,
    },
  });
});

authRoutes.post("/setup", async (c) => {
  const body = await c.req.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM auth_config WHERE id = 'main'"
  ).first();

  if (existing) {
    return c.json({ success: false, error: "PIN sudah pernah diatur" }, 400);
  }

  const secret = c.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  const salt = generateSalt();
  const pinHash = await hashPin(parsed.data.pin, salt, secret);

  await c.env.DB.prepare(
    "INSERT INTO auth_config (id, pin_hash, salt, failed_attempts, locked_until) VALUES ('main', ?, ?, 0, NULL)"
  ).bind(pinHash, salt).run();

  const token = await signJwt({ sub: "main" }, secret, 7 * 86400);
  c.header("Set-Cookie", buildSessionCookie(c.req.url, token, 7 * 86400));

  return c.json({ success: true, data: { message: "PIN berhasil dibuat" } });
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const auth = await c.env.DB.prepare(
    "SELECT * FROM auth_config WHERE id = 'main'"
  ).first<{ pin_hash: string; salt: string; failed_attempts: number; locked_until: string | null }>();

  if (!auth) {
    return c.json({ success: false, error: "PIN belum disetup" }, 400);
  }

  if (auth.locked_until && new Date(auth.locked_until).getTime() > Date.now()) {
    const remainingMins = Math.ceil(
      (new Date(auth.locked_until).getTime() - Date.now()) / 60000
    );
    return c.json(
      { success: false, error: `Akun terkunci karena percobaan gagal. Coba lagi dalam ${remainingMins} menit.` },
      403
    );
  }

  const secret = c.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  const isValid = await verifyPin(parsed.data.pin, auth.salt, auth.pin_hash, secret);

  if (!isValid) {
    const attempts = auth.failed_attempts + 1;
    let lockedUntil: string | null = null;
    if (attempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    await c.env.DB.prepare(
      "UPDATE auth_config SET failed_attempts = ?, locked_until = ? WHERE id = 'main'"
    ).bind(attempts >= 5 ? 0 : attempts, lockedUntil).run();

    if (lockedUntil) {
      return c.json(
        { success: false, error: "5x PIN salah. Aplikasi terkunci selama 15 menit." },
        403
      );
    }

    return c.json(
      { success: false, error: `PIN salah. Sisa percobaan: ${5 - attempts}` },
      401
    );
  }

  await c.env.DB.prepare(
    "UPDATE auth_config SET failed_attempts = 0, locked_until = NULL WHERE id = 'main'"
  ).run();

  const token = await signJwt({ sub: "main" }, secret, 7 * 86400);
  c.header("Set-Cookie", buildSessionCookie(c.req.url, token, 7 * 86400));

  return c.json({ success: true, data: { message: "Login berhasil" } });
});

authRoutes.post("/logout", (c) => {
  c.header("Set-Cookie", buildSessionCookie(c.req.url, "", 0));
  return c.json({ success: true, data: { message: "Logout berhasil" } });
});

authRoutes.post("/change-pin", async (c) => {
  const body = await c.req.json();
  const oldParsed = pinSchema.safeParse({ pin: body?.old_pin });
  const newParsed = pinSchema.safeParse({ pin: body?.new_pin });
  if (!oldParsed.success || !newParsed.success) {
    return c.json({ success: false, error: "PIN lama dan baru harus 6 digit angka" }, 400);
  }

  const auth = await c.env.DB.prepare(
    "SELECT pin_hash, salt FROM auth_config WHERE id = 'main'"
  ).first<{ pin_hash: string; salt: string }>();

  if (!auth) {
    return c.json({ success: false, error: "PIN belum disetup" }, 400);
  }

  const secret = c.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  const isValid = await verifyPin(oldParsed.data.pin, auth.salt, auth.pin_hash, secret);
  if (!isValid) {
    return c.json({ success: false, error: "PIN lama salah" }, 401);
  }

  const newSalt = generateSalt();
  const newHash = await hashPin(newParsed.data.pin, newSalt, secret);

  await c.env.DB.prepare(
    "UPDATE auth_config SET pin_hash = ?, salt = ?, failed_attempts = 0, locked_until = NULL WHERE id = 'main'"
  ).bind(newHash, newSalt).run();

  return c.json({ success: true, data: { message: "PIN berhasil diubah" } });
});
