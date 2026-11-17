import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { projectSchema, projectTaskSchema, updateProjectTaskSchema } from "@my-finance/shared";

export const projectRoutes = new Hono<Env>();

// GET /api/projects - list all projects with financial and task progress metrics
projectRoutes.get("/", async (c) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.code,
      p.description,
      p.color,
      p.logo_url,
      p.status,
      p.budget,
      p.target_revenue,
      p.created_at,
      COALESCE(t.total_income, 0) AS total_income,
      COALESCE(t.total_expense, 0) AS total_expense,
      COALESCE(t.transaction_count, 0) AS transaction_count,
      COALESCE(tk.total_tasks, 0) AS total_tasks,
      COALESCE(tk.completed_tasks, 0) AS completed_tasks,
      COALESCE(tk.pending_tasks, 0) AS pending_tasks
    FROM projects p
    LEFT JOIN (
      SELECT 
        project_id,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
        COUNT(id) AS transaction_count
      FROM transactions
      WHERE project_id IS NOT NULL
      GROUP BY project_id
    ) t ON t.project_id = p.id
    LEFT JOIN (
      SELECT 
        project_id,
        COUNT(id) AS total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) AS pending_tasks
      FROM project_tasks
      GROUP BY project_id
    ) tk ON tk.project_id = p.id
    ORDER BY p.created_at DESC
  `;

  const results = await c.env.DB.prepare(query).all();

  const projectsWithStats = (results.results || []).map((row: any) => {
    const income = Number(row.total_income || 0);
    const expense = Number(row.total_expense || 0);
    const netProfit = income - expense;
    const budget = Number(row.budget || 0);
    const targetRevenue = Number(row.target_revenue || 0);
    const totalTasks = Number(row.total_tasks || 0);
    const completedTasks = Number(row.completed_tasks || 0);
    const pendingTasks = Number(row.pending_tasks || 0);

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...row,
      total_income: income,
      total_expense: expense,
      net_profit: netProfit,
      margin_percentage: income > 0 ? Math.round((netProfit / income) * 100) : 0,
      budget_burn_percentage: budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0,
      revenue_progress_percentage: targetRevenue > 0 ? Math.min(100, Math.round((income / targetRevenue) * 100)) : 0,
      transaction_count: Number(row.transaction_count || 0),
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      progress_percentage: progressPercentage,
    };
  });

  return c.json({ success: true, data: projectsWithStats });
});

// GET /api/projects/:id - detailed project metrics with tasks and transactions
projectRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [projectRes, tasksRes, txsRes] = await c.env.DB.batch([
    c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.code, p.description, p.color, p.logo_url, p.status, p.budget, p.target_revenue, p.created_at,
        COALESCE(t.total_income, 0) AS total_income,
        COALESCE(t.total_expense, 0) AS total_expense,
        COALESCE(t.transaction_count, 0) AS transaction_count,
        COALESCE(tk.total_tasks, 0) AS total_tasks,
        COALESCE(tk.completed_tasks, 0) AS completed_tasks,
        COALESCE(tk.pending_tasks, 0) AS pending_tasks
      FROM projects p
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
          COUNT(id) AS transaction_count
        FROM transactions
        WHERE project_id = ?
        GROUP BY project_id
      ) t ON t.project_id = p.id
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(id) AS total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) AS pending_tasks
        FROM project_tasks
        WHERE project_id = ?
        GROUP BY project_id
      ) tk ON tk.project_id = p.id
      WHERE p.id = ?
    `).bind(id, id, id),
    c.env.DB.prepare(`
      SELECT id, project_id, title, description, status, priority, due_date, completed_at, created_at
      FROM project_tasks
      WHERE project_id = ?
      ORDER BY 
        CASE status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        created_at DESC
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
  const totalTasks = Number(row.total_tasks || 0);
  const completedTasks = Number(row.completed_tasks || 0);
  const pendingTasks = Number(row.pending_tasks || 0);

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = {
    ...row,
    total_income: income,
    total_expense: expense,
    net_profit: netProfit,
    margin_percentage: income > 0 ? Math.round((netProfit / income) * 100) : 0,
    budget_burn_percentage: budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0,
    revenue_progress_percentage: targetRevenue > 0 ? Math.min(100, Math.round((income / targetRevenue) * 100)) : 0,
    transaction_count: Number(row.transaction_count || 0),
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    progress_percentage: progressPercentage,
    tasks: tasksRes.results || [],
    transactions: txsRes.results || [],
  };

  return c.json({ success: true, data: stats });
});

// POST /api/projects - create new project
projectRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, code, description, color, logo_url, status, budget, target_revenue } = parsed.data;
  const id = generateId("prj");

  await c.env.DB.prepare(`
    INSERT INTO projects (id, name, code, description, color, logo_url, status, budget, target_revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    name.trim(),
    (code || name.slice(0, 3)).toUpperCase().trim(),
    description || null,
    color || "#6366F1",
    logo_url || null,
    status || "active",
    budget || 0,
    target_revenue || 0
  ).run();

  return c.json({ success: true, data: { id, message: "Proyek berhasil dibuat" } }, 201);
});

