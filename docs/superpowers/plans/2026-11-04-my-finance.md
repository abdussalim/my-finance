# My Finance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an ultra-low resource fullstack personal finance tracking PWA with a dedicated Hutang/Piutang tab, Apple-style organic minimalist UI, deployed to Cloudflare Pages on `finance.abdussalim.my.id`.

**Architecture:** Monorepo with pnpm workspace and Turborepo. React 19 SPA frontend with Vite PWA and Tailwind CSS v4, communicating via Hono RPC with a Hono API running on Cloudflare Pages Functions (edge workers) backed by Cloudflare D1 (serverless SQLite).

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, vite-plugin-pwa, Hono v4, Cloudflare Pages/Workers, Cloudflare D1, Zod, jose (JWT), nanoid.

## Global Constraints

- Monetary amounts are strictly integers in Indonesian Rupiah (no decimals). Format display as `Rp 1.500.000`.
- All timestamps and dates stored as ISO 8601 strings (`YYYY-MM-DD` for dates, `datetime('now')` for timestamps).
- Wallet balance is strictly computed on-read: `initial_balance + SUM(income + transfer_in) - SUM(expense + transfer_out)`.
- Debt remaining amount is strictly computed on-read: `total_amount - COALESCE(SUM(payments), 0)`.
- Transfers must create two atomic rows in `transactions` linked by `transfer_pair_id` using D1 batch.
- Authentication uses Master PIN (6 digits) hashed with PBKDF2 (100,000 iterations) and JWT in `httpOnly`, `SameSite=Strict` cookie.
- Rate limiting: maximum 5 failed PIN attempts per 15 minutes.
- Offline strategy: PWA L1 (cached app shell and assets via Workbox; data requests require network).
- Zero external chart libraries for v1; minimalist CSS progress bars and summary cards only.

---

### Task 1: Monorepo Scaffold + Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`

**Interfaces:**
- Produces: Monorepo workspace configuration with Turbo pipeline.

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "my-finance",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "deploy": "pnpm build && wrangler pages deploy apps/web/dist --project-name=my-finance"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Create `.gitignore` and `.npmrc`**

`.gitignore`:
```gitignore
node_modules/
dist/
.wrangler/
.dev.vars
.env
.turbo/
*.log
.DS_Store
Thumbs.db
```

`.npmrc`:
```ini
shamefully-hoist=true
```

- [ ] **Step 5: Create `packages/shared/package.json` & `packages/shared/tsconfig.json`**

`packages/shared/package.json`:
```json
{
  "name": "@my-finance/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 6: Create `apps/web/package.json` and `apps/api/package.json`**

`apps/web/package.json`:
```json
{
  "name": "@my-finance/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "@my-finance/shared": "workspace:*",
    "clsx": "^2.1.1",
    "hono": "^4.6.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.0",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0"
  }
}
```

`apps/api/package.json`:
```json
{
  "name": "@my-finance/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler pages dev ../web/dist --d1=DB --compatibility-date=2024-12-01 --port=8788",
    "build": "esbuild src/index.ts --bundle --outfile=../web/dist/_worker.js --format=esm --target=es2022 --conditions=workerd --external:node:*",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@my-finance/shared": "workspace:*",
    "hono": "^4.6.0",
    "jose": "^5.9.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241205.0",
    "@my-finance/web": "workspace:*",
    "esbuild": "^0.24.0",
    "typescript": "^5.7.0",
    "wrangler": "^3.99.0"
  }
}
```

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected output: Dependencies resolved, `pnpm-lock.yaml` created.

---

### Task 2: Shared Package — Types & Schemas

**Files:**
- Create: `packages/shared/src/schemas.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: Zod schemas & TypeScript types consumed by both frontend and backend.

- [ ] **Step 1: Write `packages/shared/src/schemas.ts`**

```typescript
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi"),
  type: z.enum(["bank", "cash", "ewallet"]),
  icon: z.string().optional().default("wallet"),
  color: z.string().optional().default("#007AFF"),
  initial_balance: z.number().int().nonnegative("Saldo awal tidak boleh negatif").default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["expense", "income"]),
  icon: z.string().optional().default("tag"),
  color: z.string().optional().default("#8E8E93"),
});

export const transactionSchema = z.object({
  wallet_id: z.string().min(1, "Dompet wajib dipilih"),
  category_id: z.string().optional().nullable(),
  type: z.enum(["income", "expense", "transfer_in", "transfer_out"]),
  amount: z.number().int().positive("Nominal harus lebih dari 0"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const transferSchema = z.object({
  source_wallet_id: z.string().min(1, "Dompet asal wajib dipilih"),
  target_wallet_id: z.string().min(1, "Dompet tujuan wajib dipilih"),
  amount: z.number().int().positive("Nominal transfer harus lebih dari 0"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const debtSchema = z.object({
  person_name: z.string().min(1, "Nama pihak wajib diisi"),
  type: z.enum(["debt", "receivable"]),
  total_amount: z.number().int().positive("Nominal hutang/piutang harus lebih dari 0"),
  due_date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD").optional().nullable(),
  note: z.string().optional().nullable(),
});

export const debtPaymentSchema = z.object({
  wallet_id: z.string().min(1, "Dompet pembayaran wajib dipilih"),
  amount: z.number().int().positive("Nominal cicilan harus lebih dari 0"),
  payment_date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const pinSchema = z.object({
  pin: z.string().length(6, "PIN harus 6 digit").regex(/^\d{6}$/, "PIN hanya boleh berupa angka"),
});
```

- [ ] **Step 2: Write `packages/shared/src/types.ts`**

