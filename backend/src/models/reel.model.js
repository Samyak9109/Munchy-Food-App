import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    video: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      trim: true,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

reelSchema.index({ createdAt: -1 });
reelSchema.index({ store: 1, createdAt: -1 });

const reelModel = mongoose.model("Reel", reelSchema);

export default reelModel;
