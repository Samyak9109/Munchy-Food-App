import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as cartController from "../controllers/cart.controller.js";

const router = express.Router();

// all cart routes require user auth
router.get("/", authMiddleware.authCustomer, cartController.getCart);
router.post("/add", authMiddleware.authCustomer, cartController.addToCart);
router.put("/update", authMiddleware.authCustomer, cartController.updateQty);
router.delete(
  "/remove/:foodId",
  authMiddleware.authCustomer,
  cartController.removeItem,
);
router.delete("/clear", authMiddleware.authCustomer, cartController.clearCart);

export default router;
