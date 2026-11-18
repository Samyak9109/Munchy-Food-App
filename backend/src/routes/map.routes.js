import express from "express";
import * as mapController from "../controllers/map.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import geocodeLimiter from "../middlewares/geocodeLimiter.middleware.js";

const router = express.Router();

// public routes — no auth needed
// frontend sends user coordinates from browser GPS
router.get("/nearby", mapController.getNearbyStores);
router.get("/directions/:storeId", mapController.getDirectionsToStore);

// geocoding — rate-limited per user (it is the most expensive map call)
router.get("/geocode", authMiddleware.authAny, geocodeLimiter, mapController.geocodeSearch);

export default router;