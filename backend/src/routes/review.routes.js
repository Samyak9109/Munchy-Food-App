import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as reviewController from "../controllers/review.controller.js";

const router = express.Router();

// public routes
router.get("/food/:foodId", reviewController.getFoodReviews);
router.get("/store/:storeId", reviewController.getStoreReviews);

// user routes
router.post("/", authMiddleware.authCustomer, reviewController.addReview);
router.delete(
  "/:id",
  authMiddleware.authCustomer,
  reviewController.deleteReview,
);

export default router;
