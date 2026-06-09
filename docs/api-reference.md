# API Reference

Base URL:

- Local: `http://localhost:3000/api`
- Netlify: `/api`

Protected endpoints require `Authorization: Bearer <access-token>`. Refresh and OAuth flows also use cookies.

## Health

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | API status and timestamp |

## Authentication

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/user/register` | Public | Register a customer and send OTP |
| POST | `/auth/partner/register` | Public | Register a partner and send OTP |
| POST | `/auth/:role/verify-email` | Public | Verify registration OTP |
| POST | `/auth/:role/login` | Public | Log in with email and password |
| GET | `/auth/:role/google` | Public | Start Google OAuth |
| GET | `/auth/:role/google/callback` | Google | Complete Google OAuth |
| POST | `/auth/:role/forgot-password` | Public | Send password-reset OTP |
| POST | `/auth/:role/reset-password` | Public | Verify OTP and replace password |
| POST | `/auth/refresh` | Cookie | Issue a new access token |
| POST | `/auth/logout` | Cookie | Revoke the refresh session |

`:role` is `user` or `partner`.

## Food

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/food` | Public | List food; supports controller query filters |
| GET | `/food/feed` | Customer | Authenticated food feed |
| GET | `/food/category/:category` | Public | List food by category |
| GET | `/food/:id` | Public | Get one food item |
| POST | `/food/addFood` | Partner | Create food with `image` and optional `video` form fields |
| PUT | `/food/:id` | Partner | Update owned food |
| DELETE | `/food/:id` | Partner | Delete owned food |
| PATCH | `/food/:id/availability` | Partner | Toggle availability |

Valid categories are `breakfast`, `lunch`, `dinner`, `snacks`, `drinks`, and `desserts`.

## Stores

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/store` | Public | List stores |
| GET | `/store/:id` | Public | Get store details |
| GET | `/store/:id/menu` | Public | Get available menu |
| GET | `/store/partner/my-store` | Partner | Find the authenticated partner's store |
| POST | `/store` | Partner | Create a store |
| PUT | `/store/:id` | Partner | Update an owned store |
| DELETE | `/store/:id` | Partner | Delete an owned store |
| PATCH | `/store/:id/status` | Partner | Toggle open/closed |
| POST | `/store/:id/image` | Partner | Upload `image` form field |

## Cart

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/cart` | Customer | Get current cart |
| POST | `/cart/add` | Customer | Add `{ foodId, quantity, storeId }` |
| PUT | `/cart/update` | Customer | Update `{ foodId, quantity }` |
| DELETE | `/cart/remove/:foodId` | Customer | Remove an item |
| DELETE | `/cart/clear` | Customer | Clear the cart |

## Orders

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/order/place` | Customer | Create an order from the cart |
| GET | `/order` | Customer | List customer orders |
| GET | `/order/:id` | Customer | Get owned order |
| PATCH | `/order/:id/cancel` | Customer | Cancel an eligible order |
| GET | `/order/store/:storeId` | Partner | List store orders; optional `status` query |
| GET | `/order/partner/:id` | Partner | Get an owned store order |
| PATCH | `/order/partner/:id/status` | Partner | Advance `{ status }` |
| PATCH | `/order/partner/:id/verify` | Partner | Verify `{ otp }` and complete pickup |

## Payments

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/payment/initiate` | Customer | Create Razorpay order for `{ orderId }` |
| POST | `/payment/verify` | Customer | Verify Razorpay signature |
| POST | `/payment/cash` | Customer | Record cash payment for `{ orderId }` |
| GET | `/payment/history` | Customer | List payment history |

## Reels

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/reel` | Public | List reels |
| GET | `/reel/store/:storeId` | Public | List store reels |
| GET | `/reel/:id/comments` | Public | List reel comments |
| POST | `/reel/:id/like` | Customer | Toggle like |
| POST | `/reel/:id/comment` | Customer | Add `{ text }` |
| DELETE | `/reel/:id/comment/:commentId` | Customer | Delete owned comment |
| PATCH | `/reel/:id/view` | Customer | Increment views |
| POST | `/reel` | Partner | Upload `video` with food/store/caption data |
| DELETE | `/reel/:id` | Partner | Delete owned reel |

## Reviews and Favorites

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/review/food/:foodId` | Public | Food reviews |
| GET | `/review/store/:storeId` | Public | Store reviews |
| POST | `/review` | Customer | Add a review |
| DELETE | `/review/:id` | Customer | Delete owned review |
| GET | `/favorite` | Customer | List favorite stores |
| POST | `/favorite/:storeId` | Customer | Toggle favorite |

## Maps, AI, Profile, and Dashboard

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/map/nearby` | Public | Find stores near supplied coordinates |
| GET | `/map/directions/:storeId` | Public | Route from supplied coordinates to store |
| POST | `/chatbot` | Customer | Send message and optional location/history |
| GET | `/user/profile` | Any account | Get profile |
| PUT | `/user/profile` | Any account | Update profile |
| POST | `/user/profile/avatar` | Any account | Upload `avatar` |
| DELETE | `/user/profile` | Any account | Deactivate account |
| GET | `/dashboard/:storeId/daily` | Partner | Daily metrics |
| GET | `/dashboard/:storeId/weekly` | Partner | Weekly metrics |
| GET | `/dashboard/:storeId/monthly` | Partner | Monthly metrics |
| GET | `/dashboard/:storeId/top-items` | Partner | Best-selling food |
| GET | `/dashboard/:storeId/rush-hours` | Partner | Orders by hour |
| GET | `/dashboard/:storeId/growth` | Partner | Period growth |
| GET | `/dashboard/:storeId/breakdown` | Partner | Status counts |

Validation and exact response shapes are implemented in `backend/src/validators/`, controllers, and DAOs.
