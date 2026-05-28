import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import storeRouter from "./routes/store.routes.js";
import userRouter from "./routes/user.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";
import reelRouter from "./routes/reel.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api/food", foodRouter);
app.use("/api/store", storeRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/reel", reelRouter);



import reviewRouter from "./routes/review.routes.js";
app.use("/api/review", reviewRouter);

export default app;