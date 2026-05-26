import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import config from "./config/config.js";
import storeRouter from "./routes/store.routes.js";


const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api/food", foodRouter);
app.use("/api/store", storeRouter);

export default app;
