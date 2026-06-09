# Netlify Deployment

The repository is configured to deploy the React frontend and Express backend in one Netlify site:

- `frontend/dist` is the published static site.
- `backend/netlify/functions/api.js` is the serverless API.
- `/api/*` is rewritten to the function.
- All remaining paths are rewritten to `index.html` for React Router.

## 1. Prepare Production Services

Create production credentials for:

- MongoDB Atlas
- ImageKit
- Google OAuth
- Gmail app password
- Gemini
- Razorpay, when online payments are enabled
- OpenRouteService, when directions are enabled

MongoDB Atlas network access must permit Netlify function connections. A tightly restricted private network is preferable where the selected plans support it; otherwise configure Atlas network access according to its current security guidance and use strong credentials.

## 2. Import the Repository

In Netlify, select **Add new site > Import an existing project** and connect the repository. `netlify.toml` supplies:

```text
Build command: npm ci --prefix backend && npm ci --prefix frontend && npm run build --prefix frontend
Publish directory: frontend/dist
Functions directory: backend/netlify/functions
Node version: 22
```

## 3. Configure Environment Variables

Add all backend variables in **Site configuration > Environment variables**. Production-critical examples:

```env
NODE_ENV=production
FRONTEND_URL=https://your-site.netlify.app
MONGO_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
GOOGLE_CALLBACK_URL_USER=https://your-site.netlify.app/api/auth/user/google/callback
GOOGLE_CALLBACK_URL_PARTNER=https://your-site.netlify.app/api/auth/partner/google/callback
```

Also add ImageKit, Gmail, Google, Gemini, Razorpay, and OpenRouteService values from `backend/.env.example`.

`VITE_API_URL=/api` is already defined in `netlify.toml`. Netlify build variables prefixed with `VITE_` are embedded in browser JavaScript and must never contain secrets.

## 4. Configure Google OAuth

In the Google Cloud console, add these authorized redirect URIs:

```text
https://your-site.netlify.app/api/auth/user/google/callback
https://your-site.netlify.app/api/auth/partner/google/callback
```

When using a custom domain, replace the Netlify subdomain in `FRONTEND_URL`, callback variables, and Google OAuth settings.

## 5. Deploy and Verify

After deployment, verify:

1. `https://your-site.netlify.app/api/health` returns status `ok`.
2. Direct navigation to `/login`, `/orders`, and `/partner/dashboard` loads the React app.
3. Customer and partner email registration deliver OTP messages.
4. Google OAuth returns to `/auth/success`.
5. Image and video uploads reach ImageKit.
6. Cart, cash checkout, order status, and pickup verification work.
7. Razorpay test-mode payment completes and verifies.
8. AI recommendations and map directions work with production keys.

## Local Production Build

```bash
npm run install:all
npm run build
```

To emulate redirects and functions locally, install the Netlify CLI and run `netlify dev` after configuring local environment variables.

## Operational Notes

- Serverless cold starts can add latency to the first API request.
- Mongoose connections are cached and reused within warm function instances.
- Netlify function request-size and execution-time limits apply to uploads and AI/map calls.
- The current in-memory Express rate limiter is instance-local in serverless deployment.
- Logs are available in the Netlify function logs.
- No automated production smoke test or CI pipeline is currently included.

## Troubleshooting

### API returns 500 immediately

Check function logs for a missing required environment variable or a blocked MongoDB Atlas connection.

### OAuth redirects fail

Confirm that `FRONTEND_URL`, both callback variables, and the Google console redirect URIs use the same exact HTTPS domain.

### Refresh sessions fail

Keep frontend and API on the same Netlify origin through `/api`. Production refresh cookies are secure and use `SameSite=Strict`.

### Uploads fail

Check ImageKit credentials, Netlify payload limits, MIME types, and function logs. Large video uploads may require a future direct-to-ImageKit browser upload flow.
