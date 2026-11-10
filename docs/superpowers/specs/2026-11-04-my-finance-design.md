# My Finance — Design Spec

> Personal finance tracker PWA deployed on Cloudflare.
> Domain: `finance.abdussalim.my.id`

## Architecture

```
Monorepo (pnpm workspace + Turborepo)
├── apps/web    → React 19 + Vite + Tailwind CSS + vite-plugin-pwa
├── apps/api    → Hono on Cloudflare Pages Functions + D1
└── packages/shared → Zod schemas + TypeScript types
```

**Deploy:** Single Cloudflare Pages project. Static frontend served by Pages CDN (unlimited bandwidth). API routes handled by Pages Functions (internally Cloudflare Workers). One project, one deploy command.

**Database:** Cloudflare D1 (SQLite at the edge). Free tier: 5GB storage, 5M reads/day, 100K writes/day.

**API Communication:** Hono RPC client (`hc`) for end-to-end type safety between frontend and backend.

## Authentication

- **Single-user Master PIN** (4-6 digits).
- PIN hashed with **PBKDF2** (100,000 iterations) via Web Crypto API, stored in `auth_config` table.
- Session: **JWT** in `httpOnly` cookie, `SameSite=Strict`, `Secure=true`.
- **Brute force protection:** Max 5 failed attempts per 15 minutes. After 5 failures, account locked for 15 minutes. Counter stored in `auth_config`.
- First visit: PIN setup screen (no default PIN).

## Database Schema

All monetary values stored as **INTEGER in Rupiah** (no decimals). All dates as ISO 8601 TEXT. IDs are `nanoid` strings.

### wallets
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | nanoid |
| name | TEXT NOT NULL | "BCA", "Tunai", "GoPay" |
| type | TEXT NOT NULL | "bank", "cash", "ewallet" |
| icon | TEXT | emoji or icon name |
| color | TEXT | hex color |
| initial_balance | INTEGER DEFAULT 0 | starting balance at wallet creation |
| created_at | TEXT | datetime('now') |

**Current balance** is computed on-read: `initial_balance + SUM(income + transfer_in) - SUM(expense + transfer_out)`.

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | nanoid |
| name | TEXT NOT NULL | "Makan", "Transport", "Gaji" |
| type | TEXT NOT NULL | "expense" or "income" |
| icon | TEXT | emoji or icon name |
| color | TEXT | hex color |

Pre-seeded with common Indonesian categories on first setup.

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | nanoid |
| wallet_id | TEXT FK → wallets | required |
| category_id | TEXT FK → categories | null for transfers |
| type | TEXT NOT NULL | "income", "expense", "transfer_in", "transfer_out" |
| amount | INTEGER NOT NULL | always positive |
| transfer_pair_id | TEXT | links two rows of a transfer |
| date | TEXT NOT NULL | "2026-11-04" |
| note | TEXT | optional description |
| created_at | TEXT | datetime('now') |

**Transfers:** A transfer from Wallet A to Wallet B creates two rows sharing the same `transfer_pair_id`. Both inserted in a single D1 batch (atomic).

### debts
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | nanoid |
| person_name | TEXT NOT NULL | who owes / is owed |
| type | TEXT NOT NULL | "debt" (I owe them) or "receivable" (they owe me) |
| total_amount | INTEGER NOT NULL | original amount |
| due_date | TEXT | optional deadline |
| status | TEXT DEFAULT 'unpaid' | "unpaid", "partially_paid", "settled" |
| note | TEXT | optional |
| created_at | TEXT | datetime('now') |

**remaining_amount** computed on-read: `total_amount - COALESCE(SUM(debt_payments.amount), 0)`.
**status** updated by API when payment is recorded (if remaining = 0 → settled, else partially_paid).

### debt_payments
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | nanoid |
| debt_id | TEXT FK → debts | required |
| wallet_id | TEXT FK → wallets | which wallet was used |
| amount | INTEGER NOT NULL | payment amount |
| payment_date | TEXT NOT NULL | date of payment |
| note | TEXT | optional |
| created_at | TEXT | datetime('now') |

