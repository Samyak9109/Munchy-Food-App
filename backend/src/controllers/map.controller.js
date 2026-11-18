import { getNearbyStoresDAO } from "../dao/map.dao.js";
import { getStoreByIdDAO } from "../dao/store.dao.js";
import { getDirections } from "../services/map.service.js";
import config from "../config/config.js";

// ── GEOCODE SEARCH ───────────────────────────────────────────
export const geocodeSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: "Query too short", results: [] });
  }
  try {
    // Use OpenRouteService geocoding
    const url = `https://api.openrouteservice.org/geocode/search?text=${encodeURIComponent(q.trim())}&size=5`;
    const response = await fetch(url, {
      headers: { Authorization: config.OPENROUTE_API_KEY },
    });
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    const results = (data.features || []).map((f) => ({
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ message: "Geocoding error", results: [] });
  }
};

// ── GET NEARBY STORES ────────────────────────────────────────
export const getNearbyStores = async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  try {
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const stores = await getNearbyStoresDAO(lng, lat, parseFloat(radius));

    return res.status(200).json({
      message: `Found ${stores.length} stores nearby`,
      stores,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching nearby stores", error: error.message });
  }
};

// ── GET DIRECTIONS TO STORE ──────────────────────────────────
export const getDirectionsToStore = async (req, res) => {
  const { userLat, userLng } = req.query;
  const { storeId } = req.params;

  try {
    if (!userLat || !userLng) {
      return res.status(400).json({ message: "User coordinates are required" });
    }

    const store = await getStoreByIdDAO(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (!store.location?.coordinates?.length) {
      return res.status(400).json({ message: "Store location not set" });
    }

    const [storeLng, storeLat] = store.location.coordinates;

    const directions = await getDirections(
      userLng,
      userLat,
      storeLng,
      storeLat,
    );

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
