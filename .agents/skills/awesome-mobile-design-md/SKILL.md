---
name: awesome-mobile-design-md
description: Use when designing, redesigning, or evaluating mobile UI for React Native, iOS, Android, PWA, or mobile web applications. Provides 10 curated mobile design systems (soft-glass, data-dashboard, nova-mobile, material-clean, midnight-pro, playful-color, content-first, card-heavy, enterprise-neutral, minimal-brutalist) covering color tokens, typography scales, 4px spacing rhythm, safe area layouts, touch targets, bottom sheets, floating navigation, and micro-interactions.
source: https://github.com/TrustOtc/awesome-mobile-design-md
tags: [mobile, design-system, pwa, ios, android, ui-tokens, tailwind, styling]
verified: true
---

# Awesome Mobile DESIGN.md Systems

A curated collection of mobile-first design system specifications for AI-generated UI. Each specification provides complete, production-ready tokens for color systems, typography scales, spacing grids, layout and safe areas, touch targets, component anatomy, motion timings, and platform adaptations.

---

## 1. Quick Style Selector

Select the design system that best fits the application category:

| System File | Visual Style | Best For |
|-------------|--------------|----------|
| `design-md/data-dashboard.md` | Dense, analytical, metric-led, high numeric contrast | Financial trackers, analytics, budgeting, crypto, operational metrics |
| `design-md/soft-glass.md` | iOS-inspired glassmorphism, translucent surfaces, layered blur, soft glows | Premium consumer apps, personal finance, lifestyle, Apple aesthetic |
| `design-md/nova-mobile-design-md.md` | Clean, balanced, native-feeling modern mobile UI | General-purpose utilities, MVPs, clean productivity apps |
| `design-md/material-clean.md` | Material Design 3 inspired, tonal containers, systematic elevation | Android-first apps, cross-platform productivity, operations |
| `design-md/midnight-pro.md` | Dark-first, sharp, high-contrast, modern power-user aesthetic | Pro tools, trading, developer tools, dark-mode native experiences |
| `design-md/playful-color.md` | Vibrant accents, rounded squircle surfaces, joyful micro-interactions | Social, habits, wellness, gamified fintech, education |
| `design-md/card-heavy.md` | Modular card-first feed, clear section partitioning | Marketplaces, feeds, multi-account overview, discovery |
| `design-md/content-first.md` | Minimalist, typography-dominated, distraction-free | Reading, documentation, transaction statements, notes |
| `design-md/enterprise-neutral.md` | Restrained, high-clarity, minimal decoration | B2B, audit logs, compliance, invoice approvals |
| `design-md/minimal-brutalist.md` | High-contrast black/white, sharp borders, zero blur | High-utility, editorial, raw minimalist products |

---

## 2. Core Implementation Rules for Mobile & PWA

Regardless of the selected style, every mobile interface MUST adhere to these foundational rules:

### 2.1 Touch Targets & Interaction
- **Minimum interactive target**: 44×44 pt (iOS) or 48×48 dp (Android / Web).
- **Active press feedback**: `active:scale-[0.97]` or `active:opacity-80` with smooth transition (`transition: transform 120ms ease, opacity 120ms ease`).
- **Haptic/Visual feedback**: Interactive elements must change appearance instantly on touch without hover-dependent indicators.

### 2.2 Safe Area & Viewport Handling
- Respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- Use dynamic viewport units (`100dvh` / `h-dvh`) instead of `100vh` to avoid mobile address bar jump.
- Bottom floating navigation and bottom sheets must add safe-area bottom padding (`pb-[env(safe-area-inset-bottom,16px)]`).

### 2.3 Typography & Numbers
- **Numbers are primary heroes in financial/data apps**: Use tabular figures (`font-variant-numeric: tabular-nums` / `font-mono` / `tabular-nums`) to prevent jitter when values update.
- Align currencies and numbers consistently (right-aligned in lists/tables, centered or prominent in summary cards).
- Use strict typographic hierarchy:
  - Metric Hero: 28–34px / Bold (Tracking tight)
  - Screen Title: 20–24px / SemiBold
  - Section Header: 14–16px / SemiBold (Text secondary or uppercase tracking-wider)
  - Body / Row Text: 14–15px / Regular or Medium
  - Caption / Metadata: 12–13px / Regular

### 2.4 Spacing Rhythm (Base Unit 4px)
- `xs`: 4px | `sm`: 8px | `md`: 12px | `lg`: 16px | `xl`: 20–24px | `xxl`: 32px
- Consistent horizontal page margin: 16px to 20px (`px-4` or `px-5`).
- Group closely related fields with 8px–12px gaps; separate distinct sections with 20px–24px gaps.

### 2.5 Components Anatomy
1. **Metric & Wallet Cards**:
   - Rounded corners: `rounded-2xl` or `rounded-3xl` (16px–24px).
   - Clear visual grouping: Label, large prominent balance, secondary comparison/percentage or account detail.
2. **Bottom Sheets & Modals**:
   - Slide up from bottom with backdrop blur (`backdrop-blur-md bg-black/40`).
   - Grabber handle at the top (36×4px rounded pill, `bg-muted` / `bg-neutral-300`).
   - Clean dismissal via drag down, close icon, or tapping backdrop.
3. **Floating Bottom Navigation**:
   - Persistent, accessible thumb-zone navigation.
   - Glassmorphic or solid elevated bar with blur: `backdrop-blur-xl bg-surface/80 border border-white/20`.
   - Distinct active tab states with subtle pill background or vibrant icon accent.
4. **Number Pad & Amount Input**:
   - Prominent large display of entered currency amount.
   - Grid layout (`grid-cols-3 gap-2`) with comfortable 56–64px touch height per key.

---

## 3. How to Apply to a Project

1. Copy the desired style file (e.g., `design-md/data-dashboard.md` or `design-md/soft-glass.md`) to the project root as `DESIGN.md`.
2. Configure Tailwind CSS variables / classes matching the color tokens (`--background`, `--surface`, `--surface-elevated`, `--primary`, `--text-primary`, `--text-secondary`, `--positive`, `--negative`).
3. Refactor layouts and pages according to the chosen style's component guidelines.
4. Verify on mobile viewport widths (360px, 390px, 428px) and test touch interactions.
