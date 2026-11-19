import express from "express";
import * as storeController from "../controllers/store.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload, { validateUploadLimits } from "../middlewares/multer.middleware.js";
import { cachePublic } from "../middlewares/cache.middleware.js";
import {
  validateCreateStore,
  validateUpdateStore,
} from "../validators/store.validator.js";

const router = express.Router();

// ── PUBLIC ROUTES ────────────────────────────────────────────
router.get("/", cachePublic(30, 120), storeController.getAllStores);
router.get("/:id/menu", cachePublic(30, 120), storeController.getStoreMenu);
router.get("/:id", cachePublic(30, 120), storeController.getStoreById);

// ── PARTNER ROUTES ───────────────────────────────────────────
// Self-heal: lets partners fetch their own store without knowing its ID
router.get("/partner/my-store", authMiddleware.authPartner, storeController.getMyStore);
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
  upload.single("image"),
  validateUploadLimits,
  storeController.uploadStoreImage,
);

export default router;
