import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as reelController from "../controllers/reel.controller.js";
import upload, { validateUploadLimits, throttleVideoUpload } from "../middlewares/multer.middleware.js";
import { cachePublic } from "../middlewares/cache.middleware.js";

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", authMiddleware.authOptional, cachePublic(15, 60), reelController.getAllReels);
router.get("/store/:storeId", cachePublic(30, 120), reelController.getReelsByStore);
router.get("/:id/comments", reelController.getComments);

// ── USER ROUTES ──────────────────────────────────────────────
router.post(
  "/:id/like",
  authMiddleware.authCustomer,
  reelController.toggleLike,
);

router.post(
  "/:id/comment",
  authMiddleware.authCustomer,
  reelController.addComment,
);

router.delete(
  "/:id/comment/:commentId",
  authMiddleware.authCustomer,
  reelController.deleteComment,
);

router.patch(
  "/:id/view",
  authMiddleware.authCustomer,
  reelController.incrementViews,
);

// ── PARTNER ROUTES ───────────────────────────────────────────
router.post(
  "/",
  authMiddleware.authPartner,
  throttleVideoUpload,
  upload.single("video"),
  validateUploadLimits,
  reelController.createReel,
);

router.delete("/:id", authMiddleware.authPartner, reelController.deleteReel);

export default router;
