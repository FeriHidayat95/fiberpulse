# FiberPulse Enterprise Design System Specification

This document defines the single source of truth (SSOT) for the UI/UX architecture, visual identity, typography, component hierarchy, and responsive layout standards for the FiberPulse Operations Platform.

---

## 1. Brand Identity & Color Palette

### 1.1 Core Colors
* **Canvas Background:** `#F8FAFC` (Clean Slate 50)
* **Card Surface:** `#FFFFFF` (Pure White)
* **Card Border:** `#E2E8F0` / `#E2EBF4` (Subtle 1px border)
* **Brand Primary Navy:** `#152C4A` (Deep Enterprise Navy)
* **Brand Accent Azure:** `#42A1D3` (Bright Sky Blue)
* **Brand Action Blue:** `#2563EB` (Solid Royal Action Blue)
* **Hero Banner Gradient:** `linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)`
* **Signature Brand Gradient:** `linear-gradient(135deg, #152C4A 0%, #2563EB 100%)`
  * Applied consistently to: **Active Navigation Items**, **Primary Action Buttons (`+ New Order`)**, and **User Avatar Box**.

### 1.2 Status & Telemetry Palette
* **Success (Active / Online / Completed):** `bg-emerald-50 text-emerald-700 border-emerald-200`
* **Warning (In Progress / Pending / Near Full):** `bg-amber-50 text-amber-700 border-amber-200`
* **Maintenance / Info:** `bg-blue-50 text-blue-700 border-blue-200`
* **Danger (Fault / LOS Drop / Capacity Full):** `bg-rose-50 text-rose-700 border-rose-200`

### 1.3 ODP Capacity Spectrum
* **Available (<80%):** `#10B981` (Emerald Green)
* **Near Full (80% - 99%):** `#F59E0B` (Amber Yellow)
* **Full (100%):** `#EF4444` (Rose Red)

---

## 2. Typography System (Meta Enterprise Standards)

FiberPulse adopts Meta's enterprise product design system typography standards (Astryx & Meta Business Suite specification), prioritizing optical clarity, high x-height, and semantic type tokens.

### 2.1 Font Family Stacks
* **Primary Interface Stack (Meta System Sans):**
  `"Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
* **Headline & Display Stack:**
  `"Optimistic Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
* **Technical & Telemetry Monospace Stack:**
  `"SF Mono", "JetBrains Mono", "Roboto Mono", Menlo, Consolas, monospace`
  *(Strictly utilized for: IP Addresses, MAC addresses, Serial Numbers (SN), Optical Rx Power dBm, Work Order IDs, and Port Matrix indices)*

### 2.2 Typographic Hierarchy & Scale (1.2 Geometric Scale)
* **Page Title (Display / H1):** `text-lg sm:text-xl font-bold text-[#152C4A] tracking-tight` (18px - 20px, Leading: 24px)
* **Card & Section Header (H2/H3):** `text-xs sm:text-sm font-semibold text-[#152C4A] tracking-normal` (13px - 14px, Leading: 18px)
* **Metric Hero Numbers:** `text-xl sm:text-2xl font-bold text-[#152C4A] tracking-tight` (22px - 24px, Tabular figures)
* **Body / Table Cells:** `text-xs font-normal sm:font-medium text-slate-700` (12px - 13px, Leading: 16px)
* **Meta Secondary Subtext & Timestamps:** `text-[11px] text-slate-500 font-normal` (11px, Leading: 14px)
* **Status Badges & Matrix Labels:** `text-[10px] font-semibold tracking-wider uppercase` (10px)

### 2.3 Strict Typography Rules
1. **Zero Emojis Policy:** Absolute zero emojis in UI buttons, tables, cards, and system status to maintain a high-end corporate enterprise look. All visual cues use clean Lucide SVG icons.
2. **Tabular Numerics:** All network metrics, throughputs, and fiber power levels use monospace tabular figures (`JetBrains Mono` / `SF Mono`) to prevent layout jitter on live WebSocket updates.
3. **No Faux Italics:** In accordance with Meta Horizon & Astryx guidelines, oblique/italic text is avoided in operational dashboards to preserve high-contrast readability.

---

## 3. Layout & Navigation Architecture

### 3.1 Shell Architecture
* **Sidebar:** 
  * Fixed 240px width (`w-60`), white background, subtle right border (`border-r border-slate-200`).
  * Top of sidebar contains the Logo Box (`h-16 flex items-center px-5 gap-2.5`) with FiberPulse brand symbol and typography.
  * Navigation items start immediately below the logo box with no empty gap.
  * Responsive: Automatically slides out as a drawer with a dark backdrop on mobile viewports (`< 768px`).
* **Topbar:**
  * Height 64px (`h-16`), white background, bottom border (`border-b border-slate-200`).
  * Perfectly flush and level with the sidebar logo.
  * Left: Mobile hamburger menu toggle (hidden on desktop).
  * Right: Notification Bell (with telemetry alert badge), quick search trigger, and **Clickable Profile Pill Box (`Admin User • System Administrator`)** with an interactive dropdown menu.

### 3.2 Viewport & Grid Responsiveness
* **5-Metric Card Grid:** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`
* **Split Grid (Telemetry & Dispatch Feeds):** `grid grid-cols-1 lg:grid-cols-3 gap-4`
* **Tables:** Wrapped in `overflow-x-auto min-w-full` with `-webkit-overflow-scrolling: touch` to ensure smooth horizontal swipe on small screens without breaking the main layout.

---

## 4. Standardized Components

### 4.1 Buttons
* **Primary Button:**
  ```html
  <button class="bg-gradient-to-r from-[#152C4A] to-[#2563EB] text-white font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-slate-900/10 hover:opacity-95 active:scale-98 transition">
    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
    <span>New Order</span>
  </button>
  ```
* **Secondary / Outline Button:**
  ```html
  <button class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition active:scale-98 shadow-2xs">
    <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-500"></i>
    <span>Refresh</span>
  </button>
  ```
* **Link / Action Trigger:**
  ```html
  <button class="text-xs font-semibold text-[#2563EB] hover:underline">
    View All →
  </button>
  ```

### 4.2 Cards & Panels
* Clean white background, 12px rounded corners (`rounded-xl`), 1px slate border (`border border-slate-200`), subtle micro-shadow (`shadow-xs`), generous 16px padding (`p-4`).

### 4.3 High-Density Data Tables
* Header: `bg-slate-50 text-slate-500 font-mono text-[10px] uppercase tracking-wider py-2.5 px-3.5 border-b border-slate-200`
* Cells: `py-2.5 px-3.5 text-xs text-slate-700 border-b border-slate-100`
* Hover state: `hover:bg-slate-50 transition`

---

## 5. Performance & Quality Standards
1. **Zero Runtime Errors & Clean Build:** Must pass `npm run build` with zero compiler/linter warnings.
2. **Fast Load:** Lightweight asset footprint, tree-shaken Lucide icons, zero bloated third-party CSS.
3. **Decoupled Architecture:** React Query hooks, Leaflet GIS layers, QR scanner, and REST API contracts remain strictly decoupled.
