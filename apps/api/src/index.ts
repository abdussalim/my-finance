import { Hono } from "hono";
import { Env } from "./types";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { walletRoutes } from "./routes/wallets";
import { categoryRoutes } from "./routes/categories";
import { transactionRoutes } from "./routes/transactions";
import { debtRoutes } from "./routes/debts";
import { dashboardRoutes } from "./routes/dashboard";

const app = new Hono<Env>();

app.use("/api/*", authMiddleware);

app.route("/api/auth", authRoutes);
app.route("/api/wallets", walletRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/transactions", transactionRoutes);
app.route("/api/debts", debtRoutes);
app.route("/api/dashboard", dashboardRoutes);

// Fallback to static assets for Cloudflare Pages SPA
app.all("*", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

export default app;
