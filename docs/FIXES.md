# Munchy — Fixes and Revamp Plan (AI-executable)

How to use: follow `CLAUDE.md`. Do tasks in phase order. Tick `[ ]` when acceptance passes.
Severity: **P1** broken or unsafe. **P2** wrong or fragile. **P3** polish.
Evidence tags: `[verified]` read in code or measured. `[verify]` plausible, confirm before changing.

Audit baseline: frontend `npm run build` passes (JS 412.88 kB, 127.95 kB gzip; CSS 60.79 kB). ESLint clean. All backend modules import. Runtime not executed (no DB access in audit sandbox).

---

## Phase 0 — Safety and baseline (branch `phase-0-safety`)

- [ ] **SEC-01 (P1) Rotate all secrets** — manual, owner only.
  Real keys shipped inside the project zip: Mongo, Razorpay, Google, ImageKit, Gemini, OpenRouteService, email. Rotate every one. Create fresh local `.env`. Confirm `.env` is untracked: `git ls-files | grep -i "\.env"` returns only `*.example`.
  Accept: old keys revoked. New keys work locally.

- [ ] **CFG-01 (P2) Fail fast on missing env.** `[verified]` Razorpay keys are not in `requireEnv`.
  Files: `backend/src/config/config.js`.
  Change: `requireEnv` for Razorpay key id/secret, ImageKit keys, ORS key (`OPENROUTE_API_KEY` currently optional), JWT secrets. Add `RAZORPAY_WEBHOOK_SECRET`, `TAX_RATE` (default 0.05), `CORS_ORIGINS` (comma list). Update `.env.example`.
  Accept: boot without a required var prints the var name and exits 1.

- [ ] **SEC-02 (P2) Hardening middleware.** `[verified]` no helmet, no compression.
  Files: `backend/package.json`, `backend/src/app.js`.
  Change: add `helmet`, `compression`. `app.set('trust proxy', 1)`. `express.json({limit:'100kb'})`. CORS from `CORS_ORIGINS` allowlist with credentials. Add request logging (`pino-http` or `morgan`). Central error handler.
  Mount order: webhook raw-body route before `express.json` (see PAY-03).
  Accept: response headers include `x-content-type-options`. Responses gzip. Unknown origin rejected.

- [ ] **SEC-03 (P1) Fix rate limits.** `[verified]` `/auth/refresh` falls under `authLimiter` (10 per 15 min). General limit 100 per 15 min.
  Files: `backend/src/middlewares/rateLimit.middleware.js`, `backend/src/routes/auth.routes.js`.
  Change: strict limiter only on login, register, OTP verify/resend, forgot/reset. Refresh, logout, me use general limiter. General limit 300 per 15 min. Return JSON `{message}` on 429.
  Accept: 30 refresh calls in a minute succeed. 11 bad logins in 15 min return 429.

- [ ] **AUTH-01 (P1) Remove access token from OAuth redirect.** `[verified]` `googleAuthCallback` redirects to `/auth/success?token=...`.
  Files: `backend/src/controllers/auth.controller.js`, `frontend/src/pages/auth/AuthSuccessPage.jsx`, `frontend/src/api/auth.js`.
  Change: callback still calls `issueTokens` (sets refresh cookie) but redirects to `/auth/success?role=<role>`. `AuthSuccessPage` calls `POST /auth/refresh`, receives access token and account, calls `setAuth`, then navigates. Confirm refresh response includes the account object. If not, add it.
  Also fix: inactive account returns JSON 403 from a redirect flow. Redirect to `/auth/error?reason=inactive` instead.
  Accept: no token string in browser history or URL. Google login lands on home.

- [ ] **API-01 (P3) Health routes.** Add `GET /api/health` (no DB) and `GET /api/health/db` (ping).
  Accept: both return 200 JSON. Health route unaffected by rate limiter.

---

## Phase 1 — Orders and payments (branch `phase-1-payments`)

Reference: `ARCHITECTURE.md` section 2 (checkout flow, state machine, payment rules).

