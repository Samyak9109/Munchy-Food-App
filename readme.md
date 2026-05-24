# 🍔 Munchy — Food Discovery & Pickup App

A full-scale food ordering platform built with the MERN stack. Munchy lets users discover food through short video reels, order from local restaurants, and pick up their food themselves — no delivery, no wait.

---

## ✨ Features

### For Users
- 📱 **Reel Feed** — Scroll through short food videos like Instagram
- 🔍 **Discover Food** — Browse by category, cuisine, or store
- 🛒 **Cart & Orders** — Add items, place orders, pick up with OTP verification
- ❤️ **Favorites** — Save your go-to restaurants
- 🗺️ **Map** — Get directions to the restaurant
- 💬 **Reviews** — Rate and review food items
- 🤖 **AI Chatbot** — Get food recommendations based on your mood
- 🔐 **Google OAuth** — Sign in with Google

### For Food Partners
- 🏪 **Store Management** — Set timings, location, cuisine type
- 🍕 **Food Management** — Add/edit/delete food items with video reels
- 📦 **Order Management** — Confirm orders, mark ready, verify pickup OTP
- 📊 **Dashboard Analytics** — Daily/weekly/monthly sales, rush hours, top items
- 🔐 **Google OAuth** — Sign in with Google

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + Google OAuth (Passport.js) |
| File Storage | ImageKit |
| Email | Nodemailer |
| Maps | Google Maps / OpenStreetMap |
| Payment | Razorpay |
| AI Chatbot | TBD |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22+
- MongoDB
- ImageKit account
- Google OAuth credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/munchy.git

# Navigate to backend
cd munchy/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Start development server
npm run dev
```

---

## ⚙️ Environment Variables

```env
PORT=5000
MONGO_URI=
JWT_SECRET=

IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=

EMAIL_USER=
EMAIL_PASS=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

GOOGLE_MAPS_API_KEY=
```

---

## 📁 Project Structure

```
backend/
├── config/
│   └── config.js
├── controllers/
│   ├── auth.controller.js
│   ├── food.controller.js
│   ├── cart.controller.js
│   ├── order.controller.js
│   ├── review.controller.js
│   ├── reel.controller.js
│   ├── payment.controller.js
│   ├── chatbot.controller.js
│   └── map.controller.js
├── dao/
│   ├── food.dao.js
│   ├── cart.dao.js
│   ├── order.dao.js
│   └── ...
├── models/
│   ├── user.model.js
│   ├── partner.model.js
│   ├── food.model.js
│   ├── store.model.js
│   ├── cart.model.js
│   ├── order.model.js
│   ├── payment.model.js
│   ├── review.model.js
│   ├── reel.model.js
│   ├── comment.model.js
│   ├── like.model.js
│   ├── favorite.model.js
│   ├── address.model.js
│   ├── otp.model.js
│   └── session.model.js
├── routes/
│   ├── auth.routes.js
│   ├── food.routes.js
│   └── ...
├── middlewares/
│   ├── auth.middleware.js
│   └── multer.middleware.js
├── validators/
│   ├── food.validator.js
│   └── ...
├── utils/
│   ├── imagekit.js
│   ├── email.util.js
│   └── otp.util.js
└── app.js
```

---

## 🔗 API Overview

| Module | Base Route |
|---|---|
| Auth | `/api/auth` |
| Food | `/api/food` |
| Store | `/api/store` |
| Cart | `/api/cart` |
| Orders | `/api/order` |
| Reviews | `/api/review` |
| Reels | `/api/reel` |
| Payment | `/api/payment` |
| Map | `/api/map` |
| Chatbot | `/api/chatbot` |
| Dashboard | `/api/dashboard` |

---

## 🔄 Order Flow

```
User browses reel feed
  → Adds food to cart
  → Places order
  → Receives pickup OTP via email
  → Pays online or chooses cash
  → Partner confirms order
  → Partner marks food ready
  → User arrives → shows OTP
  → Partner verifies OTP → order complete
```

---

## 📊 Partner Dashboard

- Daily / weekly / monthly revenue
- Most sold items
- Rush hour heatmap
- Order status breakdown
- Growth % vs previous period

---

## 🤖 AI Chatbot

Describe your mood and the chatbot recommends food from nearby restaurants. Powered by AI to understand natural language and suggest relevant dishes.

---

## 👨‍💻 Author

**Samyak Jain**
MERN Stack Developer

---

## 📄 License

This project is for educational and portfolio purposes.