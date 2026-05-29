import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snacks", "drinks", "desserts"],
    },

    image: {
      type: String,
      required: true,
    },

    video: {
      type: String,
    },

    // Which food partner owns this item
    foodPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodPartner",
      required: true,
    },

    // Toggle to hide item without deleting it
    isAvailable: {
      type: Boolean,
      default: true,
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }, // adds createdAt and updatedAt
);

const foodModel = mongoose.model("Food", foodSchema);

export default foodModel;
