import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ reel: 1, user: 1 }, { unique: true });

const likeModel = mongoose.model("Like", likeSchema);

export default like;
