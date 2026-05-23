// database.js
const mongoose = require("mongoose");
const config = require("./config");
const dns = require("dns");

async function connectDB() {
  // Force Google DNS — system DNS (router) can't resolve MongoDB SRV records
  dns.setServers(["8.8.8.8", "8.8.4.4"]);

  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to MongoDB ✅");
  } catch (err) {
    console.error("Error connecting to MongoDB ❌", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;