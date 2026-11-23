# Munchy — Product Requirements Document

Version 1.0 · Owner: Samyak Jain · Status: Draft for implementation

## 1. Vision
Munchy turns food discovery into a short-video feed. Users watch reels from local kitchens, find them on a map, and order in a few taps. Partners (kitchen owners) upload reels, manage menus, and fulfil orders.

Tagline in app: "Feed Your Scroll".

## 2. Goals
| # | Goal | Measure |
|---|------|---------|
| G1 | Complete end-to-end flow works with no manual DB edits | Demo script (section 10) passes |
| G2 | Payments are correct and safe | Zero orphan orders. Server-computed totals. Verified signatures |
| G3 | Maps are real | Stores placed by real coordinates. Distance and directions shown |
| G4 | Feels fast on mid-range phones | Lighthouse mobile ≥ 90. LCP < 2.5 s. Initial JS ≤ 90 kB gzip |
| G5 | One consistent visual language | No hex or px values outside tokens. Shared UI primitives |
| G6 | Deployed on free tiers | Cloudflare Pages + Render + Atlas M0. Live link in README |
| G7 | Portfolio-grade | README, architecture doc, tests on critical paths, demo video |

## 3. Non-goals (v1)
- Live courier tracking and delivery fleet. Munchy uses pickup OTP handoff.
- Real money. Razorpay stays in test mode.
- Native mobile apps. PWA only (optional).
- Multi-city scaling, admin panel, coupons, loyalty.

## 4. Personas
**Customer ("Aarav", 22).** Scrolls reels. Wants nearby food fast. Pays by UPI or cash. Uses a phone.
**Partner ("Meera", kitchen owner).** Posts food videos. Needs simple order handling. Uses phone and laptop.

## 5. Roles and access
| Role | Can |
|------|-----|
| Guest | Register, login, reset password |
| User | Reels, kitchens, map, cart, checkout, orders, reviews, favourites, chatbot, profile |
| Partner | Store profile and location, food CRUD, reels, orders, pickup OTP verify, analytics |

User and Partner are separate account types with separate login. Roles must never cross routes.

## 6. Functional requirements

### FR-AUTH Authentication
- FR-AUTH-1 Register by email and password. Email OTP verification.
- FR-AUTH-2 Login. Short-lived access token. Refresh token in httpOnly cookie. Session record per device.
- FR-AUTH-3 Google login for both roles.
- FR-AUTH-4 Forgot and reset password by email.
- FR-AUTH-5 Logout revokes session.
- FR-AUTH-6 Access tokens never appear in URLs.
- FR-AUTH-7 Auth endpoints rate limited. Refresh endpoint exempt from the strict limiter.

### FR-FEED Reels
- FR-FEED-1 Vertical full-screen feed. One video plays at a time.
- FR-FEED-2 Infinite scroll with pages of 5.
- FR-FEED-3 Like, comment, view count. Like state persists after reload.
- FR-FEED-4 Add food to cart from a reel.
- FR-FEED-5 Tap store name to open store page.

### FR-MAP Location and maps
- FR-MAP-1 Partner sets store location by address search and draggable pin. Coordinates stored as GeoJSON `[lng, lat]`. `[0,0]` rejected.
- FR-MAP-2 User location by browser geolocation, with manual search fallback. Stored on device.
- FR-MAP-3 Kitchens page has list and map views. Each store shows distance and open/closed badge.
- FR-MAP-4 Store page shows map, distance, travel time, and route line from user to store.
- FR-MAP-5 Nearby search uses radius and returns distance. Closed stores appear with a badge.
- FR-MAP-6 Graceful states: permission denied, no results, routing service error.

### FR-DISC Discovery
- FR-DISC-1 Store list with search, category filter, sort by distance or rating.
- FR-DISC-2 Store page: menu, reels, reviews, favourite toggle.
- FR-DISC-3 Chatbot suggests food using store and menu data.

### FR-CART Cart
- FR-CART-1 One store per cart. Adding from another store asks to replace.
- FR-CART-2 Quantity update, remove, clear.
- FR-CART-3 Cart shows item subtotal only. Tax and total come from the server.

### FR-ORD Orders
- FR-ORD-1 Server recomputes prices from the database. Rejects unavailable items and closed stores.
- FR-ORD-2 Order stores subtotal, tax, total. Tax rate is a server constant (5%).
- FR-ORD-3 Statuses follow `order.model.js` plus `pending_payment`. Partners never see `pending_payment`.
- FR-ORD-4 Pickup OTP generated per order. Partner verifies it at handoff.
- FR-ORD-5 User can cancel before preparation. Refund rules in FR-PAY-6.
- FR-ORD-6 Order detail page updates status automatically.

