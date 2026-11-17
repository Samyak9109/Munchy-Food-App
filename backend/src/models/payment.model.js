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
      unique: true, // One payment per order
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: ["online", "cash"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },

    // Razorpay fields
    gatewayOrderId: {
      type: String,
      default: null,
    },

    gatewayPaymentId: {
      type: String,
      default: null,
    },

    // For refunds
    refundId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast lookups
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, status: 1 });

const paymentModel = mongoose.model("Payment", paymentSchema);

export default paymentModel;
