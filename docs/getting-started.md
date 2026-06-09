# Getting Started

## Prerequisites

- Node.js 22+
- npm
- MongoDB or MongoDB Atlas
- Gmail account with an app password
- ImageKit account
- Google OAuth client
- Gemini API key
- Optional: Razorpay and OpenRouteService credentials

## Installation

From the repository root:

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Backend Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Recommended | Use `development` locally and `production` on Netlify |
| `PORT` | No | Local API port; defaults to `3000` |
| `FRONTEND_URL` | Production | Allowed frontend origin and OAuth redirect destination |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs access and refresh tokens |
| `IMAGEKIT_PRIVATE_KEY` | Yes | Server-side ImageKit authentication |
| `IMAGEKIT_PUBLIC_KEY` | Yes | ImageKit account identifier |
| `IMAGEKIT_URL_ENDPOINT` | Yes | ImageKit delivery URL |
| `CLIENT_ID` | Yes | Google OAuth client ID |
| `CLIENT_SECRET` | Yes | Google OAuth client secret |
| `REFRESH_TOKEN` | Yes | Currently validated by configuration for Google/Gmail integration |
| `EMAIL_USER` | Yes | Gmail sender account |
| `EMAIL_PASS` | Yes | Gmail app password |
| `GOOGLE_CALLBACK_URL_USER` | OAuth | Customer OAuth callback |
| `GOOGLE_CALLBACK_URL_PARTNER` | OAuth | Partner OAuth callback |
| `RAZORPAY_KEY_ID` | Payments | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay signing secret |
| `OPENROUTE_API_KEY` | Directions | OpenRouteService API key |
| `GEMINI_API_KEY` | Yes | Gemini chatbot authentication |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` |

## Frontend Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL; use `http://localhost:3000/api` locally and `/api` on Netlify |
| `VITE_RAZORPAY_KEY` | Optional fallback key; the backend normally returns the key during payment initiation |

## Start Development Servers

Terminal 1:

```bash
npm run dev --prefix backend
```

Terminal 2:

```bash
npm run dev --prefix frontend
```

Check:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`

## External Service Setup

### Google OAuth

Create a Google OAuth web client and register:

```text
http://localhost:3000/api/auth/user/google/callback
http://localhost:3000/api/auth/partner/google/callback
```

Add the Netlify equivalents before production deployment.

### Gmail

Enable two-step verification, create an app password, then use the Gmail address and app password as `EMAIL_USER` and `EMAIL_PASS`.

### MongoDB

The Store model uses a `2dsphere` index. MongoDB creates it from the Mongoose schema. Atlas is recommended for Netlify because local databases are not reachable from cloud functions.

### ImageKit

Uploads are received in memory, temporarily written under the operating system temp directory, streamed to ImageKit, and removed afterward.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install backend and frontend lockfile dependencies |
| `npm run dev --prefix backend` | Start the API with Nodemon |
| `npm start --prefix backend` | Start the API with Node |
| `npm run seed:sample --prefix backend` | Upsert marked sample restaurants and menu items |
| `npm run dev --prefix frontend` | Start Vite development mode |
| `npm run build --prefix frontend` | Create a production frontend build |
| `npm run lint --prefix frontend` | Run frontend ESLint |

The repository does not currently include an automated test suite.
