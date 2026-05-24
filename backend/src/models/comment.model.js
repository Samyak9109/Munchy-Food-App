import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
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

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const commentModel = mongoose.model("Comment", commentSchema);

export default commentModel;
