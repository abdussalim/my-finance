import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { categorySchema } from "@my-finance/shared";

export const categoryRoutes = new Hono<Env>();

categoryRoutes.get("/", async (c) => {
  const type = c.req.query("type");
  let stmt = c.env.DB.prepare("SELECT * FROM categories");

  if (type) {
    stmt = c.env.DB.prepare("SELECT * FROM categories WHERE type = ?").bind(type);
  }

  const results = await stmt.all();
  return c.json({ success: true, data: results.results });
});

categoryRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const id = generateId("cat");
  const { name, type, icon, color } = parsed.data;

  await c.env.DB.prepare(
    "INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, name, type, icon || "tag", color || "#8E8E93").run();

  return c.json({ success: true, data: { id, name, type, icon, color } }, 201);
});

categoryRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, icon, color } = parsed.data;
  await c.env.DB.prepare(
    "UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ?"
  ).bind(name || null, icon || null, color || null, id).run();

  return c.json({ success: true, data: { message: "Kategori berhasil diperbarui" } });
});

categoryRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const txCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE category_id = ?"
  ).bind(id).first<{ count: number }>();

  if (txCount && txCount.count > 0) {
    return c.json({ success: false, error: "Kategori masih digunakan di transaksi" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
  return c.json({ success: true, data: { message: "Kategori berhasil dihapus" } });
});
