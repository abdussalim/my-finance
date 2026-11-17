import { Hono } from "hono";
import { Env } from "../types";

export const dashboardRoutes = new Hono<Env>();

dashboardRoutes.get("/summary", async (c) => {
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const [walletsRes, flowRes, debtsRes, recentRes, projectsRes] = await c.env.DB.batch([
    c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(w.initial_balance), 0) + COALESCE((
          SELECT SUM(
            CASE 
              WHEN t.type IN ('income', 'transfer_in') THEN t.amount
              WHEN t.type IN ('expense', 'transfer_out') THEN -t.amount
              ELSE 0
            END
          )
          FROM transactions t
        ), 0) AS total_balance
      FROM wallets w
    `),
    c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as month_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as month_expense
      FROM transactions
      WHERE date LIKE ?
    `).bind(`${currentMonthPrefix}%`),
    c.env.DB.prepare(`
      SELECT 
        d.type,
        SUM(d.total_amount) - COALESCE((
          SELECT SUM(dp.amount) 
          FROM debt_payments dp 
          JOIN debts d2 ON d2.id = dp.debt_id 
          WHERE d2.type = d.type
        ), 0) as remaining
      FROM debts d
      GROUP BY d.type
    `),
    c.env.DB.prepare(`
      SELECT 
        t.id, t.wallet_id, t.category_id, t.project_id, t.type, t.amount, t.date, t.note, t.created_at,
        w.name as wallet_name,
        c.name as category_name,
        p.name as project_name,
        p.color as project_color,
        p.code as project_code,
        p.logo_url as project_logo
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 6
    `),
    c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_projects,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_project_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_project_expense
      FROM projects p
      LEFT JOIN transactions t ON t.project_id = p.id
    `),
  ]);

  const totalBalance = (walletsRes.results[0] as any)?.total_balance || 0;
  const monthIncome = (flowRes.results[0] as any)?.month_income || 0;
  const monthExpense = (flowRes.results[0] as any)?.month_expense || 0;

  let totalDebt = 0;
  let totalReceivable = 0;
  for (const row of debtsRes.results as any[]) {
    if (row.type === "debt") totalDebt = Math.max(0, row.remaining || 0);
    if (row.type === "receivable") totalReceivable = Math.max(0, row.remaining || 0);
  }

  const projRow: any = projectsRes.results[0] || {};
  const totalProjectIncome = Number(projRow.total_project_income || 0);
  const totalProjectExpense = Number(projRow.total_project_expense || 0);

  return c.json({
    success: true,
    data: {
      total_balance: totalBalance,
      month_income: monthIncome,
      month_expense: monthExpense,
      total_debt: totalDebt,
      total_receivable: totalReceivable,
      recent_transactions: recentRes.results,
      projects_summary: {
        total_projects: Number(projRow.total_projects || 0),
        active_projects: Number(projRow.active_projects || 0),
        total_project_income: totalProjectIncome,
        total_project_expense: totalProjectExpense,
        total_project_profit: totalProjectIncome - totalProjectExpense,
      },
    },
  });
});
