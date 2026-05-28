import config from "../config/config.js";

// get directions from user to store using OpenRouteService
export const getDirections = async (userLng, userLat, storeLng, storeLat) => {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.OPENROUTE_API_KEY,
    },
    body: JSON.stringify({
      coordinates: [
        [parseFloat(userLng), parseFloat(userLat)], // start: user
        [parseFloat(storeLng), parseFloat(storeLat)], // end: store
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch directions");
  }

  const data = await response.json();
  const route = data.routes[0];

  return {
    distance: (route.summary.distance / 1000).toFixed(2), // km
    duration: Math.ceil(route.summary.duration / 60), // minutes
    geometry: route.geometry, // encoded polyline for map
  };
};
