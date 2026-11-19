# Munchy — Production Deployment Guide

Munchy uses a free-tier, portfolio-grade architecture:
- **Frontend & API Proxy:** Cloudflare Pages (Free, global CDN + Edge Functions reverse proxy)
- **Backend Web Service:** Render (Free tier, Singapore region, Express 5 + Node 22)
- **Database:** MongoDB Atlas (M0 Shared cluster, AWS Mumbai)
- **Media:** ImageKit (Free CDN + transformations)
- **Payments:** Razorpay (Test mode)
- **Geocoding & Directions:** OpenRouteService
- **Email:** Gmail REST API v1 over HTTPS (Render free blocks SMTP ports 25, 465, 587)
- **Keep-Alive:** UptimeRobot (pings `/api/health` every 5 min to prevent Render cold sleep)

---

## Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Cloudflare Pages (Edge)             │
                  │                                              │
Browser ─────────►│  Static Assets: /assets/* ──► Global CDN    │
                  │                                              │
                  │  API Calls:     /api/* ────► Pages Function │
                  └──────────────────────┬───────────────────────┘
                                         │ (Reverse Proxy)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Render (Web Service)              │
                  │         munchy-api.onrender.com              │
                  │                                              │
                  │  Express 5 API                               │
                  │  /api/health (UptimeRobot ping)              │
                  │  /api/payment/webhook (Raw body)             │
                  └──────────────┬──────────────────┬────────────┘
                                 │                  │
                                 ▼                  ▼
                         MongoDB Atlas M0       Gmail API v1
                           (AWS Mumbai)           (HTTPS)
```

---

## 1. MongoDB Atlas Setup (DEP-04)

1. Create a free **M0 cluster** in **AWS / ap-south-1 (Mumbai)** for lowest latency to India.
2. In **Database Access**: Create a database user with readWrite permissions on the `munchy` database.
3. In **Network Access**: Add `0.0.0.0/0` (Allow access from anywhere). Render free instances have dynamic outbound IP addresses, so open access with strong authentication is required.
4. Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/munchy?retryWrites=true&w=majority
   ```

---

## 2. Render Backend Deployment (DEP-01)

1. Log in to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Name:** `munchy-api`
   - **Root Directory:** `backend`
   - **Region:** `Singapore (Southeast Asia)`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
   - **Health Check Path:** `/api/health`
4. Set Environment Variables in Render:
   | Variable | Value / Description |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `FRONTEND_URL` | `https://<your-project>.pages.dev` |
   | `MONGO_URI` | Atlas connection string |
   | `JWT_SECRET` | 32+ random characters |
   | `IMAGEKIT_PRIVATE_KEY` | From ImageKit developer dashboard |
   | `IMAGEKIT_PUBLIC_KEY` | From ImageKit developer dashboard |
   | `IMAGEKIT_URL_ENDPOINT` | `https://ik.imagekit.io/<id>` |
   | `CLIENT_ID` | Google OAuth Web Client ID |
   | `CLIENT_SECRET` | Google OAuth Web Client Secret |
   | `REFRESH_TOKEN` | Google refresh token with `gmail.send` scope |
   | `EMAIL_USER` | `your-email@gmail.com` |
   | `GOOGLE_CALLBACK_URL_USER` | `https://<your-project>.pages.dev/api/auth/user/google/callback` |
   | `GOOGLE_CALLBACK_URL_PARTNER` | `https://<your-project>.pages.dev/api/auth/partner/google/callback` |
   | `RAZORPAY_KEY_ID` | `rzp_test_...` |
   | `RAZORPAY_KEY_SECRET` | Razorpay test secret |
   | `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks |
   | `OPENROUTE_API_KEY` | OpenRouteService token |
   | `TAX_RATE` | `0.05` |
   | `CORS_ORIGINS` | `https://<your-project>.pages.dev` |

5. Deploy. Verify that `https://munchy-api.onrender.com/api/health` returns:
   ```json
   { "status": "ok", "message": "Munchy API is running" }
   ```

---

## 3. Cloudflare Pages Deployment (DEP-02 & DEP-03)

1. Log in to [Cloudflare](https://dash.cloudflare.com) and go to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your repository.
3. Build configuration:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`
4. Set Environment Variables in Cloudflare Pages:
   - `RENDER_API_ORIGIN`: `https://munchy-api.onrender.com` (your Render URL without trailing slash)
   - `VITE_API_URL`: `/api`
   - `VITE_RAZORPAY_KEY`: `rzp_test_...`
5. Deploy.
6. The built-in proxy function at `frontend/functions/api/[[path]].js` transparently forwards `/api/*` to Render, avoiding CORS and ensuring cookies are set directly on `<project>.pages.dev`.

---

## 4. Google OAuth Redirect URIs (DEP-03)

In Google Cloud Console > APIs & Services > Credentials > Your OAuth 2.0 Client ID:
Add Authorized redirect URIs:
```text
https://<your-project>.pages.dev/api/auth/user/google/callback
https://<your-project>.pages.dev/api/auth/partner/google/callback
```

---

## 5. Keep-Alive Ping (DEP-05)

Render free instances spin down after 15 minutes of inactivity. To keep the service warm and responsive:
1. Create a free account at [UptimeRobot](https://uptimerobot.com).
2. Add a new **HTTP(s)** monitor:
   - **Friendly Name:** Munchy API Ping
   - **URL:** `https://<your-project>.pages.dev/api/health` (or directly `https://munchy-api.onrender.com/api/health`)
   - **Monitoring Interval:** Every 5 minutes
3. Cold starts take ~40–50 seconds on Render free tier. With UptimeRobot pinging every 5 minutes, instances remain warm.

---

## 6. Seed Sample Data in Production

To seed demo restaurants and menus in your Atlas database:
```bash
# In backend directory with your production MONGO_URI in .env:
ALLOW_PRODUCTION_SEED=true npm run seed:sample
```
