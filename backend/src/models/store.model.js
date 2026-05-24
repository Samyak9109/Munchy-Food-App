import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodPartner",
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

    coordinates: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },

    timing: {
      open: {
        type: String,
      },
      close: {
        type: String,
      },
    },

    isOpen: {
      type: Boolean,
      default: false,
    },
    cuisine: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    role: {
      type: String,
      default: "partner",
    },
  },
  { timestamps: true },
);

const storeModel = mongoose.model("Store", storeSchema);

export default storeModel;
