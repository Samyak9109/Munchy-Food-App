import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

// all dashboard routes require partner auth
router.get(
  "/:storeId/daily",
  authMiddleware.authPartner,
  dashboardController.getDailyStats,
);
router.get(
  "/:storeId/weekly",
  authMiddleware.authPartner,
  dashboardController.getWeeklyStats,
);
router.get(
  "/:storeId/monthly",
  authMiddleware.authPartner,
  dashboardController.getMonthlyStats,
);
router.get(
  "/:storeId/top-items",
  authMiddleware.authPartner,
  dashboardController.getTopItems,
);
router.get(
  "/:storeId/rush-hours",
  authMiddleware.authPartner,
  dashboardController.getRushHours,
);
router.get(
  "/:storeId/growth",
  authMiddleware.authPartner,
  dashboardController.getGrowth,
);
router.get(
  "/:storeId/breakdown",
  authMiddleware.authPartner,
  dashboardController.getStatusBreakdown,
);

export default router;
