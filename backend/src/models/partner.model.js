import mongoose from "mongoose";

const foodPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "partner",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // stores this partner owns
    stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
  },
  { timestamps: true },
);

const partnerModel = mongoose.model("FoodPartner", foodPartnerSchema);

export default partnerModel;
