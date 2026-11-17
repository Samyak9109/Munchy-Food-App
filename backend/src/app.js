import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import config from "./config/config.js";
import passport from "./config/passport.js";

// routes
import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import storeRouter from "./routes/store.routes.js";
import userRouter from "./routes/user.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";
import reelRouter from "./routes/reel.routes.js";
import favoriteRouter from "./routes/favorite.routes.js";
import mapRouter from "./routes/map.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
// import chatbotRouter from "./routes/chatbot.routes.js"; // Removed AI feature

// middlewares
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import {
  authLimiter,
  generalLimiter,
} from "./middlewares/rateLimit.middleware.js";

const app = express();

app.set("trust proxy", 1);

// ── CORE MIDDLEWARES ─────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

const allowedOrigins = config.CORS_ORIGINS.length > 0
  ? config.CORS_ORIGINS
  : [config.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── WEBHOOK ROUTE (before express.json for raw body) ─────────
import { handleRazorpayWebhook } from "./controllers/webhook.controller.js";
app.use("/api/payment/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(passport.initialize());

// ── HEALTH CHECK (before rate limiter) ────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Munchy API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    await mongoose.default.connection.db.admin().ping();
    res.status(200).json({
      status: "ok",
      message: "Database connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(generalLimiter);

// ── ROUTES ───────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/food", foodRouter);
app.use("/api/store", storeRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/reel", reelRouter);
app.use("/api/favorite", favoriteRouter);
app.use("/api/map", mapRouter);
app.use("/api/dashboard", dashboardRouter);
// app.use("/api/chatbot", chatbotRouter); // Removed AI feature

// ── ERROR HANDLING ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