// PUT /api/projects/:id - update project details
projectRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, code, description, color, logo_url, status, budget, target_revenue } = parsed.data;

  await c.env.DB.prepare(`
    UPDATE projects 
    SET name = ?, code = ?, description = ?, color = ?, logo_url = ?, status = ?, budget = ?, target_revenue = ?
    WHERE id = ?
  `).bind(
    name.trim(),
    (code || name.slice(0, 3)).toUpperCase().trim(),
    description || null,
    color || "#6366F1",
    logo_url || null,
    status || "active",
    budget || 0,
    target_revenue || 0,
    id
  ).run();

  return c.json({ success: true, data: { message: "Proyek berhasil diperbarui" } });
});

// DELETE /api/projects/:id - delete project
projectRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE transactions SET project_id = NULL WHERE project_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM project_tasks WHERE project_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id),
  ]);

  return c.json({ success: true, data: { message: "Proyek berhasil dihapus" } });
});

// --- TASK MANAGEMENT ROUTES ---

// GET /api/projects/:id/tasks - get tasks for a project
projectRoutes.get("/:id/tasks", async (c) => {
  const projectId = c.req.param("id");
  const results = await c.env.DB.prepare(`
    SELECT id, project_id, title, description, status, priority, due_date, completed_at, created_at
    FROM project_tasks
    WHERE project_id = ?
    ORDER BY 
      CASE status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      created_at DESC
  `).bind(projectId).all();

  return c.json({ success: true, data: results.results || [] });
});

// POST /api/projects/:id/tasks - create a new task
projectRoutes.post("/:id/tasks", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const parsed = projectTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { title, description, status, priority, due_date } = parsed.data;
  const taskId = generateId("tsk");
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  await c.env.DB.prepare(`
    INSERT INTO project_tasks (id, project_id, title, description, status, priority, due_date, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    taskId,
    projectId,
    title.trim(),
    description || null,
    status || "pending",
    priority || "medium",
    due_date || null,
    completedAt
  ).run();

  return c.json({
    success: true,
    data: {
      id: taskId,
      project_id: projectId,
      title: title.trim(),
      description: description || null,
      status: status || "pending",
      priority: priority || "medium",
      due_date: due_date || null,
      completed_at: completedAt,
    },
  }, 201);
});

// PATCH /api/projects/:id/tasks/:taskId - update task (status toggle, title, etc)
projectRoutes.patch("/:id/tasks/:taskId", async (c) => {
  const projectId = c.req.param("id");
  const taskId = c.req.param("taskId");
  const body = await c.req.json();
  const parsed = updateProjectTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const updates: string[] = [];
  const bindings: any[] = [];

  if (parsed.data.title !== undefined) {
    updates.push("title = ?");
    bindings.push(parsed.data.title.trim());
  }
  if (parsed.data.description !== undefined) {
    updates.push("description = ?");
    bindings.push(parsed.data.description);
  }
  if (parsed.data.priority !== undefined) {
    updates.push("priority = ?");
    bindings.push(parsed.data.priority);
  }
  if (parsed.data.due_date !== undefined) {
    updates.push("due_date = ?");
    bindings.push(parsed.data.due_date);
  }
  if (parsed.data.status !== undefined) {
    updates.push("status = ?");
    bindings.push(parsed.data.status);
    if (parsed.data.status === "completed") {
      updates.push("completed_at = datetime('now')");
    } else {
      updates.push("completed_at = NULL");
    }
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: "Tidak ada perubahan data" }, 400);
  }

  bindings.push(taskId, projectId);

  await c.env.DB.prepare(`
    UPDATE project_tasks
    SET ${updates.join(", ")}
    WHERE id = ? AND project_id = ?
  `).bind(...bindings).run();

  return c.json({ success: true, data: { message: "Status pekerjaan berhasil diperbarui" } });
});

// DELETE /api/projects/:id/tasks/:taskId - delete a task
projectRoutes.delete("/:id/tasks/:taskId", async (c) => {
  const projectId = c.req.param("id");
  const taskId = c.req.param("taskId");

  await c.env.DB.prepare(`
    DELETE FROM project_tasks
    WHERE id = ? AND project_id = ?
  `).bind(taskId, projectId).run();

  return c.json({ success: true, data: { message: "Pekerjaan berhasil dihapus" } });
});
