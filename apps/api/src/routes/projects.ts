import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { projectSchema } from "@my-finance/shared";

export const projectRoutes = new Hono<Env>();

projectRoutes.get("/", async (c) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.code,
      p.description,
      p.color,
      p.status,
      p.budget,
      p.target_revenue,
      p.created_at,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
      COUNT(t.id) AS transaction_count
    FROM projects p
    LEFT JOIN transactions t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  const results = await c.env.DB.prepare(query).all();

  const projectsWithStats = (results.results || []).map((row: any) => {
    const income = Number(row.total_income || 0);
    const expense = Number(row.total_expense || 0);
    const netProfit = income - expense;
    const budget = Number(row.budget || 0);
    const targetRevenue = Number(row.target_revenue || 0);

    return {
      ...row,
      total_income: income,
      total_expense: expense,
      net_profit: netProfit,
      margin_percentage: income > 0 ? Math.round((netProfit / income) * 100) : 0,
      budget_burn_percentage: budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0,
      revenue_progress_percentage: targetRevenue > 0 ? Math.min(100, Math.round((income / targetRevenue) * 100)) : 0,
      transaction_count: Number(row.transaction_count || 0),
    };
  });

  return c.json({ success: true, data: projectsWithStats });
});

projectRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [projectRes, txsRes] = await c.env.DB.batch([
    c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.code, p.description, p.color, p.status, p.budget, p.target_revenue, p.created_at,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
        COUNT(t.id) AS transaction_count
      FROM projects p
      LEFT JOIN transactions t ON t.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).bind(id),
    c.env.DB.prepare(`
      SELECT 
        t.id, t.wallet_id, t.category_id, t.project_id, t.type, t.amount, t.date, t.note, t.created_at,
        w.name as wallet_name,
        c.name as category_name
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.project_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 50
    `).bind(id),
  ]);

  if (!projectRes.results || projectRes.results.length === 0) {
    return c.json({ success: false, error: "Proyek tidak ditemukan" }, 404);
  }

  const row: any = projectRes.results[0];
  const income = Number(row.total_income || 0);
  const expense = Number(row.total_expense || 0);
  const netProfit = income - expense;
  const budget = Number(row.budget || 0);
  const targetRevenue = Number(row.target_revenue || 0);

  const stats = {
    ...row,
    total_income: income,
    total_expense: expense,
    net_profit: netProfit,
    margin_percentage: income > 0 ? Math.round((netProfit / income) * 100) : 0,
    budget_burn_percentage: budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0,
    revenue_progress_percentage: targetRevenue > 0 ? Math.min(100, Math.round((income / targetRevenue) * 100)) : 0,
    transaction_count: Number(row.transaction_count || 0),
    transactions: txsRes.results || [],
  };

  return c.json({ success: true, data: stats });
});

projectRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, code, description, color, status, budget, target_revenue } = parsed.data;
  const id = generateId("prj");

  await c.env.DB.prepare(`
    INSERT INTO projects (id, name, code, description, color, status, budget, target_revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    name.trim(),
    (code || name.slice(0, 3)).toUpperCase().trim(),
    description || null,
    color || "#6366F1",
    status || "active",
    budget || 0,
    target_revenue || 0
  ).run();

  return c.json({ success: true, data: { id, message: "Proyek berhasil dibuat" } }, 201);
});

projectRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, code, description, color, status, budget, target_revenue } = parsed.data;

  await c.env.DB.prepare(`
    UPDATE projects 
    SET name = ?, code = ?, description = ?, color = ?, status = ?, budget = ?, target_revenue = ?
    WHERE id = ?
  `).bind(
    name.trim(),
    (code || name.slice(0, 3)).toUpperCase().trim(),
    description || null,
    color || "#6366F1",
    status || "active",
    budget || 0,
    target_revenue || 0,
    id
  ).run();

  return c.json({ success: true, data: { message: "Proyek berhasil diperbarui" } });
});

projectRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE transactions SET project_id = NULL WHERE project_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id),
  ]);

  return c.json({ success: true, data: { message: "Proyek berhasil dihapus" } });
});
