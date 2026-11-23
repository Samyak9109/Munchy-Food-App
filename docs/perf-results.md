# Munchy — Performance Results & Verification

Recorded during Phase 4 implementation on branch `phase-4-perf`.

## 1. Bundle Measurements (`vite build`)

| Metric | Before Phase 4 | After Phase 4 | Target | Status |
|---|---|---|---|---|
| **Initial JS (Main Chunk)** | 576.47 kB (176.91 kB gzip) | 55.82 kB (19.59 kB gzip) | ≤ 90 kB gzip | ✅ Passed |
| **Login Route Total JS** | 176.91 kB gzip | ~77 kB gzip | ≤ 90 kB gzip | ✅ Passed |
| **Code Splitting** | Single monolithic chunk | 17 route chunks + 4 vendor chunks | Multiple chunks | ✅ Passed |
| **Leaflet Map Bundle** | Included in main bundle | Code-split in `map-vendor` (46.13 kB gzip) | Lazy-only | ✅ Passed |
| **Partner Dashboard Code** | Shipped to all customers | Split into separate partner chunks | Never shipped to customer | ✅ Passed |
| **Vite Build Time** | ~1.3s | 942ms – 1.17s | Fast | ✅ Passed |

## 2. Reels Feed Virtualization (PERF-02)

- **Mounted Videos:** Capped at active index ± 1 (maximum 3 mounted `<video>` elements in DOM at any time).
- **Posters:** Inactive cards render lightweight ImageKit thumbnail `<img>` with `loading="lazy"` and `decoding="async"`.
- **Pagination:** Upgraded to TanStack `useInfiniteQuery` with cursor pagination (page size 5).
- **CSS Layers:** Removed `backdrop-filter: blur(8px)` over playing videos; replaced with hardware-efficient solid scrim `rgba(22, 22, 22, 0.82)`. Added `contain: layout paint` on cards and `will-change: transform` only on active reel.
- **Tab Switching:** Added `visibilitychange` listener to automatically pause active video when tab is hidden or backgrounded.

## 3. Database & Query Optimization (PERF-10, PERF-11, PERF-14)

- **Mongoose `.lean()`:** Added to all read queries across `store.dao.js`, `food.dao.js`, `reel.dao.js`, `order.dao.js`, `cart.dao.js`, `like.dao.js`, and `comment.dao.js`.
- **Store Filtering:** Moved from in-memory JavaScript filtering to native MongoDB queries with regex and status matching.
- **Compound Indexes Added:**
  - `food`: `{ store: 1, isAvailable: 1 }`, `{ category: 1, isAvailable: 1 }`
  - `order`: `{ user: 1, createdAt: -1 }`, `{ store: 1, status: 1, createdAt: -1 }`
  - `reel`: `{ createdAt: -1 }`, `{ store: 1, createdAt: -1 }`
  - `comment`: `{ reel: 1, createdAt: -1 }`
  - `cart`: `{ user: 1 }` (unique)
  - `session`: `{ refreshToken: 1, revoked: 1 }`, `{ userId: 1, revoked: 1 }`
  - `payment`: `{ gatewayOrderId: 1 }`, `{ user: 1, status: 1 }`

## 4. Media & Upload Pipeline (PERF-03, PERF-15)

- **Upload Streaming:** Eliminated temporary disk writes (`fs.writeFileSync`/`fs.createReadStream`); direct memory streaming using `@imagekit/nodejs` `toFile(file.buffer)` helper.
- **File Upload Limits:** Enforced 25 MB cap on videos and 5 MB cap on images. Added concurrency limiter for video uploads to avoid memory pressure on 512 MB Render free instances.
- **Image Transformations:** Added `frontend/src/lib/img.js` appending `tr=w-<w>,h-<h>,q-<q>,f-auto` to ImageKit URLs, with retina `srcSet` (1x and 2x), explicit width/height, `loading="lazy"`, and `decoding="async"`.

## 5. HTTP Caching, Polling & Network Hygiene (PERF-08, PERF-09, PERF-12, PERF-16, PERF-17)

- **HTTP Caching:** `Cache-Control: public, max-age=30, stale-while-revalidate=120` on public GET endpoints (`/api/store`, `/api/food`, `/api/reel`).
- **Privacy Protection:** `Cache-Control: private, no-cache, no-store, must-revalidate` on sensitive routes (`/api/cart`, `/api/order`, `/api/payment`, `/api/auth`, `/api/user`, `/api/dashboard`).
- **Cloudflare Edge Headers (`public/_headers`):** `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and `must-revalidate` for `/index.html`.
- **Polling Hygiene:** `refetchIntervalInBackground: false` across partner orders and dashboard; dynamic polling backoff to 30s when no pending orders are active.
- **Connection Optimization:** Mongoose `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`. Boot duration logged on server start. Slow request logger for requests > 500 ms.
