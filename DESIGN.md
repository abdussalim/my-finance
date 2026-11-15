# MyFinance Mobile DESIGN.md
*Based on awesome-mobile-design-md (data-dashboard)*

## 1. Design Principles

* **Data-First**: UI strictly serves information. Balances, cashflows, and debt progress take center stage with zero decorative clutter.
* **High Information Density with Clarity**: Clean tabular presentation, compact spacing, and strong visual hierarchy allowing instant scanning and comparison.
* **Precision Over Decoration**: Eliminates heavy blurs and abstract shapes in favor of crisp 1px borders (`#E2E8F0`), high-contrast numbers, and functional semantic indicators.
* **Functional Color System**: Colors exist exclusively to indicate financial states (positive `#16A34A`, negative `#DC2626`, warning `#D97706`).
* **Safe-Area Native & Mobile Optimized**: Clean docked navigation, dynamic viewport units (`100dvh`), `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` compliance.

---

## 2. Color System

### 2.1 Light Mode Palette

* **Primary**: `#2563EB` (Dashboard Blue)
* **Background**: `#F8FAFC` (Slate 50 - clean analytical canvas)
* **Surface**: `#FFFFFF` (Pure white metric cards & panels)
* **Surface Alt**: `#F1F5F9` (Slate 100 - secondary containers & chip backgrounds)
* **Text Primary**: `#0F172A` (Slate 900 - maximum contrast for figures)
* **Text Secondary**: `#475569` (Slate 600 - labels & secondary descriptions)
* **Text Muted / Caption**: `#64748B` (Slate 500 - timestamps & helper hints)
* **Border**: `#E2E8F0` (Slate 200 - crisp structural boundaries)
* **Divider**: `#E5E7EB` (Slate 200)

### 2.2 Semantic Financial Roles

* **Positive (Pemasukan / Piutang)**: `#16A34A` (Green 600) | Background `#DCFCE7` (Green 100)
* **Negative (Pengeluaran / Utang)**: `#DC2626` (Red 600) | Background `#FEE2E2` (Red 100)
* **Warning (Jatuh Tempo)**: `#D97706` (Amber 600) | Background `#FEF3C7` (Amber 100)
* **Neutral / Transfer**: `#4F46E5` (Indigo 600) | Background `#EEF2FF` (Indigo 50)

---

## 3. Typography & Numbers

* **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
* **Numbers**: Tabular figures throughout (`font-variant-numeric: tabular-nums`, `tabular-nums`) to ensure numbers never jitter during updates.
* **Currency Standard**: Indonesian Rupiah format without decimals (`Rp 1.500.000`).

### Type Scale

* **Large Metric**: `28–32px` / Bold (`font-extrabold tracking-tight`)
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
* **Component Radius**: 12–16px (`rounded-xl` to `rounded-2xl`) for cards; 8–10px (`rounded-lg` / `rounded-xl`) for buttons.

---

## 5. Components Anatomy

### 5.1 Docked Bottom Navigation Bar
* Docked at screen bottom: `fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white border-t border-slate-200 pb-safe`.
* Height: 58px.
* Active item: `#2563EB` icon & bold label with subtle top border indicator or solid highlight.
* Inactive item: `#64748B`.

### 5.2 Metric Card (Core Component)
* Pure white surface with crisp 1px border: `bg-white border border-slate-200 rounded-2xl p-4 shadow-xs`.
* Top row: Label (uppercase 11px slate-500) + status pill.
* Middle: Large bold value (`text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums`).
* Bottom row: Subtext or trend indicator.

### 5.3 Bottom Sheets & Filters
* Backdrop: `bg-slate-900/40 backdrop-blur-xs`.
* Container: `bg-white border-t border-slate-200 rounded-t-2xl p-5 shadow-xl max-h-[90dvh] overflow-y-auto overscroll-contain`.
* Grabber handle: `w-9 h-1 rounded-full bg-slate-200 mx-auto mb-3`.

### 5.4 Functional Number Pad
* Large display card with crisp borders.
* Presets: `+50rb`, `+100rb`, `+500rb`, `+1jt` with high contrast borders.
* Keys: 50–54px height, `rounded-xl bg-slate-50 border border-slate-200 text-xl font-bold text-slate-800`.
