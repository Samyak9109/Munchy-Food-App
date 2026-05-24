import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as foodController from "../controllers/food.controller.js";
import upload from "../middlewares/multer.middelware.js";

const router = express.Router();

// upload.fields handles multiple files in one request
router.post("/addFood",
  authMiddleware.authFoodPartner,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  foodController.createFood
);

router.get("/getFoodItem", authMiddleware.authCustomer, foodController.getFoodItem);

export default router; 