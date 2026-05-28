import express from "express";
import * as mapController from "../controllers/map.controller.js";

const router = express.Router();

// public routes — no auth needed
// frontend sends user coordinates from browser GPS
router.get("/nearby", mapController.getNearbyStores);
router.get("/directions/:storeId", mapController.getDirectionsToStore);

export default router;
