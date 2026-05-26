import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import storeRouter from "./routes/store.routes.js";
import userRouter from "./routes/user.routes.js";


const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api/food", foodRouter);
app.use("/api/store", storeRouter);
app.use("/api/user", userRouter);
export default app;
