export const cachePublic = (maxAge = 30, swr = 120) => (req, res, next) => {
  if (req.method === "GET") {
    if (req.user || req.partner || req.headers.authorization) {
      res.setHeader(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate",
      );
    } else {
      res.setHeader(
        "Cache-Control",
        `public, max-age=${maxAge}, stale-while-revalidate=${swr}`,
      );
    }
  }
  next();
};

export const cachePrivate = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );
  next();
};

export default { cachePublic, cachePrivate };