```typescript
import { z } from "zod";
import {
  walletSchema,
  categorySchema,
  transactionSchema,
  transferSchema,
  debtSchema,
  debtPaymentSchema,
  pinSchema,
} from "./schemas";

export type WalletInput = z.infer<typeof walletSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
export type PinInput = z.infer<typeof pinSchema>;

export interface Wallet extends WalletInput {
  id: string;
  created_at: string;
}

export interface Category extends CategoryInput {
  id: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  category_id: string | null;
  type: "income" | "expense" | "transfer_in" | "transfer_out";
  amount: number;
  transfer_pair_id: string | null;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  person_name: string;
  type: "debt" | "receivable";
  total_amount: number;
  due_date: string | null;
  status: "unpaid" | "partially_paid" | "settled";
  note: string | null;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  wallet_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export interface AuthConfig {
  id: string;
  pin_hash: string;
  salt: string;
  failed_attempts: number;
  locked_until: string | null;
}

export interface WalletWithBalance extends Wallet {
  current_balance: number;
}

export interface DebtWithRemaining extends Debt {
  remaining_amount: number;
  paid_amount: number;
}

export interface TransactionWithDetails extends Transaction {
  wallet_name: string;
  category_name: string | null;
}

export interface DashboardSummary {
  total_balance: number;
  month_income: number;
  month_expense: number;
  total_debt: number;
  total_receivable: number;
  recent_transactions: TransactionWithDetails[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

- [ ] **Step 3: Write `packages/shared/src/index.ts`**

```typescript
export * from "./schemas";
export * from "./types";
```

- [ ] **Step 4: Build verification**

Run: `pnpm --filter @my-finance/shared build`
Expected output: Clean build with no TypeScript errors.

---

### Task 3: Database Schema, Seed & API Utilities

**Files:**
- Create: `apps/api/src/db/schema.sql`
- Create: `apps/api/src/db/seed.sql`
- Create: `apps/api/src/lib/id.ts`
- Create: `apps/api/src/lib/crypto.ts`

**Interfaces:**
- Produces: `schema.sql`, `seed.sql`, `generateId()`, `hashPin()`, `verifyPin()` for edge runtime.

- [ ] **Step 1: Write `apps/api/src/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  initial_balance INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  category_id TEXT REFERENCES categories(id),
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transfer_pair_id TEXT,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  person_name TEXT NOT NULL,
  type TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  amount INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
```

- [ ] **Step 2: Write `apps/api/src/db/seed.sql`**

```sql
INSERT OR IGNORE INTO categories (id, name, type, icon, color) VALUES
  ('cat_mkn', 'Makanan & Minuman', 'expense', 'utensils', '#FF9500'),
  ('cat_trn', 'Transportasi', 'expense', 'car', '#007AFF'),
  ('cat_blj', 'Belanja', 'expense', 'shopping-bag', '#FF2D55'),
  ('cat_tgh', 'Tagihan & Langganan', 'expense', 'receipt', '#5856D6'),
  ('cat_hbr', 'Hiburan', 'expense', 'film', '#AF52DE'),
  ('cat_ksh', 'Kesehatan', 'expense', 'heart-pulse', '#FF3B30'),
  ('cat_pnd', 'Pendidikan', 'expense', 'graduation-cap', '#34C759'),
  ('cat_lnx', 'Lain-lain', 'expense', 'more-horizontal', '#8E8E93'),
  ('cat_gji', 'Gaji & Honor', 'income', 'briefcase', '#34C759'),
  ('cat_bns', 'Bonus & THR', 'income', 'gift', '#30B0C7'),
  ('cat_inv', 'Investasi / Profit', 'income', 'trending-up', '#32D74B'),
  ('cat_lni', 'Pemasukan Lain', 'income', 'plus-circle', '#64D2FF');
```

- [ ] **Step 3: Write `apps/api/src/lib/id.ts`**

```typescript
import { nanoid } from "nanoid";

export function generateId(prefix?: string): string {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}
```

- [ ] **Step 4: Write `apps/api/src/lib/crypto.ts`**

```typescript
const PBKDF2_ITERATIONS = 100000;
const HASH_ALGO = "SHA-256";

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export async function verifyPin(
  pin: string,
  salt: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed === hash;
}
```

---

### Task 4: Hono App Entry, JWT Auth Middleware & Auth Routes

**Files:**
- Create: `apps/api/src/types.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/index.ts`

**Interfaces:**
- Produces: API routing entry point with JWT authentication & rate-limited PIN login.

- [ ] **Step 1: Write `apps/api/src/types.ts`**

```typescript
export interface Env {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    ASSETS?: Fetcher;
  };
  Variables: {
    userId?: string;
  };
}
```

- [ ] **Step 2: Write `apps/api/src/middleware/auth.ts`**

```typescript
import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { Env } from "../types";

export async function authMiddleware(c: Context<Env>, next: Next) {
  const path = c.req.path;
  if (path.startsWith("/api/auth/")) {
    return next();
  }

  const cookieHeader = c.req.header("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET || "fallback-secret-for-dev-32-chars-minimum!!");
    const { payload } = await jwtVerify(token, secret);
    c.set("userId", payload.sub as string);
    return next();
  } catch {
    return c.json({ success: false, error: "Session expired or invalid" }, 401);
  }
}
```

- [ ] **Step 3: Write `apps/api/src/routes/auth.ts`**

```typescript
import { Hono } from "hono";
import { SignJWT } from "jose";
import { Env } from "../types";
import { generateSalt, hashPin, verifyPin } from "../lib/crypto";
import { pinSchema } from "@my-finance/shared";

export const authRoutes = new Hono<Env>();

