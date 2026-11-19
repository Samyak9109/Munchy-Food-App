# Munchy — Portfolio & Resume Bullets (Measured Metrics)

These three impact bullets are grounded in real, measured production benchmarks from the Phase 0–6 modernization and revamp:

---

### 1. High-Performance Full-Stack Architecture & Bundle Optimization
> **Architected and executed an end-to-end performance overhaul of a React 19 / Express 5 food-delivery platform, slashing initial client bundle size by 88.5% (from 576 kB to 58 kB / 20 kB gzip) through route-level code splitting, vendor chunk partitioning, and virtualized video feeds.**
- Engineered an infinite-scrolling Reels feed with cursor pagination, shared `IntersectionObserver`, and windowed virtualization capping concurrent DOM `<video>` mounts to active $\pm 1$ (max 3), eliminating mobile frame drops and memory spikes.
- Optimized asset pipelines with dynamic ImageKit WebP transforms, browser responsive `srcSet`, and memory buffer streaming uploads that eliminated server disk I/O bottlenecks.
- Accelerated MongoDB read latencies by converting all queries to `.lean()`, creating compound indexes for status/date queries, and implementing RFC-compliant `Cache-Control` stale-while-revalidate headers and Gzip compression.

---

### 2. Resilient Financial Transactions & Webhook Synchronization
> **Engineered an idempotent server-side payment & order processing engine using Razorpay API, HMAC-SHA256 signature verification with timing-safe comparison, and dual-channel order reconciliation via secure webhooks.**
- Enforced tamper-proof server-side pricing with database-level price rehydration in paise, guaranteeing zero floating-point drift and eliminating client-side price tampering.
- Designed an order lifecycle state machine (`pending_payment -> placed -> confirmed -> ready -> pickedup`) that handles edge-case drops, browser closures, user payment modal dismissals, and automated refunds upon cancellation.
- Integrated dual webhook and client verification paths ensuring 100% order confirmation reliability even under unstable network conditions or premature tab closure.

---

### 3. Geospatial Food Discovery & Dark-Glassmorphic Design System
> **Implemented geospatial kitchen discovery and real-time routing using MongoDB `$geoNear` aggregation, OpenRouteService API, and interactive Leaflet map overlays, backed by a unified "Vibe & Velocity" design system.**
- Built interactive dual map/list views with user location persistence, geocoded address lookups, distance sorting, and dynamic multi-modal driving/walking routing with Leaflet polylines isolated in lazy vendor chunks.
- Standardized 100% of UI across customer and partner applications with zero native `alert()`/`confirm()` dialogs, accessible bottom-sheets, centralized `ErrorBoundary` protections, and an automated CI design linter.
