
import mongoose from "mongoose";
import config from "./config.js";

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(config.MONGO_URI).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
  console.log("Connected to MongoDB");
  return mongoose.connection;
}

export default connectDB;