- [ ] **ORD-01 (P1) Server-side pricing.** `[verified]` order total taken from `cart.totalPrice`. `[verify]` item prices stored at add time. `[verified]` availability checked only at cart add (`cart.controller.js`). No open-store check in `order.controller.js`.
  Files: new `backend/src/services/pricing.service.js`, `order.controller.js`, `order.model.js`, `dao/order.dao.js`.
  Change: on order creation load Food documents by id. Reject if any is unavailable, missing, or from another store. Reject if store `isOpen` is false. Compute in paise: `subtotal`, `tax = round(subtotal * TAX_RATE)`, `total`. Persist `subtotal`, `tax`, `totalPrice` and per-item name, price, quantity snapshot.
  Add `GET /orders/preview` returning the same numbers without creating an order.
  Accept: tampering cart prices in DB does not change charge. Closed store returns 400. Response includes subtotal, tax, total.

- [ ] **ORD-02 (P1) `pending_payment` status.** `[verified]` order is created and cart cleared before payment.
  Files: `order.model.js` (add enum value), `order.controller.js`, `dao/order.dao.js`, partner order queries, `frontend/src/pages/user/OrdersPage.jsx`, `OrderDetailPage.jsx`.
  Change: online orders start as `pending_payment`. Cash orders start as `placed` and clear cart immediately. Cart clears for online orders only after verify or webhook success. Partner queries and partner analytics exclude `pending_payment`. User order list shows it with a "Pay now" button.
  Lazy expiry: when reading orders, any `pending_payment` older than 30 minutes becomes `cancelled`.
  Accept: close payment modal → order shows `pending_payment`, cart intact, partner sees nothing.

- [ ] **PAY-01 (P1) Initiate payment correctly.**
  Files: `backend/src/controllers/payment.controller.js`, `dao/payment.dao.js`, `models/payment.model.js`.
  Change: confirm order belongs to `req.user` and is `pending_payment`. Amount = `Math.round(order.totalPrice * 100)` (or use stored paise). Idempotent: if a pending Payment exists for the order, reuse its Razorpay order. Unique index on `Payment.order`. Return `{ orderId, razorpayOrderId, amount, currency, key }`.
  Accept: calling initiate twice returns the same Razorpay order. Another user's order returns 403.

- [ ] **PAY-02 (P1) Verify correctly.** `[verified]` no ownership check. `[verified]` payment found by order only. `[verified]` signature compared with `!==`.
  Change: load payment by `gatewayOrderId === razorpay_order_id`. Check payment.order belongs to `req.user`. Compute HMAC SHA256 of `${razorpay_order_id}|${razorpay_payment_id}` with key secret. Compare with `crypto.timingSafeEqual` on equal-length buffers. On success: Payment `success`, save payment id and signature, set `order.payment`, order → `placed`, clear cart. Idempotent if already success. Wrap in try/catch. Never log signature or secret.
  Accept: wrong signature → 400, order stays `pending_payment`. Replay returns 200 without duplicate side effects.

- [ ] **PAY-03 (P1) Webhook.** Add `POST /api/payments/webhook`.
  Files: `app.js`, new `controllers/webhook.controller.js`, `routes/payment.routes.js`.
  Change: mount with `express.raw({type:'application/json'})` before `express.json`. Verify `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`. Handle `payment.captured` (same success path as PAY-02) and `payment.failed` (Payment `failed`). Always 200 after valid signature. Idempotent by payment id.
  Accept: Razorpay test webhook marks order `placed` even if browser closed.

- [ ] **PAY-04 (P1) Frontend payment flow.** `[verified]` no dismiss or failure handler. `[verified]` verify handler has no error handling.
  Files: `frontend/src/pages/user/CheckoutPage.jsx`, `OrderDetailPage.jsx`, `frontend/src/api/*`.
  Change: handle `modal.ondismiss`, `payment.failed`, verify error. Show toast and route to order detail with "Pay now". "Pay now" calls initiate again and reopens checkout. Load Razorpay script once with onload guard. Totals come from `/orders/preview`. Remove client-side tax math.
  Accept: three paths tested: success, dismiss, failure card (`4000 0000 0000 0002` in test mode).

