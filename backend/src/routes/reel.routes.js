import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as reelController from "../controllers/reel.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", reelController.getAllReels);
router.get("/store/:storeId", reelController.getReelsByStore);
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
  upload.single("video"),
  reelController.createReel,
);

router.delete("/:id", authMiddleware.authPartner, reelController.deleteReel);

export default router;
