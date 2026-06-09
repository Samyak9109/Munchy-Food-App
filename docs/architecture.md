# Architecture

## System Overview

```text
React/Vite browser application
        |
        | Axios + Bearer access token
        v
Express REST API
        |
        | Mongoose
        v
MongoDB / MongoDB Atlas

Express also integrates with Google OAuth, Gmail, ImageKit,
Gemini, Razorpay, and OpenRouteService.
```

## Frontend

`frontend/src/App.jsx` defines authentication, customer, and partner routes. `ProtectedRoute` enforces the persisted role before rendering `UserLayout` or `PartnerLayout`.

- `api/`: Axios clients and endpoint functions
- `components/common/`: navigation, headers, and route protection
- `hooks/`: authentication mutations
- `layouts/`: role-specific shells
- `pages/auth/`: registration, login, verification, OAuth result, and reset flows
- `pages/user/`: reels, kitchens, chatbot, cart, checkout, orders, stores, and profile
- `pages/partner/`: dashboard, orders, pickup verification, reels, analytics, kitchen, and profile
- `store/`: Zustand authentication and cart state

TanStack Query handles server state, caching, mutations, and periodic order refreshes. Zustand persists the current account and role. The access token is stored in local storage and attached by an Axios interceptor.

## Backend

The backend uses route-controller-DAO separation:

1. Express routes select validation, upload, and authorization middleware.
2. Controllers enforce workflow and ownership rules.
3. DAOs perform Mongoose queries.
4. Services integrate with email, AI, maps, OTP hashing, and media storage.
5. Mongoose models define persistence and indexes.

`backend/server.js` starts the long-running local process. `backend/netlify/functions/api.js` wraps the same Express app for serverless requests.

## Authentication Flow

1. Registration creates an unverified role-specific account.
2. A hashed OTP record is stored and the plain OTP is emailed.
3. Verification activates the account and issues tokens.
4. The short-lived access token is sent in the response.
5. The refresh token is stored in an HTTP-only cookie and a hashed copy is stored in a Session record.
6. Axios attempts `/api/auth/refresh` after an expired-access-token response.
7. Logout revokes the database session and clears the cookie.

Google OAuth uses separate Passport strategies for customers and partners. After authentication, the backend redirects to the frontend `/auth/success` route with an access token and role.

## Order Flow

```text
cart -> place order -> placed -> confirmed -> ready -> OTP verified -> pickedup
                       \-> cancelled (while placed or confirmed)
```

The order copies item prices from the cart. Pickup OTPs are bcrypt-hashed at rest. Notifications are sent as state changes. Razorpay payment verification can automatically confirm an order; cash remains pending until pickup.

## Media Flow

Multer accepts image/video form data in memory. The storage service writes a temporary file, streams it to ImageKit, and deletes the temporary file in a `finally` block. MongoDB stores only the resulting media URL.

## Serverless Deployment

Netlify serves `frontend/dist`. Requests under `/api/*` are internally rewritten to the `api` function while preserving the Express `/api/...` route. The function establishes or reuses a cached Mongoose connection before invoking Express.

Serverless constraints apply:

- Functions can cold start.
- Request duration and payload sizes are limited by the Netlify plan.
- Large videos should stay within Netlify request limits or use direct-to-ImageKit uploads in a future revision.
- In-memory rate limiting is per function instance, not globally distributed.

## Security Boundaries

- Customer, partner, and shared profile middleware are separate.
- Controllers verify resource ownership for orders and stores.
- Refresh tokens are HTTP-only.
- Passwords and OTPs are hashed.
- Auth and general endpoints are rate limited.
- API errors pass through centralized 404/error middleware.
- Secrets remain in backend environment variables; only `VITE_*` values are exposed to the browser.
