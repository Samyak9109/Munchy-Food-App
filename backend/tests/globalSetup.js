import { MongoMemoryServer } from "mongodb-memory-server";

// Vitest global setup: start the in-memory MongoDB and set required env
// vars BEFORE test modules load, because config.js calls requireEnv() at
// import time (server startup would otherwise throw).
let mongoServer;

export default async function () {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  globalThis.__MONGO_URI__ = uri;

  // Provide all env vars config.js requires so the app boots in tests.
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-32-chars-long!!";
  process.env.RAZORPAY_KEY_ID = "rzp_test_dummykey";
  process.env.RAZORPAY_KEY_SECRET = "test_razorpay_secret_key_32_char";
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret_key_32_char";
  process.env.IMAGEKIT_PRIVATE_KEY = "test_ik_private";
  process.env.IMAGEKIT_PUBLIC_KEY = "test_ik_public";
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";
  process.env.CLIENT_ID = "test_client_id";
  process.env.CLIENT_SECRET = "test_client_secret";
  process.env.REFRESH_TOKEN = "test_refresh_token";
  process.env.EMAIL_USER = "test@example.com";
  process.env.EMAIL_PASS = "testpass";
  process.env.OPENROUTE_API_KEY = "test_openroute";
}

export async function teardown() {
  if (mongoServer) await mongoServer.stop();
}