authRoutes.get("/status", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT pin_hash, failed_attempts, locked_until FROM auth_config WHERE id = 'main'"
  ).first<{ pin_hash: string; failed_attempts: number; locked_until: string | null }>();

  const isSetup = Boolean(row && row.pin_hash);
  let isLoggedIn = false;

  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (match) {
    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET || "fallback-secret-for-dev-32-chars-minimum!!");
      await import("jose").then(({ jwtVerify }) => jwtVerify(match[1], secret));
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
    }
  }

  let lockedUntil = row?.locked_until;
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

  const salt = generateSalt();
  const pinHash = await hashPin(parsed.data.pin, salt);

  await c.env.DB.prepare(
    "INSERT INTO auth_config (id, pin_hash, salt, failed_attempts, locked_until) VALUES ('main', ?, ?, 0, NULL)"
  ).bind(pinHash, salt).run();

  const secret = new TextEncoder().encode(c.env.JWT_SECRET || "fallback-secret-for-dev-32-chars-minimum!!");
  const token = await new SignJWT({ sub: "main" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  c.header(
    "Set-Cookie",
    `session=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${7 * 86400}`
  );

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

  const isValid = await verifyPin(parsed.data.pin, auth.salt, auth.pin_hash);

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

  const secret = new TextEncoder().encode(c.env.JWT_SECRET || "fallback-secret-for-dev-32-chars-minimum!!");
  const token = await new SignJWT({ sub: "main" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  c.header(
    "Set-Cookie",
    `session=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${7 * 86400}`
  );

  return c.json({ success: true, data: { message: "Login berhasil" } });
});

authRoutes.post("/logout", (c) => {
  c.header(
    "Set-Cookie",
    "session=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0"
  );
  return c.json({ success: true, data: { message: "Logout berhasil" } });
});
```

- [ ] **Step 4: Write `apps/api/src/index.ts`**

```typescript
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
```

---

### Task 5: Wallets & Categories API Routes

**Files:**
- Create: `apps/api/src/routes/wallets.ts`
- Create: `apps/api/src/routes/categories.ts`

**Interfaces:**
- Consumes: `walletSchema`, `categorySchema`, `generateId`.
- Produces: CRUD endpoints with computed balances.

- [ ] **Step 1: Write `apps/api/src/routes/wallets.ts`**

```typescript
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
```

- [ ] **Step 2: Write `apps/api/src/routes/categories.ts`**

```typescript
import { Hono } from "hono";
import { Env } from "../types";
import { generateId } from "../lib/id";
import { categorySchema } from "@my-finance/shared";

export const categoryRoutes = new Hono<Env>();

categoryRoutes.get("/", async (c) => {
  const type = c.req.query("type");
  let query = "SELECT * FROM categories";
  let stmt = c.env.DB.prepare(query);

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
```

---

### Task 6: Transactions API Routes

**Files:**
- Create: `apps/api/src/routes/transactions.ts`

**Interfaces:**
- Consumes: `transactionSchema`, `transferSchema`, `generateId`.
- Produces: CRUD endpoints with atomic transfer creation via D1 batch.

- [ ] **Step 1: Write `apps/api/src/routes/transactions.ts`**

```typescript
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
```

---

### Task 7: Debts & Payments API Routes + Dashboard Summary

**Files:**
- Create: `apps/api/src/routes/debts.ts`
- Create: `apps/api/src/routes/dashboard.ts`

**Interfaces:**
- Consumes: `debtSchema`, `debtPaymentSchema`, `generateId`.
- Produces: Debt & installment tracking endpoints and dashboard aggregations.

- [ ] **Step 1: Write `apps/api/src/routes/debts.ts`**

```typescript
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
    "SELECT * FROM debts WHERE id = ?"
  ).bind(debtId).first<{ total_amount: number; type: string }>();

  if (!debt) {
    return c.json({ success: false, error: "Data hutang/piutang tidak ditemukan" }, 404);
  }

  const paymentId = generateId("pay");
  const { wallet_id, amount, payment_date, note } = parsed.data;

  // Insert payment
  await c.env.DB.prepare(
    "INSERT INTO debt_payments (id, debt_id, wallet_id, amount, payment_date, note) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(paymentId, debtId, wallet_id, amount, payment_date, note || null).run();

  // Also create a linked cashflow transaction so wallet balance reflects this
  const txId = generateId("tx");
  const txType = debt.type === "debt" ? "expense" : "income";
  const txNote = debt.type === "debt" ? `Bayar cicilan hutang: ${note || ""}` : `Terima cicilan piutang: ${note || ""}`;

  await c.env.DB.prepare(
    "INSERT INTO transactions (id, wallet_id, category_id, type, amount, date, note) VALUES (?, ?, NULL, ?, ?, ?, ?)"
  ).bind(txId, wallet_id, txType, amount, payment_date, txNote.trim()).run();

  // Recalculate status
  const totalPaid = await c.env.DB.prepare(
    "SELECT SUM(amount) as paid FROM debt_payments WHERE debt_id = ?"
  ).bind(debtId).first<{ paid: number }>();

  const paid = totalPaid?.paid || 0;
  const newStatus = paid >= debt.total_amount ? "settled" : paid > 0 ? "partially_paid" : "unpaid";

  await c.env.DB.prepare(
    "UPDATE debts SET status = ? WHERE id = ?"
  ).bind(newStatus, debtId).run();

  return c.json({
    success: true,
    data: { payment_id: paymentId, new_status: newStatus, remaining: Math.max(0, debt.total_amount - paid) },
  }, 201);
});
```

- [ ] **Step 2: Write `apps/api/src/routes/dashboard.ts`**

```typescript
import { Hono } from "hono";
import { Env } from "../types";

export const dashboardRoutes = new Hono<Env>();

dashboardRoutes.get("/summary", async (c) => {
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

  // 1. Total Balance across all wallets
  const walletsSummary = await c.env.DB.prepare(`
    SELECT 
      SUM(w.initial_balance) + COALESCE(SUM(
        CASE 
          WHEN t.type IN ('income', 'transfer_in') THEN t.amount
          WHEN t.type IN ('expense', 'transfer_out') THEN -t.amount
          ELSE 0
        END
      ), 0) AS total_balance
    FROM wallets w
    LEFT JOIN transactions t ON t.wallet_id = w.id
  `).first<{ total_balance: number }>();

  // 2. Monthly Income & Expense
  const monthlyFlow = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as month_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as month_expense
    FROM transactions
    WHERE date LIKE ?
  `).bind(`${currentMonthPrefix}%`).first<{ month_income: number; month_expense: number }>();

  // 3. Debts & Receivables Remaining
  const debtsRemaining = await c.env.DB.prepare(`
    SELECT 
      type,
      SUM(total_amount) - COALESCE((
        SELECT SUM(dp.amount) 
        FROM debt_payments dp 
        JOIN debts d2 ON d2.id = dp.debt_id 
        WHERE d2.type = debts.type
      ), 0) as remaining
    FROM debts
    GROUP BY type
  `).all();

  let totalDebt = 0;
  let totalReceivable = 0;
  for (const row of debtsRemaining.results as any[]) {
    if (row.type === "debt") totalDebt = Math.max(0, row.remaining || 0);
    if (row.type === "receivable") totalReceivable = Math.max(0, row.remaining || 0);
  }

  // 4. Recent Transactions (last 5)
  const recent = await c.env.DB.prepare(`
    SELECT 
      t.id, t.wallet_id, t.category_id, t.type, t.amount, t.date, t.note, t.created_at,
      w.name as wallet_name,
      c.name as category_name
    FROM transactions t
    JOIN wallets w ON w.id = t.wallet_id
    LEFT JOIN categories c ON c.id = t.category_id
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 5
  `).all();

  return c.json({
    success: true,
    data: {
      total_balance: walletsSummary?.total_balance || 0,
      month_income: monthlyFlow?.month_income || 0,
      month_expense: monthlyFlow?.month_expense || 0,
      total_debt: totalDebt,
      total_receivable: totalReceivable,
      recent_transactions: recent.results,
    },
  });
});
```

---

### Task 8: API Local Verification & Worker Bundler Setup

**Files:**
- Create: `apps/api/tsconfig.json`
- Verify: `apps/api/package.json`

- [ ] **Step 1: Write `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Check TypeScript compilation**

Run: `pnpm --filter @my-finance/api lint`
Expected output: 0 errors.

---

### Task 9: Web App Scaffold (Vite + React 19 + Tailwind v4 + PWA)

**Files:**
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Write `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "My Finance",
        short_name: "Finance",
        description: "Catatan Keuangan & Hutang Pribadi",
        theme_color: "#F5F5F7",
        background_color: "#F5F5F7",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 2: Write `apps/web/index.html`**

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#F5F5F7" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="My Finance" />
    <title>My Finance</title>
  </head>
  <body class="bg-[#F5F5F7] text-[#1D1D1F] antialiased select-none overflow-x-hidden min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Write `apps/web/src/index.css`**

```css
@import "tailwindcss";

@layer base {
  :root {
    --apple-bg: #F5F5F7;
    --apple-card: #FFFFFF;
    --apple-text: #1D1D1F;
    --apple-secondary: #86868B;
    --apple-green: #34C759;
    --apple-red: #FF3B30;
    --apple-blue: #007AFF;
    --apple-orange: #FF9500;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
}

.apple-blur {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.apple-shadow {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
}

.apple-card-shadow {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
}
```

- [ ] **Step 4: Write `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Write `apps/web/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: Write `apps/web/src/App.tsx` placeholder**

```tsx
export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 font-medium">My Finance App Loading...</p>
    </div>
  );
}
```

---

### Task 10: Apple Design System UI Components Library

**Files:**
- Create: `apps/web/src/lib/cn.ts`
- Create: `apps/web/src/lib/format.ts`
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/components/ui/Card.tsx`
- Create: `apps/web/src/components/ui/Button.tsx`
- Create: `apps/web/src/components/ui/BottomSheet.tsx`
- Create: `apps/web/src/components/ui/NumberPad.tsx`
- Create: `apps/web/src/components/ui/PinInput.tsx`
- Create: `apps/web/src/components/ui/SegmentedControl.tsx`
- Create: `apps/web/src/components/ui/ProgressBar.tsx`
- Create: `apps/web/src/components/ui/EmptyState.tsx`
- Create: `apps/web/src/components/layout/BottomNav.tsx`
- Create: `apps/web/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Write `apps/web/src/lib/cn.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write `apps/web/src/lib/format.ts`**

```typescript
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID").format(Math.abs(amount));
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function relativeDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "Hari ini";
  if (dateStr === yesterday) return "Kemarin";
  return formatDate(dateStr);
}
```

- [ ] **Step 3: Write `apps/web/src/lib/api-client.ts`**

```typescript
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Terjadi kesalahan pada server");
  }

  return json.data as T;
}
```

- [ ] **Step 4: Write `apps/web/src/components/ui/Card.tsx`**

```tsx
import React from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border border-black/[0.03] apple-card-shadow transition-all active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Write `apps/web/src/components/ui/Button.tsx`**

```tsx
import React from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary: "bg-[#007AFF] text-white hover:bg-[#0066D6] shadow-sm",
    secondary: "bg-[#E5E5EA] text-[#1D1D1F] hover:bg-[#D1D1D6]",
    danger: "bg-[#FF3B30] text-white hover:bg-[#D70015]",
    ghost: "bg-transparent text-[#007AFF] hover:bg-black/[0.03]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "w-full py-3.5 text-base rounded-2xl",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
```

- [ ] **Step 6: Write `apps/web/src/components/ui/BottomSheet.tsx`**

```tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write `apps/web/src/components/ui/NumberPad.tsx`**

```tsx
import { Delete } from "lucide-react";
import { formatCurrency } from "../../lib/format";

export interface NumberPadProps {
  value: number;
  onChange: (val: number) => void;
}

export function NumberPad({ value, onChange }: NumberPadProps) {
  const handleDigit = (digit: string) => {
    const currentStr = value === 0 ? "" : value.toString();
    if (currentStr.length >= 11) return; // Cap at Rp 99.000.000.000

    if (digit === "000") {
      if (value === 0) return;
      onChange(parseInt(currentStr + "000", 10));
    } else {
      onChange(parseInt(currentStr + digit, 10));
    }
  };

  const handleDelete = () => {
    const currentStr = value.toString();
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      onChange(parseInt(currentStr.slice(0, -1), 10));
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full text-center py-4 my-2 bg-gray-50 rounded-2xl border border-gray-100">
        <span className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
          {formatCurrency(value)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => handleDigit(btn)}
            className="h-14 bg-gray-100/80 active:bg-gray-200 rounded-2xl text-xl font-semibold text-[#1D1D1F] transition-all flex items-center justify-center cursor-pointer"
          >
            {btn}
          </button>
        ))}
        <button
          type="button"
          onClick={handleDelete}
          className="h-14 bg-gray-100/80 active:bg-gray-200 rounded-2xl text-xl font-semibold text-gray-500 transition-all flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Write `apps/web/src/components/ui/PinInput.tsx`**

