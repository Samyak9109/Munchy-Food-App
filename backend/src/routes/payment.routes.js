import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();

// all payment routes require user auth
router.post(
  "/initiate",
  authMiddleware.authCustomer,
  paymentController.initiatePayment,
);
router.post(
  "/verify",
  authMiddleware.authCustomer,
  paymentController.verifyPayment,
);
router.post(
  "/cash",
  authMiddleware.authCustomer,
  paymentController.cashPayment,
);
router.get(
  "/history",
  authMiddleware.authCustomer,
  paymentController.getPaymentHistory,
);

export default router;
