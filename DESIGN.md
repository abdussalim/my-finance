# MyFinance Mobile DESIGN.md
*Theme: Electric Indigo & Cool Chalk (Silicon Valley / Stripe / Linear Aesthetic)*

## 1. Design Principles

* **Sharp, Modern & Tech-Forward**: Inspired by the precision and confidence of modern Silicon Valley tools (Stripe, Linear, Wise). High typographic clarity, deliberate hierarchy, and zero generic template artifacts.
* **Distinctive Color Identity**: Replaces generic corporate blues with Deep Ultramarine (`#4338CA`), Cool Chalk canvas (`#F4F6FB`), Crisp Teal for cash inflow (`#0D9488`), and Vivid Crimson/Coral for cash outflow (`#E11D48`).
* **High Information Density**: Dense, analytical data dashboard layout. Numbers, cashflows, and debt progress take center stage with tabular numeric alignment (`font-variant-numeric: tabular-nums`).
* **Tactile Micro-Interactions**: Active press feedback (`active:scale-[0.98]`), instant keyboard response, and smooth sheet transitions.
* **Safe-Area Native & Mobile Optimized**: Clean docked bottom bar, dynamic viewport units (`100dvh`), `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` compliance.

---

## 2. Color System: Electric Indigo & Cool Chalk

### 2.1 Base Palette

* **Primary / Brand**: `#4338CA` (Deep Ultramarine / Indigo 700)
  * Hover / Focus: `#3730A3` (Indigo 800)
  * Active: `#312E81` (Indigo 900)
  * Light Container / Accent: `#EEF2FF` (Indigo 50)
  * Border Accent: `#C7D2FE` (Indigo 200)
* **Electric Accent**: `#6366F1` (Electric Indigo) & `#06B6D4` (Cyber Cyan)
* **Background / Canvas**: `#F4F6FB` (Cool Chalk / Ice Slate — clean, modern, crisp contrast)
* **Surface**: `#FFFFFF` (Pure white metric cards & panels)
* **Surface Alt**: `#F8FAFC` / `#EEF2FF` (Secondary containers & chip backgrounds)
* **Border Hairline**: `#E2E8F0` / `#E0E7FF` (Crisp 1px cool border)
* **Text Primary**: `#0F172A` (Midnight Slate 900 — maximum contrast for figures)
* **Text Secondary**: `#475569` (Slate 600 — labels & secondary descriptions)
* **Text Muted / Caption**: `#64748B` (Slate 500 — timestamps & helper hints)

### 2.2 Semantic Financial Roles

* **Inflow / Pemasukan / Piutang**: `#0D9488` (Teal 600) & `#059669` (Emerald 600)
  * Container / Badge: `#F0FDF4` / `#CCFBF1` (Teal/Emerald 50)
  * Text Badge: `#0F766E` (Teal 700)
* **Outflow / Pengeluaran / Utang**: `#E11D48` (Vivid Crimson / Rose 600)
  * Container / Badge: `#FFF1F2` (Rose 50)
  * Text Badge: `#BE123C` (Rose 700)
* **Warning / Jatuh Tempo**: `#D97706` (Amber 600)
  * Container / Badge: `#FFFBEB` (Amber 50)
  * Text Badge: `#B45309` (Amber 700)
* **Transfer / Netral**: `#4338CA` (Indigo 700)
  * Container / Badge: `#EEF2FF` (Indigo 50)

---

## 3. Typography & Numbers

* **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
* **Numbers**: Tabular figures throughout (`font-variant-numeric: tabular-nums`, `tabular-nums`) to ensure numbers never jitter during updates.
* **Currency Standard**: Indonesian Rupiah format without decimals (`Rp 1.500.000`).

### Type Scale

* **Large Metric**: `28–32px` / Bold (`font-extrabold tracking-tight text-slate-900`)
* **Card Metric**: `18–22px` / Bold
* **Title**: `16–18px` / SemiBold
* **Body / Row Item**: `14–15px` / Medium
* **Caption / Label**: `11–12px` / SemiBold uppercase tracking-wider
* **Small**: `10–11px` / Medium

---

## 4. Spacing & Layout Rhythm

* **Base Grid**: 4px base (`xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 20px`, `xxl: 24px`).
* **Page Padding**: 16px horizontal screen margin (`px-4 sm:px-5`).
* **Bottom Scroll Clearance**: `pb-24` ensuring docked bottom bar never covers content.
* **Component Radius**: 14–16px (`rounded-xl` to `rounded-2xl`) for cards; 10–12px for buttons.

---

## 5. Components Anatomy

### 5.1 Docked Bottom Navigation Bar
* Docked at screen bottom: `fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white border-t border-slate-200/80 pb-safe shadow-[0_-2px_12px_rgba(15,23,42,0.03)]`.
* Height: 58px.
* Active item: `#4338CA` (Indigo 700) text & icon with electric top accent indicator.
* Inactive item: `#64748B`.

### 5.2 Metric & Summary Cards
* Card base: Pure white background `#FFFFFF`, 1px border `#E2E8F0`, subtle shadow `0 1px 3px rgba(15, 23, 42, 0.04)`.
* Hero card accent: Electric indigo micro-badge or top accent.
* Cashflow split: Teal `#0D9488` for Pemasukan, Crimson `#E11D48` for Pengeluaran.
* Ratio Bar: Visual bar showing ratio of income vs expense in real-time.

### 5.3 NumberPad & Form Inputs
* Keypad buttons: Clean crisp border `#E2E8F0` on white, active state `#EEF2FF`.
* Preset amount chips: `#EEF2FF` background with `#4338CA` text.
* Action buttons: Primary `#4338CA` with subtle glow shadow `0 2px 8px -1px rgba(67, 56, 202, 0.25)`.