```tsx
import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";

export interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export function PinInput({ value, onChange, length = 6, disabled = false }: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="flex flex-col items-center" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits.slice(0, length));
        }}
        disabled={disabled}
        className="opacity-0 absolute -z-10 w-0 h-0"
        autoFocus
      />
      <div className="flex gap-4 my-6">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-200",
                filled
                  ? "bg-[#007AFF] border-[#007AFF] scale-110"
                  : "bg-transparent border-gray-300"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Write `apps/web/src/components/ui/SegmentedControl.tsx`**

```tsx
import { cn } from "../../lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex p-1 bg-gray-200/70 rounded-xl relative",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer",
              active
                ? "bg-white text-[#1D1D1F] shadow-sm scale-[0.99]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10: Write `apps/web/src/components/ui/ProgressBar.tsx` and `EmptyState.tsx`**

`apps/web/src/components/ui/ProgressBar.tsx`:
```tsx
import { cn } from "../../lib/cn";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  className?: string;
}

export function ProgressBar({ progress, color = "#007AFF", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className={cn("w-full bg-gray-100 rounded-full h-2 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
```

`apps/web/src/components/ui/EmptyState.tsx`:
```tsx
import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-6">
      <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-[#1D1D1F]">{title}</h4>
      <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 11: Write `apps/web/src/components/layout/BottomNav.tsx`**

```tsx
import { NavLink } from "react-router";
import { LayoutDashboard, ArrowLeftRight, HandCoins, Settings } from "lucide-react";