### FR-PAY Payments
- FR-PAY-1 Methods: Razorpay (UPI, card, netbanking in test mode) and cash.
- FR-PAY-2 Online flow: create order as `pending_payment` → create Razorpay order → user pays → server verifies signature → order becomes `placed` → cart cleared.
- FR-PAY-3 Verification checks: order owner, Razorpay order id match, HMAC signature (timing-safe), idempotent.
- FR-PAY-4 Webhook confirms payments when the browser closes early.
- FR-PAY-5 Failed or dismissed payment leaves order in `pending_payment` with a visible "Pay now" retry. Stale pending orders expire after 30 minutes.
- FR-PAY-6 Cancel after online payment triggers a Razorpay refund. Payment status becomes `refunded`.
- FR-PAY-7 Cash payment turns `success` at pickup verification.

### FR-PART Partner tools
- FR-PART-1 Dashboard: today orders, revenue, pending count. Refresh every 15 s while visible.
- FR-PART-2 Order list with status actions.
- FR-PART-3 Food CRUD with image upload and availability toggle.
- FR-PART-4 Reel upload with video, linked food.
- FR-PART-5 Analytics page.
- FR-PART-6 Store profile, hours, open/closed toggle, location picker.
- FR-PART-7 Banner when store has no valid location.

### FR-UX Experience
- FR-UX-1 Toasts replace `alert()`.
- FR-UX-2 Skeleton loaders for lists and cards.
- FR-UX-3 Empty and error states on every page.
- FR-UX-4 Keyboard focus visible. Respect reduced motion.

## 7. Non-functional requirements
| Area | Requirement |
|------|-------------|
| Performance | Targets in `PERFORMANCE.md`. API p95 < 300 ms warm |
| Security | Helmet, CORS allowlist, rate limits, input validation, httpOnly cookies, secrets in env only |
| Reliability | Health endpoint. Uptime ping. Idempotent payment handlers |
| Accessibility | WCAG AA contrast for body text. Labels on icon buttons |
| Compatibility | Latest Chrome, Safari iOS, Firefox. Width 360 px and up |
| Cost | Free tiers only |
| Observability | Request log line per request. Error log with request id |

## 8. Constraints and assumptions
- Render free instance sleeps after 15 minutes idle. Mitigated by uptime ping. First request after long idle can take up to a minute.
- Render free blocks outbound SMTP. Email goes over HTTPS (Gmail API).
- Atlas M0 shared tier. Network access open to all IPs. Strong credentials required.
- OpenRouteService free quota limits geocode and routing calls. Backend caches results.
- Razorpay test mode only.

## 9. Success metrics (portfolio)
- Live demo link works on first click.
- Reviewer completes order with test card in under 2 minutes.
- README shows architecture, screenshots, demo GIF.
- Repo shows CI badge, tests on auth and payment verify.

## 10. Demo script (acceptance)
1. Register user. Verify OTP. Login.
2. Open reels. Like one. Add food to cart.
3. Open kitchens. Allow location. See map and distances.
4. Open store. See route line and ETA.
5. Checkout with Razorpay test card. See order `placed`.
6. Login as partner in another browser. See order. Mark preparing, ready.
7. Verify pickup OTP. Order completes. User sees status update.
8. Place second order. Close payment window. See `pending_payment` with Pay now. Pay it.
9. Cancel a paid order. See refund status.
10. Partner creates new store with address search and pin. Store appears on user map.

## 11. Phases
| Phase | Scope | Doc reference |
|-------|-------|---------------|
| 0 | Safety, config, rate limits, OAuth token fix | FIXES Phase 0 |
| 1 | Orders and payments | FIXES Phase 1 |
| 2 | Maps and location | FIXES Phase 2 |
| 3 | Email and deployment | FIXES Phase 3 |
| 4 | Performance | PERFORMANCE.md |
| 5 | Design consistency | DESIGN-SYSTEM.md |
| 6 | Quality, docs, demo | FIXES Phase 6 |

## 12. Open questions
- Which tax rate and rounding rule? Default 5%, computed in paise (integer), rounded half up. Confirm.
- Delivery versus pickup wording in UI. Current code uses pickup OTP. Confirm product language.
- Keep chatbot on Gemini free tier, or add rate limit per user?