- [ ] **PAY-05 (P2) Link and normalize status.** `[verified]` `order.payment` never set. `[verified]` UI checks `'paid'`, backend uses `'success'`.
  Change: single enum `pending|success|failed|refunded`. `OrderDetailPage` reads `order.payment.status`. Populate `payment` in order detail DAO.
  Accept: paid order shows "Paid". Cash shows "Pay at pickup".

- [ ] **PAY-06 (P2) Cash success at pickup.** `[verified]` code comment promises it, no code does it.
  Files: `order.controller.js` pickup OTP verification.
  Change: on successful OTP verify, if method is cash set Payment `success`. Create the Cash Payment record at order creation (unique per order).
  Accept: partner verifies OTP → payment `success`.

- [ ] **PAY-07 (P2) Cancel and refund.** `[verified]` cancel does not touch payment.
  Change: `pending_payment` → cancelled, payment `failed`/void, no refund. Paid online order cancelled in allowed statuses → `razorpay.payments.refund(paymentId, {amount})`, Payment `refunded`, store `refundId`. Refund failure keeps order cancelled with `refundStatus: 'failed'` flagged for manual action and logs error. Cash order → cancelled only.
  Accept: refund visible in Razorpay test dashboard.

- [ ] **PAY-08 (P3) Payment tests.** Vitest or Jest + supertest. Cover: signature valid/invalid, ownership, idempotency, amount rounding, webhook signature.
  Accept: `npm test` green in CI.

---

## Phase 2 — Maps and location (branch `phase-2-maps`)

Reference: `ARCHITECTURE.md` map architecture.

Audit facts: `[verified]` no map library in frontend dependencies. `[verified]` `KitchensPage` uses CSS placeholder pins. `[verified]` `/map/nearby` and `/map/directions` never called by frontend. `[verified]` store creation sends lat 0, lng 0. `[verified]` `updateStore` saves raw body, `location` not rebuilt. `[verified]` nearby query filters `isOpen` and stores default closed. `[verified]` Header location button only calls `alert()`. `[verified]` seed data uses Bengaluru coordinates.

- [ ] **MAP-01 (P1) Install map stack.**
  Files: `frontend/package.json`.
  Change: add `leaflet`, `react-leaflet` (React 19 compatible version). Create `components/map/MapView.jsx` (OSM tiles, attribution, dark filter on tile pane via CSS), `StoreMarker.jsx`, `RouteLayer.jsx`, `LocationPicker.jsx`. Fix default marker icon paths for Vite. Import Leaflet CSS inside the lazy chunk. Pages load map components with `React.lazy`.
  Accept: map renders on kitchens page. Map code absent from initial bundle.

- [ ] **MAP-02 (P1) Geocode endpoint.**
  Files: `backend/src/services/map.service.js`, `controllers/map.controller.js`, `routes/map.routes.js`.
  Change: `GET /api/map/geocode?q=` calls ORS geocode search. Validate `q` (2–100 chars). Return `[{label, lat, lng}]` max 5. LRU cache (500 entries, 10 min). Auth required. Own rate limit 30 per minute per user. Handle ORS 429 and timeouts with clear messages.
  Accept: "Vijay Nagar Indore" returns coordinates.

- [ ] **MAP-03 (P1) Partner location picker.**
  Files: `frontend/src/pages/partner/StoreManagePage.jsx`, `backend/src/validators/store.validator.js`, `store.controller.js`.
  Change: replace blind lat/lng with address search → pick suggestion → draggable pin → save. Send `latitude`, `longitude`. Validator: numbers, lat −90..90, lng −180..180, reject exactly 0,0. Controller builds `location: {type:'Point', coordinates:[lng, lat]}`.
  Accept: new store appears at the pinned place. `[0,0]` rejected with 400.

- [ ] **MAP-04 (P1) Update store rebuilds location.**
  Change: `updateStore` whitelists fields. If lat/lng provided, rebuild `location`. Do not pass raw `req.body` to the DAO.
  Accept: editing coordinates moves the store in `$geoNear` results.

