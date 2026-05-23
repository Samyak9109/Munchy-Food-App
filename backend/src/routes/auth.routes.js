import express from "express";
import {
  login,
  logout,
  registerFoodPartner,
  registerUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post('/user/register',    registerUser);
router.post('/partner/register', registerFoodPartner);

// Same controller, role auto-detected from the URL
router.post('/user/login',    login);
router.post('/partner/login', login);

// Single logout — works for both roles
router.post('/logout', logout);

export default router;
