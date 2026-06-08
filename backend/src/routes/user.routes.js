import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware.authAny, userController.getProfile);
router.put(
  "/profile",
  authMiddleware.authAny,
  userController.updateProfile,
);
router.post(
  "/profile/avatar",
  authMiddleware.authAny,
  upload.single("avatar"),
  userController.uploadAvatar,
);
router.delete(
  "/profile",
  authMiddleware.authAny,
  userController.deleteAccount,
);

export default router;
