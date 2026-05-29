import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport"; // Missing import

import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import storeRouter from "./routes/store.routes.js";
import userRouter from "./routes/user.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";
import reelRouter from "./routes/review.routes.js";
import favoriteRouter from "./routes/favorite.routes.js";
import mapRouter from "./routes/map.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
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

import chatbotRouter from "./routes/chatbot.routes.js";
app.use("/api/chatbot", chatbotRouter);
export default app;
