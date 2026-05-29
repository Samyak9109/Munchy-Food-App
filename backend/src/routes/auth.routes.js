import express from "express";
import passport from "../config/passport.js";
import * as authController from "../controllers/auth.controller.js";
import {
  validateUserRegister,
  validatePartnerRegister,
  validateLogin,
  validateForgotPassword,
} from "../validators/auth.validator.js";

const router = express.Router();

// ── STANDARD AUTH ────────────────────────────────────────────
router.post(
  "/user/register",
  validateUserRegister,
  authController.registerUser,
);
router.post(
  "/partner/register",
  validatePartnerRegister,
  authController.registerPartner,
);
router.post("/user/verify-email", authController.verifyEmail);
router.post("/partner/verify-email", authController.verifyEmail);
router.post("/user/login", validateLogin, authController.login);
router.post("/partner/login", validateLogin, authController.login);
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
  validateForgotPassword,
  authController.forgotPassword,
);
router.post(
  "/partner/forgot-password",
  validateForgotPassword,
  authController.forgotPassword,
);
router.post("/user/reset-password", authController.resetPassword);
router.post("/partner/reset-password", authController.resetPassword);

export default router;
