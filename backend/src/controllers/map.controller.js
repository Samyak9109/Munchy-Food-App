import { getNearbyStoresDAO } from "../dao/map.dao.js";
import { getStoreByIdDAO } from "../dao/store.dao.js";
import {
  getDirections,
  geocodeSearch as geocodeSearchService,
} from "../services/map.service.js";

// ── GEOCODE SEARCH ───────────────────────────────────────────
export const geocodeSearch = async (req, res) => {
  const { q } = req.query;

  // Input validation: 2–100 characters
  if (!q || q.trim().length < 2 || q.trim().length > 100) {
    return res.status(400).json({
      message: "Query must be between 2 and 100 characters",
      results: [],
    });
  }

  try {
    const results = await geocodeSearchService(q.trim());
    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ message: error.message, results: [] });
  }
};

// ── GET NEARBY STORES ────────────────────────────────────────
export const getNearbyStores = async (req, res) => {
  const { lat, lng } = req.query;

  // Validate lat/lng are real numbers
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (
    lat === undefined ||
    lng === undefined ||
    isNaN(parsedLat) ||
    isNaN(parsedLng)
  ) {
    return res
      .status(400)
      .json({ message: "lat and lng must be valid numbers" });
  }

  const radius = parseFloat(req.query.radius) || 5;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    30,
    Math.max(1, parseInt(req.query.limit, 10) || 20),
  );

  try {
    const stores = await getNearbyStoresDAO(
      parsedLng,
      parsedLat,
      radius,
      page,
      limit,
    );

    return res.status(200).json({
      stores,
      total: stores.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching nearby stores", error: error.message });
  }
};

// ── GET DIRECTIONS TO STORE ──────────────────────────────────
export const getDirectionsToStore = async (req, res) => {
  const { userLat, userLng, profile = "driving-car" } = req.query;
  const { storeId } = req.params;

  try {
    if (!userLat || !userLng) {
      return res
        .status(400)
        .json({ message: "User coordinates are required" });
    }

    const store = await getStoreByIdDAO(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (!store.location?.coordinates?.length) {
      return res.status(400).json({ message: "Store location not set" });
    }

    const [storeLng, storeLat] = store.location.coordinates;

    let directions = null;
    try {
      directions = await getDirections(
        userLng,
        userLat,
        storeLng,
        storeLat,
        profile,
      );
    } catch {
      // ORS failure — return gracefully so the page is still usable
      return res.status(200).json({
        store: { name: store.name, address: store.address },
        directions: null,
        message: "Routing unavailable",
      });
    }

    return res.status(200).json({
      store: { name: store.name, address: store.address },
      directions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching directions", error: error.message });
  }
};
