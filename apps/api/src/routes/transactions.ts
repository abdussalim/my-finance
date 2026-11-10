import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { transactionSchema, transferSchema } from "@my-finance/shared";

export const transactionRoutes = new Hono<Env>();

transactionRoutes.get("/", async (c) => {
  const walletId = c.req.query("wallet_id");
  const categoryId = c.req.query("category_id");
  const type = c.req.query("type");
  const dateFrom = c.req.query("date_from");
  const dateTo = c.req.query("date_to");

  let query = `
    SELECT 
      t.id,
      t.wallet_id,
      t.category_id,
      t.type,
      t.amount,
      t.transfer_pair_id,
      t.date,
      t.note,
      t.created_at,
      w.name as wallet_name,
      c.name as category_name
    FROM transactions t
    JOIN wallets w ON w.id = t.wallet_id
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (walletId) {
    query += " AND t.wallet_id = ?";
    params.push(walletId);
  }
  if (categoryId) {
    query += " AND t.category_id = ?";
    params.push(categoryId);
  }
  if (type) {
    query += " AND t.type = ?";
    params.push(type);
  }
  if (dateFrom) {
    query += " AND t.date >= ?";
    params.push(dateFrom);
  }
  if (dateTo) {
    query += " AND t.date <= ?";
    params.push(dateTo);
  }

  query += " ORDER BY t.date DESC, t.created_at DESC LIMIT 100";

  const stmt = c.env.DB.prepare(query);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const results = await bound.all();

  return c.json({ success: true, data: results.results });
});

transactionRoutes.post("/", async (c) => {
  const body = await c.req.json();

  if (body.type === "transfer") {
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
    }

    const { source_wallet_id, target_wallet_id, amount, date, note } = parsed.data;
    if (source_wallet_id === target_wallet_id) {
      return c.json({ success: false, error: "Dompet asal dan tujuan tidak boleh sama" }, 400);
    }

    const pairId = generateId("tfr");
    const outId = generateId("tx");
    const inId = generateId("tx");

    await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO transactions (id, wallet_id, category_id, type, amount, transfer_pair_id, date, note) VALUES (?, ?, NULL, 'transfer_out', ?, ?, ?, ?)"
      ).bind(outId, source_wallet_id, amount, pairId, date, note || "Transfer ke dompet lain"),
      c.env.DB.prepare(
        "INSERT INTO transactions (id, wallet_id, category_id, type, amount, transfer_pair_id, date, note) VALUES (?, ?, NULL, 'transfer_in', ?, ?, ?, ?)"
      ).bind(inId, target_wallet_id, amount, pairId, date, note || "Transfer dari dompet lain"),
    ]);

    return c.json({ success: true, data: { transfer_pair_id: pairId, message: "Transfer berhasil dicatat" } }, 201);
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const id = generateId("tx");
  const { wallet_id, category_id, type, amount, date, note } = parsed.data;

  await c.env.DB.prepare(
    "INSERT INTO transactions (id, wallet_id, category_id, type, amount, transfer_pair_id, date, note) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)"
  ).bind(id, wallet_id, category_id || null, type, amount, date, note || null).run();

  return c.json({ success: true, data: { id, ...parsed.data } }, 201);
});

transactionRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const tx = await c.env.DB.prepare(
    "SELECT transfer_pair_id FROM transactions WHERE id = ?"
  ).bind(id).first<{ transfer_pair_id: string | null }>();

  if (!tx) {
    return c.json({ success: false, error: "Transaksi tidak ditemukan" }, 404);
  }

  if (tx.transfer_pair_id) {
    await c.env.DB.prepare(
      "DELETE FROM transactions WHERE transfer_pair_id = ?"
    ).bind(tx.transfer_pair_id).run();
  } else {
    await c.env.DB.prepare("DELETE FROM transactions WHERE id = ?").bind(id).run();
  }

  return c.json({ success: true, data: { message: "Transaksi berhasil dihapus" } });
});
