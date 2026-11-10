import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { debtSchema, debtPaymentSchema } from "@my-finance/shared";

export const debtRoutes = new Hono<Env>();

debtRoutes.get("/", async (c) => {
  const type = c.req.query("type");
  const status = c.req.query("status");

  let query = `
    SELECT 
      d.id,
      d.person_name,
      d.type,
      d.total_amount,
      d.due_date,
      d.status,
      d.note,
      d.created_at,
      COALESCE(SUM(dp.amount), 0) AS paid_amount,
      d.total_amount - COALESCE(SUM(dp.amount), 0) AS remaining_amount
    FROM debts d
    LEFT JOIN debt_payments dp ON dp.debt_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (type) {
    query += " AND d.type = ?";
    params.push(type);
  }
  if (status) {
    query += " AND d.status = ?";
    params.push(status);
  }

  query += " GROUP BY d.id ORDER BY d.created_at DESC";

  const stmt = c.env.DB.prepare(query);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const results = await bound.all();

  return c.json({ success: true, data: results.results });
});

debtRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const id = generateId("dbt");
  const { person_name, type, total_amount, due_date, note } = parsed.data;

  await c.env.DB.prepare(
    "INSERT INTO debts (id, person_name, type, total_amount, due_date, status, note) VALUES (?, ?, ?, ?, ?, 'unpaid', ?)"
  ).bind(id, person_name, type, total_amount, due_date || null, note || null).run();

  return c.json({
    success: true,
    data: { id, ...parsed.data, status: "unpaid", paid_amount: 0, remaining_amount: total_amount },
  }, 201);
});

debtRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM debt_payments WHERE debt_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM debts WHERE id = ?").bind(id),
  ]);
  return c.json({ success: true, data: { message: "Hutang/Piutang berhasil dihapus" } });
});

debtRoutes.get("/:id/payments", async (c) => {
  const debtId = c.req.param("id");
  const payments = await c.env.DB.prepare(`
    SELECT dp.*, w.name as wallet_name 
    FROM debt_payments dp 
    JOIN wallets w ON w.id = dp.wallet_id 
    WHERE dp.debt_id = ? 
    ORDER BY dp.payment_date DESC, dp.created_at DESC
  `).bind(debtId).all();

  return c.json({ success: true, data: payments.results });
});

debtRoutes.post("/:id/payments", async (c) => {
  const debtId = c.req.param("id");
  const body = await c.req.json();
  const parsed = debtPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const debt = await c.env.DB.prepare(
    "SELECT total_amount, type, person_name FROM debts WHERE id = ?"
  ).bind(debtId).first<{ total_amount: number; type: string; person_name: string }>();

  if (!debt) {
    return c.json({ success: false, error: "Data hutang/piutang tidak ditemukan" }, 404);
  }

  const paymentId = generateId("pay");
  const txId = generateId("tx");
  const { wallet_id, amount, payment_date, note } = parsed.data;
  const txType = debt.type === "debt" ? "expense" : "income";
  const txNote =
    debt.type === "debt"
      ? `Bayar hutang (${debt.person_name})${note ? `: ${note}` : ""}`
      : `Terima piutang (${debt.person_name})${note ? `: ${note}` : ""}`;

  // Atomic batch insert + fetch new paid sum
  const [, , paidRes] = await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO debt_payments (id, debt_id, wallet_id, amount, payment_date, note) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(paymentId, debtId, wallet_id, amount, payment_date, note || null),
    c.env.DB.prepare(
      "INSERT INTO transactions (id, wallet_id, category_id, type, amount, date, note) VALUES (?, ?, NULL, ?, ?, ?, ?)"
    ).bind(txId, wallet_id, txType, amount, payment_date, txNote),
    c.env.DB.prepare(
      "SELECT COALESCE(SUM(amount), 0) as paid FROM debt_payments WHERE debt_id = ?"
    ).bind(debtId),
  ]);

  const paid = (paidRes.results[0] as any)?.paid || 0;
  const newStatus = paid >= debt.total_amount ? "settled" : paid > 0 ? "partially_paid" : "unpaid";

  await c.env.DB.prepare("UPDATE debts SET status = ? WHERE id = ?").bind(newStatus, debtId).run();

  return c.json({
    success: true,
    data: { payment_id: paymentId, new_status: newStatus, remaining: Math.max(0, debt.total_amount - paid) },
  }, 201);
});

debtRoutes.delete("/:id/payments/:pid", async (c) => {
  const debtId = c.req.param("id");
  const pid = c.req.param("pid");

  const [, debtRes, paidRes] = await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM debt_payments WHERE id = ? AND debt_id = ?").bind(pid, debtId),
    c.env.DB.prepare("SELECT total_amount FROM debts WHERE id = ?").bind(debtId),
    c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as paid FROM debt_payments WHERE debt_id = ?").bind(debtId),
  ]);

  const totalAmount = (debtRes.results[0] as any)?.total_amount || 0;
  const paid = (paidRes.results[0] as any)?.paid || 0;
  const newStatus = paid >= totalAmount ? "settled" : paid > 0 ? "partially_paid" : "unpaid";

  await c.env.DB.prepare("UPDATE debts SET status = ? WHERE id = ?").bind(newStatus, debtId).run();

  return c.json({ success: true, data: { message: "Cicilan berhasil dihapus", new_status: newStatus } });
});
