import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as orderController from "../controllers/order.controller.js";

const router = express.Router();

// ── USER ROUTES ──────────────────────────────────────────────
router.post("/place", authMiddleware.authCustomer, orderController.placeOrder);

router.get("/", authMiddleware.authCustomer, orderController.getOrders);

router.get("/:id", authMiddleware.authCustomer, orderController.getOrderById);

router.patch(
  "/:id/cancel",
  authMiddleware.authCustomer,
  orderController.cancelOrder,
);

// ── PARTNER ROUTES ───────────────────────────────────────────
router.get(
  "/store/:storeId",
  authMiddleware.authPartner,
  orderController.getStoreOrders,
);

router.patch(
  "/partner/:id/status",
  authMiddleware.authPartner,
  orderController.updateStatus,
);

router.patch(
  "/partner/:id/verify",
  authMiddleware.authPartner,
  orderController.verifyPickupOTP,
);

export default router;
