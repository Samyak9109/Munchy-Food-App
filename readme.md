# Munchy

Munchy is a full-stack food discovery and self-pickup platform. Customers discover dishes through short-form video reels, find nearby kitchens, receive AI-assisted recommendations, place orders, pay online or at pickup, and collect food using a secure OTP. Food partners manage their kitchen, menu, reels, orders, and sales analytics from a separate dashboard.

## Features

### Customer experience

- Email/password registration and login for customers
- Email OTP verification and password reset
- Google OAuth sign-in
- Role-protected customer and partner applications
- Vertical food reel feed with view tracking
- Reel likes, comments, and comment deletion
- Add food to the cart directly from reels or recommendations
- Browse and search kitchens
- Filter open, top-rated, and favorite kitchens
- Save and remove favorite kitchens
- View kitchen details and category-filtered menus
- Discover nearby kitchens using geospatial coordinates
- Request driving distance and time through OpenRouteService
- AI mood chatbot powered by Gemini and LangChain
- Database-grounded food recommendations with quick mood prompts
- Single-kitchen cart with quantity updates, removal, and clearing
- Checkout notes and a 5% tax summary
- Razorpay card/UPI checkout
- Cash on pickup
- Order history and live order-status details
- Customer cancellation while an order is placed or confirmed
- Six-digit pickup code and OTP-based handoff
- Food and store reviews
- Profile editing, avatar upload, and account deletion
- Email notifications for verification, order placement, confirmation, readiness, and pickup

### Food partner experience

- Separate partner registration, login, Google OAuth, and password reset
- Create and configure a kitchen with address, coordinates, cuisine, and opening hours
- Upload a kitchen image and toggle open/closed status
- Create, edit, delete, and enable/disable menu items
- Upload food images and optional videos through ImageKit
- Publish and delete food reels
- View active, ready, completed, and cancelled orders
- Move orders through `placed -> confirmed -> ready`
- Verify the customer's pickup OTP to complete an order
- Partner profile and avatar management
- Daily, weekly, and monthly revenue analytics
- Order totals, average order value, top-selling items, growth, rush hours, and status breakdown

### Platform and security

- REST API built with Express and MongoDB
- JWT access tokens and database-backed refresh sessions
- HTTP-only refresh-token cookies
- User/partner role authorization
- Request validation, rate limiting, centralized error handling, and upload middleware
- ImageKit media storage
- MongoDB geospatial indexing
- Health endpoint at `/api/health`
- Netlify SPA hosting and Express API deployment through Netlify Functions

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, TanStack Query, Zustand, Axios |
| Backend | Node.js 22, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JWT, refresh sessions, Passport Google OAuth, bcrypt |
| AI | Gemini via LangChain |
| Media | ImageKit, Multer |
| Payments | Razorpay and cash on pickup |
| Maps | Browser geolocation, MongoDB geospatial queries, OpenRouteService |
| Email | Nodemailer with Gmail |
| Deployment | Netlify, Netlify Functions, MongoDB Atlas |

## Quick Start

### Requirements

- Node.js 22 or newer
- npm
- MongoDB locally or a MongoDB Atlas connection
- Credentials for the enabled external services

### Install

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in both `.env` files. The backend validates required variables during startup.

### Run locally

Open two terminals from the project root:

```bash
npm run dev --prefix backend
```

```bash
npm run dev --prefix frontend
```

Open `http://localhost:5173`. The API runs at `http://localhost:3000/api`, and its health check is `http://localhost:3000/api/health`.

### Use the application

1. Register as a customer or food partner.
2. Enter the six-digit verification code sent by email.
3. Customers can browse reels and kitchens, add dishes to the cart, choose Razorpay or cash, and monitor the pickup order.
4. Partners create a kitchen, add menu items, publish reels, confirm incoming orders, mark them ready, and verify the customer's pickup OTP.
5. Partners can inspect revenue and product performance from the dashboard and analytics pages.

### Load sample restaurants

After setting `MONGO_URI` in `backend/.env`, run:

```bash
npm run seed:sample --prefix backend
```

This idempotently creates three restaurants and twelve menu items. Every seeded restaurant and dish is clearly marked with `(Sample)`. See [docs/sample-data.md](docs/sample-data.md) for the dataset, credentials, and production guard.

## Environment Variables

The complete variable reference is in [docs/getting-started.md](docs/getting-started.md).

Important production values include:

```env
NODE_ENV=production
FRONTEND_URL=https://your-site.netlify.app
MONGO_URI=mongodb+srv://...
GOOGLE_CALLBACK_URL_USER=https://your-site.netlify.app/api/auth/user/google/callback
GOOGLE_CALLBACK_URL_PARTNER=https://your-site.netlify.app/api/auth/partner/google/callback
```

Never commit real secrets or production `.env` files.

## Project Structure

```text
.
|-- backend/
|   |-- netlify/functions/     # Netlify Express entry point
|   |-- src/
|   |   |-- config/            # Database, environment, Passport
|   |   |-- controllers/       # HTTP request handlers
|   |   |-- dao/               # Database access
|   |   |-- middlewares/       # Auth, errors, rate limits, uploads
|   |   |-- models/            # Mongoose schemas
|   |   |-- routes/            # REST API routes
|   |   |-- services/          # AI, email, maps, OTP, storage
|   |   `-- validators/        # Request validation
|   `-- server.js              # Local Node server
|-- frontend/
|   `-- src/
|       |-- api/               # Axios API clients
|       |-- components/        # Shared UI
|       |-- layouts/           # Customer and partner shells
|       |-- pages/             # Auth, customer, and partner screens
|       `-- store/             # Zustand stores
|-- Design/                    # Stitch AI design exports and design system
|-- docs/                      # Project documentation
`-- netlify.toml               # Netlify build and routing configuration
```

## Documentation

- [Documentation index](docs/README.md)
- [Getting started and configuration](docs/getting-started.md)
- [Complete feature guide](docs/features.md)
- [Architecture](docs/architecture.md)
- [Codebase reference](docs/codebase-reference.md)
- [API reference](docs/api-reference.md)
- [Data model](docs/data-model.md)
- [Sample data](docs/sample-data.md)
- [Netlify deployment](docs/deployment.md)

## AI-Assisted Development Disclosure

Munchy was developed with AI-assisted tooling:

- **Claude** and **OpenAI Codex** were used to implement and refine the frontend and to diagnose and resolve bugs.
- **Stitch AI** was used to create the application designs and design system stored in `Design/`.
- This README and the project documentation in `docs/` were created with AI assistance and reviewed against the repository source code.

AI tools assisted development; project ownership and final implementation decisions remain with the project author.

## Author

**Samyak Jain**  
MERN Stack Developer

## License

This project is provided for educational and portfolio use. The backend package currently declares the ISC license.
