// catches any error passed via next(error) from any controller
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`,
    });
  }

  // jwt error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  // jwt expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  // default error
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};

// catches requests to routes that don't exist
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
