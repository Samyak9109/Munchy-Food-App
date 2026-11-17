# Munchy — Performance Plan

Goal: fast first load, smooth reels, no jank on mid-range phones, snappy API even on free hosting.

## 1. Baseline (measured or read from code)
| Item | Value / finding | Source |
|------|-----------------|--------|
| Initial JS | 412.88 kB (127.95 kB gzip), single chunk | `vite build` |
| CSS | 60.79 kB (9.98 kB gzip) | `vite build` |
| Code splitting | None. All pages imported eagerly in `App.jsx`, auth, user, and partner code ship to everyone | `[verified]` |
| Images | 14 `<img>` tags, 0 with `loading="lazy"` | `[verified]` |
| Image transforms | None. Full-size ImageKit URLs used | `[verified]` |
| Reels feed | Loads all reels in one call. Renders a `<video>` per reel at once. No `preload` attribute, no poster | `[verified]` `getAllReelsDAO` has no limit |
| Backend queries | 0 uses of `.lean()`. Several `populate` chains. No pagination on food and reels | `[verified]` |
| Indexes | Store 2dsphere, Like, Favourite, Review, unique emails only | `[verified]` |
| Compression | None (`compression` not installed) | `[verified]` |
| Caching headers | None | `[verified]` |
| Polling | OrderDetail (conditional), Partner dashboard 15 s, Partner orders 10 s | `[verified]` |
| Upload memory | multer memory storage, 50 MB cap, plus temp-file write before ImageKit upload | `[verified]` |
| Backdrop blur | 2 uses: ReelsPage, StorePage | `[verified]` |
| Fonts | Google Fonts CSS, Montserrat 4 weights + Inter 3 weights | `[verified]` |

## 2. Targets
| Metric | Target |
|--------|--------|
| Lighthouse mobile performance (`/kitchens`, throttled) | ≥ 90 |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Initial JS (login or home route) | ≤ 90 kB gzip |
| Total JS after full navigation | ≤ 250 kB gzip |
| API p95, warm, list endpoints | < 300 ms |
| Reel start after swipe | < 500 ms on 4G |
| Memory while scrolling 50 reels | No growth beyond 3 mounted videos |

Targets are goals. Record real numbers in README after measuring.

## 3. Measure
```
# bundle
cd frontend && npm run build        # note sizes
npx vite-bundle-visualizer          # or rollup-plugin-visualizer

# lighthouse (mobile, throttled)
npx lighthouse https://<pages-domain>/kitchens --form-factor=mobile --only-categories=performance

# api latency
npx autocannon -c 10 -d 15 https://<pages-domain>/api/stores
```
Use Chrome DevTools Performance panel for reels scroll. Check "Layers" for blur cost. Save before and after numbers in `docs/perf-results.md`.

## 4. Frontend tasks

- [ ] **PERF-01 (P1) Route-level code splitting.**
  Files: `frontend/src/App.jsx`, `vite.config.js`.
  Change: `React.lazy` + `Suspense` per page. Group by area: auth, user, partner. Suspense fallback is a skeleton from `components/ui`. `manualChunks`: `react` (react, react-dom, react-router), `query` (TanStack), `vendor` rest. Map libraries (`leaflet`, `react-leaflet`) only inside lazy map components.
  Accept: login route loads ≤ 90 kB gzip JS. Partner code not fetched for users. Build output shows multiple chunks.

- [ ] **PERF-02 (P1) Reels feed rewrite.**
  Files: `frontend/src/pages/user/ReelsPage.jsx`, `ReelsPage.module.css`, `api`, backend reel controller and DAO (see PERF-10).
  Change:
  - `useInfiniteQuery` with page size 5 and cursor by `createdAt`/`_id`.
  - One shared `IntersectionObserver` (threshold 0.6). Track active index.
  - Mount `<video src>` only for active index ±1. Others render poster image only.
  - `preload="metadata"` on neighbors, `preload="auto"` on active. `muted`, `playsInline`, `loop`. Pause on `visibilitychange`.
  - Poster from ImageKit thumbnail of the video or food image `[verify ImageKit video thumbnail URL form]`.
  - `React.memo(ReelCard)` with stable callbacks.
  - CSS: scroll snap (`scroll-snap-type: y mandatory`), `height: 100dvh`, `contain: layout paint` on each reel, `will-change` only on the active card.
  - Remove `backdrop-filter` from overlays that sit over playing video. Use a solid translucent `--scrim` gradient.
  - Comments load only when opened (already so, keep).
  Accept: at most 3 videos mounted at any time. Swipe feels immediate. Memory flat across 50 reels.

- [ ] **PERF-03 (P2) Image pipeline.**
  Files: new `frontend/src/lib/img.js`, all components with `<img>` or background images.
  Change: `img(url, {w, h, q = 75})` appends ImageKit `tr=w-<w>,h-<h>,q-<q>,f-auto` (preserve existing query). Use `srcSet` for 1x and 2x on cards. Every `<img>` gets `width`, `height`, `loading="lazy"`, `decoding="async"`, and meaningful `alt`. First visible image on a page uses `loading="eager"` and `fetchpriority="high"`. Replace CSS `background: url()` for food images in `ReelCard` with `<img>`.
  Accept: no layout shift on image load. Image bytes per card drop sharply (record before/after).

- [ ] **PERF-04 (P2) Query tuning.**
  Files: `frontend/src/App.jsx` and hooks.
  Change: `staleTime` per data type: stores and food 2 min, reels 1 min, cart and orders 0 with refetch on focus. `gcTime` 10 min. `retry: 1`, no retry on 4xx. `refetchOnWindowFocus: false` for stores, food, reels. Prefetch store data on card hover or touchstart. Use `placeholderData: keepPreviousData` for filtered lists. Optimistic updates for cart quantity and favourite.
  Accept: no duplicate requests on navigation (Network panel). Back navigation feels instant.

