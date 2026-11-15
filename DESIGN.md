# MyFinance Mobile DESIGN.md
*Based on awesome-mobile-design-md (soft-glass & data-dashboard)*

## 1. Design Principles

* **Clarity First**: Numbers are the hero. Balances, cashflow, and debt progress must be instantly readable at a glance.
* **Apple Minimalist Organic**: Soft frosted glass (`backdrop-blur-xl`), layered translucency, subtle borders (`rgba(15, 23, 42, 0.06)`), and generous rounded radii (`rounded-2xl` to `rounded-3xl`).
* **Calm & Confident**: No loud visual clutter or unnecessary decorative elements. Every color indicates financial meaning (positive, negative, alert, or neutral).
* **Frictionless Mobile-First**: 48dp+ thumb targets, floating navigation pill, ergonomic bottom sheets, and rapid numeric inputs with quick shortcuts.
* **Safe-Area Native**: Dynamic viewport units (`100dvh`), `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` compliance on all iOS and Android devices.

---

## 2. Color System

### 2.1 Palette Tokens

* **Primary**: `#007AFF` (iOS System Blue) / `#2563EB` (Electric Blue)
* **Background**: `#F6F8FA` (Soft cool porcelain canvas)
* **Surface (Glass)**: `rgba(255, 255, 255, 0.82)` with `backdrop-filter: blur(20px)`
* **Surface Elevated**: `rgba(255, 255, 255, 0.95)` with soft shadow
* **Surface Subtle**: `rgba(241, 245, 249, 0.7)` (Slate 100 tint)
* **Text Primary**: `#0F172A` (Slate 900, high contrast for numbers)
* **Text Secondary**: `#64748B` (Slate 500, metadata & labels)
* **Text Muted**: `#94A3B8` (Slate 400, timestamps & hints)
* **Border Glass**: `rgba(15, 23, 42, 0.06)` (Subtle perimeter)
* **Border Focused**: `rgba(0, 122, 255, 0.4)` (Active focus ring)

### 2.2 Semantic Financial Colors

* **Positive (Pemasukan / Piutang)**: `#10B981` (Emerald 500) / Background `#ECFDF5`
* **Negative (Pengeluaran / Utang)**: `#F43F5E` (Rose 500) / Background `#FFF1F2`
* **Warning (Jatuh Tempo)**: `#F59E0B` (Amber 500) / Background `#FEF3C7`
* **Transfer (Pindah Saldo)**: `#6366F1` (Indigo 500) / Background `#EEF2FF`

---

## 3. Typography & Numbers

* **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif`
* **Numerical Formatting**: Always tabular (`font-variant-numeric: tabular-nums`, `tabular-nums`) to prevent horizontal jitter when values update.
* **Currency Standard**: Indonesian Rupiah format without decimals (`Rp 1.500.000`).

### Type Scale

* **Hero Metric**: `32px` / Bold (`tracking-tight font-extrabold`)
* **Card Value**: `20–22px` / Bold (`font-bold`)
* **Section Title**: `15–16px` / SemiBold (`text-slate-800 font-semibold`)
* **Caption / Label**: `11–12px` / Medium (`text-slate-400 uppercase tracking-wider font-semibold`)
* **Body / Row Item**: `14–15px` / Medium (`text-slate-700`)
* **Footnote**: `11–12px` / Regular (`text-slate-400`)

---

## 4. Spacing & Layout Rhythm

* **Base Grid**: 4px base (`xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `xxl: 32px`).
* **Page Margin**: `16px` to `20px` horizontal screen padding (`px-4 sm:px-5`).
* **Bottom Scroll Clearance**: `pb-28` to ensure the floating navigation bar never covers content.
* **Safe Areas**: `pt-[calc(env(safe-area-inset-top)+12px)]` and `pb-[calc(env(safe-area-inset-bottom)+12px)]`.

---

## 5. Components Anatomy

### 5.1 Floating Navigation Bar (Soft Glass Pill)
* Centered floating pill detached from screen edges: `fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-40`.
* Translucent glass: `bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-xl rounded-full px-2 py-1.5`.
* Active item: Soft pill highlight (`bg-blue-50 text-[#007AFF] font-semibold`), icon scale `scale-105`.
* Inactive item: `text-slate-400 hover:text-slate-600`.

### 5.2 Glass Metric Cards
* `bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-black/[0.05] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]`.
* Interactive press state: `active:scale-[0.98] transition-all duration-150`.

### 5.3 Bottom Sheets (Modal Flows)
* Backdrop: `bg-black/35 backdrop-blur-sm animate-fade-in`.
* Container: `bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[92dvh] overflow-y-auto`.
* Handle grabber: `w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4`.
* Close button: Circular soft button `p-2 rounded-full bg-slate-100 hover:bg-slate-200`.

### 5.4 Number Pad & Quick Amounts
* Display: Big bold metric card with clear zero state.
* Quick preset pills: `+50rb`, `+100rb`, `+500rb`, `+1jt` for rapid logging.
* Keys: 56px height, `rounded-2xl bg-slate-100/80 active:bg-slate-200 text-xl font-semibold`.

### 5.5 Debt & Receivable Progress
* Visual progress bar indicating percentage paid (`h-2 rounded-full bg-slate-100 overflow-hidden`).
* Overdue indicator tag with icon (`bg-rose-50 text-rose-600 border border-rose-200`).
* Expandable payment history with seamless accordion drawer.
