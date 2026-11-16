# MyFinance Mobile DESIGN.md
*Theme: Obsidian Executive — Gestalt-Driven, High-Legibility Financial & Project Management System*

---

## 1. Design Philosophy & Vision

* **Calm, High-End Obsidian Canvas (`#0A0B10`)**:
  Eliminates visual fatigue ("tidak membuat mata cepat lelah"). Replaces noisy neon gradients, bright drop-shadows, and blurry radial blobs with a disciplined, executive dark mode. Text and metrics stand out with optical clarity against deep, solid surfaces.
* **Rigorous Application of Gestalt Laws**:
  1. **Law of Focal Point**: Every view has exactly ONE primary anchor that commands immediate visual attention (e.g. Net Worth on Dashboard; Portfolio Contract Value & Progress Bar on Projects; Nilai Proyek & Task Breakdown on Project Cockpit).
  2. **Law of Proximity**: Hierarchical whitespace where distance communicates relationship. Grouped elements have 4–8px margins, while distinct logical blocks have 24px+ separation (minimum 2x whitespace rule).
  3. **Law of Common Region**: Clean, unified surface cards (`#12141D` with subtle `rgba(255, 255, 255, 0.07)` border) neatly package related content into unambiguous cards without loud borders.
  4. **Law of Similarity**: Interactive buttons, category pills, and task list items share uniform geometry, typography scale, and touch target sizes (minimum 44x44px).
  5. **Law of Figure / Ground**: Maximum legibility with pure white text (`#FFFFFF`) and soft slate secondary text (`#94A3B8`) against clean dark surfaces without blurry visual distractions.
  6. **Squint Test Verified**: Blurring the viewport reveals clear, calm functional blocks rather than scattered, competing points of light.

---

## 2. Multi-Venture Project Management System

### 2.1 Core Capabilities
Designed specifically for entrepreneur multi-venture operational management, seeded with active ventures:
1. **EDUNUSA** (`EDU`): Educational platform & vocational tech initiative.
2. **SOBATPART** (`SOB`): Automotive / spare-parts distribution enterprise.
3. **ISTANA BLOCK** (`IBL`): Paving block, concrete & construction manufacturing.

### 2.2 Key Project Metrics
* **Nilai Proyek (Contract / Project Value)**:
  Target omset or total contract commitment for the venture (e.g., Rp 150.000.000 for EDUNUSA, Rp 220.000.000 for SOBATPART, Rp 380.000.000 for ISTANA BLOCK).
* **Progress Fisik Proyek (%)**:
  Real-time completion percentage dynamically computed from completed tasks vs total tasks (`Math.round((completed_tasks / total_tasks) * 100)`).
* **Detail Pekerjaan: Selesai vs Tertunda (Tasks & Milestones)**:
  - **Pekerjaan Tertunda (Pending)**: Immediate action items, with priority tags (`Tinggi`, `Sedang`, `Rendah`), target deadlines, and an instant interactive checkbox to mark as completed with optimistic UI updates.
  - **Pekerjaan Selesai (Completed)**: Strikethrough completed log with completion timestamp.
  - **Filter Tabs**: Instant switching between `Semua`, `Tertunda`, and `Selesai`.
  - **Quick Add Task Box**: Fast, frictionless task entry form inside the Project Management Cockpit.
* **Keuangan & Realisasi Kas Proyek**:
  - Direct tracking of Uang Masuk (inflow / billing terms) vs Biaya Proyek (operational cost).
  - Net Profit and Margin % per project.
  - Linked transaction ledger with direct "+ Catat Transaksi Proyek" quick modal.

---

## 3. Color Tokens & Semantic Restraint

* **Canvas Void**: `#0A0B10` (Clean, solid dark obsidian)
* **Surface Card**: `#12141D` (Subdued, calm, opaque dark slate)
* **Surface Elevated / Control**: `#1A1D2B` / `#161925`
* **Hairline Border**: `rgba(255, 255, 255, 0.07)`
* **Text High Contrast**: `#FFFFFF` (Headings, primary metrics, active amounts)
* **Text Secondary**: `#94A3B8` (Descriptions, subtitles, project details)
* **Text Muted / Timestamp**: `#64748B` (Secondary dates, helper labels)
* **Single Primary Accent**: `#4F46E5` / `#6366F1` (Indigo — used with restraint for primary CTA)
* **Semantic Signatures**:
  * **Positive / Selesai / Pemasukan**: `#10B981` (Emerald)
  * **Negative / Biaya / Pengeluaran**: `#EF4444` (Red / Rose)
  * **Warning / Tertunda / Jatuh Tempo**: `#F59E0B` (Amber)

---

## 4. Typography & Numerical Precision

* **Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
* **Tabular Numeric Precision**: `font-variant-numeric: tabular-nums` ensures numbers never jitter during state updates.
* **Currency Standard**: Indonesian Rupiah format without decimals (`Rp 1.500.000`).
* **Ergonomics**: Minimum tap target size of `44x44px` across all buttons, segmented controls, and keypad buttons.