- [ ] **PERF-05 (P2) Render hygiene.**
  Change: memoize list items (`StoreCard`, `FoodCard`, `ReelCard`, `OrderRow`). Debounce search input 300 ms. Avoid creating objects or functions inline in lists. Move `QueryClient` out of render (already module-level, keep). Check with React Profiler: no full-page re-render on a single like or cart change.
  Accept: Profiler shows isolated re-renders.

- [ ] **PERF-06 (P2) Fonts.**
  Change: self-host Montserrat and Inter variable fonts via `@fontsource-variable/*` or WOFF2 files. `font-display: swap`. Preload the two used files. Remove unused weights. Drop the Google Fonts links.
  Accept: no third-party font request. No layout jump on load.

- [ ] **PERF-07 (P2) Perceived speed.**
  Change: skeletons instead of spinners (from `UI-05`). Preconnect to ImageKit origin in `index.html`. Keep-alive ping plus a "waking server" toast if the first API call exceeds 4 s (Render cold start).
  Accept: no blank screen longer than 100 ms on any route.

- [ ] **PERF-08 (P3) Polling hygiene.**
  Change: partner polling only while document is visible (`refetchIntervalInBackground: false`). Back off to 30 s when no pending orders. Keep OrderDetail conditional polling, stop at terminal statuses. Later option: Server-Sent Events.
  Accept: no requests while tab hidden.

- [ ] **PERF-09 (P3) Cloudflare caching.**
  Change: `public/_headers` with `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`, `no-cache` for `/index.html`. Proxy function never caches `/api/*` except explicit public GETs (see PERF-12).
  Accept: repeat visit loads assets from cache.

## 5. Backend tasks

- [ ] **PERF-10 (P1) Paginate and slim queries.**
  Files: `dao/reel.dao.js`, `dao/food.dao.js`, `dao/store.dao.js`, controllers.
  Change: `limit` (default 10, max 30) and cursor or `page`. Add `.select()` for list views. Add `.lean()` to every read-only DAO. Return `{items, nextCursor}`. `getAllReelsDAO` returns `likedByMe` (lookup in Like for current user) and `likes`. Replace deep `populate` with minimal fields.
  Accept: reels list returns ≤ 5 items per call. Payload size drops. Response time recorded before/after.

- [ ] **PERF-11 (P1) Indexes.** Verify field names against models, then add:
  - Food: `{store:1, isAvailable:1}`, `{category:1, isAvailable:1}`
  - Order: `{user:1, createdAt:-1}`, `{store:1, status:1, createdAt:-1}`
  - Payment: `{order:1}` unique, `{gatewayOrderId:1}`
  - Reel: `{createdAt:-1}`, `{store:1, createdAt:-1}`
  - Comment: `{reel:1, createdAt:-1}`
  - Cart: `{user:1}` unique
  - Session: lookup fields used by refresh and logout
  Run `explain()` on top queries. Confirm index use.
  Accept: no collection scans on list and detail queries.

- [ ] **PERF-12 (P2) HTTP caching.**
  Change: ETag stays on (Express default). `Cache-Control: public, max-age=30, stale-while-revalidate=120` on public GETs that do not depend on the user (store list without distance, food by store). `private, no-store` on cart, orders, auth.
  Accept: repeat call returns 304 or cached.

- [ ] **PERF-13 (P2) Compression and payload.**
  Change: `compression` middleware (SEC-02). JSON limit 100 kB. Strip unused fields from responses.
  Accept: gzip on JSON responses.

- [ ] **PERF-14 (P2) Store listing query.**
  `[verify]` `getAllStoresDAO` appeared to filter in application code during audit. Confirm exact filters. Move filters to the Mongo query. With `lat/lng` use `$geoNear` (MAP-05). Text search uses a text index or anchored regex on name and cuisine.
  Accept: filtering happens in DB. Query uses index.

- [ ] **PERF-15 (P2) Upload path.**
  Files: `middlewares/multer.middleware.js`, `services/storage.service.js`.
  Change: cap video 25 MB, images 5 MB. Remove temp-file write. Pass the buffer to the ImageKit SDK directly (use the SDK's file helper for buffers `[verify helper name in @imagekit/nodejs 7.x]`). Free Render instance has 512 MB, so avoid concurrent large buffers: allow one video upload at a time per user.
  Accept: upload works without touching disk. Memory stays stable under repeated uploads.

- [ ] **PERF-16 (P3) Connection and cold start.**
  Change: reuse one Mongoose connection. `maxPoolSize` 10. `serverSelectionTimeoutMS` 5000. Lazy-load the LangChain and AI modules on first chatbot call (heavy import) to cut boot time. Keep boot log of startup duration.
  Accept: cold start time recorded. Chatbot first call still works.

- [ ] **PERF-17 (P3) Slow query log.** Log any request over 500 ms with route and duration.
  Accept: log line appears for a deliberately slow route.

## 6. Order of execution
1. PERF-01, PERF-10, PERF-11 (largest wins, lowest risk).
2. PERF-02 (reels), PERF-03 (images).
3. PERF-04, PERF-05, PERF-06, PERF-13, PERF-14.
4. Rest.
Re-measure after each group. Write numbers to `docs/perf-results.md`.

## 7. Do not
- Do not add heavy animation libraries.
- Do not blur large areas over video.
- Do not fetch all reels, stores, or foods in one call.
- Do not cache anything user-specific in the proxy or CDN.