### auth_config
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK DEFAULT 'main' | singleton row |
| pin_hash | TEXT NOT NULL | PBKDF2 hash |
| salt | TEXT NOT NULL | random salt |
| failed_attempts | INTEGER DEFAULT 0 | brute force counter |
| locked_until | TEXT | lock expiry datetime |

### Indexes
```sql
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_type ON debts(type);
```

## API Routes

All under `/api` prefix. Protected by PIN auth middleware (except `/api/auth/*`).

```
POST   /api/auth/setup          → Set initial PIN
POST   /api/auth/login          → Verify PIN, return session cookie
POST   /api/auth/logout         → Clear session cookie
GET    /api/auth/status         → Check if PIN is set, session valid

GET    /api/wallets             → List wallets with computed balances
POST   /api/wallets             → Create wallet
PUT    /api/wallets/:id         → Update wallet
DELETE /api/wallets/:id         → Delete wallet (only if no transactions)

GET    /api/categories          → List categories
POST   /api/categories          → Create category
PUT    /api/categories/:id      → Update category
DELETE /api/categories/:id      → Delete category

GET    /api/transactions        → List transactions (filterable by wallet, category, date range)
POST   /api/transactions        → Create transaction (or transfer pair)
PUT    /api/transactions/:id    → Update transaction
DELETE /api/transactions/:id    → Delete transaction (or transfer pair)

GET    /api/debts               → List debts/receivables with computed remaining
POST   /api/debts               → Create debt/receivable
PUT    /api/debts/:id           → Update debt
DELETE /api/debts/:id           → Delete debt (cascade payments)

GET    /api/debts/:id/payments  → List payments for a debt
POST   /api/debts/:id/payments  → Record payment (updates debt status)
DELETE /api/debts/:id/payments/:pid → Delete payment

GET    /api/dashboard/summary   → Aggregated: total balance, month income/expense, debt totals
```

## UI Design: Apple-style Organic Minimalism

### Design Tokens
- **Font:** `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif`
- **Border Radius:** 16px (cards), 12px (buttons), 24px (modals)
- **Shadows:** `0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)`
- **Colors:**
  - Background: `#F5F5F7` (Apple warm gray)
  - Card: `#FFFFFF`
  - Text Primary: `#1D1D1F`
  - Text Secondary: `#86868B`
  - Accent Green (income): `#34C759`
  - Accent Red (expense): `#FF3B30`
  - Accent Blue (transfer): `#007AFF`
  - Accent Orange (debt): `#FF9500`
- **Backdrop Blur:** `backdrop-filter: blur(20px) saturate(180%)` for header/bottom nav
- **Transitions:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (Apple easing)
- **Spacing:** 8px base grid

### Navigation (Bottom Tab Bar)
4 tabs with glassmorphism bottom bar:
1. **Dashboard** — Total balance across wallets, monthly income vs expense summary chart, recent transactions.
2. **Transaksi** — Scrollable list grouped by date, FAB button to add, filter by wallet/category/date range.
3. **Hutang** — Segmented control: "Hutang Saya" | "Piutang", cards showing person, amount, remaining, progress bar, payment history.
4. **Pengaturan** — Manage wallets, categories, change PIN, app info.

### Key UI Patterns
- **Pull-to-refresh** on lists
- **Swipe-to-delete** with confirmation
- **Bottom sheet modals** for forms (not full-page navigations)
- **Haptic-style micro-animations** on button press
- **Number pad input** for amounts (calculator-style, not keyboard)
- **Empty states** with friendly illustrations

## PWA Configuration
- **Offline:** L1 — Cache app shell + static assets via service worker (Workbox). Data requires network.
- **Manifest:** `name: "My Finance"`, `short_name: "Finance"`, `theme_color: #F5F5F7`, `display: standalone`
- **Icons:** Generated at build time (192px, 512px, maskable)
- **Install prompt:** Custom banner after 2nd visit

## Currency
- Hardcoded **IDR (Rupiah)**.
- Format: `Rp 1.500.000` (dot as thousands separator, no decimals).
- All amounts stored as INTEGER (no floating point).

## Constraints & Non-Goals
- Single user only. No multi-user, no sharing.
- No multi-currency.
- No recurring transactions (v1).
- No data export (v1) — can be added later.
- No charts library (v1) — simple CSS-based progress bars and summary cards.
