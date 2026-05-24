import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["register", "resetPassword", "orderPickup"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const OTPModel = mongoose.model("OTP", otpSchema);

export default OTPModel;
