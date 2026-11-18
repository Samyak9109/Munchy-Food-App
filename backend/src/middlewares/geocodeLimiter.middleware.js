import rateLimit from "express-rate-limit";

// Geocoding is the most expensive map call (external API). Cap it per user
// so a single client cannot burn the OpenRouteService free quota.
export const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many geocode requests. Please try again shortly." },
});

export default geocodeLimiter;