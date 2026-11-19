import config from "../config/config.js";

// ── LRU Cache (plain Map, max 500 entries, TTL in ms) ────────────────────────
const MAX_CACHE = 500;

class LRUCache {
  constructor() {
    this._map = new Map(); // key → { value, expiresAt }
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return undefined;
    }
    // Refresh insertion order (LRU touch)
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this._map.size >= MAX_CACHE) {
      // Evict the oldest entry (first inserted)
      const firstKey = this._map.keys().next().value;
      this._map.delete(firstKey);
    }
    this._map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const cache = new LRUCache();

const GEOCODE_TTL = 10 * 60 * 1000; // 10 minutes
const DIRECTIONS_TTL = 5 * 60 * 1000; // 5 minutes

// ── Helper: round to 4 decimal places for cache keys ────────────────────────
const round4 = (n) => Math.round(parseFloat(n) * 10000) / 10000;

// ── GEOCODE SEARCH (with LRU cache) ─────────────────────────────────────────
export const geocodeSearch = async (q) => {
  const cacheKey = `geo:${q.trim().toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `https://api.openrouteservice.org/geocode/search?text=${encodeURIComponent(q.trim())}&size=5`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: config.OPENROUTE_API_KEY },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new Error("Geocoding request timed out. Please try again.");
    }
    throw new Error("Geocoding request failed.");
  }

  if (response.status === 429) {
    throw new Error("Geocoding rate limit exceeded. Please wait and retry.");
  }

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  const results = (data.features || []).map((f) => ({
    label: f.properties.label,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  cache.set(cacheKey, results, GEOCODE_TTL);
  return results;
};

// ── POLYLINE DECODER (Google encoded polyline format) ───────────────────────
// ORS geometry uses Google's encoded polyline format with precision 5.
function decodePolyline(encoded) {
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    // ORS returns [lat, lng] in encoded form; GeoJSON wants [lng, lat]
    coords.push([lng / 1e5, lat / 1e5]);
  }

  return coords;
}

// ── GET DIRECTIONS (with LRU cache, profile support, GeoJSON output) ─────────
export const getDirections = async (
  userLng,
  userLat,
  storeLng,
  storeLat,
  profile = "driving-car",
) => {
  const cacheKey = `dir:${round4(userLng)},${round4(userLat)},${round4(storeLng)},${round4(storeLat)},${profile}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const validProfiles = ["driving-car", "foot-walking", "cycling-regular"];
  const safeProfile = validProfiles.includes(profile) ? profile : "driving-car";

  const url = `https://api.openrouteservice.org/v2/directions/${safeProfile}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.OPENROUTE_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [parseFloat(userLng), parseFloat(userLat)],
          [parseFloat(storeLng), parseFloat(storeLat)],
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new Error("Directions request timed out.");
    }
    throw new Error("Directions request failed.");
  }

  if (!response.ok) {
    throw new Error(`Directions service error: ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes[0];

  // Decode the encoded polyline into GeoJSON LineString coordinates
  const coordinates = decodePolyline(route.geometry);

  const result = {
    distanceKm: parseFloat((route.summary.distance / 1000).toFixed(2)),
    durationMin: Math.ceil(route.summary.duration / 60),
    geometry: {
      type: "LineString",
      coordinates, // [[lng, lat], ...]
    },
  };

  cache.set(cacheKey, result, DIRECTIONS_TTL);
  return result;
};
