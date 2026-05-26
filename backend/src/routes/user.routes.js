import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", authMiddleware.authCustomer, userController.getProfile);
router.put(
  "/profile",
  authMiddleware.authCustomer,
  userController.updateProfile,
);
router.delete(
  "/profile",
  authMiddleware.authCustomer,
  userController.deleteAccount,
);

export default router;