- [ ] **MAP-05 (P2) Nearby stores with distance.**
  Files: `dao/store.dao.js`, `store.controller.js`, `validators`.
  Change: `GET /stores?lat&lng&radius&page&limit&q&category`. Validate numbers (NaN → 400). Use `$geoNear` with `distanceField: 'distanceMeters'`, `spherical: true`, `maxDistance`. Do not hide closed stores. Return `isOpen`. Paginate. Without lat/lng fall back to normal list.
  Accept: response has `distanceMeters`. Closed stores present with flag.

- [ ] **MAP-06 (P2) User location.**
  Files: new `frontend/src/store/locationStore.js`, `components/common/Header.jsx`.
  Change: zustand persisted `{lat,lng,label,source}`. Header chip: "Use my location" via `navigator.geolocation`, or manual search via geocode. Handle denied and timeout. Replace `alert()` with toast.
  Accept: location persists on reload. Denied state shows manual input.

- [ ] **MAP-07 (P2) Kitchens page.**
  Files: `frontend/src/pages/user/KitchensPage.jsx` and CSS.
  Change: list/map toggle. Markers for each store. Marker click shows mini card. Distance label and sort (distance, rating). Open/closed badge. Remove placeholder pins. Skeleton while loading.
  Accept: distances match store positions. Map and list stay in sync.

- [ ] **MAP-08 (P2) Directions.**
  Files: `map.service.js`, `StorePage.jsx`, `RouteLayer.jsx`.
  Change: `GET /api/map/directions?fromLat&fromLng&toLat&toLng&profile=driving-car|foot-walking|cycling-regular` calls ORS GeoJSON directions endpoint `[verify exact path in installed docs]`. Return `{distanceMeters, durationSeconds, geometry}`. Cache by rounded coordinates (4 decimals). Draw line. Show distance and ETA. Profile switch (car, walk, bike).
  Accept: route renders. ORS failure shows inline message, page still usable.

- [ ] **MAP-09 (P2) Data repair and seed.**
  Files: `backend/scripts/seed-sample-data.js`, new `backend/scripts/fix-store-locations.js`.
  Change: seed center from env `SEED_CENTER_LAT`, `SEED_CENTER_LNG` (default 22.7196, 75.8577, Indore). Spread stores within 5 km. Repair script finds stores with `[0,0]`, sets `needsLocation: true`. Partner dashboard shows banner while true.
  Accept: seeded stores appear near default center. Broken stores flagged.

---

## Phase 3 — Email and deployment (branch `phase-3-deploy`)

Facts: `[verified]` email uses Gmail SMTP via nodemailer. Render free blocks outbound SMTP ports 25, 465, 587 (Render changelog). OTP, reset, and order mail will fail there.

- [ ] **EML-01 (P1) Gmail API over HTTPS.**
  Files: `backend/src/services/email.service.js`, `config.js`, `.env.example`.
  Change: exchange refresh token for access token (`oauth2.googleapis.com/token`), then `POST gmail.googleapis.com/gmail/v1/users/me/messages/send` with base64url MIME. Cache access token until expiry. Keep `sendEmail` signature. Timeout 10 s, one retry. In `NODE_ENV=development` without credentials log the email. Remove `nodemailer`. Refresh token must carry `gmail.send` scope. Regenerate via OAuth Playground if needed.
  Accept: OTP email arrives from deployed Render service.

- [ ] **DEP-01 (P1) Render service.**
  Files: `backend/render.yaml`, `backend/package.json`.
  Change: `engines.node` set. `start` script runs `node server.js`. Health check path `/api/health`. Region Singapore. Env vars per `ARCHITECTURE.md` matrix. Express 5 note: wildcard routes need names (`/*splat`).
  Accept: Render deploy green. `/api/health` returns 200.

- [ ] **DEP-02 (P1) Cloudflare Pages + proxy.**
  Files: `frontend/functions/api/[[path]].js`, `frontend/public/_redirects`, `frontend/.env.example`.
  Change: build command `npm run build`, output `dist`, root `frontend`. `VITE_API_URL=/api`. `_redirects`: `/* /index.html 200`. Function forwards method, path, query, body (stream), headers (drop hop-by-hop and `host`), passes `Set-Cookie` back untouched, no caching, adds `X-Forwarded-Host` and `X-Forwarded-Proto`. Target = env `RENDER_API_ORIGIN`. Webhook path forwards raw body unchanged.
  Accept: login through the Pages URL sets the refresh cookie on the Pages domain. No CORS errors.

