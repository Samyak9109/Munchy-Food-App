import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as favoriteController from "../controllers/favorite.controller.js";

const router = express.Router();

// all favorite routes require user auth
router.post(
  "/:storeId",
  authMiddleware.authCustomer,
  favoriteController.toggleFavorite,
);
router.get("/", authMiddleware.authCustomer, favoriteController.getFavorites);

export default router;
