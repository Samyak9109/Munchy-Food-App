import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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
import chatbotRouter from "./routes/chatbot.routes.js";

// middlewares
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import {
  authLimiter,
  generalLimiter,
} from "./middlewares/rateLimit.middleware.js";

const app = express();

// ── CORE MIDDLEWARES ─────────────────────────────────────────
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(generalLimiter);

// ── ROUTES ───────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRouter);
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
app.use("/api/chatbot", chatbotRouter);

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Munchy API is running",
    timestamp: new Date().toISOString(),
  });
});

// ── ERROR HANDLING ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
