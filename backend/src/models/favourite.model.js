import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// one favorite per user per store
favoriteSchema.index({ user: 1, store: 1 }, { unique: true });
const favoriteModel = mongoose.model("Favorite", favoriteSchema);

export default favoriteModel;
