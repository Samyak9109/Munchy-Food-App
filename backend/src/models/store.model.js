import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    cuisine: [{ type: String, trim: true }],

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — NOTE: longitude first
        required: true,
      },
    },

    // keep old coordinates for reference
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    timing: {
      open: { type: String },
      close: { type: String },
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

storeSchema.index({ location: "2dsphere" });

export default mongoose.model("Store", storeSchema);
