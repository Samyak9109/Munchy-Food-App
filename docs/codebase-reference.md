# Codebase Reference

## Root Files

| Path | Responsibility |
| --- | --- |
| `package.json` | Root install/build convenience scripts and Node version |
| `netlify.toml` | Netlify build, function, API rewrite, and SPA fallback |
| `readme.md` | Project overview, usage, deployment, and documentation links |
| `Design/` | Stitch AI screen exports and the Vibe & Velocity design system |
| `docs/` | Maintainer and user documentation |

## Backend Entry Points

| Path | Responsibility |
| --- | --- |
| `backend/server.js` | Connects MongoDB and starts the local Express listener |
| `backend/src/app.js` | Creates Express, registers middleware/routes, health check, and error handling |
| `backend/netlify/functions/api.js` | Connects MongoDB and wraps Express with `serverless-http` |
| `backend/scripts/seed-sample-data.js` | Idempotently creates marked sample restaurants and dishes |

## Backend Configuration

| Module | Responsibility |
| --- | --- |
| `config/config.js` | Loads and validates environment variables |
| `config/database.js` | Opens and caches the Mongoose connection |
| `config/passport.js` | Defines separate Google OAuth strategies for users and partners |

## Routes and Controllers

Each route module maps HTTP paths to a controller and applies the necessary role, validation, and upload middleware.

| Domain | Route module | Controller responsibility |
| --- | --- | --- |
| Authentication | `auth.routes.js` | Registration, OTP verification, login, OAuth, refresh, logout, reset |
| Food | `food.routes.js` | Public reads and partner menu-item lifecycle |
| Store | `store.routes.js` | Kitchen discovery and partner kitchen lifecycle |
| User | `user.routes.js` | Shared customer/partner profile lifecycle |
| Cart | `cart.routes.js` | Customer cart reads and mutations |
| Order | `order.routes.js` | Customer ordering and partner fulfillment |
| Payment | `payment.routes.js` | Razorpay initiation/verification and cash records |
| Review | `review.routes.js` | Food/store review reads and customer writes |
| Reel | `reel.routes.js` | Feed, engagement, comments, views, and partner publishing |
| Favorite | `favorite.routes.js` | Customer favorite-store toggle and list |
| Map | `map.routes.js` | Nearby geospatial search and directions |
| Dashboard | `dashboard.routes.js` | Partner sales and operational analytics |
| Chatbot | `chatbot.routes.js` | Authenticated AI food recommendations |

## Data Access Layer

`backend/src/dao/` keeps Mongoose query construction outside controllers.

- `cart.dao.js`: cart creation, item mutations, clearing, and totals
- `comment.dao.js`: create, list, find, and delete comments
- `dashboard.dao.js`: aggregation pipelines for revenue, growth, top items, rush hours, and statuses
- `favourite.dao.js`: unique user/store favorites
- `food.dao.js`: food reads, ownership lists, categories, updates, and availability
- `like.dao.js`: unique reel likes
- `map.dao.js`: `$near` geospatial store query
- `order.dao.js`: order population, ownership reads, status, cancellation, and OTP reads
- `payment.dao.js`: payment creation, lookup, history, and status
- `reel.dao.js`: reel reads and engagement counters
- `review.dao.js`: review persistence and rating aggregation
- `store.dao.js`: store CRUD, partner lookup, status, and populated menu
- `user.dao.js`: profile lookup, update, and deactivation

## Models

`backend/src/models/` defines User, Partner, Session, OTP, Store, Food, Reel, Like, Comment, Favorite, Cart, Order, Payment, and Review collections. See [data-model.md](data-model.md) for field and relationship details.

## Middleware and Validation

| Module | Responsibility |
| --- | --- |
| `auth.middleware.js` | Verifies JWTs and attaches customer or partner records |
| `error.middleware.js` | Formats 404, validation, duplicate-key, JWT, and generic errors |
| `multer.middleware.js` | In-memory image/video uploads with file filtering and limits |
| `rateLimit.middleware.js` | Auth-specific and general request limits |
| `auth.validator.js` | Account, email, password, phone, and OTP validation |
| `food.validator.js` | Food category and media validation |
| `store.validator.js` | Kitchen names, addresses, cuisine arrays, and time validation |

## Services

| Module | Responsibility |
| --- | --- |
| `chatbot.service.js` | Gemini/LangChain prompt, database context, conversation history, fallback |
| `email.service.js` | Gmail transport and account/order email templates |
| `map.service.js` | OpenRouteService driving route request |
| `otp.service.js` | Secure OTP generation, hashing, and verification |
| `storage.service.js` | Temporary-file streaming to ImageKit |

## Frontend Entry and Routing

`frontend/src/main.jsx` mounts React. `frontend/src/App.jsx` installs TanStack Query, BrowserRouter, public auth routes, role-protected customer routes, and role-protected partner routes.

## Frontend API and State

| Module | Responsibility |
| --- | --- |
| `api/client.js` | Axios base URL, credentials, access-token header, refresh queue |
| `api/auth.js` | Authentication endpoint functions |
| `api/index.js` | Food, store, cart, order, payment, review, reel, favorite, map, dashboard, chatbot, and profile calls |
| `store/authStore.js` | Persisted account/role and local access token |
| `store/cartStore.js` | Local cart count convenience state |
| `hooks/useAuth.js` | Login, registration, and logout mutations with navigation |

## Customer Pages

| Page | Responsibility |
| --- | --- |
| `ReelsPage` | Video discovery, likes, comments, views, cart actions |
| `KitchensPage` | Kitchen search, filters, favorites, navigation |
| `StorePage` | Kitchen details, menu categories, favorites, cart actions |
| `ChatbotPage` | Mood prompts, AI messages, recommended-food cards |
| `CartPage` | Quantity, removal, clear, totals, checkout navigation |
| `CheckoutPage` | Notes, payment method, order creation, Razorpay/cash |
| `OrdersPage` | Customer order history |
| `OrderDetailPage` | Status timeline, pickup code, summary, payment |
| `ProfilePage` | Profile editing, avatar, links, logout, deletion |
| `ForgotPasswordPage` | Role-specific password-reset request |

## Partner Pages

| Page | Responsibility |
| --- | --- |
| `DashboardPage` | Store state, daily summary, active orders, quick actions |
| `PartnerOrdersPage` | Status tabs and forward-only fulfillment actions |
| `OTPVerifyPage` | Six-digit pickup verification |
| `PartnerReelsPage` | Reel listing, upload, association, deletion |
| `AnalyticsPage` | Period metrics, growth, and top items |
| `StoreManagePage` | Store creation, image, menu CRUD, availability |
| `PartnerProfilePage` | Partner profile, store summary, avatar, logout |

## Authentication Pages

`LoginPage`, `RegisterPage`, and `VerifyOTPPage` implement standard authentication. `AuthSuccessPage` and `AuthErrorPage` handle Google OAuth results. `ProtectedRoute` redirects missing or mismatched roles.

## Styling

Each screen uses a colocated CSS Module. `frontend/src/index.css` contains shared design tokens and global styles. `Design/vibe_velocity/DESIGN.md` is the source design specification created with Stitch AI.

## Known Engineering Constraints

- There is no automated test suite yet.
- Frontend access tokens use local storage; refresh tokens remain HTTP-only.
- Netlify uploads are constrained by function request limits.
- The current rate limiter is process-local and is not a distributed production quota.
- The partner frontend primarily selects the first store in the account's `stores` array.
