import dotenv from "dotenv";
import mongoose from "mongoose";
import storeModel from "../src/models/store.model.js";

dotenv.config();

async function fixStoreLocations() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to backend/.env.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...");

  // Find stores where coordinates are [0, 0] or missing
  const brokenStores = await storeModel.find({
    $or: [
      { location: { $exists: false } },
      { "location.coordinates": { $exists: false } },
      { "location.coordinates": { $size: 0 } },
      { "location.coordinates": [0, 0] },
      {
        $and: [
          { "location.coordinates.0": 0 },
          { "location.coordinates.1": 0 },
        ],
      },
    ],
  });

  console.log(`Found ${brokenStores.length} stores needing location fix.`);

  for (const store of brokenStores) {
    store.needsLocation = true;
    await store.save();
    console.log(`Flagged store "${store.name}" (${store._id}) as needsLocation: true`);
  }

  console.log("Store location check complete.");
}

fixStoreLocations()
  .catch((err) => {
    console.error("Error fixing store locations:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
