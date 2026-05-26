import express from "express";
import * as storeController from "../controllers/store.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  validateCreateStore,
  validateUpdateStore,
} from "../validators/store.validator.js";

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", storeController.getAllStores);
router.get("/:id", storeController.getStoreById);
router.get("/:id/menu", storeController.getStoreMenu);

// ── PARTNER ROUTES ───────────────────────────────────────────
router.post(
  "/",
  authMiddleware.authPartner,
  validateCreateStore,
  storeController.createStore,
);

router.put(
  "/:id",
  authMiddleware.authPartner,
  validateUpdateStore,
  storeController.updateStore,
);

router.delete("/:id", authMiddleware.authPartner, storeController.deleteStore);

router.patch(
  "/:id/status",
  authMiddleware.authPartner,
  storeController.toggleStoreStatus,
);

router.post(
  "/:id/image",
  authMiddleware.authPartner,
  upload.single("image"), // single image upload
  storeController.uploadStoreImage,
);

export default router;
