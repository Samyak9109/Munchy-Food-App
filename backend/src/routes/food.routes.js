import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as foodController from "../controllers/food.controller.js";
import upload from "../middlewares/multer.middleware.js"; 
import { validateCreateFood } from "../validators/food.validator.js"; 

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", foodController.getFoodItem);
router.get("/feed", authMiddleware.authCustomer, foodController.getFoodItem);
router.get("/category/:category", foodController.getFoodByCategory);
router.get("/:id", foodController.getFoodById);

// ── PARTNER ROUTES ───────────────────────────────────────────
router.post(
  "/addFood",
  authMiddleware.authPartner, 
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validateCreateFood,
  foodController.createFood,
);

router.put("/:id", authMiddleware.authPartner, foodController.updateFood);

router.delete("/:id", authMiddleware.authPartner, foodController.deleteFood);

router.patch(
  "/:id/availability",
  authMiddleware.authPartner,
  foodController.toggleAvailability,
);

export default router;