- [ ] **DEP-03 (P1) Production cookie and OAuth config.**
  Change: refresh cookie `httpOnly`, `secure`, `sameSite: 'strict'`, `path: '/api/auth'`. Google redirect URIs set to `https://<pages-domain>/api/auth/user/google/callback` and partner equivalent. `FRONTEND_URL` = Pages URL. Publish Google consent screen or add test users.
  Accept: Google login works on production for both roles.

- [ ] **DEP-04 (P2) Atlas.** M0 cluster, AWS Mumbai. Database user with least privilege. Network access `0.0.0.0/0` (Render free has no fixed egress IP). Strong password. Connection string in Render env only.
  Accept: Render connects. Local `.env` uses a separate database.

- [ ] **DEP-05 (P3) Keep-alive.** UptimeRobot (or cron-job.org) GET `https://<pages-domain>/api/health` every 5 minutes. Document cold start behavior in README.

- [ ] **DEP-06 (P3) Remove legacy.** Delete `backend/netlify/`, `netlify.toml`, `serverless-http` dependency. Confirm `app.js` exports app and `server.js` listens.

- [ ] **DEP-07 (P3) CI.** `.github/workflows/ci.yml`: frontend `npm ci && npm run lint && npm run build`; backend `npm ci && npm test`. Add badge to README.

---

## Phase 4 — Performance (branch `phase-4-perf`)
Execute tasks `PERF-*` in `PERFORMANCE.md`. Targets and measurements are there.

## Phase 5 — Design consistency (branch `phase-5-design`)
Execute tasks `UI-*` in `DESIGN-SYSTEM.md`.

---

## Phase 6 — Quality and portfolio (branch `phase-6-polish`)

- [ ] **QA-01 (P1) Fix reel like state.** `[verified]` `liked` starts `false`; reload loses state. No rollback on error.
  Change: feed API returns `likedByMe` and `likes`. `ReelCard` initial state from server. `onError` rolls back.
  Accept: liked reel stays liked after reload.

- [ ] **QA-02 (P2) Order-time guards.** Re-test ORD-01 with closed store, unavailable item, deleted food, empty cart, cart from another store.

- [ ] **QA-03 (P2) Error and empty states.** Each page: loading skeleton, empty, error with retry. Add React error boundary at layout level.

- [ ] **QA-04 (P2) Replace dialogs.** `[verified]` 7 `alert()`/`confirm()` calls. Use Toast and confirm Sheet (`UI-05`).

- [ ] **QA-05 (P2) Tests.** Backend: auth flow, pricing, payment verify, webhook. Frontend: smoke test of checkout hook. Keep fast.

- [ ] **QA-06 (P2) End-to-end manual run** of the PRD demo script (section 10). Record result in README.

- [ ] **QA-07 (P3) README and demo.** Live links, demo accounts (user, partner), Razorpay test card numbers, architecture diagram (from `ARCHITECTURE.md`), screenshots, short demo GIF, "free tier cold start" note, known limits.

- [ ] **QA-08 (P3) Resume bullets.** Draft 3 bullets: payments (idempotent verify + webhook), geospatial (`$geoNear`, routing), performance (bundle and LCP numbers before/after). Fill numbers from real measurements only.

---

## Risk register
| Risk | Mitigation |
|------|------------|
| ORS free quota exhausted | Backend cache. Per-user rate limit. Graceful UI message |
| Render cold start during demo | Uptime ping. Mention in README |
| Gmail API refresh token expires (test-mode Google app tokens can expire in 7 days) `[verify]` | Publish OAuth consent screen. Re-issue token. Log email failures loudly |
| Razorpay webhook cannot reach local dev | Use Render URL or a tunnel for testing |
| Mongoose 9 or Express 5 behavior differences | Read changelog before adding middleware patterns. Test each new route |
| Large video uploads on 512 MB instance | 25 MB cap. Consider direct ImageKit upload later |