export function BottomNav() {
  const tabs = [
    { to: "/", label: "Ringkasan", icon: LayoutDashboard },
    { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
    { to: "/debts", label: "Hutang", icon: HandCoins },
    { to: "/settings", label: "Setelan", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 apple-blur border-t border-black/[0.04] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                  isActive
                    ? "text-[#007AFF] font-bold scale-105"
                    : "text-gray-400 hover:text-gray-600 font-medium"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 12: Write `apps/web/src/components/layout/AppShell.tsx`**

```tsx
import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-between max-w-md mx-auto relative shadow-sm">
      <main className="flex-1 pb-24 pt-safe px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
```

---

### Task 11: Auth State & PIN Setup/Login Screens

**Files:**
- Create: `apps/web/src/hooks/useAuth.tsx`
- Create: `apps/web/src/pages/PinSetup.tsx`
- Create: `apps/web/src/pages/PinLogin.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write `apps/web/src/hooks/useAuth.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";

interface AuthStatus {
  isSetup: boolean;
  isLoggedIn: boolean;
  lockedUntil: string | null;
}

interface AuthContextType {
  isSetup: boolean;
  isLoggedIn: boolean;
  lockedUntil: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (pin: string) => Promise<void>;
  setup: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSetup, setIsSetup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await apiFetch<AuthStatus>("/api/auth/status");
      setIsSetup(data.isSetup);
      setIsLoggedIn(data.isLoggedIn);
      setLockedUntil(data.lockedUntil);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (pin: string) => {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    await refresh();
  };

  const setup = async (pin: string) => {
    await apiFetch("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    await refresh();
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{ isSetup, isLoggedIn, lockedUntil, loading, refresh, login, setup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

- [ ] **Step 2: Write `apps/web/src/pages/PinSetup.tsx`**

```tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { PinInput } from "../components/ui/PinInput";
import { ShieldCheck } from "lucide-react";

export function PinSetup() {
  const { setup } = useAuth();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setError(null);
    if (pin.length === 6) {
      setTimeout(() => setStep("confirm"), 200);
    }
  };

  const handleConfirmPin = async (pin: string) => {
    setConfirmPin(pin);
    setError(null);
    if (pin.length === 6) {
      if (pin !== firstPin) {
        setError("PIN tidak cocok! Silakan coba lagi.");
        setConfirmPin("");
        return;
      }
      setLoading(true);
      try {
        await setup(pin);
      } catch (err: any) {
        setError(err.message || "Gagal membuat PIN");
        setConfirmPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-16 h-16 bg-blue-50 text-[#007AFF] rounded-3xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h2>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan data keuangan pribadi Anda."
          : "Masukkan kembali 6-digit PIN yang Anda buat tadi."}
      </p>

      <PinInput
        value={step === "create" ? firstPin : confirmPin}
        onChange={step === "create" ? handleFirstPin : handleConfirmPin}
        disabled={loading}
      />

      {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
      {loading ? <p className="text-sm text-gray-400 mt-2">Menyimpan PIN...</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/web/src/pages/PinLogin.tsx`**

```tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { PinInput } from "../components/ui/PinInput";
import { Lock } from "lucide-react";

export function PinLogin() {
  const { login, lockedUntil } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePin = async (inputPin: string) => {
    setPin(inputPin);
    setError(null);
    if (inputPin.length === 6) {
      setLoading(true);
      try {
        await login(inputPin);
      } catch (err: any) {
        setError(err.message || "PIN salah");
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 text-[#1D1D1F] rounded-3xl flex items-center justify-center mb-6">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Masukkan PIN</h2>
      <p className="text-sm text-gray-500 mt-2">Buka catatan keuangan Anda</p>

      {lockedUntil ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold mt-6 max-w-xs">
          Aplikasi terkunci karena beberapa kali salah PIN. Silakan tunggu hingga{" "}
          {new Date(lockedUntil).toLocaleTimeString("id-ID")}.
        </div>
      ) : (
        <>
          <PinInput value={pin} onChange={handlePin} disabled={loading} />
          {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update `apps/web/src/App.tsx` with Auth routing guard**

```tsx
import { Routes, Route } from "react-router";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { PinSetup } from "./pages/PinSetup";
import { PinLogin } from "./pages/PinLogin";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Debts } from "./pages/Debts";
import { Settings } from "./pages/Settings";

function AppRoutes() {
  const { isSetup, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F7]">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSetup) {
    return <PinSetup />;
  }

  if (!isLoggedIn) {
    return <PinLogin />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
```

---

### Task 12: Dashboard Page

**Files:**
- Create: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Write `apps/web/src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { formatCurrency, relativeDate } from "../lib/format";
import { DashboardSummary, WalletWithBalance } from "@my-finance/shared";
import { Wallet, ArrowDownRight, ArrowUpRight, HandCoins, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, wlt] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary"),
          apiFetch<WalletWithBalance[]>("/api/wallets"),
        ]);
        setSummary(sum);
        setWallets(wlt);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-3xl" />
        <div className="h-32 bg-white rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Ikhtisar Keuangan</p>
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-0.5">
          {formatCurrency(summary?.total_balance || 0)}
        </h1>
      </div>

      {/* Monthly Flow Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-emerald-50/50 border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-xs font-semibold">Pemasukan</span>
          </div>
          <p className="text-base font-bold text-emerald-700">
            {formatCurrency(summary?.month_income || 0)}
          </p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-100">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-semibold">Pengeluaran</span>
          </div>
          <p className="text-base font-bold text-rose-700">
            {formatCurrency(summary?.month_expense || 0)}
          </p>
        </Card>
      </div>

      {/* Wallets Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Dompet & Rekening</h2>
          <Link to="/settings" className="text-xs text-[#007AFF] font-medium flex items-center">
            Kelola <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {wallets.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 bg-white rounded-2xl w-full text-center">
              Belum ada dompet. Tambahkan di menu Setelan.
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[140px] bg-white rounded-2xl p-4 border border-black/[0.03] apple-card-shadow flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: w.color || "#007AFF" }}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 truncate">{w.name}</span>
                </div>
                <span className="text-sm font-extrabold text-[#1D1D1F]">
                  {formatCurrency(w.current_balance)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debt & Receivable Quick Highlight */}
      <Link to="/debts">
        <Card className="p-4 flex items-center justify-between bg-amber-50/50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Status Hutang & Piutang</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Hutang: <b>{formatCurrency(summary?.total_debt || 0)}</b> • Piutang:{" "}
                <b>{formatCurrency(summary?.total_receivable || 0)}</b>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600" />
        </Card>
      </Link>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Transaksi Terakhir</h2>
          <Link to="/transactions" className="text-xs text-[#007AFF] font-medium">
            Semua
          </Link>
        </div>
        <div className="space-y-2">
          {summary?.recent_transactions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-2xl">
              Belum ada transaksi
            </p>
          ) : (
            summary?.recent_transactions.map((tx) => (
              <Card key={tx.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1D1D1F]">
                    {tx.category_name || (tx.type.includes("transfer") ? "Transfer Saldo" : "Umum")}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {tx.wallet_name} • {relativeDate(tx.date)}
                  </p>
                </div>
                <span
                  className={`text-xs font-extrabold ${
                    tx.type === "income" || tx.type === "transfer_in"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 13: Transactions Page

**Files:**
- Create: `apps/web/src/pages/Transactions.tsx`

- [ ] **Step 1: Write `apps/web/src/pages/Transactions.tsx`**

```tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { formatCurrency, relativeDate } from "../lib/format";
import {
  TransactionWithDetails,
  WalletWithBalance,
  Category,
} from "@my-finance/shared";
import { Plus, Trash2, ArrowRightLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Transactions() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [txs, wts, cats] = await Promise.all([
        apiFetch<TransactionWithDetails[]>("/api/transactions"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
      ]);
      setTransactions(txs);
      setWallets(wts);
      setCategories(cats);
      if (wts.length > 0) {
        setWalletId(wts[0].id);
        if (wts.length > 1) setTargetWalletId(wts[1].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (amount <= 0) return alert("Masukkan nominal transaksi");
    if (!walletId) return alert("Pilih dompet");

    setLoading(true);
    try {
      if (type === "transfer") {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: "transfer",
            source_wallet_id: walletId,
            target_wallet_id: targetWalletId,
            amount,
            date,
            note,
          }),
        });
      } else {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            wallet_id: walletId,
            category_id: categoryId || null,
            type,
            amount,
            date,
            note,
          }),
        });
      }
      setIsAddOpen(false);
      setAmount(0);
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Riwayat Transaksi</h1>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Catat
        </Button>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12">Belum ada transaksi yang dicatat.</p>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    tx.type === "income"
                      ? "bg-emerald-500"
                      : tx.type === "expense"
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : tx.type === "expense" ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1D1D1F]">
                    {tx.note || tx.category_name || (tx.type.includes("transfer") ? "Transfer" : "Lainnya")}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {tx.wallet_name} • {relativeDate(tx.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-extrabold ${
                    tx.type === "income" || tx.type === "transfer_in"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Input Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Catat Transaksi"
      >
        <div className="space-y-4">
          <SegmentedControl
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
              { value: "transfer", label: "Transfer" },
            ]}
            value={type}
            onChange={(val) => setType(val as any)}
          />

          <NumberPad value={amount} onChange={setAmount} />

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Dompet</label>
              <select
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            {type === "transfer" ? (
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Dompet Tujuan</label>
                <select
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Kategori</label>
                <select
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">(Pilih Kategori)</option>
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
                <input
                  type="text"
                  placeholder="Opsional"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handleCreate} loading={loading} className="mt-4">
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
```

---

### Task 14: Debts Page (Hutang & Piutang with Cicilan Tracking)

**Files:**
- Create: `apps/web/src/pages/Debts.tsx`

- [ ] **Step 1: Write `apps/web/src/pages/Debts.tsx`**

```tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatCurrency, formatDate } from "../lib/format";
import { DebtWithRemaining, WalletWithBalance } from "@my-finance/shared";
import { Plus, Trash2, CheckCircle2, ChevronRight, User } from "lucide-react";

export function Debts() {
  const [debts, setDebts] = useState<DebtWithRemaining[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [activeTab, setActiveTab] = useState<"debt" | "receivable">("debt");

  // Create Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  // Payment Modal
  const [selectedDebt, setSelectedDebt] = useState<DebtWithRemaining | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payWalletId, setPayWalletId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [allDebts, wts] = await Promise.all([
        apiFetch<DebtWithRemaining[]>("/api/debts"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
      ]);
      setDebts(allDebts);
      setWallets(wts);
      if (wts.length > 0) setPayWalletId(wts[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!personName) return alert("Masukkan nama orang/pihak");
    if (totalAmount <= 0) return alert("Masukkan nominal yang valid");

    setLoading(true);
    try {
      await apiFetch("/api/debts", {
        method: "POST",
        body: JSON.stringify({
          person_name: personName,
          type: activeTab,
          total_amount: totalAmount,
          due_date: dueDate || null,
          note: note || null,
        }),
      });
      setIsAddOpen(false);
      setPersonName("");
      setTotalAmount(0);
      setDueDate("");
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat hutang/piutang");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedDebt) return;
    if (payAmount <= 0) return alert("Masukkan nominal cicilan");
    if (!payWalletId) return alert("Pilih dompet pembayaran");

    setLoading(true);
    try {
      await apiFetch(`/api/debts/${selectedDebt.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          wallet_id: payWalletId,
          amount: payAmount,
          payment_date: payDate,
          note: payNote || null,
        }),
      });
      setIsPayOpen(false);
      setPayAmount(0);
      setPayNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal memproses pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini beserta seluruh riwayat cicilannya?")) return;
    try {
      await apiFetch(`/api/debts/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDebts = debts.filter((d) => d.type === activeTab);

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Hutang & Piutang</h1>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Catat
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: "debt", label: "Hutang Saya (Kewajiban)" },
          { value: "receivable", label: "Piutang (Hak Saya)" },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12">
            Belum ada catatan {activeTab === "debt" ? "hutang" : "piutang"}.
          </p>
        ) : (
          filteredDebts.map((item) => {
            const isSettled = item.status === "settled" || item.remaining_amount <= 0;
            const progress = (item.paid_amount / item.total_amount) * 100;

            return (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1D1D1F]">{item.person_name}</p>
                      {item.due_date ? (
                        <p className="text-[10px] text-gray-400">Jatuh tempo: {formatDate(item.due_date)}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSettled ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedDebt(item);
                          setPayAmount(item.remaining_amount);
                          setIsPayOpen(true);
                        }}
                      >
                        {activeTab === "debt" ? "Bayar" : "Terima"}
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">
                      Sisa: <b className="text-[#1D1D1F]">{formatCurrency(item.remaining_amount)}</b>
                    </span>
                    <span className="text-gray-400">Total: {formatCurrency(item.total_amount)}</span>
                  </div>
                  <ProgressBar
                    progress={progress}
                    color={activeTab === "debt" ? "#FF9500" : "#34C759"}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Debt Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={activeTab === "debt" ? "Catat Hutang Baru" : "Catat Piutang Baru"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">
              {activeTab === "debt" ? "Berhutang Ke Siapa?" : "Siapa Yang Berhutang?"}
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi, Bank Mandiri"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </div>

          <NumberPad value={totalAmount} onChange={setTotalAmount} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Jatuh Tempo</label>
              <input
                type="date"
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
              <input
                type="text"
                placeholder="Opsional"
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button size="lg" onClick={handleCreate} loading={loading} className="mt-4">
            Simpan Catatan
          </Button>
        </div>
      </BottomSheet>

      {/* Payment Modal */}
      <BottomSheet
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={activeTab === "debt" ? "Bayar Cicilan Hutang" : "Terima Pembayaran Piutang"}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Pihak: <b>{selectedDebt?.person_name}</b> (Sisa hutang:{" "}
            {formatCurrency(selectedDebt?.remaining_amount || 0)})
          </p>

          <NumberPad value={payAmount} onChange={setPayAmount} />

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">
                {activeTab === "debt" ? "Bayar Pakai Dompet" : "Terima Ke Dompet"}
              </label>
              <select
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                value={payWalletId}
                onChange={(e) => setPayWalletId(e.target.value)}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
                <input
                  type="text"
                  placeholder="Cicilan ke-..."
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handlePay} loading={loading} className="mt-4">
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
```

---

### Task 15: Settings Page

**Files:**
- Create: `apps/web/src/pages/Settings.tsx`

- [ ] **Step 1: Write `apps/web/src/pages/Settings.tsx`**

```tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { formatCurrency } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { WalletWithBalance, Category } from "@my-finance/shared";
import { Wallet, Tag, LogOut, Plus, Trash2, Info } from "lucide-react";

export function Settings() {
  const { logout } = useAuth();
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Add Wallet Modal
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [wName, setWName] = useState("");
  const [wType, setWType] = useState<"bank" | "cash" | "ewallet">("bank");
  const [wBalance, setWBalance] = useState(0);

  // Add Category Modal
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cType, setCType] = useState<"expense" | "income">("expense");

  const loadData = async () => {
    try {
      const [wts, cats] = await Promise.all([
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
      ]);
      setWallets(wts);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWallet = async () => {
    if (!wName) return alert("Masukkan nama dompet");
    try {
      await apiFetch("/api/wallets", {
        method: "POST",
        body: JSON.stringify({
          name: wName,
          type: wType,
          initial_balance: wBalance,
        }),
      });
      setIsWalletOpen(false);
      setWName("");
      setWBalance(0);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!cName) return alert("Masukkan nama kategori");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: cName, type: cType }),
      });
      setIsCatOpen(false);
      setCName("");
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    try {
      await apiFetch(`/api/wallets/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Setelan Aplikasi</h1>

      {/* Section Wallets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Wallet className="w-4 h-4" /> Dompet & Rekening
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsWalletOpen(true)}>
            <Plus className="w-4 h-4 mr-0.5" /> Tambah
          </Button>
        </div>
        <Card className="p-2 divide-y divide-gray-100">
          {wallets.map((w) => (
            <div key={w.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1D1D1F]">{w.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{w.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-gray-700">
                  {formatCurrency(w.current_balance)}
                </span>
                <button
                  onClick={() => handleDeleteWallet(w.id)}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Section Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Tag className="w-4 h-4" /> Kategori Transaksi
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsCatOpen(true)}>
            <Plus className="w-4 h-4 mr-0.5" /> Tambah
          </Button>
        </div>
        <Card className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c.id}
                className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700"
              >
                {c.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Section Info */}
      <Card className="p-4 flex items-center gap-3 bg-blue-50/50 border-blue-100">
        <Info className="w-5 h-5 text-[#007AFF]" />
        <div className="text-xs text-gray-600">
          <p className="font-bold text-[#1D1D1F]">My Finance PWA v1.0</p>
          <p className="text-[11px] text-gray-400">Deployed on Cloudflare Workers & D1</p>
        </div>
      </Card>

      {/* Logout */}
      <Button variant="danger" size="lg" onClick={logout}>
        <LogOut className="w-4 h-4 mr-2" /> Kunci Aplikasi (Logout)
      </Button>

      {/* Add Wallet Modal */}
      <BottomSheet
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        title="Tambah Dompet"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Dompet</label>
            <input
              type="text"
              placeholder="Contoh: BCA, Tunai, GoPay"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Tipe</label>
            <select
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={wType}
              onChange={(e) => setWType(e.target.value as any)}
            >
              <option value="bank">Bank</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Saldo Awal</label>
            <input
              type="number"
              placeholder="0"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              value={wBalance || ""}
              onChange={(e) => setWBalance(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <Button size="lg" onClick={handleAddWallet} className="mt-4">
            Simpan Dompet
          </Button>
        </div>
      </BottomSheet>

      {/* Add Category Modal */}
      <BottomSheet
        isOpen={isCatOpen}
        onClose={() => setIsCatOpen(false)}
        title="Tambah Kategori"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Kategori</label>
            <input
              type="text"
              placeholder="Contoh: Kopi, Laundry, Freelance"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Tipe</label>
            <select
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={cType}
              onChange={(e) => setCType(e.target.value as any)}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <Button size="lg" onClick={handleAddCategory} className="mt-4">
            Simpan Kategori
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
```

---

### Task 16: Deployment to Cloudflare (`finance.abdussalim.my.id`)

**Files:**
- Create: `apps/api/wrangler.toml`

- [ ] **Step 1: Create `apps/api/wrangler.toml`**

```toml
name = "my-finance"
compatibility_date = "2024-12-01"
pages_build_output_dir = "../web/dist"

[[d1_databases]]
binding = "DB"
database_name = "my-finance-db"
database_id = "REPLACE_WITH_ACTUAL_DATABASE_ID"
```

- [ ] **Step 2: Install Wrangler CLI globally**

Run: `npm i -g wrangler`

- [ ] **Step 3: Login to Cloudflare**

Run: `wrangler login`

- [ ] **Step 4: Create D1 Database**

Run: `wrangler d1 create my-finance-db`
Copy the generated `database_id` and replace `REPLACE_WITH_ACTUAL_DATABASE_ID` in `apps/api/wrangler.toml`.

- [ ] **Step 5: Apply database schema & seed data**

```powershell
wrangler d1 execute my-finance-db --remote --file=apps/api/src/db/schema.sql
wrangler d1 execute my-finance-db --remote --file=apps/api/src/db/seed.sql
```

- [ ] **Step 6: Set JWT_SECRET in Cloudflare Pages**

```powershell
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
echo $secret | wrangler pages secret put JWT_SECRET --project-name=my-finance
```

- [ ] **Step 7: Build fullstack monorepo**

Run: `pnpm build`
Expected: Builds `packages/shared`, `apps/web` (Vite PWA), and `apps/api` (esbuild to `apps/web/dist/_worker.js`).

- [ ] **Step 8: Deploy to Cloudflare Pages**

```powershell
wrangler pages deploy apps/web/dist --project-name=my-finance
```

- [ ] **Step 9: Connect Custom Domain `finance.abdussalim.my.id`**

1. Go to Cloudflare Dashboard -> **Workers & Pages** -> **my-finance**.
2. Select **Custom domains** tab -> **Set up a custom domain**.
3. Input `finance.abdussalim.my.id` and click **Activate domain**.
4. Cloudflare will automatically provision SSL certificate and configure DNS CNAME.
