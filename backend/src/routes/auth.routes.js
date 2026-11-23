import express from "express";
import passport from "../config/passport.js";
import * as authController from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  validateUserRegister,
  validatePartnerRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyEmail,
  validateResetPassword,
} from "../validators/auth.validator.js";

const router = express.Router();

// ── STANDARD AUTH ────────────────────────────────────────────
router.post(
  "/user/register",
  authLimiter,
  validateUserRegister,
  authController.registerUser,
);
router.post(
  "/partner/register",
  authLimiter,
  validatePartnerRegister,
  authController.registerPartner,
);
router.post(
  "/user/verify-email",
  authLimiter,
  validateVerifyEmail,
  authController.verifyEmail,
);
router.post(
  "/partner/verify-email",
  authLimiter,
  validateVerifyEmail,
  authController.verifyEmail,
);
router.post("/user/login", authLimiter, validateLogin, authController.login);
router.post("/partner/login", authLimiter, validateLogin, authController.login);
router.post("/logout", authController.logout);

// ── GOOGLE OAuth ─────────────────────────────────────────────
router.get(
  "/user/google",
  passport.authenticate("google-user", { scope: ["profile", "email"] }),
);
router.get(
  "/partner/google",
  passport.authenticate("google-partner", { scope: ["profile", "email"] }),
);
router.get(
  "/user/google/callback",
  passport.authenticate("google-user", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleAuthCallback,
);
router.get(
  "/partner/google/callback",
  passport.authenticate("google-partner", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleAuthCallback,
);
// Password Reset
router.post(
  "/user/forgot-password",
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);
router.post(
  "/partner/forgot-password",
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);
router.post(
  "/user/reset-password",
  authLimiter,
  validateResetPassword,
  authController.resetPassword,
);
router.post(
  "/partner/reset-password",
  authLimiter,
  validateResetPassword,
  authController.resetPassword,
);
router.post("/refresh", authController.refreshToken);

export default router;
