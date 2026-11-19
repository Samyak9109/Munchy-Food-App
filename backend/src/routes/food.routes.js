import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as foodController from "../controllers/food.controller.js";
import upload, { validateUploadLimits, throttleVideoUpload } from "../middlewares/multer.middleware.js"; 
import { cachePublic } from "../middlewares/cache.middleware.js";
import { validateCreateFood } from "../validators/food.validator.js"; 

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", cachePublic(30, 120), foodController.getFoodItem);
router.get("/feed", authMiddleware.authCustomer, foodController.getFoodItem);
router.get("/category/:category", cachePublic(30, 120), foodController.getFoodByCategory);
router.get("/:id", cachePublic(30, 120), foodController.getFoodById);

// ── PARTNER ROUTES ───────────────────────────────────────────
router.post(
  "/addFood",
  authMiddleware.authPartner,
  throttleVideoUpload,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validateUploadLimits,
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
