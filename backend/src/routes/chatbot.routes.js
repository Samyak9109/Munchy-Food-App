import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as chatbotController from "../controllers/chatbot.controller.js";

const router = express.Router();

// auth required — personalized recommendations based on user
router.post("/", authMiddleware.authCustomer, chatbotController.chat);

export default router;
