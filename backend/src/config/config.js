import dotenv from "dotenv";

dotenv.config();

/*
  Helper function:
  Checks whether an environment variable exists.
  Throws a clear error during server startup if missing.
*/
function requireEnv(variableName) {
  if (!process.env[variableName]) {
    throw new Error(
      `Environment variable "${variableName}" is missing in .env file`,
    );
  }

  return process.env[variableName];
}

const config = {
  // ===== Server =====
  PORT: Number(process.env.PORT) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  // ===== Database =====
  MONGO_URI: requireEnv("MONGO_URI"),

  // ===== Authentication =====
  JWT_SECRET: requireEnv("JWT_SECRET"),

  // ===== ImageKit =====
  IMAGEKIT_PRIVATE_KEY: requireEnv("IMAGEKIT_PRIVATE_KEY"),
  IMAGEKIT_PUBLIC_KEY: requireEnv("IMAGEKIT_PUBLIC_KEY"),
  IMAGEKIT_URL_ENDPOINT: requireEnv("IMAGEKIT_URL_ENDPOINT"),

  // ===== OAuth / Google / External Services =====
  CLIENT_ID: requireEnv("CLIENT_ID"),
  CLIENT_SECRET: requireEnv("CLIENT_SECRET"),
  REFRESH_TOKEN: requireEnv("REFRESH_TOKEN"),
  GOOGLE_CALLBACK_URL_USER: process.env.GOOGLE_CALLBACK_URL_USER,
  GOOGLE_CALLBACK_URL_PARTNER: process.env.GOOGLE_CALLBACK_URL_PARTNER,

  // ===== Email (Gmail API over HTTPS) =====
  EMAIL_USER: requireEnv("EMAIL_USER"),
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // ===== Payment =====
  RAZORPAY_KEY_ID: requireEnv("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: requireEnv("RAZORPAY_KEY_SECRET"),
  RAZORPAY_WEBHOOK_SECRET: requireEnv("RAZORPAY_WEBHOOK_SECRET"),

  // ===== Routing / Geocoding =====
  OPENROUTE_API_KEY: requireEnv("OPENROUTE_API_KEY"),

  // ===== AI ===== (Removed - pure MERN stack)
  // GEMINI_API_KEY: requireEnv("GEMINI_API_KEY"),
  // GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",

  // ===== Business Logic =====
  TAX_RATE: Number(process.env.TAX_RATE) || 0.05,

  // ===== CORS =====
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [],
};

export default config;
