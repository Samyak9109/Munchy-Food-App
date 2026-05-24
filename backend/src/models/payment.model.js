import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: ["card", "upi", "cash"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    gatewayId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const paymentModel = mongoose.model("Payment", paymentSchema);

export default paymentModel;
