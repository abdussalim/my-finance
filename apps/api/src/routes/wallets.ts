import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { walletSchema } from "@my-finance/shared";

export const walletRoutes = new Hono<Env>();

walletRoutes.get("/", async (c) => {
  const query = `
    SELECT 
      w.id,
      w.name,
      w.type,
      w.icon,
      w.color,
      w.initial_balance,
      w.created_at,
      w.initial_balance + COALESCE(SUM(
        CASE 
          WHEN t.type IN ('income', 'transfer_in') THEN t.amount
          WHEN t.type IN ('expense', 'transfer_out') THEN -t.amount
          ELSE 0
        END
      ), 0) AS current_balance
    FROM wallets w
    LEFT JOIN transactions t ON t.wallet_id = w.id
    GROUP BY w.id
    ORDER BY w.created_at ASC
  `;

  const results = await c.env.DB.prepare(query).all();
  return c.json({ success: true, data: results.results });
});

walletRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = walletSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const id = generateId("wlt");
  const { name, type, icon, color, initial_balance } = parsed.data;

  await c.env.DB.prepare(
    "INSERT INTO wallets (id, name, type, icon, color, initial_balance) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, name, type, icon || "wallet", color || "#007AFF", initial_balance).run();

  return c.json({
    success: true,
    data: { id, name, type, icon, color, initial_balance, current_balance: initial_balance },
  }, 201);
});

walletRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = walletSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, type, icon, color } = parsed.data;
  await c.env.DB.prepare(
    "UPDATE wallets SET name = COALESCE(?, name), type = COALESCE(?, type), icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ?"
  ).bind(name || null, type || null, icon || null, color || null, id).run();

  return c.json({ success: true, data: { message: "Dompet berhasil diperbarui" } });
});

walletRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const txCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?"
  ).bind(id).first<{ count: number }>();

  if (txCount && txCount.count > 0) {
    return c.json({ success: false, error: "Dompet memiliki riwayat transaksi, tidak dapat dihapus" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM wallets WHERE id = ?").bind(id).run();
  return c.json({ success: true, data: { message: "Dompet berhasil dihapus" } });
});
