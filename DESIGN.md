# MyFinance Mobile DESIGN.md
*Theme: Cyber-Obsidian & Holographic Neon (High-Immersive Dark OLED Fintech & Venture Terminal)*

---

## 1. Design Philosophy & Vision

* **Ultra-Immersive OLED Void (`#08090E`)**:
  Dissolves device bezels on modern AMOLED/OLED displays. Replaces sterile, flat white enterprise canvases with a deep, atmospheric space featuring ambient radial indigo and cyan optical flares.
* **Obsidian Frosted Glass Architecture**:
  Layered surfaces utilizing `rgba(17, 20, 29, 0.72)` to `rgba(22, 27, 40, 0.85)` with backdrop blurs (`backdrop-blur-md` to `backdrop-blur-xl`) and ultra-fine specular hairline edges (`border-white/[0.08]` to `border-white/[0.15]`).
* **Holographic Neon Chromatic Telemetry**:
  High-contrast luminous accents that give instant visual feedback:
  * **Electric Indigo / Violet** (`#6366F1` / `#8B5CF6`): Brand authority, primary interactions, venture portfolio telemetry.
  * **Neon Emerald** (`#10B981`): Inflow, profit, revenue targets, healthy margins.
  * **Cyber Cyan** (`#06B6D4`): Operational flow, liquidity, active transfers.
  * **Vivid Coral / Rose** (`#F43F5E`): Outflow, debt liabilities, high burn-rate warnings.
  * **Solar Amber** (`#F59E0B`): Approaching budget caps, upcoming debt maturities.
* **Haptic & Tactile Micro-Interactions**:
  Dynamic spring scales (`active:scale-[0.98]`), luminous pill active indicators, glowing top tab lines, and smooth spring bottom sheets.
* **Strict Edge Performance**:
  Engineered for Cloudflare Workers Free Tier execution (< 10ms CPU-bound). All project aggregation calculations are executed within single, index-backed SQLite queries on Cloudflare D1.

---

## 2. Color System & Design Tokens

### 2.1 Surface & Void Tokens
* **Void Background**: `#08090E` (OLED Deep Pitch Black)
* **Canvas Ambient Glow**:
  * Top-right radial: `radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 60%)`
  * Bottom-left radial: `radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 60%)`
* **Glass Card Base**: `rgba(17, 20, 29, 0.75)`
* **Glass Card Active / Elevated**: `rgba(22, 27, 40, 0.90)`
* **Glass Panel Hairline Border**: `rgba(255, 255, 255, 0.08)`
* **Glass Panel Highlight Border**: `rgba(255, 255, 255, 0.16)`

### 2.2 Text Hierarchy
* **Text High-Contrast / Headlines**: `#F8FAFC` (Slate 50 — maximum readability against obsidian)
* **Text Primary**: `#E2E8F0` (Slate 200 — card values and titles)
* **Text Secondary**: `#94A3B8` (Slate 400 — descriptive subtitles, project metrics)
* **Text Muted**: `#64748B` (Slate 500 — timestamps, table metadata)
* **Text Ghost**: `#475569` (Slate 600 — placeholder text, inactive tab labels)

### 2.3 Semantic Accents & Neon Signatures
* **Brand / Inflow**: `#10B981` (Neon Emerald)
  * Glow: `0 0 20px rgba(16, 185, 129, 0.35)`
  * Container: `rgba(16, 185, 129, 0.10)`
  * Border: `rgba(16, 185, 129, 0.25)`
* **Brand / Outflow**: `#F43F5E` (Neon Rose / Coral)
  * Glow: `0 0 20px rgba(244, 63, 94, 0.35)`
  * Container: `rgba(244, 63, 94, 0.10)`
  * Border: `rgba(244, 63, 94, 0.25)`
* **Brand / Primary Action**: `#6366F1` (Electric Indigo)
  * Glow: `0 0 24px rgba(99, 102, 241, 0.40)`
  * Container: `rgba(99, 102, 241, 0.12)`
  * Border: `rgba(99, 102, 241, 0.30)`

---

## 3. Multi-Venture Project Architecture

### 3.1 Business Context & Venture Registry
Designed specifically for entrepreneur multi-venture operational cashflow tracking, seeded with active ventures:
1. **EDUNUSA** (`EDU`): Educational platform & tech initiative (`#6366F1` Electric Indigo).
2. **SOBATPART** (`SOB`): Automotive / spare-parts distribution enterprise (`#06B6D4` Cyber Cyan).
3. **ISTANA BLOCK** (`IBL`): Paving block, concrete & construction manufacturing (`#F59E0B` Solar Amber).

### 3.2 Venture Metric Engine
For each project, the system tracks and computes in real-time:
* **Gross Inflow (Pendapatan)**: Total transactions tagged to the venture.
* **Gross Outflow (Biaya / Operasional)**: Total expenses allocated to the venture.
* **Net Profit / Margin %**: `((Inflow - Outflow) / Inflow) * 100`.
* **Budget Burn Rate**: `(Outflow / Allocated Budget) * 100` with warning thresholds (>80% amber, >100% coral).
* **Revenue Target Progress**: `(Inflow / Target Revenue) * 100` with luminous neon progress gauges.

### 3.3 Seamless Cross-Entity Flow
* **Bottom Navigation**: Direct access via 5 docked tabs:
  1. `Ringkasan` (`LayoutDashboard`) — Top-level consolidated portfolio overview & venture carousel.
  2. `Proyek` (`Briefcase`) — Dedicated multi-venture cockpit, individual cards, metrics, and linked transactions.
  3. `Transaksi` (`ArrowLeftRight`) — Global ledger with interactive venture filter chips and venture badges.
  4. `Hutang` (`HandCoins`) — Payables & receivables management.
  5. `Setelan` (`Settings`) — Security, PIN, and system preferences.
* **Fast-Tagging Modal**: When recording any income or expense, users can tag a specific project in a single tap via sleek obsidian chips.

---

## 4. Typography, Alignment & Formatting

* **Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
* **Tabular Numeric Precision**: `font-variant-numeric: tabular-nums` ensures numbers never jitter during state updates or animated recalculations.
* **Currency Standard**: Indonesian Rupiah format without decimals (`Rp 1.500.000`), formatted cleanly via `formatRupiah()`.
* **Mobile Touch Ergonomics**: Minimum tap target size of `44x44px` across all buttons, segmented controls, and keypad buttons.

---

## 5. Screen & Shell Guidelines

* **Container**: `max-w-md mx-auto min-h-dvh` pinned to center for responsive desktop viewports while feeling 100% native on mobile.
* **Docked Glass Navigation**: `fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0E121D]/85 backdrop-blur-xl border-t border-white/[0.08]`.
* **Safe-Area Insets**: Incorporates `pb-safe` and `pt-safe` for seamless edge-to-edge rendering under iOS/Android notch and gesture bars.
